import os
import re
import shutil
import subprocess
import asyncio
import httpx
from datetime import datetime
from urllib.parse import quote
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse

router = APIRouter(
    prefix="/api/audio",
    tags=["Audio Engine"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKSPACE_DIR = os.path.join(BASE_DIR, "audio_workspace")
INPUT_DIR = os.path.join(WORKSPACE_DIR, "inputs")
OUTPUT_DIR = os.path.join(WORKSPACE_DIR, "outputs")

os.makedirs(INPUT_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

def sanitize_folder_name(filename: str) -> tuple:
    name, ext = os.path.splitext(filename)
    clean_name = re.sub(r'[^\w\-_]', '_', name)
    clean_name = re.sub(r'_+', '_', clean_name).strip('_')
    return clean_name, ext

# ==========================================
# 🚀 HỆ THỐNG KÉO LYRICS TỪ NHIỀU API
# ==========================================
def fetch_lyrics_multi_api(query: str, output_path: str, title: str = "", artist: str = "") -> bool:
    """
    Quét qua nhiều API để tìm Lời bài hát.
    Nếu API 1 sập hoặc không có, tự động nhảy sang API 2.
    """
    search_query = query.replace('_', ' ').replace('-', ' ').strip()
    _title = title if title else search_query
    _artist = artist if artist else "Unknown"

    with httpx.Client(timeout=10.0) as client:
        # 🌐 API 1: LRCLIB (Ưu tiên số 1 vì có Lyrics Sync thời gian chuẩn xác)
        try:
            res = client.get("https://lrclib.net/api/search", params={"q": search_query})
            if res.status_code == 200:
                data = res.json()
                if data and len(data) > 0:
                    for track in data:
                        if track.get("syncedLyrics"):
                            with open(output_path, "w", encoding="utf-8") as f:
                                f.write(track.get("syncedLyrics"))
                            return True
                        elif track.get("plainLyrics"):
                            with open(output_path, "w", encoding="utf-8") as f:
                                f.write(track.get("plainLyrics"))
                            return True
        except Exception as e:
            print(f"⚠️ [API LRCLIB] Lỗi: {e}")

        # 🌐 API 2: Lyrics.ovh (API dự phòng - trả về Plain Lyrics)
        try:
            url = f"https://api.lyrics.ovh/v1/{quote(_artist)}/{quote(_title)}"
            res = client.get(url)
            if res.status_code == 200:
                data = res.json()
                if data.get("lyrics"):
                    with open(output_path, "w", encoding="utf-8") as f:
                        f.write(data.get("lyrics"))
                    return True
        except Exception as e:
            print(f"⚠️ [API Lyrics.ovh] Lỗi hoặc không tìm thấy: {e}")

    # Nếu tất cả API đều thất bại
    return False

# ==========================================
# 🚀 CORE PIPELINE (ĐÃ GỠ BỎ WHISPER AI)
# ==========================================
def process_audio_pipeline(file_path: str, clean_name: str, task_id: str, ext: str, separate_beat: bool, extract_lyrics: bool, title: str = "", artist: str = "", base_in_dir=INPUT_DIR, base_out_dir=OUTPUT_DIR):
    project_dir = os.path.join(base_out_dir, clean_name)
    os.makedirs(project_dir, exist_ok=True)

    vocal_output = os.path.join(project_dir, f"{task_id}_vocal.mp3")
    beat_output = os.path.join(project_dir, f"{task_id}_beat.mp3")
    lyrics_output = os.path.join(project_dir, f"{task_id}_lyrics.lrc")

    # GIAI ĐOẠN 0: TRÍCH XUẤT MP3 TỪ VIDEO
    video_extensions = ['.mp4', '.mov', '.mkv', '.avi', '.flv', '.webm']
    if ext.lower() in video_extensions:
        print(f"🎬 [Audio Engine] Phát hiện Video ({ext}). Đang trích xuất MP3...")
        song_input_dir = os.path.join(base_in_dir, clean_name)
        os.makedirs(song_input_dir, exist_ok=True)
        mp3_converted_path = os.path.join(song_input_dir, f"{task_id}_converted.mp3")
        try:
            # Replace shell=True with list args
            subprocess.run([
                "ffmpeg", "-y", "-i", file_path,
                "-q:a", "0", "-map", "a", mp3_converted_path
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            file_path = mp3_converted_path
            ext = '.mp3'
        except subprocess.CalledProcessError as e:
            err_msg = e.stderr.decode('utf-8') if e.stderr else str(e)
            print(f"❌ Lỗi chuyển đổi Video sang MP3: {err_msg}")

    # GIAI ĐOẠN 1: TÁCH BEAT & VOCAL (BẰNG DEMUCS)
    if separate_beat:
        print(f"🎵 [Audio Engine] Đang bóc tách Beat/Vocal chuẩn Demucs cho: {task_id}")
        temp_demucs_dir = os.path.join(WORKSPACE_DIR, f"temp_demucs_{task_id}")
        os.makedirs(temp_demucs_dir, exist_ok=True)
        try:
            # Set environment variable OMP_NUM_THREADS=1
            env = os.environ.copy()
            env["OMP_NUM_THREADS"] = "1"
            demucs_path = os.path.expanduser("~/myenv/bin/demucs")
            subprocess.run([
                demucs_path, "-d", "cpu", "-j", "1", "--segment", "7",
                "--two-stems=vocals", "-o", temp_demucs_dir, file_path
            ], env=env, check=True)

            raw_out_dir = os.path.join(temp_demucs_dir, "htdemucs", os.path.splitext(os.path.basename(file_path))[0])
            if os.path.exists(raw_out_dir):
                vocal_wav = os.path.join(raw_out_dir, "vocals.wav")
                beat_wav = os.path.join(raw_out_dir, "no_vocals.wav")

                if os.path.exists(vocal_wav):
                    subprocess.run([
                        "ffmpeg", "-y", "-i", vocal_wav,
                        "-b:a", "192k", vocal_output
                    ], shell=False)
                if os.path.exists(beat_wav):
                    subprocess.run([
                        "ffmpeg", "-y", "-i", beat_wav,
                        "-b:a", "192k", beat_output
                    ], shell=False)
            else:
                print(f"❌ Không tìm thấy thư mục kết quả tại: {raw_out_dir}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Lỗi nội bộ tại Demucs khi chạy lệnh.")
        finally:
            if os.path.exists(temp_demucs_dir):
                shutil.rmtree(temp_demucs_dir)

    # GIAI ĐOẠN 2: TÌM LỜI BÀI HÁT (MULTI-API HOẶC TẠO FILE TẠM)
    if extract_lyrics:
        print(f"📝 [Audio Engine] Đang rà quét APIs tìm lời bài hát cho: {clean_name}")
        is_lyric_found = fetch_lyrics_multi_api(clean_name, lyrics_output, title, artist)

        if is_lyric_found:
            print(f"⚡ Đã tải lời bài hát từ Internet thành công!")
        else:
            print("⚠️ Các nguồn API đều không có lời bài hát này. Đang tạo file LRC chuẩn 'Coming soon'...")
            fallback_title = title if title else clean_name
            fallback_artist = artist if artist else "Unknown"
            fallback_content = f"[ti:{fallback_title}]\n[ar:{fallback_artist}]\n[00:00.00]coming soon\n"

            with open(lyrics_output, "w", encoding="utf-8") as f:
                f.write(fallback_content)

    # ĐÓNG CỜ KẾT THÚC
    try:
        is_success = False
        if separate_beat and (os.path.exists(vocal_output) or os.path.exists(beat_output)):
            is_success = True
        elif not separate_beat and os.path.exists(lyrics_output):
            is_success = True

        if is_success:
            print(f"✅ [Audio Engine] Hoàn thành trọn vẹn Pipeline cho dự án: {task_id}")
            with open(os.path.join(project_dir, f"{task_id}_completed.txt"), "w", encoding="utf-8") as f:
                f.write("DONE")
        else:
            print(f"❌ [Audio Engine] Tiến trình AI thất bại. Hủy tạo cờ giao diện cho: {task_id}")
    except Exception as e:
        print(f"⚠️ Không thể xử lý cờ hoàn thành: {e}")

# ==========================================
# CÁC API ENDPOINTS
# ==========================================
@router.post("/extract")
async def extract_audio_features(background_tasks: BackgroundTasks, file: UploadFile = File(...), custom_name: str = Form(None), separate_beat: bool = Form(True), extract_lyrics: bool = Form(True)):
    try:
        original_clean, ext = sanitize_folder_name(file.filename)
        final_name = custom_name.strip() if custom_name and custom_name.strip() else original_clean
        clean_name, _ = sanitize_folder_name(final_name)
        task_id = f"{clean_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        song_input_dir = os.path.join(INPUT_DIR, clean_name)
        os.makedirs(song_input_dir, exist_ok=True)
        saved_input_path = os.path.join(song_input_dir, f"{task_id}{ext}")

        with open(saved_input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Nạp Pipeline (Cung cấp Title là final_name để in ra file LRC Mặc định)
        background_tasks.add_task(process_audio_pipeline, saved_input_path, clean_name, task_id, ext, separate_beat, extract_lyrics, final_name, "Unknown")

        expected_outputs = {}
        if separate_beat:
            expected_outputs["vocal"] = f"/api/audio/stream/{clean_name}/{task_id}_vocal.mp3"
            expected_outputs["beat"] = f"/api/audio/stream/{clean_name}/{task_id}_beat.mp3"
        if extract_lyrics:
            expected_outputs["lyrics"] = f"/api/audio/stream/{clean_name}/{task_id}_lyrics.lrc"

        return JSONResponse(status_code=202, content={
            "status": "processing",
            "message": f"Đang xử lý ngầm: '{task_id}'",
            "project_folder": f"{clean_name}/{task_id}",
            "expected_outputs": expected_outputs
        })
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(error)}")

@router.get("/status/{song_name}/{task_id}")
async def check_audio_status(song_name: str, task_id: str):
    if os.path.exists(os.path.join(OUTPUT_DIR, song_name, f"{task_id}_completed.txt")):
        return {"status": "completed"}
    return {"status": "processing"}

def chunked_file_reader(file_path: str, start: int, end: int, chunk_size: int = 1024 * 1024):
    with open(file_path, "rb") as f:
        f.seek(start)
        while (pos := f.tell()) <= end:
            read_size = min(chunk_size, end + 1 - pos)
            yield f.read(read_size)

@router.get("/stream/{project_name}/{file_name}")
async def stream_audio(project_name: str, file_name: str, request: Request):
    file_path = os.path.join(OUTPUT_DIR, project_name, file_name)
    if not os.path.exists(file_path):
        file_path = os.path.join(INPUT_DIR, project_name, file_name)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Không tìm thấy file Audio yêu cầu.")

    # Ép trình duyệt TẢI XUỐNG thay vì mở file chữ (.txt, .lrc)
    if file_name.endswith((".lrc", ".txt")):
        return FileResponse(
            path=file_path,
            media_type="text/plain; charset=utf-8",
            filename=file_name
        )

    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("Range")

    if range_header:
        match = re.search(r'bytes=(\d+)-(\d*)', range_header)
        start = int(match.group(1))
        end = int(match.group(2)) if match.group(2) else file_size - 1
        status_code = 206
        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(end - start + 1),
            "Content-Type": "audio/mpeg",
        }
        return StreamingResponse(chunked_file_reader(file_path, start, end), status_code=status_code, headers=headers)

    headers = {"Accept-Ranges": "bytes", "Content-Length": str(file_size), "Content-Type": "audio/mpeg"}
    return StreamingResponse(chunked_file_reader(file_path, 0, file_size - 1), headers=headers)

@router.get("/lyrics/{project_name}/{file_name}")
async def get_lyrics(project_name: str, file_name: str):
    lrc_path = os.path.join(OUTPUT_DIR, project_name, file_name)
    if not os.path.exists(lrc_path):
        return {"status": "error", "message": "Bài hát này chưa được bóc tách lời hoặc sai tên file."}

    lyrics_data = []
    try:
        with open(lrc_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            for line in lines:
                match = re.search(r'\[(\d{2}):(\d{2}\.\d{2,3})\](.*)', line)
                if match:
                    mins, secs, text = int(match.group(1)), float(match.group(2)), match.group(3).strip()
                    if text:
                        lyrics_data.append({"time": int((mins * 60 + secs) * 1000), "text": text})
        return {"status": "success", "project": project_name, "lyrics": lyrics_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý file lời: {str(e)}")