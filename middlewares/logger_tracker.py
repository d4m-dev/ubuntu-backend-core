import asyncio
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from core.database import log_request
from api.websockets import manager
from core.telegram import send_telegram_message # 🚀 Kéo trạm phát Telegram vào

class LoggerTrackerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "Unknown"
        method = request.method
        path = request.url.path
        
        try:
            response = await call_next(request)
            status_code = response.status_code
            
            # ==========================================
            # 🚨 KÍCH HOẠT RA-ĐA BÁO ĐỘNG QUA TELEGRAM
            # ==========================================
            # Nếu máy chủ sập hoặc dự án code lỗi (Mã 5xx)
            if status_code >= 500:
                alert_msg = (f"🚨 <b>BÁO ĐỘNG MÁY CHỦ SẬP (LỖI {status_code})</b>\n\n"
                             f"🌐 Đường dẫn: <code>{path}</code>\n"
                             f"👤 IP Khách: {client_ip}\n"
                             f"⚠️ Sếp mau vào kiểm tra code dự án này nhé!")
                asyncio.create_task(send_telegram_message(alert_msg))
                
            # Nếu có IP lạ liên tục mò mẫm trang quản trị Admin
            elif status_code == 404 and "/admin" in path:
                alert_msg = (f"🛡️ <b>CẢNH BÁO XÂM NHẬP ADMIN</b>\n\n"
                             f"👤 IP: <code>{client_ip}</code> đang cố gắng dò tìm đường dẫn: {path}")
                asyncio.create_task(send_telegram_message(alert_msg))
            
            # Ghi log và phát sóng lên Dashboard như bình thường
            log_request(client_ip, method, path, status_code)
            log_message = f"[{method}] {path} - Status: {status_code} - IP: {client_ip}"
            asyncio.create_task(manager.broadcast(log_message))
            
            return response
            
        except Exception as e:
            # Bắt cả trường hợp lỗi tàng hình đánh sập tiến trình
            error_msg = (f"🔥 <b>LỖI NGHIÊM TRỌNG (CRASH)</b>\n\n"
                         f"🌐 Path: {path}\n"
                         f"❌ Chi tiết: <code>{str(e)}</code>")
            asyncio.create_task(send_telegram_message(error_msg))
            raise e