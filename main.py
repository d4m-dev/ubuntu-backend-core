import os
import sys
import uvicorn
import subprocess
import atexit
import time
from api.server import app
from core.config import settings

# Ép hệ thống nhận diện thư mục gốc để không bị lỗi không tìm thấy module
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# ==========================================
# 🚀 HỆ THỐNG TỰ ĐỘNG KHỞI CHẠY DỊCH VỤ NGẦM
# ==========================================
def start_background_services():
    print(f"====================================================")
    print("⏳ Đang kích hoạt các dịch vụ nền tảng...")
    
    # 1. Kích nổ MariaDB
    try:
        os.system("nohup mysqld_safe > /dev/null 2>&1 &")
        os.system("/etc/init.d/mysql start > /dev/null 2>&1")
        os.system("service mysql start > /dev/null 2>&1")
        
        print("⏳ Đang đợi động cơ MariaDB làm nóng...")
        time.sleep(2.5)
        print("✅ MariaDB: Đã được đánh thức thành công!")
    except Exception as e:
        print(f"⚠️ Lỗi khởi động DB: {e}")

    # 🚀 2. Kích nổ Lõi Redis (Băng chuyền dữ liệu)
    try:
        os.system("service redis-server start > /dev/null 2>&1")
        os.system("redis-server --daemonize yes > /dev/null 2>&1")
        print("✅ Redis: Băng chuyền điều phối đã sẵn sàng!")
    except Exception as e:
        print(f"⚠️ Lỗi khởi động Redis: {e}")

    # 🚀 3. Khởi động Cỗ máy Celery Worker (Robot AI)
    try:
        # Trỏ thẳng đến thư mục myenv để gọi đúng engine Celery
        celery_executable = os.path.expanduser("~/myenv/bin/celery")
        celery_process = subprocess.Popen(
            [celery_executable, "-A", "core.tasks", "worker", "--loglevel=warning", "--concurrency=1"],
            stdout=subprocess.DEVNULL, 
            stderr=subprocess.DEVNULL,
            cwd=BASE_DIR
        )
        print("✅ Celery Worker: Robot gánh vác tác vụ AI đã vào vị trí!")
        # Ràng buộc sinh tử: Tắt Server là tắt luôn Robot, không để chạy rổng
        atexit.register(lambda: celery_process.terminate())
    except Exception as e:
        print(f"⚠️ Lỗi khởi động Celery Worker: {e}")

    # 4. Khởi tạo thư mục và tải Giao diện Database (Adminer)
    db_admin_dir = os.path.join(BASE_DIR, "db-admin")
    os.makedirs(db_admin_dir, exist_ok=True)
    adminer_file = os.path.join(db_admin_dir, "index.php")
    
    if not os.path.exists(adminer_file):
        print("⏳ Đang tải Giao diện Adminer...")
        os.system(f"wget -q https://github.com/vrana/adminer/releases/download/v4.8.1/adminer-4.8.1-mysql.php -O {adminer_file}")
    
    # 5. Kích nổ máy chủ PHP ngầm cho Adminer
    try:
        admin_port = settings.DB_ADMIN_PORT
        php_process = subprocess.Popen(
            ["php", "-S", f"0.0.0.0:{admin_port}", "-t", db_admin_dir],
            stdout=subprocess.DEVNULL, 
            stderr=subprocess.DEVNULL
        )
        print(f"✅ Giao diện DB: Sẵn sàng tại http://{settings.HOST}:{admin_port}")
        atexit.register(lambda: php_process.terminate())
    except Exception as e:
        print(f"⚠️ PHP Server không khởi động được (Sếp nhớ cài php-cli nhé): {e}")

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