import asyncio
import time
import os
import subprocess

# Cấu hình thời gian chờ: 15 phút = 900 giây
# (Mình để biến này ở ngoài để sau này bạn dễ tinh chỉnh)
TIMEOUT_SECONDS = 15 * 60

# Biến lưu trữ thời điểm cuối cùng có người chat
last_activity_time = time.time()

# Đường dẫn tĩnh
STATUS_FILE = "/storage/emulated/0/coder/media/ubuntu-backend-core/core/.ai_active"
SHUTDOWN_SCRIPT = "/storage/emulated/0/coder/media/ubuntu-backend-core/scripts/shutdown_ai.py"

def update_activity():
    """Hàm này được gọi mỗi khi có người gửi tin nhắn để reset lại đồng hồ"""
    global last_activity_time
    last_activity_time = time.time()

async def ai_janitor_task():
    """Tác vụ chạy ngầm kiểm tra và dọn dẹp AI nếu quá hạn"""
    print("🕒 Trình quản lý tài nguyên (Scheduler) đã được khởi động ngầm.")
    while True:
        # Tạm nghỉ 60 giây rồi kiểm tra một lần (tránh ngốn CPU)
        await asyncio.sleep(60)
        
        # Chỉ kiểm tra nếu hệ thống báo AI đang trong trạng thái Active
        if os.path.exists(STATUS_FILE):
            idle_time = time.time() - last_activity_time
            
            if idle_time >= TIMEOUT_SECONDS:
                print(f"\n⏰ AI đã không hoạt động trong {idle_time/60:.1f} phút. Kích hoạt dọn dẹp...")
                try:
                    # Gọi trực tiếp python3 trong môi trường ảo
                    python_exec = os.path.expanduser("~/myenv/bin/python3")
                    subprocess.run([python_exec, SHUTDOWN_SCRIPT], check=True)
                    print("🧹 Auto-Shutdown hoàn tất. Đã giải phóng RAM thành công!")
                except Exception as e:
                    print(f"❌ Lỗi khi tự động tắt AI: {e}")