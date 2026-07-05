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

# 🛡️ BẢO MẬT: Xác thực đầu vào khắt khe bằng Pydantic
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class SSORegisterRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    full_name: str
    email: EmailStr # Check chuẩn email abc@gmail.com

class SSOVerifyOTP(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class UpdateProfileRequest(BaseModel):
    full_name: str = None
    dob: str = None
    phone: str = None
    address: str = None

class ChangeEmailRequest(BaseModel):
    new_email: EmailStr

class VerifyChangeEmailRequest(BaseModel):
    new_email: EmailStr
    otp: str

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

@router.post("/login")
async def login(request: LoginRequest):
    if request.username != ADMIN_USERNAME or not verify_password(request.password):
        raise HTTPException(status_code=401, detail="❌ Sai thông tin đăng nhập!")
    access_token = create_access_token(data={"sub": request.username, "role": "admin"})
    return {"status": "success", "message": "✅ Đăng nhập thành công!", "access_token": access_token, "token_type": "bearer"}

@router.post("/sso/register")
async def register_sso(data: SSORegisterRequest):
    conn = None
    cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM users WHERE username=%s OR email=%s", (data.username, data.email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Tài khoản hoặc Email đã tồn tại!")
        
        otp_code = ''.join(random.choices(string.digits, k=6))
        if not send_otp_email(data.email, otp_code, data.username):
            raise HTTPException(status_code=500, detail="Lỗi gửi mail hệ thống.")
        
        # 🛡️ BẢO MẬT: Băm mật khẩu (Hash) trước khi lưu vào DB, tuyệt đối không lưu chữ thô
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
    conn = None
    cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, otp_code FROM users WHERE email=%s AND is_verified=FALSE", (data.email,))
        user = cursor.fetchone()
        
        if not user or user['otp_code'] != data.otp:
            raise HTTPException(status_code=400, detail="OTP không hợp lệ hoặc sai email!")
        
        cursor.execute("UPDATE users SET is_verified=TRUE, otp_code=NULL WHERE id=%s", (user['id'],))
        conn.commit()
        return {"status": "success", "message": "Xác thực định danh thành công."}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.post("/sso/login")
async def sso_login(data: LoginRequest):
    conn = None
    cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        # Chỉ check username/email, check password ở phía dưới
        cursor.execute("SELECT id, username, password_hash, is_verified FROM users WHERE (username=%s OR email=%s)", (data.username, data.username))
        user = cursor.fetchone()
        
        # 🛡️ BẢO MẬT: Dùng hàm verify_password chuẩn để check mã băm
        if not user or not verify_password(data.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Sai thông tin đăng nhập!")
            
        if not user['is_verified']:  
            raise HTTPException(status_code=403, detail="Tài khoản chưa được xác thực Email!")
            
        access_token = create_access_token(data={"sub": user['username'], "role": "user", "id": user['id']})
        return {"status": "success", "message": "Đăng nhập thành công!", "access_token": access_token}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.get("/profile/me")
async def get_my_profile(auth_data: tuple = Depends(get_current_user_id)):
    user_id, _ = auth_data
    conn = None
    cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username, full_name, email, phone, dob, address, avatar_url FROM users WHERE id=%s", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")
        if not user.get("avatar_url"):
            user["avatar_url"] = "/src/favicon/ubuntu-backend/favicon-96x96.png"
        return {"status": "success", "data": user}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.post("/profile/avatar")
async def upload_avatar(file: UploadFile = File(...), auth_data: tuple = Depends(get_current_user_id)):
    user_id, username = auth_data
    
    # 🛡️ BẢO MẬT: Chống hacker tải lên file PHP/JS độc hại
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ALLOWED_AVATAR_EXTENSIONS or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Chỉ cho phép tải lên định dạng ảnh (JPG, PNG, WEBP)!")
        
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    avatar_dir = os.path.join(base_dir, "public", "images", "avatar", username)
    os.makedirs(avatar_dir, exist_ok=True)
    
    filename = f"avatar_{username}_{random.randint(1000, 9999)}.{file_ext}"
    file_path = os.path.join(avatar_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    avatar_url = f"/images/avatar/{username}/{filename}"
    
    conn = None
    cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET avatar_url=%s WHERE id=%s", (avatar_url, user_id))
        conn.commit()
        return {"status": "success", "avatar_url": avatar_url}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()