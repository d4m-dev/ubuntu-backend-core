import os
from celery import Celery

# 🚀 Khởi tạo Celery kết nối với não bộ Redis cục bộ
celery_app = Celery(
    "d4m_worker",
    broker="redis://127.0.0.1:6379/0",
    backend="redis://127.0.0.1:6379/0"
)

# 🛡️ CẤU HÌNH BẢO VỆ CPU: Ép máy chủ chỉ xử lý 1 tác vụ AI tại 1 thời điểm
celery_app.conf.update(
    worker_concurrency=1,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    timezone='Asia/Ho_Chi_Minh'
)

@celery_app.task(name="tasks.process_audio")
def task_process_audio(*args, **kwargs):
    # Import cục bộ để chống lỗi vòng lặp (Circular Import)
    from api.audio_engine import process_audio_pipeline
    process_audio_pipeline(*args, **kwargs)
    return "Audio Pipeline Hoàn Thành"

@celery_app.task(name="tasks.admin_ytdl_pipeline")
def task_admin_ytdl_pipeline(*args, **kwargs):
    from api.ytdl import run_admin_audio_pipeline
    run_admin_audio_pipeline(*args, **kwargs)
    return "YTDL AI Pipeline Hoàn Thành"