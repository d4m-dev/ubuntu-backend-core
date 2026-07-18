import os

def start_tunnel():
    """Bật đường hầm Cloudflare kết nối với tên miền d4mdev.click"""
    stop_tunnel()
    cmd = "nohup cloudflared tunnel run --url http://127.0.0.1:16868 d4m-tunnel > /dev/null 2>&1 &"
    os.system(cmd)

def stop_tunnel():
    """Tắt đường hầm Cloudflare"""
    os.system("pkill -f cloudflared")

def get_tunnel_url():
    """Trả về thẳng tên miền chính thức của sếp"""
    return "https://d4mdev.click"