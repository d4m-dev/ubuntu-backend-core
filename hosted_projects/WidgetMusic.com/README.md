# 🎵 Widget Music

[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://d4m-dev.github.io/WidgetMusic.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Widget Music** là một trình phát nhạc widget đẹp mắt, dễ dàng tích hợp vào bất kỳ website nào chỉ với một dòng code. Widget được thiết kế responsive, hiện đại và tối ưu cho cả desktop lẫn mobile.

## 🌟 Demo

**🔗 Xem demo trực tiếp:** [Tại đây](https://d4m-dev.github.io/WidgetMusic.com/)

**📱 Trang giới thiệu & trải nghiệm:** [Tại đây](https://d4m-dev.github.io/WidgetMusic.com/demo.html)

## ✨ Tính năng

- 🎧 **Giao diện đẹp mắt** - Thiết kế hiện đại, gradient màu sắc bắt mắt
- 📱 **Responsive** - Hoạt động hoàn hảo trên mọi thiết bị (Desktop, Tablet, Mobile)
- 🚀 **Dễ tích hợp** - Chỉ cần 1 dòng code để thêm vào website
- 🎵 **Playlist** - Hỗ trợ danh sách phát nhiều bài hát
- 📝 **Hiển thị lyrics** - Xem lời bài hát đồng bộ
- ⚡ **Hiệu suất cao** - Tải nhanh, không làm chậm website
- 🎨 **Tùy chỉnh** - Có thể tùy chỉnh nguồn widget theo nhu cầu

## 🔧 Cách sử dụng

### Cách 1: Sử dụng trực tiếp (Đơn giản nhất)

Thêm đoạn code sau vào file HTML của bạn:

```html
<html>
  <script src="https://d4m-dev.github.io/WidgetMusic.com/music-loader.js"></script>
</html>
```

### Cách 2: Tùy chỉnh nguồn widget

Nếu bạn muốn sử dụng widget từ nguồn khác, thêm thuộc tính `data-source`:

```html
<html>
  <script 
    src="https://d4m-dev.github.io/WidgetMusic.com/music-loader.js"
    data-source="https://your-custom-source.com/">
  </script>
</html>
```

### Ví dụ hoàn chỉnh

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website with Music Widget</title>
</head>
<body>
    <h1>Welcome to my website!</h1>
    <p>Enjoy the music widget below:</p>
    
    <!-- Widget Music -->
    <script src="https://d4m-dev.github.io/WidgetMusic.com/music-loader.js"></script>
</body>
</html>
```

## 📂 Cấu trúc dự án

```
WidgetMusic.com/
├── index.html           # Trang chính chứa widget music player
├── music-loader.js      # Script loader để tích hợp widget
├── demo.html           # Trang demo & giới thiệu dự án
└── README.md           # Tài liệu hướng dẫn
```

## 🎯 Nguyên lý hoạt động

1. **music-loader.js** được tải vào trang web
2. Script tự động tạo một iframe chứa widget music
3. Widget được render từ **index.html** (hoặc nguồn tùy chỉnh)
4. Widget hiển thị với style responsive, tự động điều chỉnh theo kích thước màn hình

## 🎨 Tùy chỉnh

Widget sử dụng iframe để đảm bảo style độc lập và không ảnh hưởng đến website chính. Bạn có thể:

- **Tùy chỉnh vị trí:** Widget tự động căn giữa với `margin: 30px auto`
- **Tùy chỉnh kích thước:** Mặc định max-width: 400px trên desktop
- **Tùy chỉnh nguồn:** Sử dụng `data-source` để load từ URL khác

## 🛠️ Phát triển

### Clone repository

```bash
git clone https://github.com/d4m-dev/WidgetMusic.com.git
cd WidgetMusic.com
```

### Test local

1. Mở file `index.html` hoặc `demo.html` trong trình duyệt
2. Hoặc sử dụng local server:

```bash
# Python 3
python -m http.server 8000

# Sau đó truy cập: http://localhost:8000
```

### Deploy

Dự án này sử dụng GitHub Pages để deploy tự động. Mọi thay đổi push lên branch `main` sẽ được deploy tự động.

## 📱 Responsive Design

Widget tự động điều chỉnh theo kích thước màn hình:

- **Desktop (>768px):** Hiển thị đầy đủ với max-width 400px
- **Tablet (≤768px):** Tối ưu layout cho tablet
- **Mobile (≤480px):** Full-screen, tận dụng tối đa không gian

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Hãy:

1. Fork repository này
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Dự án này được phát hành dưới giấy phép MIT. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 👨‍💻 Tác giả

**d4m-dev**

- GitHub: [@d4m-dev](https://github.com/d4m-dev)
- Repository: [WidgetMusic.com](https://github.com/d4m-dev/WidgetMusic.com)

## 🙏 Nguồn & Credits

- **Dự án:** Widget Music
- **Tác giả:** d4m-dev
- **Repository:** https://github.com/d4m-dev/WidgetMusic.com
- **Demo:** https://d4m-dev.github.io/WidgetMusic.com/demo.html
- **Công nghệ:** HTML, CSS, JavaScript, GitHub Pages

## 📞 Liên hệ & Hỗ trợ

Nếu bạn gặp vấn đề hoặc có câu hỏi, hãy:

- Mở [Issue](https://github.com/d4m-dev/WidgetMusic.com/issues) trên GitHub
- Hoặc xem [Discussions](https://github.com/d4m-dev/WidgetMusic.com/discussions)

---

⭐ **Nếu bạn thấy dự án hữu ích, hãy cho một star nhé!** ⭐
