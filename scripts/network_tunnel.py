import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_FILE = os.path.join(BASE_DIR, "cloudflare.log")

def start_tunnel():
    """Bật đường hầm Cloudflare"""
    stop_tunnel()
    if os.path.exists(LOG_FILE):
        try:
            os.remove(LOG_FILE)
        except:
            pass
    
    # Kích hoạt tunnel trỏ về cổng 16868 của hệ thống
    cmd = f"/usr/bin/cloudflared tunnel --url http://127.0.0.1:16868 > {LOG_FILE} 2>&1 &"
    os.system(cmd)

def stop_tunnel():
    """Tắt đường hầm Cloudflare"""
    os.system("pkill -f cloudflared")

def get_tunnel_url():
    """Đọc file log và trích xuất đường link Public"""
    if not os.path.exists(LOG_FILE):
        return ""
        
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            content = f.read()
            match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', content)
            if match:
                return match.group(0)
    except Exception:
        pass
        
    return ""