/**
 * PHẦN 1: KHO CÂU HỎI KIẾN THỨC (GAME HACK NÃO)
 * Lưu ý: Trả lời KHÔNG DẤU. Mỗi câu có thể có nhiều đáp án đúng.
 */
const manualRiddles = [
    { id: 1, question: "Thủ đô của Việt Nam là gì?", answer: ["ha noi"], hint: "Thành phố có Hồ Gươm." },
    { id: 2, question: "Tác giả của Truyện Kiều là ai?", answer: ["nguyen du"], hint: "Đại thi hào thời Nguyễn." },
    { id: 3, question: "Biểu tượng hóa học của vàng là gì?", answer: ["au"], hint: "Ký hiệu trong bảng tuần hoàn." },
    { id: 4, question: "Hệ điều hành của iPhone là gì?", answer: ["ios"], hint: "Hệ điều hành do Apple phát triển." },
    { id: 5, question: "Vịnh Hạ Long thuộc tỉnh nào?", answer: ["quang ninh"], hint: "Tỉnh ven biển miền Bắc." },
    { id: 6, question: "Quốc gia có tháp Eiffel là nước nào?", answer: ["phap", "france"], hint: "Thủ đô là Paris." },
    { id: 7, question: "Đồng tiền của Việt Nam gọi là gì?", answer: ["dong", "vnd"], hint: "Ký hiệu VND." },
    { id: 8, question: "Ai là tác giả Quốc ca Việt Nam?", answer: ["van cao"], hint: "Tác giả bài Tiến quân ca." },
    { id: 9, question: "Hành tinh lớn nhất hệ Mặt Trời là gì?", answer: ["sao moc", "jupiter"], hint: "Hành tinh khí khổng lồ." },
    { id: 10, question: "Hành tinh gần Mặt Trời nhất là gì?", answer: ["sao thuy", "mercury"], hint: "Hành tinh nhỏ nhất hệ Mặt Trời." },
    { id: 11, question: "Đại dương lớn nhất thế giới là gì?", answer: ["thai binh duong", "pacific"], hint: "Còn gọi là Thái Bình Dương." },
    { id: 12, question: "Khí chiếm tỉ lệ lớn nhất trong khí quyển Trái Đất?", answer: ["nito", "nitrogen"], hint: "Chiếm khoảng 78%." },
    { id: 13, question: "Đơn vị đo cường độ dòng điện là gì?", answer: ["ampe", "ampere", "a"], hint: "Ký hiệu A." },
    { id: 14, question: "Nguyên tố có ký hiệu Fe là gì?", answer: ["sat", "iron"], hint: "Kim loại phổ biến trong thép." },
    { id: 15, question: "Thành phố nào được gọi là Thành phố ngàn hoa?", answer: ["da lat"], hint: "Thành phố cao nguyên ở Lâm Đồng." },
    { id: 16, question: "Sông nào chảy qua Hà Nội?", answer: ["song hong"], hint: "Sông mang phù sa đỏ." },
    { id: 17, question: "Kỳ quan thiên nhiên của Việt Nam là gì?", answer: ["vinh ha long", "ha long bay"], hint: "Di sản UNESCO ở Quảng Ninh." },
    { id: 18, question: "Dãy núi cao nhất thế giới là gì?", answer: ["himalaya"], hint: "Dãy núi có đỉnh Everest." },
    { id: 19, question: "Giải bóng đá lớn nhất thế giới là gì?", answer: ["world cup", "fifa world cup"], hint: "Giải đấu do FIFA tổ chức." },
    { id: 20, question: "Thủ đô của Nhật Bản là gì?", answer: ["tokyo"], hint: "Thành phố đông dân bậc nhất." },
    { id: 21, question: "Thủ đô của Thái Lan là gì?", answer: ["bangkok"], hint: "Thành phố bên sông Chao Phraya." },
    { id: 22, question: "Ngôn ngữ chính thức của Brazil là gì?", answer: ["bo dao nha", "portuguese", "tieng bo dao nha"], hint: "Ngôn ngữ khác với Tây Ban Nha." },
    { id: 23, question: "Một tá có bao nhiêu?", answer: ["12", "muoi hai", "mười hai"], hint: "Một chục cộng hai." },
    { id: 24, question: "Màu quốc kỳ Việt Nam gồm những màu nào?", answer: ["do va vang", "vang va do"], hint: "Nền đỏ, sao vàng." },
    { id: 25, question: "Biển ở phía đông Việt Nam gọi là gì?", answer: ["bien dong"], hint: "Biển giáp nhiều nước Đông Nam Á." },
    { id: 26, question: "Đại dương bao quanh Nam Cực là gì?", answer: ["nam bang duong", "southern ocean"], hint: "Đại dương ở cực Nam." },
    { id: 27, question: "Trái đất có bao nhiêu châu lục?", answer: ["7", "bay"], hint: "Số châu lục hiện đại." },
    { id: 28, question: "Ký hiệu hóa học của nước là gì?", answer: ["h2o"], hint: "Gồm 2 H và 1 O." },
    { id: 29, question: "Quốc gia có Kim Tự Tháp là nước nào?", answer: ["ai cap", "egypt"], hint: "Giza nằm ở nước này." },
    { id: 30, question: "Thành phố lớn nhất Việt Nam theo dân số?", answer: ["tp ho chi minh", "ho chi minh", "sai gon", "saigon"], hint: "Từng gọi là Sài Gòn." },
    { id: 31, question: "Thiết bị đo nhiệt độ gọi là gì?", answer: ["nhiet ke", "thermometer"], hint: "Dùng trong y tế và khí tượng." },
    { id: 32, question: "Nhà bác học gắn với định luật vạn vật hấp dẫn?", answer: ["newton", "isaac newton"], hint: "Nhà khoa học người Anh." },
    { id: 33, question: "Núi cao nhất Việt Nam là gì?", answer: ["phan xi pang", "fansipan"], hint: "Nóc nhà Đông Dương." },
    { id: 34, question: "Quốc hoa của Việt Nam là gì?", answer: ["hoa sen", "sen"], hint: "Loài hoa gắn với hồ nước." },
    { id: 35, question: "Đơn vị tiền tệ của Nhật Bản là gì?", answer: ["yen", "jpy"], hint: "Ký hiệu JPY." },
    { id: 36, question: "Môn thể thao vua là gì?", answer: ["bong da", "football", "soccer"], hint: "Môn thể thao phổ biến nhất thế giới." },
    { id: 37, question: "Chữ cái đầu tiên trong bảng chữ cái Latin?", answer: ["a"], hint: "Chữ đứng đầu bảng." },
    { id: 38, question: "Di sản UNESCO nổi tiếng ở Bắc Ninh là gì?", answer: ["quan ho", "dan ca quan ho"], hint: "Dân ca Kinh Bắc." },
    { id: 39, question: "Thủ đô của Hàn Quốc là gì?", answer: ["seoul"], hint: "Thành phố lớn nhất Hàn Quốc." },
    { id: 40, question: "Quốc gia có Vạn Lý Trường Thành?", answer: ["trung quoc", "china"], hint: "Đất nước đông dân ở châu Á." },
    { id: 41, question: "Cơ quan lập pháp của Việt Nam gọi là gì?", answer: ["quoc hoi"], hint: "Cơ quan quyền lực nhà nước cao nhất." },
    { id: 42, question: "Đảo lớn nhất Việt Nam là gì?", answer: ["phu quoc"], hint: "Hòn đảo du lịch nổi tiếng." },
    { id: 43, question: "Cố đô Huế thuộc tỉnh nào?", answer: ["thua thien hue", "hue"], hint: "Tỉnh miền Trung." },
    { id: 44, question: "Dụng cụ đo áp suất gọi là gì?", answer: ["ap ke", "manometer"], hint: "Dùng trong vật lý." },
    { id: 45, question: "Năm có bao nhiêu tháng?", answer: ["12", "muoi hai"], hint: "Một năm tròn." },
    { id: 46, question: "Châu lục có diện tích lớn nhất là gì?", answer: ["chau a", "asia"], hint: "Châu lục đông dân nhất." },
    { id: 47, question: "Châu lục nhỏ nhất là gì?", answer: ["chau dai duong", "chau uc", "australia"], hint: "Châu lục ở bán cầu Nam." },
    { id: 48, question: "Đỉnh núi cao nhất thế giới là gì?", answer: ["everest", "mount everest"], hint: "Đỉnh cao nhất Himalaya." },
    { id: 49, question: "Con sông dài nhất thế giới?", answer: ["song nile", "nile"], hint: "Sông ở châu Phi." },
    { id: 50, question: "Đơn vị đo lực là gì?", answer: ["newton", "n"], hint: "Ký hiệu N." },
    { id: 51, question: "Nhà vô địch World Cup 2022 là?", answer: ["argentina"], hint: "Đội bóng của Messi." },
    { id: 52, question: "Hành tinh đỏ là gì?", answer: ["sao hoa", "mars"], hint: "Màu đỏ do oxit sắt." },
    { id: 53, question: "Hành tinh xanh là gì?", answer: ["trai dat", "earth"], hint: "Hành tinh có sự sống." },
    { id: 54, question: "Nước nào có tượng Nữ thần Tự do?", answer: ["my", "hoa ky", "usa", "united states"], hint: "Tượng ở New York." },
    { id: 55, question: "Tỉnh có nhiều cà phê nhất Việt Nam?", answer: ["dak lak", "daklak"], hint: "Thủ phủ cà phê Tây Nguyên." },
    { id: 56, question: "Biển lớn nhất thế giới gọi là gì?", answer: ["thai binh duong", "pacific"], hint: "Đại dương lớn nhất." },
    { id: 57, question: "Thủ đô của Anh là gì?", answer: ["london"], hint: "Thành phố có sông Thames." },
    { id: 58, question: "Thủ đô của Pháp là gì?", answer: ["paris"], hint: "Có tháp Eiffel." },
    { id: 59, question: "Thủ đô của Đức là gì?", answer: ["berlin"], hint: "Thành phố có Cổng Brandenburg." },
    { id: 60, question: "Thủ đô của Nga là gì?", answer: ["moskva", "moscow"], hint: "Thành phố có điện Kremlin." },
    { id: 61, question: "Thủ đô của Trung Quốc là gì?", answer: ["bac kinh", "beijing"], hint: "Bắc Kinh." },
    { id: 62, question: "Thủ đô của Mỹ là gì?", answer: ["washington", "washington dc"], hint: "Thành phố có Nhà Trắng." },
    { id: 63, question: "Biểu tượng hóa học của bạc là gì?", answer: ["ag"], hint: "Ký hiệu từ tiếng Latin." },
    { id: 64, question: "Biểu tượng hóa học của natri là gì?", answer: ["na"], hint: "Ký hiệu từ Natrium." },
    { id: 65, question: "Biểu tượng hóa học của oxy là gì?", answer: ["o"], hint: "Nguyên tố thiết yếu cho hô hấp." },
    { id: 66, question: "Phần mềm bảng tính phổ biến của Microsoft?", answer: ["excel", "microsoft excel"], hint: "Ứng dụng trong bộ Office." },
    { id: 67, question: "Trình duyệt web của Google là gì?", answer: ["chrome", "google chrome"], hint: "Biểu tượng hình tròn nhiều màu." },
    { id: 68, question: "Ngôn ngữ lập trình chạy trên trình duyệt?", answer: ["javascript", "js"], hint: "Ngôn ngữ của web." },
    { id: 69, question: "Hệ điều hành phổ biến cho PC của Microsoft?", answer: ["windows"], hint: "Hệ điều hành có logo cửa sổ." },
    { id: 70, question: "Hệ điều hành mã nguồn mở phổ biến cho server?", answer: ["linux"], hint: "Biểu tượng chim cánh cụt." },
    { id: 71, question: "Thủ đô của Tây Ban Nha là gì?", answer: ["madrid"], hint: "Thành phố của CLB Real Madrid." },
    { id: 72, question: "Thủ đô của Ý là gì?", answer: ["rome", "roma"], hint: "Thành phố vĩnh hằng." },
    { id: 73, question: "Thủ đô của Canada là gì?", answer: ["ottawa"], hint: "Không phải Toronto." },
    { id: 74, question: "Thủ đô của Úc là gì?", answer: ["canberra"], hint: "Không phải Sydney." },
    { id: 75, question: "Quốc gia đông dân nhất thế giới?", answer: ["an do", "india"], hint: "Vượt Trung Quốc gần đây." },
    { id: 76, question: "Quốc gia có diện tích lớn nhất thế giới?", answer: ["nga", "russia"], hint: "Trải dài Á - Âu." },
    { id: 77, question: "Nước có hình chiếc ủng ở châu Âu?", answer: ["y", "italy"], hint: "Nổi tiếng với pizza." },
    { id: 78, question: "Vật lý học của Einstein gọi là gì?", answer: ["thuyet tuong doi", "tuong doi"], hint: "Liên quan thời gian và không gian." },
    { id: 79, question: "Nhà phát minh bóng đèn sợi đốt?", answer: ["edison", "thomas edison"], hint: "Nhà phát minh người Mỹ." },
    { id: 80, question: "Định luật chuyển động gắn với ai?", answer: ["newton"], hint: "Có 3 định luật nổi tiếng." },
    { id: 81, question: "Cầu vàng ở đâu?", answer: ["da nang", "ba na", "ba na hills"], hint: "Thuộc khu du lịch Bà Nà." },
    { id: 82, question: "Món ăn truyền thống Việt Nam nổi tiếng?", answer: ["pho"], hint: "Món nước với bánh phở." },
    { id: 83, question: "Thành phố cảng nổi tiếng miền Bắc?", answer: ["hai phong"], hint: "Thành phố hoa phượng đỏ." },
    { id: 84, question: "Thành phố trực thuộc trung ương ở miền Trung?", answer: ["da nang"], hint: "Thành phố đáng sống." },
    { id: 85, question: "Sân bay quốc tế lớn nhất miền Nam?", answer: ["tan son nhat", "tan son nhat airport"], hint: "Ở TP.HCM." },
    { id: 86, question: "Quốc gia nổi tiếng với kimchi?", answer: ["han quoc", "korea", "south korea"], hint: "Ẩm thực Hàn Quốc." },
    { id: 87, question: "Đồng hồ Big Ben ở đâu?", answer: ["london"], hint: "Gần sông Thames." },
    { id: 88, question: "Thành phố tình yêu ở Pháp?", answer: ["paris"], hint: "Có tháp Eiffel." },
    { id: 89, question: "Đỉnh Fansipan thuộc tỉnh nào?", answer: ["lao cai"], hint: "Tỉnh vùng Tây Bắc." },
    { id: 90, question: "Chợ nổi nổi tiếng miền Tây?", answer: ["cai rang"], hint: "Ở Cần Thơ." },
    { id: 91, question: "Sông dài nhất Việt Nam?", answer: ["song hong"], hint: "Sông lớn miền Bắc." },
    { id: 92, question: "Bến cảng Nhà Rồng ở thành phố nào?", answer: ["tp ho chi minh", "ho chi minh", "sai gon"], hint: "Nơi Bác ra đi tìm đường cứu nước." },
    { id: 93, question: "Bản nhạc nổi tiếng của Beethoven là?", answer: ["so 9", "giao huong so 9"], hint: "Có giai điệu Ode to Joy." },
    { id: 94, question: "Kim loại nặng và có giá trị cao?", answer: ["vang", "gold"], hint: "Kim loại quý." },
    { id: 95, question: "Đồng tiền của Mỹ gọi là gì?", answer: ["do la", "usd", "dollar"], hint: "Ký hiệu USD." },
    { id: 96, question: "Tác giả 'Dế Mèn phiêu lưu ký'?", answer: ["to hoai"], hint: "Nhà văn Việt Nam." },
    { id: 97, question: "Tác giả 'Tắt đèn'?", answer: ["ngo tat to"], hint: "Nhà văn hiện thực." },
    { id: 98, question: "Nhà thơ được mệnh danh 'Bà chúa thơ Nôm'?", answer: ["ho xuan huong"], hint: "Nữ sĩ nổi tiếng." },
    { id: 99, question: "Tác giả 'Nhật ký trong tù'?", answer: ["ho chi minh", "chu tich ho chi minh"], hint: "Lãnh tụ Việt Nam." },
    { id: 100, question: "Ngày Quốc khánh Việt Nam là ngày nào?", answer: ["2/9", "2-9", "02/09"], hint: "Ngày 2 tháng 9." },
    { id: 101, question: "Cái gì càng kéo càng ngắn?", answer: ["dieu thuoc", "dieu thuốc", "dieu thuoc la", "dieu thuoc la"], hint: "Dùng để hút." },
    { id: 102, question: "Cái gì có cổ mà không có đầu?", answer: ["cai ao", "ao"], hint: "Vật dụng mặc." },
    { id: 103, question: "Cái gì có răng mà không cắn?", answer: ["cai luoc", "luoc"], hint: "Dùng chải tóc." },
    { id: 104, question: "Cái gì đen khi mua, đỏ khi dùng, xám khi bỏ?", answer: ["than"], hint: "Dùng để nướng." },
    { id: 105, question: "Cái gì càng cất càng thấy?", answer: ["nha", "can nha"], hint: "Xây dựng." },
    { id: 106, question: "Cái gì đi thì nằm, đứng thì nằm, nằm thì đứng?", answer: ["ban chan", "chan"], hint: "Bộ phận cơ thể." },
    { id: 107, question: "Cái gì không có chân mà chạy?", answer: ["nuoc", "dong nuoc"], hint: "Chảy trên mặt đất." },
    { id: 108, question: "Cái gì càng rửa càng bẩn?", answer: ["nuoc"], hint: "Dùng để rửa." },
    { id: 109, question: "Cái gì càng phơi nắng càng ướt?", answer: ["cay nen", "nen"], hint: "Tan chảy." },
    { id: 110, question: "Cái gì không có miệng mà có răng?", answer: ["cai luoc", "luoc"], hint: "Chải tóc." },
    { id: 111, question: "Cái gì có mặt mà không có mồm?", answer: ["dong ho", "dong ho deo tay"], hint: "Có kim." },
    { id: 112, question: "Cái gì càng thắng càng thua?", answer: ["dua xe dap", "xe dap"], hint: "Thắng là phanh." },
    { id: 113, question: "Cái gì của bạn nhưng người khác dùng nhiều hơn?", answer: ["ten", "ten goi"], hint: "Gọi bạn." },
    { id: 114, question: "Cái gì có tay mà không có chân?", answer: ["dong ho", "dong ho deo tay"], hint: "Có kim." },
    { id: 115, question: "Cái gì bằng cái vung, vùng xuống ao, đào không thấy?", answer: ["bong trang", "mat trang"], hint: "Phản chiếu." },
    { id: 116, question: "Cái gì to bằng cái nón, nằm ở bờ sông?", answer: ["con sau", "ca sau"], hint: "Rất nguy hiểm." },
    { id: 117, question: "Con gì càng to càng nhỏ?", answer: ["con cua", "cua"], hint: "Càng của nó." },
    { id: 118, question: "Con gì đập thì sống, không đập thì chết?", answer: ["con tim", "trai tim", "tim"], hint: "Trong lồng ngực." },
    { id: 119, question: "Con gì không xương sống mà đứng được?", answer: ["con doc", "doc"], hint: "Địa hình." },
    { id: 120, question: "Con gì đầu dê mình ốc?", answer: ["con doc", "doc"], hint: "Địa hình." },
    { id: 121, question: "Con gì đi thì đứng, đứng thì ngã?", answer: ["xe dap"], hint: "2 bánh." },
    { id: 122, question: "Con gì có mũi mà không có mắt?", answer: ["con dao", "dao"], hint: "Dụng cụ." },
    { id: 123, question: "Con gì có lưỡi mà không có miệng?", answer: ["con dao", "dao"], hint: "Dụng cụ." },
    { id: 124, question: "Con gì không cánh mà bay?", answer: ["tin don", "tin don"], hint: "Lan truyền nhanh." },
    { id: 125, question: "Con gì mang được gỗ lớn nhưng không mang nổi hòn sỏi?", answer: ["con song", "song"], hint: "Nước chảy." },
    { id: 126, question: "Con gì ăn no bụng to, mắt híp?", answer: ["con heo", "heo", "lon"], hint: "Gia súc." },
    { id: 127, question: "Con gì cổ dài, chân như cột đình?", answer: ["huou cao co"], hint: "Động vật." },
    { id: 128, question: "Con gì nhỏ bé chăm chỉ tha mồi về tổ?", answer: ["con kien", "kien"], hint: "Cần cù." },
    { id: 129, question: "Con gì bé xíu bay khắp vườn tìm hoa?", answer: ["con ong", "ong"], hint: "Làm mật." },
    { id: 130, question: "Con gì đuôi ngắn tai dài, ăn cà rốt?", answer: ["con tho", "tho"], hint: "Chạy nhanh." },
    { id: 131, question: "Bánh gì ăn không bao giờ hết?", answer: ["banh xe", "xe"], hint: "Lăn." },
    { id: 132, question: "Bánh gì nghe tên đã thấy đau?", answer: ["banh tet", "tet"], hint: "Chơi chữ." },
    { id: 133, question: "Bánh gì đi đứng mệt mỏi?", answer: ["banh bo", "bo"], hint: "Bò lết." },
    { id: 134, question: "Bệnh gì bác sĩ bó tay?", answer: ["gay tay"], hint: "Nghĩa đen." },
    { id: 135, question: "Biển nào không có nước?", answer: ["bien bao", "bien bao giao thong"], hint: "Giao thông." },
    { id: 136, question: "Đường ngang, ngõ tắt tứ tung?", answer: ["ban co", "co"], hint: "Trò chơi." },
    { id: 137, question: "Xe gì không bao giờ giảm?", answer: ["xe tang"], hint: "Quân sự." },
    { id: 138, question: "Xe gì ba bánh chạy vỉa hè?", answer: ["xe xich lo", "xich lo"], hint: "Chở khách." },
    { id: 139, question: "Xe gì hai bánh tiếng kêu kính coong?", answer: ["xe dap"], hint: "Học sinh." },
    { id: 140, question: "Xe gì hai bánh chạy bon, máy nổ bình bịch?", answer: ["xe may", "xe may"], hint: "Honda." },
    { id: 141, question: "Cây gì không lá không hoa mà vẫn có cành?", answer: ["cay atm", "atm"], hint: "Rút tiền." },
    { id: 142, question: "Cây gì không lá không hoa, sinh nhật cả nhà vây quanh?", answer: ["cay nen", "nen"], hint: "Thắp sáng." },
    { id: 143, question: "Cây gì lá sắc như gươm, hoa vàng ngày tết?", answer: ["cay mai", "mai"], hint: "Miền Nam." },
    { id: 144, question: "Cây gì lá như tai voi, hè làm ô mát?", answer: ["cay bang", "bang"], hint: "Sân trường." },
    { id: 145, question: "Cây gì hoa đỏ như son?", answer: ["hoa phuong", "phuong"], hint: "Hoa học trò." },
    { id: 146, question: "Cây gì lá nhỏ cành mềm, hoa tím xinh?", answer: ["bang lang", "bang lang tim"], hint: "Mùa hè." },
    { id: 147, question: "Quả gì vỏ đỏ ruột vàng, hạt đen?", answer: ["du du"], hint: "Ngọt mát." },
    { id: 148, question: "Quả gì da cứng như đá, ruột trắng, nước ngọt?", answer: ["dua"], hint: "Bến Tre." },
    { id: 149, question: "Quả gì năm múi bốn khe, ăn đỏ miệng?", answer: ["trau"], hint: "Ăn trầu." },
    { id: 150, question: "Quả gì nhiều mắt lưa thưa, vỏ vàng?", answer: ["dua", "thom", "dua thom"], hint: "Miền Nam." },
    { id: 151, question: "Quả gì tên gọi như bom?", answer: ["luu"], hint: "Lựu đạn." },
    { id: 152, question: "Hạt gì không mọc thành cây mà làm lúa tốt?", answer: ["hat mua", "mua"], hint: "Từ trời." },
    { id: 153, question: "Hạt gì không mọc thành cây, nấu cơm ăn?", answer: ["hat gao", "gao"], hint: "Lúa." },
    { id: 154, question: "Mặt gì mát dịu đêm thâu?", answer: ["mat trang"], hint: "Ban đêm." },
    { id: 155, question: "Mặt gì soi gương mặt nước?", answer: ["mat trang"], hint: "Ban đêm." },
    { id: 156, question: "Nhà xanh lại đóng đố xanh?", answer: ["banh chung"], hint: "Gói lá dong." },
    { id: 157, question: "Vải gì không may được áo?", answer: ["vai thieu"], hint: "Trái cây." },
    { id: 158, question: "Hoa gì biết ăn, biết nói, biết hát?", answer: ["hoa hau"], hint: "Người đẹp." },
    { id: 159, question: "Hoa gì nở hướng mặt trời?", answer: ["huong duong"], hint: "Màu vàng." },
    { id: 160, question: "Hoa gì có gai?", answer: ["hoa hong"], hint: "Đẹp." },
    { id: 161, question: "Cái gì có chân có cánh mà không bay?", answer: ["cai ban", "ban"], hint: "Đồ nội thất." },
    { id: 162, question: "Cái gì có mắt mà không thấy?", answer: ["cay mia", "mia"], hint: "Có đốt." },
    { id: 163, question: "Cái gì có răng mà không có mồm?", answer: ["cai cua", "cua"], hint: "Dụng cụ cưa." },
    { id: 164, question: "Cái gì bằng vải che nắng che mưa?", answer: ["cai mu", "mu"], hint: "Đội đầu." },
    { id: 165, question: "Chân gì mà chẳng đụng sàn?", answer: ["chan troi"], hint: "Ở xa." },
    { id: 166, question: "Cái gì không chân mà leo núi?", answer: ["con duong", "duong"], hint: "Lên dốc." },
    { id: 167, question: "Cái gì đi thì nằm, đứng cũng nằm?", answer: ["con ran", "ran"], hint: "Bò sát." },
    { id: 168, question: "Cái gì mồm dọc, không có răng?", answer: ["may tuot lua"], hint: "Nông nghiệp." },
    { id: 169, question: "Cái gì năm ngón mà chẳng có xương?", answer: ["gang tay", "gang"], hint: "Đeo vào tay." },
    { id: 170, question: "Cái gì có lỗ hai bên, nghe tiếng vểnh lên?", answer: ["tai"], hint: "Bộ phận cơ thể." },
    { id: 171, question: "Cái gì có mặt mà không có mồm, có hai kim?", answer: ["dong ho"], hint: "Chỉ giờ." },
    { id: 172, question: "Cái gì đi thì đứng, đứng thì ngã?", answer: ["xe dap"], hint: "2 bánh." },
    { id: 173, question: "Cái gì không cánh mà bay, không chân mà chạy?", answer: ["dam may", "may"], hint: "Trên trời." },
    { id: 174, question: "Cái gì luôn đến mà không bao giờ đến nơi?", answer: ["ngay mai"], hint: "Thời gian." },
    { id: 175, question: "Cái gì có cổ mà không có đầu?", answer: ["cai ao", "ao"], hint: "Trang phục." },
    { id: 176, question: "Cái gì càng kéo càng ngắn?", answer: ["dieu thuoc", "dieu thuoc la"], hint: "Hút." },
    { id: 177, question: "Cái gì chặt không đứt, đốt không cháy?", answer: ["nuoc"], hint: "Thiết yếu." },
    { id: 178, question: "Cái gì càng kéo càng dài?", answer: ["keo cao su", "day cao su"], hint: "Đàn hồi." },
    { id: 179, question: "Cái gì ngồi thì nằm, đứng thì nằm, nằm thì đứng?", answer: ["ban chan", "chan"], hint: "Bộ phận cơ thể." },
    { id: 180, question: "Cái gì có đầu mà không có thân?", answer: ["cay cau", "cau"], hint: "Đầu cầu." },
    { id: 181, question: "Quần rộng nhất là quần gì?", answer: ["quan dao"], hint: "Địa lý." },
    { id: 182, question: "Xe nào không bao giờ giảm đi?", answer: ["xe tang"], hint: "Quân sự." },
    { id: 183, question: "Tháng nào ngắn nhất trong năm?", answer: ["thang ba", "thang 3"], hint: "7 chữ cái." },
    { id: 184, question: "Cái gì đập thì sống, không đập thì chết?", answer: ["con tim", "tim"], hint: "Trong ngực." },
    { id: 185, question: "Cái gì tay trái cầm được, tay phải không?", answer: ["tay phai"], hint: "Tự cầm." },
    { id: 186, question: "Cái gì có răng mà không có mồm?", answer: ["cai luoc", "luoc"], hint: "Chải tóc." },
    { id: 187, question: "Cái gì không chân không tay mà đi khắp nơi?", answer: ["tin don", "tin tuc"], hint: "Lan truyền." },
    { id: 188, question: "Cái gì càng thiu càng ngon?", answer: ["giac ngu", "ngu"], hint: "Thiu thiu." },
    { id: 189, question: "Cái gì càng thắng càng thua?", answer: ["dua xe dap"], hint: "Thắng là phanh." },
    { id: 190, question: "Bốn chân đạp đất, cổ cất thượng thiên?", answer: ["cay cau", "cau"], hint: "Thân làm cột." },
    { id: 191, question: "Đầu tròn trùng trục như cục đá mài?", answer: ["con sau", "ca sau"], hint: "Ở bờ sông." },
    { id: 192, question: "Bằng cái đĩa, xỉa xuống ao?", answer: ["mat trang", "bong trang"], hint: "Bóng trăng." },
    { id: 193, question: "Vừa bằng hạt đỗ, ăn giỗ cả làng?", answer: ["con ruoi", "ruoi"], hint: "Côn trùng." },
    { id: 194, question: "Da cóc bọc trứng gà, bổ ra thơm phức?", answer: ["qua mit", "mit"], hint: "Trái cây." },
    { id: 195, question: "Thân em xưa ở bụi tre, mùa đông xếp lại?", answer: ["cai quat", "quat"], hint: "Làm mát." },
    { id: 196, question: "Xe gì ba bánh, tiếng kêu le te?", answer: ["xich lo", "xe xich lo"], hint: "Chở khách." },
    { id: 197, question: "Cây gì áo kép áo đơn, soi gương?", answer: ["cay chuoi", "chuoi"], hint: "Lá to." },
    { id: 198, question: "Con gì đẻ ra đã chín?", answer: ["con ba ba", "ba ba"], hint: "Chơi chữ 3x3." },
    { id: 199, question: "Sông gì không chảy, núi gì không cây?", answer: ["ban do", "ban do the gioi"], hint: "Trên giấy." },
    { id: 200, question: "Cái gì giúp người nhìn xuyên tường?", answer: ["cua so"], hint: "Trên tường." }
];
/**
 * PHẦN 2: GAME ENGINE (LOGIC TRÒ CHƠI)
 */
