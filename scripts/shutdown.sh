#!/bin/bash
# Lưu file với tên: shutdown.sh

echo "🛑 ĐANG TẮT UBUNTU BACKEND CORE..."

# Tìm và ép buộc dừng tất cả tiến trình mang tên "python3 main.py"
pkill -f "python3 main.py"

if [ $? -eq 0 ]; then
    echo "✅ Đã tắt máy chủ thành công!"
    echo "🔌 Cổng 16868 đã được giải phóng."
else
    echo "⚠️ Máy chủ đang không hoạt động. Không có gì để tắt."
fi

# Tắt luôn cả đường hầm Cloudflare nếu đang chạy ngầm
pkill -f cloudflared
echo "☁️ Đã dọn dẹp kết nối mạng."