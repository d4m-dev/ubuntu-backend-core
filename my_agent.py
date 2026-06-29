import os
import sys
import json
import subprocess
import requests
import google.generativeai as genai
import re
from dotenv import load_dotenv

from rich.console import Console
from rich.markdown import Markdown
from rich.live import Live

# ==========================================
# GIAO DIỆN & MÀU SẮC
# ==========================================
class C:
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    MAGENTA = '\033[95m'
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'

IC_SYS = f"{C.BOLD}{C.BLUE}[⚙️ SYSTEM]{C.RESET}"
IC_USR = f"{C.BOLD}{C.GREEN}[👤 d4m-dev]{C.RESET}"
IC_AI  = f"{C.BOLD}{C.MAGENTA}[🧠 AGENT]{C.RESET}"
IC_ERR = f"{C.BOLD}{C.RED}[❌ ERROR]{C.RESET}"
IC_WRN = f"{C.BOLD}{C.YELLOW}[⚠️ WARN]{C.RESET}"

console = Console()

# Biến trạng thái để nhớ lựa chọn Auto-Approve
auto_approve = False

# ==========================================
# KHỞI TẠO MÔI TRƯỜNG
# ==========================================
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OLLAMA_API_BASE = "http://127.0.0.1:11434/api"

ollama_history = []
gemini_chat_session = None

def setup_local_agent_rules():
    for mode in ["skill", "build"]:
        os.makedirs(f".local_agent/{mode}", exist_ok=True)
        rule_path = f".local_agent/{mode}/rule.md"
        if not os.path.exists(rule_path):
            open(rule_path, "w", encoding="utf-8").write(f"# QUY TẮC CHẾ ĐỘ {mode.upper()}\n// Hãy nhập các quy tắc code của bạn vào file này.")

# ==========================================
# HỆ THỐNG AGENT THỰC THI (FILE GHI & APPROVE)
# ==========================================
def extract_and_execute_files(ai_response):
    """
    Quét câu trả lời của AI để tìm thẻ <FILE path="...">...</FILE>
    Và thực hiện việc lưu file với cơ chế hỏi ý kiến (Approve).
    """
    global auto_approve
    
    # Dùng biểu thức chính quy (Regex) để tìm tất cả các thẻ tạo file
    pattern = r'<FILE path=[\'"](.+?)[\'"]>\s*(.*?)\s*</FILE>'
    matches = re.finditer(pattern, ai_response, re.DOTALL)
    
    files_created = 0
    for match in matches:
        file_path = match.group(1).strip()
        file_content = match.group(2)
        
        # Sửa lại đường dẫn nếu nó cố gắng lưu ra ngoài dự án một cách nguy hiểm
        if file_path.startswith('/'):
            file_path = file_path.lstrip('/')
            
        print(f"\n{C.YELLOW}⚠️ Agent muốn TẠO/GHI file: {C.BOLD}{file_path}{C.RESET}")
        
        if not auto_approve:
            while True:
                choice = input(f"{IC_SYS} Cho phép lưu file này không? [y]es / [n]o / [a]uto-approve: ").strip().lower()
                if choice in ['y', 'yes', 'n', 'no', 'a', 'auto']:
                    break
            
            if choice in ['a', 'auto']:
                auto_approve = True
                choice = 'y'
                print(f"{C.GREEN}✅ Đã bật chế độ Tự động xác nhận (Auto-Approve) cho các file tiếp theo!{C.RESET}")
        else:
            choice = 'y'
            print(f"{C.GREEN}✅ Tự động xác nhận (Auto-Approve) đang bật.{C.RESET}")

        if choice in ['y', 'yes']:
            try:
                # Tạo thư mục nếu nó chưa tồn tại
                os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
                # Ghi nội dung vào file
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(file_content)
                print(f"{IC_SYS} Đã ghi thành công: {C.GREEN}{file_path}{C.RESET}")
                files_created += 1
            except Exception as e:
                print(f"{IC_ERR} Lỗi khi ghi file {file_path}: {e}")
        else:
            print(f"{IC_SYS} {C.RED}Đã TỪ CHỐI lưu file.{C.RESET}")
            
    if files_created > 0:
        print() # Dòng trống cho đẹp

def get_agent_system_instruction():
    pwd = os.getcwd()
    proj_name = os.path.basename(pwd)
    try:
        files = [f for f in os.listdir(pwd) if not f.startswith('.')]
        file_tree = ", ".join(files[:20])
    except:
        file_tree = "Không thể đọc cấu trúc."
        
    instruction = f"""Hệ thống: Bạn là một Agent AI lập trình hoạt động trên máy người dùng. 
Dự án hiện tại: '{proj_name}' ({pwd}). Cấu trúc cơ bản: {file_tree}.

QUY TẮC TỐI QUAN TRỌNG VỀ VIỆC TẠO FILE:
Nếu bạn cần cung cấp code cho người dùng, hãy TỰ ĐỘNG LƯU FILE giúp họ thay vì chỉ in ra màn hình.
Để làm điều này, hãy đặt toàn bộ nội dung code của file đó vào bên trong thẻ XML:
<FILE path="đường_dẫn_file/ten_file.py">
nội dung code
</FILE>
Hãy đảm bảo bạn cung cấp đường dẫn file tương đối một cách chính xác."""
    return instruction

