import os
import psutil
import time
from fastapi import APIRouter, Depends
from core.security import verify_token
from scripts.network_tunnel import get_tunnel_url, start_tunnel, stop_tunnel

# Nhập hàm trích xuất log và db_manager từ database
from core.database import get_request_stats, db_manager 

# 🚀 NÂNG CẤP: Import thư mục làm việc của Audio Engine
from api.audio_engine import WORKSPACE_DIR

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(verify_token)] 
)

# Khai báo kho nhạc để radar quét
MUSIC_DIR = os.path.join(WORKSPACE_DIR, "music")

# Cơ sở dữ liệu tạm (RAM) lưu trạng thái API
api_status_db = {
    "internet_tunnel": {"active": False, "description": "Đường hầm Cloudflare bảo mật", "public_url": ""},
    "chatbox_ai": {"active": True, "description": "Module Chatbot AI & Phân tích Log", "public_url": ""},
    "social_db": {"active": True, "description": "Kết nối Database MariaDB Social Hub", "public_url": ""}
}

@router.get("/system-stats")
async def get_system_stats():
    """Lấy thông số phần cứng Real-time để vẽ biểu đồ lên Dashboard"""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    ram = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    return {
        "status": "success",
        "cpu_usage_percent": cpu_percent,
        "ram": {
            "percent": ram.percent,
            "used_gb": round(ram.used / (1024**3), 2),
            "total_gb": round(ram.total / (1024**3), 2)
        },
        "storage": {
            "percent": disk.percent,
            "free_gb": round(disk.free / (1024**3), 2),
            "total_gb": round(disk.total / (1024**3), 2)
        }
    }

@router.get("/services")
async def get_services():
    """Lấy danh sách và trạng thái của các API Service"""
    if api_status_db["internet_tunnel"]["active"] and not api_status_db["internet_tunnel"]["public_url"]:
        api_status_db["internet_tunnel"]["public_url"] = get_tunnel_url()
        
    return {"status": "success", "services": api_status_db}

@router.post("/services/toggle/{service_name}")
async def toggle_service(service_name: str):
    """Bật/Tắt công tắc của một dịch vụ API"""
    if service_name in api_status_db:
        current_state = api_status_db[service_name]["active"]
        new_state = not current_state
        api_status_db[service_name]["active"] = new_state
        
        if service_name == "internet_tunnel":
            if new_state:
                start_tunnel()
                for _ in range(15):
                    time.sleep(0.2)
                    url = get_tunnel_url()
                    if url:
                        api_status_db["internet_tunnel"]["public_url"] = url
                        break
            else:
                stop_tunnel()
                api_status_db["internet_tunnel"]["public_url"] = ""
                
        return {
            "status": "success", 
            "message": f"Đã {'BẬT' if new_state else 'TẮT'} dịch vụ {service_name}", 
            "service": service_name, 
            "active": new_state
        }
    
    return {"status": "error", "message": "Dịch vụ không tồn tại trong hệ thống."}

@router.get("/analytics")
async def get_traffic_analytics():
    """Cung cấp dữ liệu Log thực tế để vẽ biểu đồ Traffic Chart"""
    try:
        stats = get_request_stats()
        return {"status": "success", "data": stats["timeline"]}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ==========================================
# API Thống kê Tracking Bio
# ==========================================
@router.get("/bio-stats")
async def get_bio_stats():
    """Lấy dữ liệu Tracking ngầm từ MariaDB cho Link-in-Bio"""
    if not getattr(db_manager, "connection", None):
        return {"status": "error", "message": "Mất kết nối tới MariaDB"}

    try:
        cursor = db_manager.connection.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM bio_tracking")
        total_clicks = cursor.fetchone()[0]

        cursor.execute("""
            SELECT platform, COUNT(*) as count 
            FROM bio_tracking 
            GROUP BY platform 
            ORDER BY count DESC
        """)
        platforms = [{"name": row[0], "count": row[1]} for row in cursor.fetchall()]

        cursor.execute("""
            SELECT link_id, platform, ip_address, clicked_at 
            FROM bio_tracking 
            ORDER BY clicked_at DESC 
            LIMIT 10
        """)
        recent_clicks = [
            {
                "link_id": row[0],
                "platform": row[1],
                "ip_address": row[2],
                "time": row[3].strftime("%H:%M - %d/%m/%Y") if row[3] else "Unknown"
            }
            for row in cursor.fetchall()
        ]
        cursor.close()

        return {
            "status": "success",
            "total_clicks": total_clicks,
            "platform_stats": platforms,
            "recent_history": recent_clicks
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ==========================================
# 🚀 NÂNG CẤP MỚI: THEO DÕI HÀNG ĐỢI AI (MUSIC HUB)
# ==========================================
@router.get("/tasks")
async def get_active_tasks():
    """Quét các thư mục ngầm để báo cáo tiến trình xử lý AI"""
    tasks = []
    if not os.path.exists(MUSIC_DIR):
        return {"status": "success", "tasks": tasks}
        
    for folder_name in os.listdir(MUSIC_DIR):
        folder_path = os.path.join(MUSIC_DIR, folder_name)
        if not os.path.isdir(folder_path): continue
        
        # Kiểm tra xem bài hát đã hoàn thành cả 3 tài nguyên gốc chưa (mp3, beat, lrc)
        final_mp3 = os.path.join(folder_path, f"{folder_name}.mp3")
        final_beat = os.path.join(folder_path, f"{folder_name}_beat.mp3")
        final_lrc = os.path.join(folder_path, f"{folder_name}.lrc")
        
        is_complete = os.path.exists(final_mp3) and os.path.exists(final_beat) and os.path.exists(final_lrc)
        
        if is_complete:
            continue # Bài nào xong rồi thì loại khỏi Radar hàng đợi
            
        # Xác định AI đang chạy công đoạn nào dựa vào file tạm thời
        status = "Đang xử lý..."
        progress = 10
        color = "blue"
        
        temp_demucs = os.path.join(WORKSPACE_DIR, f"temp_demucs_{folder_name}")
        temp_whisper = os.path.join(WORKSPACE_DIR, f"temp_whisper_{folder_name}")
        converted_mp3 = os.path.join(folder_path, f"{folder_name}_converted.mp3")
        
        if os.path.exists(temp_whisper):
            status = "🤖 Đang nghe & viết lời (Whisper AI)"
            progress = 80
            color = "purple"
        elif os.path.exists(temp_demucs):
            status = "🎵 Đang bóc tách Beat (Demucs AI)"
            progress = 40
            color = "orange"
        elif os.path.exists(converted_mp3):
            status = "⏳ Đang chuẩn bị phôi Audio (FFmpeg)"
            progress = 20
            color = "blue"
        else:
            status = "📥 Đang tải tài nguyên gốc"
            progress = 5
            color = "gray"
            
        tasks.append({
            "id": folder_name,
            "title": folder_name,
            "status": status,
            "progress": progress,
            "color": color
        })
        
    return {"status": "success", "tasks": tasks}