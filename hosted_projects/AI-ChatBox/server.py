import os
import requests
import subprocess
import time
import logging
import threading
import json
import signal
from queue import Queue
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# =======================================================
# BIẾN TOÀN CỤC CHO TÍNH NĂNG AUTO-SHUTDOWN
# =======================================================
TIMEOUT_SECONDS = 15 * 60  # 15 phút (tính bằng giây)
last_activity_time = time.time()

# =======================================================
# HỆ THỐNG TRUYỀN TẢI LOG REAL-TIME (SSE)
# =======================================================
log_clients = []

def broadcast_log(msg):
    print(msg)
    for q in log_clients:
        q.put(msg)

class BroadcastLogHandler(logging.Handler):
    def emit(self, record):
        msg = self.format(record)
        broadcast_log(msg)

werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.setLevel(logging.INFO)
werkzeug_logger.handlers = [] 
werkzeug_logger.addHandler(BroadcastLogHandler())

@app.route('/api/logs')
def stream_logs():
    q = Queue()
    log_clients.append(q)
    
    def event_stream():
        try:
            yield "data: [Hệ thống]: Mở luồng Log Stream...\n\n"
            while True:
                msg = q.get()
                yield f"data: {msg}\n\n"
        except GeneratorExit:
            if q in log_clients:
                log_clients.remove(q)

    return Response(event_stream(), mimetype="text/event-stream")

# =======================================================
# TÍNH NĂNG AUTO-SHUTDOWN KHI KHÔNG HOẠT ĐỘNG
# =======================================================
@app.before_request
def update_activity():
    """Reset bộ đếm thời gian mỗi khi có request tới API chat"""
    global last_activity_time
    # Chỉ tính là có hoạt động khi người dùng gọi API chat
    if request.path == '/api/chat':
        last_activity_time = time.time()

def shutdown_system():
    """Hàm thực thi việc tắt hệ thống"""
    broadcast_log(f"[Hệ thống]: Đã quá {TIMEOUT_SECONDS // 60} phút không có người sử dụng. Bắt đầu quá trình tắt tự động...")
    time.sleep(2) # Đợi 2s để dòng log trên kịp gửi qua giao diện web

    # 1. Tắt tiến trình Ollama
    broadcast_log("[Hệ thống]: Đang tắt tiến trình Ollama...")
    try:
        # Sử dụng lệnh pkill để tắt mọi tiến trình có tên chứa "ollama"
        subprocess.run(["pkill", "-f", "ollama"], check=False)
        broadcast_log("[Hệ thống]: Đã tắt Ollama thành công.")
    except Exception as e:
        broadcast_log(f"[Lỗi]: Không thể tự tắt Ollama: {str(e)}")

    # 2. Tắt Flask Server
    broadcast_log("[Hệ thống]: Đang tắt AI Backend Server. Tạm biệt!")
    time.sleep(1) # Đợi 1 nhịp cuối cho log
    
    # Gửi tín hiệu dừng (SIGINT) cho chính tiến trình Python này
    os.kill(os.getpid(), signal.SIGINT)

def inactivity_monitor():
    """Luồng ngầm liên tục kiểm tra thời gian không hoạt động"""
    global last_activity_time
    while True:
        time.sleep(30) # Cứ 30 giây kiểm tra 1 lần cho nhẹ máy
        
        # Nếu thời gian hiện tại - thời gian hoạt động cuối > 15 phút
        if time.time() - last_activity_time > TIMEOUT_SECONDS:
            shutdown_system()
            break

# =======================================================
# API ĐỂ TẮT SERVER TỪ XA (GỌI TỪ SERVER MẸ)
# =======================================================
def _shutdown_after_response():
    """Hàm chạy ngầm để tắt server sau khi đã gửi response OK"""
    time.sleep(1)
    shutdown_system()

@app.route('/api/shutdown', methods=['POST'])
def handle_shutdown():
    # Bảo mật: Chỉ cho phép request từ localhost (tức là từ server mẹ)
    if request.remote_addr != '127.0.0.1':
        broadcast_log(f"[Hệ thống]: Yêu cầu tắt server từ IP lạ bị từ chối: {request.remote_addr}")
        return jsonify({"status": "error", "message": "Forbidden"}), 403
    
    threading.Thread(target=_shutdown_after_response).start()
    return jsonify({"status": "success", "message": "Lệnh tắt đã được tiếp nhận."}), 200