def find_file_in_project(file_query):
    if os.path.exists(file_query): return file_query
    base_name = os.path.basename(file_query)
    pwd = os.getcwd()
    ignore_dirs = {'.git', 'node_modules', '__pycache__', 'myenv', 'venv', '.venv', '.local_agent'}
    
    for root, dirs, files in os.walk(pwd):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        if base_name in files: return os.path.join(root, base_name)
    return None

def process_prompt_with_files(prompt):
    words = prompt.split()
    files_to_read = [w[1:] for w in words if w.startswith('@')]
    injected_context = ""
    
    for file_query in files_to_read:
        real_path = find_file_in_project(file_query)
        if real_path:
            try:
                content = open(real_path, 'r', encoding='utf-8').read()
                rel_path = os.path.relpath(real_path)
                injected_context += f"\n{C.DIM}>>> Đã nạp file: {rel_path}{C.RESET}"
                injected_context += f"\n--- NỘI DUNG: {rel_path} ---\n{content}\n--- KẾT THÚC ---\n"
            except Exception as e:
                injected_context += f"\n{C.RED}[Lỗi đọc {real_path}: {e}]{C.RESET}\n"
        else:
            injected_context += f"\n{C.YELLOW}[Không tìm thấy '{file_query}' trong dự án]{C.RESET}\n"

    if files_to_read:
        print(injected_context.split("--- NỘI DUNG")[0])
        prompt = f"{injected_context}\nNgười dùng yêu cầu: {prompt}"
    return prompt

# ==========================================
# AUTO-DETECT MODELS & KHỞI TẠO
# ==========================================
def get_active_ollama_model():
    try:
        if m := requests.get(f"{OLLAMA_API_BASE}/ps", timeout=2).json().get("models"): return m[0]["name"]
        if m := requests.get(f"{OLLAMA_API_BASE}/tags", timeout=2).json().get("models"): return m[0]["name"]
    except requests.exceptions.RequestException: pass
    return None

