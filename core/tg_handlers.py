import os
import asyncio
import httpx
import subprocess
import re
from datetime import datetime
from core.config import settings
from core.tg_utils import send_telegram_message

# --- LUỒNG XỬ LÝ DEMUCS & WHISPER ---
async def trigger_audio_processing(chat_id: str, file_id: str, chosen_name: str, original_filename: str, option: str):
    await send_telegram_message(f"📥 <b>Đang nạp file:</b> <code>{chosen_name}</code>...")
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            file_res = await client.get(f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/getFile?file_id={file_id}")
            resp_data = file_res.json()
            if not resp_data.get("ok"): raise Exception(f"Telegram từ chối tải: {resp_data.get('description')}")
                
            tg_file_path = resp_data["result"]["file_path"]
            download_url = f"https://api.telegram.org/file/bot{settings.TELEGRAM_BOT_TOKEN}/{tg_file_path}"
            
            from api.audio_engine import sanitize_folder_name, process_audio_pipeline, WORKSPACE_DIR
            TELEGRAM_DIR = os.path.join(WORKSPACE_DIR, "telegram")
            os.makedirs(TELEGRAM_DIR, exist_ok=True)
            
            clean_name, _ = sanitize_folder_name(chosen_name)
            _, ext = sanitize_folder_name(original_filename)
            task_id = f"{clean_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            project_dir = os.path.join(TELEGRAM_DIR, clean_name)
            os.makedirs(project_dir, exist_ok=True)
            
            saved_input_path = os.path.join(project_dir, f"{task_id}{ext}")
            file_data = await client.get(download_url)
            with open(saved_input_path, "wb") as f: f.write(file_data.content)
                
            separate_beat = option in ["vocal", "beat", "all"]
            extract_lyrics = option in ["lyric", "all"]
            
            await send_telegram_message(f"⚙️ <b>Đang chạy AI trích xuất:</b> {clean_name}")
            await asyncio.to_thread(process_audio_pipeline, saved_input_path, clean_name, task_id, ext, separate_beat, extract_lyrics, TELEGRAM_DIR, TELEGRAM_DIR)
            
            files_to_send = []
            if option in ["vocal", "all"]: files_to_send.append(f"{task_id}_vocal.mp3")
            if option in ["beat", "all"]: files_to_send.append(f"{task_id}_beat.mp3")
            if option in ["lyric", "all"]: files_to_send.append(f"{task_id}_lyrics.lrc")
            
            await send_telegram_message(f"✅ <b>AI đã xong:</b> Đang gửi {clean_name}...")
            for f_name in files_to_send:
                f_path = os.path.join(project_dir, f_name)
                if os.path.exists(f_path):
                    with open(f_path, "rb") as f:
                        await client.post(f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendDocument", data={"chat_id": chat_id}, files={"document": f}, timeout=120.0)
    except Exception as e:
        await send_telegram_message(f"❌ Lỗi hạ tầng Audio: {e}")

# --- LUỒNG TẢI YOUTUBE ĐA LUỒNG ---
async def trigger_ytdl_download(chat_id: str, task_info: dict, quality: str):
    url = task_info["url"]
    fmt = task_info["format"]
    title = task_info["title"]
    
    await send_telegram_message(f"🚀 <b>Đang kéo dữ liệu:</b> <code>{title}</code>\n⏳ Khởi động động cơ 5 luồng siêu tốc...")
    try:
        safe_title = re.sub(r'[\\/*?:"<>|]', "", title).strip() or "Unknown_Video"
        from api.audio_engine import WORKSPACE_DIR
        task_dir = os.path.join(WORKSPACE_DIR, "youtube", safe_title)
        os.makedirs(task_dir, exist_ok=True)
        
        out_tmpl = os.path.join(task_dir, f"d4m-dev_{safe_title}.%(ext)s")
        python_exec = os.path.expanduser("~/myenv/bin/python3")
        
        yt_dlp_base = f'"{python_exec}" -m yt_dlp --concurrent-fragments 5 --no-warnings --no-playlist'
        
        if fmt == "mp3":
            audio_q = "0" if quality == "320" else "5"
            cmd = f'{yt_dlp_base} -f "bestaudio/best" -x --audio-format mp3 --audio-quality {audio_q} -o "{out_tmpl}" "{url}"'
            send_method, file_key = "sendAudio", "audio"
        else:
            cmd = f'{yt_dlp_base} -f "bestvideo[height<={quality}]+bestaudio/best[height<={quality}]/best" --merge-output-format mp4 -o "{out_tmpl}" "{url}"'
            send_method, file_key = "sendVideo", "video"
            
        res = await asyncio.to_thread(subprocess.run, cmd, shell=True, capture_output=True, text=True)
        if res.returncode != 0: raise Exception(f"Lỗi tải yt-dlp: {res.stderr}")
            
        downloaded_file = None
        for f in os.listdir(task_dir):
            if f.startswith(f"d4m-dev_{safe_title}") and os.path.isfile(os.path.join(task_dir, f)):
                downloaded_file = os.path.join(task_dir, f)
                break
                
        if not downloaded_file: raise Exception("Tải xong nhưng mất file (Vui lòng kiểm tra ffmpeg).")
        
        # 🚀 CHỐT CHẶN CÂN FILE THỰC TẾ
        file_size_mb = os.path.getsize(downloaded_file) / (1024 * 1024)
        if file_size_mb > 49.5:
            from urllib.parse import quote
            tunnel_url = ""
            try:
                # Ép lấy link trực tiếp từ lõi hệ thống Tunnel
                from scripts.network_tunnel import get_tunnel_url
                tunnel_url = get_tunnel_url()
            except: pass
            
            base_url = tunnel_url if tunnel_url else "http://192.168.110.123:16868"
            web_deep_link = f"{base_url}/yt-downloader.html?url={quote(url)}"
            
            kb = {"inline_keyboard": [[{"text": "🌐 Mở Web Tải Trực Tiếp", "url": web_deep_link}]]}
            await send_telegram_message(
                f"⚠️ <b>File đã tải xong nhưng nặng {file_size_mb:.1f} MB!</b>\n"
                f"Giới hạn của Telegram API là 50MB nên Bot không thể gửi trực tiếp vào tin nhắn.\n\n"
                f"Vui lòng nhấn nút bên dưới để lưu thẳng vào máy từ Server nhé:", 
                reply_markup=kb
            )
            return
            
        await send_telegram_message(f"✅ <b>Đã lưu kho ({file_size_mb:.1f} MB):</b> Đang bắn lên Telegram...")
        
        async with httpx.AsyncClient(timeout=None) as client:
            with open(downloaded_file, "rb") as f:
                tg_res = await client.post(
                    f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/{send_method}", 
                    data={"chat_id": chat_id}, 
                    files={file_key: f}
                )
                if tg_res.status_code != 200:
                    raise Exception(f"Telegram từ chối nhận file: {tg_res.text}")
                    
    except Exception as e:
        err_msg = str(e)
        if "ReadTimeout" in repr(e) or "Timeout" in repr(e): 
            err_msg = "Mạng yếu, quá thời gian gửi file lên Telegram."
        elif not err_msg: 
            err_msg = repr(e)
        await send_telegram_message(f"❌ <b>Lỗi tải YouTube:</b> {err_msg}")