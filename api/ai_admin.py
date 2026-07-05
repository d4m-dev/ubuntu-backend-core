from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from google import genai 
import re
import time
import logging

from core.security import verify_token
from core.config import settings
from core.database import get_raw_logs
from api.dashboard import api_status_db
from scripts.network_tunnel import start_tunnel, stop_tunnel

router = APIRouter(
    prefix="/api/ai-admin",
    tags=["AI Admin"],
    dependencies=[Depends(verify_token)] 
)

# 🛡️ BẢO MẬT: Giới hạn độ dài tin nhắn tối đa 1000 ký tự để chống DoS Prompt
class ChatRequest(BaseModel):
    message: str = Field(..., max_length=1000, description="Nội dung chat gửi cho AI")

TARGET_MODELS_PRIORITY = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro', 'gemini-pro']

@router.post("/chat")
async def ai_admin_chat(request: ChatRequest):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Lỗi máy chủ: Chưa cấu hình AI.")

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        available_models = [
            m.name for m in client.models.list() 
            if 'gemini' in m.name.lower() and ('generateContent' in getattr(m, 'supported_actions', []))
        ]
        
        if not available_models:
            raise ValueError("Không có model Gemini nào khả dụng.")

        recent_logs = get_raw_logs(limit=30)
        current_status = "\n".join([f"- {k}: {'ĐANG BẬT' if v['active'] else 'ĐANG TẮT'}" for k, v in api_status_db.items()])

        system_prompt = f"""
        Bạn là AI Quản trị viên (Admin) hệ thống Ubuntu Backend Core. Tiếng Việt.
        Trạng thái: {current_status}
        Nhật ký: {recent_logs}
        QUY TẮC BẮT BUỘC: Để BẬT/TẮT (internet_tunnel, chatbox_ai, social_db), BẮT BUỘC chèn [TOGGLE: ten_dich_vu] vào cuối.
        Yêu cầu: {request.message}
        """

        max_retries = 3
        reply_text = ""
        action_taken = None
        used_model_name = ""

        for attempt in range(max_retries):
            try:
                target_str = TARGET_MODELS_PRIORITY[attempt % len(TARGET_MODELS_PRIORITY)]
                chosen_model = next((m for m in available_models if target_str in m.lower()), available_models[0])
                used_model_name = chosen_model.replace('models/', '')

                response = client.models.generate_content(
                    model=used_model_name,
                    contents=system_prompt,
                )
                reply_text = response.text
                break
            except Exception as call_err:
                error_message = str(call_err)
                if any(err in error_message for err in ['503', '429', 'UNAVAILABLE']) and attempt < max_retries - 1:
                    time.sleep(1.5)
                    continue
                raise ValueError(f"Lỗi API Model: {error_message}")

        # Xử lý lệnh TOGGLE
        match = re.search(r'\[TOGGLE:\s*([a-zA-Z0-9_]+)\]', reply_text)
        if match:
            target_service = match.group(1).strip()
            if target_service in api_status_db:
                new_state = not api_status_db[target_service]["active"]
                if target_service == "internet_tunnel":
                    start_tunnel() if new_state else stop_tunnel()
                
                api_status_db[target_service]["active"] = new_state
                action_taken = f"Đã {'BẬT' if new_state else 'TẮT'} {target_service}"
                reply_text = re.sub(r'\[TOGGLE:\s*([a-zA-Z0-9_]+)\]', '', reply_text).strip()

        return {
            "status": "success",
            "reply": reply_text,
            "action_executed": action_taken
        }

    except Exception as e:
        # 🛡️ BẢO MẬT: Ghi log lỗi ngầm, không trả chi tiết ra ngoài để tránh lộ cấu trúc
        logging.error(f"AI_ADMIN_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Lỗi kết nối bộ não AI. Đã ghi log hệ thống.")