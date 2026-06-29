#!/bin/bash
# Lưu file với tên: status.sh

echo "=========================================="
echo "🔍 KIỂM TRA TRẠNG THÁI UBUNTU BACKEND CORE"
echo "=========================================="

# Kiểm tra xem có tiến trình nào đang giữ cổng 16868 không
if lsof -i :16868 > /dev/null; then
    echo "✅ Trạng thái: ĐANG HOẠT ĐỘNG (ONLINE)"
    echo "🌐 Cổng giao tiếp: 16868"
    echo "------------------------------------------"
    echo "🖥️ Chi tiết tiến trình đang chạy:"
    # Tìm và in ra thông tin tiến trình chạy file main.py
    ps aux | grep "python3 main.py" | grep -v grep
else
    echo "❌ Trạng thái: ĐÃ DỪNG (OFFLINE)"
    echo "💡 Gợi ý: Chạy lệnh '~/myenv/bin/python3 main.py' để khởi động lại."
fi
echo "=========================================="