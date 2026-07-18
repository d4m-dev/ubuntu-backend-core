from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
import redis.asyncio as redis
import logging

# Định cấu hình giới hạn
RATE_LIMIT_DURATION = 60
RATE_LIMIT_REQUESTS = 60

# 🚀 Khởi tạo kết nối lõi Redis cục bộ siêu tốc
redis_client = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True)

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 🚀 XUYÊN THỦNG CLOUDFLARE ĐỂ LẤY IP THẬT CỦA KHÁCH
        client_ip = request.headers.get("CF-Connecting-IP") or \
                    request.headers.get("X-Forwarded-For", request.client.host).split(',')[0].strip()
        
        path = request.url.path

        # 🛡️ ĐẶC QUYỀN VIP: MIỄN TRỪ RATE LIMIT (BYPASS)
        # 1. Bỏ qua chặn Rate Limit cho toàn bộ các API lấy dữ liệu (GET)
        # 2. Bỏ qua các endpoint cụ thể (Websocket, system-stats, analytics...)
        if request.method == "GET" or \
           path.startswith("/api/dashboard/system-stats") or \
           path.startswith("/api/dashboard/analytics") or \
           path.startswith("/ws/"):
            return await call_next(request)

        # 🚀 CHUYỂN DỮ LIỆU ĐẾM SANG LƯU TRỮ TRÊN REDIS THAY VÌ RAM SERVER
        redis_key = f"rate_limit:{client_ip}"
        
        try:
            # Tăng bộ đếm và lấy giá trị hiện tại (Atomic operation)
            requests_count = await redis_client.incr(redis_key)
            
            # Nếu là request đầu tiên trong chu kỳ, tạo đồng hồ đếm ngược 60 giây
            if requests_count == 1:
                await redis_client.expire(redis_key, RATE_LIMIT_DURATION)
                
            # 🛑 KIỂM TRA GIỚI HẠN REQUEST
            if requests_count > RATE_LIMIT_REQUESTS:
                logging.warning(f"🚨 LÁ CHẮN REDIS: Chặn {client_ip} tại {path} (Spam: {requests_count} Req)")
                
                if path.startswith("/api/"):
                    return JSONResponse(
                        status_code=429,
                        content={
                            "status": "error", 
                            "error": {
                                "title": "Hệ thống quá tải", 
                                "message": f"IP của bạn đã chạm mốc {RATE_LIMIT_REQUESTS} tác vụ. Nghỉ tay 60 giây nhé!"
                            }
                        }
                    )
                else:
                    html_content = f"""
                    <!DOCTYPE html>
                    <html lang="vi">
                    <head>
                        <meta charset="UTF-8">
                        <title>429 - Quá tải</title>
                    </head>
                    <body style="background: #0f2027; color: white; text-align: center; padding-top: 20%; font-family: sans-serif;">
                        <h1 style="color: #ff4757;">⚠️ LÁ CHẮN DDOS KÍCH HOẠT</h1>
                        <p>Hệ thống nhận diện lưu lượng bất thường. Đang trong thời gian cách ly IP (60s)...</p>
                    </body>
                    </html>
                    """
                    return HTMLResponse(status_code=429, content=html_content)

        except Exception as e:
            # Nếu Server Redis chết, vẫn cho phép luồng chạy để không làm sập Web (Fail-Open)
            logging.error(f"Lỗi Redis Rate Limit (Bypass an toàn): {e}")

        # Nếu chưa vượt quá giới hạn, cho phép luồng chạy qua lớp Middleware này
        return await call_next(request)