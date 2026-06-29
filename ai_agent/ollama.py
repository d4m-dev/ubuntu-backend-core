import os
import subprocess
import time
import urllib.request
from urllib.error import URLError
import sys
import shutil

# Biến toàn cục để lưu tiến trình của Ollama, giúp ta tắt nó sau này
ollama_process = None

MODELS = {
    "1": "qwen2.5-coder:7b",
    "2": "qwen2.5-coder:3b",
    "3": "deepseek-coder:6.7b",
    "4": "llama3.2:3b"
}

def get_ollama_path():
    """Tự động tìm đường dẫn của Ollama"""
    path = shutil.which("ollama")
    if not path:
        fallback_paths = ["/usr/local/bin/ollama", "/usr/bin/ollama", "/bin/ollama"]
        for p in fallback_paths:
            if os.path.exists(p):
                return p
    return path

def is_ollama_running():
    """Kiểm tra xem Ollama có đang hoạt động không"""
    try:
        urllib.request.urlopen("http://127.0.0.1:11434", timeout=2)
        return True
    except URLError:
        return False

def start_ollama():
    """Khởi động Ollama và mở khoá mạng (CORS)"""
    global ollama_process
    
    if is_ollama_running():
        print("⚠️ CẢNH BÁO: Ollama đang chạy ngầm từ trước!")
        print("Vui lòng mở tab Terminal khác, gõ lệnh 'pkill ollama' để tắt hẳn nó đi trước khi dùng tool này.")
        sys.exit(1)

    print("🚀 Đang khởi động Ollama server...")
    
    ollama_exec = get_ollama_path()
    if not ollama_exec:
        print("❌ Lỗi: Không tìm thấy file chạy của Ollama trên máy.")
        sys.exit(1)

    # Ép Ollama mở cửa cho Roo Code truy cập
    custom_env = os.environ.copy()
    custom_env["OLLAMA_HOST"] = "0.0.0.0"
    custom_env["OLLAMA_ORIGINS"] = "*"

    # Bật Ollama và lưu lại process để lát nữa tắt
    ollama_process = subprocess.Popen(
        [ollama_exec, "serve"], 
        stdout=subprocess.DEVNULL, 
        stderr=subprocess.DEVNULL,
        env=custom_env
    )
    
    # Chờ khởi động
    for _ in range(15):
        if is_ollama_running():
            print("✅ Ollama server đã khởi động thành công.")
            return
        time.sleep(1)
    
    print("❌ Lỗi: Khởi động Ollama thất bại.")
    sys.exit(1)

def pull_model(model_name):
    """Tải model nếu chưa có"""
    print(f"\n⏳ Đang kiểm tra và nạp model '{model_name}'...")
    ollama_exec = get_ollama_path()
    try:
        subprocess.run([ollama_exec, "pull", model_name], check=True)
        print(f"✅ Đã chuẩn bị xong model: {model_name}")
    except subprocess.CalledProcessError:
        print(f"❌ Lỗi: Không thể tải model {model_name}.")

def cleanup_and_exit():
    """Hàm dọn dẹp tắt Ollama khi nhận lệnh Ctrl+C"""
    global ollama_process
    print("\n\n🛑 Đang nhận lệnh tắt (Ctrl+C)...")
    if ollama_process is not None:
        print("Đang đóng tiến trình Ollama một cách an toàn...")
        ollama_process.terminate() # Gửi lệnh yêu cầu tắt
        try:
            ollama_process.wait(timeout=3)
            print("✅ Đã tắt Ollama hoàn toàn. Trả lại RAM cho hệ thống.")
        except subprocess.TimeoutExpired:
            ollama_process.kill() # Rút điện ép tắt nếu bị treo
            print("⚠️ Đã ép buộc tắt Ollama do phản hồi chậm.")
    print("Tạm biệt! Hẹn gặp lại.\n")
    sys.exit(0)

def main():
    print("="*45)
    print("🔧 QUẢN LÝ OLLAMA CHO ROO CODE (BẢN CTRL+C) 🔧")
    print("="*45)
    
    start_ollama()
    
    print("\nChọn model bạn muốn sử dụng:")
    for key, name in MODELS.items():
        print(f"  {key}. {name}")
        
    choice = input("Nhập số (1-4) hoặc bấm Enter để dùng (4. llama3.2:3b): ").strip()
    if not choice:
        choice = "4" # Mặc định chọn Llama 3.2 3B vì test trước đó của bạn chạy tốt
        
    model_name = MODELS.get(choice, "llama3.2:3b")
    
    pull_model(model_name)
    
    print("\n🎉 HOÀN TẤT! HỆ THỐNG ĐÃ SẴN SÀNG.")
    print("-" * 45)
    print("Sao chép y hệt thông số này vào Roo Code:")
    print(" 📍 API Provider : Ollama")
    print(" 📍 Base URL     : http://127.0.0.1:11434")
    print(f" 📍 Model ID     : {model_name}")
    print(" 📍 Context Window: 2048 hoặc 4096")
    print("-" * 45)
    print("🟢 Script đang giữ Ollama hoạt động...")
    print("❌ ĐỂ TẮT OLLAMA VÀ THOÁT, HÃY BẤM: Ctrl + C")
    
    # Vòng lặp vô tận giữ cho script sống
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup_and_exit()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Lỗi đột xuất: {e}")
        cleanup_and_exit()