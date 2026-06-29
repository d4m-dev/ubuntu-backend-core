import pymysql
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.database import db_manager

router = APIRouter(
    prefix="/api/social",
    tags=["Social Hub DB"]
)

class UserCreate(BaseModel):
    username: str
    fullname: str
    avatar_url: str = "https://via.placeholder.com/150"

class PostCreate(BaseModel):
    user_id: int
    content: str
    attached_media: Optional[str] = None
    media_type: Optional[str] = None

@router.post("/users")
async def create_user(user: UserCreate):
    """Tạo người dùng khách vãng lai"""
    conn = db_manager.get_connection()
    if not conn: raise HTTPException(status_code=500, detail="Mất kết nối DB")
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO users (username, fullname, avatar_url) VALUES (%s, %s, %s)"
            cursor.execute(sql, (user.username, user.fullname, user.avatar_url))
            new_id = cursor.lastrowid
        conn.commit()
        return {
            "status": "success", 
            "message": "Đã tạo người dùng", 
            "user_id": new_id, 
            "username": user.username, 
            "fullname": user.fullname, 
            "avatar_url": user.avatar_url
        }
    except pymysql.err.IntegrityError:
        raise HTTPException(status_code=400, detail="Username đã tồn tại trên hệ thống")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
async def get_all_users():
    conn = db_manager.get_connection()
    if not conn: raise HTTPException(status_code=500, detail="Mất kết nối DB")
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT id, username, fullname, avatar_url, created_at FROM users ORDER BY id DESC LIMIT 50")
            return {"status": "success", "data": cursor.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/posts")
async def create_post(post: PostCreate):
    conn = db_manager.get_connection()
    if not conn: raise HTTPException(status_code=500, detail="Mất kết nối DB")
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO posts (user_id, content, attached_media, media_type) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (post.user_id, post.content, post.attached_media, post.media_type))
            post_id = cursor.lastrowid
        conn.commit()
        return {"status": "success", "message": "Đăng bài thành công", "post_id": post_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn: {str(e)}")

# 🚀 NÂNG CẤP PHÂN QUYỀN XÓA BÀI
@router.delete("/posts/{post_id}")
async def delete_post(post_id: int, user_id: int):
    conn = db_manager.get_connection()
    if not conn: raise HTTPException(status_code=500, detail="Mất kết nối DB")
    try:
        with conn.cursor() as cursor:
            # Nếu là Admin (user_id = 1), xóa thẳng tay không cần hỏi. Khách thì chỉ xóa được bài của mình.
            if user_id == 1:
                cursor.execute("DELETE FROM posts WHERE id = %s", (post_id,))
            else:
                cursor.execute("DELETE FROM posts WHERE id = %s AND user_id = %s", (post_id, user_id))
            affected = cursor.rowcount
        conn.commit()
        if affected == 0:
            return {"status": "error", "message": "Không tìm thấy bài viết hoặc bạn không có quyền xóa"}
        return {"status": "success", "message": "Đã xóa bài viết"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feed")
async def get_news_feed():
    conn = db_manager.get_connection()
    if not conn: raise HTTPException(status_code=500, detail="Mất kết nối DB")
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT p.id as post_id, p.content, p.attached_media, p.media_type, p.created_at, 
                       u.id as user_id, u.username, u.fullname, u.avatar_url
                FROM posts p
                JOIN users u ON p.user_id = u.id
                ORDER BY p.created_at DESC LIMIT 20
            """
            cursor.execute(sql)
            posts = cursor.fetchall()
            
            for post in posts:
                media_links = {}
                folder = post.get("attached_media")
                if folder:
                    if post.get("media_type") == "video":
                        media_links["video_url"] = f"/api/music/stream/{folder}/4.mp4"
                    elif post.get("media_type") == "audio":
                        media_links["vocal_url"] = f"/api/music/stream/{folder}/2.mp3"
                        media_links["beat_url"] = f"/api/music/stream/{folder}/3.mp3"
                    media_links["cover_url"] = f"/api/music/cover/{folder}"
                post["stream_links"] = media_links

            return {"status": "success", "data": posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/setup-db")
async def setup_database():
    conn = db_manager.get_connection()
    if not conn: raise HTTPException(status_code=500, detail="Mất kết nối DB")
    messages = []
    try:
        with conn.cursor() as cursor:
            try:
                cursor.execute("ALTER TABLE posts ADD COLUMN attached_media VARCHAR(255) NULL;")
                messages.append("Thêm cột attached_media thành công.")
            except Exception: pass
            
            try:
                cursor.execute("ALTER TABLE posts ADD COLUMN media_type VARCHAR(50) NULL;")
                messages.append("Thêm cột media_type thành công.")
            except Exception: pass

            try:
                sql = "INSERT INTO users (id, username, fullname, avatar_url) VALUES (%s, %s, %s, %s)"
                cursor.execute(sql, (1, 'd4m_dev', 'Lý Thừa Ân', 'https://github.com/d4m-dev.png'))
            except Exception: pass
            
            cursor.execute("UPDATE users SET fullname = 'Lý Thừa Ân' WHERE id = 1")
            messages.append("Đã đồng bộ tên sếp thành 'Lý Thừa Ân'!")

        conn.commit()
        return {"status": "success", "message": "✅ Đã phẫu thuật Database xong!", "logs": messages}
    except Exception as e:
        return {"status": "error", "detail": str(e)}