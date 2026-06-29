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
        client_ip = request.client.host
        current_time = time.time()
        path = request.url.path

        # Bỏ qua giới hạn chống Spam cho các dịch vụ thời gian thực
        if path.startswith("/api/dashboard/system-stats") or \
           path.startswith("/api/dashboard/analytics") or \
           path.startswith("/ws/"):
            return await call_next(request)

        # Dọn dẹp bộ đếm thời gian
        if client_ip in self.ip_records:
            self.ip_records[client_ip] = [
                timestamp for timestamp in self.ip_records[client_ip]
                if current_time - timestamp < RATE_LIMIT_DURATION
            ]
        else:
            self.ip_records[client_ip] = []

        # 🛑 XỬ LÝ KHI BỊ CHẶN (RATE LIMIT EXCEEDED)
        if len(self.ip_records[client_ip]) >= RATE_LIMIT_REQUESTS:
            
            # TRƯỜNG HỢP 1: Giao tiếp qua API (Trả về JSON để Frontend tự vẽ Toast)
            if path.startswith("/api/"):
                return JSONResponse(
                    status_code=429,
                    content={
                        "status": "error",
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "title": "Hệ thống quá tải",
                            "message": "Sếp thao tác hơi nhanh rồi! Vui lòng nghỉ tay khoảng 60 giây nhé.",
                            "retry_after": 60
                        }
                    }
                )
            
            # TRƯỜNG HỢP 2: Truy cập trang Web trực tiếp (Trả thẳng giao diện HTML Glassmorphism)
            else:
                html_content = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>429 - Hệ thống quá tải</title>
                    <style>
                        body { background: linear-gradient(135deg, #0f2027, #203a43, #2c5364); color: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; overflow: hidden; }
                        .glass-toast { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 20px; box-shadow: 0 10px 50px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.15); padding: 30px; width: 350px; text-align: center; position: relative; overflow: hidden; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                        @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                        .icon { color: #ef4444; font-size: 50px; margin-bottom: 15px; filter: drop-shadow(0 0 15px rgba(239,68,68,0.8)); }
                        h2 { margin: 0 0 10px 0; color: #f87171; text-transform: uppercase; font-size: 20px; letter-spacing: 1px; }
                        p { margin: 0 0 25px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6; }
                        .bar-wrapper { position: absolute; bottom: 0; left: 0; width: 100%; height: 5px; background: rgba(255,255,255,0.1); }
                        .bar { height: 100%; background: linear-gradient(90deg, #ef4444, #f97316); animation: shrink 60s linear forwards; }
                        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
                    </style>
                </head>
                <body>
                    <div class="glass-toast">
                        <div class="icon">⚠️</div>
                        <h2>Hệ Thống Quá Tải</h2>
                        <p>Sếp thao tác hơi nhanh rồi!<br>Hệ thống tự động kích hoạt lá chắn chống Spam.<br>Vui lòng chờ hệ thống làm mát nhé.</p>
                        <div class="bar-wrapper"><div class="bar"></div></div>
                    </div>
                </body>
                </html>
                """
                return HTMLResponse(status_code=429, content=html_content)

        self.ip_records[client_ip].append(current_time)
        return await call_next(request)