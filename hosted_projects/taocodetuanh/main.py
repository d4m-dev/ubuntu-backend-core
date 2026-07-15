import os
import io
from flask import Flask, request, jsonify, send_file
from PIL import Image
from google import genai
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))
# Lấy file .env ở thư mục cha (ubuntu/.env)
env_path = os.path.join(current_dir, '..', '.env')
load_dotenv(env_path)

API_KEY = os.getenv("GEMINI_API_KEY")

client = None
if not API_KEY:
    print("❌ CẢNH BÁO: Không tìm thấy GEMINI_API_KEY trong file .env!")
else:
    # Khởi tạo Client theo chuẩn SDK mới
    client = genai.Client(api_key=API_KEY)

# Khởi tạo ứng dụng Flask
app = Flask(__name__)

@app.route('/')
def index():
    """Trả về file giao diện index.html khi người dùng truy cập trang chủ."""
    html_path = os.path.join(current_dir, 'index.html')
    if not os.path.exists(html_path):
        return "Lỗi: Không tìm thấy file index.html. Vui lòng tạo file này cùng thư mục với main.py.", 404
    return send_file(html_path)

@app.route('/api/models', methods=['GET'])
def get_models():
    """Lấy danh sách các models được hỗ trợ bởi API key hiện tại."""
    if not client:
        return jsonify({"error": "Chưa cấu hình API Key"}), 400
        
    try:
        models_list = []
        # Quét tất cả các models theo SDK mới
        for m in client.models.list():
            # Chỉ lấy các model gemini
            if 'gemini' in m.name.lower():
                 models_list.append({
                     "name": m.name,
                     "display": getattr(m, 'display_name', m.name)
                 })
        
        # Sắp xếp để gemini-1.5-flash lên đầu vì nó nhanh và tối ưu nhất cho task này
        models_list.sort(key=lambda x: 'flash' in x['name'].lower(), reverse=True)
        return jsonify({"models": models_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate', methods=['POST'])
def generate_code():
    """Nhận hình ảnh và tên model từ client, gọi Gemini API và trả về code."""
    if not client:
        return jsonify({"error": "Hệ thống chưa được cấu hình API Key. Vui lòng kiểm tra file .env!"}), 400
        
    if 'image' not in request.files:
        return jsonify({"error": "Không tìm thấy file ảnh được tải lên."}), 400
        
    file = request.files['image']
    model_name = request.form.get('model', 'models/gemini-1.5-flash')
    custom_prompt = request.form.get('prompt', '').strip()
    
    if file.filename == '':
        return jsonify({"error": "File ảnh không hợp lệ."}), 400

    try:
        # Đọc dữ liệu ảnh trực tiếp từ bộ nhớ mà không cần lưu ra ổ cứng
        image_bytes = file.read()
        img = Image.open(io.BytesIO(image_bytes))
        
        # Thiết lập Prompt chuyên nghiệp
        base_prompt = """
        Bạn là một Chuyên gia Lập trình Front-end xuất sắc (Senior Front-end Developer).
        Nhiệm vụ của bạn là chuyển đổi thiết kế giao diện UI trong bức ảnh này thành mã nguồn thực tế.
        
        YÊU CẦU NGHIÊM NGẶT:
        1. Viết tất cả vào MỘT file HTML duy nhất (bao gồm cả <style> và <script>).
        2. Mã nguồn phải có cấu trúc tốt, semantic HTML.
        3. Phải Responsive (hiển thị tốt trên cả Mobile và Desktop).
        4. Sử dụng Tailwind CSS qua CDN (<script src="https://cdn.tailwindcss.com"></script>).
        5. Tái tạo màu sắc, font chữ, khoảng cách (margin/padding) giống hệt ảnh nhất có thể.
        6. KHÔNG giải thích, KHÔNG viết thêm bất kỳ văn bản nào ngoài mã nguồn. 
        7. Trả về định dạng code block chuẩn.
        """
        
        # Nếu người dùng có yêu cầu thêm, nối vào prompt
        final_prompt = base_prompt
        if custom_prompt:
            final_prompt += f"\n\nYÊU CẦU BỔ SUNG TỪ NGƯỜI DÙNG:\n{custom_prompt}"
            
        # Gọi API bằng SDK mới
        response = client.models.generate_content(
            model=model_name,
            contents=[final_prompt, img]
        )
        
        result_text = response.text
        
        # Xóa bỏ các ký hiệu markdown để lấy raw code
        clean_code = result_text.replace("```html", "").replace("```", "").strip()
        
        # Lưu lại một bản backup trên server (tùy chọn)
        output_filename = "latest_generated_code.html"
        backup_path = os.path.join(current_dir, output_filename)
        with open(backup_path, "w", encoding="utf-8") as f:
            f.write(clean_code)
            
        return jsonify({
            "success": True,
            "code": clean_code,
            "message": f"Tạo code thành công! Đã lưu backup tại {output_filename}"
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Lỗi trong quá trình xử lý AI: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Đang khởi động AutoCode AI Web Server...")
    print("👉 Vui lòng mở trình duyệt và truy cập: http://127.0.0.1:5000")
    # Sửa 0.0.0.1 thành 0.0.0.0 để có thể truy cập được từ thiết bị khác trong mạng
    app.run(host='0.0.0.0', port=5000, debug=True)