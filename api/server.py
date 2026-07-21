import os
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse # 🚀 Bổ sung HTMLResponse cho Cache
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware  
from fastapi.staticfiles import StaticFiles

import redis.asyncio as redis # 🚀 Tích hợp Trí nhớ RAM siêu tốc

# --- 1. CORE & TASKS ---
from core.database import init_db, db_manager
from core.scheduler import ai_janitor_task
from core.telegram import telegram_polling_task
from api.audio_engine import WORKSPACE_DIR

# 🚀 IMPORT SCHEDULER TỪ ADMIN SCRIPTS
from api.admin_scripts import scheduler, restore_schedules

# --- 2. MIDDLEWARES ---
from middlewares.logger_tracker import LoggerTrackerMiddleware
from middlewares.rate_limit import RateLimitMiddleware
from middlewares.dynamic_hosting import DynamicHostingMiddleware
from middlewares.auto_branding import AutoBrandingMiddleware
from middlewares.ip_shield import IPShieldMiddleware
from middlewares.security_headers import SecurityHeadersMiddleware

# --- 3. ROUTERS ---
from api import (
    player, dashboard, websockets, chatbox, social, auth, widgets, 
    projects, ai_admin, audio_engine, bio_premium, music, telegram_bot, astrology, ytdl,
    admin_scripts, admin_security, dldriver, autocode, omni_dl
)

# ==========================================
# 🧠 KHỞI TẠO BỘ NHỚ ĐỆM RAM (REDIS CACHE)
# Sử dụng DB 1 để tách biệt hoàn toàn với DB 0 của Hàng đợi Celery AI
# ==========================================
redis_cache = redis.Redis.from_url("redis://127.0.0.1:6379/1", decode_responses=True)

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
    
    scheduler.start()
    restore_schedules()
    print("⏰ [Admin Scripts] Cỗ máy định thời gian đã được kích hoạt!")
    
    # 🚀 Xóa bộ nhớ RAM cũ khi khởi động lại server để nạp giao diện mới nhất
    try:
        await redis_cache.flushdb()
        print("⚡ [Redis Cache] Đã dọn dẹp sạch sẽ RAM. Sẵn sàng nạp giao diện mới!")
    except Exception as e:
        print(f"⚠️ [Redis Cache] Không thể kết nối Redis: {e}")
    
    yield 
    
    scheduler.shutdown()
    task_janitor.cancel()
    task_telegram.cancel()
    if getattr(db_manager, "pool", None):
        print("Đã giải phóng MariaDB Connection Pool an toàn!")

# ==========================================
# 🛡️ KHỞI TẠO HỆ THỐNG FASTAPI PRO VIP
# ==========================================
app = FastAPI(
    title="Ubuntu Backend Core", 
    version="1.0.0", 
    lifespan=lifespan,
    docs_url=None,   
    redoc_url=None,  
    openapi_url=None 
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.critical(f"CRITICAL FAULT on {request.url.path}: {str(exc)}")
    return JSONResponse(status_code=500, content={"status": "error", "message": "❌ Lỗi hệ thống nội bộ. Hệ thống lá chắn đã ghi log."})

# ==========================================
# 🛡️ LÁ CHẮN MIDDLEWARE 
# ==========================================
def setup_middlewares(app: FastAPI):
    ALLOWED_ORIGINS = ["https://d4mdev.click", "http://127.0.0.1:16868", "http://localhost:16868"]
    
    app.add_middleware(DynamicHostingMiddleware) 
    app.add_middleware(AutoBrandingMiddleware)
    app.add_middleware(LoggerTrackerMiddleware) 
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(SecurityHeadersMiddleware) 
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(IPShieldMiddleware) 
    app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ==========================================
# 🧩 GẮN KẾT TÀI NGUYÊN VÀ ĐỊNH TUYẾN
# ==========================================
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
        music.router, telegram_bot.router, astrology.router, ytdl.router, player.router, admin_scripts.router,
        admin_security.router, dldriver.router, autocode.router, omni_dl.router
    ]
    for r in api_routers:
        app.include_router(r)