const RiddleGame = {
    // --- CẤU HÌNH (CONFIG) ---
    RATIO_MATH: 0, // Không dùng câu Toán ở chế độ Triệu Phú
    RATIO_FOLK: 10, // 100% câu hỏi kiến thức
    
    // Cấu hình TỔNG THỜI GIAN chơi (Đơn vị: Giây)
    TIME_CONFIG: {
        hard: 15 * 60,   // 15 Phút
        medium: 25 * 60, // 25 Phút
        easy: 45 * 60    // 45 Phút
    },

    // Cấu hình ĐIỂM SỐ
    SCORE_CONFIG: {
        correct: 10, // Trả lời đúng
        skip: -2,    // Bỏ qua
        wrong: -5    // Trả lời sai
    },
    
    // --- TRẠNG THÁI (STATE) ---
    mode: 'normal',     
    difficulty: 'easy', 
    score: 0,
    usedFolkIndices: [], 
    
    start: function(gameMode = 'normal', gameDifficulty = 'easy') {
        this.mode = gameMode;
        this.difficulty = gameDifficulty;
        this.score = 0;
        this.usedFolkIndices = []; 
        console.log(`[Game Started] Mode: ${this.mode}, Diff: ${this.difficulty}`);
    },

    getTotalTime: function() {
        if (this.mode === 'practice') return 0; 
        return this.TIME_CONFIG[this.difficulty];
    },

    generateMathRiddle: function() {
        let q, a, h;
        const config = {
            easy:   { max: 20,  types: [0, 1] },       
            medium: { max: 100, types: [0, 1, 2] },    
            hard:   { max: 500, types: [0, 1, 2, 3] }  
        };
        const setting = config[this.difficulty];
        const type = setting.types[Math.floor(Math.random() * setting.types.length)];

        if (type === 0) { // CỘNG
            const n1 = Math.floor(Math.random() * setting.max) + 1;
            const n2 = Math.floor(Math.random() * setting.max) + 1;
            q = `${n1} + ${n2} = ?`;
            a = (n1 + n2).toString();
            h = `Số tận cùng là ${(n1 + n2) % 10}`;
        } else if (type === 1) { // TRỪ
            const n1 = Math.floor(Math.random() * setting.max) + 5; 
            const n2 = Math.floor(Math.random() * n1); 
            q = `${n1} - ${n2} = ?`;
            a = (n1 - n2).toString();
            h = `Kết quả nhỏ hơn ${n1}`;
        } else if (type === 2) { // NHÂN
            const limit = this.difficulty === 'hard' ? 20 : 9;
            const n1 = Math.floor(Math.random() * limit) + 2;
            const n2 = Math.floor(Math.random() * 9) + 2;
            q = `${n1} x ${n2} = ?`;
            a = (n1 * n2).toString();
            h = `Gợi ý: ${n1} lần ${n2}`;
        } else { // CHIA
            const n2 = Math.floor(Math.random() * 9) + 2; 
            const ans = Math.floor(Math.random() * 20) + 2; 
            const n1 = n2 * ans; 
            q = `${n1} : ${n2} = ?`;
            a = ans.toString();
            h = `Phép chia hết`;
        }

        return { type: 'math', question: `(Toán ${this.difficulty}) ${q}`, answer: a, hint: h };
    },

    getFolkRiddle: function() {
        if (this.usedFolkIndices.length >= manualRiddles.length) {
            this.usedFolkIndices = [];
        }
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * manualRiddles.length);
        } while (this.usedFolkIndices.includes(randomIndex));

        this.usedFolkIndices.push(randomIndex);
        return { ...manualRiddles[randomIndex], type: 'folk' };
    },

    getNextQuestion: function() {
        const totalShare = this.RATIO_MATH + this.RATIO_FOLK; 
        const randomVal = Math.random() * totalShare; 

        if (randomVal < this.RATIO_MATH) {
            return this.generateMathRiddle();
        } else {
            return this.getFolkRiddle();
        }
    },

    submitAnswer: function(userAnswer, currentQuestion) {
        const normalizeAnswer = (value) => value
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ');

        const userClean = normalizeAnswer(userAnswer);
        const answers = Array.isArray(currentQuestion.answer)
            ? currentQuestion.answer
            : [currentQuestion.answer];
        const normalizedAnswers = answers.map((ans) => normalizeAnswer(ans));
        const isCorrect = normalizedAnswers.includes(userClean);
        const displayAnswer = answers.join(' / ');
        
        let msg = "";
        let scoreChange = 0;

        if (this.mode === 'practice') {
            msg = isCorrect ? "Chuẩn luôn! (Luyện tập)" : `Sai rồi. Đáp án: ${displayAnswer}`;
        } else {
            if (isCorrect) {
                scoreChange = this.SCORE_CONFIG.correct;
                msg = `Chính xác! (+${scoreChange} điểm)`;
            } else {
                scoreChange = this.SCORE_CONFIG.wrong;
                msg = `Sai rồi! (${scoreChange} điểm)`;
            }
            this.score += scoreChange;
        }

        return { correct: isCorrect, scoreChange: scoreChange, currentScore: this.score, message: msg };
    },

    skipQuestion: function() {
        if (this.mode === 'practice') {
            return { message: "Đã bỏ qua", scoreChange: 0, currentScore: 0 };
        } else {
            const deduction = this.SCORE_CONFIG.skip;
            this.score += deduction; 
            return { message: `Bỏ qua (${deduction} điểm)`, scoreChange: deduction, currentScore: this.score };
        }
    }
};