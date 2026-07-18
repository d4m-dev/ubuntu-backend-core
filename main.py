import os
import sys
import uvicorn
import subprocess
import atexit
import time
import socket
from api.server import app
from core.config import settings

# Ép hệ thống nhận diện thư mục gốc để không bị lỗi không tìm thấy module
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# ==========================================
# 📡 TRINH SÁT KIỂM TRA CỔNG (PORT SCANNER)
# ==========================================
def is_port_open(port, host='127.0.0.1'):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.2)
        return s.connect_ex((host, port)) == 0

def wait_for_port(port, host='127.0.0.1', timeout=5.0):
    start_time = time.time()
    while time.time() - start_time < timeout:
        if is_port_open(port, host):
            return True
        time.sleep(0.5)
    return False

# ==========================================
# 🚀 HỆ THỐNG TỰ ĐỘNG KHỞI CHẠY DỊCH VỤ NGẦM
# ==========================================
def start_background_services():
    print(f"====================================================")
    print("⏳ Đang kiểm tra và kích hoạt các dịch vụ nền tảng...")
    
    # 1. KÍCH NỔ MARIADB (Port 3306)
    if is_port_open(3306):
        print("✅ MariaDB (3306): Đang chạy sẵn.")
    else:
        try:
            os.system("nohup mysqld_safe > /dev/null 2>&1 &")
            os.system("/etc/init.d/mysql start > /dev/null 2>&1")
            os.system("service mysql start > /dev/null 2>&1")
            
            if wait_for_port(3306, timeout=6.0):
                print("✅ MariaDB (3306): Đã được đánh thức thành công!")
            else:
                print("⚠️ MariaDB (3306): Khởi động thất bại hoặc quá chậm!")
        except Exception as e:
            print(f"⚠️ Lỗi khởi động DB: {e}")

    # 🚀 2. KÍCH NỔ REDIS (ĐÃ GẮN CỜ BỎ QUA LỖI ARM64-COW-BUG)
    redis_ready = False
    if is_port_open(6379):
        print("✅ Redis (6379): Băng chuyền điều phối đang chạy sẵn.")
        redis_ready = True
    else:
        try:
            # 💡 Bypass thẳng thừng lỗi Kernel của Android bằng lệnh "ignore-warnings ARM64-COW-BUG"
            os.system("nohup redis-server --ignore-warnings ARM64-COW-BUG > /dev/null 2>&1 &")
            
            if wait_for_port(6379, timeout=5.0):
                print("✅ Redis (6379): Băng chuyền điều phối đã sẵn sàng!")
                redis_ready = True
            else:
                print("❌ Redis (6379): BẬT THẤT BẠI. Sếp vui lòng kiểm tra lại log Redis.")
        except Exception as e:
            print(f"❌ Lỗi khởi động Redis: {e}")

    # 🚀 3. KHỞI ĐỘNG CELERY WORKER (Chỉ chạy khi Redis sống)
    if redis_ready:
        try:
            celery_executable = os.path.expanduser("~/myenv/bin/celery")
            celery_process = subprocess.Popen(
                [celery_executable, "-A", "core.tasks", "worker", "--loglevel=warning", "--concurrency=1"],
                stdout=subprocess.DEVNULL, 
                stderr=subprocess.DEVNULL,
                cwd=BASE_DIR
            )
            print("✅ Celery Worker: Robot gánh vác tác vụ AI đã vào vị trí!")
            atexit.register(lambda: celery_process.terminate())
        except Exception as e:
            print(f"⚠️ Lỗi khởi động Celery Worker: {e}")
    else:
        print("⚠️ Celery Worker: TẠM HOÃN do Redis bị lỗi.")

    # 4. KÍCH NỔ GIAO DIỆN ADMINER
    db_admin_dir = os.path.join(BASE_DIR, "db-admin")
    os.makedirs(db_admin_dir, exist_ok=True)
    adminer_file = os.path.join(db_admin_dir, "index.php")
    
    if not os.path.exists(adminer_file):
        os.system(f"wget -q https://github.com/vrana/adminer/releases/download/v4.8.1/adminer-4.8.1-mysql.php -O {adminer_file}")
    
    try:
        admin_port = settings.DB_ADMIN_PORT
        if is_port_open(admin_port):
            print(f"✅ Giao diện DB: Đang chạy sẵn tại http://{settings.HOST}:{admin_port}")
        else:
            php_process = subprocess.Popen(
                ["php", "-S", f"0.0.0.0:{admin_port}", "-t", db_admin_dir],
                stdout=subprocess.DEVNULL, 
                stderr=subprocess.DEVNULL
            )
            if wait_for_port(admin_port, timeout=3.0):
                print(f"✅ Giao diện DB: Sẵn sàng tại http://{settings.HOST}:{admin_port}")
                atexit.register(lambda: php_process.terminate())
            else:
                print("⚠️ Giao diện DB: Khởi động thất bại.")
    except Exception as e:
        print(f"⚠️ PHP Server không khởi động được: {e}")

if __name__ == "__main__":
    start_background_services()
    
    print(f"====================================================")
    print(f"🚀 UBUNTU BACKEND CORE ĐÃ LÊN SÓNG")
    print(f"🌐 Host: {settings.HOST}")
    print(f"🎯 Port (API): {settings.PORT}")
    print(f"⚙️ Môi trường: {settings.ENVIRONMENT.upper()}")
    print(f"📂 Thư mục: {BASE_DIR}")
    print(f"====================================================")
    
    uvicorn.run(
        "api.server:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True if settings.ENVIRONMENT == "development" else False,
        log_level="info"
    )