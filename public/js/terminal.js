// Tự động nhận diện dùng ws:// (localhost) hoặc wss:// (nếu chạy qua Cloudflare Tunnel)
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
// Tự động lấy port 16868 hoặc domain tunnel hiện tại
const wsUrl = `${protocol}//${window.location.host}/api/ws/terminal`;

const termOutput = document.getElementById('terminal-output');
let ws;

function initTerminal() {
    termOutput.innerHTML = '<div class="text-yellow-400 mb-1">Đang thiết lập kết nối mã hóa tới lõi máy chủ...</div>';
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
        termOutput.innerHTML += '<div class="text-green-500 mb-1">Kết nối thành công! Sẵn sàng nhận lệnh.</div>';
    };
    
    ws.onmessage = function(event) {
        const text = event.data;
        const div = document.createElement('div');
        // Định dạng text cho đẹp
        div.className = text.includes('LỖI:') ? 'text-red-400' : 'text-gray-300';
        div.textContent = text;
        termOutput.appendChild(div);
        termOutput.scrollTop = termOutput.scrollHeight;
    };
    
    ws.onclose = function() {
        termOutput.innerHTML += '<div class="text-red-500 mb-1 font-bold">❌ Mất kết nối Terminal. Đang thử lại sau 3s...</div>';
        setTimeout(initTerminal, 3000); // Tự động kết nối lại
    };
}

// Bắt sự kiện khi người dùng gõ phím (nếu bạn có input riêng cho terminal)
// Hiện tại terminal chỉ đang hiển thị log, nếu muốn gõ lệnh, chúng ta có thể mở rộng sau.

document.addEventListener('DOMContentLoaded', initTerminal);