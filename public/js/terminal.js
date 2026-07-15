// ==========================================
// WEBSOCKET TERMINAL (DỰ PHÒNG CHẠY NGẦM)
// ==========================================
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/api/ws/terminal`;
const termOutput = document.getElementById('terminal-output');
let ws;

function initTerminal() {
    if(!termOutput) return; // Nếu giao diện không có thẻ này, ngưng chạy để tránh báo lỗi đỏ
    
    termOutput.innerHTML = '<div class="text-yellow-400 mb-1">Đang thiết lập kết nối mã hóa tới lõi máy chủ...</div>';
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
        termOutput.innerHTML += '<div class="text-green-500 mb-1">Kết nối thành công! Sẵn sàng nhận lệnh.</div>';
    };
    
    ws.onmessage = function(event) {
        const text = event.data;
        const div = document.createElement('div');
        div.className = text.includes('LỖI:') ? 'text-red-400 font-bold' : 'text-gray-300';
        div.textContent = text;
        termOutput.appendChild(div);
        termOutput.scrollTop = termOutput.scrollHeight;
    };
    
    ws.onclose = function() {
        termOutput.innerHTML += '<div class="text-red-500 mb-1 font-bold">❌ Mất kết nối Terminal. Đang thử lại sau 3s...</div>';
        setTimeout(initTerminal, 3000); // Tự động kết nối lại
    };
}

document.addEventListener('DOMContentLoaded', initTerminal);
