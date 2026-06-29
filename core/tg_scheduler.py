import asyncio
import httpx
from datetime import datetime
from core.tg_utils import send_telegram_message

# Bộ nhớ đệm chống gửi thông báo lặp
daily_flags = {"morning": False, "afternoon": False, "evening": False}
last_weather_condition = ""

# Lịch các sự kiện và câu chúc
holidays = {
    "01/01": "🎉 Chúc mừng Năm Mới! Chúc sếp một năm bùng nổ dự án!",
    "14/02": "💖 Valentine vui vẻ nha sếp!",
    "08/03": "🌸 Mùng 8/3 hạnh phúc và ý nghĩa nhé sếp!",
    "30/04": "🇻🇳 Mừng ngày Giải phóng miền Nam!",
    "01/05": "👷 Mừng ngày Quốc tế Lao động!",
    "02/09": "🇻🇳 Mừng ngày Quốc khánh!",
    "16/09": "🎂 Chúc mừng Sinh Nhật sếp Lý Thừa Ân! Tuổi mới code mượt, server vững như bàn thạch, bug tự động hóa giải nha sếp!",
    "20/10": "🌹 Mừng ngày Phụ nữ Việt Nam!",
    "24/12": "🎄 Giáng sinh an lành ấm áp nha sếp!"
}

async def fetch_financial_report():
    """Lấy dữ liệu Tỉ giá USD, JPY và Vàng"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Lấy tỉ giá USD và JPY từ API quốc tế
            res = await client.get("https://open.er-api.com/v6/latest/USD")
            data = res.json()
            vnd_rate = data["rates"]["VND"]
            jpy_rate = data["rates"]["JPY"]
            
            usd_to_vnd = vnd_rate
            jpy_to_vnd = vnd_rate / jpy_rate
            
            # Ước tính giá vàng thế giới (XAU/USD) 
            # (Do các API Vàng thường yêu cầu Key, tạm dùng ước tính an toàn hoặc cập nhật thủ công nếu có API nội bộ)
            # Công thức chuẩn: 1 Lượng Vàng = 1.205 Oz
            estimated_gold_usd_per_oz = 2350.00 
            gold_vnd_per_luong = estimated_gold_usd_per_oz * 1.205 * usd_to_vnd
            
            report = (
                f"📊 <b>BÁO CÁO TÀI CHÍNH SÁNG:</b>\n"
                f"🇺🇸 1 USD = {usd_to_vnd:,.0f} VNĐ\n"
                f"🇯🇵 1 JPY = {jpy_to_vnd:,.0f} VNĐ\n"
                f"🥇 Vàng (Ước tính World): {estimated_gold_usd_per_oz:,.0f} USD/Oz (~ {gold_vnd_per_luong:,.0f} VNĐ/Lượng)"
            )
            return report
    except Exception as e:
        return "⚠️ Không thể lấy dữ liệu tài chính sáng nay do lỗi vệ tinh."

async def check_weather_alert():
    """Giám sát vệ tinh thời tiết khu vực"""
    global last_weather_condition
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get("https://vi.wttr.in/Phu Quoc?format=%C")
            condition = res.text.strip().lower()
            
            alert_msg = ""
            if "rain" in condition or "mưa" in condition or "drizzle" in condition:
                alert_msg = "🌧️ <b>Trời đang chuyển mưa!</b> Sếp ra ngoài nhớ mang theo ô/áo mưa nhé."
            elif "storm" in condition or "bão" in condition or "thunder" in condition or "dông" in condition:
                alert_msg = "⛈️ <b>Cảnh báo Giông Bão!</b> Sếp chú ý an toàn và kiểm tra lại nguồn điện máy chủ nhé."
            elif "clear" in condition or "sun" in condition or "nắng" in condition:
                alert_msg = "☀️ <b>Trời đang nắng gắt!</b> Nhớ uống nhiều nước và chống nắng nha sếp."
            
            # Chỉ gửi cảnh báo nếu trạng thái thời tiết thay đổi (Tránh spam liên tục)
            if alert_msg and condition != last_weather_condition:
                last_weather_condition = condition
                await send_telegram_message(f"🚨 <b>CẢNH BÁO THỜI TIẾT PHÚ QUỐC:</b>\n{alert_msg}")
    except:
        pass

async def run_scheduler():
    """Vòng lặp thời gian cốt lõi của hệ thống"""
    global daily_flags
    await asyncio.sleep(5) # Đợi hệ thống khởi động xong mới bắt đầu đếm
    
    while True:
        now = datetime.now()
        current_time = now.strftime("%H:%M")
        current_date = now.strftime("%d/%m")
        
        # Reset cờ vào lúc nửa đêm
        if current_time == "00:00":
            daily_flags = {k: False for k in daily_flags}
            await asyncio.sleep(60)
            continue
            
        # 🌅 Chào buổi sáng & Báo cáo Tài chính (Lúc 07:00)
        if current_time == "07:00" and not daily_flags["morning"]:
            msg = f"🌅 Chào buổi sáng sếp Lý Thừa Ân! Chúc sếp một ngày làm việc thật năng suất.\n\n"
            
            if current_date in holidays:
                msg += f"🎊 <b>SỰ KIỆN HÔM NAY:</b> {holidays[current_date]}\n\n"
                
            fin_report = await fetch_financial_report()
            msg += fin_report
            
            await send_telegram_message(msg)
            daily_flags["morning"] = True
            
        # 🍲 Chào buổi trưa (Lúc 12:00)
        elif current_time == "12:00" and not daily_flags["afternoon"]:
            await send_telegram_message("🍲 Trưa rồi sếp ơi! Nghỉ tay ăn cơm và chợp mắt một chút cho có sức cày code tiếp nhé!")
            daily_flags["afternoon"] = True
            
        # 🌆 Chào buổi tối (Lúc 18:00)
        elif current_time == "18:00" and not daily_flags["evening"]:
            await send_telegram_message("🌆 Chiều tối rồi! Công việc gác lại, sếp mở Music Pro lên nghe nhạc thư giãn thôi nào.")
            daily_flags["evening"] = True

        # 🌤️ Quét radar thời tiết mỗi 30 phút (Vào phút thứ 00 và 30)
        if now.minute in [0, 30]:
            await check_weather_alert()

        # Nghỉ 60 giây để không tốn CPU
        await asyncio.sleep(60)