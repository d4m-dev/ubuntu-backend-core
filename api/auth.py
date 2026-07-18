from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Depends
from pydantic import BaseModel, EmailStr, Field
from core.security import verify_password, create_access_token, get_password_hash, ADMIN_USERNAME
from core.database import db_manager
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import jwt
import shutil
import os
import logging
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Authentication & SSO"])

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
ALLOWED_AVATAR_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

# ==========================================
# 📦 KHUÔN MẪU DỮ LIỆU ĐẦU VÀO
# ==========================================
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class SSORegisterRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    full_name: str
    email: EmailStr

class SSOVerifyOTP(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class UpdateProfileRequest(BaseModel):
    full_name: str = None
    dob: str = None
    phone: str = None
    address: str = None
    cccd: str = None

class ChangeEmailRequest(BaseModel):
    new_email: EmailStr

class VerifyChangeEmailRequest(BaseModel):
    new_email: EmailStr
    otp: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6, description="Mật khẩu mới phải từ 6 ký tự")

# ==========================================
# 🛠️ CÁC HÀM TIỆN ÍCH & XÁC THỰC ROLE
# ==========================================
def send_otp_email(to_email: str, otp_code: str, username: str):
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD")
    if not sender_email or not sender_password:
        logging.error("SMTP config missing in .env")
        return False
    try:
        msg = MIMEMultipart()
        msg['From'] = f"D4M ID System <{sender_email}>"
        msg['To'] = to_email
        msg['Subject'] = "Mã Xác Thực Định Danh - D4M Ecosystem"
        html_body = f"""
        <html><body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-w: 500px; margin: auto; background: white; padding: 30px; border-radius: 10px; text-align: center;">
                <h2 style="color: #3b82f6;">Xác Thực D4M ID</h2>
                <p>Xin chào <strong>{username}</strong>,</p>
                <p>Mã OTP xác thực tài khoản của bạn là:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #8b5cf6; margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px;">{otp_code}</div>
            </div>
        </body></html>
        """
        msg.attach(MIMEText(html_body, 'html'))
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        logging.error(f"SMTP Error: {e}")
        return False

def get_current_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập lại.")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload.get("id"), payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token hết hạn hoặc lỗi.")

