import os
import re
import io
import uuid
import threading
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# Import màng lọc bảo mật từ hệ thống lõi
from api.admin_scripts import verify_admin_token

# Biến thành Router thay vì FastAPI App độc lập
router = APIRouter(prefix="/api/dldriver", tags=["Google Drive Core"])

SCOPES = ['https://www.googleapis.com/auth/drive']

# =======================================================
# 🚀 CẤU TRÚC ĐƯỜNG DẪN MỚI (TÁCH BIỆT AUTH VÀ MÃ NGUỒN)
# =======================================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUTH_DIR = os.path.join(BASE_DIR, 'auth')

# Tự động tạo thư mục auth/ nếu nó chưa tồn tại để tránh lỗi crash
os.makedirs(AUTH_DIR, exist_ok=True)

# Trỏ chính xác vào file token và credentials nằm trong auth/
TOKEN_PATH = os.path.join(AUTH_DIR, 'token.json')
CREDENTIALS_PATH = os.path.join(AUTH_DIR, 'credentials.json') # Định vị sẵn cho sếp nếu sau này cần dùng tới flow tạo token mới
# =======================================================

task_progress = {}
progress_lock = threading.Lock()

class DownloadRequest(BaseModel):
    url: str
    destination: Optional[str] = "/var/www/downloads"

class CopyRequest(BaseModel):
    source_url: str
    target_url: Optional[str] = "root"

def get_drive_service():
    if not os.path.exists(TOKEN_PATH):
        raise HTTPException(status_code=401, detail="Không tìm thấy token.json trong thư mục auth/. Vui lòng cấp quyền Google API trước.")
    
    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_PATH, 'w') as token:
            token.write(creds.to_json())
            
    return build('drive', 'v3', credentials=creds)

def extract_id(url_or_id: str) -> Optional[str]:
    if not url_or_id: return None
    match = re.search(r'folders/([a-zA-Z0-9-_]+)', url_or_id)
    if match: return match.group(1)
    match = re.search(r'id=([a-zA-Z0-9-_]+)', url_or_id)
    if match: return match.group(1)
    return url_or_id

def update_task_log(task_id: str, status: str, message: str):
    with progress_lock:
        if task_id not in task_progress:
            task_progress[task_id] = {"status": "processing", "logs": []}
        task_progress[task_id]["status"] = status
        task_progress[task_id]["logs"].append(message)
        if len(task_progress[task_id]["logs"]) > 50:
            task_progress[task_id]["logs"].pop(0)

def bg_download_folder(task_id: str, folder_id: str, local_dir: str):
    try:
        service = get_drive_service()
        folder_meta = service.files().get(fileId=folder_id, fields='name').execute()
        root_name = folder_meta.get('name', 'Unknown_Folder')
        final_dir = os.path.join(local_dir, root_name)
        
        update_task_log(task_id, "processing", f"[+] Bắt đầu kéo Data: {root_name}")
        
        def _recursive_download(f_id, current_local_path):
            if not os.path.exists(current_local_path):
                os.makedirs(current_local_path, exist_ok=True)
                
            query = f"'{f_id}' in parents and trashed = false"
            page_token = None
            
            while True:
                results = service.files().list(q=query, fields="nextPageToken, files(id, name, mimeType)", pageToken=page_token).execute()
                for item in results.get('files', []):
                    if item['mimeType'] == 'application/vnd.google-apps.folder':
                        _recursive_download(item['id'], os.path.join(current_local_path, item['name']))
                    else:
                        if 'application/vnd.google-apps' in item['mimeType']: continue
                        update_task_log(task_id, "processing", f"-> Kéo file: {item['name']}")
                        try:
                            req = service.files().get_media(fileId=item['id'])
                            fh = io.BytesIO()
                            downloader = MediaIoBaseDownload(fh, req)
                            done = False
                            while not done: _, done = downloader.next_chunk()
                            with open(os.path.join(current_local_path, item['name']), 'wb') as f: f.write(fh.getvalue())
                        except Exception as file_err:
                            update_task_log(task_id, "processing", f"[!] Lỗi tải {item['name']}: {str(file_err)}")
                            
                page_token = results.get('nextPageToken', None)
                if not page_token: break
                    
        _recursive_download(folder_id, final_dir)
        update_task_log(task_id, "completed", f"[✓] HOÀN TẤT! Dữ liệu nằm tại: {final_dir}")
    except Exception as e:
        update_task_log(task_id, "failed", f"[-] Lỗi Hệ Thống: {str(e)}")

