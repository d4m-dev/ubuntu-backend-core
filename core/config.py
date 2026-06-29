import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Các giá trị mặc định (sẽ bị ghi đè nếu có trong file .env)
    HOST: str = "0.0.0.0"
    PORT: int = 16868
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "super-secret-jwt-key-change-me-later"
    
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASS: str = ""
    DB_NAME: str = "social_hub"

    DB_ADMIN_PORT: int = 8888

    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = "ignore"

settings = Settings()