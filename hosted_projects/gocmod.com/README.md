# GocMod.com - Kho ứng dụng Mod cho Android

Website tĩnh được tạo dựa trên template từ ChiaSeApp.com

## 📁 Cấu trúc thư mục

```
gocmod.com/
├── index.html              # Trang chủ
├── category/
│   ├── games.html         # Danh mục trò chơi
│   └── apps.html          # Danh mục ứng dụng
├── app/
│   └── remini.html        # Trang chi tiết ứng dụng (mẫu)
├── assets/
│   ├── css/
│   │   ├── style.css      # CSS chính
│   │   ├── app-detail.css # CSS trang chi tiết
│   │   └── category.css   # CSS trang danh mục
│   ├── js/
│   │   ├── main.js        # JavaScript chính
│   │   ├── app-detail.js  # JS trang chi tiết
│   │   └── category.js    # JS trang danh mục
│   └── images/            # Thư mục ảnh
```

## 🚀 Cách chạy

### Cách 1: Sử dụng server.py (Đã có sẵn)

```bash
cd /storage/emulated/0/coder/media
python server.py
```

Truy cập: `http://localhost:1515/gocmod.com/`

### Cách 2: Sử dụng Python HTTP Server

```bash
cd /storage/emulated/0/coder/media/gocmod.com
python -m http.server 8000
```

Truy cập: `http://localhost:8000/`

### Cách 3: Mở trực tiếp trong trình duyệt

Mở file `index.html` trong trình duyệt

## ✨ Tính năng

- ✅ Giao diện responsive (Mobile/Desktop)
- ✅ Chế độ tối/sáng (Dark/Light Mode)
- ✅ Tìm kiếm ứng dụng
- ✅ Lọc và sắp xếp theo danh mục
- ✅ Xem dạng lưới/danh sách
- ✅ Hiệu ứng animation mượt mà
- ✅ Tương thích PWA (có thể nâng cấp)
- ✅ Tối ưu SEO cơ bản

## 🎨 Màu sắc chủ đạo

- **Primary Color**: `#17ab72` (Xanh lá)
- **Secondary Color**: `#2A99EF` (Xanh dương)
- **Accent Color**: `#FED148` (Vàng)

## 📱 Các trang chính

1. **Trang chủ** (`index.html`)
   - Hiển thị ứng dụng nổi bật
   - Trò chơi mới nhất
   - Ứng dụng mới nhất

2. **Danh mục** (`category/games.html`, `category/apps.html`)
   - Lọc theo thể loại
   - Lọc theo loại Mod
   - Sắp xếp theo nhiều tiêu chí

3. **Chi tiết ứng dụng** (`app/remini.html`)
   - Thông tin ứng dụng
   - Ảnh chụp màn hình
   - Nút tải xuống
   - Bình luận
   - Ứng dụng liên quan

## 🔧 Tùy chỉnh

### Thay đổi logo

Sửa file `index.html`, thay đổi đường dẫn logo:
```html
<img src="assets/images/logo.png" alt="GocMod.com">
```

### Thay đổi màu sắc

Sửa file `assets/css/style.css`, phần `:root`:
```css
:root {
    --primary-color: #17ab72;
    --secondary-color: #2A99EF;
    --accent-color: #FED148;
}
```

### Thêm ứng dụng mới

Sao chép cấu trúc app card trong `index.html`:
```html
<div class="app-card">
    <div class="app-card-image">
        <img src="URL_ANH" alt="TÊN_APP">
    </div>
    <div class="app-card-content">
        <h3 class="app-title">TÊN_APP</h3>
        <p class="app-meta">
            <span class="badge badge-pro">PRO</span>
            <span class="app-version">Android 5.0+</span>
        </p>
        <a href="app/ten-app.html" class="btn btn-download">
            <i class="fas fa-download"></i> Tải về
        </a>
    </div>
</div>
```

## 📝 Lưu ý

- Website ở chế độ tĩnh (static), cần backend để lưu bình luận, tìm kiếm thật
- Các link tải về cần được cấu hình thực tế
- Ảnh minh họa sử dụng placeholder, cần thay bằng ảnh thật

## 🛠️ Nâng cấp (Gợi ý)

- [ ] Thêm backend (Node.js/Python/PHP)
- [ ] Tích hợp database (MySQL/MongoDB)
- [ ] Thêm chức năng đăng nhập/đăng ký
- [ ] Upload và quản lý file APK
- [ ] Thống kê lượt tải
- [ ] Comment system thực tế
- [ ] Tìm kiếm Elasticsearch
- [ ] CDN cho file tĩnh
- [ ] PWA với service worker
- [ ] Push notifications

## 📄 License

Sử dụng cho mục đích học tập và nghiên cứu.

## 👤 Tác giả

Tạo bởi Qwen Code dựa trên template ChiaSeApp.com

---
**GocMod.com** - Kho ứng dụng Mod cho Android miễn phí, an toàn và tốc độ!