def bg_copy_folder(task_id: str, src_id: str, target_parent_id: str):
    try:
        service = get_drive_service()
        def _recursive_copy(s_id, t_parent_id):
            folder_meta = service.files().get(fileId=s_id, fields='name').execute()
            s_name = folder_meta.get('name', 'Unknown')
            
            update_task_log(task_id, "processing", f"[+] Clone cấu trúc: {s_name}")
            
            new_folder_meta = {'name': s_name, 'mimeType': 'application/vnd.google-apps.folder', 'parents': [t_parent_id] if t_parent_id and t_parent_id != 'root' else []}
            new_folder = service.files().create(body=new_folder_meta, fields='id').execute()
            new_id = new_folder.get('id')
            
            query = f"'{s_id}' in parents and trashed = false"
            page_token = None
            
            while True:
                results = service.files().list(q=query, fields="nextPageToken, files(id, name, mimeType)", pageToken=page_token).execute()
                for item in results.get('files', []):
                    if item['mimeType'] == 'application/vnd.google-apps.folder':
                        _recursive_copy(item['id'], new_id)
                    else:
                        update_task_log(task_id, "processing", f" -> Cấy Server-to-Server: {item['name']}")
                        try: service.files().copy(fileId=item['id'], body={'name': item['name'], 'parents': [new_id]}).execute()
                        except Exception as copy_err: update_task_log(task_id, "processing", f" [!] Fail {item['name']}: {str(copy_err)}")
                page_token = results.get('nextPageToken', None)
                if not page_token: break
                    
        _recursive_copy(src_id, target_parent_id)
        update_task_log(task_id, "completed", "[✓] NHÂN BẢN THÀNH CÔNG!")
    except Exception as e:
        update_task_log(task_id, "failed", f"[-] Lỗi Hệ Thống: {str(e)}")

# --- Endpoints ---
@router.get("/status")
def check_status(admin=Depends(verify_admin_token)):
    return {"authenticated": os.path.exists(TOKEN_PATH)}

@router.post("/download")
def start_download(payload: DownloadRequest, background_tasks: BackgroundTasks, admin=Depends(verify_admin_token)):
    folder_id = extract_id(payload.url)
    if not folder_id: raise HTTPException(status_code=400, detail="URL không hợp lệ")
    task_id = str(uuid.uuid4())
    task_progress[task_id] = {"status": "pending", "logs": ["[+] Khởi tạo luồng kéo dữ liệu..."]}
    background_tasks.add_task(bg_download_folder, task_id, folder_id, payload.destination)
    return {"task_id": task_id}

@router.post("/copy")
def start_copy(payload: CopyRequest, background_tasks: BackgroundTasks, admin=Depends(verify_admin_token)):
    src_id = extract_id(payload.source_url)
    target_id = extract_id(payload.target_url) if payload.target_url else "root"
    if not src_id: raise HTTPException(status_code=400, detail="URL Nguồn không hợp lệ")
    task_id = str(uuid.uuid4())
    task_progress[task_id] = {"status": "pending", "logs": ["[+] Khởi tạo Clone Drive-to-Drive..."]}
    background_tasks.add_task(bg_copy_folder, task_id, src_id, target_id)
    return {"task_id": task_id}

@router.get("/progress/{task_id}")
def get_progress(task_id: str, admin=Depends(verify_admin_token)):
    if task_id not in task_progress: raise HTTPException(status_code=404, detail="Task not found")
    return task_progress[task_id]