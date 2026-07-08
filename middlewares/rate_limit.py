from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
import time

RATE_LIMIT_DURATION = 60
RATE_LIMIT_REQUESTS = 60

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.ip_records = {}

    async def dispatch(self, request: Request, call_next):
        # 🚀 XUYÊN THỦNG CLOUDFLARE ĐỂ LẤY IP THẬT CỦA KHÁCH
        client_ip = request.headers.get("CF-Connecting-IP") or \
                    request.headers.get("X-Forwarded-For", request.client.host).split(',')[0].strip()
        
        current_time = time.time()
        path = request.url.path

        # 🛡️ CÁC TRƯỜNG HỢP ĐƯỢC MIỄN TRỪ RATE LIMIT (BYPASS)
        # 1. Bỏ qua chặn Rate Limit cho toàn bộ các API lấy dữ liệu (GET)
        # 2. Bỏ qua các endpoint cụ thể (Websocket, system-stats, analytics...)
        if request.method == "GET" or \
           path.startswith("/api/dashboard/system-stats") or \
           path.startswith("/api/dashboard/analytics") or \
           path.startswith("/ws/"):
            return await call_next(request)

        # Lọc và giữ lại các request trong khoảng thời gian RATE_LIMIT_DURATION (60s)
        if client_ip in self.ip_records:
            self.ip_records[client_ip] = [
                t for t in self.ip_records[client_ip] if current_time - t < RATE_LIMIT_DURATION
            ]
        else:
            self.ip_records[client_ip] = []

        # 🛑 KIỂM TRA GIỚI HẠN REQUEST (Áp dụng cho POST, PUT, DELETE...)
        if len(self.ip_records[client_ip]) >= RATE_LIMIT_REQUESTS:
            if path.startswith("/api/"):
                return JSONResponse(
                    status_code=429,
                    content={
                        "status": "error", 
                        "error": {
                            "title": "Hệ thống quá tải", 
                            "message": "Nghỉ tay 60 giây nhé!"
                        }
                    }
                )
            else:
                html_content = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <title>429 - Quá tải</title>
                </head>
                <body style="background: #0f2027; color: white; text-align: center; padding-top: 20%; font-family: sans-serif;">
                    <h1>⚠️ HỆ THỐNG QUÁ TẢI</h1>
                    <p>Sếp thao tác nhanh quá, hệ thống đang làm mát (60s)...</p>
                </body>
                </html>
                """
                return HTMLResponse(status_code=429, content=html_content)

        # Ghi nhận request hiện tại vào lịch sử của IP
        self.ip_records[client_ip].append(current_time)
        
        return await call_next(request)
