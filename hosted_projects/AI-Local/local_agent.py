import os
import re
import json
import urllib.request
import urllib.error
import subprocess
import sys

# --- CẤU HÌNH AI LOCAL ---
# Bạn cần chạy một Local AI server (như Ollama) ở cổng 11434. 
# Không cần kết nối Internet sau khi đã tải model.
OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
MODEL_NAME = "deepseek-coder:1.3b" # Thay bằng tên model bạn đã tải (vd: qwen2.5-coder:1.5b)

WORKSPACE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "workspace")
MAX_RETRIES = 5  # Số lần AI được phép sửa lỗi tối đa

if not os.path.exists(WORKSPACE_DIR):
    os.makedirs(WORKSPACE_DIR)

def check_and_pull_model(model_name):
    """Kiểm tra xem model đã tồn tại chưa, nếu chưa thì tự động tải về."""
    tags_url = "http://127.0.0.1:11434/api/tags"
    try:
        req = urllib.request.Request(tags_url)
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            models = [m.get("name") for m in result.get("models", [])]
            
            if model_name in models or f"{model_name}:latest" in models:
                print(f"✅ Model '{model_name}' đã sẵn sàng.")
                return True
            else:
                print(f"⚠️ Không tìm thấy model '{model_name}' trong Ollama.")
                print(f"⏳ Đang tự động tải về (vui lòng chờ, quá trình này có thể mất vài phút)...")
                try:
                    # Ưu tiên gọi lệnh hệ thống để có progress bar
                    subprocess.run(["ollama", "pull", model_name], check=True)
                    print(f"\n✅ Đã tải thành công model '{model_name}'.")
                    return True
                except subprocess.CalledProcessError:
                    print(f"\n❌ Lỗi khi tải model '{model_name}'.")
                    return False
                except FileNotFoundError:
                    print("\n⚠️ Không tìm thấy lệnh 'ollama' trên terminal. Thử tải qua API...")
                    pull_url = "http://127.0.0.1:11434/api/pull"
                    # Bật stream=True để theo dõi tiến trình
                    data = {"name": model_name, "stream": True}
                    pull_req = urllib.request.Request(
                        pull_url, 
                        data=json.dumps(data).encode('utf-8'), 
                        headers={'Content-Type': 'application/json'}
                    )
                    try:
                        with urllib.request.urlopen(pull_req) as pull_response:
                            for line in pull_response:
                                if line:
                                    res = json.loads(line.decode('utf-8'))
                                    # Vẽ tiến trình phần trăm (%)
                                    if "total" in res and "completed" in res and res["total"] > 0:
                                        percent = (res["completed"] / res["total"]) * 100
                                        print(f"\r⏳ Tiến trình tải: {percent:.1f}% ", end="")
                            print(f"\n✅ Đã tải thành công model '{model_name}'.")
                        return True
                    except Exception as e:
                        print(f"\n❌ Lỗi khi tải model qua API: {e}")
                        return False
    except urllib.error.URLError as e:
        print(f"\n❌ Lỗi kết nối tới Local AI: {e}")
        print("⚠️ Gợi ý: Bạn đã bật Ollama server chưa? Hãy chạy lệnh 'ollama serve' trong 1 tab Terminal khác.")
        return False

