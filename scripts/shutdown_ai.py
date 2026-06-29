import os
import time

STATUS_FILE = "/mnt/sdcard/ubuntu-backend-core/core/.ai_active"

def unload_model():
    print("🧹 Đang dọn dẹp cache và giải phóng RAM...")
    time.sleep(1)
    
    # Xóa file cờ hiệu
    if os.path.exists(STATUS_FILE):
        os.remove(STATUS_FILE)
        
    print("✅ Đã tắt tác vụ AI hoàn toàn để tiết kiệm pin!")

if __name__ == "__main__":
    unload_model()