def get_gemini_models():
    if not GEMINI_API_KEY or GEMINI_API_KEY == "Điền_API_Key_Thật_Của_Bạn_Vào_Đây":
        sys.exit(f"{IC_ERR} Chưa cấu hình GEMINI_API_KEY trong .env!")
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        return [m.name.replace('models/', '') for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
    except Exception as e:
        print(f"{IC_ERR} Lỗi quét Gemini: {e}"); return []

# ==========================================
# STREAMING & EXECUTION
# ==========================================
def init_gemini(model_name):
    global gemini_chat_session
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_chat_session = genai.GenerativeModel(model_name, system_instruction=get_agent_system_instruction()).start_chat(history=[])

def stream_gemini(prompt):
    try:
        response = gemini_chat_session.send_message(prompt, stream=True)
        print(f"\n{IC_AI}")
        full_reply = ""
        
        # Render bằng Markdown
        with Live(Markdown(full_reply), console=console, refresh_per_second=15) as live:
            for chunk in response:
                full_reply += chunk.text
                # Loại bỏ việc in thẻ <FILE> ra màn hình để tránh làm rối Markdown
                display_reply = re.sub(r'<FILE.*?</FILE>', '\n[...Agent đang lưu code vào file...]\n', full_reply, flags=re.DOTALL)
                live.update(Markdown(display_reply))
        print()
        
        # Sau khi chat xong, quét và gọi hành động lưu file
        extract_and_execute_files(full_reply)
        
    except Exception as e: print(f"\n{IC_ERR} Lỗi Gemini: {e}\n")

def stream_ollama(prompt, model_name):
    global ollama_history
    if not ollama_history: ollama_history.append({"role": "system", "content": get_agent_system_instruction()})
    ollama_history.append({"role": "user", "content": prompt})
    
    try:
        response = requests.post(f"{OLLAMA_API_BASE}/chat", json={"model": model_name, "messages": ollama_history, "stream": True}, stream=True)
        response.raise_for_status()
        print(f"\n{IC_AI}")
        full_reply = ""
        
        with Live(Markdown(full_reply), console=console, refresh_per_second=15) as live:
            for line in response.iter_lines():
                if line:
                    full_reply += json.loads(line).get("message", {}).get("content", "")
                    display_reply = re.sub(r'<FILE.*?</FILE>', '\n[...Agent đang lưu code vào file...]\n', full_reply, flags=re.DOTALL)
                    live.update(Markdown(display_reply))
        print()
        ollama_history.append({"role": "assistant", "content": full_reply})
        
        # Quét và gọi hành động lưu file
        extract_and_execute_files(full_reply)
        
    except Exception as e:
        print(f"\n{IC_ERR} Lỗi Ollama: {e}"); ollama_history.pop(); print("\n")

def execute_system_command(cmd):
    print(f"{IC_SYS} Đang chạy: {C.DIM}{cmd}{C.RESET}")
    try:
        res = subprocess.run(cmd, shell=True, text=True, capture_output=True)
        if res.stdout: print(f"{C.GREEN}{res.stdout.strip()}{C.RESET}")
        if res.stderr: print(f"{C.RED}{res.stderr.strip()}{C.RESET}")
    except Exception as e: print(f"{IC_ERR} Lỗi chạy lệnh: {e}")
    print()

# ==========================================
# LUỒNG CHÍNH
# ==========================================
def main():
    setup_local_agent_rules()
    os.system('clear')
    print(f"{C.BOLD}{C.MAGENTA}╔════════════════════════════════════════════════════════╗{C.RESET}")
    print(f"{C.BOLD}{C.MAGENTA}║{C.RESET}       {C.CYAN}🚀 D4M-DEV LOCAL AGENT V7.0 (AUTO-CODE)  {C.RESET}        {C.BOLD}{C.MAGENTA}║{C.RESET}")
    print(f"{C.BOLD}{C.MAGENTA}╚════════════════════════════════════════════════════════╝{C.RESET}\n")
    
    active_model = get_active_ollama_model()
    print(f"{IC_SYS} Chọn bộ não trung tâm:")
    print(f"  {C.BOLD}1.{C.RESET} Google Gemini API")
    print(f"  {C.BOLD}2.{C.RESET} Local Ollama " + (f"{C.GREEN}({active_model}){C.RESET}" if active_model else f"{C.RED}(Chưa nạp model){C.RESET}"))
        
    choice = input(f"\n{IC_SYS} Nhập số [1/2]: ").strip()
    mode = "gemini"
    selected_gemini_model = ""

    if choice == "2":
        if not active_model: sys.exit(f"{IC_ERR} Chạy file ollama.py trước!")
        mode = "ollama"
        print(f"\n{IC_SYS} Đã kết nối: {C.GREEN}{active_model}{C.RESET}\n")
    else:
        gemini_models = get_gemini_models()
        if not gemini_models: sys.exit(1)
        print(f"{IC_SYS} Các model khả dụng:")
        for i, m in enumerate(gemini_models, 1):
            print(f"  {C.BOLD}{i}.{C.RESET} {m} " + (f"{C.GREEN}(Khuyên dùng){C.RESET}" if "flash" in m else ""))
        try: selected_gemini_model = gemini_models[int(input(f"{IC_SYS} Chọn [1-{len(gemini_models)}]: ").strip()) - 1]
        except: selected_gemini_model = gemini_models[0]
        init_gemini(selected_gemini_model)
        print(f"{IC_SYS} Kích hoạt: {C.GREEN}{selected_gemini_model}{C.RESET}\n")

    print(f"{C.DIM}───────────────────────────────────────────────────────────────")
    print(f" 📂 @ten_file     : Tự động tìm & đọc file trong dự án")
    print(f" 🧠 /skill <lệnh> : Code theo file .local_agent/skill/rule.md")
    print(f" 🏗️ /build <lệnh> : Build theo file .local_agent/build/rule.md")
    print(f" 💻 /sys <lệnh>   : Chạy shell nội bộ")
    print(f" 🧹 /clear        : Xóa ngữ cảnh (Reset Auto-Approve)")
    print(f"───────────────────────────────────────────────────────────────{C.RESET}\n")

    while True:
        try:
            user_input = input(f"{IC_USR} ").strip()
            if not user_input: continue
            if user_input.lower() in ['/exit', '/quit']: break
            if user_input.lower() == '/clear':
                os.system('clear')
                global ollama_history, auto_approve
                ollama_history = []
                auto_approve = False # Tắt Auto-Approve khi clear
                if mode == "gemini": init_gemini(selected_gemini_model)
                print(f"{IC_SYS} Đã xóa bộ nhớ và reset Auto-Approve.\n"); continue
            if user_input.startswith('/sys '):
                execute_system_command(user_input[5:].strip()); continue
                
            is_special = False; rule_inj = ""
            for mode_cmd, path in [('/skill ', '.local_agent/skill/rule.md'), ('/build ', '.local_agent/build/rule.md')]:
                if user_input.startswith(mode_cmd):
                    is_special = True
                    rule_text = open(path).read() if os.path.exists(path) else ""
                    user_input = user_input[7:].strip()
                    rule_inj = f"[HỆ THỐNG: CHẾ ĐỘ {mode_cmd[1:-1].upper()}. TUÂN THỦ QUY TẮC:\n{rule_text}\n]\n\n"
                    print(f"{C.DIM}>>> Nạp quy tắc từ: {path}{C.RESET}")
                    break

            final_prompt = process_prompt_with_files(user_input)
            if is_special: final_prompt = rule_inj + final_prompt

            if mode == "gemini": stream_gemini(final_prompt)
            else: stream_ollama(final_prompt, active_model)
        except KeyboardInterrupt: sys.exit(f"\n{IC_SYS} Đã ngắt!")

if __name__ == "__main__":
    main()