def setup_frontend_routes(app: FastAPI):
    FRONTEND_PAGES = {
        # SEO & Core
        "/": "index.html", "/hub": "hub.html", "/auth": "auth.html", "/docs": "documentation.html", 
        "/robots.txt": "robots.txt", "/sitemap.xml": "sitemap.xml",
        
        # Admin Omni
        "/admin/dashboard": "admin/dashboard.html", "/admin/dashboard/": "admin/dashboard.html",
        "/admin/upload": "admin/admin-upload.html", "/admin/upload/": "admin/admin-upload.html",
        "/admin/scripts": "admin/admin-scripts.html", "/admin/scripts/": "admin/admin-scripts.html",
        "/admin/security": "admin/admin-security.html", "/admin/users": "admin/admin-users.html",
        "/admin/omni": "admin/admin-master.html", "/profile": "admin/profile.html",

        # Tools
        "/audio-test": "tools/audio-test.html", "/vocal-remove": "tools/vocal-remove.html", 
        "/yt-downloader": "tools/yt-downloader.html", "/admin/dldriver": "tools/download-ggdriver.html",
        "/admin/calendar": "tools/calendar-viewer.html", "/autocode": "tools/autocode.html", 
        "/admin/jarvis": "tools/jarvis-chat.html",

        # Social
        "/numerology": "social/numerology.html", "/love-sync": "social/love-sync.html",
        "/music-pro": "social/music-pro.html", "/social-hub": "social/social-hub.html",
        "/test-tracks": "social/test-tracks.html"
    }
    
    PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")

    # 🚀 VÒNG LẶP SẢN XUẤT ĐỘNG CƠ RAM CACHE
    for route, filename in FRONTEND_PAGES.items():
        def create_handler(file_path=os.path.join(PUBLIC_DIR, filename), f_name=filename, r_path=route):
            async def serve_page():
                if not os.path.isfile(file_path): 
                    return JSONResponse(status_code=404, content={"status": "error", "message": f"❌ Không tìm thấy {f_name}"})
                
                cache_key = f"page_cache:{r_path}"
                try:
                    # 1. Thử kéo từ RAM (Redis)
                    cached_html = await redis_cache.get(cache_key)
                    if cached_html:
                        return HTMLResponse(content=cached_html, headers={"Cache-Control": "public, max-age=3600", "X-Cache": "HIT"})
                    
                    # 2. Nếu RAM chưa có (Lần tải đầu tiên), móc từ Ổ Cứng lên
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                        
                    # 3. Ghi vào RAM để 1 tiếng sau tự hủy
                    await redis_cache.setex(cache_key, 3600, content)
                    return HTMLResponse(content=content, headers={"Cache-Control": "public, max-age=3600", "X-Cache": "MISS"})
                    
                except Exception:
                    # Rủi ro Redis chết: Trở về chế độ đọc ổ cứng truyền thống
                    return FileResponse(file_path, headers={"Cache-Control": "public, max-age=3600", "X-Cache": "BYPASS"})

            return serve_page
            
        app.get(route)(create_handler())

    # 🚀 ÁP DỤNG RAM CACHE CHO TRÌNH PHÁT NHẠC ĐỘNG
    @app.get("/music-pro/{song_slug}")
    async def serve_dynamic_music_pro(song_slug: str):
        file_path = os.path.join(PUBLIC_DIR, "social", "music-pro.html")
        if not os.path.isfile(file_path): 
            return JSONResponse(status_code=404, content={"status": "error", "message": "❌ Không tìm thấy Music Pro"})
            
        cache_key = "page_cache:/music-pro/template"
        try:
            cached_html = await redis_cache.get(cache_key)
            if cached_html:
                return HTMLResponse(content=cached_html, headers={"Cache-Control": "public, max-age=3600", "X-Cache": "HIT"})
                
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            await redis_cache.setex(cache_key, 3600, content)
            return HTMLResponse(content=content, headers={"Cache-Control": "public, max-age=3600", "X-Cache": "MISS"})
        except:
            return FileResponse(file_path, headers={"Cache-Control": "public, max-age=3600", "X-Cache": "BYPASS"})

# ==========================================
# 🚀 KÍCH HOẠT HỆ THỐNG
# ==========================================
setup_middlewares(app)
setup_static_mounts(app)
setup_routers(app)
setup_frontend_routes(app)