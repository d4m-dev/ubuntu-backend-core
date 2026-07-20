// ==============================================================================
// D4M TERMINAL RADAR - LIVE WEBSOCKET EDITION (PRO VIP)
// ==============================================================================

let wsLogs = null;
let isTerminalPaused = false;
let logCount = 0;
const MAX_LOG_LINES = 100; // Giới hạn 100 dòng để không gây lag trình duyệt

document.addEventListener('DOMContentLoaded', () => {
    const termBox = document.getElementById('terminal-output');
    if (!termBox) return;

    // 1. CHẠY BOOT SEQUENCE ĐỂ LÀM MÀU
    const bootSequence = [
        "[OK] Đã tải Linux Kernel ARM64.",
        "[OK] Khởi chạy Logger Middleware Pro VIP.",
        "[INFO] Xác thực thẻ đặc quyền Admin... Thành công.",
        "[SYSTEM] Đang mở cổng WebSocket lắng nghe truy cập...",
        "==================================================",
    ];

    let delay = 500;
    bootSequence.forEach((line) => {
        setTimeout(() => appendTerminalLine(`d4m-dev@server:~$ ${line}`, "text-gray-400 font-bold"), delay);
        delay += 400; 
    });

    // 2. KẾT NỐI WEBSOCKET THẬT
    setTimeout(connectLogWebSocket, delay + 500);
});

function connectLogWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsUrl = `${protocol}${window.location.host}/api/ws/logs`; // Cổng kết nối chuẩn từ api/websockets.py
    
    wsLogs = new WebSocket(wsUrl);

    wsLogs.onopen = () => {
        document.getElementById('ws-ping-dot')?.classList.remove('bg-red-500', 'bg-yellow-500');
        document.getElementById('ws-ping-dot')?.classList.add('bg-green-500', 'animate-pulse');
        appendTerminalLine(`[OK] KẾT NỐI RADAR THÀNH CÔNG. Đang bắt sóng truy cập...`, "text-green-400 font-black");
    };

    wsLogs.onmessage = (event) => {
        if (isTerminalPaused) return; // Nếu sếp nhấn Tạm dừng thì bỏ qua log
        formatAndPrintLog(event.data);
    };

    wsLogs.onclose = () => {
        document.getElementById('ws-ping-dot')?.classList.replace('bg-green-500', 'bg-red-500');
        appendTerminalLine(`[ERROR] Mất kết nối Radar. Hệ thống sẽ thử kết nối lại sau 5 giây...`, "text-red-500 animate-pulse");
        setTimeout(connectLogWebSocket, 5000);
    };
}

function formatAndPrintLog(rawLog) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false });
    
    // Regex đọc dữ liệu: [GET] /api/abc - Status: 200 - IP: 127.0.0.1 - Time: 12.3ms
    const regex = /\[([A-Z]+)\]\s+(.*?)\s+-\s+Status:\s+(\d+)\s+-\s+IP:\s+(.*?)(?:\s+-\s+Time:\s+(.*?ms))?(?:\s+-\s+ERROR:\s+(.*))?/;
    const match = rawLog.match(regex);

    let htmlLog = "";

    if (match) {
        const method = match[1];
        const path = match[2];
        const status = parseInt(match[3]);
        const ip = match[4];
        const procTime = match[5] || "";
        const errorMsg = match[6] || "";

        // Tô màu Mã trạng thái
        let statusColor = "text-green-400"; 
        if (status >= 300) statusColor = "text-blue-400"; 
        if (status >= 400) statusColor = "text-yellow-400 font-bold"; 
        if (status >= 500) statusColor = "text-red-500 font-black bg-red-500/20 px-1 rounded shadow-[0_0_10px_red]"; 

        // Tô màu Method
        let methodColor = "text-purple-400";
        if (method === "POST") methodColor = "text-orange-400";
        if (method === "DELETE") methodColor = "text-red-400";

        const timeHtml = procTime ? `<span class="text-gray-500">|</span> <span class="text-pink-400 text-[10px]"><i class="fa-solid fa-stopwatch mr-1"></i>${procTime}</span>` : '';
        const errHtml = errorMsg ? `<br><span class="text-red-500 text-[11px] ml-4">↳ Chi tiết lỗi: ${errorMsg}</span>` : '';

        htmlLog = `<span class="text-gray-500">[${timeStr}]</span> <span class="${methodColor} font-bold">[${method}]</span> <span class="text-gray-200">${path}</span> <span class="text-gray-500">|</span> <span class="${statusColor}">HTTP ${status}</span> <span class="text-gray-500">|</span> <span class="text-cyan-400 font-mono text-[11px]"><i class="fa-solid fa-location-crosshairs mr-1"></i>${ip}</span> ${timeHtml} ${errHtml}`;
    } else {
        htmlLog = `<span class="text-gray-500">[${timeStr}]</span> <span class="text-gray-300">${rawLog}</span>`;
    }

    appendTerminalLine(htmlLog);
}

function appendTerminalLine(htmlContent, extraClasses = "") {
    const termBox = document.getElementById('terminal-output');
    if (!termBox) return;

    const div = document.createElement('div');
    div.className = `mb-1 tracking-wide ${extraClasses}`;
    div.innerHTML = htmlContent;
    
    termBox.appendChild(div);
    logCount++;

    if (logCount > MAX_LOG_LINES) {
        termBox.removeChild(termBox.firstChild);
        logCount--;
    }
    termBox.scrollTop = termBox.scrollHeight;
}

// CÁC NÚT ĐIỀU KHIỂN TRÊN GIAO DIỆN TERMINAL
window.toggleTerminalPause = function() {
    isTerminalPaused = !isTerminalPaused;
    const btn = document.getElementById('btn-term-pause');
    if (isTerminalPaused) {
        btn.innerHTML = '<i class="fa-solid fa-play text-green-400"></i>';
        btn.classList.add('bg-green-500/20', 'border-green-500/50');
        appendTerminalLine(`[SYSTEM] Radar đã tạm dừng.`, "text-yellow-400 italic");
    } else {
        btn.innerHTML = '<i class="fa-solid fa-pause text-yellow-400"></i>';
        btn.classList.remove('bg-green-500/20', 'border-green-500/50');
        appendTerminalLine(`[SYSTEM] Radar tiếp tục bắt sóng.`, "text-green-400 italic");
    }
}

window.clearTerminal = function() {
    const termBox = document.getElementById('terminal-output');
    if (termBox) {
        termBox.innerHTML = '';
        logCount = 0;
        appendTerminalLine(`[SYSTEM] Đã dọn dẹp bộ nhớ đệm màn hình.`, "text-gray-500 italic");
    }
}