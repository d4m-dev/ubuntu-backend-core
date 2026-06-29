from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
import datetime
from core.database import db_manager

# Khởi tạo luồng Router độc lập cho tính năng Bio
router = APIRouter(
    prefix="/api/bio",
    tags=["Link-in-Bio Premium"]
)

# ==========================================
# 📦 CẤU TRÚC DỮ LIỆU ĐẦU VÀO (PAYLOADS)
# ==========================================
class NumerologyRequest(BaseModel):
    full_name: str
    birth_date: str  # Định dạng bắt buộc: DD/MM/YYYY

class TrackRequest(BaseModel):
    link_id: str     # Ví dụ: "fb_profile", "github_repo"
    platform: str    # Ví dụ: "Facebook", "GitHub"

# ==========================================
# 🧠 THUẬT TOÁN LÕI: TÍNH SỐ CHỦ ĐẠO (LIFE PATH)
# ==========================================
def calculate_life_path(dob_str: str) -> int:
    """
    Thuật toán chuẩn Pytago: Cộng dồn các con số trong ngày sinh 
    cho đến khi chỉ còn 1 chữ số (ngoại trừ các con số Master: 11, 22, 33).
    """
    try:
        d, m, y = dob_str.split('/')
        # Biến chuỗi "16092002" thành mảng các số và tính tổng
        total_sum = sum(int(digit) for digit in d + m + y if digit.isdigit())
        
        # Tiếp tục rút gọn nếu tổng > 9 và không phải Master Number
        while total_sum > 9 and total_sum not in (11, 22, 33):
            total_sum = sum(int(digit) for digit in str(total_sum))
            
        return total_sum
    except Exception:
        raise HTTPException(status_code=400, detail="Định dạng ngày sinh không hợp lệ. Vui lòng dùng DD/MM/YYYY.")

def get_numerology_analysis(life_path: int) -> dict:
    """Từ điển giải mã thần số học cơ bản"""
    analysis_db = {
        2: {"title": "Người Hòa Giải", "desc": "Trực giác cực kỳ nhạy bén, sinh ra để kết nối và thấu hiểu người khác."},
        3: {"title": "Người Truyền Cảm Hứng", "desc": "Sáng tạo, hoạt ngôn, mang lại năng lượng tích cực cho mọi người."},
        4: {"title": "Người Xây Dựng", "desc": "Thực tế, logic, có kỷ luật cao và vô cùng đáng tin cậy."},
        5: {"title": "Người Phiêu Lưu", "desc": "Yêu tự do, thích nghi nhanh, luôn tìm kiếm sự đổi mới."},
        6: {"title": "Người Chăm Sóc", "desc": "Trách nhiệm, yêu thương gia đình, giàu lòng nhân ái."},
        7: {"title": "Nhà Triết Học", "desc": "Sâu sắc, thích phân tích, tìm kiếm chân lý và sự thật."},
        8: {"title": "Nhà Điều Hành", "desc": "Độc lập, có tư duy kinh doanh và khả năng quản lý tài chính xuất sắc."},
        9: {"title": "Người Nhân Đạo", "desc": "Bao dung, lý tưởng hóa, luôn muốn cống hiến cho cộng đồng."},
        11: {"title": "Người Mơ Mộng Thực Tế (Master)", "desc": "Tiềm năng tâm linh mạnh mẽ, trực giác phi thường."},
        22: {"title": "Bậc Thầy Kiến Tạo (Master)", "desc": "Biến ước mơ lớn thành hiện thực, tầm nhìn vĩ mô."},
        33: {"title": "Bậc Thầy Chữa Lành (Master)", "desc": "Tình yêu thương vô điều kiện, sức ảnh hưởng sâu rộng."}
    }
    # Mặc định trả về Số 1 nếu không nằm trong danh sách trên
    return analysis_db.get(life_path, {"title": "Người Tiên Phong", "desc": "Độc lập, tự tin, mang tố chất của một nhà lãnh đạo bẩm sinh."})

# ==========================================
# 🚀 ENDPOINTS GIAO TIẾP VỚI FRONTEND
# ==========================================

@router.post("/calculate")
async def calculate_numerology(data: NumerologyRequest):
    """
    API Phân tích Thần số học: 
    Frontend truyền lên tên và ngày sinh, Backend trả về phân tích chuyên sâu.
    """
    life_path_number = calculate_life_path(data.birth_date)
    analysis = get_numerology_analysis(life_path_number)
    
    return {
        "status": "success",
        "data": {
            "requested_name": data.full_name,
            "dob": data.birth_date,
            "life_path_number": life_path_number,
            "traits": analysis
        }
    }

@router.post("/track")
async def track_click(data: TrackRequest, request: Request):
    """
    API Theo dõi ngầm: 
    Ghi nhận thông tin thiết bị và liên kết đã được người dùng nhấn vào.
    """
    ip_address = request.client.host
    user_agent = request.headers.get('user-agent', 'Unknown')
    
    if db_manager.connection:
        try:
            cursor = db_manager.connection.cursor()
            sql = """
                INSERT INTO bio_tracking (link_id, platform, ip_address, user_agent)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(sql, (data.link_id, data.platform, ip_address, user_agent))
            db_manager.connection.commit()
            cursor.close()
        except Exception as e:
            # Ghi log lỗi ngầm, không làm gián đoạn trải nghiệm người dùng
            print(f"Lỗi lưu tracking: {e}")
            
    return {"status": "success", "message": "Click recorded invisibly"}

@router.get("/config/{username}")
async def get_dynamic_config(username: str):
    """
    API Lấy giao diện động: 
    Giúp trang Bio có thể thay đổi màu sắc/avatar mà không cần sửa code HTML.
    """
    # Demo cấu hình giả lập. Sau này sếp có thể móc nối vào MariaDB để lấy cấu hình thật.
    return {
        "status": "success",
        "config": {
            "profile_name": "@" + username,
            "avatar_url": f"https://api.dicebear.com/7.x/adventurer/svg?seed={username}",
            "theme": {
                "background_gradient": "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                "button_style": "glassmorphism"
            },
            "links": [
                {"id": "fb_profile", "title": "Kết nối Facebook", "url": "https://facebook.com/...", "icon": "facebook"},
                {"id": "github_repo", "title": "Dự án trên GitHub", "url": "https://github.com/...", "icon": "github"}
            ]
        }
    }