# =======================================================
# CẤU HÌNH TỰ ĐỘNG BẬT OLLAMA
# =======================================================
def check_ollama_alive():
    try:
        res = requests.get("http://127.0.0.1:11434/", timeout=1)
        return res.status_code == 200
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
        return False

def auto_start_ollama():
    broadcast_log("[Hệ thống]: Đang kiểm tra trạng thái dịch vụ Ollama...")
    
    if check_ollama_alive():
        broadcast_log("[Hệ thống]: Ollama đã được bật sẵn. Bỏ qua bước khởi động.")
        return

    broadcast_log("[Hệ thống]: Ollama chưa chạy. Đang tiến hành khởi động ngầm...")
    try:
        subprocess.Popen(
            ["ollama", "serve"], 
            stdout=subprocess.DEVNULL, 
            stderr=subprocess.DEVNULL,
            start_new_session=True
        )
        
        max_retries = 15
        for i in range(max_retries):
            time.sleep(1)
            
            if check_ollama_alive():
                broadcast_log(f"[Hệ thống]: Đã kích hoạt Ollama ngầm thành công sau {i+1} giây!")
                return
            
            if (i + 1) % 3 == 0:
                broadcast_log(f"[Hệ thống]: Vẫn đang chờ Ollama khởi động... ({i+1}s/{max_retries}s)")
        
        broadcast_log("[Lỗi]: Quá 15 giây nhưng Ollama chưa phản hồi. Có thể hệ thống bị nghẽn.")
        
    except Exception as e:
        broadcast_log(f"[Lỗi]: Không thể tự bật Ollama ngầm. Lỗi chi tiết: {str(e)}")

@app.route('/api/status', methods=['GET', 'OPTIONS'])
def status():
    return jsonify({"status": "running"}), 200

# =======================================================
# CẤU HÌNH API CHAT CHÍNH
# =======================================================
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        if not user_message:
            return jsonify({'response': 'Tin nhắn trống.'}), 400
        
        broadcast_log(f"[Nhận tin nhắn]: {user_message}")
        url = "http://127.0.0.1:11434/api/generate"
        payload = {
            "model": "gemma:2b",
            "prompt": user_message,
            "stream": True
        }
        headers = {"Content-Type": "application/json"}
        
        def generate_stream():
            full_bot_reply = ""
            try:
                with requests.post(url, json=payload, headers=headers, stream=True) as res:
                    res.raise_for_status()
                    for line in res.iter_lines():
                        if line:
                            chunk = json.loads(line)
                            response_text = chunk.get('response', '')
                            full_bot_reply += response_text
                            yield f"data: {response_text}\n\n"
                            if chunk.get('done'):
                                break
            except requests.exceptions.RequestException as e:
                error_msg = f"Lỗi kết nối tới Ollama Server: {str(e)}"
                broadcast_log(f"[Lỗi Server]: {error_msg}")
                yield f"data: [ERROR] {error_msg}\n\n"
            finally:
                broadcast_log(f"[Phản hồi AI]: {full_bot_reply}")
        return Response(generate_stream(), mimetype='text/event-stream')
    except requests.exceptions.RequestException as e:
        error_msg = f"Lỗi kết nối tới Ollama Server: {str(e)}"
        broadcast_log(f"[Lỗi Server]: {error_msg}")
        return jsonify({'response': error_msg}), 500
    except Exception as e:
        broadcast_log(f"[Lỗi Server]: {str(e)}")
        return jsonify({'response': f"Lỗi xử lý nội bộ: {str(e)}"}), 500

if __name__ == '__main__':
    # 1. Bật Ollama trước
    auto_start_ollama()
    
    # 2. Khởi chạy luồng theo dõi trạng thái hoạt động (Auto-shutdown monitor)
    monitor_thread = threading.Thread(target=inactivity_monitor, daemon=True)
    monitor_thread.start()
    broadcast_log("[Hệ thống]: Đã kích hoạt bộ đếm theo dõi. Tự động tắt sau 15 phút không hoạt động.")
    
    # 3. Chạy Flask Server ở port 25152
    broadcast_log("Khởi động AI Backend Live Stream tại Port 25152")
    app.run(host='0.0.0.0', port=25152, threaded=True)