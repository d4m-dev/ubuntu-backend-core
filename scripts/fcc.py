#!/usr/bin/env python3
import os
import sys
import time
import socket
import subprocess

# 🚀 Đóng đinh cổng mạng chiến lược
TARGET_PORT = 22424

def is_server_running(port):
    """Kiểm tra xem máy chủ hoặc tiến trình nào đã chiếm dụng port chưa"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        result = s.connect_ex(('127.0.0.1', port))
        return result == 0

def kill_process_on_port(port):
    """Tiêu diệt tận gốc tiến trình cũ đang kẹt trên cổng mạng để dọn đường"""
    print(f"💥 CẢNH BÁO: Phát hiện cổng {port} đang bị chiếm dụng. Khởi động tiến trình giải phóng...")
    try:
        subprocess.run(f"fuser -k {port}/tcp", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(1.5)
        
        if is_server_running(port):
            subprocess.run(f"lsof -t -i:{port} | xargs kill -9", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(1)
            
        print(f"✅ Đã dọn dẹp sạch sẽ cổng mạng {port}! Sẵn sàng tái thiết lập luồng mới.")
    except Exception as e:
        print(f"⚠️ Trạm cứu hộ cổng mạng báo lỗi lệnh: {str(e)}")

def start_fcc_server():
    """Khởi động tiến trình fcc-server ngầm và ÉP BỘ BINH chạy đúng cổng"""
    print(f"⏳ Đang kích hoạt máy chủ proxy (fcc-server) tại cổng {TARGET_PORT}...")
    
    my_env = os.environ.copy()
    my_env["PORT"] = str(TARGET_PORT)

    subprocess.Popen(
        "fcc-server",
        shell=True,
        env=my_env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True
    )
    
    # VÒNG LẶP CHỜ THÔNG MINH (Tối đa 12 giây)
    for i in range(24):
        if is_server_running(TARGET_PORT):
            return True
        time.sleep(0.5)
        sys.stdout.write("...")
        sys.stdout.flush()
        
    print() 
    return False

def main():
    print("==================================================")
    print("🤖 COMMAND CENTER: FREE CLAUDE CODE ENVIRONMENT   ")
    print("==================================================")
    
    # BƯỚC 1: QUÉT VÀ GIẢI PHÓNG CỔNG
    if is_server_running(TARGET_PORT):
        kill_process_on_port(TARGET_PORT)
    else:
        print(f"✨ Khảo sát: Cổng mạng {TARGET_PORT} đang trống. Đủ điều kiện khởi động.")
        
    # BƯỚC 2: BẬT MÁY CHỦ (Có Radar chờ thông minh)
    success = start_fcc_server()
    
    if not success:
        print(f"\n❌ LỖI TỬ NẠN: Máy chủ fcc-server mất quá nhiều thời gian để khởi động hoặc đã bị crash ngầm!")
        print(f"👉 CÁCH KHẮC PHỤC: Hãy mở Terminal và gõ: PORT={TARGET_PORT} fcc-server để xem lỗi màu đỏ.")
        sys.exit(1)
    else:
        print(f"\n✅ Kết nối thành công! fcc-server đang chạy mượt mà tại Port: {TARGET_PORT}.")
    
    # ========================================================
    # 🚀 BƯỚC 3: ĐIỀU HƯỚNG DỰ ÁN CÓ CHỐT CHẶN BẢO MẬT
    # ========================================================
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    target_dir = project_root # Mặc định luôn là thư mục gốc
    
    # 1. Quét tham số dòng lệnh do sếp truyền vào
    target_subpath = ""
    if "-d" in sys.argv:
        try: target_subpath = sys.argv[sys.argv.index("-d") + 1]
        except IndexError: pass
    elif len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        # Hỗ trợ gõ nhanh không cần cờ -d (VD: python fcc.py public/js)
        target_subpath = sys.argv[1]

    # 2. Phân tích và giám định thư mục sếp muốn vào
    if target_subpath:
        # Tạo đường dẫn tuyệt đối để chống các mưu đồ lùi thư mục (../../)
        potential_dir = os.path.abspath(os.path.join(project_root, target_subpath))
        
        # 🛑 CHỐT CHẶN LÕI: Kiểm tra xem thư mục đó có nằm trong ruột project_root không
        if not potential_dir.startswith(project_root):
            print(f"\n⚠️ CẢNH BÁO BẢO MẬT: Thư mục '{target_subpath}' nằm ngoài vùng an toàn!")
            print("👉 Không phận bị giới hạn. Hệ thống tự động đẩy sếp quay về thư mục gốc.")
        elif not os.path.isdir(potential_dir):
            print(f"\n⚠️ CẢNH BÁO: Thư mục '{target_subpath}' hiện không tồn tại trong dự án!")
            print("👉 Hệ thống tự động đẩy sếp quay về thư mục gốc.")
        else:
            target_dir = potential_dir # Cấp phép qua trạm

    os.chdir(target_dir)
    
    print(f"🚀 Định vị không gian phôi code tại: {target_dir}")
    print("-" * 50)
    
    # BƯỚC 4: KÍCH HOẠT CLAUDE CODE
    try:
        subprocess.call("fcc-claude", shell=True)
    except KeyboardInterrupt:
        print("\n🏁 Đã ngắt kết nối an toàn khỏi Claude Code Terminal.")

if __name__ == "__main__":
    main()