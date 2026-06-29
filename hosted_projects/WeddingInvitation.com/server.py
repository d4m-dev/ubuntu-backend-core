import http.server
import socketserver
import threading
import os
import asyncio
import websockets
import socket
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# /root/myenv/bin/python /root/WeddingInvitation.com/server.py
# source ~/myenv/bin/activate && pip install watchdog websockets

def get_free_port(start_port):
    port = start_port
    while True:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("0.0.0.0", port))
                return port
            except OSError:
                port += 1

PORT = get_free_port(2626)
WS_PORT = get_free_port(5656)  # Cổng dành riêng cho WebSocket để báo hiệu reload
connected_clients = set()

# --- 1. SCRIPT ĐƯỢC CHÈN VÀO HTML ĐỂ TỰ ĐỘNG TẢI LẠI ---
# Đoạn mã này sử dụng window.location.hostname để tự động khớp với IP của máy chủ khi thiết bị khác truy cập
RELOAD_SCRIPT = f"""
<script>
    (function() {{
        const ws = new WebSocket('ws://' + window.location.hostname + ':{WS_PORT}');
        ws.onmessage = function(event) {{
            if (event.data === 'reload') {{
                console.log('🔄 Tệp đã thay đổi. Đang tải lại trang...');
                window.location.reload();
            }}
        }};
        ws.onclose = function() {{
            console.log('❌ Mất kết nối đến máy chủ tải lại. Đang cố gắng kết nối lại...');
            setTimeout(() => window.location.reload(), 2000);
        }};
    }})();
</script>
</body>
"""
# --- 2. MÁY CHỦ HTTP (Phục vụ tệp và tự động chèn Script) ---
class AutoReloadHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, 'index.html')
            
        if path.endswith('.html') and os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if '</body>' in content:
                    content = content.replace('</body>', RELOAD_SCRIPT)
                else:
                    content += RELOAD_SCRIPT
                
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
                self.end_headers()
                self.wfile.write(content.encode('utf-8'))
                return
            except Exception as e:
                print(f"Lỗi khi phục vụ HTML: {e}")

        if any(self.path.endswith(ext) for ext in ['.css', '.js']):
            super().do_GET()
            return
            
        return super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

def start_http_server():
    socketserver.TCPServer.allow_reuse_address = True
    # Thay đổi thành "0.0.0.0" để cho phép các thiết bị trong mạng Wi-Fi truy cập
    with socketserver.TCPServer(("0.0.0.0", PORT), AutoReloadHTTPHandler) as httpd:
        print(f"🌍 Server đang chạy!")
        print(f"   🔗 Cục bộ: http://localhost:{PORT}") # Địa chỉ cục bộ
        print(f"   🔗 Trong mạng Wi-Fi: http://192.168.110.2:{PORT}") # Địa chỉ trong mạng Wi-Fi (ví dụ)
        httpd.serve_forever()

# --- 3. MÁY CHỦ WEBSOCKET (Giữ kết nối với Trình duyệt) ---
async def ws_handler(websocket):
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            pass
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.remove(websocket)

async def start_ws_server():
    # Thay đổi thành "0.0.0.0" để WebSocket nhận diện được kết nối từ các thiết bị khác trong mạng Wi-Fi
    async with websockets.serve(ws_handler, "0.0.0.0", WS_PORT):
        await asyncio.Future()

def run_ws_loop():
    asyncio.run(start_ws_server())

# --- 4. WATCHDOG (Theo dõi sự thay đổi tệp) ---
class FileChangeHandler(FileSystemEventHandler):
    def __init__(self):
        self.loop = asyncio.new_event_loop()
        threading.Thread(target=self._run_loop, daemon=True).start()

    def _run_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_forever()

    def on_modified(self, event):
        if any(event.src_path.endswith(ext) for ext in ['.html', '.css', '.js']):
            if 'node_modules' in event.src_path or '/.' in event.src_path:
                return
                
            print(f"📝 Tệp đã thay đổi: {event.src_path} -> Đang buộc tải lại trình duyệt...")
            asyncio.run_coroutine_threadsafe(self.broadcast_reload(), self.loop)

    async def broadcast_reload(self):
        if connected_clients:
            await asyncio.gather(*[client.send("reload") for client in connected_clients])

# --- 5. HÀM KHỞI CHẠY CHÍNH ---
if __name__ == "__main__":
    print("🚀 Đang khởi động Live Development Server...")

    http_thread = threading.Thread(target=start_http_server, daemon=True)
    http_thread.start()

    ws_thread = threading.Thread(target=run_ws_loop, daemon=True)
    ws_thread.start()

    event_handler = FileChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, path='.', recursive=True)
    observer.start()

    try:
        while True:
            threading.Event().wait(1)
    except KeyboardInterrupt: # Bắt sự kiện Ctrl+C để dừng máy chủ
        print("\n🛑 Đang dừng máy chủ...")
        observer.stop()
    observer.join()