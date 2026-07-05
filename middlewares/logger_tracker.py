import asyncio
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from core.database import log_request
from api.websockets import manager
from core.telegram import send_telegram_message

class LoggerTrackerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 🚀 LẤY IP THẬT XUYÊN CLOUDFLARE
        client_ip = request.headers.get("CF-Connecting-IP") or \
                    request.headers.get("X-Forwarded-For", request.client.host).split(',')[0].strip()
                    
        method = request.method
        path = request.url.path
        
        try:
            response = await call_next(request)
            status_code = response.status_code
            
            if status_code >= 500:
                alert_msg = f"🚨 <b>BÁO ĐỘNG SẬP MÁY CHỦ ({status_code})</b>\n🌐 Đường dẫn: <code>{path}</code>\n👤 IP: {client_ip}"
                asyncio.create_task(send_telegram_message(alert_msg))
                
            elif status_code == 404 and "/admin" in path:
                alert_msg = f"🛡️ <b>CẢNH BÁO DÒ TÌM ADMIN</b>\n👤 IP: <code>{client_ip}</code> đang cố truy cập: {path}"
                asyncio.create_task(send_telegram_message(alert_msg))
                
            log_request(client_ip, method, path, status_code)
            asyncio.create_task(manager.broadcast(f"[{method}] {path} - Status: {status_code} - IP: {client_ip}"))
            
            return response
            
        except Exception as e:
            error_msg = f"🔥 <b>CRASH NGHIÊM TRỌNG</b>\n🌐 Path: {path}\n❌ Chi tiết: <code>{str(e)}</code>"
            asyncio.create_task(send_telegram_message(error_msg))
            raise e
