-- 1. Bảng Comments (Lời chúc của khách)
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    is_presence BOOLEAN, -- true: có mặt, false: vắng mặt
    content TEXT,
    gif_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bảng Likes (Lượt thích bình luận)
CREATE TABLE likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Bảng Configs (Cấu hình thiệp cưới: ẩn/hiện mừng cưới, v.v...)
CREATE TABLE configs (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Chèn dữ liệu cấu hình mẫu
INSERT INTO configs (key, value) VALUES 
('guest_book', '{"enabled": true}'),
('music', '{"enabled": true, "autoplay": false}');
-- Kích hoạt RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configs ENABLE ROW LEVEL SECURITY;

-- Cho phép TẤT CẢ mọi người (anon) được XEM danh sách lời chúc
CREATE POLICY "Cho phép mọi người xem lời chúc" ON comments
    FOR SELECT USING (true);

-- Cho phép TẤT CẢ mọi người (anon) được GỬI lời chúc mới
CREATE POLICY "Cho phép mọi người gửi lời chúc" ON comments
    FOR INSERT WITH CHECK (true);

-- Cho phép khách SỬA lời chúc của chính họ (nếu cần bảo mật cao hơn có thể tuỳ chỉnh, tạm thời mở public)
CREATE POLICY "Cho phép cập nhật lời chúc" ON comments
    FOR UPDATE USING (true);

-- Cho phép xoá bình luận
CREATE POLICY "Cho phép xoá lời chúc" ON comments
    FOR DELETE USING (true);

-- Cho phép mọi người xem và thả tim
CREATE POLICY "Cho phép mọi người xem likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Cho phép mọi người tạo likes" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép mọi người bỏ likes" ON likes FOR DELETE USING (true);

-- Cấu hình chỉ cho phép đọc
CREATE POLICY "Mọi người có thể đọc cấu hình" ON configs FOR SELECT USING (true);
