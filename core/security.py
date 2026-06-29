import jwt
import hashlib
import time
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.config import settings

# Thông tin đăng nhập cứng cho quyền Admin (Bạn có thể đổi mật khẩu tại đây)
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = hashlib.sha256("admin123".encode()).hexdigest()

# Cấu hình Token (Hết hạn sau 24 giờ)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security_scheme = HTTPBearer()

def verify_password(plain_password: str) -> bool:
    """Kiểm tra mật khẩu nhập vào có khớp với mã băm không"""
    return hashlib.sha256(plain_password.encode()).hexdigest() == ADMIN_PASSWORD_HASH

def create_access_token(data: dict):
    """Tạo JWT Token"""
    to_encode = data.copy()
    expire = time.time() + (ACCESS_TOKEN_EXPIRE_HOURS * 3600)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security_scheme)):
    """Giải mã và kiểm tra tính hợp lệ của Token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="⚠️ Phiên đăng nhập đã hết hạn!")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="❌ Token không hợp lệ!")