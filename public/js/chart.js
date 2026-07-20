// ==========================================
// TRAFFIC CHART CORE - RADAR PRO VIP (FIXED)
// ==========================================
let trafficChart;

function initChart() {
    const canvas = document.getElementById('trafficChart');
    if(!canvas) return; 

    // Bắt đầu vẽ khi kích thước đã được hệ thống xác định rõ ràng
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(236, 72, 153, 0.5)'); // Pink-500
    gradient.addColorStop(1, 'rgba(236, 72, 153, 0.0)');

    trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['--:--', '--:--', '--:--', '--:--', '--:--', '--:--', '--:--'],
            datasets: [{
                label: ' Requests/min',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#ec4899', 
                backgroundColor: gradient,
                borderWidth: 2,
                tension: 0.4, 
                fill: true,
                pointBackgroundColor: '#0b0f19',
                pointBorderColor: '#ec4899',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#fff', bodyColor: '#ec4899', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, displayColors: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false }, ticks: { color: 'rgba(255, 255, 255, 0.4)', stepSize: 5 } },
                x: { grid: { display: false, drawBorder: false }, ticks: { color: 'rgba(255, 255, 255, 0.4)', maxRotation: 0 } }
            },
            animation: { duration: 400 } 
        }
    });
}

async function updateTrafficChart() {
    const token = localStorage.getItem("d4m_sso_token") || localStorage.getItem("token") || localStorage.getItem("ubuntu_token");
    if (!token || !trafficChart) return;

    try {
        const response = await fetch('/api/dashboard/analytics', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.status === "success" && result.data) {
                // Auto-detect dữ liệu từ Backend
                if (Array.isArray(result.data) && result.data.length > 0) {
                    trafficChart.data.labels = result.data.map(item => item.time || item.label || '--:--');
                    trafficChart.data.datasets[0].data = result.data.map(item => item.count || item.value || 0);
                    trafficChart.update('none'); 
                } else if (result.data.labels && result.data.values) {
                    trafficChart.data.labels = result.data.labels;
                    trafficChart.data.datasets[0].data = result.data.values;
                    trafficChart.update('none');
                }
            }
        }
    } catch (e) {
        console.warn("Đang đợi Backend Analytics thu thập dữ liệu...");
    }
}

// 🚀 FIX LỖI TÀNG HÌNH BẰNG OBSERVER: Đợi UI bung ra mới khởi tạo Chart.js
document.addEventListener('DOMContentLoaded', () => {
    let checkUIReady = setInterval(() => {
        const canvas = document.getElementById('trafficChart');
        
        // offsetParent !== null nghĩa là UI đã vượt qua ải Login SSO và hiện lên màn hình
        if (canvas && canvas.offsetParent !== null) {
            clearInterval(checkUIReady); // Xóa vòng lặp chờ
            initChart();                 // Bắt đầu vẽ khung
            updateTrafficChart();        // Bơm dữ liệu đợt 1
            setInterval(updateTrafficChart, 5000); // Lặp lại bơm dữ liệu mỗi 5s
        }
    }, 200); // Rà radar 0.2s một lần
});