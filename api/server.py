from fastapi import FastAPI, Request, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.audio_engine import WORKSPACE_DIR
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from core.telegram import telegram_polling_task
import asyncio
import os

from core.config import settings
from core.database import init_db, db_manager
from core.scheduler import ai_janitor_task

from api import player, dashboard, upload, websockets, chatbox, social, auth, widgets, projects, ai_admin, audio_engine, bio_premium, music, telegram_bot, astrology, ytdl

from middlewares.logger_tracker import LoggerTrackerMiddleware
from middlewares.rate_limit import RateLimitMiddleware
from middlewares.dynamic_hosting import DynamicHostingMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()                   
    db_manager.connect()   
    db_manager.init_social_tables() 
    task = asyncio.create_task(ai_janitor_task())
    task_telegram = asyncio.create_task(telegram_polling_task())
    yield 
    task.cancel()
    task_telegram.cancel()
    if getattr(db_manager, "pool", None):
            print("Đã giải phóng MariaDB Connection Pool an toàn!")

app = FastAPI(title="Ubuntu Backend Core", version="1.0.0", lifespan=lifespan)

# ===========================
# 🔓 KHAI BÁO CỔNG TÀI NGUYÊN
# ===========================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSIC_DIR_STATIC = os.path.join(BASE_DIR, "audio_workspace", "music")
os.makedirs(MUSIC_DIR_STATIC, exist_ok=True)

# Gắn cổng /media/music lên ưu tiên cao nhất
app.mount("/media/music", StaticFiles(directory=MUSIC_DIR_STATIC), name="media_music")

# ==========================================
# 🔮 LỚP GÁC CỔNG: TIÊM BỘ NHẬN DIỆN HỆ THỐNG NỘI BỘ
# ==========================================
class AutoBrandingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        if "text/html" in response.headers.get("content-type", ""):
            body_chunks = [chunk async for chunk in response.body_iterator]
            html_body = b"".join(body_chunks).decode("utf-8")
            
            ubuntu_branding_injection = '''
    <link rel="icon" type="image/x-icon" href="/src/favicon/ubuntu-backend/favicon.ico?v=1">
    <link rel="icon" type="image/png" sizes="96x96" href="/src/favicon/ubuntu-backend/favicon-96x96.png?v=1">
    <link rel="icon" type="image/svg+xml" href="/src/favicon/ubuntu-backend/favicon.svg?v=1">
    <link rel="apple-touch-icon" sizes="180x180" href="/src/favicon/ubuntu-backend/apple-touch-icon.png?v=1">
    <link rel="manifest" href="/src/favicon/ubuntu-backend/site.webmanifest?v=1">
</head>'''

            if "</head>" in html_body:
                html_body = html_body.replace("</head>", ubuntu_branding_injection)
            elif "<body" in html_body:
                html_body = html_body.replace("<body", f"<head>{ubuntu_branding_injection}\n</head>\n<body")
            
            headers = dict(response.headers)
            headers["content-length"] = str(len(html_body.encode("utf-8")))
            
            return Response(
                content=html_body, 
                status_code=response.status_code, 
                headers=headers, 
                media_type="text/html"
            )
        
        return response

# Đăng ký Middlewares
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(AutoBrandingMiddleware)
app.add_middleware(DynamicHostingMiddleware)
app.add_middleware(LoggerTrackerMiddleware)  
app.add_middleware(RateLimitMiddleware)      

# Đăng ký Modules
app.include_router(auth.router)        
app.include_router(dashboard.router)
app.include_router(upload.router)
app.include_router(websockets.router)  
app.include_router(chatbox.router)     
app.include_router(social.router)      
app.include_router(widgets.router)     
app.include_router(projects.router)    
app.include_router(ai_admin.router)    
app.include_router(audio_engine.router)
app.include_router(bio_premium.router)
app.include_router(music.router)
app.include_router(telegram_bot.router)
app.include_router(astrology.router)
app.include_router(ytdl.router)
app.include_router(player.router)

# ==========================================
# 🚀 TỰ ĐỘNG NHẬN DIỆN ĐƯỜNG DẪN GỐC & TÀI NGUYÊN TĨNH
# ==========================================
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
AUDIO_OUTPUT_DIR = os.path.join(BASE_DIR, "audio_workspace", "outputs")
SCRIPTS_DIR = os.path.join(BASE_DIR, "scripts")
SRC_DIR = os.path.join(BASE_DIR, "src")
IMAGES_WORKSPACE = os.path.join(BASE_DIR, "images_workspace")

for directory in [SRC_DIR, os.path.join(PUBLIC_DIR, "js"), os.path.join(PUBLIC_DIR, "images"), AUDIO_OUTPUT_DIR, SCRIPTS_DIR, IMAGES_WORKSPACE]:
    os.makedirs(directory, exist_ok=True)

app.mount("/src", StaticFiles(directory=SRC_DIR), name="src")
app.mount("/js", StaticFiles(directory=os.path.join(PUBLIC_DIR, "js")), name="js")
app.mount("/images", StaticFiles(directory=os.path.join(PUBLIC_DIR, "images")), name="images")
app.mount("/audio-files", StaticFiles(directory=AUDIO_OUTPUT_DIR), name="audio_files")
app.mount("/scripts", StaticFiles(directory=SCRIPTS_DIR), name="scripts")
app.mount("/static/telegram", StaticFiles(directory=os.path.join(WORKSPACE_DIR, "telegram")), name="telegram_audio")
app.mount("/audio_workspace", StaticFiles(directory=os.path.join(BASE_DIR, "audio_workspace")), name="audio_workspace")
app.mount("/images_workspace", StaticFiles(directory=IMAGES_WORKSPACE), name="images_workspace")


# ==========================================
# 🚀 ĐỊNH TUYẾN FRONTEND (TỐI ƯU CỰC KỲ GỌN GÀNG)
# ==========================================
FRONTEND_PAGES = {
    "/": "hub.html",
    "/hub.html": "hub.html",
    "/auth.html": "auth.html",
    "/admin/dashboard": "index.html",
    "/admin/dashboard/": "index.html",
    "/admin/upload": "admin-upload.html",
    "/admin/upload/": "admin-upload.html",
    "/audio-test.html": "audio-test.html",
    "/numerology.html": "numerology.html",
    "/vocal-remove.html": "vocal-remove.html",
    "/love-sync.html": "love-sync.html",
    "/music-pro.html": "music-pro.html",
    "/social-hub.html": "social-hub.html",
    "/documentation.html": "documentation.html",
    "/yt-downloader.html": "yt-downloader.html",
    "/profile.html": "profile.html",
    "/test-tracks.html": "test-tracks.html",
}

def create_route(route_path, html_file):
    @app.get(route_path)
    async def serve_page():
        file_path = os.path.join(PUBLIC_DIR, html_file)
        if os.path.exists(file_path): 
            return FileResponse(file_path)
        return {"status": "error", "message": f"❌ Không tìm thấy {html_file}"}

for route, filename in FRONTEND_PAGES.items():
    create_route(route, filename)