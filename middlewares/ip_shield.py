import time
import json
import os
from collections import defaultdict
from fastapi import Request
from fastapi.responses import HTMLResponse
from starlette.middleware.base import BaseHTTPMiddleware
from user_agents import parse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECURITY_DIR = os.path.join(BASE_DIR, "logs", "security")
os.makedirs(SECURITY_DIR, exist_ok=True)

BLACKLIST_FILE = os.path.join(SECURITY_DIR, "blacklist.json")
ACCESS_LOG_FILE = os.path.join(SECURITY_DIR, "access_log.json")

IP_REQUEST_TRACKER = defaultdict(list)
MAX_REQUESTS = 60
TIME_WINDOW = 10
BAN_DURATION = 86400

# 🚀 DANH SÁCH TRẮNG (KIM BÀI MIỄN TỬ)
WHITELIST_IPS = {"192.168.110.123", "127.0.0.1", "localhost", "::1"}

def load_blacklist():
    if os.path.exists(BLACKLIST_FILE):
        try:
            with open(BLACKLIST_FILE, "r") as f: return json.load(f)
        except: return {}
    return {}

def save_blacklist(data):
    with open(BLACKLIST_FILE, "w") as f: json.dump(data, f, indent=4)

def log_access_async(ip, path, user_agent_string):
    try:
        ua = parse(user_agent_string)
        device_meta = f"{ua.os.family} {ua.os.version_string} - {ua.browser.family}"
        if ua.is_mobile: device_meta = f"📱 Mobile | {device_meta}"
        elif ua.is_pc: device_meta = f"💻 PC | {device_meta}"
        else: device_meta = f"🤖 Bot/Unknown | {device_meta}"

        log_entry = {"time": time.time(), "ip": ip, "path": path, "device": device_meta}
        logs = []
        if os.path.exists(ACCESS_LOG_FILE):
            with open(ACCESS_LOG_FILE, "r") as f:
                try: logs = json.load(f)
                except: pass
        logs.append(log_entry)
        with open(ACCESS_LOG_FILE, "w") as f: json.dump(logs[-10000:], f)
    except Exception: pass

def get_banned_html(ip: str, reason: str, is_auto: bool = False):
    bg_color = "#3b0707" if is_auto else "#000000"
    title = "KẾT NỐI BỊ TỪ CHỐI" if not is_auto else "PHÁT HIỆN TẤN CÔNG (DDOS/SPAM)"
    
    return f"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AEGIS FIREWALL | ACCESS DENIED</title>
        <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body {{ background-color: {bg_color}; color: #ff4d4d; font-family: 'Fira Code', monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; overflow: hidden; }}
            .container {{ text-align: center; background: rgba(20, 0, 0, 0.8); padding: 40px; border: 1px solid #ff4d4d; border-radius: 10px; box-shadow: 0 0 30px rgba(255, 0, 0, 0.3); max-width: 600px; width: 90%; position: relative; }}
            .scanline {{ position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: rgba(255, 77, 77, 0.5); opacity: 0.5; animation: scan 3s infinite linear; }}
            @keyframes scan {{ 0% {{ top: 0; }} 100% {{ top: 100%; }} }}
            .icon {{ font-size: 60px; margin-bottom: 20px; animation: pulse 2s infinite; }}
            @keyframes pulse {{ 0% {{ opacity: 1; text-shadow: 0 0 20px #ff4d4d; }} 50% {{ opacity: 0.5; text-shadow: 0 0 5px #ff4d4d; }} 100% {{ opacity: 1; text-shadow: 0 0 20px #ff4d4d; }} }}
            h1 {{ font-size: 28px; margin: 0 0 10px; letter-spacing: 2px; }}
            p {{ color: #cccccc; font-size: 14px; margin-bottom: 25px; line-height: 1.5; }}
            .info-box {{ background: rgba(0, 0, 0, 0.5); padding: 15px; border-left: 4px solid #ff4d4d; text-align: left; margin-bottom: 20px; }}
            .info-box div {{ margin-bottom: 8px; font-size: 13px; }}
            .highlight {{ color: #ffffff; font-weight: bold; }}
            .footer {{ font-size: 11px; color: #666; margin-top: 30px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="scanline"></div>
            <div class="icon">🛑</div>
            <h1>{title}</h1>
            <p>Hệ thống Khiên bảo mật <b>AEGIS</b> đã ngắt kết nối của bạn để bảo vệ an toàn cho máy chủ gốc.</p>
            <div class="info-box">
                <div><span>IP của bạn:</span> <span class="highlight">{ip}</span></div>
                <div><span>Lý do khóa:</span> <span class="highlight">{reason}</span></div>
                <div><span>Tình trạng:</span> <span class="highlight" style="color:#ff4d4d;">BỊ GIAM GIỮ (BLACKLISTED)</span></div>
            </div>
            <p style="font-size: 12px; color: #999;">Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ Ban Quản Trị Hệ Thống D4M để được hỗ trợ.</p>
            <div class="footer">AEGIS Security Shield v2.0 • Protected by D4M Network</div>
        </div>
    </body>
    </html>
    """

class IPShieldMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.headers.get("CF-Connecting-IP") or request.headers.get("X-Forwarded-For") or request.client.host
        if client_ip and "," in client_ip: client_ip = client_ip.split(",")[0].strip()

        # 🚀 KIỂM TRA KIM BÀI MIỄN TỬ: Bỏ qua mọi giới hạn nếu IP thuộc Danh Sách Trắng
        if client_ip in WHITELIST_IPS:
            return await call_next(request)

        blacklist = load_blacklist()
        
        if client_ip in blacklist:
            ban_info = blacklist[client_ip]
            if time.time() < ban_info["expires_at"]:
                return HTMLResponse(status_code=403, content=get_banned_html(client_ip, ban_info['reason'], is_auto=False))
            else:
                del blacklist[client_ip]
                save_blacklist(blacklist)

        current_time = time.time()
        IP_REQUEST_TRACKER[client_ip] = [t for t in IP_REQUEST_TRACKER[client_ip] if current_time - t < TIME_WINDOW]
        IP_REQUEST_TRACKER[client_ip].append(current_time)

        if len(IP_REQUEST_TRACKER[client_ip]) > MAX_REQUESTS:
            reason = "Vượt quá giới hạn tốc độ yêu cầu (DDOS/Spam)"
            blacklist[client_ip] = {
                "reason": reason,
                "banned_at": current_time,
                "expires_at": current_time + BAN_DURATION
            }
            save_blacklist(blacklist)
            print(f"🚨 [AEGIS] Bắn hạ IP: {client_ip}")
            return HTMLResponse(status_code=429, content=get_banned_html(client_ip, reason, is_auto=True))

        user_agent = request.headers.get("User-Agent", "Unknown")
        log_access_async(client_ip, request.url.path, user_agent)

        response = await call_next(request)
        return response