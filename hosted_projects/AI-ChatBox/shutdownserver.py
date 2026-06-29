import os
import subprocess
import time

def shutdown_manual():
    print("=== CÔNG CỤ TẮT SERVER & OLLAMA CHỦ ĐỘNG ===")

    # 1. Tắt tiến trình Ollama
    print("\n[1/2] Đang dọn dẹp tiến trình Ollama...")
    try:
        # Sử dụng pkill để ngắt dứt điểm mọi tiến trình ngầm của ollama
        subprocess.run(["pkill", "-f", "ollama"], check=False)
        print("=> Đã dọn dẹp Ollama thành công.")
    except Exception as e:
        print(f"=> Lỗi khi tắt Ollama: {str(e)}")

    time.sleep(1) # Nghỉ 1 nhịp để hệ thống xả memory

    # 2. Tắt Flask Server (Chỉ nhắm vào Port 25152)
    print("\n[2/2] Đang dọn dẹp Flask Server tại Port 25152...")
    port = 25152
    try:
        # Cách 1: Dùng fuser (Rất mạnh và phổ biến trên môi trường Linux)
        result = subprocess.run(["fuser", "-k", f"{port}/tcp"], capture_output=True, text=True)
        
        # Cách 2: Nếu môi trường không có fuser, dự phòng bằng lsof + kill
        if result.returncode != 0:
            try:
                lsof_result = subprocess.check_output(f"lsof -t -i:{port}", shell=True)
                pids = lsof_result.decode('utf-8').strip().split('\n')
                for pid in pids:
                    if pid:
                        os.system(f"kill -9 {pid}")
                print(f"=> Đã giải phóng port {port} thành công.")
            except subprocess.CalledProcessError:
                 print(f"=> Không tìm thấy tiến trình nào đang chạy ở port {port} (Server có thể đã tắt).")
        else:
            print(f"=> Đã giải phóng port {port} thành công.")
            
    except Exception as e:
        print(f"=> Có lỗi xảy ra khi dọn dẹp port {port}: {str(e)}")

    print("\n=== HOÀN TẤT! HỆ THỐNG ĐÃ ĐƯỢC TẮT TOÀN BỘ ===")

if __name__ == '__main__':
    shutdown_manual()