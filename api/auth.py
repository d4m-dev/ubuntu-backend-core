from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Depends
from pydantic import BaseModel
from core.security import verify_password, create_access_token, ADMIN_USERNAME
from core.database import db_manager
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import jwt
import shutil
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication & SSO"]
)

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

def send_otp_email(to_email: str, otp_code: str, username: str):
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD")
    
    if not sender_email or not sender_password:
        print("⚠️ Lỗi hệ thống: Không tìm thấy SENDER_EMAIL hoặc SENDER_PASSWORD trong file .env!")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = f"D4M ID System <{sender_email}>"
        msg['To'] = to_email
        msg['Subject'] = "Mã Xác Thực Định Danh - D4M Ecosystem"

        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="max-w: 500px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
                    <h2 style="color: #3b82f6;">Xác Thực D4M ID</h2>
                    <p>Xin chào <strong>{username}</strong>,</p>
                    <p>Mã OTP để xác thực tài khoản Hệ sinh thái của bạn là:</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #8b5cf6; margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px;">
                        {otp_code}
                    </div>
                    <p style="color: #666; font-size: 14px;">Mã này chỉ có hiệu lực một lần. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                </div>
            </body>
        </html>
        """
        msg.attach(MIMEText(html_body, 'html'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"❌ Lỗi gửi Email SMTP: {e}")
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

class LoginRequest(BaseModel):
    username: str
    password: str

class SSORegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    email: str

class SSOVerifyOTP(BaseModel):
    email: str
    otp: str

class UpdateProfileRequest(BaseModel):
    full_name: str = None
    dob: str = None
    phone: str = None
    address: str = None

class ChangeEmailRequest(BaseModel):
    new_email: str

class VerifyChangeEmailRequest(BaseModel):
    new_email: str
    otp: str

@router.post("/login")
async def login(request: LoginRequest):
    if request.username != ADMIN_USERNAME or not verify_password(request.password):
        raise HTTPException(status_code=401, detail="❌ Sai tên đăng nhập hoặc mật khẩu!")
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
        
        mail_sent = send_otp_email(data.email, otp_code, data.username)
        if not mail_sent:
            raise HTTPException(status_code=500, detail="Máy chủ hệ thống gửi mail lỗi, vui lòng kiểm tra lại cấu hình tệp .env")
        
        sql = """
            INSERT INTO users (username, password_hash, full_name, email, is_verified, otp_code) 
            VALUES (%s, %s, %s, %s, FALSE, %s)
        """
        cursor.execute(sql, (data.username, data.password, data.full_name, data.email, otp_code))
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
        cursor = conn.cursor(dictionary=True) # Ép kiểu Dictionary để dễ đọc
        cursor.execute("SELECT id, otp_code FROM users WHERE email=%s AND is_verified=FALSE", (data.email,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=400, detail="Tài khoản không tồn tại hoặc đã xác thực!")
        
        if user['otp_code'] != data.otp:
            raise HTTPException(status_code=400, detail="OTP không hợp lệ!")
        
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
        
        cursor.execute("SELECT id, username, is_verified FROM users WHERE (username=%s OR email=%s) AND password_hash=%s", 
                      (data.username, data.username, data.password))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="Sai thông tin đăng nhập!")
            
        if not user['is_verified']:  
            raise HTTPException(status_code=403, detail="Tài khoản chưa được xác thực Email!")
            
        access_token = create_access_token(data={"sub": user['username'], "role": "user", "id": user['id']})
        
        return {
            "status": "success", 
            "message": "Đăng nhập thành công!",
            "access_token": access_token
        }
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.get("/profile/me")
async def get_my_profile(auth_data: tuple = Depends(get_current_user_id)):
    user_id, username = auth_data
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

@router.put("/profile/update")
async def update_profile(data: UpdateProfileRequest, auth_data: tuple = Depends(get_current_user_id)):
    user_id, _ = auth_data
    conn = None
    cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users SET full_name=%s, dob=%s, phone=%s, address=%s WHERE id=%s
        """, (data.full_name, data.dob, data.phone, data.address, user_id))
        conn.commit()
        return {"status": "success", "message": "Đã lưu thông tin hồ sơ."}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.post("/profile/avatar")
async def upload_avatar(file: UploadFile = File(...), auth_data: tuple = Depends(get_current_user_id)):
    user_id, username = auth_data
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    avatar_dir = os.path.join(base_dir, "public", "images", "avatar", username)
    os.makedirs(avatar_dir, exist_ok=True)
    
    file_ext = file.filename.split(".")[-1]
    filename = f"avatar_{username}.{file_ext}"
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
        return {"status": "success", "message": "Đã cập nhật ảnh đại diện.", "avatar_url": avatar_url}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.post("/profile/change-email/request")
async def request_change_email(data: ChangeEmailRequest, auth_data: tuple = Depends(get_current_user_id)):
    user_id, username = auth_data
    conn = None
    cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM users WHERE email=%s", (data.new_email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email này đã được sử dụng bởi người khác!")
            
        otp_code = ''.join(random.choices(string.digits, k=6))
        if not send_otp_email(data.new_email, otp_code, username):
            raise HTTPException(status_code=500, detail="Lỗi máy chủ khi gửi Email.")
            
        cursor.execute("UPDATE users SET otp_code=%s WHERE id=%s", (otp_code, user_id))
        conn.commit()
        return {"status": "success", "message": "Đã gửi mã OTP đến Email mới."}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.post("/profile/change-email/verify")
async def verify_change_email(data: VerifyChangeEmailRequest, auth_data: tuple = Depends(get_current_user_id)):
    user_id, _ = auth_data
    conn = None
    cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT otp_code FROM users WHERE id=%s", (user_id,))
        user = cursor.fetchone()
        
        if not user or not user['otp_code'] or user['otp_code'] != data.otp:
            raise HTTPException(status_code=400, detail="Mã OTP không chính xác.")
            
        cursor.execute("UPDATE users SET email=%s, otp_code=NULL WHERE id=%s", (data.new_email, user_id))
        conn.commit()
        return {"status": "success", "message": "Đổi Email thành công!"}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()