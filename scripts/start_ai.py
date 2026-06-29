import os
import time

# Đường dẫn file cờ hiệu để server biết AI đang bật
STATUS_FILE = "/mnt/sdcard/ubuntu-backend-core/core/.ai_active"

def load_model():
    print("⏳ Bắt đầu tải Model AI vào RAM...")
    # Mô phỏng thời gian load model nặng
    time.sleep(2)
    
    # Tạo file cờ hiệu
    with open(STATUS_FILE, "w") as f:
        f.write("active")
        
    print("✅ Tài nguyên đã được cấp phát. Model AI sẵn sàng!")

if __name__ == "__main__":
    load_model()