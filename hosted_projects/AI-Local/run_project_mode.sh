#!/bin/bash

# Định nghĩa WORKSPACE_DIR tương đối so với vị trí của script
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
LOCAL_AGENT_PATH="$SCRIPT_DIR/local_agent.py"
WORKSPACE_DIR="$SCRIPT_DIR/workspace"

echo "==============================================="
echo "       LOCAL AI AUTONOMOUS CODER - PROJECT MODE"
echo "==============================================="

# Kiểm tra và dọn dẹp thư mục workspace
if [ -d "$WORKSPACE_DIR" ]; then
    echo "⚠️  Thư mục workspace '$WORKSPACE_DIR' đã tồn tại."
    read -p "Bạn có muốn xóa toàn bộ nội dung cũ và tạo mới không? (y/N): " -n 1 -r
    echo # (Dòng mới)
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        echo "🗑️  Đang xóa nội dung cũ..."
        rm -rf "$WORKSPACE_DIR"
        mkdir -p "$WORKSPACE_DIR"
        echo "✅ Đã tạo thư mục workspace mới sạch."
    else
        echo "➡️  Giữ lại thư mục workspace hiện có. AI sẽ tạo file mới trong đó."
    fi
else
    echo "📁 Đang tạo thư mục workspace mới: '$WORKSPACE_DIR'"
    mkdir -p "$WORKSPACE_DIR"
    echo "✅ Thư mục workspace đã sẵn sàng."
fi

# Yêu cầu người dùng nhập tác vụ
read -p "✍️  Nhập yêu cầu của bạn cho dự án (VD: Tạo một dự án React cơ bản): " user_task

if [ -z "$user_task" ]; then
    echo "❌ Yêu cầu không được để trống. Hủy bỏ."
    exit 1
fi

echo "" # Dòng trống cho dễ đọc
echo "🚀 Đang khởi chạy AI để tạo dự án của bạn..."

# Chạy local_agent.py và truyền các lựa chọn mode + tác vụ
# Sử dụng 'printf' để truyền các dòng input riêng biệt cho Python script
printf "4\n%s\n" "$user_task" | python3 "$LOCAL_AGENT_PATH"

echo "✨ Quá trình tạo dự án đã hoàn tất (kiểm tra thư mục '$WORKSPACE_DIR')."
echo "==============================================="