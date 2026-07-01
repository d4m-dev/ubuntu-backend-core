import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Query
from core.security import verify_token  # Đảm bảo đường dẫn này khớp với dự án của sếp

router = APIRouter(prefix="/api/admin", tags=["Admin Upload"])

# Thiết lập đường dẫn động linh hoạt, tự nhận diện thư mục gốc
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_WORKSPACE = os.path.join(BASE_DIR, "audio_workspace", "music")
IMAGES_WORKSPACE = os.path.join(BASE_DIR, "images_workspace")

def get_file_extension(filename: str):
    return os.path.splitext(filename)[1]

# ---------------------------------------------------------
# API 1: Kiểm tra chi tiết thư mục và file tồn tại
# ---------------------------------------------------------
@router.get("/check-folder", dependencies=[Depends(verify_token)])
async def check_folder_exists(
    folder_type: str = Query(...), 
    name: str = Query(...)
):
    """Kiểm tra xem thư mục nhạc/ảnh đã tồn tại chưa và soi chi tiết từng file bên trong"""
    file_status = {}
    
    if folder_type == "music":
        target_dir = os.path.join(AUDIO_WORKSPACE, name)
        exists = os.path.exists(target_dir) and os.path.isdir(target_dir)
        
        # Nếu thư mục có tồn tại, quét xem bên trong có các file nào
        if exists:
            file_status["audio"] = os.path.exists(os.path.join(target_dir, f"{name}.mp3"))
            file_status["beat"] = os.path.exists(os.path.join(target_dir, f"{name}_beat.mp3"))
            file_status["video"] = os.path.exists(os.path.join(target_dir, f"{name}.mp4"))
            file_status["lyric"] = os.path.exists(os.path.join(target_dir, f"{name}.lrc"))
            
            # Ảnh bìa có thể là jpg, png, jpeg... nên phải kiểm tra mảng
            cover_exists = any(os.path.exists(os.path.join(target_dir, f"{name}{ext}")) for ext in [".jpg", ".png", ".jpeg", ".webp"])
            file_status["cover"] = cover_exists
            
    elif folder_type == "image":
        target_dir = os.path.join(IMAGES_WORKSPACE, name)
        exists = os.path.exists(target_dir) and os.path.isdir(target_dir)
    else:
        raise HTTPException(status_code=400, detail="Loại thư mục không hợp lệ")
    
    return {
        "status": "success", 
        "exists": exists, 
        "name": name, 
        "files": file_status # Trả về tình trạng chi tiết 5 file
    }



# ---------------------------------------------------------
# API 2: Upload Nhạc (Trọn bộ 5 file)
# ---------------------------------------------------------
@router.post("/upload-music", dependencies=[Depends(verify_token)])
async def upload_music(
    base_name: str = Form(...),
    audio: Optional[UploadFile] = File(None),
    beat: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
    cover: Optional[UploadFile] = File(None),
    lyric: Optional[UploadFile] = File(None)
):
    """Xử lý tải lên 5 file nhạc và tự động đổi tên theo base_name"""
    
    target_dir = os.path.join(AUDIO_WORKSPACE, base_name)
    os.makedirs(target_dir, exist_ok=True) # Tự tạo nếu chưa có, cho phép nếu đã có
    
    saved_files = []

    # Định nghĩa quy tắc tự động đổi tên
    file_mappings = {
        "audio": (audio, f"{base_name}"),           
        "beat": (beat, f"{base_name}_beat"),        
        "video": (video, f"{base_name}"),           
        "cover": (cover, f"{base_name}"),           
        "lyric": (lyric, f"{base_name}")            
    }

    for key, (file_obj, new_name_without_ext) in file_mappings.items():
        if file_obj:
            ext = get_file_extension(file_obj.filename)
            final_filename = f"{new_name_without_ext}{ext}"
            file_path = os.path.join(target_dir, final_filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file_obj.file, buffer)
            saved_files.append(final_filename)

    if not saved_files:
        raise HTTPException(status_code=400, detail="Không có file nào được tải lên!")

    return {"status": "success", "message": f"Đã lưu/ghi đè thành công {len(saved_files)} file vào thư mục '{base_name}'"}


# ---------------------------------------------------------
# API 3: Upload Ảnh (Hàng loạt & Tự động tăng ID)
# ---------------------------------------------------------
@router.post("/upload-images", dependencies=[Depends(verify_token)])
async def upload_images(
    folder_name: str = Form(...),
    images: List[UploadFile] = File(...)
):
    """Xử lý tải ảnh hàng loạt, tự động đếm và tăng ID nối tiếp"""
    
    target_dir = os.path.join(IMAGES_WORKSPACE, folder_name)
    os.makedirs(target_dir, exist_ok=True)
    
    # Đếm số file ảnh đang có sẵn trong thư mục để cấp ID tiếp theo (Cộng dồn)
    existing_files = len([name for name in os.listdir(target_dir) if os.path.isfile(os.path.join(target_dir, name))])
    current_id = existing_files + 1
    
    saved_count = 0
    for img in images:
        ext = get_file_extension(img.filename)
        
        # Đặt tên file logic
        if len(images) == 1 and existing_files == 0:
            final_name = f"{folder_name}{ext}"
        else:
            final_name = f"{folder_name}_images_{current_id}{ext}"
            
        file_path = os.path.join(target_dir, final_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(img.file, buffer)
            
        current_id += 1
        saved_count += 1
        
    return {"status": "success", "message": f"Đã tải lên và đổi tên {saved_count} ảnh vào thư mục '{folder_name}'"}
