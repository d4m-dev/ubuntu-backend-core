@echo off
echo QLChiTieu.com - Ứng dụng Quản Lý Chi Tiêu Cá Nhân
echo ===============================================

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Dang khoi dong server voi Python...
    python -m http.server 8080
) else (
    echo Khong tim thay Python de chay server.
    echo Vui long mo file index.html truc tiep trong trinh duyet.
    pause
)