def verify_admin(authorization: str = Header(None)):
    """Lá chắn Radar: Chỉ cho phép người dùng có Role = 1 (Tư Lệnh) đi qua"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập lại.")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        role = payload.get("role")
        if role != 1 and role != "admin":
            raise HTTPException(status_code=403, detail="CẢNH BÁO: Không đủ thẩm quyền! Chỉ Tư Lệnh mới được cấp phép truy cập.")
        return payload.get("id"), payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token hết hạn hoặc lỗi.")

# ==========================================
# 👑 API BẢNG PHONG THẦN (ADMIN QUẢN LÝ USER)
# ==========================================
@router.get("/admin/users")
async def admin_get_users(auth_data: tuple = Depends(verify_admin)):
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username, full_name, email, phone, role, active, is_verified, avatar_url, created_at FROM users ORDER BY created_at DESC")
        users = cursor.fetchall()
        for u in users:
            if not u.get("avatar_url"): u["avatar_url"] = "/src/favicon/ubuntu-backend/favicon-96x96.png"
        return {"status": "success", "users": users}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.put("/admin/users/{target_id}/toggle-active")
async def admin_toggle_active(target_id: int, auth_data: tuple = Depends(verify_admin)):
    user_id, _ = auth_data
    if user_id == target_id:
        raise HTTPException(status_code=400, detail="Không thể tự khóa tài khoản của chính mình!")
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT active FROM users WHERE id=%s", (target_id,))
        user = cursor.fetchone()
        if not user: raise HTTPException(status_code=404, detail="Không tìm thấy mục tiêu.")
        
        new_state = 0 if user['active'] == 1 else 1
        cursor.execute("UPDATE users SET active=%s WHERE id=%s", (new_state, target_id))
        conn.commit()
        return {"status": "success", "new_state": new_state, "message": "Đã đổi trạng thái tài khoản."}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.put("/admin/users/{target_id}/change-role")
async def admin_change_role(target_id: int, auth_data: tuple = Depends(verify_admin)):
    user_id, _ = auth_data
    if user_id == target_id:
        raise HTTPException(status_code=400, detail="Không thể tự giáng chức chính mình!")
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT role FROM users WHERE id=%s", (target_id,))
        user = cursor.fetchone()
        if not user: raise HTTPException(status_code=404, detail="Không tìm thấy mục tiêu.")
        
        new_role = 1 if user['role'] == 0 else 0
        cursor.execute("UPDATE users SET role=%s WHERE id=%s", (new_role, target_id))
        conn.commit()
        return {"status": "success", "new_role": new_role, "message": "Đã cập nhật Tước vị."}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.delete("/admin/users/{target_id}")
async def admin_delete_user(target_id: int, auth_data: tuple = Depends(verify_admin)):
    user_id, _ = auth_data
    if user_id == target_id:
        raise HTTPException(status_code=400, detail="Lệnh tự hủy đã bị cấm!")
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id=%s", (target_id,))
        conn.commit()
        return {"status": "success", "message": "Đã thanh trừng tài khoản khỏi hệ thống!"}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ==========================================
# 🔑 API ĐĂNG NHẬP & ĐĂNG KÝ
# ==========================================
@router.post("/login")
async def login(request: LoginRequest):
    if request.username != ADMIN_USERNAME or not verify_password(request.password):
        raise HTTPException(status_code=401, detail="❌ Sai thông tin đăng nhập!")
    access_token = create_access_token(data={"sub": request.username, "role": "admin"})
    return {"status": "success", "message": "✅ Đăng nhập thành công!", "access_token": access_token, "token_type": "bearer"}

@router.post("/sso/register")
async def register_sso(data: SSORegisterRequest):
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username=%s OR email=%s", (data.username, data.email))
        if cursor.fetchone(): raise HTTPException(status_code=400, detail="Tài khoản hoặc Email đã tồn tại!")
        
        otp_code = ''.join(random.choices(string.digits, k=6))
        if not send_otp_email(data.email, otp_code, data.username): raise HTTPException(status_code=500, detail="Lỗi gửi mail hệ thống.")
        hashed_password = get_password_hash(data.password)
        sql = "INSERT INTO users (username, password_hash, full_name, email, is_verified, otp_code) VALUES (%s, %s, %s, %s, FALSE, %s)"
        cursor.execute(sql, (data.username, hashed_password, data.full_name, data.email, otp_code))
        conn.commit()
        return {"status": "success", "message": "Đã tạo tài khoản, chờ xác thực OTP."}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.post("/sso/verify")
async def verify_otp(data: SSOVerifyOTP):
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, otp_code FROM users WHERE email=%s AND is_verified=FALSE", (data.email,))
        user = cursor.fetchone()
        if not user or user['otp_code'] != data.otp: raise HTTPException(status_code=400, detail="OTP không hợp lệ hoặc sai email!")
        cursor.execute("UPDATE users SET is_verified=TRUE, otp_code=NULL WHERE id=%s", (user['id'],))
        conn.commit()
        return {"status": "success", "message": "Xác thực định danh thành công."}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.post("/sso/login")
async def sso_login(data: LoginRequest):
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username, password_hash, is_verified, full_name, role, active FROM users WHERE (username=%s OR email=%s)", (data.username, data.username))
        user = cursor.fetchone()
        
        if not user or not verify_password(data.password, user['password_hash']): raise HTTPException(status_code=401, detail="Sai thông tin đăng nhập!")
        if not user['is_verified']: raise HTTPException(status_code=403, detail="Tài khoản chưa được xác thực Email!")
            
        access_token = create_access_token(
            data={
                "sub": user['username'], 
                "id": user['id'],
                "full_name": user['full_name'] or user['username'],
                "role": user['role'],
                "active": user['active']
            }
        )
        return {"status": "success", "message": "Đăng nhập thành công!", "access_token": access_token}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# ==========================================
# 👤 API QUẢN LÝ HỒ SƠ & BẢO MẬT (GIỮ NGUYÊN)
# ==========================================
@router.get("/profile/me")
async def get_my_profile(auth_data: tuple = Depends(get_current_user_id)):
    user_id, _ = auth_data
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username, full_name, email, phone, dob, address, avatar_url, role, active FROM users WHERE id=%s", (user_id,))
        user = cursor.fetchone()
        if not user: raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")
        if not user.get("avatar_url"): user["avatar_url"] = "/src/favicon/ubuntu-backend/favicon-96x96.png"
        return {"status": "success", "data": user}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.put("/profile/update")
async def update_profile(data: UpdateProfileRequest, auth_data: tuple = Depends(get_current_user_id)):
    user_id, _ = auth_data
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        if data.cccd:
            cursor.execute("SELECT id FROM users WHERE cccd=%s AND id!=%s", (data.cccd, user_id))
            if cursor.fetchone(): raise HTTPException(status_code=400, detail="❌ Số CCCD này đã được liên kết với một tài khoản khác!")
        
        sql = "UPDATE users SET full_name=%s, phone=%s, cccd=%s, dob=%s, address=%s WHERE id=%s"
        cursor.execute(sql, (data.full_name, data.phone, data.cccd, data.dob, data.address, user_id))
        conn.commit()
        return {"status": "success", "message": "Đã lưu hồ sơ an toàn!"}
    except HTTPException: raise
    except Exception as e:
        logging.error(f"Lỗi cập nhật Profile: {e}")
        raise HTTPException(status_code=500, detail="Lỗi nội bộ Database!")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.post("/profile/avatar")
async def upload_avatar(file: UploadFile = File(...), auth_data: tuple = Depends(get_current_user_id)):
    user_id, username = auth_data
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ALLOWED_AVATAR_EXTENSIONS or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Chỉ cho phép tải lên định dạng ảnh!")
        
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    avatar_dir = os.path.join(base_dir, "public", "images", "avatar", username)
    os.makedirs(avatar_dir, exist_ok=True)
    filename = f"avatar_{username}_{random.randint(1000, 9999)}.{file_ext}"
    file_path = os.path.join(avatar_dir, filename)
    with open(file_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
        
    avatar_url = f"/images/avatar/{username}/{filename}"
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET avatar_url=%s WHERE id=%s", (avatar_url, user_id))
        conn.commit()
        return {"status": "success", "avatar_url": avatar_url}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.post("/profile/change-email/request")
async def request_change_email(data: ChangeEmailRequest, auth_data: tuple = Depends(get_current_user_id)):
    user_id, username = auth_data
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email=%s", (data.new_email,))
        if cursor.fetchone(): raise HTTPException(status_code=400, detail="Email này đã được sử dụng bởi người khác!")
            
        otp_code = ''.join(random.choices(string.digits, k=6))
        if not send_otp_email(data.new_email, otp_code, username): raise HTTPException(status_code=500, detail="Lỗi máy chủ khi gửi Email.")
            
        cursor.execute("UPDATE users SET otp_code=%s WHERE id=%s", (otp_code, user_id))
        conn.commit()
        return {"status": "success", "message": "Đã gửi mã OTP đến Email mới."}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.post("/profile/change-email/verify")
async def verify_change_email(data: VerifyChangeEmailRequest, auth_data: tuple = Depends(get_current_user_id)):
    user_id, _ = auth_data
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT otp_code FROM users WHERE id=%s", (user_id,))
        user = cursor.fetchone()
        if not user or not user['otp_code'] or user['otp_code'] != data.otp: raise HTTPException(status_code=400, detail="Mã OTP không chính xác.")
            
        cursor.execute("UPDATE users SET email=%s, otp_code=NULL WHERE id=%s", (data.new_email, user_id))
        conn.commit()
        return {"status": "success", "message": "Đổi Email thành công!"}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.post("/forgot-password/request")
async def request_forgot_password(data: ForgotPasswordRequest):
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username FROM users WHERE email=%s", (data.email,))
        user = cursor.fetchone()
        if not user: raise HTTPException(status_code=404, detail="Email này chưa từng được đăng ký trong hệ thống!")
            
        otp_code = ''.join(random.choices(string.digits, k=6))
        if not send_otp_email(data.email, otp_code, user['username']): raise HTTPException(status_code=500, detail="Lỗi trạm phát sóng Email. Vui lòng thử lại sau!")
            
        cursor.execute("UPDATE users SET otp_code=%s WHERE id=%s", (otp_code, user['id']))
        conn.commit()
        return {"status": "success", "message": "Đã gửi mã OTP khôi phục mật khẩu vào Email của sếp!"}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.post("/forgot-password/reset")
async def reset_password(data: ResetPasswordRequest):
    conn = None; cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, otp_code FROM users WHERE email=%s", (data.email,))
        user = cursor.fetchone()
        if not user or not user['otp_code'] or user['otp_code'] != data.otp: raise HTTPException(status_code=400, detail="Mã OTP không chính xác hoặc đã hết hạn!")
            
        hashed_password = get_password_hash(data.new_password)
        cursor.execute("UPDATE users SET password_hash=%s, otp_code=NULL WHERE id=%s", (hashed_password, user['id']))
        conn.commit()
        return {"status": "success", "message": "Khôi phục mật khẩu thành công! Giờ sếp có thể đăng nhập bình thường."}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()