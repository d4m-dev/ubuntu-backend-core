import subprocess
import threading
import time
import sys
import socket

def stream_output(process, prefix, color_code):
    """Đọc và in log từ tiến trình ra màn hình theo thời gian thực kèm màu sắc"""
    reset_color = "\033[0m"
    try:
        # Vì đã đổi sang Text Mode nên không cần b'' (binary) và decode nữa
        for line in iter(process.stdout.readline, ''):
            text = line.strip()
            if text:
                print(f"{color_code}{prefix}{reset_color} {text}")
    except ValueError:
        pass

def wait_for_port(port, host='127.0.0.1', timeout=60):
    """Trinh sát: Liên tục gõ cửa kiểm tra xem Port đã mở chưa"""
    start_time = time.time()
    while True:
        if time.time() - start_time > timeout:
            return False
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.5)
                result = s.connect_ex((host, port))
                if result == 0:
                    return True # Cổng đã mở!
        except Exception:
            pass
        time.sleep(0.5)

def main():
    print("========================================")
    print("🚀 ĐANG KHỞI ĐỘNG HỆ SINH THÁI D4M DEV 🚀")
    print("========================================\n")

    backend_cmd = "bash /sdcard/ubuntu-backend-core/scripts/auto_start.sh"
    tunnel_cmd = "cloudflared tunnel run --url http://127.0.0.1:16868 d4m-tunnel"

    try:
        # 1. Kích hoạt Backend (Sửa text=True để xóa cảnh báo RuntimeWarning)
        print("▶️  [HỆ THỐNG] Đang đánh thức Backend Core (Port 16868)...")
        backend_process = subprocess.Popen(
            backend_cmd, shell=True, 
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            bufsize=1, text=True
        )
        
        # 2. Cho Trinh sát đi kiểm tra cổng 16868
        print("⏳ Đang lắng nghe tín hiệu từ Backend...")
        
        threading.Thread(target=stream_output, args=(backend_process, "[💻 BACKEND]", "\033[1;32m"), daemon=True).start()

        if not wait_for_port(16868):
            print("\n❌ [LỖI] Backend không thể khởi động sau 60 giây. Đang hủy lệnh!")
            backend_process.terminate()
            sys.exit(1)

        print("✅ [HỆ THỐNG] Backend đã hoạt động! Lập tức khởi chạy Tunnel...")
        
        # 3. Kích hoạt Tunnel (Sửa text=True)
        tunnel_process = subprocess.Popen(
            tunnel_cmd, shell=True, 
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            bufsize=1, text=True
        )

        print("\n✅ TẤT CẢ ĐÃ SẴN SÀNG! ĐANG TRUYỀN DỮ LIỆU...\n")
        print("-" * 50)

        threading.Thread(target=stream_output, args=(tunnel_process, "[☁️  TUNNEL] ", "\033[1;36m"), daemon=True).start()

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n\n🛑 [HỆ THỐNG] Nhận lệnh dừng từ Chủ tịch!")
        print("⏳ Đang dọn dẹp và tắt các dịch vụ ngầm...")
        
        try:
            backend_process.terminate()
            tunnel_process.terminate()
        except:
            pass
            
        subprocess.run("pkill -f 'cloudflared'", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        print("✅ [HỆ THỐNG] Đã tắt an toàn. Hẹn gặp lại sếp! hẹ hẹ")
        sys.exit(0)

if __name__ == "__main__":
    main()