def chat_with_local_ai(messages):
    """Gửi lịch sử hội thoại tới Local LLM và nhận câu trả lời"""
    data = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": False
    }
    req = urllib.request.Request(
        OLLAMA_URL, 
        data=json.dumps(data).encode('utf-8'), 
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['message']['content']
    except urllib.error.URLError as e:
        print(f"\n❌ Lỗi kết nối tới Local AI: {e}")
        print("⚠️ Gợi ý: Bạn đã bật Ollama server chưa? Hãy chạy lệnh 'ollama serve' trong 1 tab Terminal khác.")
        return None

def extract_project_files(text):
    """Trích xuất nhiều file từ cấu trúc ---FILE: path---"""
    files = {}
    parts = text.split("---FILE:")
    for part in parts[1:]:
        if "---" not in part:
            continue
        
        split_part = part.split("---", 1)
        if len(split_part) != 2:
            continue
            
        filepath, remainder = split_part
        filepath = filepath.strip()
        content = remainder.strip()
        
        # Ưu tiên bóc tách code sạch nằm trong khối markdown ```lang ... ```
        pattern = r"```[a-zA-Z0-9-]*\n(.*?)```"
        match = re.search(pattern, content, re.DOTALL)
        if match:
            content = match.group(1).strip()
            
        files[filepath] = content
    return files

def extract_code(text, lang="python"):
    """Trích xuất khối code từ câu trả lời của AI"""
    # Tìm code block bắt đầu bằng ```lang
    pattern = r"```" + lang + r"\n(.*?)\n```"
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1)
    
    if lang == "javascript":
        for alias in ["js", "node", "nodejs"]:
            pattern_alias = r"```" + alias + r"\n(.*?)\n```"
            match_alias = re.search(pattern_alias, text, re.DOTALL | re.IGNORECASE)
            if match_alias:
                return match_alias.group(1)
                
    # Dự phòng: tìm code block chung (chấp nhận mọi tên ngôn ngữ như html, c, cpp...)
    pattern_fallback = r"```[^\n]*\n(.*?)\n```"
    match_fallback = re.search(pattern_fallback, text, re.DOTALL)
    if match_fallback:
        return match_fallback.group(1)
    
    return None

