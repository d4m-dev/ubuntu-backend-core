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
    
    # 1. Kích nổ MariaDB (Dùng cả 3 cách phổ biến nhất trên Termux/Ubuntu)
    try:
        # Bắn lệnh chạy ngầm bỏ qua mọi cảnh báo
        os.system("nohup mysqld_safe > /dev/null 2>&1 &")
        os.system("/etc/init.d/mysql start > /dev/null 2>&1")
        os.system("service mysql start > /dev/null 2>&1")
        
        # 🚀 CỰC KỲ QUAN TRỌNG: Chờ 2.5 giây để MariaDB nổ máy xong
        print("⏳ Đang đợi động cơ MariaDB làm nóng...")
        time.sleep(2.5)
        print("✅ MariaDB: Đã được đánh thức thành công!")
    except Exception as e:
        print(f"⚠️ Lỗi khởi động DB: {e}")

    # 2. Khởi tạo thư mục và tải Giao diện Database (Adminer)
    db_admin_dir = os.path.join(BASE_DIR, "db-admin")
    os.makedirs(db_admin_dir, exist_ok=True)
    adminer_file = os.path.join(db_admin_dir, "index.php")
    
    if not os.path.exists(adminer_file):
        print("⏳ Đang tải Giao diện Adminer...")
        os.system(f"wget -q https://github.com/vrana/adminer/releases/download/v4.8.1/adminer-4.8.1-mysql.php -O {adminer_file}")
    
    # 3. Kích nổ máy chủ PHP ngầm cho Adminer trên cổng {admin_port}
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