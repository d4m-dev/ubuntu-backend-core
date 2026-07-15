# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from google import genai 
import re
import time
import logging
import json
import jwt
import calendar
from datetime import datetime

from core.security import verify_token
from core.config import settings
from core.database import get_raw_logs, db_inserter, db_executor
from api.dashboard import api_status_db
from scripts.network_tunnel import start_tunnel, stop_tunnel

router = APIRouter(
    prefix="/api/ai-admin",
    tags=["AI Admin"],
    dependencies=[Depends(verify_token)] 
)

class ChatRequest(BaseModel):
    message: str = Field(..., max_length=1000)

def get_user_id_from_token(authorization: str):
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload.get("user_id") or payload.get("id") or 1 
    except:
        return 1

# TỪ ĐIỂN MAP GIỜ CHUẨN XÁC THEO QUY TẮC CỦA SẾP
SHIFT_TIME_MAP = {
    "M5": ("05:00", "13:00"), "M6": ("06:00", "14:00"), "M7": ("07:00", "15:00"), "M8": ("08:00", "16:00"), "M9": ("09:00", "17:00"), "M10": ("10:00", "18:00"),
    "A11": ("11:00", "19:00"), "A12": ("12:00", "20:00"), "A1": ("13:00", "21:00"), "A2": ("14:00", "22:00"), "A3": ("15:00", "23:00"), "A4": ("16:00", "00:00"), "A5": ("17:00", "01:00"), "A6": ("18:00", "02:00"),
    "N7": ("19:00", "03:00"), "N8": ("20:00", "04:00"), "N9": ("21:00", "05:00"), "N10": ("22:00", "06:00")
}