def run_agent(task_prompt, lang="python", ext="py", cmd="python3"):
    if lang == "html":
        sys_prompt = f"Bạn là một AI lập trình viên Web xuất sắc. Nhiệm vụ của bạn là viết code HTML/CSS/JS (gộp chung trong 1 file) giải quyết yêu cầu. Bạn CHỈ trả về đoạn code hoàn chỉnh nằm trong khối ```html\n...\n```, tuyệt đối không giải thích dài dòng."
    elif lang == "project":
        sys_prompt = (
            "Bạn là một AI Software Architect SIÊU CẤP. Nhiệm vụ của bạn là tạo ra một dự án lập trình hoàn chỉnh với đầy đủ cấu trúc nhiều file và thư mục.\n"
            "QUAN TRỌNG NHẤT: BẮT BUỘC mỗi file bạn tạo ra phải được định dạng theo cấu trúc sau:\n\n"
            "---FILE: đường_dẫn_tới_file/tên_file.ext---\n"
            "```ngôn_ngữ\n"
            "// Nội dung code ở đây\n"
            "```\n\n"
            "Bạn có thể tạo bao nhiêu file tùy thích (VD: index.html, css/style.css, js/main.js, package.json, main.py...). "
            "Đảm bảo code đầy đủ, không bỏ dở, dự án có thể chạy được ngay. TUYỆT ĐỐI KHÔNG giải thích dài dòng hay viết văn bản linh tinh bên ngoài cấu trúc trên."
        )
    else:
        sys_prompt = f"Bạn là một AI lập trình viên xuất sắc. Nhiệm vụ của bạn là viết code {lang.capitalize()} giải quyết yêu cầu. Bạn CHỈ trả về code nằm trong khối ```{lang}\n...\n```, tuyệt đối không giải thích dài dòng."
    messages = [
        {
            "role": "system", 
            "content": sys_prompt
        }
    ]
    
    messages.append({"role": "user", "content": task_prompt})
    
    for attempt in range(MAX_RETRIES):
        print(f"\n🔄 [Vòng {attempt + 1}/{MAX_RETRIES}] AI đang suy nghĩ và viết code...")
        ai_response = chat_with_local_ai(messages)
        
        if not ai_response:
            break
            
        messages.append({"role": "assistant", "content": ai_response})
        
        if lang == "project":
            files = extract_project_files(ai_response)
            if not files:
                print("⚠️ AI không trả về định dạng project hợp lệ. Đang yêu cầu thử lại...")
                messages.append({"role": "user", "content": "Bạn chưa cung cấp file nào theo chuẩn ---FILE: đường_dẫn---. Hãy viết lại toàn bộ cấu trúc dự án."})
                continue
                
            print(f"📁 Đã tìm thấy {len(files)} files. Đang khởi tạo cấu trúc dự án...")
            for filepath, content in files.items():
                safe_filepath = filepath.lstrip("/\\")
                full_path = os.path.join(WORKSPACE_DIR, safe_filepath)
                
                # Bảo mật: Đảm bảo đường dẫn file không bị AI tạo vượt ra khỏi thư mục WORKSPACE
                if not os.path.abspath(full_path).startswith(os.path.abspath(WORKSPACE_DIR)):
                    print(f"⚠️ Bỏ qua file không an toàn: {filepath}")
                    continue
                
                # Tự động tạo cây thư mục nếu chưa có
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"  └─ 📄 {safe_filepath}")
            
            print(f"\n✅ TẠO DỰ ÁN THÀNH CÔNG! Source code đã được lưu tại: {WORKSPACE_DIR}")
            
            # Gợi ý chạy dự án và tự cài đặt thư viện liên quan
            if "package.json" in files:
                print("\n📦 Đang tự động cài đặt thư viện Node.js (npm install)...")
                subprocess.run(["npm", "install"], cwd=WORKSPACE_DIR)
                print("▶️ Gợi ý chạy: cd workspace && npm start (hoặc node <file_chính.js>)")
            elif "requirements.txt" in files:
                print("\n📦 Đang tự động cài đặt thư viện Python (pip install)...")
                subprocess.run(["python3", "-m", "pip", "install", "-r", "requirements.txt"], cwd=WORKSPACE_DIR)
                print("▶️ Gợi ý chạy: cd workspace && python3 main.py")
            elif "index.html" in files:
                print("\n▶️ Gợi ý: Hãy mở file workspace/index.html trên trình duyệt để xem kết quả!")
            break # Dừng lại vì dự án đã thành công
            
        code = extract_code(ai_response, lang)
        if not code:
            print("⚠️ AI không trả về định dạng code hợp lệ. Đang yêu cầu thử lại...")
            messages.append({"role": "user", "content": f"Bạn chưa cung cấp code. Hãy viết lại và bọc nó trong ```{lang}\n...\n```."})
            continue
            
        script_path = os.path.join(WORKSPACE_DIR, f"index.{ext}")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(code)
            
        if not cmd:
            print(f"💾 Đã lưu code vào '{script_path}'.")
            print("✅ Vì đây là file Web (HTML), hệ thống sẽ không tự chạy trên Terminal. Vui lòng mở file bằng trình duyệt để xem thành quả!")
            break
            
        print(f"💾 Đã lưu code vào '{script_path}'. Đang chạy thử...")
        
        # Chạy code bằng subprocess
        run_success = False
        for run_attempt in range(3): # Cho phép tự động cài tối đa 3 thư viện liên tiếp
            try:
                result = subprocess.run([cmd, script_path], capture_output=True, text=True, timeout=10, cwd=WORKSPACE_DIR)
                
                if result.returncode == 0:
                    print(f"\n✅ CHẠY THÀNH CÔNG!\n[Kết quả Output]:\n{result.stdout.strip()}")
                    run_success = True
                    break
                else:
                    error_msg = result.stderr.strip() or result.stdout.strip()
                    
                    # Bắt lỗi thiếu thư viện và tự động cài đặt
                    if cmd == "python3":
                        match = re.search(r"ModuleNotFoundError: No module named '([^']+)'", error_msg)
                        if match:
                            module_name = match.group(1)
                            print(f"\n📦 Phát hiện thiếu thư viện '{module_name}'. Đang tự động cài đặt (pip)...")
                            pip_result = subprocess.run(["python3", "-m", "pip", "install", module_name], capture_output=True, text=True, cwd=WORKSPACE_DIR)
                            if pip_result.returncode == 0:
                                print(f"✅ Cài đặt '{module_name}' thành công! Đang chạy lại code...")
                                continue # Quay lại đầu vòng lặp để chạy lại code
                            else:
                                print(f"❌ Cài đặt thất bại. Sẽ báo lỗi cho AI xử lý.")
                    elif cmd == "node":
                        match = re.search(r"Cannot find module '([^']+)'", error_msg)
                        if match:
                            module_name = match.group(1)
                            print(f"\n📦 Phát hiện thiếu module '{module_name}'. Đang tự động cài đặt (npm)...")
                            npm_result = subprocess.run(["npm", "install", module_name], capture_output=True, text=True, cwd=WORKSPACE_DIR)
                            if npm_result.returncode == 0:
                                print(f"✅ Cài đặt '{module_name}' thành công! Đang chạy lại code...")
                                continue
                            else:
                                print(f"❌ Cài đặt thất bại. Sẽ báo lỗi cho AI xử lý.")
                    
                    print(f"\n❌ CODE CÓ LỖI:\n{error_msg}")
                    messages.append({"role": "user", "content": f"Code của bạn chạy bị lỗi sau:\n```text\n{error_msg}\n```\nHãy viết lại toàn bộ file code đã được sửa lỗi."})
                    break # Thoát vòng lặp chạy code để AI suy nghĩ lại
            except subprocess.TimeoutExpired:
                print("\n⏳ Code bị treo hoặc chạy quá 10 giây (Timeout).")
                messages.append({"role": "user", "content": "Code chạy quá lâu (bị treo). Có thể do vòng lặp vô hạn. Hãy sửa lại."})
                break
                
        if run_success:
            break
    else:
        print(f"\n⚠️ Đã thử {MAX_RETRIES} lần nhưng AI không thể fix lỗi thành công.")

