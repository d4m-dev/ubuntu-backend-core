import os
import sys
import importlib.util
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse, HTMLResponse
from starlette.types import Scope, Receive, Send

try:
    from starlette.middleware.wsgi import WSGIMiddleware
except ImportError:
    WSGIMiddleware = None

_flask_app_cache = {}
HOSTING_DIR = "/storage/emulated/0/coder/media/ubuntu-backend-core/hosted_projects"

class DynamicHostingMiddleware:
    def __init__(self, app):
        self.app = app
        os.makedirs(HOSTING_DIR, exist_ok=True)

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        path = scope["path"]

        # 🚀 FIX LỖI: Thêm "/images/" vào luồng miễn trừ để hệ thống tải được Avatar
        if (path == "/" or path.startswith("/api/") or path.startswith("/ws/") or 
            path.startswith("/css/") or path.startswith("/js/") or path.startswith("/audio-files/") or 
            path.startswith("/images/") or path.startswith("/admin/") or path.startswith("/branding-assets/") or 
            path.startswith("/src/") or path.endswith(".html")):
            return await self.app(scope, receive, send)

        parts = [p for p in path.split("/") if p]
        if not parts:
            return await self.app(scope, receive, send)

        folder_name = parts[0]
        project_path = os.path.join(HOSTING_DIR, folder_name)

        if os.path.isdir(project_path):
            if os.path.exists(os.path.join(project_path, ".frozen")):
                # ==========================================
                # GIAO DIỆN GLASSMORPHISM BẢO TRÌ PREMIUM
                # ==========================================
                html_content = f"""
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Dự Án Đang Bảo Trì | d4m-dev</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                    <style>
                        body {{ background-color: #0b0f19; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; overflow: hidden; }}
                        .glass-card {{ background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 2rem; padding: 3rem 2.5rem; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.05); animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; transform: translateY(20px); opacity: 0; }}
                        @keyframes popIn {{ to {{ transform: translateY(0); opacity: 1; }} }}
                        .progress-bar {{ width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 999px; margin-top: 2.5rem; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.2); }}
                        .progress-fill {{ height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); width: 100%; animation: shrink 5s linear forwards; border-radius: 999px; }}
                        @keyframes shrink {{ from {{ width: 100%; }} to {{ width: 0%; }} }}
                        .btn-glass {{ background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.3s; }}
                        .btn-glass:hover {{ background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.5); transform: translateY(-2px); }}
                        .animate-spin-slow {{ animation: spin 4s linear infinite; }}
                    </style>
                </head>
                <body class="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0b0f19] to-[#0b0f19]">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div class="glass-card max-w-md w-full mx-4 relative z-10">
                        <div class="w-20 h-20 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <i class="fa-solid fa-snowflake text-4xl text-blue-400 animate-spin-slow"></i>
                        </div>
                        <h1 class="text-3xl font-black mb-3 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Đang Nâng Cấp</h1>
                        <p class="text-gray-400 mb-6 leading-relaxed text-sm">Dự án <span class="text-white font-bold px-2.5 py-1 bg-white/5 rounded-lg border border-white/10">{folder_name}</span> hiện đang được đóng băng để bảo trì hệ thống.</p>
                        
                        <div class="text-sm text-gray-500 font-medium bg-black/30 py-2 px-4 rounded-xl inline-block border border-white/5">
                            Tự động quay lại Hub sau <span id="timer" class="font-black text-blue-400 text-lg mx-1 w-4 inline-block text-center">5</span> giây
                        </div>
                        
                        <div class="progress-bar"><div class="progress-fill"></div></div>
                        
                        <a href="/" class="mt-8 btn-glass inline-flex items-center justify-center w-full py-3.5 rounded-xl text-sm font-bold text-gray-300 hover:text-white shadow-lg">
                            <i class="fa-solid fa-arrow-left-long mr-2"></i> Quay lại ngay
                        </a>
                    </div>
                    <script>
                        let timeLeft = 5;
                        const timerEl = document.getElementById('timer');
                        const interval = setInterval(() => {{
                            timeLeft--;
                            timerEl.innerText = timeLeft;
                            if(timeLeft <= 0) {{
                                clearInterval(interval);
                                window.location.href = '/';
                            }}
                        }}, 1000);
                    </script>
                </body>
                </html>
                """
                response = HTMLResponse(content=html_content, status_code=503)
                await response(scope, receive, send)
                return

            if len(parts) == 1 and not path.endswith("/"):
                redirect_url = f"{path}/"
                if scope.get("query_string"): 
                    redirect_url += f"?{scope['query_string'].decode()}"
                response = RedirectResponse(url=redirect_url, status_code=307)
                await response(scope, receive, send)
                return

            remaining_path = "/".join(parts[1:])
            file_target = os.path.join(project_path, remaining_path)

            # Chuỗi mã định danh thương hiệu d4m-dev dành cho các ứng dụng hosted
            d4m_branding_injection = '''
    <link rel="icon" type="image/x-icon" href="/src/favicon/d4m-dev/favicon.ico?v=1">
    <link rel="icon" type="image/png" sizes="96x96" href="/src/favicon/d4m-dev/favicon-96x96.png?v=1">
    <link rel="icon" type="image/svg+xml" href="/src/favicon/d4m-dev/favicon.svg?v=1">
    <link rel="apple-touch-icon" sizes="180x180" href="/src/favicon/d4m-dev/apple-touch-icon.png?v=1">
    <link rel="manifest" href="/src/favicon/d4m-dev/site.webmanifest?v=1">
</head>'''

            # 🚀 LUỒNG XỬ LÝ 1: Gọi trực tiếp tệp HTML cụ thể
            if remaining_path and os.path.isfile(file_target) and not file_target.endswith('.py'):
                if file_target.endswith('.html'):
                    with open(file_target, 'r', encoding='utf-8') as f:
                        html_content = f.read()
                    if "</head>" in html_content:
                        html_content = html_content.replace("</head>", d4m_branding_injection)
                    elif "<body" in html_content:
                        html_content = html_content.replace("<body", f"<head>{d4m_branding_injection}\n</head>\n<body")
                    response = HTMLResponse(content=html_content, status_code=200)
                    await response(scope, receive, send)
                else:
                    response = FileResponse(file_target)
                    await response(scope, receive, send)
                return

            # 🚀 LUỒNG XỬ LÝ 2: Gọi thư mục gốc (Tự động nạp index.html)
            index_html = os.path.join(project_path, 'index.html')
            if not remaining_path or remaining_path == 'index.html':
                if os.path.exists(index_html):
                    with open(index_html, 'r', encoding='utf-8') as f:
                        html_content = f.read()
                    if "</head>" in html_content:
                        html_content = html_content.replace("</head>", d4m_branding_injection)
                    elif "<body" in html_content:
                        html_content = html_content.replace("<body", f"<head>{d4m_branding_injection}\n</head>\n<body")
                    response = HTMLResponse(content=html_content, status_code=200)
                    await response(scope, receive, send)
                    return
                    
            index_py_public = os.path.join(project_path, 'public', 'index.py')
            index_py = os.path.join(project_path, 'index.py')
            target_py = index_py_public if os.path.exists(index_py_public) else (index_py if os.path.exists(index_py) else None)

            if target_py and WSGIMiddleware:
                try:
                    asgi_app = self.get_or_load_wsgi_app(target_py)
                    if asgi_app:
                        scope["root_path"] = f"/{folder_name}"
                        return await asgi_app(scope, receive, send)
                except Exception as e:
                    print(f"Lỗi khởi chạy Python Project: {e}")

        response = JSONResponse(status_code=404, content={"status": "error", "message": f"❌ Không tìm thấy tài nguyên: {path}"})
        await response(scope, receive, send)
        return

    def get_or_load_wsgi_app(self, file_path):
        if not WSGIMiddleware: return None
        cache_key = os.path.abspath(file_path)
        if cache_key in _flask_app_cache: return _flask_app_cache[cache_key]
        try:
            module_name = f"hosted_app_{os.path.basename(os.path.dirname(file_path))}"
            spec = importlib.util.spec_from_file_location(module_name, file_path)
            if spec is None or spec.loader is None: return None
            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            old_cwd = os.getcwd()
            old_sys_path = sys.path.copy()
            try:
                script_dir = os.path.dirname(os.path.abspath(file_path))
                os.chdir(script_dir)
                if script_dir not in sys.path: sys.path.insert(0, script_dir)
                spec.loader.exec_module(module)
                flask_app = getattr(module, 'app', getattr(module, 'application', None))
                if flask_app:
                    asgi_app = WSGIMiddleware(flask_app)
                    _flask_app_cache[cache_key] = asgi_app
                    return asgi_app
            finally:
                os.chdir(old_cwd)
                sys.path = old_sys_path
        except Exception as e: print(f"❌ Lỗi tải WSGI: {e}")
        return None