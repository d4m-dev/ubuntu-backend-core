// ==========================================
// TRAFFIC CHART CORE
// ==========================================
let trafficChart;
const canvas = document.getElementById('trafficChart');

function initChart() {
    if(!canvas) return; // Safe Check
    const ctx = canvas.getContext('2d');
    
    // Tạo hiệu ứng Gradient mượt mà cho biểu đồ
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
                tension: 0.4, // Đường cong mượt
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
            animation: { duration: 400 } // Rút ngắn animation để mượt hơn
        }
    });
}

// Hàm gọi API lấy dữ liệu log thực tế
async function updateTrafficChart() {
    const token = localStorage.getItem("d4m_sso_token");
    if (!token || !trafficChart) return;

    try {
        const response = await fetch('/api/dashboard/analytics', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.status === "success" && result.data.length > 0) {
                trafficChart.data.labels = result.data.map(item => item.time);
                trafficChart.data.datasets[0].data = result.data.map(item => item.count);
                trafficChart.update('none'); // Update không có hiệu ứng render lại
            }
        }
    } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    // Quét biểu đồ 1 giây / lần cho an toàn, tránh Spam Backend quá đà
    if(canvas) setInterval(updateTrafficChart, 1000); 
});
