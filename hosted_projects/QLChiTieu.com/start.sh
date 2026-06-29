#!/bin/bash
# Script to start the QLChiTieu.com application

echo "QLChiTieu.com - Ứng dụng Quản Lý Chi Tiêu Cá Nhân"
echo "==============================================="

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "Đang khởi động server với Python..."
    python3 -m http.server 8080
elif command -v php &> /dev/null; then
    echo "Đang khởi động server với PHP..."
    php -S localhost:8080
else
    echo "Không tìm thấy Python hoặc PHP để chạy server."
    echo "Vui lòng mở file index.html trực tiếp trong trình duyệt."
fi