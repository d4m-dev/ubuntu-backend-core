# QLChiTieu.com - Ứng dụng Quản Lý Chi Tiêu Cá Nhân

## Giới thiệu
QLChiTieu.com là một ứng dụng web Single Page Application (SPA) giúp người dùng quản lý chi tiêu cá nhân một cách hiệu quả. Ứng dụng cung cấp các tính năng như theo dõi giao dịch, phân tích chi tiêu theo danh mục, thiết lập ngân sách và xuất dữ liệu.

## Tính năng nổi bật
- **Giao diện hiện đại**: Thiết kế theo phong cách Dark Mode với hiệu ứng Glassmorphism
- **Quản lý giao dịch**: Thêm, sửa, xóa giao dịch (số tiền, danh mục, ngày tháng, ghi chú)
- **Phân tích chi tiêu**: Biểu đồ tròn hiển thị tỷ lệ chi tiêu theo danh mục
- **Phân loại thời gian**: Xem theo ngày, tuần, tháng, năm
- **Lưu trữ dữ liệu**: Sử dụng localStorage để lưu dữ liệu người dùng
- **Thiết lập ngân sách**: Cảnh báo khi sắp vượt quá hạn mức chi tiêu
- **Tìm kiếm và lọc**: Tìm kiếm giao dịch theo từ khóa hoặc danh mục
- **Xuất dữ liệu**: Xuất giao dịch ra file CSV
- **Widget tỷ giá**: Hiển thị tỷ giá ngoại tệ (USD, EUR, JPY)

## Công nghệ sử dụng
- HTML5 (Semantic Elements)
- CSS3 (Variables, Flexbox, Grid, Glassmorphism)
- Vanilla JavaScript (ES6+)
- Chart.js (Biểu đồ thống kê)
- localStorage (Lưu trữ dữ liệu cục bộ)

## Cấu trúc thư mục
```
QLChiTieu.com/
├── index.html          # Trang chủ ứng dụng (redirect to src)
├── src/                # Thư mục nguồn
│   ├── index.html      # Trang chủ ứng dụng
│   ├── styles.css      # Định dạng giao diện
│   ├── app.js          # Logic ứng dụng
│   └── demo.html       # Phiên bản demo độc lập
├── package.json        # Dependencies
├── server.js           # Server script
├── start.sh            # Script khởi động (Linux/Mac)
├── start.bat           # Script khởi động (Windows)
└── README.md          # Tài liệu hướng dẫn
```

## Cài đặt và chạy
1. Mở file `index.html` trong trình duyệt web
2. Ứng dụng sẽ tự động chạy mà không cần máy chủ

## Hướng dẫn sử dụng
### Thêm giao dịch mới
1. Nhấn vào nút "Thêm giao dịch"
2. Nhập số tiền, chọn danh mục, chọn ngày và thêm ghi chú (nếu có)
3. Nhấn "Lưu" để hoàn tất

### Xem theo thời gian
- Sử dụng các tab "Hôm nay", "Tuần này", "Tháng này", "Năm nay" để xem giao dịch theo khoảng thời gian tương ứng

### Thiết lập ngân sách
1. Nhập số tiền ngân sách hàng tháng vào ô "Nhập hạn mức"
2. Nhấn "Đặt hạn mức" để lưu
3. Theo dõi tiến độ chi tiêu qua thanh tiến trình

### Tìm kiếm và lọc
- Sử dụng ô tìm kiếm để tìm giao dịch theo từ khóa
- Chọn danh mục trong dropdown để lọc theo danh mục cụ thể

### Xuất dữ liệu
- Nhấn "Xuất CSV" để tải về file CSV chứa tất cả giao dịch

## Cấu trúc dữ liệu
Mỗi giao dịch có cấu trúc:
```javascript
{
  id: number,           // ID duy nhất
  amount: number,       // Số tiền (âm nếu là chi tiêu, dương nếu là thu nhập)
  category: string,     // Danh mục (food, transport, shopping, v.v.)
  date: string,         // Ngày (YYYY-MM-DD)
  note: string,         // Ghi chú (tùy chọn)
  type: string          // Loại (expense hoặc income)
}
```

## Responsive Design
Ứng dụng được thiết kế đáp ứng trên cả desktop và mobile, với các điểm ngắt responsive tại:
- Desktop: 1200px (max-width container)
- Tablet: 768px
- Mobile: 480px

## Tùy chỉnh giao diện
Giao diện sử dụng CSS Variables để dễ dàng tùy chỉnh màu sắc:
- `--bg-primary`: Màu nền chính (#0f0f0f)
- `--primary-color`: Màu chính (#2962ff)
- `--success-color`: Màu thành công (#4caf50)
- `--warning-color`: Màu cảnh báo (#ff9800)
- `--danger-color`: Màu lỗi (#f44336)

## Bảo trì và phát triển
Ứng dụng được xây dựng với kiến trúc lớp rõ ràng, sử dụng class JavaScript để quản lý trạng thái và logic. Dễ dàng mở rộng thêm tính năng trong tương lai.

## Giấy phép
Dự án này được phân phối dưới giấy phép MIT.