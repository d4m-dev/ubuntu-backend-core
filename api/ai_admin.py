from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from google import genai 
import re
import time

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

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def ai_admin_chat(request: ChatRequest):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=400, detail="Chưa cấu hình GEMINI_API_KEY trong file .env")

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # 1. Thu thập danh sách các model đang khả dụng với API Key này
        available_models = []
        for m in client.models.list():
            if 'gemini' in m.name.lower() and hasattr(m, 'supported_actions') and 'generateContent' in m.supported_actions:
                available_models.append(m.name)
            elif 'gemini' in m.name.lower():
                available_models.append(m.name)
        
        if not available_models:
            raise Exception("Khóa API Key không có quyền truy cập bất kỳ mô hình Gemini nào.")

        # 2. Chuẩn bị dữ liệu hệ thống
        recent_logs = get_raw_logs(limit=30)
        current_status = "\n".join([f"- {k}: {'ĐANG BẬT' if v['active'] else 'ĐANG TẮT'}" for k, v in api_status_db.items()])

        system_prompt = f"""
        Bạn là AI Quản trị viên (Admin) sở hữu đặc quyền tối cao của hệ thống Ubuntu Backend Core. Ngôn ngữ: Tiếng Việt.
        Trạng thái vận hành thực tế:
        {current_status}
        
        Nhật ký hệ thống gần nhất:
        {recent_logs}
        
        QUY TẮC BẮT BUỘC: Khi có yêu cầu BẬT hoặc TẮT dịch vụ (internet_tunnel, chatbox_ai, social_db), BẮT BUỘC chèn mã [TOGGLE: ten_dich_vu] vào cuối câu trả lời.
        Yêu cầu hiện tại: {request.message}
        """

        # 3. 🚀 CƠ CHẾ AUTO-RETRY VÀ FALLBACK CHỐNG LỖI 503 / 429
        # Xếp hạng các model từ xịn nhất đến nhẹ nhất để chuyển đổi nếu bị nghẽn
        target_models_priority = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro', 'gemini-pro']
        
        max_retries = 3
        reply_text = ""
        action_taken = None
        used_model_name = ""

        for attempt in range(max_retries):
            try:
                # Chọn model dựa theo số lần thử lại (Lần 1 dùng Flash, Lần 2 dùng Flash-8b...)
                target_str = target_models_priority[attempt % len(target_models_priority)]
                chosen_model = next((m for m in available_models if target_str in m.lower()), available_models[0])
                used_model_name = chosen_model.replace('models/', '')

                response = client.models.generate_content(
                    model=used_model_name,
                    contents=system_prompt,
                )
                reply_text = response.text
                break  # Thoát vòng lặp nếu gọi AI thành công

            except Exception as call_err:
                error_message = str(call_err)
                # Nếu dính lỗi quá tải (503) hoặc vượt giới hạn rate limit (429)
                if '503' in error_message or '429' in error_message or 'UNAVAILABLE' in error_message:
                    if attempt < max_retries - 1:
                        time.sleep(1.5)  # Nghỉ 1.5 giây để Google xả tải rồi mới gọi lại
                        continue
                
                # Nếu đã thử hết số lần hoặc dính lỗi nghiêm trọng khác thì báo ra ngoài
                raise Exception(f"Lỗi Server Google ({error_message}) - Đã thử bằng {used_model_name}")

        # 4. Phân tích lệnh thực thi hạ tầng
        match = re.search(r'\[TOGGLE:\s*([a-zA-Z0-9_]+)\]', reply_text)
        
        if match:
            target_service = match.group(1).strip()
            if target_service in api_status_db:
                current_state = api_status_db[target_service]["active"]
                new_state = not current_state
                
                if target_service == "internet_tunnel":
                    if new_state: start_tunnel()
                    else: stop_tunnel()
                
                api_status_db[target_service]["active"] = new_state
                action_taken = f"Hệ thống đã thực thi lệnh: {'BẬT' if new_state else 'TẮT'} thành công dịch vụ {target_service}"
                reply_text = re.sub(r'\[TOGGLE:\s*([a-zA-Z0-9_]+)\]', '', reply_text).strip()

        return {
            "status": "success",
            "reply": reply_text,
            "action_executed": action_taken,
            "debug_model": used_model_name
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống AI: {str(e)}")