# ==========================================
# 🚀 API CHO GIAO DIỆN NATIVE CALENDAR 
# ==========================================
@router.get("/schedules")
async def get_schedules(month: int, year: int, authorization: str = Header(None)):
    try:
        last_day = calendar.monthrange(year, month)[1]
        start_date = f"{year}-{month:02d}-01"
        end_date = f"{year}-{month:02d}-{last_day:02d}"
        
        sql = f"""SELECT id, work_date, shift_name, is_off 
                  FROM work_schedules 
                  WHERE work_date >= '{start_date}' AND work_date <= '{end_date}'"""
        records = db_executor.select_as_list_dict(sql)
        
        schedule_dict = {}
        if records:
            for r in records:
                d = r['work_date']
                date_str = d.strftime('%Y-%m-%d') if hasattr(d, 'strftime') else str(d)[:10] 
                schedule_dict[date_str] = {
                    "id": r['id'],
                    "shift_name": r['shift_name'],
                    "is_off": bool(r['is_off'])
                }
        return {"status": "success", "data": schedule_dict}
    except Exception as e:
        logging.error(f"Lỗi GET Schedules: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ManualScheduleRequest(BaseModel):
    date: str 
    shift_name: str 

@router.post("/schedule")
async def save_manual_schedule(req: ManualScheduleRequest, authorization: str = Header(None)):
    user_id = get_user_id_from_token(authorization) if authorization else 1
    
    is_off = 1 if req.shift_name == "OFF" else 0
    start_time, end_time = None, None
    if not is_off and req.shift_name != "DELETE":
        start_time, end_time = SHIFT_TIME_MAP.get(req.shift_name, ("00:00", "08:00"))
    
    try:
        check_sql = f"SELECT id, gcal_event_id FROM work_schedules WHERE work_date='{req.date}'"
        existing = db_executor.select_as_list_dict(check_sql)
        
        gcal_event_id = None
        if existing:
            for ex in existing:
                if ex.get('gcal_event_id'):
                    gcal_event_id = ex.get('gcal_event_id')
                    break
            db_inserter.insert(f"DELETE FROM work_schedules WHERE work_date='{req.date}'", ())
        
        if req.shift_name == "DELETE":
            return {"status": "success", "message": "Đã xóa lịch"}

        new_gcal_id = None
        try:
            from core.gcal import add_event
            new_gcal_id = add_event(
                date_str=req.date, shift_name=req.shift_name, 
                start_time=start_time, end_time=end_time, 
                is_off=is_off, event_id=gcal_event_id
            )
        except Exception as e:
            logging.error(f"Manual Sync Gcal Error: {e}")

        sql = '''INSERT INTO work_schedules 
                 (user_id, work_date, shift_name, start_time, end_time, is_off, gcal_event_id) 
                 VALUES (%s, %s, %s, %s, %s, %s, %s)'''
        db_inserter.insert(sql, (user_id, req.date, req.shift_name, start_time, end_time, is_off, new_gcal_id))
            
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 🚀 CHAT AI J.A.R.V.I.S 
# ==========================================
@router.post("/chat")
async def ai_admin_chat(request: ChatRequest, authorization: str = Header(None)):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Chưa cấu hình GEMINI_API_KEY.")

    user_id = get_user_id_from_token(authorization) if authorization else 1

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        try:
            available_models = [m.name.replace('models/', '') for m in client.models.list() if 'gemini' in m.name.lower()]
            chosen_model = next((m for m in available_models if 'gemini-1.5-flash' in m), available_models[0])
        except:
            chosen_model = 'gemini-1.5-flash'

        recent_logs = get_raw_logs(limit=30)
        current_status = "\n".join([f"- {k}: {'ĐANG BẬT' if v['active'] else 'ĐANG TẮT'}" for k, v in api_status_db.items()])
        
        now = datetime.now()
        weekdays = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
        now_str = f"{weekdays[int(now.strftime('%w'))]}, ngày {now.strftime('%d/%m/%Y, %H:%M')}"
        
        try:
            sql_sch = """SELECT work_date, shift_name, start_time, end_time, is_off 
                         FROM work_schedules 
                         WHERE work_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
                         AND work_date <= DATE_ADD(CURDATE(), INTERVAL 21 DAY) 
                         ORDER BY work_date ASC"""
            raw_sch = db_executor.select_as_list_dict(sql_sch)
            sch_text = "DỮ LIỆU LỊCH TRÌNH CỦA SẾP TRONG DATABASE:\n"
            if raw_sch:
                for s in raw_sch:
                    d_str = s['work_date'].strftime('%Y-%m-%d') if hasattr(s['work_date'], 'strftime') else str(s['work_date'])[:10]
                    if s.get('is_off'):
                        sch_text += f"- Ngày {d_str}: NGHỈ LÀM (OFF)\n"
                    else:
                        sch_text += f"- Ngày {d_str}: Ca {s.get('shift_name')}\n"
            else:
                sch_text += "- Chưa có lịch trình nào được lưu.\n"
        except Exception as e:
            sch_text = ""
        
        system_prompt = f"""
        Bạn là J.A.R.V.I.S - Trợ lý Hệ sinh thái D4M.
        Thời gian hệ thống: {now_str}. 

        {current_status}

        {sch_text}

        QUY TẮC ĐIỀU KHIỂN:
        1. BẬT/TẮT DỊCH VỤ: Chèn `[TOGGLE: ten_dich_vu]`
        2. QUẢN LÝ LỊCH TRÌNH: Dựa theo 18 ca làm (M5..M10, A11..A6, N7..N10). Nếu nghỉ là OFF.
           Chèn khối JSON vào cuối câu (CHỈ CẦN date, shift_name, is_off):
           [SCHEDULE_DATA: [{{"date": "YYYY-MM-DD", "shift_name": "M5", "is_off": false}}, ...]]

        Yêu cầu của Sếp: {request.message}
        """

        max_retries = 3
        reply_text = ""
        action_taken = ""

        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model=chosen_model,
                    contents=system_prompt,
                )
                reply_text = response.text
                break
            except Exception as call_err:
                error_message = str(call_err)
                if attempt < max_retries - 1:
                    time.sleep(2) 
                    continue
                raise ValueError(f"Lỗi API Model {chosen_model}: {error_message}")

        match_toggle = re.search(r'\[TOGGLE:\s*([a-zA-Z0-9_]+)\]', reply_text)
        if match_toggle:
            target_service = match_toggle.group(1).strip()
            if target_service in api_status_db:
                new_state = not api_status_db[target_service]["active"]
                if target_service == "internet_tunnel": start_tunnel() if new_state else stop_tunnel()
                api_status_db[target_service]["active"] = new_state
                action_taken = f"Đã {'BẬT' if new_state else 'TẮT'} {target_service}"
            reply_text = re.sub(r'\[TOGGLE:\s*([a-zA-Z0-9_]+)\]', '', reply_text).strip()

        match_schedule = re.search(r'\[SCHEDULE_DATA:\s*(\[.*\])\s*\]', reply_text, re.DOTALL)
        if match_schedule:
            schedule_json_str = match_schedule.group(1)
            try:
                schedules = json.loads(schedule_json_str)
                inserted_count = 0
                for sch in schedules:
                    is_off = 1 if sch.get('is_off') else 0
                    safe_shift = sch.get('shift_name') or 'OFF'
                    work_date = sch.get('date')
                    
                    # 🚀 CORE XỬ LÝ GIỜ: Ép cứng hệ thống, không tin tưởng AI
                    if is_off or safe_shift == 'OFF':
                        s_time, e_time = None, None
                    else:
                        s_time, e_time = SHIFT_TIME_MAP.get(safe_shift.upper(), ("00:00", "08:00"))
                    
                    check_sql = f"SELECT id, gcal_event_id FROM work_schedules WHERE work_date='{work_date}'"
                    existing_records = db_executor.select_as_list_dict(check_sql)
                    
                    existing_gcal_id = None
                    if existing_records:
                        for ex in existing_records:
                            if ex.get('gcal_event_id'):
                                existing_gcal_id = ex.get('gcal_event_id')
                                break
                        db_inserter.insert(f"DELETE FROM work_schedules WHERE work_date='{work_date}'", ())

                    gcal_id = None
                    try:
                        from core.gcal import add_event
                        gcal_id = add_event(
                            date_str=work_date, shift_name=safe_shift,
                            start_time=s_time, end_time=e_time,
                            is_off=is_off, event_id=existing_gcal_id
                        )
                    except Exception as g_err: pass

                    sql = '''INSERT INTO work_schedules 
                             (user_id, work_date, shift_name, start_time, end_time, is_off, gcal_event_id) 
                             VALUES (%s, %s, %s, %s, %s, %s, %s)'''
                    db_inserter.insert(sql, (user_id, work_date, safe_shift, s_time, e_time, is_off, gcal_id))
                    inserted_count += 1
                
                msg_sch = f"Đã cập nhật {inserted_count} lịch làm việc."
                action_taken = f"{action_taken} | {msg_sch}" if action_taken else msg_sch
            except Exception as json_err:
                logging.error(f"Lỗi JSON: {json_err}")
            
            reply_text = re.sub(r'\[SCHEDULE_DATA:\s*\[.*\]\s*\]', '', reply_text, flags=re.DOTALL).strip()

        return {"status": "success", "reply": reply_text, "action_executed": action_taken}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))