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
from api.music import router as music_router

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

# ==========================================
# 🔮 LỚP GÁC CỔNG: TIÊM BỘ NHẬN DIỆN HỆ THỐNG NỘI BỘ
# ==========================================
class AutoBrandingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        if "text/html" in response.headers.get("content-type", ""):
            body_chunks = [chunk async for chunk in response.body_iterator]
            html_body = b"".join(body_chunks).decode("utf-8")
            
            # 🖥️ Vì các dự án hosted đã được tách xử lý, luồng này chỉ phục vụ Ubuntu-backend hệ thống
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

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(AutoBrandingMiddleware)
app.add_middleware(DynamicHostingMiddleware)
app.add_middleware(LoggerTrackerMiddleware)  
app.add_middleware(RateLimitMiddleware)      

# Đăng ký các module API
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
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
AUDIO_OUTPUT_DIR = os.path.join(BASE_DIR, "audio_workspace", "outputs")
SCRIPTS_DIR = os.path.join(BASE_DIR, "scripts")

# MỞ TOANG CỬA THƯ MỤC /src ĐỂ TRÌNH DUYỆT TỰ DO KÉO FAVICON & MANIFEST
SRC_DIR = os.path.join(BASE_DIR, "src")
os.makedirs(SRC_DIR, exist_ok=True)
app.mount("/src", StaticFiles(directory=SRC_DIR), name="src")

os.makedirs(os.path.join(PUBLIC_DIR, "js"), exist_ok=True)
app.mount("/js", StaticFiles(directory=os.path.join(PUBLIC_DIR, "js")), name="js")

os.makedirs(AUDIO_OUTPUT_DIR, exist_ok=True)
app.mount("/audio-files", StaticFiles(directory=AUDIO_OUTPUT_DIR), name="audio_files")

os.makedirs(os.path.join(PUBLIC_DIR, "images"), exist_ok=True)
app.mount("/images", StaticFiles(directory=os.path.join(PUBLIC_DIR, "images")), name="images")

os.makedirs(SCRIPTS_DIR, exist_ok=True)
app.mount("/scripts", StaticFiles(directory=SCRIPTS_DIR), name="scripts")

app.mount("/static/telegram", StaticFiles(directory=os.path.join(WORKSPACE_DIR, "telegram")), name="telegram_audio")

# 👇 BỔ SUNG MỚI: Mở cổng /media/music cho kho nhạc Music Pro Ultimate
MUSIC_DIR = os.path.join(BASE_DIR, "audio_workspace", "music")
os.makedirs(MUSIC_DIR, exist_ok=True)
app.mount("/media/music", StaticFiles(directory=MUSIC_DIR), name="media_music")

# ==========================================
# ĐỊNH TUYẾN FRONTEND
# ==========================================
@app.get("/")
@app.get("/hub.html")
async def serve_hub():
    hub_path = os.path.join(PUBLIC_DIR, "hub.html")
    if os.path.exists(hub_path): return FileResponse(hub_path)
    return {"status": "error", "message": "Không tìm thấy hub.html"}

@app.get("/auth.html")
async def serve_auth():
    auth_path = os.path.join(PUBLIC_DIR, "auth.html")
    if os.path.exists(auth_path): return FileResponse(auth_path)
    return {"status": "error", "message": "Không tìm thấy auth.html"}

@app.get("/admin/dashboard")
@app.get("/admin/dashboard/")
async def serve_dashboard():
    index_path = os.path.join(PUBLIC_DIR, "index.html")
    if os.path.exists(index_path): return FileResponse(index_path)
    return {"status": "error", "message": "Không tìm thấy index.html"}

@app.get("/admin/upload")
@app.get("/admin/upload/")
async def serve_upload_page():
    upload_path = os.path.join(PUBLIC_DIR, "admin-upload.html")
    if os.path.exists(upload_path): 
        return FileResponse(upload_path)
    return {"status": "error", "message": "Không tìm thấy giao diện upload"}


@app.get("/audio-test.html")
async def serve_audio_test():
    audio_path = os.path.join(PUBLIC_DIR, "audio-test.html")
    if os.path.exists(audio_path): return FileResponse(audio_path)
    return {"status": "error", "message": "Không tìm thấy audio-test.html"}

@app.get("/numerology.html")
async def serve_numerology():
    numerology_path = os.path.join(PUBLIC_DIR, "numerology.html")
    if os.path.exists(numerology_path): return FileResponse(numerology_path)
    return {"status": "error", "message": "Không tìm thấy numerology.html"}

@app.get("/vocal-remove.html")
async def serve_music_test():
    music_test_path = os.path.join(PUBLIC_DIR, "vocal-remove.html")
    if os.path.exists(music_test_path): return FileResponse(music_test_path)
    return {"status": "error", "message": "Không tìm thấy vocal-remove.html"}

@app.get("/love-sync.html")
async def serve_love_sync():
    love_sync_path = os.path.join(PUBLIC_DIR, "love-sync.html")
    if os.path.exists(love_sync_path): return FileResponse(love_sync_path)
    return {"status": "error", "message": "Không tìm thấy love-sync.html"}

@app.get("/music-pro.html")
async def serve_music_pro():
    music_pro_path = os.path.join(PUBLIC_DIR, "music-pro.html")
    if os.path.exists(music_pro_path): return FileResponse(music_pro_path)
    return {"status": "error", "message": "Không tìm thấy music-pro.html"}

@app.get("/social-hub.html")
async def serve_social_hub():
    social_path = os.path.join(PUBLIC_DIR, "social-hub.html")
    if os.path.exists(social_path): return FileResponse(social_path)
    return {"status": "error", "message": "Không tìm thấy social-hub.html"}

@app.get("/documentation.html")
async def serve_documentation():
    music_pro_path = os.path.join(PUBLIC_DIR, "documentation.html")
    if os.path.exists(music_pro_path): return FileResponse(music_pro_path)
    return {"status": "error", "message": "Không tìm thấy documentation.html"}

@app.get("/yt-downloader.html")
async def serve_yt_downloader():
    html_path = os.path.join(PUBLIC_DIR, "yt-downloader.html")
    if os.path.exists(html_path): return FileResponse(html_path)
    return {"status": "error", "message": "Không tìm thấy yt-downloader.html"}

@app.get("/profile.html")
async def serve_profile():
    profile_path = os.path.join(PUBLIC_DIR, "profile.html")
    if os.path.exists(profile_path): return FileResponse(profile_path)
    return {"status": "error", "message": "Không tìm thấy profile.html"}

@app.get("/test-tracks.html")
async def serve_music_player():
    player_path = os.path.join(PUBLIC_DIR, "test-tracks.html")
    if os.path.exists(player_path): return FileResponse(player_path)
    return {"status": "error", "message": "Không tìm thấy test-tracks.html"}