if __name__ == "__main__":
    print("="*60)
    print("🚀 LOCAL AI AUTONOMOUS CODER (NO INTERNET)")
    print("="*60)
    
    print("\n💡 Danh sách model từ nhẹ đến nặng (S20+ RAM 8GB-12GB chạy tốt model < 4B):")
    models_list = [
        "qwen2.5:0.5b",
        "qwen2.5-coder:1.5b",
        "deepseek-coder:1.3b",
        "llama3.2:1b",
        "phi3:mini",
        "gemma2:2b",
        "qwen2.5:3b",
        "llama3.2:3b",
        "Tự nhập tên model khác..."
    ]
    for i, model in enumerate(models_list):
        print(f"  {i+1}. {model}")

    user_choice = input(f"\nChọn số tương ứng với model (Nhấn Enter để dùng mặc định '{MODEL_NAME}'): ").strip()
    if user_choice.isdigit():
        idx = int(user_choice) - 1
        if 0 <= idx < len(models_list) - 1:
            MODEL_NAME = models_list[idx]
        elif idx == len(models_list) - 1:
            custom_model = input("Nhập tên model muốn sử dụng: ").strip()
            if custom_model:
                MODEL_NAME = custom_model

    print(f"\n🔍 Đang kiểm tra model '{MODEL_NAME}'...")
    if not check_and_pull_model(MODEL_NAME):
        print("❌ Không thể tiếp tục vì thiếu model.")
        sys.exit(1)
        
    print("\n💻 Chọn ngôn ngữ lập trình:")
    print("  1. Python (mặc định)")
    print("  2. Node.js (JavaScript)")
    print("  3. Web (HTML/CSS/JS chung 1 file)")
    print("  4. Dự Án Lớn (Nhiều file/thư mục - VIP PRO)")
    lang_choice = input("Chọn số: ").strip()
    
    prog_lang = "python"
    prog_ext = "py"
    prog_cmd = "python3"
    
    if lang_choice == "2":
        prog_lang = "javascript"
        prog_ext = "js"
        prog_cmd = "node"
    elif lang_choice == "3":
        prog_lang = "html"
        prog_ext = "html"
        prog_cmd = ""
    elif lang_choice == "4":
        prog_lang = "project"
        prog_ext = ""
        prog_cmd = ""
        
    user_task = input("\nNhập yêu cầu (VD: Viết game caro chạy trên console): ")
    if user_task.strip():
        run_agent(user_task, lang=prog_lang, ext=prog_ext, cmd=prog_cmd)