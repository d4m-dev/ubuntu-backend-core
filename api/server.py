import os
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# --- 1. CORE & TASKS ---
from core.database import init_db, db_manager
from core.scheduler import ai_janitor_task
from core.telegram import telegram_polling_task
from api.audio_engine import WORKSPACE_DIR

# --- 2. MIDDLEWARES ---
from middlewares.logger_tracker import LoggerTrackerMiddleware
from middlewares.rate_limit import RateLimitMiddleware
from middlewares.dynamic_hosting import DynamicHostingMiddleware
from middlewares.auto_branding import AutoBrandingMiddleware
from middlewares.security_headers import SecurityHeadersMiddleware # 🛡️ Bổ sung lá chắn thép

# --- 3. ROUTERS ---
from api import (
    player, dashboard, websockets, chatbox, social, auth, widgets, 
    projects, ai_admin, audio_engine, bio_premium, music, telegram_bot, astrology, ytdl
)

# ==========================================
# ⚙️ QUẢN LÝ VÒNG ĐỜI ỨNG DỤNG (LIFESPAN)
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()                   
    db_manager.connect()   
    db_manager.init_social_tables() 
    task_janitor = asyncio.create_task(ai_janitor_task())
    task_telegram = asyncio.create_task(telegram_polling_task())
    yield 
    task_janitor.cancel()
    task_telegram.cancel()
    if getattr(db_manager, "pool", None):
        print("Đã giải phóng MariaDB Connection Pool an toàn!")

# 🚀 BẢO MẬT: Tắt OpenAPI, Swagger UI (/docs) và ReDoc (/redoc)
# Khóa chặt "bản đồ kho báu", không cho hacker nhìn thấy cấu trúc API hệ thống
app = FastAPI(
    title="Ubuntu Backend Core", 
    version="1.0.0", 
    lifespan=lifespan,
    docs_url=None,   
    redoc_url=None,  
    openapi_url=None 
)

# ==========================================
# 🛡️ HỨNG LỖI TOÀN CỤC (GLOBAL EXCEPTION)
# ==========================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.critical(f"UNHANDLED EXCEPTION on {request.url}: {str(exc)}")
    return JSONResponse(status_code=500, content={"status": "error", "message": "❌ Lỗi hệ thống nội bộ. Đã ghi log bảo mật."})

# ==========================================
# 🧩 CÁC HÀM LẮP RÁP HỆ THỐNG (APP FACTORY)
# ==========================================
def setup_middlewares(app: FastAPI):
    ALLOWED_ORIGINS = ["https://d4mdev.click", "http://127.0.0.1:16868", "http://localhost:16868"]
    
    # Kích hoạt Middlewares (Thứ tự rất quan trọng)
    app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
    app.add_middleware(SecurityHeadersMiddleware) # 🚀 Gắn khiên bảo vệ XSS/Clickjacking
    app.add_middleware(AutoBrandingMiddleware)
    app.add_middleware(DynamicHostingMiddleware) 
    app.add_middleware(LoggerTrackerMiddleware)  
    app.add_middleware(RateLimitMiddleware)

def setup_static_mounts(app: FastAPI):
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    STATIC_DIRS = {
        "media_music": os.path.join(BASE_DIR, "audio_workspace", "music"),
        "src": os.path.join(BASE_DIR, "src"),
        "js": os.path.join(BASE_DIR, "public", "js"),
        "images": os.path.join(BASE_DIR, "public", "images"),
        "audio_files": os.path.join(BASE_DIR, "audio_workspace", "outputs"),
        "scripts": os.path.join(BASE_DIR, "scripts"),
        "audio_workspace": os.path.join(BASE_DIR, "audio_workspace"),
        "images_workspace": os.path.join(BASE_DIR, "images_workspace"),
        "telegram_audio": os.path.join(WORKSPACE_DIR, "telegram")
    }

    for route_name, dir_path in STATIC_DIRS.items():
        os.makedirs(dir_path, exist_ok=True)
        route_url = "/static/telegram" if route_name == "telegram_audio" else f"/{route_name.replace('_files', '-files')}"
        app.mount(route_url, StaticFiles(directory=dir_path), name=route_name)

def setup_routers(app: FastAPI):
    api_routers = [
        auth.router, dashboard.router, websockets.router, chatbox.router, social.router,
        widgets.router, projects.router, ai_admin.router, audio_engine.router, bio_premium.router,
        music.router, telegram_bot.router, astrology.router, ytdl.router, player.router
    ]
    for r in api_routers:
        app.include_router(r)

def setup_frontend_routes(app: FastAPI):
    FRONTEND_PAGES = {
        "/": "hub.html", "/hub": "hub.html", "/auth": "auth.html",
        "/admin/dashboard": "index.html", "/admin/dashboard/": "index.html",
        "/admin/upload": "admin-upload.html", "/admin/upload/": "admin-upload.html",
        "/audio-test": "audio-test.html", "/numerology": "numerology.html",
        "/vocal-remove": "vocal-remove.html", "/love-sync": "love-sync.html",
        "/music-pro": "music-pro.html", "/social-hub": "social-hub.html",
        "/documentation": "documentation.html", "/yt-downloader": "yt-downloader.html",
        "/profile": "profile.html", "/test-tracks": "test-tracks.html",
    }
    
    PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")

    for route, filename in FRONTEND_PAGES.items():
        def create_handler(file_name=filename):
            async def serve_page():
                file_path = os.path.join(PUBLIC_DIR, file_name)
                if os.path.exists(file_path): return FileResponse(file_path)
                return JSONResponse(status_code=404, content={"status": "error", "message": f"❌ Không tìm thấy {file_name}"})
            return serve_page
            
        app.get(route)(create_handler())

    @app.get("/music-pro/{song_slug}")
    async def serve_dynamic_music_pro(song_slug: str):
        file_path = os.path.join(PUBLIC_DIR, "music-pro.html")
        if os.path.exists(file_path): 
            return FileResponse(file_path)
        return JSONResponse(status_code=404, content={"status": "error", "message": "❌ Không tìm thấy Music Pro"})
# ==========================================
# 🚀 KÍCH HOẠT HỆ THỐNG
# ==========================================
setup_middlewares(app)
setup_static_mounts(app)
setup_routers(app)
setup_frontend_routes(app)