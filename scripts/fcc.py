#!/usr/bin/env python3
import os
import sys
import time
import socket
import subprocess

def get_configured_port():
    """Đọc cấu hình port từ file .env của fcc, nếu không có dùng mặc định 8082"""
    port = 8082
    env_file = os.path.expanduser("~/.fcc/.env")
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if line.startswith("PORT="):
                    try:
                        port = int(line.strip().split("=")[1])
                    except ValueError:
                        pass
    return port

def is_server_running(port):
    """Kiểm tra xem máy chủ đã chạy trên port chưa"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        result = s.connect_ex(('127.0.0.1', port))
        return result == 0

def start_fcc_server():
    """Khởi động fcc-server ngầm"""
    print("⏳ Đang khởi động máy chủ proxy (fcc-server) chạy ngầm...")
    # Khởi chạy trong session mới, giấu toàn bộ log để không rác terminal
    subprocess.Popen(
        "fcc-server",
        shell=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True
    )
    time.sleep(3) # Đợi 3 giây để server kịp chiếm cổng mạng

def main():
    print("🤖 Khởi động môi trường Free Claude Code")
    port = get_configured_port()
    
    # 1. Quản lý Server
    if not is_server_running(port):
        start_fcc_server()
        if not is_server_running(port):
            print("❌ Lỗi: Không thể khởi động fcc-server. Vui lòng thử gõ lệnh fcc-server thủ công để xem lỗi.")
            sys.exit(1)
    else:
        print(f"✅ fcc-server đang hoạt động (Port: {port}).")
    
    # 2. Điều hướng đúng thư mục dự án (ubuntu-backend-core)
    # Lấy đường dẫn của chính file script này, sau đó lùi lại 1 cấp (thư mục cha)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    os.chdir(project_root)
    
    print(f"🚀 Đang mở giao diện Claude tại: {project_root}")
    print("-" * 50)
    
    # 3. Kích hoạt Claude Code và giao lại quyền kiểm soát terminal
    try:
        subprocess.call("fcc-claude", shell=True)
    except KeyboardInterrupt:
        print("\nĐã thoát khỏi Claude Code.")

if __name__ == "__main__":
    main()