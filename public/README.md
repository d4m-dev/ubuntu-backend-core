<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>d4m-dev Core | Documentation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .glass-card { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); transition: all 0.3s ease; }
        .glass-card:hover { border-color: rgba(59, 130, 246, 0.3); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4); }
        .glass-header { background: rgba(0, 0, 0, 0.2); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        code { font-family: 'Courier New', Courier, monospace; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(147, 51, 234, 0.5); }
    </style>
</head>
<body class="bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0b0f19] to-[#0b0f19] min-h-screen text-gray-200 font-sans antialiased pb-16">

    <nav class="glass-header sticky top-0 z-50 px-6 py-4 mb-10">
        <div class="max-w-6xl mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 uppercase">
                <i class="fa-brands fa-ubuntu text-orange-500 mr-2"></i>d4m-dev Core
            </h1>
            <span class="text-xs font-mono bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-purple-400 font-bold tracking-wider">DOCUMENTATION v1.0.0</span>
        </div>
    </nav>

    <main class="max-w-6xl mx-auto px-6 space-y-12">
        
        <div class="glass-card p-8 rounded-3xl relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            <h2 class="text-3xl font-black text-white mb-4 tracking-wide uppercase">Hệ Thống Ubuntu Backend Core</h2>
            <p class="text-gray-400 leading-relaxed max-w-3xl">
                Hệ sinh thái máy chủ cục bộ toàn diện được tối ưu hóa cho thiết bị di động cao cấp. Hệ thống được xây dựng trên nền tảng <strong class="text-blue-400">FastAPI</strong> mạnh mẽ, tích hợp Trí tuệ Nhân tạo (Google Gemini), Động cơ xử lý đa phương tiện Studio (Meta Demucs AI & FFmpeg), và hạ tầng quản lý máy chủ ảo động Serverless. Hệ thống vận hành biệt lập an toàn tại cổng kết nối phong thủy <strong class="text-purple-400 font-mono">16868</strong>.
            </p>
        </div>

        <div>
            <h3 class="text-lg font-bold text-white mb-5 flex items-center"><i class="fa-solid fa-star text-yellow-400 mr-2"></i> Tính Năng Cốt Lõi</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="glass-card p-6 rounded-2xl">
                    <i class="fa-solid fa-robot text-3xl text-purple-400 mb-4 block"></i>
                    <h4 class="font-bold text-white mb-2 text-base">AI SysAdmin Tự Động</h4>
                    <p class="text-xs text-gray-400 leading-relaxed">Tích hợp SDK Gemini mới giúp đọc hiểu dữ liệu logs.db, tự động phát hiện tấn công bất thường và nhận lệnh tắt/mở API bằng ngôn ngữ tự nhiên.</p>
                </div>
                <div class="glass-card p-6 rounded-2xl">
                    <i class="fa-solid fa-sliders text-3xl text-blue-400 mb-4 block"></i>
                    <h4 class="font-bold text-white mb-2 text-base">Trạm Audio Studio AI</h4>
                    <p class="text-xs text-gray-400 leading-relaxed">Sử dụng FFmpeg trích xuất âm thanh chất lượng cao 320kbps từ video. Kết hợp Demucs AI của Meta để bóc tách luồng giọng hát (Vocal) và nhạc nền (Beat) riêng biệt.</p>
                </div>
                <div class="glass-card p-6 rounded-2xl">
                    <i class="fa-solid fa-box-archive text-3xl text-orange-400 mb-4 block"></i>
                    <h4 class="font-bold text-white mb-2 text-base">Dynamic Project Hub</h4>
                    <p class="text-xs text-gray-400 leading-relaxed">Triển khai thần tốc các dự án HTML5/Python động thông qua cơ chế kéo thả file nén dạng .ZIP trực tiếp ngay trên giao diện Dashboard quản trị.</p>
                </div>
                <div class="glass-card p-6 rounded-2xl">
                    <i class="fa-solid fa-snowflake text-3xl text-cyan-400 mb-4 block"></i>
                    <h4 class="font-bold text-white mb-2 text-base">Đóng Băng Dự Án</h4>
                    <p class="text-xs text-gray-400 leading-relaxed">Khóa tạm ngưng hoạt động của các thư mục dự án khi bảo trì. Tự động hiển thị màn hình Pop-up Glassmorphism đếm ngược 5 giây để chuyển hướng người dùng.</p>
                </div>
                <div class="glass-card p-6 rounded-2xl">
                    <i class="fa-solid fa-circle-nodes text-3xl text-green-400 mb-4 block"></i>
                    <h4 class="font-bold text-white mb-2 text-base">Auto Cloudflare Tunnel</h4>
                    <p class="text-xs text-gray-400 leading-relaxed">Tự động giám sát luồng vận hành của Cloudflare Tunnel, bóc tách chuỗi URL công khai ngẫu nhiên và đồng bộ liên kết động vào các dự án.</p>
                </div>
                <div class="glass-card p-6 rounded-2xl">
                    <i class="fa-solid fa-chart-line text-3xl text-pink-400 mb-4 block"></i>
                    <h4 class="font-bold text-white mb-2 text-base">Giao Diện Premium UX</h4>
                    <p class="text-xs text-gray-400 leading-relaxed">Bảng điều khiển thiết kế theo phong cách Glassmorphism đồng bộ dữ liệu tài nguyên phần cứng (CPU, RAM, 512GB Storage) theo thời gian thực.</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="glass-card p-6 rounded-2xl">
                <h3 class="text-base font-bold text-white mb-4 flex items-center"><i class="fa-solid fa-terminal text-blue-400 mr-2"></i> Lệnh Cài Đặt Hệ Thống (Ubuntu Level)</h3>
                <div class="bg-black/50 p-4 rounded-xl border border-white/5 font-mono text-xs text-green-400 space-y-2 leading-relaxed">
                    <p class="text-gray-500"># Cập nhật hệ thống và cài đặt công cụ đa phương tiện</p>
                    <p>apt update && apt upgrade -y</p>
                    <p>apt install ffmpeg -y</p>
                </div>

                <h3 class="text-base font-bold text-white mt-6 mb-4 flex items-center"><i class="fa-solid fa-box-open text-purple-400 mr-2"></i> Khởi Tạo Môi Trường Ảo & Thư Viện Pip3</h3>
                <div class="bg-black/50 p-4 rounded-xl border border-white/5 font-mono text-xs text-green-400 space-y-2 leading-relaxed">
                    <p class="text-gray-500"># Kích hoạt môi trường myenv biệt lập độc lập</p>
                    <p>source ~/myenv/bin/activate</p>
                    <p class="text-gray-500 mt-2"># Cài đặt đồng bộ toàn bộ nguyên liệu độc quyền</p>
                    <p class="whitespace-pre-wrap">pip3 install fastapi uvicorn pydantic-settings python-multipart pymysql psutil google-genai demucs pydub aiofiles pyjwt passlib bcrypt</p>
                </div>
            </div>

            <div class="glass-card p-6 rounded-2xl flex flex-col">
                <h3 class="text-base font-bold text-white mb-4 flex items-center"><i class="fa-solid fa-sliders text-orange-400 mr-2"></i> Khai Báo Biến Môi Trường (.env)</h3>
                <div class="bg-black/50 p-4 rounded-xl border border-white/5 font-mono text-xs text-gray-300 space-y-1.5 leading-relaxed flex-grow">
                    <p><span class="text-purple-400">HOST</span>=0.0.0.0</p>
                    <p><span class="text-purple-400">PORT</span>=16868 <span class="text-gray-500"># Chốt cổng 5 số đẹp tài lộc</span></p>
                    <p><span class="text-purple-400">ENVIRONMENT</span>=production</p>
                    <p><span class="text-purple-400">SECRET_KEY</span>=chuoi_bao_mat_ma_hoa_token_jwt</p>
                    <p class="text-gray-500 mt-2"># Cấu hình kết nối MariaDB cục bộ</p>
                    <p><span class="text-purple-400">DB_HOST</span>=127.0.0.1</p>
                    <p><span class="text-purple-400">DB_PORT</span>=3306</p>
                    <p><span class="text-purple-400">DB_USER</span>=root</p>
                    <p><span class="text-purple-400">DB_PASS</span>=</p>
                    <p><span class="text-purple-400">DB_NAME</span>=social_hub</p>
                    <p class="text-gray-500 mt-2"># Khóa trí tuệ nhân tạo bộ não Google</p>
                    <p><span class="text-purple-400">GEMINI_API_KEY</span>=AIzaSy..._khoa_api_studio_cua_ban</p>
                </div>
            </div>
        </div>

        <div class="glass-card p-6 rounded-2xl">
            <h3 class="text-lg font-bold text-white mb-4 flex items-center"><i class="fa-solid fa-play text-green-400 mr-2"></i> Kích Hoạt Vận Hành Máy Chủ</h3>
            <p class="text-sm text-gray-400 mb-4">Gọi trực tiếp trình biên dịch Python 3 trong môi trường ảo để kích nổ máy chủ Uvicorn:</p>
            <div class="bg-black/50 p-4 rounded-xl border border-white/5 font-mono text-xs text-green-400 mb-6">
                ~/myenv/bin/python3 main.py
            </div>
            
            <h4 class="text-sm font-bold text-white mb-3">Mạng lưới định tuyến hạ tầng đường dẫn:</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div class="bg-black/30 p-3 rounded-xl border border-white/5">
                    <span class="text-blue-400 font-bold block mb-1">🎛️ Admin Dashboard</span>
                    <a href="http://127.0.0.1:16868/" target="_blank" class="text-gray-400 hover:text-white underline">/dashboard.html</a>
                </div>
                <div class="bg-black/30 p-3 rounded-xl border border-white/5">
                    <span class="text-purple-400 font-bold block mb-1">🎧 Audio Engine Studio</span>
                    <a href="http://127.0.0.1:16868/audio-test.html" target="_blank" class="text-gray-400 hover:text-white underline">/audio-test.html</a>
                </div>
                <div class="bg-black/30 p-3 rounded-xl border border-white/5">
                    <span class="text-orange-400 font-bold block mb-1">📁 Project Hub mặt tiền</span>
                    <a href="http://127.0.0.1:16868/hub.html" target="_blank" class="text-gray-400 hover:text-white underline">/hub.html</a>
                </div>
            </div>
        </div>

        <div class="glass-card p-6 rounded-2xl">
            <h3 class="text-lg font-bold text-white mb-4 flex items-center"><i class="fa-solid fa-folder-tree text-blue-400 mr-2"></i> Sơ Đồ Cấu Trúc Phân Hệ Dự Án</h3>
            <div class="bg-[#070b12] p-6 rounded-xl border border-white/5 font-mono text-xs text-gray-400 leading-relaxed overflow-x-auto">
                <p class="text-white font-bold">ubuntu-backend-core/</p>
                <p>├── main.py                     <span class="text-gray-600"># Điểm kích nổ luồng Uvicorn Server</span></p>
                <p>├── .env                        <span class="text-gray-600"># Lưu trữ toàn bộ token biến môi trường bảo mật</span></p>
                <p>├── core/</p>
                <p>│   ├── config.py               <span class="text-gray-600"># Trình điều phối và nạp biến môi trường</span></p>
                <p>│   ├── database.py             <span class="text-gray-600"># Quản lý song song MariaDB & SQLite Nhật ký</span></p>
                <p>│   └── security.py             <span class="text-gray-600"># Cơ chế khóa giải mã JWT Xác thực</span></p>
                <p>├── api/</p>
                <p>│   ├── server.py               <span class="text-gray-600"># Trung tâm định tuyến lõi FastAPI router</span></p>
                <p>│   ├── ai_admin.py             <span class="text-gray-600"># Bộ não AI nhận lệnh gạt công tắc hệ thống</span></p>
                <p>│   ├── audio_engine.py         <span class="text-gray-600"># Trạm bóc tách tầng âm Demucs/FFmpeg</span></p>
                <p>│   ├── dashboard.py            <span class="text-gray-600"># Giám sát phần cứng thời gian thực (psutil)</span></p>
                <p>│   └── projects.py             <span class="text-gray-600"># API giải nén mã nguồn dự án .ZIP</span></p>
                <p>├── scripts/</p>
                <p>│   └── network_tunnel.py       <span class="text-gray-600"># Động cơ quản lý bắt chuỗi Cloudflare Tunnel URL</span></p>
                <p>├── middlewares/</p>
                <p>│   └── dynamic_hosting.py      <span class="text-gray-600"># Điều phối proxy và render giao diện bảo trì</span></p>
                <p>├── public/                     <span class="text-gray-600"># Kho lưu trữ giao diện tĩnh HTML/CSS/JS</span></p>
                <p>│   ├── index.html              <span class="text-gray-600"># Giao diện Admin Dashboard chính</span></p>
                <p>│   ├── hub.html                <span class="text-gray-600"># Giao diện trưng bày danh mục dự án công khai</span></p>
                <p>│   ├── audio-test.html         <span class="text-gray-600"># Khung kiểm thử trạm âm thanh Studio</span></p>
                <p>│   └── js/                     <span class="text-gray-600"># Logic frontend xử lý bất đồng bộ (app.js)</span></p>
                <p>├── audio_workspace/            <span class="text-gray-600"># Thư mục tạm xử lý luồng nén bóc tách đa phương tiện (Tự sinh)</span></p>
                <p>└── hosted_projects/            <span class="text-gray-600"># Không gian lưu trữ vận hành các website con (Tự sinh)</span></p>
            </div>
        </div>

    </main>

    <footer class="mt-16 py-6 border-t border-white/5 bg-black/20 text-center text-xs text-gray-500">
        &copy; 2026 Developed with ⚡ by d4m-dev. Built for Premium Performance & Scaling.
    </footer>

</body>
</html>