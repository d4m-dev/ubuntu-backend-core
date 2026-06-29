import os
import requests
import subprocess
import time
import logging
import json
from queue import Queue
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# =======================================================
# HỆ THỐNG TRUYỀN TẢI LOG REAL-TIME (SSE)
# =======================================================
log_clients = []

def broadcast_log(msg):
    # 1. In ra màn hình Terminal Ubuntu/Termux (Môi trường gốc)
    print(msg)
    # 2. Bắn log này sang tất cả các trình duyệt đang mở terminal.html
    for q in log_clients:
        q.put(msg)

# Ghi đè hệ thống Log mặc định của Flask để bắt các luồng request
class BroadcastLogHandler(logging.Handler):
    def emit(self, record):
        msg = self.format(record)
        broadcast_log(msg)

werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.setLevel(logging.INFO)
# Tắt log mặc định để tránh in trùng lặp 2 lần trên màn hình
werkzeug_logger.handlers = [] 
werkzeug_logger.addHandler(BroadcastLogHandler())

@app.route('/api/logs')
def stream_logs():
    """Endpoint để terminal.html kết nối vào và đọc log trực tiếp"""
    q = Queue()
    log_clients.append(q)
    
    def event_stream():
        try:
            yield "data: [Hệ thống]: Mở luồng Log Stream...\n\n"
            while True:
                msg = q.get()
                # Định dạng chuẩn SSE bắt buộc bắt đầu bằng "data: "
                yield f"data: {msg}\n\n"
        except GeneratorExit:
            log_clients.remove(q)

    return Response(event_stream(), mimetype="text/event-stream")

# =======================================================
# CẤU HÌNH TỰ ĐỘNG BẬT OLLAMA (ĐÃ TỐI ƯU)
# =======================================================
def check_ollama_alive():
    """Hàm kiểm tra xem Ollama có đang phản hồi không"""
    try:
        # Gửi request với timeout 1s để không bị treo server
        res = requests.get("http://127.0.0.1:11434/", timeout=1)
        return res.status_code == 200
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
        return False

def auto_start_ollama():
    broadcast_log("[Hệ thống]: Đang kiểm tra trạng thái dịch vụ Ollama...")
    
    # 1. Nếu đã bật rồi -> Bỏ qua và chạy tiếp code phía sau
    if check_ollama_alive():
        broadcast_log("[Hệ thống]: Ollama đã được bật sẵn. Bỏ qua bước khởi động.")
        return

    # 2. Nếu chưa bật -> Tiến hành bật ngầm
    broadcast_log("[Hệ thống]: Ollama chưa chạy. Đang tiến hành khởi động ngầm...")
    try:
        # Dùng start_new_session=True để tách hẳn process Ollama ra khỏi Flask
        subprocess.Popen(
            ["ollama", "serve"], 
            stdout=subprocess.DEVNULL, 
            stderr=subprocess.DEVNULL,
            start_new_session=True
        )
        
        # 3. Vòng lặp chờ thông minh (Tối đa chờ 15 giây)
        max_retries = 15
        for i in range(max_retries):
            time.sleep(1) # Đợi 1 giây rồi check lại
            
            if check_ollama_alive():
                broadcast_log(f"[Hệ thống]: Đã kích hoạt Ollama ngầm thành công sau {i+1} giây!")
                return
            
            # In log nhắc nhở nếu máy chạy hơi lâu (3s in 1 lần cho đỡ rối mắt)
            if (i + 1) % 3 == 0:
                broadcast_log(f"[Hệ thống]: Vẫn đang chờ Ollama khởi động... ({i+1}s/{max_retries}s)")
        
        # Nếu hết vòng lặp (15s) mà chưa return -> Báo lỗi
        broadcast_log("[Lỗi]: Quá 15 giây nhưng Ollama chưa phản hồi. Có thể máy ảo Ubuntu bị nghẽn.")
        
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
        
        bot_reply = ""
        # Xử lý streaming response từ Ollama
        with requests.post(url, json=payload, headers=headers, stream=True) as res:
            # Kiểm tra nếu request không thành công
            res.raise_for_status()
            for line in res.iter_lines():
                if line:
                    chunk = json.loads(line)
                    bot_reply += chunk.get('response', '')
                    # Nếu model đã trả lời xong, có thể dừng sớm
                    if chunk.get('done'):
                        break
        
        if not bot_reply:
            bot_reply = 'Không nhận được phản hồi từ mô hình nội bộ.'

        return jsonify({'response': bot_reply}), 200

    except requests.exceptions.RequestException as e:
        error_msg = f"Lỗi kết nối tới Ollama Server: {str(e)}"
        broadcast_log(f"[Lỗi Server]: {error_msg}")
        return jsonify({'response': error_msg}), 500
    except Exception as e:
        broadcast_log(f"[Lỗi Server]: {str(e)}")
        return jsonify({'response': f"Lỗi xử lý nội bộ: {str(e)}"}), 500

if __name__ == '__main__':
    # Bắt buộc đi qua bước kiểm tra/bật Ollama trước
    auto_start_ollama()
    
    # Chỉ sau khi Ollama xong, Flask mới khởi động
    broadcast_log("Khởi động AI Backend Live Stream tại Port 25152")

    # Đã xóa dòng os.environ gây lỗi
    app.run(host='0.0.0.0', port=25152, threaded=True)