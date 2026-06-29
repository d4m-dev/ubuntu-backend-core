// Khởi tạo Biểu đồ Lưu lượng Truy cập (Traffic Chart)
let trafficChart;
const ctx = document.getElementById('trafficChart').getContext('2d');

// Tạo hiệu ứng Gradient mượt mà cho biểu đồ
const gradient = ctx.createLinearGradient(0, 0, 0, 400);
gradient.addColorStop(0, 'rgba(236, 72, 153, 0.5)'); // Pink-500
gradient.addColorStop(1, 'rgba(236, 72, 153, 0.0)');

function initChart() {
    trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['--:--', '--:--', '--:--', '--:--', '--:--', '--:--', '--:--'],
            datasets: [{
                label: ' Requests/min',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#ec4899', // Pink-500
                backgroundColor: gradient,
                borderWidth: 2,
                tension: 0.4, // Tạo đường cong mượt (Bezier)
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
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#ec4899',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.4)', stepSize: 5 }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.4)', maxRotation: 0 }
                }
            },
            // Giảm duration để biểu đồ update mượt hơn khi chạy tốc độ cao
            animation: { duration: 400 } 
        }
    });
}

// Hàm gọi API lấy dữ liệu log thực tế
async function updateTrafficChart() {
    // Không chạy nếu chưa có token đăng nhập
    if (!localStorage.getItem("backend_token")) return;

    try {
        const response = await fetch('/api/dashboard/analytics', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("backend_token")}` }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.status === "success" && result.data.length > 0) {
                // Tách thời gian và số lượng request ra 2 mảng riêng biệt
                const labels = result.data.map(item => item.time);
                const counts = result.data.map(item => item.count);

                // Cập nhật vào chart
                trafficChart.data.labels = labels;
                trafficChart.data.datasets[0].data = counts;
                trafficChart.update('none'); // Update không có hiệu ứng render lại toàn bộ để đỡ giật
            }
        }
    } catch (e) {
        console.error("Lỗi cập nhật biểu đồ:", e);
    }
}

// Khởi chạy khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    
    // 🚀 CẬP NHẬT TỐC ĐỘ CAO (500ms = 0.5 giây) ĐỂ TEST
    // Khi test xong, nếu muốn giảm tải cho máy chủ, sếp đổi 500 thành 3000 nhé!
    setInterval(updateTrafficChart, 500);
});