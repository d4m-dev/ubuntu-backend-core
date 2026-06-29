// Helper functions for dynamic names
function getUserName() {
    return localStorage.getItem('user_name') || "anh iu";
}

function getAssistantName(capitalize = false) {
    const name = localStorage.getItem('assistant_name') || "em";
    return capitalize ? name.charAt(0).toUpperCase() + name.slice(1) : name;
}

// Hàm tính khoảng cách Levenshtein (độ sai lệch giữa 2 chuỗi)
function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

// Hàm phân tích cảm xúc nâng cao
function analyzeSentiment(text) {
    const positiveWords = ['vui', 'tốt', 'hay', 'đẹp', 'xuất sắc', 'tuyệt vời', 'tuyệt', 'ok', 'ổn', 'thích', 'yêu', 'hài lòng', 'tận hưởng', 'hạnh phúc', 'niềm vui', 'hài lòng', 'tươi', 'cười', 'vui vẻ', 'tích cực', 'tăng', 'nâng', 'nâng cao', 'phát triển', 'thành công', 'giỏi', 'hiệu quả', 'thông minh', 'tài giỏi', 'tuyệt vời', 'cảm ơn', 'thank', 'thanks', 'tuyệt vời', 'tuyệt vời quá', 'tuyệt vời thật'];
    const negativeWords = ['buồn', 'xấu', 'tệ', 'chán', 'kinh khủng', 'kém', 'xấu', 'không', 'chưa', 'chẳng', 'không thích', 'ghét', 'mệt', 'phiền', 'buồn', 'lo lắng', 'stress', 'giận', 'tức', 'xấu hổ', 'thất vọng', 'thất bại', 'giảm', 'giảm sút', 'kém hiệu quả', 'sai', 'lỗi', 'vấn đề', 'khó khăn', 'muộn', 'trễ', 'hỏng', 'lỗi', 'tệ quá', 'chán quá', 'không được'];
    const neutralWords = ['bình thường', 'thường', 'trung lập', 'bình', 'thường thôi', 'bình thường', 'thôi', 'có thể', 'có lẽ', 'có thể', 'có thể', 'được', 'okay', 'ok'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    
    for (const word of words) {
        if (positiveWords.includes(word)) {
            score++;
            positiveCount++;
        }
        if (negativeWords.includes(word)) {
            score--;
            negativeCount++;
        }
        if (neutralWords.includes(word)) {
            neutralCount++;
        }
    }
    
    const totalScore = positiveCount + negativeCount + neutralCount;
    if (totalScore === 0) return 'neutral';
    
    const positiveRatio = positiveCount / totalScore;
    const negativeRatio = negativeCount / totalScore;
    
    if (positiveRatio > 0.6) return 'very_positive';
    if (positiveRatio > 0.3) return 'positive';
    if (negativeRatio > 0.6) return 'very_negative';
    if (negativeRatio > 0.3) return 'negative';
    return 'neutral';
}

// Hàm chuẩn hóa văn bản (loại bỏ dấu, chuẩn hóa ký tự)
function normalizeText(str) {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, '');
}

// Hàm kiểm tra lệnh thông minh (chấp nhận không dấu và sai chính tả nhẹ)
function checkCmd(cmd, keywords) {
    const cmdNorm = normalizeText(cmd);

    return keywords.some(key => {
        const keyNorm = normalizeText(key);

        // 1. Chứa từ khóa chính xác hoặc không dấu (CÓ CHECK RANH GIỚI TỪ)
        // Sử dụng Regex để đảm bảo không bắt nhầm từ con (ví dụ: "hi" trong "nhiều")
        try {
            const escapedKey = keyNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(^|\\s)${escapedKey}($|\\s)`, 'i');
            if (regex.test(cmdNorm)) return true;
        } catch (e) { if (cmdNorm.includes(keyNorm)) return true; }

        // 2. Fuzzy match (chấp nhận sai số) cho các lệnh ngắn
        // Nếu lệnh ngắn và độ dài tương đương từ khóa
        if (cmdNorm.length < 10 && Math.abs(cmdNorm.length - keyNorm.length) < 5) {
             const dist = levenshtein(cmdNorm, keyNorm);
             // Chấp nhận sai số 10%
             if (dist <= keyNorm.length * 0.1) return true;
        }

        return false;
    });
}

// Cơ sở tri thức mở rộng
const knowledgeBase = {
    science: {
        "vũ trụ": "Vũ trụ là toàn bộ không gian, thời gian, vật chất và năng lượng. Nó bắt đầu từ Big Bang cách đây khoảng 13.8 tỷ năm và vẫn đang giãn nở.",
        "nguyên tử": "Nguyên tử là đơn vị cơ bản của vật chất, gồm hạt nhân (proton và neutron) và electron quay xung quanh.",
        "DNA": "DNA (axit deoxyribonucleic) là phân tử mang thông tin di truyền, cấu tạo từ 4 nucleotide: A, T, G, C.",
        "năng lượng": "Năng lượng là khả năng thực hiện công việc. Các dạng phổ biến: động năng, thế năng, nhiệt năng, điện năng.",
        "quang hợp": "Quang hợp là quá trình thực vật sử dụng ánh sáng mặt trời để chuyển hóa CO2 và nước thành glucose và oxy."
    },
    technology: {
        "AI": "AI (Trí tuệ nhân tạo) là lĩnh vực nghiên cứu tạo ra máy móc có thể thực hiện các nhiệm vụ đòi hỏi trí thông minh của con người.",
        "blockchain": "Blockchain là công nghệ lưu trữ dữ liệu dưới dạng chuỗi khối, được phân tán và bảo mật cao, dùng trong tiền mã hóa.",
        "internet": "Internet là mạng lưới toàn cầu kết nối hàng triệu máy tính, cho phép chia sẻ thông tin và tài nguyên.",
        "robot": "Robot là thiết bị cơ khí có thể được lập trình để thực hiện các nhiệm vụ tự động, từ đơn giản đến phức tạp.",
        "máy tính": "Máy tính là thiết bị điện tử xử lý, lưu trữ và truyền thông tin số."
    },
    history: {
        "chiến tranh thế giới thứ hai": "Diễn ra từ 1939-1945, là cuộc chiến lớn nhất trong lịch sử loài người, với hơn 70 quốc gia tham gia.",
        "cách mạng công nghiệp": "Bắt đầu từ Anh thế kỷ 18, đánh dấu bước ngoặt từ sản xuất thủ công sang cơ khí hóa.",
        "văn minh cổ đại": "Các nền văn minh cổ đại tiêu biểu: Ai Cập, Hy Lạp, La Mã, Trung Hoa, Ấn Độ.",
        "độc lập việt nam": "Việt Nam giành độc lập ngày 2/9/1945, khi Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập.",
        "chiến tranh việt nam": "Diễn ra từ 1955-1975, kết thúc bằng chiến thắng 30/4/1975, thống nhất đất nước."
    },
    culture: {
        "văn hóa việt nam": "Văn hóa Việt Nam đa dạng, phong phú, chịu ảnh hưởng của Nho giáo, Phật giáo, Đạo giáo và bản sắc dân tộc.",
        "ẩm thực việt nam": "Ẩm thực Việt Nam nổi tiếng với phở, bánh mì, bún chả, gỏi cuốn và nhiều món khác, cân bằng ngũ vị.",
        "lễ hội truyền thống": "Các lễ hội tiêu biểu: Tết Nguyên Đán, lễ hội chùa Hương, lễ hội đền Hùng, đua thuyền, múa lân.",
        "nghệ thuật truyền thống": "Ca trù, chèo, cải lương, tuồng, quan họ là các loại hình nghệ thuật truyền thống đặc sắc.",
        "di sản văn hóa": "Việt Nam có nhiều di sản thế giới: Vịnh Hạ Long, Phong Nha-Kẻ Bàng, Thánh địa Mỹ Sơn, Cố đô Huế."
    },
    geography: {
        "địa lý việt nam": "Việt Nam nằm ở Đông Nam Á, có hình chữ S, giáp Trung Quốc, Lào, Campuchia và biển Đông.",
        "sông ngòi việt nam": "Các con sông lớn: Sông Hồng, Sông Đà, Sông Mã, Sông Cửu Long, Sông Đồng Nai.",
        "vùng miền việt nam": "Miền Bắc, Miền Trung, Miền Nam với đặc điểm địa lý, khí hậu, văn hóa khác nhau.",
        "đảo và quần đảo": "Việt Nam có hơn 4000 hòn đảo, tiêu biểu: Phú Quốc, Cát Bà, Cô Tô, Trường Sa, Hoàng Sa.",
        "khí hậu việt nam": "Khí hậu nhiệt đới ẩm gió mùa, chia làm 2 mùa rõ rệt: mưa và khô."
    },
    mathematics: {
        "pi": "Pi (π) là hằng số toán học, tỉ lệ giữa chu vi và đường kính hình tròn, khoảng 3.14159.",
        "pytago": "Định lý Pytago: Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông.",
        "fibonacci": "Dãy Fibonacci: 0, 1, 1, 2, 3, 5, 8, 13... mỗi số bằng tổng hai số trước nó.",
        "logarit": "Logarit là hàm ngược của hàm mũ, dùng để giải các phương trình mũ và tính toán phức tạp.",
        "đạo hàm": "Đạo hàm là tốc độ thay đổi của hàm số theo biến số, dùng trong giải tích và vật lý."
    },
    literature: {
        "truyện kiều": "Truyện Kiều của Nguyễn Du, tác phẩm văn học kinh điển, thể hiện thân phận người phụ nữ trong xã hội phong kiến.",
        "thơ hồ xuân hương": "Hồ Xuân Hương, bà chúa thơ nôm, với thơ sắc sảo, đậm chất nữ quyền và phê phán xã hội.",
        "shakespeare": "William Shakespeare, nhà văn kiệt xuất nước Anh, tác giả Romeo và Juliet, Hamlet, Macbeth...",
        "dante": "Dante Alighieri, tác giả Thần khúc, một trong những tác phẩm vĩ đại nhất văn học nhân loại.",
        "tố hữu": "Tố Hữu, nhà thơ lớn của Việt Nam, với thơ trữ tình - chính trị đặc sắc."
    },
    philosophy: {
        "nho giáo": "Nho giáo do Khổng Tử sáng lập, đề cao nhân nghĩa lễ trí tín, ảnh hưởng lớn đến văn hóa Á Đông.",
        "phật giáo": "Phật giáo do Đức Phật Thích Ca Mâu Ni sáng lập, giảng về khổ đau, nghiệp báo, giải thoát.",
        "đạo giáo": "Đạo giáo do Lão Tử sáng lập, đề cao vô vi, thuận theo tự nhiên, cân bằng âm dương.",
        "triết học phương tây": "Bao gồm các trường phái: duy vật, duy tâm, hiện sinh, tồn tại luận...",
        "socrates": "Socrates, nhà triết học Hy Lạp, nổi tiếng với câu nói: 'Ta chỉ biết rằng ta không biết gì cả.'"
    }
};

// Hàm tìm kiếm trong cơ sở tri thức
function searchKnowledge(query) {
    const normalizedQuery = normalizeText(query).toLowerCase();
    
    for (const [category, items] of Object.entries(knowledgeBase)) {
        for (const [key, value] of Object.entries(items)) {
            if (normalizedQuery.includes(key) || checkCmd(normalizedQuery, [key])) {
                return {
                    category: category,
                    key: key,
                    value: value
                };
            }
        }
    }
    
    return null;
}

// Hàm phân tích ý định người dùng nâng cao
function getIntent(cmd) {
    const intents = {
        greeting: { keywords: ['xin chào', 'hello', 'chào bạn', 'chào buổi', 'chào', 'chào mừng', 'good morning', 'good afternoon', 'good evening'], confidence: 0 },
        time: { keywords: ['mấy giờ', 'giờ hiện tại', 'bây giờ là mấy giờ', 'may gio', 'gio hien tai', 'thời gian', 'thoi gian'], confidence: 0 },
        date: { keywords: ['ngày mấy', 'hôm nay là', 'ngay may', 'ngày tháng', 'ngay thang', 'tháng năm', 'thang nam'], confidence: 0 },
        weather: { keywords: ['thời tiết', 'thoi tiet', 'trời', 'troi', 'nhiệt độ', 'nhiet do', 'mưa', 'mưa', 'nắng', 'nang'], confidence: 0 },
        music: { keywords: ['phát nhạc', 'nghe nhạc', 'mở nhạc', 'play music', 'phát bài', 'nghe bài', 'bật nhạc', 'bat nhac'], confidence: 0 },
        search: { keywords: ['tìm kiếm', 'tim kiem', 'tìm', 'tim', 'google', 'tìm giúp', 'tìm giúp tôi', 'tìm giúp mình'], confidence: 0 },
        translation: { keywords: ['dịch', 'dich', 'nghĩa', 'nghia', 'dịch sang', 'dich sang', 'ý nghĩa', 'y nghia'], confidence: 0 },
        calculation: { keywords: ['tính', 'tinh', 'cộng trừ', 'nhân chia', 'math', 'toán', 'phep tinh', 'tính toán'], confidence: 0 },
        wikipedia: { keywords: ['là gì', 'la gi', 'ai là', 'ai la', 'thông tin về', 'thong tin ve', 'giới thiệu', 'gioi thieu'], confidence: 0 },
        joke: { keywords: ['kể chuyện cười', 'ke chuyen cuoi', 'chuyện cười', 'kể chuyen', 'ke chuyen', 'truyện cười', 'truyen cuoi'], confidence: 0 },
        goodbye: { keywords: ['tạm biệt', 'tam biet', 'tắt máy', 'tat may', 'dừng lại', 'ngừng hoạt động', 'bye', 'tạm biệt nhé'], confidence: 0 },
        repeat: { keywords: ['nghe không rõ', 'nghe khong ro', 'bạn nói gì', 'ban noi gi', 'nói lại đi', 'noi lai di', 'lặp lại', 'lap lai'], confidence: 0 },
        battery: { keywords: ['pin', 'phần trăm pin', 'pin con bao nhieu', 'mức pin', 'muc pin'], confidence: 0 },
        coin: { keywords: ['tung đồng xu', 'tung xu', 'sấp ngửa', 'sap ngua', 'đồng xu', 'dong xu'], confidence: 0 },
        color: { keywords: ['đổi màu nền', 'doi mau nen', 'màu nền', 'mau nen', 'thay đổi màu', 'thay doi mau'], confidence: 0 },
        web: { keywords: ['mở google', 'mo google', 'mở youtube', 'mo youtube', 'mở nhạc', 'mo nhac', 'music pro'], confidence: 0 },
        social: { keywords: ['mở facebook', 'mo facebook', 'mở zalo', 'mo zalo', 'mở instagram', 'mo instagram'], confidence: 0 },
        calculator: { keywords: ['máy tính', 'calculator', 'tính toán', 'tinh toan', 'máy tính khoa học', 'may tinh khoa hoc'], confidence: 0 },
        reminder: { keywords: ['nhắc tôi', 'nhac toi', 'nhắc việc', 'nhac viec', 'đặt nhắc', 'dat nhac'], confidence: 0 },
        timer: { keywords: ['đặt hẹn', 'dat hen', 'hẹn giờ', 'hen gio', 'đồng hồ bấm giờ', 'dong ho bam gio'], confidence: 0 },
        news: { keywords: ['tin tức', 'tin tuc', 'thời sự', 'thoi su', 'báo', 'bao'], confidence: 0 },
        health: { keywords: ['sức khỏe', 'suc khoe', 'khỏe không', 'khoe khong', 'bệnh', 'benh'], confidence: 0 },
        food: { keywords: ['ăn gì', 'an gi', 'món ăn', 'mon an', 'đồ ăn', 'do an', 'nấu gì', 'nau gi'], confidence: 0 },
        travel: { keywords: ['đi đâu', 'di dau', 'du lịch', 'du lich', 'chuyến đi', 'chuyen di'], confidence: 0 },
        knowledge: { keywords: ['giải thích', 'giai thich', 'thông tin', 'thong tin', 'hãy nói', 'hay noi', 'cho biết', 'cho biet', 'về', 've'], confidence: 0 },
        advice: { keywords: ['lời khuyên', 'loi khuyen', 'tư vấn', 'tu van', 'gợi ý', 'goi y', 'cách', 'cach'], confidence: 0 },
        story: { keywords: ['kể chuyện', 'ke chuyen', 'truyện', 'truyen', 'chuyện kể', 'chuyen ke'], confidence: 0 },
        game: { keywords: ['chơi', 'choi', 'trò chơi', 'tro choi', 'game', 'chơi gì', 'choi gi'], confidence: 0 },
        note: { keywords: ['ghi chú', 'ghi chép', 'ghi nhớ', 'ghi lai', 'note', 'ghi'], confidence: 0 },
        task: { keywords: ['nhiệm vụ', 'công việc', 'việc cần làm', 'viec can lam', 'nhiem vu', 'cong viec'], confidence: 0 },
        calendar: { keywords: ['lịch', 'lich', 'lịch làm việc', 'lich lam viec', 'đặt lịch', 'dat lich'], confidence: 0 },
        message: { keywords: ['nhắn tin', 'gửi tin', 'tin nhắn', 'gui tin', 'nhan tin', 'soạn tin'], confidence: 0 },
        call: { keywords: ['gọi', 'goi', 'điện thoại', 'dien thoai', 'gọi điện', 'goi dien'], confidence: 0 },
        volume: { keywords: ['âm lượng', 'am luong', 'tăng âm', 'tang am', 'giảm âm', 'giam am', 'tắt tiếng', 'tat tieng'], confidence: 0 },
        brightness: { keywords: ['độ sáng', 'do sang', 'tăng sáng', 'tang sang', 'giảm sáng', 'giam sang'], confidence: 0 },
        file: { keywords: ['tệp', 'tap', 'file', 'tài liệu', 'tai lieu', 'mở file', 'mo file', 'lưu file', 'luu file', 'xóa file', 'xoa file'], confidence: 0 },
        email: { keywords: ['email', 'thư điện tử', 'thu dien tu', 'gửi mail', 'gui mail', 'soạn email', 'soan email'], confidence: 0 },
        contact: { keywords: ['liên hệ', 'lien he', 'danh bạ', 'danh ba', 'số điện thoại', 'so dien thoai'], confidence: 0 },
        schedule: { keywords: ['lịch hẹn', 'lich hen', 'đặt lịch hẹn', 'dat lich hen', 'cuộc họp', 'cuoc hop'], confidence: 0 },
        timer: { keywords: ['đồng hồ bấm giờ', 'dong ho bam gio', 'timer', 'stopwatch', 'bấm giờ', 'bam gio'], confidence: 0 },
        countdown: { keywords: ['đếm ngược', 'dem nguoc'], confidence: 0 },
        conversion: { keywords: ['chuyển đổi', 'chuyen doi', 'quy đổi', 'quy doi', 'đổi đơn vị', 'doi don vi'], confidence: 0 }
    };

    for (const [intentName, intent] of Object.entries(intents)) {
        for (const keyword of intent.keywords) {
            if (checkCmd(cmd, [keyword])) {
                intent.confidence += 1;
            }
        }
    }

    // Sắp xếp theo độ tin cậy giảm dần
    const sortedIntents = Object.entries(intents).sort((a, b) => b[1].confidence - a[1].confidence);
    return sortedIntents[0][0]; // Trả về intent có độ tin cậy cao nhất
}

// Hàm phân tích câu lệnh nâng cao với ngữ nghĩa
function parseCommand(cmd) {
    // Các mẫu câu phổ biến để phân tích
    const patterns = {
        // Mẫu: "hãy làm gì đó cho tôi"
        request: /(hãy|xin|vui lòng|làm ơn)\s+(.+?)\s+(cho tôi|giúp tôi|giúp mình|cho mình)$/,
        // Mẫu: "có thể làm gì đó không?"
        question: /^(có thể|có thể làm|có thể giúp|có thể giúp gì)\s+(.+?)\s+không\?$/,
        // Mẫu: "muốn làm gì đó"
        desire: /^(tôi muốn|muốn|cần|cần giúp)\s+(.+)$/,
        // Mẫu: "nói gì đó"
        say: /^(nói|nói gì đó|nói giúp|nói giúp mình)\s+(.+)$/,
        // Mẫu: "mở/mở giúp gì đó"
        open: /^(mở|mở giúp|mở giúp mình|open)\s+(.+)$/,
        // Mẫu: "tìm kiếm gì đó"
        search: /^(tìm kiếm|tìm|tìm giúp|tìm giúp mình|google|search)\s+(.+)$/,
        // Mẫu: "gửi gì đó cho ai"
        send: /^(gửi|gửi giúp|gửi giúp mình|send)\s+(.+?)\s+(cho|to)\s+(.+)$/
    };

    for (const [patternName, pattern] of Object.entries(patterns)) {
        const match = cmd.match(pattern);
        if (match) {
            return {
                type: patternName,
                parts: match.slice(1),
                original: cmd
            };
        }
    }

    // Nếu không khớp với mẫu nào, trả về kiểu mặc định
    return {
        type: 'general',
        parts: [cmd],
        original: cmd
    };
}

// Hàm lưu trạng thái cuộc trò chuyện nâng cao
function saveConversationState(context) {
    localStorage.setItem('brain_conversation_context', JSON.stringify(context));
}

// Hàm tải trạng thái cuộc trò chuyện nâng cao
function loadConversationState() {
    const saved = localStorage.getItem('brain_conversation_context');
    return saved ? JSON.parse(saved) : {
        history: [],
        lastTopic: null,
        userPreferences: {},
        userPersonality: { mood: 'neutral', engagement: 0.5, interest: {} },
        conversationFlow: { turn: 0, topicDepth: 0 },
        knowledgeAccessed: {},
        relationship: { trust: 0.5, familiarity: 0.3, comfort: 0.4 }
    };
}

// Hàm cập nhật mối quan hệ người dùng
function updateRelationship(userInput, botResponse, sentiment) {
    const context = loadConversationState();
    
    // Cập nhật mức độ tin tưởng dựa trên phản hồi của người dùng
    if (sentiment === 'positive' || sentiment === 'very_positive') {
        context.relationship.trust = Math.min(1.0, context.relationship.trust + 0.05);
    } else if (sentiment === 'negative' || sentiment === 'very_negative') {
        context.relationship.trust = Math.max(0.1, context.relationship.trust - 0.05);
    }
    
    // Cập nhật mức độ quen thuộc dựa trên số lần tương tác
    context.relationship.familiarity = Math.min(1.0, context.relationship.familiarity + 0.02);
    
    // Cập nhật mức độ thoải mái dựa trên tâm trạng người dùng
    if (sentiment === 'positive' || sentiment === 'very_positive') {
        context.relationship.comfort = Math.min(1.0, context.relationship.comfort + 0.03);
    } else if (sentiment === 'negative' || sentiment === 'very_negative') {
        context.relationship.comfort = Math.max(0.1, context.relationship.comfort - 0.03);
    }
    
    saveConversationState(context);
    return context;
}

// Hàm cập nhật ngữ cảnh cuộc trò chuyện
function updateContext(userInput, botResponse, topic = null) {
    const context = loadConversationState();
    const sentiment = analyzeSentiment(userInput);
    
    context.history.push({
        user: userInput,
        bot: botResponse,
        timestamp: new Date().toISOString(),
        sentiment: sentiment
    });

    if (topic) context.lastTopic = topic;

    // Cập nhật luồng hội thoại
    context.conversationFlow.turn++;
    if (context.lastTopic === topic) {
        context.conversationFlow.topicDepth++;
    } else {
        context.conversationFlow.topicDepth = 1;
    }

    // Giới hạn lịch sử để tránh quá nhiều dữ liệu
    if (context.history.length > 20) {
        context.history = context.history.slice(-20);
    }

    saveConversationState(context);
    return context;
}

// Hàm cập nhật ngữ cảnh nâng cao với phân tích cảm xúc và ngữ nghĩa
function updateAdvancedContext(userInput, botResponse, topic = null) {
    const context = loadConversationState();
    const sentiment = analyzeAdvancedSentiment(userInput);
    const semantic = analyzeSemanticMeaning(userInput);
    
    context.history.push({
        user: userInput,
        bot: botResponse,
        timestamp: new Date().toISOString(),
        sentiment: sentiment,
        semantic: semantic,
        relationship: { ...context.relationship }
    });

    if (topic) context.lastTopic = topic;

    // Cập nhật luồng hội thoại
    context.conversationFlow.turn++;
    if (context.lastTopic === topic) {
        context.conversationFlow.topicDepth++;
    } else {
        context.conversationFlow.topicDepth = 1;
    }

    // Giới hạn lịch sử để tránh quá nhiều dữ liệu
    if (context.history.length > 20) {
        context.history = context.history.slice(-20);
    }

    saveConversationState(context);
    return context;
}

// Hàm lấy ngữ cảnh gần đây
function getRecentContext() {
    const context = loadConversationState();
    return context;
}

// Hàm quản lý cuộc hội thoại đa lượt (multi-turn conversation)
function manageMultiTurnConversation(userInput, context) {
    // Kiểm tra xem người dùng có đang tiếp tục một chủ đề trước đó không
    if (context.history.length > 0) {
        const lastExchange = context.history[context.history.length - 1];
        
        // Nếu người dùng trả lời "yes", "ok", "đúng", "phải", "uh-huh", v.v. thì tiếp tục chủ đề trước
        const affirmativeWords = ['yes', 'ok', 'đúng', 'phải', 'uh', 'uh-huh', 'ừ', 'vâng', 'chính xác', 'đúng rồi', 'ok đúng'];
        const isAffirmative = affirmativeWords.some(word => 
            userInput.toLowerCase().includes(word.toLowerCase()));
            
        if (isAffirmative) {
            // Nếu người dùng đồng ý, tiếp tục chủ đề trước đó
            return {
                continuePreviousTopic: true,
                previousTopic: lastExchange.user || lastExchange.bot
            };
        }
        
        // Nếu người dùng hỏi "what about you?" hoặc "còn bạn thì sao?", "còn bạn", v.v.
        const continuationPhrases = ['what about you', 'còn bạn', 'còn bạn thì sao', 'you', 'bạn thì sao', 'còn bạn thì'];
        const isContinuation = continuationPhrases.some(phrase => 
            userInput.toLowerCase().includes(phrase.toLowerCase()));
            
        if (isContinuation) {
            return {
                continuePreviousTopic: true,
                previousTopic: lastExchange.user || lastExchange.bot,
                askAboutBot: true
            };
        }
    }
    
    return {
        continuePreviousTopic: false,
        previousTopic: null,
        askAboutBot: false
    };
}

// Hàm học hỏi từ cuộc trò chuyện
function learnFromConversation(userInput, botResponse) {
    // Cập nhật sở thích người dùng dựa trên nội dung cuộc trò chuyện
    const context = loadConversationState();
    const sentiment = analyzeAdvancedSentiment(userInput);

    // Cập nhật tâm trạng người dùng
    context.userPersonality.mood = sentiment.primary;

    // Nếu người dùng hài lòng với phản hồi, tăng trọng số cho chủ đề đó
    if (context.lastTopic) {
        context.userPreferences[context.lastTopic] = (context.userPreferences[context.lastTopic] || 0) + 1;

        // Cập nhật mức độ quan tâm
        if (sentiment.primary === 'joy' || sentiment.primary === 'trust' || sentiment.primary === 'anticipation') {
            context.userPersonality.interest[context.lastTopic] = (context.userPersonality.interest[context.lastTopic] || 0) + 1;
        }
    }

    // Cập nhật mức độ tương tác
    context.userPersonality.engagement = Math.min(1.0, context.userPersonality.engagement + 0.05);

    saveConversationState(context);
    
    // Cập nhật mối quan hệ người dùng
    updateRelationship(userInput, botResponse, sentiment.primary);
}

// Hàm tạo phản hồi cá nhân hóa
function generatePersonalizedResponse(intent, context) {
    const userMood = context.userPersonality.mood;
    const engagementLevel = context.userPersonality.engagement;
    
    // Các mẫu phản hồi theo tâm trạng người dùng
    const moodResponses = {
        'very_positive': [
            `Rất vui vì ${getUserName()} cảm thấy tích cực! ${getUserName()} có muốn chia sẻ thêm điều gì khiến ${getUserName()} vui không?`,
            `Thật tuyệt vời khi thấy ${getUserName()} vui vẻ! Có điều gì đặc biệt hôm nay không?`,
            `${getAssistantName(true)} rất vui khi ${getUserName()} có tâm trạng tốt! Hãy tiếp tục giữ tinh thần lạc quan nhé!`
        ],
        'positive': [
            `${getAssistantName(true)} thấy ${getUserName()} đang cảm thấy khá tốt! Đó là điều đáng mừng!`,
            `Rất vui khi ${getUserName()} có tâm trạng tích cực! Có điều gì ${getUserName()} muốn làm hôm nay không?`,
            `Tâm trạng tích cực là điều rất tốt! ${getUserName()} có muốn ${getAssistantName()} giúp gì không?`
        ],
        'neutral': [
            `${getAssistantName(true)} hiểu. Có điều gì ${getUserName()} muốn nói hoặc cần giúp đỡ không?`,
            `${getAssistantName(true)} ở đây để lắng nghe ${getUserName()}. ${getUserName()} có muốn chia sẻ điều gì không?`,
            `Có vẻ ${getUserName()} đang ở trạng thái cân bằng. ${getUserName()} có điều gì muốn nói không?`
        ],
        'negative': [
            `${getAssistantName(true)} hiểu ${getUserName()} đang cảm thấy không vui. ${getUserName()} có muốn chia sẻ điều gì không?`,
            `${getAssistantName(true)} ở đây để lắng nghe ${getUserName()}. Đôi khi chỉ cần nói ra cũng giúp nhẹ lòng hơn.`,
            `${getAssistantName(true)} thấy ${getUserName()} đang có chút phiền lòng. ${getUserName()} có muốn ${getAssistantName()} giúp gì không?`
        ],
        'very_negative': [
            `${getAssistantName(true)} rất tiếc khi ${getUserName()} đang cảm thấy buồn. Hãy nhớ rằng mọi chuyện rồi sẽ ổn mà.`,
            `${getAssistantName(true)} hiểu ${getUserName()} đang trải qua thời gian khó khăn. ${getUserName()} không đơn độc đâu nhé.`,
            `${getAssistantName(true)} ở đây bên cạnh ${getUserName()}. Đôi khi chia sẻ với ai đó có thể giúp ${getUserName()} cảm thấy tốt hơn.`
        ]
    };
    
    // Các mẫu phản hồi theo mức độ tương tác
    const engagementResponses = {
        'low': [
            `${getAssistantName(true)} hy vọng có thể giúp ${getUserName()} nhiều hơn. ${getUserName()} có điều gì muốn hỏi không?`,
            `${getAssistantName(true)} luôn sẵn sàng trò chuyện. ${getUserName()} có muốn ${getAssistantName()} giới thiệu điều gì mới không?`,
            `${getUserName()} có thể hỏi ${getAssistantName()} bất cứ điều gì ${getUserName()} muốn. ${getAssistantName(true)} luôn ở đây để giúp đỡ.`
        ],
        'medium': [
            `Rất vui được trò chuyện với ${getUserName()}! ${getUserName()} có điều gì muốn khám phá thêm không?`,
            `${getAssistantName(true)} thấy chúng ta đang có cuộc trò chuyện thú vị. ${getUserName()} muốn tiếp tục không?`,
            `${getAssistantName(true)} rất thích được trò chuyện với ${getUserName()}. Có điều gì ${getUserName()} muốn chia sẻ không?`
        ],
        'high': [
            `Cuộc trò chuyện với ${getUserName()} thật thú vị! ${getUserName()} có muốn khám phá thêm điều gì không?`,
            `${getAssistantName(true)} rất thích những cuộc trò chuyện như thế này. ${getUserName()} có điều gì muốn nói không?`,
            `${getUserName()} là người rất thú vị để trò chuyện! Có điều gì ${getUserName()} muốn nói không?`
        ]
    };
    
    // Chọn phản hồi dựa trên tâm trạng
    if (moodResponses[userMood]) {
        return moodResponses[userMood][Math.floor(Math.random() * moodResponses[userMood].length)];
    }
    
    // Nếu không có phản hồi phù hợp với tâm trạng, chọn theo mức độ tương tác
    let engagementLevelStr = 'medium';
    if (engagementLevel < 0.3) engagementLevelStr = 'low';
    else if (engagementLevel > 0.7) engagementLevelStr = 'high';
    
    return engagementResponses[engagementLevelStr][Math.floor(Math.random() * engagementResponses[engagementLevelStr].length)];
}

// Hàm tạo phản hồi thông minh dựa trên ngữ cảnh
function generateSmartResponse(intent, context, userInput) {
    // Nếu có chủ đề trước đó và người dùng có tâm trạng tích cực
    if (context.lastTopic && (context.userPersonality.mood === 'positive' || context.userPersonality.mood === 'very_positive')) {
        const responses = {
            'greeting': [
                `Rất vui được gặp lại ${getUserName()}! ${getUserName()} có điều gì mới muốn chia sẻ không?`,
                `Chào ${getUserName()} trở lại! Có vẻ ${getUserName()} đang có tâm trạng tốt hôm nay!`,
                `Xin chào! ${getAssistantName(true)} thấy ${getUserName()} đang rất tích cực. Có điều gì khiến ${getUserName()} vui không?`
            ],
            'weather': [
                `${getUserName()} có muốn biết thêm thông tin chi tiết về thời tiết không?`,
                `Dựa vào thời tiết hôm nay, ${getUserName()} có dự định gì đặc biệt không?`,
                `Thời tiết hôm nay khá thú vị. ${getUserName()} có muốn ${getAssistantName()} gợi ý hoạt động phù hợp không?`
            ],
            'music': [
                `${getUserName()} có muốn ${getAssistantName()} gợi ý thêm bài hát theo sở thích của ${getUserName()} không?`,
                `${getAssistantName(true)} thấy ${getUserName()} thích nghe nhạc. ${getUserName()} có thể cho ${getAssistantName()} biết thể loại yêu thích không?`,
                `Âm nhạc là một phần quan trọng trong cuộc sống. ${getUserName()} có muốn ${getAssistantName()} tạo danh sách phát cho ${getUserName()} không?`
            ],
            'wikipedia': [
                `${getUserName()} có muốn tìm hiểu sâu hơn về chủ đề này không?`,
                `Thông tin này khá thú vị. ${getUserName()} có muốn ${getAssistantName()} tìm thêm tài liệu liên quan không?`,
                `${getAssistantName(true)} có thể tìm thêm thông tin chi tiết nếu ${getUserName()} muốn. ${getUserName()} muốn biết gì thêm?`
            ]
        };
        
        if (responses[context.lastTopic]) {
            return responses[context.lastTopic][Math.floor(Math.random() * responses[context.lastTopic].length)];
        }
    }
    
    // Phản hồi chung nếu không có ngữ cảnh phù hợp
    return generatePersonalizedResponse(intent, context);
}

// Hàm phân tích cảm xúc nâng cao với mô hình cảm xúc mở rộng
function analyzeAdvancedSentiment(text) {
    const emotions = {
        joy: ['vui', 'hạnh phúc', 'vui vẻ', 'hài lòng', 'thích', 'yêu', 'tận hưởng', 'niềm vui', 'tươi', 'cười', 'tuyệt vời', 'tuyệt', 'xuất sắc', 'tốt', 'hay', 'đẹp', 'ok', 'ổn', 'cảm ơn', 'thank', 'thanks', 'tuyệt vời quá', 'tuyệt vời thật', 'xuất sắc', 'tài giỏi', 'giỏi', 'hiệu quả', 'thông minh'],
        sadness: ['buồn', 'chán', 'thất vọng', 'mệt', 'phiền', 'lo lắng', 'stress', 'xấu hổ', 'thất bại', 'muộn', 'trễ', 'hỏng', 'lỗi', 'tệ', 'chán quá', 'không được', 'buồn quá', 'chán thật', 'thất vọng quá'],
        anger: ['giận', 'tức', 'tệ quá', 'kinh khủng', 'kém', 'xấu', 'không được', 'tức quá', 'bực', 'tức giận', 'giận dữ', 'bực bội', 'tức tối'],
        fear: ['sợ', 'lo', 'ngại', 'e ngại', 'hãi', 'kinh', 'run', 'sợ hãi', 'lo lắng', 'bồn chồn', 'bất an'],
        surprise: ['wow', 'ủa', 'chậc', 'không ngờ', 'bất ngờ', 'kinh', 'ủa trời', 'trời ơi', 'không tin', 'kinh ngạc', 'ngạc nhiên'],
        disgust: ['ghét', 'kinh', 'xấu', 'tệ', 'kém', 'kinh tởm', 'ghê', 'xấu hổ', 'tồi tệ', 'kinh khủng'],
        trust: ['tin', 'yêu', 'thích', 'hài lòng', 'ổn', 'ok', 'tốt', 'uy tín', 'đáng tin', 'tin tưởng', 'tin cậy'],
        anticipation: ['mong', 'chờ', 'hy vọng', 'mong chờ', 'mong đợi', 'hẹn', 'dự định', 'kỳ vọng', 'hy vọng', 'mong ước']
    };

    const words = text.toLowerCase().split(/\s+/);
    const scores = {};
    
    for (const [emotion, emotionWords] of Object.entries(emotions)) {
        scores[emotion] = 0;
        for (const word of words) {
            if (emotionWords.includes(word)) {
                scores[emotion]++;
            }
        }
    }

    // Xác định cảm xúc chính
    let dominantEmotion = 'neutral';
    let maxScore = 0;
    for (const [emotion, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            dominantEmotion = emotion;
        }
    }

    // Nếu không có từ cảm xúc nào, kiểm tra độ dài và dấu hiệu cảm xúc
    if (maxScore === 0) {
        if (text.length > 100) return { primary: 'neutral', scores: scores, intensity: 0.1 };
        if (text.includes('?')) return { primary: 'anticipation', scores: scores, intensity: 0.3 };
        if (text.includes('!')) return { primary: 'surprise', scores: scores, intensity: 0.4 };
        return { primary: 'neutral', scores: scores, intensity: 0.1 };
    }

    return {
        primary: dominantEmotion,
        scores: scores,
        intensity: Math.min(maxScore / words.length, 1.0)
    };
}

// Hàm tạo phản hồi cảm xúc phù hợp
function generateEmotionalResponse(sentimentAnalysis, userInput) {
    if (typeof sentimentAnalysis === 'string') {
        // Nếu là chuỗi đơn giản, chuyển thành đối tượng
        sentimentAnalysis = { primary: sentimentAnalysis, scores: {}, intensity: 0.5 };
    }

    const emotionalResponses = {
        joy: [
            `Thật tuyệt vời khi thấy ${getUserName()} đang vui vẻ! 😊 ${getUserName()} có muốn chia sẻ điều gì khiến ${getUserName()} hạnh phúc không?`,
            `${getAssistantName(true)} rất vui vì ${getUserName()} đang có tâm trạng tích cực! Có điều gì đặc biệt đang xảy ra không?`,
            `Thật tuyệt khi thấy ${getUserName()} vui vẻ! Tâm trạng tích cực thật sự có sức mạnh kỳ diệu.`,
            `Rất vui được thấy ${getUserName()} đang hạnh phúc! ${getUserName()} có điều gì muốn chia sẻ thêm không?`,
            `Niềm vui của ${getUserName()} thật sự lan tỏa! Có điều gì khiến ${getUserName()} vui đến vậy không?`
        ],
        sadness: [
            `${getAssistantName(true)} hiểu ${getUserName()} đang cảm thấy buồn. Đôi khi chỉ cần chia sẻ cũng giúp nhẹ lòng hơn.`,
            `${getAssistantName(true)} ở đây bên cạnh ${getUserName()}. ${getUserName()} không đơn độc đâu nhé.`,
            `${getAssistantName(true)} thấy ${getUserName()} đang có chút phiền lòng. ${getUserName()} có muốn nói về điều gì đang làm ${getUserName()} buồn không?`,
            `${getAssistantName(true)} nhận thấy ${getUserName()} đang buồn. Hãy nhớ rằng mọi chuyện rồi sẽ ổn mà.`,
            `${getAssistantName(true)} hiểu cảm giác của ${getUserName()}. Đôi khi có người lắng nghe cũng giúp ích rất nhiều.`
        ],
        anger: [
            `${getAssistantName(true)} hiểu ${getUserName()} đang cảm thấy bực bội. Hãy hít thở sâu và từ từ chia sẻ với ${getAssistantName()} nhé.`,
            `Có vẻ ${getUserName()} đang tức giận. ${getAssistantName(true)} ở đây để lắng nghe ${getUserName()}.`,
            `${getAssistantName(true)} nhận thấy sự bực bội trong lời nói của ${getUserName()}. ${getUserName()} có muốn nói về điều gì đang làm ${getUserName()} khó chịu không?`,
            `${getAssistantName(true)} cảm nhận được sự tức giận của ${getUserName()}. Hãy cùng ${getAssistantName()} tìm cách giải quyết nhé.`,
            `${getAssistantName(true)} hiểu ${getUserName()} đang bực bội. Hãy cho ${getAssistantName()} biết điều gì đang làm ${getUserName()} khó chịu.`
        ],
        fear: [
            `${getAssistantName(true)} hiểu ${getUserName()} đang lo lắng. Hãy cùng ${getAssistantName()} tìm cách giải quyết nhé.`,
            `Lo lắng là điều bình thường. ${getUserName()} có thể chia sẻ nỗi lo của mình với ${getAssistantName()}.`,
            `${getAssistantName(true)} thấy ${getUserName()} đang có chút sợ hãi. Hãy nhớ rằng ${getAssistantName()} luôn ở đây để hỗ trợ ${getUserName()}.`,
            `${getAssistantName(true)} cảm nhận được sự lo lắng của ${getUserName()}. Hãy cùng nhau vượt qua điều này.`,
            `${getAssistantName(true)} hiểu ${getUserName()} đang sợ điều gì đó. ${getUserName()} có thể chia sẻ với ${getAssistantName()} để cảm thấy tốt hơn.`
        ],
        surprise: [
            `Ồ, có vẻ ${getUserName()} đang ngạc nhiên về điều gì đó! ${getUserName()} muốn chia sẻ điều thú vị đó không?`,
            `Thật bất ngờ! ${getAssistantName(true)} rất tò mò muốn biết điều gì khiến ${getUserName()} ngạc nhiên như vậy.`,
            `Wow, có điều gì đó thú vị đang xảy ra! ${getUserName()} có thể kể cho ${getAssistantName()} nghe không?`,
            `${getAssistantName(true)} cảm nhận được sự ngạc nhiên trong lời nói của ${getUserName()}. Có điều gì đặc biệt không?`,
            `Có vẻ ${getUserName()} vừa phát hiện điều gì đó bất ngờ! ${getUserName()} có muốn chia sẻ không?`
        ],
        disgust: [
            `${getAssistantName(true)} cảm nhận được sự không hài lòng của ${getUserName()}. ${getUserName()} có thể nói rõ hơn để ${getAssistantName()} hiểu và giúp đỡ không?`,
            `Có vẻ ${getUserName()} không thích điều gì đó. ${getAssistantName(true)} muốn hiểu rõ hơn để hỗ trợ ${getUserName()} tốt hơn.`,
            `${getAssistantName(true)} nhận thấy sự không hài lòng trong lời nói của ${getUserName()}. ${getUserName()} có muốn chia sẻ lý do không?`,
            `${getAssistantName(true)} cảm thấy ${getUserName()} không hài lòng. Hãy cho ${getAssistantName()} biết điều gì đang làm ${getUserName()} khó chịu.`,
            `${getAssistantName(true)} nhận ra ${getUserName()} không thích điều gì đó. ${getUserName()} có thể nói rõ hơn để ${getAssistantName()} giúp ${getUserName()} được không?`
        ],
        trust: [
            `${getAssistantName(true)} rất vui vì ${getUserName()} cảm thấy tin tưởng ${getAssistantName()}. Hãy tiếp tục chia sẻ với ${getAssistantName()} nhé!`,
            `Sự tin tưởng của ${getUserName()} là điều rất quý giá đối với ${getAssistantName()}.`,
            `${getAssistantName(true)} rất trân trọng sự tin tưởng mà ${getUserName()} dành cho ${getAssistantName()}.`,
            `Rất cảm kích vì ${getUserName()} tin tưởng ${getAssistantName()}. ${getAssistantName(true)} sẽ luôn ở đây để hỗ trợ ${getUserName()}.`,
            `Sự tin tưởng của ${getUserName()} khiến ${getAssistantName()} càng có trách nhiệm hơn trong việc giúp đỡ ${getUserName()}.`
        ],
        anticipation: [
            `${getAssistantName(true)} thấy ${getUserName()} đang háo hức chờ đợi điều gì đó! ${getUserName()} có thể chia sẻ với ${getAssistantName()} không?`,
            `Có vẻ ${getUserName()} đang mong chờ điều gì đó thú vị. ${getAssistantName(true)} cũng rất tò mò!`,
            `${getUserName()} có vẻ rất háo hức! Hãy cho ${getAssistantName()} biết điều gì đang khiến ${getUserName()} mong chờ như vậy.`,
            `${getAssistantName(true)} cảm nhận được sự háo hức của ${getUserName()}. Có điều gì đặc biệt sắp xảy ra không?`,
            `${getUserName()} có vẻ rất mong chờ điều gì đó! ${getAssistantName(true)} cũng rất tò mò muốn biết.`
        ],
        neutral: [
            `${getAssistantName(true)} hiểu. ${getUserName()} có điều gì muốn chia sẻ hoặc cần giúp đỡ không?`,
            `${getAssistantName(true)} ở đây để lắng nghe ${getUserName()}. Có điều gì ${getUserName()} muốn nói không?`,
            `${getUserName()} có vẻ đang ở trạng thái cân bằng. Có điều gì ${getUserName()} muốn thảo luận không?`,
            `${getAssistantName(true)} nhận thấy ${getUserName()} đang ở trạng thái trung lập. ${getUserName()} có điều gì muốn chia sẻ không?`,
            `Có vẻ ${getUserName()} đang cân nhắc điều gì. ${getUserName()} có muốn ${getAssistantName()} giúp ${getUserName()} phân tích không?`
        ]
    };

    const responses = emotionalResponses[sentimentAnalysis.primary] || emotionalResponses.neutral;
    return responses[Math.floor(Math.random() * responses.length)];
}

// Hàm phân tích ngữ nghĩa nâng cao
function analyzeSemanticMeaning(text) {
    const semanticPatterns = {
        // Các mẫu câu hỏi
        question: {
            patterns: [/tại sao/, /vì sao/, /lí do/, /nguyên nhân/, /thế nào/, /ra sao/, /ra gì/, /gì/, /ai/, /nào/, /đâu/, /bao nhiêu/, /khi nào/, /how/, /why/, /what/, /when/, /where/, /\?/],
            weight: 1.2
        },
        // Các mẫu câu mệnh lệnh
        command: {
            patterns: [/hãy/, /đi/, /làm/, /thực hiện/, /bắt đầu/, /dừng/, /tạm biệt/, /quit/, /exit/, /tắt/, /mở/, /bật/, /tôi muốn/],
            weight: 1.1
        },
        // Các mẫu câu cảm thán
        exclamation: {
            patterns: [/!/],
            weight: 1.0
        },
        // Các mẫu yêu cầu hành động
        request: {
            patterns: [/giúp/, /hỗ trợ/, /trợ giúp/, /please/, /help/, /có thể/, /có thể giúp/, /vui lòng/, /xin hãy/],
            weight: 1.3
        },
        // Các mẫu yêu cầu thông tin
        information: {
            patterns: [/thông tin/, /thông báo/, /cập nhật/, /mới/, /gần đây/, /hiện tại/, /bây giờ/, /biết/, /hiểu/, /nghĩa/, /lý do/],
            weight: 1.0
        },
        // Các mẫu yêu cầu giải thích
        explanation: {
            patterns: [/giải thích/, /lý giải/, /giải nghĩa/, /nghĩa là/, /ý là/, /explain/, /giải thích cho tôi/],
            weight: 1.4
        },
        // Các mẫu yêu cầu gợi ý
        suggestion: {
            patterns: [/gợi ý/, /đề xuất/, /đề nghị/, /gợi ý cho tôi/, /đề xuất cho tôi/, /nên làm gì/, /làm gì/],
            weight: 1.2
        }
    };

    const analysis = {
        type: 'statement',
        confidence: 0,
        detectedPatterns: []
    };

    for (const [type, patternInfo] of Object.entries(semanticPatterns)) {
        for (const pattern of patternInfo.patterns) {
            if (pattern.test(text)) {
                analysis.detectedPatterns.push({type, pattern: pattern.toString()});
                if (patternInfo.weight > analysis.confidence) {
                    analysis.type = type;
                    analysis.confidence = patternInfo.weight;
                }
            }
        }
    }

    return analysis;
}

// Hàm tạo phản hồi thông minh dựa trên ngữ cảnh, cảm xúc và ngữ nghĩa
function generateAdvancedResponse(intent, context, userInput) {
    const sentiment = analyzeAdvancedSentiment(userInput);
    const semantic = analyzeSemanticMeaning(userInput);
    
    // Nếu người dùng có tâm trạng tích cực và đang hỏi thông tin
    if (sentiment.primary === 'joy' && semantic.type === 'information') {
        return [
            `Rất vui được giúp ${getUserName()}! ${getUserName()} muốn biết thông tin gì?`,
            `${getAssistantName(true)} rất hào hứng để giúp ${getUserName()}! ${getUserName()} cần thông tin gì?`,
            `Tuyệt vời! Hãy cho ${getAssistantName()} biết ${getUserName()} muốn tìm hiểu điều gì nhé!`,
            `Thật tuyệt khi ${getUserName()} quan tâm đến điều đó! ${getUserName()} muốn biết gì thêm?`,
            `${getAssistantName(true)} rất vui được chia sẻ kiến thức với ${getUserName()}! ${getUserName()} cần thông tin gì?`
        ][Math.floor(Math.random() * 5)];
    }
    
    // Nếu người dùng đang tức giận và yêu cầu hành động
    if (sentiment.primary === 'anger' && semantic.type === 'request') {
        return [
            `${getAssistantName(true)} hiểu ${getUserName()} đang bực bội. Hãy để ${getAssistantName()} giúp ${getUserName()} giải quyết vấn đề này.`,
            `${getAssistantName(true)} nhận thấy ${getUserName()} đang khó chịu. ${getAssistantName(true)} sẽ cố gắng giúp ${getUserName()} ngay lập tức.`,
            `${getAssistantName(true)} hiểu cảm giác của ${getUserName()}. Hãy để ${getAssistantName()} hỗ trợ ${getUserName()} giải quyết điều này.`,
            `${getAssistantName(true)} cảm nhận được sự bực bội của ${getUserName()}. ${getAssistantName(true)} sẽ cố gắng giúp ${getUserName()} ngay.`,
            `${getAssistantName(true)} hiểu ${getUserName()} đang tức giận. Hãy để ${getAssistantName()} hỗ trợ ${getUserName()} giải quyết vấn đề này.`
        ][Math.floor(Math.random() * 5)];
    }
    
    // Nếu người dùng đang lo lắng và hỏi câu hỏi
    if (sentiment.primary === 'fear' && semantic.type === 'question') {
        return [
            `${getAssistantName(true)} hiểu ${getUserName()} đang lo lắng. Hãy để ${getAssistantName()} trả lời câu hỏi của ${getUserName()} một cách rõ ràng nhất.`,
            `${getAssistantName(true)} thấy ${getUserName()} đang có chút lo lắng. ${getAssistantName(true)} sẽ giải thích mọi thứ cho ${getUserName()}.`,
            `Đừng lo lắng, ${getAssistantName()} sẽ trả lời câu hỏi của ${getUserName()} một cách chi tiết.`,
            `${getAssistantName(true)} cảm nhận được sự lo lắng của ${getUserName()}. Hãy để ${getAssistantName()} giải đáp câu hỏi của ${getUserName()}.`,
            `${getAssistantName(true)} hiểu ${getUserName()} đang lo lắng. ${getAssistantName(true)} sẽ cung cấp thông tin rõ ràng để ${getUserName()} yên tâm hơn.`
        ][Math.floor(Math.random() * 5)];
    }
    
    // Nếu người dùng đang háo hức và có yêu cầu hành động
    if (sentiment.primary === 'anticipation' && semantic.type === 'request') {
        return [
            `Tuyệt vời! ${getAssistantName(true)} rất háo hức được giúp ${getUserName()} thực hiện điều đó!`,
            `${getAssistantName(true)} cũng rất mong chờ! Hãy cùng bắt đầu nào!`,
            `Thật tuyệt vời! Hãy để ${getAssistantName()} giúp ${getUserName()} thực hiện điều ${getUserName()} đang mong chờ.`,
            `${getAssistantName(true)} cũng rất háo hức! Hãy cùng thực hiện điều đó nào!`,
            `Thật tuyệt khi thấy ${getUserName()} phấn khích! Hãy để ${getAssistantName()} giúp ${getUserName()} thực hiện điều đó.`
        ][Math.floor(Math.random() * 5)];
    }
    
    // Nếu người dùng yêu cầu giải thích và có cảm xúc trung lập
    if (semantic.type === 'explanation' && sentiment.primary !== 'anger' && sentiment.primary !== 'fear') {
        return [
            `${getAssistantName(true)} sẽ giải thích điều đó một cách rõ ràng nhất cho ${getUserName()}.`,
            `Rất vui được giải thích điều đó cho ${getUserName()} hiểu.`,
            `Hãy để ${getAssistantName()} giải thích chi tiết cho ${getUserName()}.`,
            `${getAssistantName(true)} sẽ cung cấp thông tin đầy đủ để ${getUserName()} hiểu rõ.`,
            `${getAssistantName(true)} sẽ giải thích một cách dễ hiểu nhất cho ${getUserName()}.`
        ][Math.floor(Math.random() * 5)];
    }
    
    // Nếu người dùng yêu cầu gợi ý và có cảm xúc tích cực
    if (semantic.type === 'suggestion' && (sentiment.primary === 'joy' || sentiment.primary === 'trust' || sentiment.primary === 'anticipation')) {
        return [
            `${getAssistantName(true)} có vài gợi ý tuyệt vời cho ${getUserName()}! Hãy để ${getAssistantName()} chia sẻ.`,
            `${getAssistantName(true)} có một số đề xuất thú vị dành cho ${getUserName()}!`,
            `${getAssistantName(true)} sẽ gợi ý một số lựa chọn tuyệt vời cho ${getUserName()}!`,
            `${getAssistantName(true)} có vài ý tưởng tuyệt vời muốn chia sẻ với ${getUserName()}!`,
            `${getAssistantName(true)} có thể đưa ra một số gợi ý phù hợp cho ${getUserName()}!`
        ][Math.floor(Math.random() * 5)];
    }
    
    // Phản hồi mặc định dựa trên cảm xúc chính
    return generateEmotionalResponse(sentiment, userInput);
}

// Hàm giải thích các khái niệm phức tạp
function explainComplexTopic(topic) {
    const explanations = {
        "AI": "AI (Trí tuệ nhân tạo) là lĩnh vực nghiên cứu tạo ra máy móc có thể thực hiện các nhiệm vụ đòi hỏi trí thông minh của con người như học tập, lập kế hoạch, giải quyết vấn đề, nhận thức thị giác, nhận diện giọng nói, dịch ngôn ngữ và ra quyết định. AI được ứng dụng trong nhiều lĩnh vực như y tế, giáo dục, tài chính, giao thông...",
        "blockchain": "Blockchain là công nghệ lưu trữ dữ liệu dưới dạng chuỗi khối, được phân tán và bảo mật cao. Mỗi khối chứa thông tin giao dịch và liên kết với khối trước đó bằng mã hóa. Công nghệ này được sử dụng trong tiền mã hóa như Bitcoin, hợp đồng thông minh, xác minh danh tính, truy xuất nguồn gốc...",
        "quantum computing": "Máy tính lượng tử là loại máy tính sử dụng các hiệu ứng lượng tử như chồng chập và rối lượng tử để xử lý thông tin. Không giống máy tính cổ điển chỉ xử lý bit 0 và 1, máy tính lượng tử xử lý qubit có thể ở cả hai trạng thái cùng lúc, cho phép xử lý song song và giải quyết các bài toán phức tạp nhanh hơn nhiều.",
        "climate change": "Biến đổi khí hậu là sự thay đổi lâu dài của các chỉ số thời tiết như nhiệt độ, mưa, gió... trên toàn cầu hoặc khu vực rộng lớn. Nguyên nhân chính là do con người thải ra khí nhà kính như CO2, làm Trái Đất nóng lên, gây ra các hiện tượng thời tiết cực đoan, tan băng, dâng mực nước biển...",
        "DNA": "DNA (axit deoxyribonucleic) là phân tử mang thông tin di truyền trong tất cả sinh vật sống. DNA có cấu trúc xoắn kép gồm 4 nucleotide: Adenine (A), Thymine (T), Guanine (G), Cytosine (C). Trình tự các nucleotide này tạo nên gen quy định đặc điểm di truyền của sinh vật."
    };

    return explanations[topic] || `${getAssistantName(true)} có thể giải thích nhiều khái niệm phức tạp. ${getUserName()} muốn ${getAssistantName()} giải thích điều gì?`;
}

// Hàm tư vấn và đưa ra lời khuyên
function giveAdvice(topic) {
    const advices = {
        "cuộc sống": [
            "Cuộc sống là hành trình, không phải đích đến. Hãy tận hưởng từng khoảnh khắc.",
            "Đừng so sánh bản thân với người khác, hãy so sánh với chính mình của ngày hôm qua.",
            "Thất bại không phải là dấu chấm hết, mà là bước đệm để thành công.",
            "Luôn học hỏi và phát triển bản thân mỗi ngày.",
            "Giữ cho tâm trí luôn tích cực, vì suy nghĩ tích cực tạo ra kết quả tích cực."
        ],
        "học tập": [
            "Học không phải để ép buộc, mà là để mở rộng hiểu biết và phát triển bản thân.",
            "Hãy học cách học, vì đó là kỹ năng quan trọng nhất trong thời đại thay đổi nhanh chóng.",
            "Đừng sợ sai, sai là một phần của quá trình học tập.",
            "Liên hệ kiến thức với thực tế để hiểu sâu hơn.",
            "Luôn tò mò và đặt câu hỏi, vì đó là cách học hiệu quả nhất."
        ],
        "công việc": [
            `Chọn công việc mình yêu thích, ${getUserName()} sẽ không bao giờ cảm thấy phải làm việc một ngày nào.`,
            "Luôn trân trọng cơ hội học hỏi từ công việc, dù nhỏ nhất.",
            "Xây dựng mối quan hệ tốt với đồng nghiệp, vì thành công thường đến từ làm việc nhóm.",
            `Đừng ngại thử thách, đó là cơ hội để ${getUserName()} trưởng thành.`,
            "Cân bằng giữa công việc và cuộc sống cá nhân để duy trì năng suất lâu dài."
        ],
        "tình yêu": [
            "Tình yêu chân chính là sự tôn trọng, thấu hiểu và chấp nhận lẫn nhau.",
            "Trong tình yêu, sự kiên nhẫn và lắng nghe quan trọng hơn lời nói.",
            "Yêu thương bắt đầu từ việc yêu bản thân mình.",
            "Tình yêu không phải là sở hữu, mà là sự đồng hành và hỗ trợ lẫn nhau.",
            "Duy trì tình yêu cần sự nỗ lực từ cả hai phía."
        ],
        "sức khỏe": [
            "Sức khỏe là tài sản quý giá nhất, hãy chăm sóc nó như một khoản đầu tư dài hạn.",
            "Ngủ đủ giấc, ăn uống lành mạnh và vận động thường xuyên.",
            "Giữ tinh thần thoải mái, vì sức khỏe tinh thần ảnh hưởng lớn đến sức khỏe thể chất.",
            "Thỉnh thoảng hãy tạm dừng công việc để nghỉ ngơi và thư giãn.",
            "Phòng bệnh hơn chữa bệnh, hãy khám sức khỏe định kỳ."
        ]
    };
    
    if (advices[topic]) {
        return advices[topic][Math.floor(Math.random() * advices[topic].length)];
    }
    
    return `${getAssistantName(true)} có thể đưa ra lời khuyên về nhiều lĩnh vực như cuộc sống, học tập, công việc, tình yêu, sức khỏe... ${getUserName()} muốn ${getAssistantName()} tư vấn về điều gì?`;
}

// Hàm kể chuyện
function tellStory(type) {
    const stories = {
        "ngụ ngôn": [
            "Có một con cáo nhìn thấy chùm nho chín treo cao trên cành. Nó cố nhảy lên để với lấy nhưng không với được. Cuối cùng cáo bỏ cuộc và nói: 'Chùm nho chua, không ăn được đâu.' Câu chuyện dạy rằng: Đừng phủ nhận giá trị của điều gì đó chỉ vì bạn không đạt được nó.",
            "Rùa và thỏ cùng thi chạy. Thỏ nhanh hơn nhiều nên tự tin ngủ gật giữa đường. Rùa chậm nhưng kiên trì, cuối cùng về đích trước thỏ. Bài học: Kiên trì và bền bỉ quan trọng hơn tài năng.",
            "Chuột nhà và chuột đồng. Chuột đồng mời chuột nhà ăn bữa cơm đạm bạc. Chuột nhà thấy chê bai, nhưng khi có người đến, chuột đồng chạy trốn dễ dàng trong hang, còn chuột nhà hoảng loạn không biết trốn đâu. Bài học: Cuộc sống giản dị đôi khi an toàn hơn cuộc sống xa hoa."
        ],
        "thiếu nhi": [
            "Ngày xửa ngày xưa, có một chú thỏ trắng rất ham chơi. Một hôm, thỏ đi lạc vào rừng sâu và gặp được một bác gấu già. Bác gấu dẫn thỏ về nhà, nấu cháo cho thỏ ăn và chỉ đường về nhà. Từ đó thỏ hiểu rằng khi gặp khó khăn, cần nhờ sự giúp đỡ của người khác.",
            "Có một chú voi con rất nhút nhát, không dám chơi với các bạn. Một hôm, voi con cứu một đàn chim khỏi cơn bão. Các bạn động vật khen ngợi voi con và rủ voi chơi cùng. Voi hiểu rằng mình cũng có giá trị riêng.",
            "Chú mèo con không biết bắt chuột, bị các bạn chê cười. Mèo buồn lắm, đi tìm mẹ. Mẹ mèo dỗ dành: 'Mỗi con vật có tài riêng, con giỏi vuốt ve, làm bạn với mọi người.' Mèo con hiểu ra và tự hào về bản thân."
        ],
        "cuộc sống": [
            "Có một người cha đưa hai con trai đến một ngôi làng lạ. Anh bảo một người con đi hỏi người dân nơi đó có tốt không. Người con đi và trở về nói: 'Dân làng rất tệ, họ không thân thiện.' Người cha lại gửi người con thứ hai. Người con thứ hai trở về nói: 'Dân làng rất tốt, họ rất thân thiện.' Người cha mỉm cười: 'Con à, chính con là người quyết định cách người khác đối xử với con.'",
            "Một người thầy đưa cho học trò một nắm cát và hỏi: 'Cát này có nặng không?' Học trò đáp: 'Không nặng.' Thầy lại hỏi: 'Nếu giữ nó suốt một ngày thì sao?' 'Có thể mỏi tay.' 'Nếu giữ nó cả tuần?' 'Sẽ đau tay.' Thầy nói: 'Giữ nỗi buồn, giận dữ lâu ngày cũng vậy, sẽ tổn hại đến con.'",
            "Một người nông dân có con lừa bị rơi xuống giếng. Ông nghĩ không thể cứu được, nên quyết định lấp giếng đi. Nhưng khi ông đổ đất xuống, con lừa dốc sức lắc đất ra và đứng lên trên lớp đất mới. Cứ như vậy, lừa leo lên khỏi giếng. Bài học: Những khó khăn tưởng chừng là tai họa, có thể là cơ hội để vươn lên."
        ]
    };
    
    if (stories[type]) {
        return stories[type][Math.floor(Math.random() * stories[type].length)];
    }
    
    return `${getAssistantName(true)} có thể kể nhiều loại truyện như ngụ ngôn, thiếu nhi, cuộc sống... ${getUserName()} muốn nghe thể loại nào?`;
}

// Hàm giải trí và trò chơi
function suggestEntertainment(type) {
    const entertainment = {
        "trò chơi": [
            "Bạn có thể chơi cờ vua, một trò chơi chiến thuật tuyệt vời giúp rèn luyện tư duy.",
            "Trò chơi ô chữ giúp tăng vốn từ vựng và khả năng suy luận.",
            "Sudoku là trò chơi logic giúp cải thiện khả năng tư duy và tập trung.",
            "Bạn có thể chơi trò đoán chữ, một trò chơi trí tuệ vui nhộn.",
            "Trò chơi 20 câu hỏi giúp phát triển khả năng suy luận và kiến thức tổng hợp."
        ],
        "hoạt động": [
            "Đọc sách là cách tuyệt vời để mở rộng hiểu biết và thư giãn tâm trí.",
            "Viết nhật ký giúp bạn ghi lại cảm xúc và suy nghĩ mỗi ngày.",
            "Vẽ tranh là cách thể hiện cảm xúc và phát triển tư duy sáng tạo.",
            "Chụp ảnh thiên nhiên giúp bạn kết nối với môi trường xung quanh.",
            "Làm vườn không chỉ thư giãn mà còn mang lại cảm giác thành tựu."
        ],
        "học hỏi": [
            "Học một ngôn ngữ mới mở ra cánh cửa đến với nền văn hóa khác.",
            "Học chơi một nhạc cụ giúp phát triển khả năng âm nhạc và sự kiên nhẫn.",
            "Học nấu ăn không chỉ giúp bạn tự chăm sóc bản thân mà còn thể hiện tình yêu thương.",
            "Học lập trình giúp phát triển tư duy logic và khả năng giải quyết vấn đề.",
            "Học vẽ giúp phát triển khả năng sáng tạo và cảm nhận nghệ thuật."
        ]
    };
    
    if (entertainment[type]) {
        return entertainment[type][Math.floor(Math.random() * entertainment[type].length)];
    }
    
    return "Em có thể gợi ý nhiều hoạt động giải trí như trò chơi, hoạt động ngoài trời, hoặc học hỏi kỹ năng mới. Anh iu muốn em gợi ý điều gì?";
}

// Hàm lưu trữ và quản lý lời nhắc
function saveReminder(reminder) {
    const reminders = JSON.parse(localStorage.getItem('brain_reminders')) || [];
    reminders.push(reminder);
    localStorage.setItem('brain_reminders', JSON.stringify(reminders));
}

// Hàm kiểm tra lời nhắc
function checkReminders() {
    const reminders = JSON.parse(localStorage.getItem('brain_reminders')) || [];
    const now = new Date();
    const activeReminders = reminders.filter(r => new Date(r.time) <= now && !r.completed);
    
    return activeReminders;
}

// Hàm lưu trữ sở thích người dùng
function saveUserPreference(key, value) {
    const preferences = JSON.parse(localStorage.getItem('brain_user_preferences')) || {};
    preferences[key] = value;
    localStorage.setItem('brain_user_preferences', JSON.stringify(preferences));
}

// Hàm lấy sở thích người dùng
function getUserPreference(key, defaultValue = null) {
    const preferences = JSON.parse(localStorage.getItem('brain_user_preferences')) || {};
    return preferences[key] || defaultValue;
}

// Hàm quản lý ghi chú
function saveNote(note) {
    const notes = JSON.parse(localStorage.getItem('brain_notes')) || [];
    notes.push(note);
    localStorage.setItem('brain_notes', JSON.stringify(notes));
}

// Hàm lấy ghi chú
function getNotes() {
    return JSON.parse(localStorage.getItem('brain_notes')) || [];
}

// Hàm quản lý công việc
function saveTask(task) {
    const tasks = JSON.parse(localStorage.getItem('brain_tasks')) || [];
    tasks.push(task);
    localStorage.setItem('brain_tasks', JSON.stringify(tasks));
}

// Hàm lấy công việc
function getTasks() {
    return JSON.parse(localStorage.getItem('brain_tasks')) || [];
}

// Hàm quản lý lịch hẹn
function saveAppointment(appointment) {
    const appointments = JSON.parse(localStorage.getItem('brain_appointments')) || [];
    appointments.push(appointment);
    localStorage.setItem('brain_appointments', JSON.stringify(appointments));
}

// Hàm lấy lịch hẹn
function getAppointments() {
    return JSON.parse(localStorage.getItem('brain_appointments')) || [];
}

// Hàm chuyển đổi đơn vị
function convertUnit(value, fromUnit, toUnit) {
    const conversions = {
        length: {
            'km': 1000,
            'm': 1,
            'cm': 0.01,
            'mm': 0.001,
            'mile': 1609.34,
            'yard': 0.9144,
            'foot': 0.3048,
            'inch': 0.0254
        },
        weight: {
            'kg': 1,
            'g': 0.001,
            'mg': 0.000001,
            'pound': 0.453592,
            'ounce': 0.0283495
        },
        temperature: {
            'celsius': (val) => val,
            'fahrenheit': (val) => (val - 32) * 5/9,
            'kelvin': (val) => val - 273.15
        }
    };

    if (fromUnit === toUnit) return value;
    
    // Chuyển đổi nhiệt độ đặc biệt
    if (['celsius', 'fahrenheit', 'kelvin'].includes(fromUnit) && ['celsius', 'fahrenheit', 'kelvin'].includes(toUnit)) {
        // Chuyển về Celsius trước
        let celsiusValue = value;
        if (fromUnit === 'fahrenheit') celsiusValue = (value - 32) * 5/9;
        else if (fromUnit === 'kelvin') celsiusValue = value - 273.15;
        
        // Chuyển từ Celsius sang đơn vị đích
        if (toUnit === 'fahrenheit') return (celsiusValue * 9/5) + 32;
        else if (toUnit === 'kelvin') return celsiusValue + 273.15;
        else return celsiusValue;
    }
    
    // Chuyển đổi các đơn vị khác
    const factor = conversions.length[fromUnit] / conversions.length[toUnit];
    return value * factor;
}

// Hàm quản lý liên hệ
function saveContact(contact) {
    const contacts = JSON.parse(localStorage.getItem('brain_contacts')) || [];
    contacts.push(contact);
    localStorage.setItem('brain_contacts', JSON.stringify(contacts));
}

// Hàm lấy liên hệ
function getContacts() {
    return JSON.parse(localStorage.getItem('brain_contacts')) || [];
}

// Hàm quản lý tin nhắn
function saveMessage(message) {
    const messages = JSON.parse(localStorage.getItem('brain_messages')) || [];
    messages.push(message);
    localStorage.setItem('brain_messages', JSON.stringify(messages));
}

// Hàm lấy tin nhắn
function getMessages() {
    return JSON.parse(localStorage.getItem('brain_messages')) || [];
}

// Hàm quản lý email
function saveEmail(email) {
    const emails = JSON.parse(localStorage.getItem('brain_emails')) || [];
    emails.push(email);
    localStorage.setItem('brain_emails', JSON.stringify(emails));
}

// Hàm lấy email
function getEmails() {
    return JSON.parse(localStorage.getItem('brain_emails')) || [];
}

// Hàm quản lý tệp tin
function saveFile(file) {
    const files = JSON.parse(localStorage.getItem('brain_files')) || [];
    files.push(file);
    localStorage.setItem('brain_files', JSON.stringify(files));
}

// Hàm lấy tệp tin
function getFiles() {
    return JSON.parse(localStorage.getItem('brain_files')) || [];
}

// Hàm quản lý cài đặt hệ thống
function saveSetting(setting) {
    const settings = JSON.parse(localStorage.getItem('brain_settings')) || {};
    settings[setting.key] = setting.value;
    localStorage.setItem('brain_settings', JSON.stringify(settings));
}

// Hàm lấy cài đặt hệ thống
function getSettings() {
    return JSON.parse(localStorage.getItem('brain_settings')) || {};
}

export function processCommand(cmd, _speak) {
    // Wrapper để lưu lại câu trả lời cuối cùng vào bộ nhớ trước khi nói
    const speak = (text, html, onEnd) => {
        localStorage.setItem('brain_last_response', text);
        _speak(text, html, onEnd);
        
        // Cập nhật ngữ cảnh cuộc trò chuyện nâng cao
        updateAdvancedContext(cmd, text);

        // Học hỏi từ cuộc trò chuyện
        learnFromConversation(cmd, text);
    };

    // Phân tích câu lệnh nâng cao
    const parsedCmd = parseCommand(cmd);
    
    // --- TÍNH NĂNG HỌC LỆNH MỚI ---
    // Cú pháp: "Học lệnh [A] trả lời [B]" hoặc "Khi nói [A] trả lời [B]"
    const learnMatch = cmd.match(/(?:học lệnh|khi nói) (.+) (?:trả lời|thì nói|nói là) (.+)/i);
    if (learnMatch) {
        const trigger = learnMatch[1].trim().toLowerCase();
        const response = learnMatch[2].trim();

        if (trigger && response) {
            const learned = JSON.parse(localStorage.getItem('brain_learned_commands')) || {};
            learned[trigger] = response;
            localStorage.setItem('brain_learned_commands', JSON.stringify(learned));

            speak(`Đã học xong. Khi ${getUserName()} nói "${trigger}", ${getAssistantName()} sẽ trả lời "${response}".`);
            return;
        }
    }

    // --- TÍNH NĂNG QUÊN LỆNH ---
    // Cú pháp: "Quên lệnh [A]" hoặc "Xóa lệnh [A]"
    const forgetMatch = cmd.match(/(?:quên lệnh|xóa lệnh|quên) (.+)/i);
    if (forgetMatch) {
        const trigger = forgetMatch[1].trim().toLowerCase();
        const learned = JSON.parse(localStorage.getItem('brain_learned_commands')) || {};

        if (learned[trigger]) {
            delete learned[trigger];
            localStorage.setItem('brain_learned_commands', JSON.stringify(learned));
            speak(`Đã xóa lệnh "${trigger}" khỏi bộ nhớ.`);
        } else {
            speak(`${getAssistantName(true)} chưa học lệnh "${trigger}" nào cả.`);
        }
        return;
    }

    // Phân tích ý định người dùng
    const intent = getIntent(cmd);
    const sentiment = analyzeSentiment(cmd);
    const context = getRecentContext();

    // Kiểm tra lời nhắc đang hoạt động
    const activeReminders = checkReminders();
    if (activeReminders.length > 0) {
        const reminderText = activeReminders.map(r => r.text).join(", ");
        speak(`${getUserName()} có lời nhắc: ${reminderText}`);
        
        // Đánh dấu lời nhắc là đã hoàn thành
        activeReminders.forEach(r => {
            const reminders = JSON.parse(localStorage.getItem('brain_reminders')) || [];
            const updatedReminders = reminders.map(rem => rem.id === r.id ? {...rem, completed: true} : rem);
            localStorage.setItem('brain_reminders', JSON.stringify(updatedReminders));
        });
    }

    // 1. Greetings
    if (intent === 'greeting') {
        const greetings = [
            `Xin chào! ${getAssistantName(true)} có thể giúp gì cho ${getUserName()} hôm nay?`,
            `Chào ${getUserName()}! ${getUserName()} muốn ${getAssistantName()} giúp gì không?`,
            `Xin chào! ${getAssistantName(true)} ở đây để hỗ trợ ${getUserName()}.`,
            `Chào buổi sáng! ${getUserName()} cần ${getAssistantName()} làm gì?`,
            `Chào ${getUserName()}! ${getUserName()} muốn nói chuyện về điều gì?`,
            `Chào mừng ${getUserName()}! ${getAssistantName(true)} đã sẵn sàng hỗ trợ.`
        ];

        // Customize greeting based on user sentiment
        if (sentiment === 'very_positive') {
            greetings.unshift(`Chào ${getUserName()}! ${getAssistantName(true)} rất vui khi thấy ${getUserName()} đang hạnh phúc!`);
        } else if (sentiment === 'negative' || sentiment === 'very_negative') {
            greetings.unshift(`Chào ${getUserName()}! ${getAssistantName(true)} hy vọng có thể giúp ${getUserName()} cảm thấy tốt hơn hôm nay.`);
        }

        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        speak(randomGreeting);
    }
    // 2. Time inquiry
    else if (intent === 'time') {
        const now = new Date();
        const time = now.getHours() + " giờ " + now.getMinutes() + " phút " + now.getSeconds() + " giây";
        const dayOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][now.getDay()];
        const greetingTime = now.getHours() < 12 ? "Buổi sáng tốt lành" : 
                           now.getHours() < 18 ? "Buổi chiều tốt lành" : "Buổi tối tốt lành";
        speak(`${greetingTime}! Bây giờ là ${time}, ngày ${dayOfWeek}, ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`);
    }
    // 3. Hỏi ngày
    else if (intent === 'date') {
        const now = new Date();
        const dayOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][now.getDay()];
        const date = `${dayOfWeek}, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
        const season = now.getMonth() < 3 ? "mùa xuân" : now.getMonth() < 6 ? "mùa hạ" : 
                      now.getMonth() < 9 ? "mùa thu" : "mùa đông";
        speak(`Hôm nay là ${date}, đang là ${season}.`);
    }
    // 4. Dự báo thời tiết (Sử dụng Open-Meteo API)
    else if (intent === 'weather') {
        speak("Đang kiểm tra thời tiết...");

        // Danh sách tọa độ các tỉnh thành Việt Nam (và một số thành phố lớn/địa điểm du lịch)
        const provinces = {
            "an giang": { lat: 10.3717, lon: 105.4323, name: "An Giang" },
            "bà rịa": { lat: 10.4963, lon: 107.1685, name: "Bà Rịa - Vũng Tàu" },
            "vũng tàu": { lat: 10.3460, lon: 107.0843, name: "Bà Rịa - Vũng Tàu" },
            "bắc giang": { lat: 21.2731, lon: 106.1946, name: "Bắc Giang" },
            "bắc kạn": { lat: 22.1470, lon: 105.8348, name: "Bắc Kạn" },
            "bạc liêu": { lat: 9.2941, lon: 105.7278, name: "Bạc Liêu" },
            "bắc ninh": { lat: 21.1861, lon: 106.0763, name: "Bắc Ninh" },
            "bến tre": { lat: 10.2431, lon: 106.3755, name: "Bến Tre" },
            "bình định": { lat: 13.7820, lon: 109.2192, name: "Bình Định" },
            "quy nhơn": { lat: 13.7820, lon: 109.2192, name: "Bình Định" },
            "bình dương": { lat: 11.1606, lon: 106.6693, name: "Bình Dương" },
            "bình phước": { lat: 11.7511, lon: 106.9098, name: "Bình Phước" },
            "bình thuận": { lat: 11.0907, lon: 108.0263, name: "Bình Thuận" },
            "phan thiết": { lat: 10.9276, lon: 108.0988, name: "Bình Thuận" },
            "cà mau": { lat: 9.1769, lon: 105.1524, name: "Cà Mau" },
            "cần thơ": { lat: 10.0452, lon: 105.7469, name: "Cần Thơ" },
            "cao bằng": { lat: 22.6667, lon: 106.2500, name: "Cao Bằng" },
            "đà nẵng": { lat: 16.0544, lon: 108.2022, name: "Đà Nẵng" },
            "đắk lắk": { lat: 12.6667, lon: 108.0500, name: "Đắk Lắk" },
            "buôn ma thuột": { lat: 12.6667, lon: 108.0500, name: "Đắk Lắk" },
            "đắk nông": { lat: 12.0000, lon: 107.6833, name: "Đắk Nông" },
            "điện biên": { lat: 21.3833, lon: 103.0167, name: "Điện Biên" },
            "đồng nai": { lat: 10.9423, lon: 106.8243, name: "Đồng Nai" },
            "biên hòa": { lat: 10.9423, lon: 106.8243, name: "Đồng Nai" },
            "đồng tháp": { lat: 10.4667, lon: 105.6333, name: "Đồng Tháp" },
            "gia lai": { lat: 13.9833, lon: 108.0000, name: "Gia Lai" },
            "pleiku": { lat: 13.9833, lon: 108.0000, name: "Gia Lai" },
            "hà giang": { lat: 22.8233, lon: 104.9836, name: "Hà Giang" },
            "hà nam": { lat: 20.5453, lon: 105.9122, name: "Hà Nam" },
            "hà nội": { lat: 21.0285, lon: 105.8542, name: "Hà Nội" },
            "hà tĩnh": { lat: 18.3427, lon: 105.9058, name: "Hà Tĩnh" },
            "hải dương": { lat: 20.9394, lon: 106.3164, name: "Hải Dương" },
            "hải phòng": { lat: 20.8449, lon: 106.6881, name: "Hải Phòng" },
            "hậu giang": { lat: 9.7833, lon: 105.4667, name: "Hậu Giang" },
            "hòa bình": { lat: 20.8133, lon: 105.3383, name: "Hòa Bình" },
            "hưng yên": { lat: 20.6464, lon: 106.0511, name: "Hưng Yên" },
            "khánh hòa": { lat: 12.2388, lon: 109.1967, name: "Khánh Hòa" },
            "nha trang": { lat: 12.2388, lon: 109.1967, name: "Khánh Hòa" },
            "kiên giang": { lat: 10.0133, lon: 105.0809, name: "Kiên Giang" },
            "rạch giá": { lat: 10.0133, lon: 105.0809, name: "Kiên Giang" },
            "phú quốc": { lat: 10.2899, lon: 103.9840, name: "Phú Quốc" },
            "kon tum": { lat: 14.3500, lon: 108.0000, name: "Kon Tum" },
            "lai châu": { lat: 22.3958, lon: 103.4606, name: "Lai Châu" },
            "lâm đồng": { lat: 11.9404, lon: 108.4583, name: "Lâm Đồng" },
            "đà lạt": { lat: 11.9404, lon: 108.4583, name: "Lâm Đồng" },
            "lạng sơn": { lat: 21.8533, lon: 106.7614, name: "Lạng Sơn" },
            "lào cai": { lat: 22.4856, lon: 103.9707, name: "Lào Cai" },
            "sapa": { lat: 22.3364, lon: 103.8438, name: "Sapa" },
            "long an": { lat: 10.5375, lon: 106.4142, name: "Long An" },
            "nam định": { lat: 20.4200, lon: 106.1683, name: "Nam Định" },
            "nghệ an": { lat: 19.2342, lon: 104.8878, name: "Nghệ An" },
            "vinh": { lat: 18.6733, lon: 105.6872, name: "Nghệ An" },
            "ninh bình": { lat: 20.2539, lon: 105.9750, name: "Ninh Bình" },
            "ninh thuận": { lat: 11.5650, lon: 108.9883, name: "Ninh Thuận" },
            "phan rang": { lat: 11.5650, lon: 108.9883, name: "Ninh Thuận" },
            "phú thọ": { lat: 21.3167, lon: 105.1167, name: "Phú Thọ" },
            "phú yên": { lat: 13.0883, lon: 109.3106, name: "Phú Yên" },
            "tuy hòa": { lat: 13.0883, lon: 109.3106, name: "Phú Yên" },
            "quảng bình": { lat: 17.4833, lon: 106.6000, name: "Quảng Bình" },
            "đồng hới": { lat: 17.4833, lon: 106.6000, name: "Quảng Bình" },
            "quảng nam": { lat: 15.5667, lon: 107.9833, name: "Quảng Nam" },
            "hội an": { lat: 15.8801, lon: 108.3380, name: "Hội An" },
            "quảng ngãi": { lat: 15.1205, lon: 108.7923, name: "Quảng Ngãi" },
            "quảng ninh": { lat: 20.9500, lon: 107.0833, name: "Quảng Ninh" },
            "hạ long": { lat: 20.9500, lon: 107.0833, name: "Hạ Long" },
            "quảng trị": { lat: 16.7500, lon: 107.0000, name: "Quảng Trị" },
            "sóc trăng": { lat: 9.6033, lon: 105.9722, name: "Sóc Trăng" },
            "sơn la": { lat: 21.3269, lon: 103.9186, name: "Sơn La" },
            "tây ninh": { lat: 11.3108, lon: 106.0958, name: "Tây Ninh" },
            "thái bình": { lat: 20.4461, lon: 106.3364, name: "Thái Bình" },
            "thái nguyên": { lat: 21.5942, lon: 105.8481, name: "Thái Nguyên" },
            "thanh hóa": { lat: 19.8075, lon: 105.7764, name: "Thanh Hóa" },
            "huế": { lat: 16.4637, lon: 107.5909, name: "Thừa Thiên Huế" },
            "thừa thiên huế": { lat: 16.4637, lon: 107.5909, name: "Thừa Thiên Huế" },
            "tiền giang": { lat: 10.3500, lon: 106.3500, name: "Tiền Giang" },
            "mỹ tho": { lat: 10.3500, lon: 106.3500, name: "Tiền Giang" },
            "hồ chí minh": { lat: 10.8231, lon: 106.6297, name: "TP. Hồ Chí Minh" },
            "sài gòn": { lat: 10.8231, lon: 106.6297, name: "TP. Hồ Chí Minh" },
            "trà vinh": { lat: 9.9347, lon: 106.3453, name: "Trà Vinh" },
            "tuyên quang": { lat: 21.8233, lon: 105.2167, name: "Tuyên Quang" },
            "vĩnh long": { lat: 10.2542, lon: 105.9722, name: "Vĩnh Long" },
            "vĩnh phúc": { lat: 21.3089, lon: 105.6044, name: "Vĩnh Phúc" },
            "yên bái": { lat: 21.7167, lon: 104.8667, name: "Yên Bái" }
        };

        // Tọa độ mặc định là Kiên Giang
        let lat = 10.0133, lon = 105.0809, loc = "Kiên Giang";

        // Tìm kiếm địa điểm trong câu lệnh
        for (const [key, data] of Object.entries(provinces)) {
            if (checkCmd(cmd, [key])) {
                lat = data.lat;
                lon = data.lon;
                loc = data.name;
                break; // Ưu tiên tìm thấy đầu tiên
            }
        }

        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`)
            .then(res => res.json())
            .then(data => {
                const current = data.current;
                const temp = current.temperature_2m;
                const code = current.weather_code;
                const humidity = current.relative_humidity_2m;
                const wind = current.wind_speed_10m;

                let desc = "trời quang đãng";
                let icon = '<i class="fa-solid fa-sun" style="color: #f1c40f;"></i>'; // Mặc định nắng

                if (code >= 1 && code <= 3) { desc = "có mây"; icon = '<i class="fa-solid fa-cloud-sun" style="color: #bdc3c7;"></i>'; }
                else if (code >= 45 && code <= 48) { desc = "có sương mù"; icon = '<i class="fa-solid fa-smog" style="color: #95a5a6;"></i>'; }
                else if (code >= 51 && code <= 67) { desc = "có mưa nhỏ"; icon = '<i class="fa-solid fa-cloud-rain" style="color: #3498db;"></i>'; }
                else if (code >= 71 && code <= 77) { desc = "có tuyết"; icon = '<i class="fa-solid fa-snowflake" style="color: #ecf0f1;"></i>'; }
                else if (code >= 80 && code <= 82) { desc = "có mưa rào"; icon = '<i class="fa-solid fa-cloud-showers-heavy" style="color: #2980b9;"></i>'; }
                else if (code >= 95) { desc = "có dông"; icon = '<i class="fa-solid fa-bolt" style="color: #f39c12;"></i>'; }

                const speech = `Thời tiết tại ${loc} hiện tại khoảng ${temp} độ C, ${desc}. Độ ẩm ${humidity}%, gió ${wind} km/h.`;
                const display = `<div style="display: flex; align-items: center; gap: 15px;">
                    <div style="font-size: 3rem;">${icon}</div>
                    <div>
                        <div style="font-size: 1.5rem; font-weight: bold;">${temp}°C</div>
                        <div>${desc}</div>
                        <div style="font-size: 0.9rem; opacity: 0.8;">💧 ${humidity}%  💨 ${wind} km/h</div>
                    </div>
                </div>`;

                speak(speech, display);
            })
            .catch(() => speak(`Xin lỗi, ${getAssistantName()} không lấy được thông tin thời tiết lúc này.`));
    }
    // 5. Phát nhạc Youtube (Embed trực tiếp)
    else if (intent === 'music') {
        const match = cmd.match(/(?:phát|phat|nghe|xem|mở|mo)\s+(?:bài|bai|nhạc|nhac|video|phim)\s+(.+)/i);
        let query = match ? match[1].trim() : cmd.replace(/(?:phát|phat|nghe|xem|mở|mo)\s+(?:bài|bai|nhạc|nhac|video|phim)/i, '').trim();

        // Loại bỏ các từ thừa như "trên youtube"
        query = query.replace(/(?:trên|tren|từ|tu|ở|o)\s+youtube/i, '').trim();

        if (query) {
             const embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`;
             const html = `<div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 10px; margin-top: 10px;">
                <iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>`;
            speak(`Đang phát bài "${query}"`, html);
        } else {
            speak(`${getUserName()} muốn nghe bài gì?`);
        }
    }
    // 6. Dịch thuật (Tiếng Việt -> Tiếng Anh)
    else if (intent === 'translation' && /(?:dịch|dich).*(?:sang|thành|qua).*(?:anh|english)/i.test(cmd)) {
        let match = null;
        // Cú pháp 1: Dịch [text] sang tiếng Anh
        match = cmd.match(/(?:dịch|dich)\s+(.+)\s+(?:sang|thành|qua).*(?:anh|english)/i);
        // Cú pháp 2: Dịch sang tiếng Anh [text]
        if (!match) match = cmd.match(/(?:dịch|dich).*(?:sang|thành|qua).*(?:anh|english)\s+(.+)/i);
        // Cú pháp 3: Tiếng Anh của [text] là gì
        if (!match) match = cmd.match(/(?:tiếng|tieng).*(?:anh|english).*(?:của|cua)\s+(.+)/i);

        if (match && match[1]) {
            const query = match[1].trim();
            speak(`Đang dịch "${query}" sang tiếng Anh...`);
            fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=vi|en`)
                .then(res => res.json())
                .then(data => speak(data.responseData.translatedText))
                .catch(() => speak(`Xin lỗi, ${getAssistantName()} không kết nối được dịch vụ dịch thuật.`));
        } else {
            speak(`${getUserName()} muốn dịch từ gì?`);
        }
    }
    // 7. Dịch thuật (Tiếng Anh -> Tiếng Việt)
    else if (intent === 'translation' && /(?:dịch|dich).*(?:sang|thành|qua).*(?:việt|viet)/i.test(cmd)) {
        let match = null;
        // Cú pháp 1: Dịch [text] sang tiếng Việt
        match = cmd.match(/(?:dịch|dich)\s+(.+)\s+(?:sang|thành|qua).*(?:việt|viet)/i);
        // Cú pháp 2: Dịch sang tiếng Việt [text]
        if (!match) match = cmd.match(/(?:dịch|dich).*(?:sang|thành|qua).*(?:việt|viet)\s+(.+)/i);
        // Cú pháp 3: Nghĩa của [text] là gì
        if (!match) match = cmd.match(/(?:nghĩa|nghia).*(?:của|cua)\s+(.+)/i);

        if (match && match[1]) {
            const query = match[1].trim();
            speak(`Đang dịch "${query}" sang tiếng Việt...`);
            fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=en|vi`)
                .then(res => res.json())
                .then(data => speak(data.responseData.translatedText))
                .catch(() => speak(`Xin lỗi, ${getAssistantName()} không kết nối được dịch vụ dịch thuật.`));
        } else {
            speak(`${getUserName()} muốn dịch từ gì?`);
        }
    }
    // 8. Tìm kiếm Google
    else if (intent === 'search') {
        // Tách từ khóa thông minh (hỗ trợ cả không dấu)
        let query = cmd;
        // Thử xóa các prefix phổ biến
        const prefixes = ['tìm kiếm', 'tim kiem', 'tìm', 'tim', 'google', 'tìm giúp'];
        for (const prefix of prefixes) {
            if (cmd.toLowerCase().startsWith(prefix)) {
                query = cmd.substring(prefix.length).trim();
                break;
            }
        }
        // Fallback regex nếu từ khóa nằm giữa câu
        if (query === cmd) {
             query = cmd.replace(/^(.*?)(tìm kiếm|tìm|tim kiem|tim|google|tìm giúp)/i, '').trim();
        }

        if (query) {
            speak("Đang tìm kiếm " + query);
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        } else {
            speak(`${getUserName()} muốn tìm gì?`);
        }
    }
    // 9. Tính toán đơn giản
    else if (intent === 'calculation') {
        const match = cmd.match(/(?:tính|tinh)\s+(.+)/i);
        let expr = match ? match[1].toLowerCase().trim() : cmd.replace(/(?:tính|tinh)/i, '').trim();

        // Thay thế từ ngữ thành toán tử
        expr = expr.replace(/cộng|cong|thêm/g, '+')
                   .replace(/trừ|tru|bớt/g, '-')
                   .replace(/nhân|nhan|x/g, '*')
                   .replace(/chia|trên/g, '/')
                   .replace(/phẩy/g, '.')
                   .replace(/\s+/g, '');

        // Chỉ cho phép các ký tự an toàn
        if (/^[0-9+\-*/.()\s]+$/.test(expr)) {
            try {
                const result = eval(expr);
                speak(`Kết quả là ${result}`);
            } catch (e) {
                speak(`${getAssistantName(true)} không tính được phép tính này.`);
            }
        } else {
            speak("Biểu thức không hợp lệ.");
        }
    }
    // 10. Tra cứu Wikipedia
    else if (intent === 'wikipedia') {
        const match = cmd.match(/(?:là gì|la gi|ai là|ai la|thông tin về|thong tin ve)\s+(.+)/i);
        const query = match ? match[1].trim() : cmd.replace(/(?:là gì|la gi|ai là|ai la|thông tin về|thong tin ve)/i, '').trim();

        speak(`Đang tra cứu "${query}" trên Wikipedia...`);

        // Bước 1: Tìm kiếm tiêu đề chính xác bằng Search API
        fetch(`https://vi.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=${encodeURIComponent(query)}&limit=3`)
            .then(res => res.json())
            .then(searchData => {
                if (searchData[1] && searchData[1].length > 0) {
                    const bestTitle = searchData[1][0];
                    // Lưu lại các bài viết liên quan (nếu có)
                    const related = {
                        titles: searchData[1].slice(1),
                        urls: searchData[3].slice(1)
                    };

                    return fetch(`https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`)
                        .then(res => res.json())
                        .then(data => ({ data, related }));
                } else {
                    throw new Error("Not found");
                }
            })
            .then(({ data, related }) => {
                if (data.extract) {
                    // Tạo HTML cho các bài viết liên quan
                    let relatedHtml = '';
                    if (related.titles.length > 0) {
                        relatedHtml = '<div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1); font-size:0.9em;"><b>Có thể bạn quan tâm:</b><ul style="margin:5px 0 0 20px; padding:0;">';
                        related.titles.forEach((title, index) => {
                            relatedHtml += `<li style="margin-bottom:4px;"><a href="${related.urls[index]}" target="_blank" style="color:var(--primary, #2962ff); text-decoration:none;">${title}</a></li>`;
                        });
                        relatedHtml += '</ul></div>';
                    }

                    const fullLink = (data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page) || `https://vi.wikipedia.org/wiki/${encodeURIComponent(data.title)}`;

                    speak(data.extract, `<div style="display:flex; flex-direction:column;">
                        <div style="display:flex; gap:15px; align-items:start;">
                            ${data.thumbnail ? `<img src="${data.thumbnail.source}" style="width:100px; border-radius:8px; object-fit:cover;">` : ''}
                            <div style="flex:1;">
                                <b style="font-size:1.1em;">${data.title}</b><br>
                                <span style="font-size:0.95em; opacity:0.9;">${data.extract}</span>
                                <br>
                                <a href="${fullLink}" target="_blank" style="display:inline-block; margin-top:8px; color:var(--primary, #2962ff); font-weight:600; text-decoration:none;">Đọc chi tiết <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                            </div>
                        </div>
                        ${relatedHtml}
                    </div>`);
                } else {
                    speak(`${getAssistantName(true)} không tìm thấy thông tin chi tiết.`);
                }
            })
            .catch(() => speak(`${getAssistantName(true)} không tìm thấy thông tin nào trên Wikipedia cho từ khóa này.`));
    }
    // 11. Jokes
    else if (intent === 'joke') {
        const jokes = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "I told my wife she was drawing her eyebrows too high. She looked surprised.",
            "Tại sao trứng không kể chuyện cười? Vì chúng sẽ làm nhau... nứt bụng cười.",
            "What do you call a fake noodle? An impasta!",
            "How does a penguin build its house? Igloos it together!",
            "Why did the scarecrow win an award? He was outstanding in his field!"
        ];
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

        speak(randomJoke, null, () => {
            const audio = new Audio('src/media/man-giggling-02.mp3');
            audio.play().catch(e => console.log("Could not play sound: " + e));
        });
    }
    // 12. Open websites
    else if (intent === 'web') {
        if (checkCmd(cmd, ['open google', 'go to google', 'launch google'])) {
            speak("Đang mở Google");
            window.open('https://google.com', '_blank');
        }
        else if (checkCmd(cmd, ['open youtube', 'go to youtube', 'launch youtube'])) {
            speak("Đang mở YouTube");
            window.open('https://youtube.com', '_blank');
        }
        else if (checkCmd(cmd, ['open music', 'launch music', 'music pro'])) {
            speak("Đang mở ứng dụng âm nhạc");
            window.location.href = 'MusicPro.com/src/index.html'; // Link to your music app
        }
    }
    // 13. Open social media apps
    else if (intent === 'social') {
        if (checkCmd(cmd, ['open facebook', 'go to facebook', 'launch facebook'])) {
            speak("Đang mở Facebook");

            // Use direct scheme to avoid being redirected to Play Store
            // If app exists -> Open app. If not -> Open web after 1.5s.
            setTimeout(() => {
                window.location.href = "https://facebook.com";
            }, 1500);
            window.location.href = "fb://feed";
        }
        else if (checkCmd(cmd, ['open twitter', 'go to twitter', 'launch twitter'])) {
            speak("Đang mở Twitter");

            // Use direct scheme
            setTimeout(() => {
                window.location.href = "https://twitter.com";
            }, 1500);
            window.location.href = "twitter://";
        }
    }
    // 14. Open calculator
    else if (intent === 'calculator') {
        speak("Đang mở ứng dụng máy tính");

        // Check for Samsung device to use specific package
        if (/samsung|sm-/i.test(navigator.userAgent)) {
            window.location.href = "intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.sec.android.app.popupcalculator;end";
        } else {
            window.location.href = "intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end";
        }
    }
    // 15. Coin flip (Random)
    else if (intent === 'coin') {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        speak(`Kết quả tung đồng xu: ${result}`);
    }
    // 16. Battery check (Battery API)
    else if (intent === 'battery') {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                const level = Math.round(battery.level * 100);
                const charging = battery.charging ? "đang sạc" : "không sạc";
                speak(`Mức pin hiện tại là ${level}%, ${charging}.`);
            });
        } else {
            speak("Thiết bị này không hỗ trợ kiểm tra mức pin.");
        }
    }
    // 17. Change background color
    else if (intent === 'color') {
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        document.body.style.backgroundColor = randomColor;
        speak("Màu nền đã được thay đổi");
    }
    // 18. Repeat request
    else if (intent === 'repeat') {
        const lastResponse = localStorage.getItem('brain_last_response');
        if (lastResponse) {
            _speak(lastResponse); // Repeat the last response (using original _speak to avoid overwriting)
        } else {
            speak(`${getAssistantName(true)} chưa nói gì cả.`);
        }
    }
    // 19. Goodbye
    else if (intent === 'goodbye') {
        speak(`Tạm biệt ${getUserName()}! Hẹn gặp lại sau.`);
    }
    // 20. Đặt lời nhắc
    else if (intent === 'reminder') {
        const match = cmd.match(/(?:nhắc tôi|nhac toi|nhắc|nhac)\s+(.+?)\s+(?:vào|vao|lúc|luc)\s+(\d+)\s*(?:giờ|gio|h|:)?(\d*)/i);
        if (match) {
            const task = match[1].trim();
            const hour = parseInt(match[2]);
            const minute = match[3] ? parseInt(match[3]) : 0;
            
            const now = new Date();
            const reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
            
            // Nếu thời gian đã qua hôm nay, đặt cho ngày mai
            if (reminderTime <= now) {
                reminderTime.setDate(reminderTime.getDate() + 1);
            }
            
            const reminder = {
                id: Date.now(),
                text: task,
                time: reminderTime.toISOString(),
                completed: false
            };
            
            saveReminder(reminder);
            speak(`${getAssistantName(true)} sẽ nhắc ${getUserName()} "${task}" vào lúc ${hour}:${minute.toString().padStart(2, '0')} ngày mai.`);
        } else {
            speak(`${getUserName()} muốn ${getAssistantName()} nhắc về điều gì và vào thời gian nào?`);
        }
    }
    // 21. News
    else if (intent === 'news') {
        speak("Đang tải tin tức mới nhất...");
        window.open('https://www.bbc.com/news', '_blank');
    }
    // 22. Food
    else if (intent === 'food') {
        const foodSuggestions = [
            `${getUserName()} có thể thử pizza - một món ăn Ý phổ biến được yêu thích trên toàn thế giới.`,
            "Salad là một lựa chọn lành mạnh, tươi mát và nhẹ nhàng cho bất kỳ thời điểm nào trong ngày.",
            "Nếu bạn đang tìm thứ gì đó nhanh chóng, một chiếc bánh sandwich có thể là lựa chọn hoàn hảo.",
            "Súp là một bữa ăn ấm áp, đặc biệt tuyệt vời vào những ngày lạnh giá."
        ];
        const suggestion = foodSuggestions[Math.floor(Math.random() * foodSuggestions.length)];
        speak(suggestion);
    }
    // 23. Travel
    else if (intent === 'travel') {
        const travelSuggestions = [
            `Có nhiều điểm du lịch đẹp như Paris, Tokyo, New York và Sydney. ${getUserName()} có thể cân nhắc các tour trong nước hoặc quốc tế tùy theo sở thích của mình.`,
            `${getUserName()} có thể cân nhắc các tour trong nước hoặc quốc tế tùy theo sở thích của mình.`,
            `Du lịch sinh thái đang trở nên phổ biến, ${getUserName()} có thể ghé thăm các khu rừng, núi non hoặc những hồ nước trong lành.`
        ];
        const suggestion = travelSuggestions[Math.floor(Math.random() * travelSuggestions.length)];
        speak(suggestion);
    }
    // 24. Health
    else if (intent === 'health') {
        const healthTips = [
            "Uống đủ nước mỗi ngày (khoảng 2 lít) để duy trì sức khỏe tốt.",
            "Ngủ 7-8 tiếng mỗi đêm để cơ thể phục hồi và tái tạo năng lượng.",
            "Tập thể dục đều đặn mỗi ngày, thậm chí chỉ là đi bộ 30 phút.",
            "Ăn nhiều rau củ và trái cây để bổ sung vitamin và chất xơ."
        ];
        const tip = healthTips[Math.floor(Math.random() * healthTips.length)];
        speak(tip);
    }
    // 25. Explain concepts (Knowledge)
    else if (intent === 'knowledge') {
        // Search in knowledge base
        const knowledgeResult = searchKnowledge(cmd);
        if (knowledgeResult) {
            speak(`Regarding ${knowledgeResult.key}: ${knowledgeResult.value}`);
        } else {
            // If not found, ask user what they want to know
            const topic = cmd.replace(/(?:explain|information about|about)/i, '').trim();
            if (topic) {
                const explanation = explainComplexTopic(topic);
                speak(explanation);
            } else {
                speak(`${getUserName()} muốn ${getAssistantName()} giải thích điều gì? ${getAssistantName(true)} có thể giải thích nhiều khái niệm trong khoa học, công nghệ, lịch sử, địa lý, toán học, văn học và triết học.`);
            }
        }
    }
    // 26. Advice and recommendations
    else if (intent === 'advice') {
        const topic = cmd.replace(/(?:advice|recommendation|how to|tips on)/i, '').trim();
        if (topic) {
            const advice = giveAdvice(topic);
            speak(advice);
        } else {
            speak(`${getUserName()} muốn tư vấn về điều gì? ${getAssistantName(true)} có thể đưa ra lời khuyên về cuộc sống, học tập, công việc, các mối quan hệ, sức khỏe...`);
        }
    }
    // 27. Tell a story
    else if (intent === 'story') {
        const type = cmd.replace(/(?:tell me a|tell a|story about|story)/i, '').trim();
        if (type) {
            const story = tellStory(type);
            speak(story);
        } else {
            speak(`${getUserName()} muốn nghe loại truyện nào? ${getAssistantName(true)} có thể kể truyện ngụ ngôn, truyện thiếu nhi hoặc truyện đời thường.`);
        }
    }
    // 28. Entertainment and games
    else if (intent === 'game') {
        const type = cmd.replace(/(?:play|game|entertainment)/i, '').trim();
        if (type) {
            const suggestion = suggestEntertainment(type);
            speak(suggestion);
        } else {
            speak(`${getUserName()} muốn chơi gì? ${getAssistantName(true)} có thể gợi ý trò chơi, hoạt động giải trí hoặc học kỹ năng mới.`);
        }
    }
    // 29. Notes
    else if (intent === 'note') {
        const noteContent = cmd.replace(/(?:take note|note|remember|write down)/i, '').trim();
        if (noteContent) {
            const note = {
                id: Date.now(),
                content: noteContent,
                timestamp: new Date().toISOString()
            };
            saveNote(note);
            speak(`Đã lưu ghi chú: "${noteContent}"`);
        } else {
            const notes = getNotes();
            if (notes.length > 0) {
                let noteList = `Dưới đây là ghi chú của ${getUserName()}:\n`;
                notes.forEach((note, index) => {
                    noteList += `${index + 1}. ${note.content}\n`;
                });
                speak(noteList);
            } else {
                speak(`${getUserName()} chưa có ghi chú nào.`);
            }
        }
    }
    // 30. Task management
    else if (intent === 'task') {
        const taskContent = cmd.replace(/(?:task|to do|todo|add task)/i, '').trim();
        if (taskContent) {
            const task = {
                id: Date.now(),
                content: taskContent,
                completed: false,
                timestamp: new Date().toISOString()
            };
            saveTask(task);
            speak(`Đã thêm tác vụ: "${taskContent}"`);
        } else {
            const tasks = getTasks();
            if (tasks.length > 0) {
                let taskList = `Dưới đây là các tác vụ của ${getUserName()}:\n`;
                tasks.forEach((task, index) => {
                    const status = task.completed ? "✓" : "○";
                    taskList += `${status} ${index + 1}. ${task.content}\n`;
                });
                speak(taskList);
            } else {
                speak(`${getUserName()} chưa có tác vụ nào.`);
            }
        }
    }
    // 31. Lịch làm việc (Calendar/Appointments)
    else if (intent === 'calendar' || intent === 'schedule') {
        const appointmentMatch = cmd.match(/(?:đặt lịch|dat lich|lịch hẹn|lich hen)\s+(.+?)\s+(?:vào|vao|lúc|luc)\s+(\d+)\s*(?:giờ|gio|h|:)?(\d*)/i);
        if (appointmentMatch) {
            const event = appointmentMatch[1].trim();
            const hour = parseInt(appointmentMatch[2]);
            const minute = appointmentMatch[3] ? parseInt(appointmentMatch[3]) : 0;
            
            const now = new Date();
            const appointmentTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
            
            // Nếu thời gian đã qua hôm nay, đặt cho ngày mai
            if (appointmentTime <= now) {
                appointmentTime.setDate(appointmentTime.getDate() + 1);
            }
            
            const appointment = {
                id: Date.now(),
                event: event,
                time: appointmentTime.toISOString(),
                completed: false
            };
            
            saveAppointment(appointment);
            speak(`Đã đặt lịch: "${event}" vào lúc ${hour}:${minute.toString().padStart(2, '0')} ngày mai.`);
        } else {
            const appointments = getAppointments();
            if (appointments.length > 0) {
                let appointmentList = `Dưới đây là lịch hẹn của ${getUserName()}:\n`;
                appointments.forEach((appt, index) => {
                    const apptDate = new Date(appt.time);
                    const timeStr = `${apptDate.getHours()}:${apptDate.getMinutes().toString().padStart(2, '0')}`;
                    const dateStr = `${apptDate.getDate()}/${apptDate.getMonth() + 1}`;
                    appointmentList += `${index + 1}. ${appt.event} - ${timeStr}, ${dateStr}\n`;
                });
                speak(appointmentList);
            } else {
                speak(`${getUserName()} chưa có lịch hẹn nào.`);
            }
        }
    }
    // 32. Gửi tin nhắn (Messages)
    else if (intent === 'message') {
        const messageMatch = cmd.match(/(?:nhắn tin|gửi tin|nhan tin|gui tin)\s+(.+?)\s+(cho|to)\s+(.+)/i);
        if (messageMatch) {
            const messageContent = messageMatch[1].trim();
            const recipient = messageMatch[3].trim();
            
            const message = {
                id: Date.now(),
                content: messageContent,
                recipient: recipient,
                timestamp: new Date().toISOString(),
                status: "sent"
            };
            
            saveMessage(message);
            speak(`Đã gửi tin nhắn "${messageContent}" tới ${recipient}.`);
        } else {
            const messages = getMessages();
            if (messages.length > 0) {
                let messageList = "Dưới đây là các tin nhắn gần đây:\n";
                messages.forEach((msg, index) => {
                    messageList += `${index + 1}. "${msg.content}" - ${msg.recipient} (${msg.timestamp})\n`;
                });
                speak(messageList);
            } else {
                speak(`${getUserName()} chưa có tin nhắn nào.`);
            }
        }
    }
    // 33. Calls
    else if (intent === 'call') {
        const callMatch = cmd.match(/(?:call|phone|ring|dial)\s+(.+)/i);
        if (callMatch) {
            const contact = callMatch[1].trim();
            speak(`Đang gọi cho ${contact}...`);
            // In a real environment, this would be the code to make a call
        } else {
            speak(`${getUserName()} muốn gọi cho ai?`);
        }
    }
    // 34. Quản lý liên hệ (Contacts)
    else if (intent === 'contact') {
        const contactMatch = cmd.match(/(?:thêm|them)\s+(.+?)\s+số\s+(.+)/i);
        if (contactMatch) {
            const name = contactMatch[1].trim();
            const phone = contactMatch[2].trim();
            
            const contact = {
                id: Date.now(),
                name: name,
                phone: phone,
                timestamp: new Date().toISOString()
            };
            
            saveContact(contact);
            speak(`Đã thêm liên hệ: ${name} - ${phone}`);
        } else {
            const contacts = getContacts();
            if (contacts.length > 0) {
                let contactList = `Dưới đây là danh sách liên hệ của ${getUserName()}:\n`;
                contacts.forEach((contact, index) => {
                    contactList += `${index + 1}. ${contact.name} - ${contact.phone}\n`;
                });
                speak(contactList);
            } else {
                speak(`${getUserName()} chưa có danh bạ nào.`);
            }
        }
    }
    // 35. Chuyển đổi đơn vị (Conversion)
    else if (intent === 'conversion') {
        const conversionMatch = cmd.match(/(\d+(?:\.\d+)?)\s*(\w+)\s*sang\s*(\w+)/i);
        if (conversionMatch) {
            const value = parseFloat(conversionMatch[1]);
            const fromUnit = conversionMatch[2].toLowerCase();
            const toUnit = conversionMatch[3].toLowerCase();
            
            try {
                const result = convertUnit(value, fromUnit, toUnit);
                speak(`${value} ${fromUnit} equals ${result.toFixed(2)} ${toUnit}`);
            } catch (e) {
                speak(`${getAssistantName(true)} không thể chuyển đổi các đơn vị này. Xin lỗi!`);
            }
        } else {
            speak(`${getUserName()} muốn chuyển đổi đơn vị nào? Ví dụ: '10 km sang m', '32 fahrenheit sang celsius', '5 kg sang pounds'`);
        }
    }
    // 36. Timer/Stopwatch functionality
    else if (intent === 'timer') {
        // Check if user wants to start stopwatch
        if (checkCmd(cmd, ['stopwatch', 'start timer', 'begin timer'])) {
            speak(`Đồng hồ bấm giờ đã được kích hoạt. ${getUserName()} có thể nói 'dừng đồng hồ' để kết thúc.`);
            // In a real implementation, we would start the stopwatch here
        } else {
            speak(`${getUserName()} có thể sử dụng đồng hồ bấm giờ. Nói 'bắt đầu đồng hồ' để bắt đầu hoặc 'dừng đồng hồ' để kết thúc.`);
        }
    }
    // 37. Countdown functionality
    else if (intent === 'countdown') {
        // Check if user wants to start a countdown timer
        const timerMatch = cmd.match(/(?:countdown|set timer|start timer)\s+(\d+)\s*(?:minutes?|mins?|seconds?|secs?|s)/i);
        if (timerMatch) {
            const duration = parseInt(timerMatch[1]);
            if (duration > 0) {
                const unit = cmd.includes('minute') ? 'minutes' : 'seconds';
                speak(`Đặt đếm ngược ${duration} ${unit}. ${getAssistantName(true)} sẽ thông báo khi hết giờ.`);

                // Set the timer
                const delay = cmd.includes('minute') ? duration * 60000 : duration * 1000;
                setTimeout(() => {
                    // Speak notification
                    const synth = window.speechSynthesis;
                    const utterance = new SpeechSynthesisUtterance(`Time's up! ${duration} ${unit} have elapsed.`);
                    synth.speak(utterance);

                    // Show alert as fallback
                    alert(`Time's up! ${duration} ${unit} have elapsed.`);
                }, delay);
            } else {
                speak("Vui lòng đặt thời gian lớn hơn 0.");
            }
        } else {
            speak(`${getUserName()} muốn đặt đếm ngược trong bao lâu? Ví dụ: 'đếm ngược 5 phút', 'đếm ngược 30 giây'.`);
        }
    }
    // 38. Quản lý email
    else if (intent === 'email') {
        const emailMatch = cmd.match(/(?:gửi mail|gui mail|email|soạn email|soan email)\s+(.+?)\s+(cho|to)\s+(.+?)\s+(nội dung|noi dung|content)\s+(.+)/i);
        if (emailMatch) {
            const subject = emailMatch[1].trim();
            const recipient = emailMatch[3].trim();
            const content = emailMatch[5].trim();
            
            const email = {
                id: Date.now(),
                subject: subject,
                recipient: recipient,
                content: content,
                timestamp: new Date().toISOString(),
                status: "sent"
            };
            
            saveEmail(email);
            speak(`Đã gửi email "${subject}" tới ${recipient}.`);
        } else {
            const emails = getEmails();
            if (emails.length > 0) {
                let emailList = "Dưới đây là các email gần đây:\n";
                emails.forEach((email, index) => {
                    emailList += `${index + 1}. "${email.subject}" - ${email.recipient} (${email.timestamp})\n`;
                });
                speak(emailList);
            } else {
                speak(`${getUserName()} chưa có email nào.`);
            }
        }
    }
    // 37. File management
    else if (intent === 'file') {
        const fileMatch = cmd.match(/(?:open file|file|view file)\s+(.+)/i);
        if (fileMatch) {
            const fileName = fileMatch[1].trim();
            speak(`Đang mở file "${fileName}"...`);
            // In a real environment, this would be the code to open a file
        } else if (cmd.match(/(?:save file|create file)/i)) {
            const fileMatch = cmd.match(/(?:save file|create file)\s+(.+)/i);
            if (fileMatch) {
                const fileName = fileMatch[1].trim();
                const file = {
                    id: Date.now(),
                    name: fileName,
                    type: fileName.split('.').pop() || 'unknown',
                    size: '1KB',
                    timestamp: new Date().toISOString()
                };
                saveFile(file);
                speak(`Đã lưu file "${fileName}".`);
            } else {
                speak(`${getUserName()} muốn lưu file nào?`);
            }
        } else if (cmd.match(/(?:delete file|remove file)/i)) {
            const fileMatch = cmd.match(/(?:delete file|remove file)\s+(.+)/i);
            if (fileMatch) {
                const fileName = fileMatch[1].trim();
                speak(`Đã xóa file "${fileName}".`);
                // In a real environment, this would be the code to delete a file
            } else {
                speak(`${getUserName()} muốn xóa file nào?`);
            }
        } else {
            const files = getFiles();
            if (files.length > 0) {
                let fileList = `Dưới đây là các file của ${getUserName()}:\n`;
                files.forEach((file, index) => {
                    fileList += `${index + 1}. ${file.name} - ${file.type} (${file.size})\n`;
                });
                speak(fileList);
            } else {
                speak(`${getUserName()} chưa có file nào.`);
            }
        }
    }
    // 38. Volume control
    else if (intent === 'volume') {
        const volumeMatch = cmd.match(/(?:increase volume|raise volume|turn up|decrease volume|lower volume|turn down|mute|volume|set volume)\s*(\d+)?/i);
        if (volumeMatch) {
            const level = volumeMatch[1] ? parseInt(volumeMatch[1]) : null;
            if (level) {
                if (level >= 0 && level <= 100) {
                    speak(`Âm lượng đã điều chỉnh về ${level}%.`);
                } else {
                    speak("Mức âm lượng phải nằm trong khoảng từ 0 đến 100%.");
                }
            } else {
                if (cmd.match(/increase|raise|up/i)) {
                    speak("Đã tăng âm lượng.");
                } else if (cmd.match(/decrease|lower|down/i)) {
                    speak("Đã giảm âm lượng.");
                } else if (cmd.match(/mute|off/i)) {
                    speak("Đã tắt âm lượng.");
                } else {
                    speak("Hiển thị mức âm lượng hiện tại.");
                }
            }
        } else {
            speak(`${getUserName()} muốn điều chỉnh âm lượng như thế nào? ${getUserName()} có thể nói 'tăng âm lượng', 'giảm âm lượng', hoặc 'tắt tiếng'.`);
        }
    }
    // 39. Brightness control
    else if (intent === 'brightness') {
        const brightnessMatch = cmd.match(/(?:increase brightness|brighten|turn up brightness|decrease brightness|dim|turn down brightness|brightness|set brightness)\s*(\d+)?/i);
        if (brightnessMatch) {
            const level = brightnessMatch[1] ? parseInt(brightnessMatch[1]) : null;
            if (level) {
                if (level >= 0 && level <= 100) {
                    speak(`Độ sáng đã điều chỉnh về ${level}%.`);
                } else {
                    speak("Mức độ sáng phải nằm trong khoảng từ 0 đến 100%.");
                }
            } else {
                if (cmd.match(/increase|brighten|up/i)) {
                    speak("Đã tăng độ sáng.");
                } else if (cmd.match(/decrease|dim|down/i)) {
                    speak("Đã giảm độ sáng.");
                } else {
                    speak("Hiển thị mức độ sáng hiện tại.");
                }
            }
        } else {
            speak(`${getUserName()} muốn điều chỉnh độ sáng như thế nào? ${getUserName()} có thể nói 'tăng độ sáng', 'giảm độ sáng', hoặc hỏi 'độ sáng hiện tại là bao nhiêu'.`);
        }
    }
    // 40. Quản lý cài đặt hệ thống
    else if (checkCmd(cmd, ['cài đặt', 'cai dat', 'settings', 'thiết lập', 'thiet lap'])) {
        if (cmd.match(/(?:đặt|dat)\s+(.+?)\s+là\s+(.+)/i)) {
            const match = cmd.match(/(?:đặt|dat)\s+(.+?)\s+là\s+(.+)/i);
            const settingKey = match[1].trim();
            const settingValue = match[2].trim();
            
            const setting = {
                key: settingKey,
                value: settingValue
            };
            
            saveSetting(setting);
            speak(`Đã đặt ${settingKey} thành ${settingValue}.`);
        } else {
            const settings = getSettings();
            if (Object.keys(settings).length > 0) {
                let settingsList = `Dưới đây là cài đặt của ${getUserName()}:\n`;
                for (const [key, value] of Object.entries(settings)) {
                    settingsList += `- ${key}: ${value}\n`;
                }
                speak(settingsList);
            } else {
                speak(`${getUserName()} chưa có cài đặt nào được cấu hình.`);
            }
        }
    }
    // 41. View learned commands
    else if (checkCmd(cmd, ['commands list', 'learned commands', 'custom commands', 'what have you learned'])) {
        const learned = JSON.parse(localStorage.getItem('brain_learned_commands')) || {};
        const keys = Object.keys(learned);
        if (keys.length === 0) {
            speak(`${getUserName()} chưa dạy ${getAssistantName()} lệnh tùy chỉnh nào.`);
        } else {
            let html = '<div style="text-align: left; margin-top: 10px;"><strong>Learned Commands:</strong><ul style="padding-left: 20px; margin-top: 5px;">';
            keys.forEach(key => {
                html += `<li style="margin-bottom: 5px;">When you say: <b>"${key}"</b> <br> ➔ I respond: "${learned[key]}"</li>`;
            });
            html += '</ul></div>';
            speak(`${getAssistantName(true)} đã học được ${keys.length} lệnh tùy chỉnh.`, html);
        }
    }
    // 42. General conversation with advanced AI
    else {
        // Check learned commands first
        const learned = JSON.parse(localStorage.getItem('brain_learned_commands')) || {};
        let found = false;

        for (const [trigger, response] of Object.entries(learned)) {
            if (checkCmd(cmd, [trigger])) {
                speak(response);
                found = true;
                break;
            }
        }

        if (!found) {
            // If no learned command found, check in knowledge base
            const knowledgeResult = searchKnowledge(cmd);
            if (knowledgeResult) {
                speak(`Regarding ${knowledgeResult.key}: ${knowledgeResult.value}`);
            } else {
                // If not in knowledge, provide intelligent response based on context, emotion and semantics
                const smartResponse = generateAdvancedResponse(intent, context, cmd);
                speak(smartResponse);
            }
        }
    }
    
    // 43. Thêm các tính năng nâng cao (new conditional chain)
    // 43.1. Tính năng kiểm tra thời gian thực
    if (checkCmd(cmd, ['mấy giờ rồi', 'bây giờ là mấy giờ', 'thời gian hiện tại', 'giờ hiện tại', 'xem giờ'])) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateString = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        speak(`Bây giờ là ${timeString}, ngày ${dateString}.`);
    }

    // 43.2. Tính năng đếm số
    else if (checkCmd(cmd, ['đếm từ', 'đếm số từ', 'đếm từ số', 'đếm số']) && /\d+\s+đến\s+\d+/.test(cmd)) {
        const numbers = cmd.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
            const start = parseInt(numbers[0]);
            const end = parseInt(numbers[1]);
            if (start < end && end - start <= 20) { // Giới hạn để không đếm quá nhiều
                const countSequence = [];
                for (let i = start; i <= end; i++) {
                    countSequence.push(i.toString());
                }
                speak(`Đang đếm: ${countSequence.join(', ')}`);
            } else {
                speak(`Vui lòng chọn khoảng số nhỏ hơn để đếm.`);
            }
        }
    }

    // 43.3. Tính năng tạo mật khẩu ngẫu nhiên
    else if (checkCmd(cmd, ['tạo mật khẩu', 'mật khẩu ngẫu nhiên', 'password ngẫu nhiên', 'tạo password'])) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        speak(`Mật khẩu ngẫu nhiên của ${getUserName()} là: ${password}. Vui lòng lưu lại ở nơi an toàn.`);
    }

    // 43.4. Tính năng tạo danh sách ngẫu nhiên
    else if (checkCmd(cmd, ['tung xúc xắc', 'xúc xắc', 'roll dice', 'lắc xúc xắc'])) {
        const diceValue = Math.floor(Math.random() * 6) + 1;
        speak(`${getUserName()} đã tung được ${diceValue} điểm.`);
    }

    // 43.5. Tính năng tạo danh sách ngẫu nhiên
    else if (checkCmd(cmd, ['ngẫu nhiên', 'random', 'chọn ngẫu nhiên']) && cmd.includes('trong số')) {
        const optionsMatch = cmd.match(/(?:trong số|trong các|trong|từ)\s+(.+)/i);
        if (optionsMatch) {
            const optionsText = optionsMatch[1];
            const options = optionsText.split(/[,]|( và )|( với )|( với tư cách )/).map(o => o.trim()).filter(o => o);
            if (options.length > 0) {
                const randomChoice = options[Math.floor(Math.random() * options.length)];
                speak(`Em chọn ngẫu nhiên: ${randomChoice}`);
            }
        }
    }

    // 43.6. Tính năng chuyển đổi đơn vị nhiệt độ
    else if (checkCmd(cmd, ['chuyển đổi nhiệt độ', 'nhiệt độ', 'chuyển độ C sang F', 'chuyển độ F sang C']) && /\d+\s*(?:độ|do|°)?\s*(?:C|F)/i.test(cmd)) {
        const tempMatch = cmd.match(/(\d+(?:\.\d+)?)\s*(?:độ|do|°)?\s*([CF])/i);
        if (tempMatch) {
            const value = parseFloat(tempMatch[1]);
            const unit = tempMatch[2].toUpperCase();
            
            if (unit === 'C') {
                const fahrenheit = (value * 9/5) + 32;
                speak(`${value} độ C bằng ${fahrenheit.toFixed(2)} độ F.`);
            } else if (unit === 'F') {
                const celsius = (value - 32) * 5/9;
                speak(`${value} độ F bằng ${celsius.toFixed(2)} độ C.`);
            }
        }
    }

    // 43.7. Tính năng tạo danh sách đơn giản
    else if (checkCmd(cmd, ['tạo danh sách', 'danh sách mới', 'list mới']) && cmd.includes(':')) {
        const listMatch = cmd.match(/(?:tạo danh sách|danh sách|list)\s+(.+?):\s*(.+)/i);
        if (listMatch) {
            const listName = listMatch[1];
            const items = listMatch[2].split(/[,]|( và )|( với )/).map(i => i.trim()).filter(i => i);
            if (items.length > 0) {
                const listObj = {
                    id: Date.now(),
                    name: listName,
                    items: items,
                    createdAt: new Date().toISOString()
                };
                
                const savedLists = JSON.parse(localStorage.getItem('brain_lists') || '[]');
                savedLists.push(listObj);
                localStorage.setItem('brain_lists', JSON.stringify(savedLists));
                
                speak(`Đã tạo danh sách "${listName}" với các mục: ${items.join(', ')}.`);
            }
        }
    }

    // 43.8. Tính năng xem danh sách đã lưu
    else if (checkCmd(cmd, ['xem danh sách', 'danh sách của tôi', 'list của tôi', 'xem list'])) {
        const savedLists = JSON.parse(localStorage.getItem('brain_lists') || '[]');
        if (savedLists.length > 0) {
            let listsSummary = "Dưới đây là các danh sách của anh iu:\n";
            savedLists.forEach((list, index) => {
                listsSummary += `${index + 1}. ${list.name}: ${list.items.join(', ')}\n`;
            });
            speak(listsSummary);
        } else {
            speak("Anh iu chưa tạo danh sách nào.");
        }
    }

    // 43.9. Tính năng tạo ghi chú nhanh
    else if (checkCmd(cmd, ['ghi chú nhanh', 'ghi nhớ nhanh', 'note nhanh']) && cmd.includes('là:')) {
        const noteMatch = cmd.match(/(?:ghi chú nhanh|ghi nhớ nhanh|note nhanh)\s+(.+?)\s+là:\s*(.+)/i);
        if (noteMatch) {
            const title = noteMatch[1];
            const content = noteMatch[2];
            
            const note = {
                id: Date.now(),
                title: title,
                content: content,
                timestamp: new Date().toISOString()
            };
            
            const savedNotes = JSON.parse(localStorage.getItem('brain_quick_notes') || '[]');
            savedNotes.push(note);
            localStorage.setItem('brain_quick_notes', JSON.stringify(savedNotes));
            
            speak(`Đã ghi chú nhanh "${title}" với nội dung: ${content}`);
        }
    }

    // 43.10. Tính năng xem ghi chú nhanh
    else if (checkCmd(cmd, ['xem ghi chú nhanh', 'ghi chú nhanh của tôi', 'note nhanh'])) {
        const savedNotes = JSON.parse(localStorage.getItem('brain_quick_notes') || '[]');
        if (savedNotes.length > 0) {
            let notesSummary = "Dưới đây là ghi chú nhanh của anh iu:\n";
            savedNotes.forEach((note, index) => {
                notesSummary += `${index + 1}. ${note.title}: ${note.content}\n`;
            });
            speak(notesSummary);
        } else {
            speak("Anh iu chưa có ghi chú nhanh nào.");
        }
    }

    // 43.11. Tính năng tạo lời nhắc đơn giản
    else if (checkCmd(cmd, ['nhắc tôi sau', 'nhắc sau', 'đặt lời nhắc sau']) && /(\d+)\s*(giây|phút|giờ)/.test(cmd)) {
        const timeMatch = cmd.match(/(?:nhắc tôi sau|nhắc sau|đặt lời nhắc sau)\s*(\d+)\s*(giây|phút|giờ|second|minute|hour)\s+(.+)/i);
        if (timeMatch) {
            const amount = parseInt(timeMatch[1]);
            const unit = timeMatch[2];
            const task = timeMatch[3];
            
            let delayMs = amount;
            if (unit.includes('phút') || unit === 'minute') {
                delayMs *= 60000;
            } else if (unit.includes('giờ') || unit === 'hour') {
                delayMs *= 3600000;
            } else {
                delayMs *= 1000; // giây
            }
            
            if (delayMs <= 3600000) { // Giới hạn 1 giờ để tránh quá lâu
                speak(`Em sẽ nhắc anh iu "${task}" sau ${amount} ${unit}.`);
                
                setTimeout(() => {
                    // Trong môi trường thực tế, bạn sẽ cần một cơ chế để hiển thị lời nhắc
                    // ở đây chúng ta sẽ lưu vào localStorage để hiển thị khi người dùng hỏi
                    const reminder = {
                        id: Date.now(),
                        task: task,
                        scheduledAt: new Date().toISOString(),
                        triggered: false
                    };
                    
                    const reminders = JSON.parse(localStorage.getItem('brain_simple_reminders') || '[]');
                    reminders.push(reminder);
                    localStorage.setItem('brain_simple_reminders', JSON.stringify(reminders));
                }, delayMs);
            } else {
                speak("Vui lòng đặt lời nhắc trong vòng 1 giờ.");
            }
        }
    }

    // 43.12. Tính năng xem lời nhắc chưa xử lý
    else if (checkCmd(cmd, ['lời nhắc chưa xử lý', 'lời nhắc chưa đọc', 'xem lời nhắc chưa'])) {
        const reminders = JSON.parse(localStorage.getItem('brain_simple_reminders') || '[]');
        const unprocessed = reminders.filter(r => !r.triggered);
        
        if (unprocessed.length > 0) {
            let remindersText = "Dưới đây là lời nhắc chưa xử lý:\n";
            unprocessed.forEach((rem, index) => {
                remindersText += `${index + 1}. ${rem.task} (lưu lúc: ${new Date(rem.scheduledAt).toLocaleTimeString('vi-VN')})\n`;
            });
            speak(remindersText);
        } else {
            speak("Không có lời nhắc chưa xử lý nào.");
        }
    }

    // 43.13. Tính năng tạo câu nói truyền cảm hứng
    else if (checkCmd(cmd, ['câu nói truyền cảm hứng', 'động lực', 'lời động viên', 'câu nói tích cực', 'inspire me'])) {
        const inspirations = [
            "Hãy tin rằng bạn có thể, vì bạn đã đi được một chặng đường dài để đến được nơi này.",
            "Mỗi ngày là một cơ hội mới để bắt đầu lại và tiến gần hơn tới ước mơ của bạn.",
            "Không có con đường nào dẫn đến hạnh phúc, hạnh phúc chính là con đường.",
            "Đừng chờ đợi cơ hội, hãy tạo ra nó.",
            "Thành công không phải là đích đến, mà là hành trình bạn đi qua mỗi ngày.",
            "Bạn mạnh mẽ hơn bạn nghĩ, và bạn có khả năng vượt qua mọi thử thách.",
            "Mỗi thất bại là một bài học quý giá cho thành công trong tương lai.",
            "Hãy là lý do khiến ai đó mỉm cười ngày hôm nay."
        ];
        
        const randomInspiration = inspirations[Math.floor(Math.random() * inspirations.length)];
        speak(randomInspiration);
    }

    // 43.14. Tính năng chơi trò chơi đoán số
    else if (checkCmd(cmd, ['chơi đoán số', 'trò chơi đoán số', 'đoán số', 'guess number'])) {
        // Trò chơi này sẽ cần trạng thái trò chơi được lưu trữ
        // Tạo một trò chơi mới với số ngẫu nhiên từ 1 đến 100
        const targetNumber = Math.floor(Math.random() * 100) + 1;
        const gameState = {
            game: 'number_guessing',
            target: targetNumber,
            attempts: 0,
            startTime: new Date().toISOString()
        };
        
        localStorage.setItem('brain_current_game', JSON.stringify(gameState));
        speak("Em đã nghĩ đến một số từ 1 đến 100. Hãy đoán xem đó là số nào?");
    }

    // 43.15. Tính năng xử lý trò chơi đoán số
    else if (localStorage.getItem('brain_current_game')) {
        const gameState = JSON.parse(localStorage.getItem('brain_current_game'));
        if (gameState.game === 'number_guessing' && /^\d+$/.test(cmd.trim())) {
            const guess = parseInt(cmd.trim());
            gameState.attempts += 1;
            
            if (guess === gameState.target) {
                speak(`Chúc mừng! Anh iu đã đoán đúng số ${gameState.target} sau ${gameState.attempts} lần thử!`);
                localStorage.removeItem('brain_current_game'); // Kết thúc trò chơi
            } else if (guess < gameState.target) {
                speak(`Số anh iu đoán (${guess}) quá nhỏ. Hãy thử số lớn hơn.`);
            } else {
                speak(`Số anh iu đoán (${guess}) quá lớn. Hãy thử số nhỏ hơn.`);
            }
            
            // Cập nhật số lần thử
            localStorage.setItem('brain_current_game', JSON.stringify(gameState));
        }
    }

    // 43.16. Tính năng xem thời tiết nâng cao
    else if (checkCmd(cmd, ['thời tiết hôm nay', 'dự báo thời tiết', 'thời tiết ngày mai', 'thời tiết Hà Nội', 'thời tiết TP HCM', 'thời tiết Đà Nẵng'])) {
        const locations = {
            'hà nội': 'Hanoi',
            'tp hcm': 'Ho Chi Minh City',
            'sài gòn': 'Ho Chi Minh City',
            'đà nẵng': 'Da Nang',
            'huế': 'Hue',
            'nha trang': 'Nha Trang',
            'cần thơ': 'Can Tho'
        };
        
        let location = 'Hanoi'; // Mặc định
        
        for (const [key, value] of Object.entries(locations)) {
            if (cmd.toLowerCase().includes(key)) {
                location = value;
                break;
            }
        }
        
        speak(`Hiện tại em đang lấy thông tin thời tiết cho ${location} từ hệ thống. Vui lòng chờ trong giây lát.`);
    }

    // 43.17. Tính năng chuyển đổi đơn vị tiền tệ đơn giản
    else if (checkCmd(cmd, ['chuyển đổi tiền', 'đổi tiền', 'quy đổi tiền']) && /(\d+)\s*(?:usd|vnd|eur|jpy|cny)/i.test(cmd) && /sang|to/i.test(cmd)) {
        const amountMatch = cmd.match(/(\d+(?:\.\d+)?)\s*(usd|vnd|eur|jpy|cny)/i);
        const toMatch = cmd.match(/(?:sang|to)\s+(usd|vnd|eur|jpy|cny)/i);
        
        if (amountMatch && toMatch) {
            const amount = parseFloat(amountMatch[1]);
            const fromCurrency = amountMatch[2].toUpperCase();
            const toCurrency = toMatch[1].toUpperCase();
            
            // Tỷ giá đơn giản (chỉ để minh họa)
            const exchangeRates = {
                'USD': {'VND': 23500, 'EUR': 0.85, 'JPY': 110, 'CNY': 6.5},
                'VND': {'USD': 1/23500, 'EUR': 1/27500, 'JPY': 0.25, 'CNY': 1/3600},
                'EUR': {'USD': 1.18, 'VND': 27500, 'JPY': 130, 'CNY': 7.8},
                'JPY': {'USD': 0.0091, 'VND': 4.3, 'EUR': 0.0077, 'CNY': 0.060},
                'CNY': {'USD': 0.15, 'VND': 3600, 'EUR': 0.13, 'JPY': 16.7}
            };
            
            if (exchangeRates[fromCurrency] && exchangeRates[fromCurrency][toCurrency]) {
                const rate = exchangeRates[fromCurrency][toCurrency];
                const result = (amount * rate).toFixed(2);
                speak(`${amount} ${fromCurrency} bằng ${result} ${toCurrency}.`);
            } else {
                speak("Em chưa hỗ trợ chuyển đổi loại tiền tệ này.");
            }
        }
    }

    // 43.18. Tính năng tạo mã QR đơn giản (mô phỏng)
    else if (checkCmd(cmd, ['tạo mã qr', 'qr code', 'mã qr']) && cmd.includes('cho')) {
        const textMatch = cmd.match(/(?:tạo mã qr|mã qr|qr code)\s+(?:cho|for)\s+(.+)/i);
        if (textMatch) {
            const textForQR = textMatch[1];
            speak(`Em đã tạo mã QR cho "${textForQR}". Trong phiên bản đầy đủ, mã QR sẽ được hiển thị trực tiếp trên màn hình.`);
        }
    }

    // 43.19. Tính năng tìm kiếm nâng cao trong lịch sử
    else if (checkCmd(cmd, ['tìm trong lịch sử', 'tìm lại', 'tìm kiếm lịch sử']) && cmd.split(' ').length > 2) {
        // Trong phiên bản đầy đủ, sẽ tìm kiếm trong lịch sử trò chuyện
        const searchTerm = cmd.replace(/tìm trong lịch sử|tìm lại|tìm kiếm lịch sử/i, '').trim();
        speak(`Em đang tìm kiếm "${searchTerm}" trong lịch sử trò chuyện của anh iu. Tính năng này sẽ được hoàn thiện trong phiên bản nâng cao.`);
    }

    // 43.20. Tính năng tạo liên kết rút gọn (mô phỏng)
    else if (checkCmd(cmd, ['rút gọn link', 'ngắn link', 'tạo link rút gọn']) && /https?:\/\//.test(cmd)) {
        const urlMatch = cmd.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
            const originalUrl = urlMatch[1];
            const shortCode = Math.random().toString(36).substring(2, 8);
            const shortenedUrl = `https://short.ly/${shortCode}`;
            speak(`Đã tạo link rút gọn: ${shortenedUrl} từ ${originalUrl}`);
        }
    }

    // 43.21. Tính năng tạo lịch biểu đơn giản
    else if (checkCmd(cmd, ['tạo lịch biểu', 'lập lịch biểu', 'lịch biểu mới']) && cmd.includes('vào') && cmd.includes('giờ')) {
        const scheduleMatch = cmd.match(/(?:tạo|lập)\s+(?:lịch biểu|lịch trình)\s+(.+?)\s+vào\s+(.+?)\s+giờ\s+(.+)/i);
        if (scheduleMatch) {
            const activity = scheduleMatch[1];
            const date = scheduleMatch[2];
            const time = scheduleMatch[3];
            
            const scheduleItem = {
                id: Date.now(),
                activity: activity,
                date: date,
                time: time,
                createdAt: new Date().toISOString()
            };
            
            const savedSchedules = JSON.parse(localStorage.getItem('brain_schedules') || '[]');
            savedSchedules.push(scheduleItem);
            localStorage.setItem('brain_schedules', JSON.stringify(savedSchedules));
            
            speak(`Đã tạo lịch biểu: ${activity} vào ngày ${date} lúc ${time} giờ.`);
        }
    }

    // 43.22. Tính năng xem lịch biểu đã lưu
    else if (checkCmd(cmd, ['xem lịch biểu', 'lịch biểu của tôi', 'lịch trình của tôi'])) {
        const savedSchedules = JSON.parse(localStorage.getItem('brain_schedules') || '[]');
        if (savedSchedules.length > 0) {
            let schedulesSummary = "Dưới đây là lịch biểu của anh iu:\n";
            savedSchedules.forEach((schedule, index) => {
                schedulesSummary += `${index + 1}. ${schedule.activity} - ${schedule.date} lúc ${schedule.time} giờ\n`;
            });
            speak(schedulesSummary);
        } else {
            speak("Anh iu chưa tạo lịch biểu nào.");
        }
    }

    // 43.23. Tính năng tạo đơn vị đo lường chuyển đổi
    else if (checkCmd(cmd, ['chuyển đổi độ dài', 'độ dài', 'cm sang inch', 'inch sang cm', 'm sang km', 'km sang m']) && /(\d+)\s*(cm|mm|m|km|inch|feet)/i.test(cmd)) {
        const lengthMatch = cmd.match(/(\d+(?:\.\d+)?)\s*(cm|mm|m|km|inch|feet|foot)/i);
        const toMatch = cmd.match(/(?:sang|to)\s+(cm|mm|m|km|inch|feet|foot)/i);
        
        if (lengthMatch && toMatch) {
            const value = parseFloat(lengthMatch[1]);
            const fromUnit = lengthMatch[2].toLowerCase();
            const toUnit = toMatch[1].toLowerCase();
            
            const conversionFactors = {
                'cm': {'mm': 10, 'm': 0.01, 'km': 0.00001, 'inch': 0.393701, 'feet': 0.0328084},
                'mm': {'cm': 0.1, 'm': 0.001, 'km': 0.000001, 'inch': 0.0393701, 'feet': 0.00328084},
                'm': {'cm': 100, 'mm': 1000, 'km': 0.001, 'inch': 39.3701, 'feet': 3.28084},
                'km': {'cm': 100000, 'mm': 1000000, 'm': 1000, 'inch': 39370.1, 'feet': 3280.84},
                'inch': {'cm': 2.54, 'mm': 25.4, 'm': 0.0254, 'km': 0.0000254, 'feet': 0.0833333},
                'feet': {'cm': 30.48, 'mm': 304.8, 'm': 0.3048, 'km': 0.0003048, 'inch': 12}
            };
            
            if (conversionFactors[fromUnit] && conversionFactors[fromUnit][toUnit]) {
                const result = value * conversionFactors[fromUnit][toUnit];
                speak(`${value} ${fromUnit} bằng ${result.toFixed(4)} ${toUnit}.`);
            } else {
                speak("Em chưa hỗ trợ chuyển đổi đơn vị này.");
            }
        }
    }

    // 43.24. Tính năng tạo đơn vị khối lượng chuyển đổi
    else if (checkCmd(cmd, ['chuyển đổi khối lượng', 'kg sang gram', 'gram sang kg', 'kg sang pound', 'pound sang kg']) && /(\d+)\s*(kg|gram|g|pound|lbs|ounce)/i.test(cmd)) {
        const weightMatch = cmd.match(/(\d+(?:\.\d+)?)\s*(kg|gram|g|pound|lbs|lb|ounce|oz)/i);
        const toMatch = cmd.match(/(?:sang|to)\s+(kg|gram|g|pound|lbs|lb|ounce|oz)/i);
        
        if (weightMatch && toMatch) {
            const value = parseFloat(weightMatch[1]);
            const fromUnit = weightMatch[2].toLowerCase();
            const toUnit = toMatch[1].toLowerCase();
            
            // Chuẩn hóa tên đơn vị
            const unitMap = {
                'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
                'g': 'g', 'gram': 'g', 'grams': 'g',
                'pound': 'pound', 'pounds': 'pound', 'lbs': 'pound', 'lb': 'pound',
                'ounce': 'ounce', 'ounces': 'ounce', 'oz': 'ounce'
            };
            
            const normalizedFrom = unitMap[fromUnit] || fromUnit;
            const normalizedTo = unitMap[toUnit] || toUnit;
            
            const conversionFactors = {
                'kg': {'g': 1000, 'pound': 2.20462, 'ounce': 35.274},
                'g': {'kg': 0.001, 'pound': 0.00220462, 'ounce': 0.035274},
                'pound': {'kg': 0.453592, 'g': 453.592, 'ounce': 16},
                'ounce': {'kg': 0.0283495, 'g': 28.3495, 'pound': 0.0625}
            };
            
            if (conversionFactors[normalizedFrom] && conversionFactors[normalizedFrom][normalizedTo]) {
                const result = value * conversionFactors[normalizedFrom][normalizedTo];
                speak(`${value} ${normalizedFrom} bằng ${result.toFixed(4)} ${normalizedTo}.`);
            } else {
                speak("Em chưa hỗ trợ chuyển đổi đơn vị khối lượng này.");
            }
        }
    }

    // 43.25. Tính năng tạo câu hỏi trắc nghiệm đơn giản
    else if (checkCmd(cmd, ['tạo câu hỏi trắc nghiệm', 'quiz', 'trắc nghiệm']) && cmd.includes('?') && cmd.includes('A.') && cmd.includes('B.')) {
        // Trong phiên bản đầy đủ, sẽ có hệ thống quiz phức tạp hơn
        speak("Em đã nhận diện được câu hỏi trắc nghiệm của anh iu. Trong phiên bản nâng cao, em sẽ có thể tổ chức các cuộc thi và kiểm tra tương tác.");
    }

    // 43.26. Tính năng tạo bảng cửu chương
    else if (checkCmd(cmd, ['bảng cửu chương', 'cửu chương', 'bang cuu chuong']) && /cửu chương (\d+)/i.test(cmd)) {
        const tableMatch = cmd.match(/(?:bảng|bang)\s+cửu chương\s+(\d+)/i);
        if (tableMatch) {
            const num = parseInt(tableMatch[1]);
            if (num >= 1 && num <= 9) {
                let multiplicationTable = `Bảng cửu chương ${num}:\n`;
                for (let i = 1; i <= 10; i++) {
                    multiplicationTable += `${num} × ${i} = ${num * i}\n`;
                }
                speak(multiplicationTable);
            } else {
                speak("Chỉ hỗ trợ bảng cửu chương từ 1 đến 9.");
            }
        }
    }

    // 43.27. Tính năng tạo mã hóa văn bản đơn giản
    else if (checkCmd(cmd, ['mã hóa văn bản', 'encrypt', 'mã hóa']) && cmd.includes('là:')) {
        const textMatch = cmd.match(/(?:mã hóa văn bản|mã hóa|encrypt)\s+(?:cho|là):\s*(.+)/i);
        if (textMatch) {
            const originalText = textMatch[1];
            // Mã hóa đơn giản bằng cách dịch chuyển ký tự
            let encodedText = '';
            for (let i = 0; i < originalText.length; i++) {
                const char = originalText.charCodeAt(i);
                encodedText += String.fromCharCode(char + 1);
            }
            speak(`Văn bản "${originalText}" đã được mã hóa thành: ${encodedText}`);
        }
    }

    // 43.28. Tính năng giải mã văn bản đơn giản
    else if (checkCmd(cmd, ['giải mã văn bản', 'decrypt', 'giải mã']) && cmd.includes('là:')) {
        const textMatch = cmd.match(/(?:giải mã văn bản|giải mã|decrypt)\s+(?:cho|là):\s*(.+)/i);
        if (textMatch) {
            const encodedText = textMatch[1];
            // Giải mã đơn giản bằng cách dịch chuyển ký tự ngược lại
            let decodedText = '';
            for (let i = 0; i < encodedText.length; i++) {
                const char = encodedText.charCodeAt(i);
                decodedText += String.fromCharCode(char - 1);
            }
            speak(`Văn bản "${encodedText}" đã được giải mã thành: ${decodedText}`);
        }
    }

    // 43.29. Tính năng tạo lịch sử sự kiện
    else if (checkCmd(cmd, ['tạo sự kiện lịch sử', 'lịch sử sự kiện', 'sự kiện lịch sử']) && cmd.includes('vào năm')) {
        const eventMatch = cmd.match(/(?:tạo|thêm)\s+(?:sự kiện|sự kiện lịch sử)\s+(.+?)\s+vào năm\s+(\d+)/i);
        if (eventMatch) {
            const event = eventMatch[1];
            const year = eventMatch[2];
            
            const historicalEvent = {
                id: Date.now(),
                event: event,
                year: year,
                createdAt: new Date().toISOString()
            };
            
            const savedEvents = JSON.parse(localStorage.getItem('brain_history_events') || '[]');
            savedEvents.push(historicalEvent);
            localStorage.setItem('brain_history_events', JSON.stringify(savedEvents));
            
            speak(`Đã thêm sự kiện lịch sử: "${event}" vào năm ${year}.`);
        }
    }

    // 43.30. Tính năng xem sự kiện lịch sử
    else if (checkCmd(cmd, ['xem sự kiện lịch sử', 'sự kiện lịch sử của tôi', 'lịch sử sự kiện'])) {
        const savedEvents = JSON.parse(localStorage.getItem('brain_history_events') || '[]');
        if (savedEvents.length > 0) {
            let eventsSummary = "Dưới đây là các sự kiện lịch sử đã lưu:\n";
            savedEvents.forEach((event, index) => {
                eventsSummary += `${index + 1}. "${event.event}" - Năm ${event.year}\n`;
            });
            speak(eventsSummary);
        } else {
            speak("Anh iu chưa thêm sự kiện lịch sử nào.");
        }
    }

    // 43.31. Tính năng tạo công thức toán học
    else if (checkCmd(cmd, ['công thức toán học', 'công thức hình học', 'công thức toán'])) {
        const mathFormulas = {
            'diện tích hình tròn': 'π × bán kính²',
            'chu vi hình tròn': '2 × π × bán kính',
            'diện tích hình vuông': 'cạnh × cạnh',
            'diện tích hình chữ nhật': 'dài × rộng',
            'diện tích tam giác': '(đáy × chiều cao) ÷ 2',
            'thể tích hình lập phương': 'cạnh³',
            'thể tích hình hộp chữ nhật': 'dài × rộng × cao'
        };
        
        let foundFormula = false;
        for (const [key, formula] of Object.entries(mathFormulas)) {
            if (cmd.toLowerCase().includes(key)) {
                speak(`Công thức tính ${key} là: ${formula}`);
                foundFormula = true;
                break;
            }
        }
        
        if (!foundFormula) {
            speak("Em có thể giúp anh iu với các công thức toán học như: diện tích hình tròn, chu vi hình tròn, diện tích hình vuông, v.v.");
        }
    }

    // 43.32. Tính năng tạo từ đồng nghĩa
    else if (checkCmd(cmd, ['từ đồng nghĩa', 'đồng nghĩa với', 'từ trái nghĩa', 'trái nghĩa với']) && cmd.split(' ').length > 2) {
        const synonyms = {
            'đẹp': ['xinh đẹp', 'tươi tắn', 'xinh xắn', 'tuyệt vời'],
            'xấu': ['kém đẹp', 'tồi tệ', 'kém'],
            'vui': ['hạnh phúc', 'phấn khích', 'vui vẻ', 'hào hứng'],
            'buồn': ['chán nản', 'thất vọng', 'tẻ nhạt'],
            'lạnh': ['mát mẻ', 'rét buốt', 'lạnh lẽo'],
            'nóng': ['ấm áp', 'nhiệt', 'nóng bức']
        };
        
        let foundSynonym = false;
        for (const [word, synList] of Object.entries(synonyms)) {
            if (cmd.toLowerCase().includes(`đồng nghĩa với ${word}`) || cmd.toLowerCase().includes(`từ đồng nghĩa ${word}`)) {
                speak(`Từ đồng nghĩa với "${word}" bao gồm: ${synList.join(', ')}.`);
                foundSynonym = true;
                break;
            }
        }
        
        if (!foundSynonym) {
            speak("Em có thể giúp anh iu tìm từ đồng nghĩa cho nhiều từ khác nhau. Hãy hỏi 'từ đồng nghĩa với [từ cần tìm]'.");
        }
    }

    // 43.33. Tính năng tạo lịch sử sinh học
    else if (checkCmd(cmd, ['sinh học', 'các bộ phận cơ thể', 'cơ thể người'])) {
        const biologyInfo = {
            'tim': 'Cơ quan tuần hoàn máu, bơm máu đến khắp cơ thể',
            'phổi': 'Cơ quan hô hấp, trao đổi khí oxy và carbon dioxide',
            'gan': 'Cơ quan lớn nhất trong cơ thể, tham gia tiêu hóa và lọc độc tố',
            'thận': 'Lọc máu và tạo nước tiểu, duy trì cân bằng điện giải',
            'não': 'Trung tâm điều khiển cơ thể, xử lý thông tin và kiểm soát hành vi'
        };
        
        let foundInfo = false;
        for (const [organ, info] of Object.entries(biologyInfo)) {
            if (cmd.toLowerCase().includes(organ)) {
                speak(`Về ${organ}: ${info}`);
                foundInfo = true;
                break;
            }
        }
        
        if (!foundInfo) {
            speak("Em có thể cung cấp thông tin về các cơ quan trong cơ thể người như tim, phổi, gan, thận, não...");
        }
    }

    // 43.34. Tính năng tạo đơn vị thể tích chuyển đổi
    else if (checkCmd(cmd, ['chuyển đổi thể tích', 'lít sang ml', 'ml sang lít', 'lít sang gallon']) && /(\d+)\s*(lít|ml|gallon|quart|pint)/i.test(cmd)) {
        const volumeMatch = cmd.match(/(\d+(?:\.\d+)?)\s*(lít|ml|gallon|quart|pint|liter|milliliter)/i);
        const toMatch = cmd.match(/(?:sang|to)\s+(lít|ml|gallon|quart|pint|liter|milliliter)/i);
        
        if (volumeMatch && toMatch) {
            const value = parseFloat(volumeMatch[1]);
            const fromUnit = volumeMatch[2].toLowerCase().replace('ít', 'it');
            const toUnit = toMatch[1].toLowerCase().replace('ít', 'it');
            
            // Chuẩn hóa tên đơn vị
            const unitMap = {
                'lít': 'liter', 'liter': 'liter', 'lit': 'liter',
                'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml',
                'gallon': 'gallon', 'gallons': 'gallon',
                'quart': 'quart', 'quarts': 'quart',
                'pint': 'pint', 'pints': 'pint'
            };
            
            const normalizedFrom = unitMap[fromUnit] || fromUnit;
            const normalizedTo = unitMap[toUnit] || toUnit;
            
            const conversionFactors = {
                'liter': {'ml': 1000, 'gallon': 0.264172, 'quart': 1.05669, 'pint': 2.11338},
                'ml': {'liter': 0.001, 'gallon': 0.000264172, 'quart': 0.00105669, 'pint': 0.00211338},
                'gallon': {'liter': 3.78541, 'ml': 3785.41, 'quart': 4, 'pint': 8},
                'quart': {'liter': 0.946353, 'ml': 946.353, 'gallon': 0.25, 'pint': 2},
                'pint': {'liter': 0.473176, 'ml': 473.176, 'gallon': 0.125, 'quart': 0.5}
            };
            
            if (conversionFactors[normalizedFrom] && conversionFactors[normalizedFrom][normalizedTo]) {
                const result = value * conversionFactors[normalizedFrom][normalizedTo];
                speak(`${value} ${normalizedFrom} bằng ${result.toFixed(4)} ${normalizedTo}.`);
            } else {
                speak("Em chưa hỗ trợ chuyển đổi đơn vị thể tích này.");
            }
        }
    }

    // 43.35. Tính năng tạo câu nói danh nhân
    else if (checkCmd(cmd, ['câu nói danh nhân', 'lời nói nổi tiếng', 'danh ngôn', 'trích dẫn nổi tiếng'])) {
        const famousQuotes = [
            "Không có con đường dẫn đến hạnh phúc, hạnh phúc chính là con đường. - Buddha",
            "Cuộc sống là 10% những gì xảy ra với bạn và 90% là cách bạn phản ứng với nó. - Charles R. Swindoll",
            "Điều quan trọng không phải là bạn đứng ở đâu mà là bạn hướng về đâu. - Oliver Wendell Holmes",
            "Hãy là thay đổi mà bạn muốn thấy trong thế giới này. - Mahatma Gandhi",
            "Thành công là khả năng đi từ thất bại này đến thất bại khác mà không hề mất đi sự nhiệt huyết. - Winston Churchill",
            "Bạn chỉ thực sự thất bại khi bạn ngừng cố gắng. - Albert Einstein"
        ];
        
        const randomQuote = famousQuotes[Math.floor(Math.random() * famousQuotes.length)];
        speak(`Dưới đây là một câu nói danh nhân: ${randomQuote}`);
    }

    // 43.36. Tính năng tạo trò chơi oẳn tù tì
    else if (checkCmd(cmd, ['oẳn tù tì', 'kéo búa bao', 'đoán kéo búa bao', 'chơi oẳn tù tì'])) {
        const choices = ['kéo', 'búa', 'bao'];
        const computerChoice = choices[Math.floor(Math.random() * choices.length)];
        
        // Trong phiên bản đầy đủ, sẽ có logic chơi tương tác
        speak(`Em đã chọn ${computerChoice}. Trong phiên bản đầy đủ, chúng ta có thể chơi trò chơi oẳn tù tì tương tác.`);
    }

    // 43.37. Tính năng tạo đơn vị tốc độ chuyển đổi
    else if (checkCmd(cmd, ['chuyển đổi tốc độ', 'km/h sang m/s', 'm/s sang km/h']) && /(\d+)\s*(km\/h|mph|m\/s|ft\/s)/i.test(cmd)) {
        const speedMatch = cmd.match(/(\d+(?:\.\d+)?)\s*(km\/h|mph|m\/s|ft\/s|kmh|kph)/i);
        const toMatch = cmd.match(/(?:sang|to)\s+(km\/h|mph|m\/s|ft\/s|kmh|kph)/i);
        
        if (speedMatch && toMatch) {
            const value = parseFloat(speedMatch[1]);
            const fromUnit = speedMatch[2].toLowerCase().replace('kmh', 'km/h').replace('kph', 'km/h');
            const toUnit = toMatch[1].toLowerCase().replace('kmh', 'km/h').replace('kph', 'km/h');
            
            const conversionFactors = {
                'km/h': {'m/s': 0.277778, 'mph': 0.621371, 'ft/s': 0.911344},
                'm/s': {'km/h': 3.6, 'mph': 2.23694, 'ft/s': 3.28084},
                'mph': {'km/h': 1.60934, 'm/s': 0.44704, 'ft/s': 1.46667},
                'ft/s': {'km/h': 1.09728, 'm/s': 0.3048, 'mph': 0.681818}
            };
            
            if (conversionFactors[fromUnit] && conversionFactors[fromUnit][toUnit]) {
                const result = value * conversionFactors[fromUnit][toUnit];
                speak(`${value} ${fromUnit} bằng ${result.toFixed(4)} ${toUnit}.`);
            } else {
                speak("Em chưa hỗ trợ chuyển đổi đơn vị tốc độ này.");
            }
        }
    }

    // 43.38. Tính năng tạo đơn vị diện tích chuyển đổi
    else if (checkCmd(cmd, ['chuyển đổi diện tích', 'm2 sang km2', 'km2 sang m2', 'm2 sang ha']) && /(\d+)\s*(m2|m²|km2|km²|ha|acre)/i.test(cmd)) {
        const areaMatch = cmd.match(/(\d+(?:\.\d+)?)\s*(m2|m²|km2|km²|ha|acre|hectare)/i);
        const toMatch = cmd.match(/(?:sang|to)\s+(m2|m²|km2|km²|ha|acre|hectare)/i);
        
        if (areaMatch && toMatch) {
            const value = parseFloat(areaMatch[1]);
            const fromUnit = areaMatch[2].toLowerCase().replace('²', '2');
            const toUnit = toMatch[1].toLowerCase().replace('²', '2');
            
            // Chuẩn hóa tên đơn vị
            const unitMap = {
                'm2': 'm2', 'm²': 'm2',
                'km2': 'km2', 'km²': 'km2',
                'ha': 'ha', 'hectare': 'ha',
                'acre': 'acre', 'acres': 'acre'
            };
            
            const normalizedFrom = unitMap[fromUnit] || fromUnit;
            const normalizedTo = unitMap[toUnit] || toUnit;
            
            const conversionFactors = {
                'm2': {'km2': 0.000001, 'ha': 0.0001, 'acre': 0.000247105},
                'km2': {'m2': 1000000, 'ha': 100, 'acre': 247.105},
                'ha': {'m2': 10000, 'km2': 0.01, 'acre': 2.47105},
                'acre': {'m2': 4046.86, 'km2': 0.00404686, 'ha': 0.404686}
            };
            
            if (conversionFactors[normalizedFrom] && conversionFactors[normalizedFrom][normalizedTo]) {
                const result = value * conversionFactors[normalizedFrom][normalizedTo];
                speak(`${value} ${normalizedFrom} bằng ${result.toFixed(4)} ${normalizedTo}.`);
            } else {
                speak("Em chưa hỗ trợ chuyển đổi đơn vị diện tích này.");
            }
        }
    }

    // 43.39. Tính năng tạo lịch sử thế giới
    else if (checkCmd(cmd, ['lịch sử thế giới', 'sự kiện thế giới', 'chiến tranh thế giới'])) {
        const worldHistory = {
            'chiến tranh thế giới thứ hai': 'Diễn ra từ 1939-1945, là cuộc chiến lớn nhất trong lịch sử loài người.',
            'chiến tranh thế giới thứ nhất': 'Diễn ra từ 1914-1918, bắt đầu từ vụ ám sát ở Sarajevo.',
            'cách mạng công nghiệp': 'Bắt đầu từ Anh thế kỷ 18, đánh dấu bước ngoặt từ sản xuất thủ công sang cơ khí hóa.',
            'sự sụp đổ của đế chế La Mã': 'Diễn ra vào thế kỷ 5 sau CN, chấm dứt thời kỳ thống trị của La Mã.',
            'phát minh ra bánh xe': 'Xảy ra khoảng 3500 TCN, là một trong những phát minh quan trọng nhất của nhân loại.'
        };
        
        let foundEvent = false;
        for (const [event, description] of Object.entries(worldHistory)) {
            if (cmd.toLowerCase().includes(event)) {
                speak(`Về ${event}: ${description}`);
                foundEvent = true;
                break;
            }
        }
        
        if (!foundEvent) {
            speak("Em có thể cung cấp thông tin về các sự kiện lịch sử thế giới như chiến tranh thế giới thứ hai, cách mạng công nghiệp, v.v.");
        }
    }

    // 43.40. Tính năng tạo trò chơi ô chữ đơn giản
    else if (checkCmd(cmd, ['trò chơi ô chữ', 'ô chữ', 'chơi ô chữ'])) {
        speak("Trò chơi ô chữ là một trò chơi trí tuệ thú vị. Trong phiên bản đầy đủ, em có thể tổ chức các trò chơi ô chữ tương tác với anh iu.");
    }

    // 43.41. Tính năng tạo đơn vị áp suất chuyển đổi
    else if (checkCmd(cmd, ['chuyển đổi áp suất', 'pa sang bar', 'bar sang psi', 'psi sang pa']) && /(\d+)\s*(pa|bar|psi|atm|torr|mmhg)/i.test(cmd)) {
        const pressureMatch = cmd.match(/(\d+(?:\.\d+)?)\s*(pa|bar|psi|atm|torr|mmhg)/i);
        const toMatch = cmd.match(/(?:sang|to)\s+(pa|bar|psi|atm|torr|mmhg)/i);
        
        if (pressureMatch && toMatch) {
            const value = parseFloat(pressureMatch[1]);
            const fromUnit = pressureMatch[2].toLowerCase();
            const toUnit = toMatch[1].toLowerCase();
            
            const conversionFactors = {
                'pa': {'bar': 0.00001, 'psi': 0.000145038, 'atm': 0.00000986923, 'torr': 0.00750062, 'mmhg': 0.00750062},
                'bar': {'pa': 100000, 'psi': 14.5038, 'atm': 0.986923, 'torr': 750.062, 'mmhg': 750.062},
                'psi': {'pa': 6894.76, 'bar': 0.0689476, 'atm': 0.068046, 'torr': 51.7149, 'mmhg': 51.7149},
                'atm': {'pa': 101325, 'bar': 1.01325, 'psi': 14.6959, 'torr': 760, 'mmhg': 760},
                'torr': {'pa': 133.322, 'bar': 0.00133322, 'psi': 0.0193368, 'atm': 0.00131579, 'mmhg': 1},
                'mmhg': {'pa': 133.322, 'bar': 0.00133322, 'psi': 0.0193368, 'atm': 0.00131579, 'torr': 1}
            };
            
            if (conversionFactors[fromUnit] && conversionFactors[fromUnit][toUnit]) {
                const result = value * conversionFactors[fromUnit][toUnit];
                speak(`${value} ${fromUnit} bằng ${result.toFixed(4)} ${toUnit}.`);
            } else {
                speak("Em chưa hỗ trợ chuyển đổi đơn vị áp suất này.");
            }
        }
    }

    // 43.42. Tính năng tạo đơn vị năng lượng chuyển đổi
    else if (checkCmd(cmd, ['chuyển đổi năng lượng', 'joule sang calo', 'calo sang kj', 'kj sang kcal']) && /(\d+)\s*(j|kj|cal|kcal|wh|kwh)/i.test(cmd)) {
        const energyMatch = cmd.match(/(\d+(?:\.\d+)?)\s*(j|kj|cal|kcal|wh|kwh)/i);
        const toMatch = cmd.match(/(?:sang|to)\s+(j|kj|cal|kcal|wh|kwh)/i);
        
        if (energyMatch && toMatch) {
            const value = parseFloat(energyMatch[1]);
            const fromUnit = energyMatch[2].toLowerCase();
            const toUnit = toMatch[1].toLowerCase();
            
            const conversionFactors = {
                'j': {'kj': 0.001, 'cal': 0.239006, 'kcal': 0.000239006, 'wh': 0.000277778, 'kwh': 0.000000277778},
                'kj': {'j': 1000, 'cal': 239.006, 'kcal': 0.239006, 'wh': 0.277778, 'kwh': 0.000277778},
                'cal': {'j': 4.184, 'kj': 0.004184, 'kcal': 0.001, 'wh': 0.00116222, 'kwh': 0.00000116222},
                'kcal': {'j': 4184, 'kj': 4.184, 'cal': 1000, 'wh': 1.16222, 'kwh': 0.00116222},
                'wh': {'j': 3600, 'kj': 3.6, 'cal': 860.421, 'kcal': 0.860421, 'kwh': 0.001},
                'kwh': {'j': 3600000, 'kj': 3600, 'cal': 860421, 'kcal': 860.421, 'wh': 1000}
            };
            
            if (conversionFactors[fromUnit] && conversionFactors[fromUnit][toUnit]) {
                const result = value * conversionFactors[fromUnit][toUnit];
                speak(`${value} ${fromUnit} bằng ${result.toFixed(4)} ${toUnit}.`);
            } else {
                speak("Em chưa hỗ trợ chuyển đổi đơn vị năng lượng này.");
            }
        }
    }

    // 43.43. Tính năng tạo đơn vị tần số chuyển đổi
    else if (checkCmd(cmd, ['chuyển đổi tần số', 'hz sang khz', 'khz sang mhz', 'mh sang ghz']) && /(\d+)\s*(hz|khz|mh|ghz)/i.test(cmd)) {
        const freqMatch = cmd.match(/(\d+(?:\.\d+)?)\s*(hz|khz|mh|ghz)/i);
        const toMatch = cmd.match(/(?:sang|to)\s+(hz|khz|mh|ghz)/i);
        
        if (freqMatch && toMatch) {
            const value = parseFloat(freqMatch[1]);
            const fromUnit = freqMatch[2].toLowerCase();
            const toUnit = toMatch[1].toLowerCase();
            
            // Chuẩn hóa MHz
            const normalizedFrom = fromUnit === 'mh' ? 'mhz' : fromUnit;
            const normalizedTo = toUnit === 'mh' ? 'mhz' : toUnit;
            
            const conversionFactors = {
                'hz': {'khz': 0.001, 'mhz': 0.000001, 'ghz': 0.000000001},
                'khz': {'hz': 1000, 'mhz': 0.001, 'ghz': 0.000001},
                'mhz': {'hz': 1000000, 'khz': 1000, 'ghz': 0.001},
                'ghz': {'hz': 1000000000, 'khz': 1000000, 'mhz': 1000}
            };
            
            if (conversionFactors[normalizedFrom] && conversionFactors[normalizedFrom][normalizedTo]) {
                const result = value * conversionFactors[normalizedFrom][normalizedTo];
                speak(`${value} ${normalizedFrom} bằng ${result.toFixed(4)} ${normalizedTo}.`);
            } else {
                speak("Em chưa hỗ trợ chuyển đổi đơn vị tần số này.");
            }
        }
    }

    // 43.44. Tính năng tạo đơn vị dữ liệu chuyển đổi
    else if (checkCmd(cmd, ['chuyển đổi dữ liệu', 'byte sang kb', 'kb sang mb', 'mb sang gb', 'gb sang tb']) && /(\d+)\s*(byte|b|kb|mb|gb|tb)/i.test(cmd)) {
        const dataMatch = cmd.match(/(\d+(?:\.\d+)?)\s*(byte|b|kb|mb|gb|tb)/i);
        const toMatch = cmd.match(/(?:sang|to)\s+(byte|b|kb|mb|gb|tb)/i);
        
        if (dataMatch && toMatch) {
            const value = parseFloat(dataMatch[1]);
            const fromUnit = dataMatch[2].toLowerCase();
            const toUnit = toMatch[1].toLowerCase();
            
            // Chuẩn hóa byte
            const normalizedFrom = fromUnit === 'byte' ? 'b' : fromUnit;
            const normalizedTo = toUnit === 'byte' ? 'b' : toUnit;
            
            const conversionFactors = {
                'b': {'kb': 0.0009765625, 'mb': 0.00000095367431640625, 'gb': 0.00000000093132257461548, 'tb': 0.00000000000090949470177293},
                'kb': {'b': 1024, 'mb': 0.0009765625, 'gb': 0.00000095367431640625, 'tb': 0.00000000093132257461548},
                'mb': {'b': 1048576, 'kb': 1024, 'gb': 0.0009765625, 'tb': 0.00000095367431640625},
                'gb': {'b': 1073741824, 'kb': 1048576, 'mb': 1024, 'tb': 0.0009765625},
                'tb': {'b': 1099511627776, 'kb': 1073741824, 'mb': 1048576, 'gb': 1024}
            };
            
            if (conversionFactors[normalizedFrom] && conversionFactors[normalizedFrom][normalizedTo]) {
                const result = value * conversionFactors[normalizedFrom][normalizedTo];
                speak(`${value} ${normalizedFrom} bằng ${result.toFixed(4)} ${normalizedTo}.`);
            } else {
                speak("Em chưa hỗ trợ chuyển đổi đơn vị dữ liệu này.");
            }
        }
    }

    // 43.45. Tính năng tạo đơn vị thời gian chuyển đổi
    else if (checkCmd(cmd, ['chuyển đổi thời gian', 'giây sang phút', 'phút sang giờ', 'giờ sang ngày', 'ngày sang tuần']) && /(\d+)\s*(giây|phút|giờ|ngày|tuần|tháng|năm|s|sec|min|hr|day|week|month|year)/i.test(cmd)) {
        const timeMatch = cmd.match(/(\d+(?:\.\d+)?)\s*(giây|phút|giờ|ngày|tuần|tháng|năm|s|sec|min|hr|day|week|month|year)/i);
        const toMatch = cmd.match(/(?:sang|to)\s+(giây|phút|giờ|ngày|tuần|tháng|năm|s|sec|min|hr|day|week|month|year)/i);
        
        if (timeMatch && toMatch) {
            const value = parseFloat(timeMatch[1]);
            const fromUnit = timeMatch[2].toLowerCase();
            const toUnit = toMatch[1].toLowerCase();
            
            // Chuẩn hóa tên đơn vị
            const unitMap = {
                'giây': 's', 's': 's', 'sec': 's',
                'phút': 'min', 'min': 'min',
                'giờ': 'hr', 'hr': 'hr',
                'ngày': 'day', 'day': 'day',
                'tuần': 'week', 'week': 'week',
                'tháng': 'month', 'month': 'month',
                'năm': 'year', 'year': 'year'
            };
            
            const normalizedFrom = unitMap[fromUnit] || fromUnit;
            const normalizedTo = unitMap[toUnit] || toUnit;
            
            const conversionFactors = {
                's': {'min': 0.0166667, 'hr': 0.000277778, 'day': 0.0000115741, 'week': 0.00000165344},
                'min': {'s': 60, 'hr': 0.0166667, 'day': 0.000694444, 'week': 0.0000992063},
                'hr': {'s': 3600, 'min': 60, 'day': 0.0416667, 'week': 0.00595238},
                'day': {'s': 86400, 'min': 1440, 'hr': 24, 'week': 0.142857},
                'week': {'s': 604800, 'min': 10080, 'hr': 168, 'day': 7}
            };
            
            if (conversionFactors[normalizedFrom] && conversionFactors[normalizedFrom][normalizedTo]) {
                const result = value * conversionFactors[normalizedFrom][normalizedTo];
                speak(`${value} ${normalizedFrom} bằng ${result.toFixed(4)} ${normalizedTo}.`);
            } else {
                speak("Em chưa hỗ trợ chuyển đổi đơn vị thời gian này.");
            }
        }
    }

    // 43.46. Tính năng tạo từ vựng tiếng Anh
    else if (checkCmd(cmd, ['từ vựng tiếng anh', 'từ tiếng anh', 'học từ tiếng anh']) && cmd.split(' ').length > 2) {
        const englishVocabulary = {
            'hello': 'xin chào',
            'goodbye': 'tạm biệt',
            'thank you': 'cảm ơn',
            'please': 'làm ơn, vui lòng',
            'sorry': 'xin lỗi',
            'yes': 'có',
            'no': 'không',
            'water': 'nước',
            'food': 'thức ăn',
            'house': 'ngôi nhà',
            'car': 'xe hơi',
            'book': 'cuốn sách',
            'computer': 'máy tính',
            'phone': 'điện thoại',
            'friend': 'người bạn',
            'family': 'gia đình',
            'work': 'công việc',
            'time': 'thời gian',
            'money': 'tiền bạc',
            'love': 'tình yêu'
        };
        
        let foundWord = false;
        for (const [english, vietnamese] of Object.entries(englishVocabulary)) {
            if (cmd.toLowerCase().includes(english)) {
                speak(`Từ "${english}" trong tiếng Việt có nghĩa là: ${vietnamese}`);
                foundWord = true;
                break;
            }
        }
        
        if (!foundWord) {
            speak("Em có thể giúp anh iu học từ vựng tiếng Anh. Hãy hỏi về một từ cụ thể như 'từ tiếng Anh cho [từ cần dịch]'.");
        }
    }

    // 43.47. Tính năng tạo từ vựng tiếng Việt
    else if (checkCmd(cmd, ['từ vựng tiếng việt', 'từ tiếng việt', 'học từ tiếng việt']) && cmd.split(' ').length > 2) {
        const vietnameseVocabulary = {
            'xin chào': 'hello',
            'tạm biệt': 'goodbye',
            'cảm ơn': 'thank you',
            'vui lòng': 'please',
            'xin lỗi': 'sorry',
            'có': 'yes',
            'không': 'no',
            'nước': 'water',
            'thức ăn': 'food',
            'ngôi nhà': 'house',
            'xe hơi': 'car',
            'cuốn sách': 'book',
            'máy tính': 'computer',
            'điện thoại': 'phone',
            'người bạn': 'friend',
            'gia đình': 'family',
            'công việc': 'work',
            'thời gian': 'time',
            'tiền bạc': 'money',
            'tình yêu': 'love'
        };
        
        let foundWord = false;
        for (const [vietnamese, english] of Object.entries(vietnameseVocabulary)) {
            if (cmd.toLowerCase().includes(vietnamese.toLowerCase())) {
                speak(`Từ "${vietnamese}" trong tiếng Anh có nghĩa là: ${english}`);
                foundWord = true;
                break;
            }
        }
        
        if (!foundWord) {
            speak("Em có thể giúp anh iu học từ vựng tiếng Việt sang tiếng Anh. Hãy hỏi về một từ cụ thể.");
        }
    }

    // 43.48. Tính năng tạo công thức vật lý
    else if (checkCmd(cmd, ['công thức vật lý', 'vật lý', 'công thức chuyển động', 'công thức lực'])) {
        const physicsFormulas = {
            'định luật 2 newton': 'F = m × a (Lực bằng khối lượng nhân với gia tốc)',
            'vận tốc': 'v = s/t (Vận tốc bằng quãng đường chia cho thời gian)',
            'gia tốc': 'a = (v-u)/t (Gia tốc bằng hiệu vận tốc chia cho thời gian)',
            'trọng lực': 'F = m × g (Trọng lực bằng khối lượng nhân với gia tốc trọng trường)',
            'động năng': 'KE = ½mv² (Động năng bằng một phần hai khối lượng nhân với vận tốc bình phương)',
            'thế năng': 'PE = mgh (Thế năng bằng khối lượng nhân với gia tốc trọng trường nhân với độ cao)'
        };
        
        let foundFormula = false;
        for (const [topic, formula] of Object.entries(physicsFormulas)) {
            if (cmd.toLowerCase().includes(topic)) {
                speak(`Công thức ${topic}: ${formula}`);
                foundFormula = true;
                break;
            }
        }
        
        if (!foundFormula) {
            speak("Em có thể giúp anh iu với các công thức vật lý như định luật Newton, vận tốc, gia tốc, trọng lực...");
        }
    }

    // 43.49. Tính năng tạo công thức hóa học
    else if (checkCmd(cmd, ['công thức hóa học', 'hóa học', 'h2o là gì', 'co2 là gì'])) {
        const chemistryFormulas = {
            'nước': 'H₂O',
            'carbon dioxide': 'CO₂',
            'ammonia': 'NH₃',
            'methane': 'CH₄',
            'glucose': 'C₆H₁₂O₆',
            'sulfuric acid': 'H₂SO₄',
            'hydrochloric acid': 'HCl',
            'sodium chloride': 'NaCl',
            'calcium carbonate': 'CaCO₃',
            'ethanol': 'C₂H₅OH'
        };
        
        let foundFormula = false;
        for (const [compound, formula] of Object.entries(chemistryFormulas)) {
            if (cmd.toLowerCase().includes(compound.toLowerCase())) {
                speak(`Công thức hóa học của ${compound} là: ${formula}`);
                foundFormula = true;
                break;
            }
        }
        
        if (!foundFormula) {
            speak("Em có thể giúp anh iu với các công thức hóa học phổ biến như nước (H₂O), carbon dioxide (CO₂), ammonia (NH₃)...");
        }
    }

    // 43.50. Tính năng tạo bài hát yêu thích
    else if (checkCmd(cmd, ['bài hát yêu thích', 'thêm bài hát yêu thích', 'lưu bài hát']) && cmd.includes('bài hát')) {
        const songMatch = cmd.match(/(?:bài hát|bài|ca khúc)\s+(.+?)(?:\s+của\s+|\s+by\s+|\s+-\s+)(.+)/i);
        if (songMatch) {
            const songName = songMatch[1];
            const artist = songMatch[2];
            
            const favoriteSong = {
                id: Date.now(),
                name: songName,
                artist: artist,
                addedAt: new Date().toISOString()
            };
            
            const savedSongs = JSON.parse(localStorage.getItem('brain_favorite_songs') || '[]');
            savedSongs.push(favoriteSong);
            localStorage.setItem('brain_favorite_songs', JSON.stringify(savedSongs));
            
            speak(`Đã thêm "${songName}" của ${artist} vào danh sách bài hát yêu thích của anh iu.`);
        }
    }

    // 43.51. Tính năng xem bài hát yêu thích
    else if (checkCmd(cmd, ['xem bài hát yêu thích', 'danh sách bài hát yêu thích', 'bài hát đã lưu'])) {
        const savedSongs = JSON.parse(localStorage.getItem('brain_favorite_songs') || '[]');
        if (savedSongs.length > 0) {
            let songsSummary = "Dưới đây là danh sách bài hát yêu thích của anh iu:\n";
            savedSongs.forEach((song, index) => {
                songsSummary += `${index + 1}. "${song.name}" - ${song.artist}\n`;
            });
            speak(songsSummary);
        } else {
            speak("Anh iu chưa lưu bài hát yêu thích nào.");
        }
    }

    // 43.52. Tính năng tạo thói quen hàng ngày
    else if (checkCmd(cmd, ['tạo thói quen', 'thói quen hàng ngày', 'thiết lập thói quen']) && cmd.includes('vào') && cmd.includes('hàng ngày')) {
        const habitMatch = cmd.match(/(?:tạo|thiết lập)\s+(?:thói quen|nhiệm vụ)\s+(.+?)\s+vào\s+(.+?)\s+hàng ngày/i);
        if (habitMatch) {
            const habit = habitMatch[1];
            const time = habitMatch[2];
            
            const habitItem = {
                id: Date.now(),
                habit: habit,
                time: time,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            const savedHabits = JSON.parse(localStorage.getItem('brain_daily_habits') || '[]');
            savedHabits.push(habitItem);
            localStorage.setItem('brain_daily_habits', JSON.stringify(savedHabits));
            
            speak(`Đã tạo thói quen: "${habit}" vào lúc ${time} hàng ngày.`);
        }
    }

    // 43.53. Tính năng xem thói quen hàng ngày
    else if (checkCmd(cmd, ['xem thói quen', 'thói quen của tôi', 'danh sách thói quen'])) {
        const savedHabits = JSON.parse(localStorage.getItem('brain_daily_habits') || '[]');
        if (savedHabits.length > 0) {
            let habitsSummary = "Dưới đây là các thói quen hàng ngày của anh iu:\n";
            savedHabits.forEach((habit, index) => {
                const status = habit.completed ? "✓" : "○";
                habitsSummary += `${status} ${index + 1}. ${habit.habit} - ${habit.time}\n`;
            });
            speak(habitsSummary);
        } else {
            speak("Anh iu chưa tạo thói quen hàng ngày nào.");
        }
    }

    // 43.54. Tính năng tạo mục tiêu cá nhân
    else if (checkCmd(cmd, ['tạo mục tiêu', 'mục tiêu cá nhân', 'đặt mục tiêu']) && cmd.includes('trong vòng')) {
        const goalMatch = cmd.match(/(?:tạo|đặt)\s+(?:mục tiêu|mục tiêu cá nhân)\s+(.+?)\s+trong vòng\s+(.+)/i);
        if (goalMatch) {
            const goal = goalMatch[1];
            const timeframe = goalMatch[2];
            
            const goalItem = {
                id: Date.now(),
                goal: goal,
                timeframe: timeframe,
                achieved: false,
                createdAt: new Date().toISOString()
            };
            
            const savedGoals = JSON.parse(localStorage.getItem('brain_personal_goals') || '[]');
            savedGoals.push(goalItem);
            localStorage.setItem('brain_personal_goals', JSON.stringify(savedGoals));
            
            speak(`Đã đặt mục tiêu: "${goal}" trong vòng ${timeframe}.`);
        }
    }

    // 43.55. Tính năng xem mục tiêu cá nhân
    else if (checkCmd(cmd, ['xem mục tiêu', 'mục tiêu của tôi', 'danh sách mục tiêu'])) {
        const savedGoals = JSON.parse(localStorage.getItem('brain_personal_goals') || '[]');
        if (savedGoals.length > 0) {
            let goalsSummary = "Dưới đây là các mục tiêu cá nhân của anh iu:\n";
            savedGoals.forEach((goal, index) => {
                const status = goal.achieved ? "✓" : "○";
                goalsSummary += `${status} ${index + 1}. ${goal.goal} (trong vòng ${goal.timeframe})\n`;
            });
            speak(goalsSummary);
        } else {
            speak("Anh iu chưa đặt mục tiêu cá nhân nào.");
        }
    }

    // 43.56. Tính năng tạo lời khuyên sức khỏe
    else if (checkCmd(cmd, ['lời khuyên sức khỏe', 'tips sức khỏe', 'sống khỏe'])) {
        const healthTips = [
            "Uống đủ 2 lít nước mỗi ngày để duy trì sự trao đổi chất tốt.",
            "Ngủ đủ 7-8 tiếng mỗi đêm để cơ thể phục hồi và tái tạo năng lượng.",
            "Tập thể dục ít nhất 30 phút mỗi ngày để giữ gìn sức khỏe.",
            "Ăn nhiều rau xanh và trái cây để cung cấp vitamin và khoáng chất.",
            "Hạn chế đồ ăn nhanh và nhiều dầu mỡ để bảo vệ tim mạch.",
            "Kiểm tra sức khỏe định kỳ để phát hiện sớm các vấn đề sức khỏe.",
            "Thư giãn và giảm căng thẳng bằng cách thiền hoặc hít thở sâu.",
            "Tránh thuốc lá và hạn chế rượu bia để bảo vệ sức khỏe lâu dài."
        ];
        
        const randomTip = healthTips[Math.floor(Math.random() * healthTips.length)];
        speak(`Dưới đây là một lời khuyên sức khỏe cho anh iu: ${randomTip}`);
    }

    // 43.57. Tính năng tạo lời khuyên tài chính
    else if (checkCmd(cmd, ['lời khuyên tài chính', 'tips tài chính', 'quản lý tiền bạc'])) {
        const financeTips = [
            "Lập ngân sách hàng tháng và tuân thủ nó để kiểm soát chi tiêu hiệu quả.",
            "Tiết kiệm ít nhất 10% thu nhập hàng tháng cho tương lai.",
            "Tránh nợ xấu và chỉ vay tiền cho những mục tiêu sinh lời.",
            "Đầu tư vào giáo dục và kỹ năng để tăng thu nhập trong dài hạn.",
            "Xây dựng quỹ khẩn cấp đủ cho 3-6 tháng sinh hoạt.",
            "So sánh giá cả trước khi mua sắm để tiết kiệm chi phí.",
            "Tự động hóa việc tiết kiệm để hình thành thói quen tốt.",
            "Học hỏi về đầu tư để tăng trưởng tài sản một cách thông minh."
        ];
        
        const randomTip = financeTips[Math.floor(Math.random() * financeTips.length)];
        speak(`Dưới đây là một lời khuyên tài chính cho anh iu: ${randomTip}`);
    }

    // 43.58. Tính năng tạo lời khuyên học tập
    else if (checkCmd(cmd, ['lời khuyên học tập', 'tips học tập', 'cách học hiệu quả'])) {
        const studyTips = [
            "Lập kế hoạch học tập cụ thể và tuân thủ lịch trình đều đặn.",
            "Chia nhỏ kiến thức thành các phần dễ nhớ và ôn tập thường xuyên.",
            "Tạo sơ đồ tư duy để hệ thống hóa kiến thức một cách trực quan.",
            "Giảng lại kiến thức cho người khác để củng cố hiểu biết.",
            "Nghỉ ngơi hợp lý giữa các buổi học để tăng hiệu quả tiếp thu.",
            "Tìm phương pháp học phù hợp với phong cách cá nhân của bạn.",
            "Đặt mục tiêu học tập rõ ràng và đo lường tiến bộ thường xuyên.",
            "Tạo môi trường học tập yên tĩnh và không bị phân tâm."
        ];
        
        const randomTip = studyTips[Math.floor(Math.random() * studyTips.length)];
        speak(`Dưới đây là một lời khuyên học tập cho anh iu: ${randomTip}`);
    }

    // 43.59. Tính năng tạo lời khuyên công việc
    else if (checkCmd(cmd, ['lời khuyên công việc', 'tips công việc', 'phát triển sự nghiệp'])) {
        const careerTips = [
            "Luôn học hỏi và cập nhật kỹ năng mới để thích nghi với thị trường.",
            "Xây dựng mối quan hệ chuyên nghiệp và mở rộng mạng lưới kết nối.",
            "Đặt mục tiêu nghề nghiệp rõ ràng và lập kế hoạch để đạt được chúng.",
            "Chấp nhận phản hồi và sử dụng nó để cải thiện hiệu suất làm việc.",
            "Tìm kiếm cơ hội lãnh đạo để phát triển kỹ năng quản lý.",
            "Cân bằng giữa công việc và cuộc sống cá nhân để duy trì năng lượng.",
            "Thể hiện sự chủ động và trách nhiệm trong mọi nhiệm vụ được giao.",
            "Tìm kiếm một người cố vấn để định hướng sự nghiệp hiệu quả."
        ];
        
        const randomTip = careerTips[Math.floor(Math.random() * careerTips.length)];
        speak(`Dưới đây là một lời khuyên công việc cho anh iu: ${randomTip}`);
    }

    // 43.60. Tính năng tạo danh ngôn phát triển bản thân
    else if (checkCmd(cmd, ['danh ngôn phát triển bản thân', 'lời hay ý đẹp', 'động lực phát triển'])) {
        const selfDevQuotes = [
            "Sự phát triển không xảy ra trong vùng an toàn. - Carol Burnett",
            "Bạn không cần phải thấy toàn bộ cầu thang, chỉ cần bước đi bước đầu tiên. - Martin Luther King Jr.",
            "Cuộc sống là 10% những gì xảy ra với bạn và 90% là cách bạn phản ứng với nó. - Charles R. Swindoll",
            "Hãy là thay đổi mà bạn muốn thấy trong thế giới này. - Mahatma Gandhi",
            "Thành công không phải là chìa khóa của hạnh phúc. Hạnh phúc là chìa khóa của thành công. - Albert Schweitzer",
            "Điều quan trọng không phải là bạn đứng ở đâu mà là bạn hướng về đâu. - Oliver Wendell Holmes",
            "Bạn chỉ thực sự thất bại khi bạn ngừng cố gắng. - Albert Einstein",
            "Mọi thứ bạn từng muốn đều ở bên kia ranh giới của sự thoải mái. - Brian Tracy"
        ];
        
        const randomQuote = selfDevQuotes[Math.floor(Math.random() * selfDevQuotes.length)];
        speak(`Dưới đây là một danh ngôn phát triển bản thân: ${randomQuote}`);
    }

    // 43.61. Tính năng tạo lịch sử âm nhạc
    else if (checkCmd(cmd, ['lịch sử âm nhạc', 'nhạc cụ đầu tiên', 'phát minh âm nhạc'])) {
        const musicHistory = {
            'nhạc cụ đầu tiên': 'Được cho là sáo xương chim, có niên đại khoảng 40,000 năm trước',
            'piano': 'Được phát minh bởi Bartolomeo Cristofori vào đầu thế kỷ 18',
            'guitar': 'Có nguồn gốc từ các nhạc cụ dây cổ như lute và vihuela',
            'violin': 'Ra đời vào thế kỷ 16 tại Ý, phát triển từ các nhạc cụ dây phương Tây',
            'drum': 'Một trong những nhạc cụ cổ xưa nhất, có từ hàng ngàn năm trước'
        };
        
        let foundInfo = false;
        for (const [topic, info] of Object.entries(musicHistory)) {
            if (cmd.toLowerCase().includes(topic)) {
                speak(`Về ${topic}: ${info}`);
                foundInfo = true;
                break;
            }
        }
        
        if (!foundInfo) {
            speak("Em có thể chia sẻ về lịch sử âm nhạc như nhạc cụ đầu tiên, piano, guitar, violin, drum...");
        }
    }

    // 43.62. Tính năng tạo kiến thức thiên nhiên
    else if (checkCmd(cmd, ['kiến thức thiên nhiên', 'động vật', 'thực vật', 'hệ sinh thái'])) {
        const natureFacts = {
            'cao nhất': 'Voi châu Phi là loài động vật lớn nhất trên cạn',
            'nhanh nhất': 'Chim cắt là loài chim săn mồi nhanh nhất, đạt tốc độ 389 km/h khi lướt',
            'thông minh nhất': 'Tinh tinh và cá heo được coi là loài động vật thông minh nhất',
            'lâu đời nhất': 'Cây thông Pando ở Utah, Mỹ có tuổi đời hơn 80,000 năm',
            'nguy hiểm nhất': 'Muỗi là loài vật nguy hiểm nhất với con người do lây lan bệnh'
        };
        
        let foundFact = false;
        for (const [category, fact] of Object.entries(natureFacts)) {
            if (cmd.toLowerCase().includes(category)) {
                speak(`Trong thiên nhiên, ${category}: ${fact}`);
                foundFact = true;
                break;
            }
        }
        
        if (!foundFact) {
            speak("Em có thể chia sẻ kiến thức về thiên nhiên như động vật, thực vật, hệ sinh thái...");
        }
    }

    // 43.63. Tính năng tạo kiến thức vũ trụ
    else if (checkCmd(cmd, ['kiến thức vũ trụ', 'hệ mặt trời', 'ngôi sao gần nhất', 'thiên hà'])) {
        const spaceFacts = {
            'mặt trời': 'Là ngôi sao trung tâm của hệ Mặt Trời, chiếm 99.86% khối lượng hệ',
            'trái đất': 'Là hành tinh duy nhất biết có sự sống, cách Mặt Trời khoảng 150 triệu km',
            'sao hỏa': 'Được gọi là "hành tinh đỏ", có hệ thống sông cổ và băng ở cực',
            'thổ tinh': 'Nổi tiếng với các vòng tròn băng và đá xung quanh',
            'ngân hà': 'Là thiên hà chứa hệ Mặt Trời, có hình dạng xoắn ốc'
        };
        
        let foundSpaceFact = false;
        for (const [celestial, fact] of Object.entries(spaceFacts)) {
            if (cmd.toLowerCase().includes(celestial)) {
                speak(`Về ${celestial}: ${fact}`);
                foundSpaceFact = true;
                break;
            }
        }
        
        if (!foundSpaceFact) {
            speak("Em có thể chia sẻ kiến thức về vũ trụ như hệ Mặt Trời, các hành tinh, thiên hà...");
        }
    }

    // 43.64. Tính năng tạo kiến thức công nghệ
    else if (checkCmd(cmd, ['kiến thức công nghệ', 'máy tính đầu tiên', 'internet', 'trí tuệ nhân tạo'])) {
        const techFacts = {
            'máy tính đầu tiên': 'ENIAC, hoàn thành năm 1946, nặng hơn 27 tấn',
            'internet': 'Ra đời từ dự án ARPANET năm 1969, ban đầu chỉ để kết nối các trường đại học',
            'ai': 'Thuật ngữ được đặt bởi John McCarthy năm 1956 tại Hội nghị Dartmouth',
            'smartphone': 'IBM Simon được coi là điện thoại thông minh đầu tiên năm 1992',
            'robot': 'Từ này được đặt bởi nhà văn Karel Čapek trong vở kịch R.U.R năm 1920'
        };
        
        let foundTechFact = false;
        for (const [tech, fact] of Object.entries(techFacts)) {
            if (cmd.toLowerCase().includes(tech)) {
                speak(`Về ${tech}: ${fact}`);
                foundTechFact = true;
                break;
            }
        }
        
        if (!foundTechFact) {
            speak("Em có thể chia sẻ kiến thức về công nghệ như máy tính, internet, trí tuệ nhân tạo...");
        }
    }

    // 43.65. Tính năng tạo từ viết tắt thông dụng
    else if (checkCmd(cmd, ['từ viết tắt', 'viết tắt thông dụng', 'acronym'])) {
        const acronyms = {
            'ASAP': 'As Soon As Possible (Sớm nhất có thể)',
            'FYI': 'For Your Information (Để bạn biết)',
            'DIY': 'Do It Yourself (Tự làm)',
            'CEO': 'Chief Executive Officer (Giám đốc điều hành)',
            'AI': 'Artificial Intelligence (Trí tuệ nhân tạo)',
            'GPS': 'Global Positioning System (Hệ thống định vị toàn cầu)',
            'USB': 'Universal Serial Bus (Cổng kết nối phổ biến)',
            'WiFi': 'Wireless Fidelity (Kết nối không dây)'
        };
        
        let foundAcronym = false;
        for (const [acronym, meaning] of Object.entries(acronyms)) {
            if (cmd.toUpperCase().includes(acronym)) {
                speak(`${acronym} có nghĩa là: ${meaning}`);
                foundAcronym = true;
                break;
            }
        }
        
        if (!foundAcronym) {
            speak("Em có thể giải thích các từ viết tắt thông dụng như ASAP, FYI, DIY, CEO, AI...");
        }
    }

    // 43.66. Tính năng tạo mẹo nấu ăn
    else if (checkCmd(cmd, ['mẹo nấu ăn', 'bí quyết nấu nướng', 'tip nấu ăn'])) {
        const cookingTips = [
            "Luộc trứng trong nước sôi khoảng 6-7 phút để có trứng lòng đào hoàn hảo.",
            "Ướp thịt với một chút muối và tiêu trước khi nấu để tăng hương vị.",
            "Dùng dao sắc để thái rau củ giúp giữ được nhiều dinh dưỡng hơn.",
            "Làm nóng chảo trước khi cho dầu để tránh thực phẩm bị dính.",
            "Nêm nếm món ăn trong quá trình nấu để điều chỉnh hương vị kịp thời.",
            "Dùng hành tỏi phi thơm để tăng hương vị cho các món ăn Việt Nam.",
            "Luộc rau trong nước sôi có chút muối để giữ màu xanh tự nhiên.",
            "Đậy nắp khi nấu cơm để giữ hơi nước và nấu đều hơn."
        ];
        
        const randomTip = cookingTips[Math.floor(Math.random() * cookingTips.length)];
        speak(`Dưới đây là một mẹo nấu ăn cho anh iu: ${randomTip}`);
    }

    // 43.67. Tính năng tạo mẹo du lịch
    else if (checkCmd(cmd, ['mẹo du lịch', 'bí quyết du lịch', 'tip đi xa'])) {
        const travelTips = [
            "Đóng gói đồ đạc trong túi nhựa để tiết kiệm không gian vali.",
            "Photo hoặc scan giấy tờ quan trọng và lưu ở nhiều nơi an toàn.",
            "Tra cứu trước về văn hóa, luật lệ và ngôn ngữ cơ bản của nơi đến.",
            "Mang theo adapter phù hợp với quốc gia bạn đang đến.",
            "Luôn có một bản sao giấy tờ tùy thân và để ở nơi khác ngoài vali.",
            "Tải ứng dụng bản đồ ngoại tuyến để sử dụng khi không có Internet.",
            "Mang theo thuốc men cơ bản và danh sách các bệnh viện địa phương.",
            "Chia tiền và thẻ tín dụng vào nhiều nơi khác nhau trong hành lý."
        ];
        
        const randomTip = travelTips[Math.floor(Math.random() * travelTips.length)];
        speak(`Dưới đây là một mẹo du lịch cho anh iu: ${randomTip}`);
    }

    // 43.68. Tính năng tạo mẹo học ngoại ngữ
    else if (checkCmd(cmd, ['mẹo học ngoại ngữ', 'bí quyết học tiếng', 'tip học ngôn ngữ'])) {
        const languageTips = [
            "Học từ vựng theo chủ đề thay vì học ngẫu nhiên để dễ nhớ hơn.",
            "Tạo thói quen nghe nhạc, xem phim bằng ngôn ngữ bạn đang học.",
            "Thực hành nói mỗi ngày, dù chỉ là nói chuyện một mình.",
            "Sử dụng flashcards hoặc ứng dụng như Anki để ôn tập từ vựng.",
            "Ghi âm chính mình nói và nghe lại để cải thiện phát âm.",
            "Tìm bạn học cùng hoặc người bản xứ để luyện nói thường xuyên.",
            "Đọc sách trẻ em bằng ngôn ngữ mới để xây dựng vốn từ cơ bản.",
            "Đặt mục tiêu nhỏ hàng ngày thay vì cố gắng học quá nhiều cùng lúc."
        ];
        
        const randomTip = languageTips[Math.floor(Math.random() * languageTips.length)];
        speak(`Dưới đây là một mẹo học ngoại ngữ cho anh iu: ${randomTip}`);
    }

    // 43.69. Tính năng tạo mẹo chăm sóc sức khỏe tinh thần
    else if (checkCmd(cmd, ['mẹo chăm sóc tinh thần', 'giảm stress', 'cải thiện tâm trạng'])) {
        const mentalHealthTips = [
            "Thực hành thiền định hoặc hít thở sâu 10 phút mỗi ngày.",
            "Viết nhật ký để ghi lại cảm xúc và suy nghĩ tích cực.",
            "Tập thể dục đều đặn để giải phóng endorphin - hormone hạnh phúc.",
            "Dành thời gian cho bản thân và làm những điều bạn yêu thích.",
            "Kết nối với người thân và bạn bè để chia sẻ cảm xúc.",
            "Tránh caffeine và đường quá nhiều để duy trì mức năng lượng ổn định.",
            "Ngủ đủ giấc và duy trì lịch trình ngủ đều đặn.",
            "Tiếp xúc với ánh nắng mặt trời để tăng cường vitamin D và tâm trạng."
        ];
        
        const randomTip = mentalHealthTips[Math.floor(Math.random() * mentalHealthTips.length)];
        speak(`Dưới đây là một mẹo chăm sóc sức khỏe tinh thần cho anh iu: ${randomTip}`);
    }

    // 43.70. Tính năng tạo mẹo quản lý thời gian
    else if (checkCmd(cmd, ['mẹo quản lý thời gian', 'quản lý công việc', 'tăng năng suất'])) {
        const timeManagementTips = [
            "Sử dụng nguyên tắc Pomodoro: làm việc 25 phút, nghỉ 5 phút.",
            "Lập danh sách việc cần làm mỗi ngày và ưu tiên theo mức độ quan trọng.",
            "Tránh đa nhiệm vì sẽ làm giảm hiệu suất và tăng sai sót.",
            "Đặt mục tiêu SMART: Cụ thể, Đo lường được, Khả thi, Liên quan, Có thời hạn.",
            "Loại bỏ hoặc ủy quyền các công việc không quan trọng.",
            "Tạo thói quen buổi sáng để bắt đầu ngày mới hiệu quả.",
            "Dành thời gian cho việc lên kế hoạch và tổ chức công việc.",
            "Tự thưởng cho bản thân khi hoàn thành mục tiêu để duy trì động lực."
        ];
        
        const randomTip = timeManagementTips[Math.floor(Math.random() * timeManagementTips.length)];
        speak(`Dưới đây là một mẹo quản lý thời gian cho anh iu: ${randomTip}`);
    }

    // 43.71. Tính năng tạo trò chơi đố vui
    else if (checkCmd(cmd, ['trò chơi đố vui', 'câu hỏi đố', 'câu hỏi vui', 'đố bạn'])) {
        const riddles = [
            {
                question: "Cái gì có chân mà chẳng biết đi, có miệng mà chẳng biết cười, có giường mà chẳng biết ngủ?",
                answer: "Cái bàn"
            },
            {
                question: "Cái gì đi lên mà không bao giờ đi xuống?",
                answer: "Tuổi tác"
            },
            {
                question: "Cái gì càng chia sẻ nhiều càng còn nhiều hơn?",
                answer: "Kiến thức"
            },
            {
                question: "Con gì không có xương sống nhưng vẫn đứng vững?",
                answer: "Con sông"
            },
            {
                question: "Cái gì có thể đi khắp thế giới mà vẫn ở yên một chỗ?",
                answer: "Tem thư"
            }
        ];
        
        const randomRiddle = riddles[Math.floor(Math.random() * riddles.length)];
        speak(`Đây là một câu đố vui cho anh iu: ${randomRiddle.question} Anh iu có biết đáp án không?`);
    }

    // 43.72. Tính năng giải đáp câu đố
    else if (checkCmd(cmd, ['đáp án', 'đáp án là', 'đáp án là gì', 'câu trả lời']) && localStorage.getItem('last_riddle')) {
        const lastRiddle = JSON.parse(localStorage.getItem('last_riddle'));
        speak(`Đáp án cho câu hỏi "${lastRiddle.question}" là: ${lastRiddle.answer}`);
    }

    // 43.73. Tính năng tạo lịch sử nghệ thuật
    else if (checkCmd(cmd, ['lịch sử nghệ thuật', 'họa sĩ nổi tiếng', 'tác phẩm nghệ thuật'])) {
        const artHistory = {
            'mona lisa': 'Được vẽ bởi Leonardo da Vinci, được coi là bức tranh nổi tiếng nhất thế giới',
            'vincent van gogh': 'Họa sĩ Hà Lan nổi tiếng với các tác phẩm đầy cảm xúc như "Đêm đầy sao"',
            'picasso': 'Người sáng lập phong trào lập thể, có hơn 50,000 tác phẩm',
            'michelangelo': 'Nổi tiếng với bức tranh trần nhà Nhà thờ Sistine',
            'leonardo da vinci': 'Nhà khoa học, họa sĩ, kỹ sư người Ý thời Phục hưng'
        };
        
        let foundArtInfo = false;
        for (const [artist, info] of Object.entries(artHistory)) {
            if (cmd.toLowerCase().includes(artist)) {
                speak(`Về ${artist}: ${info}`);
                foundArtInfo = true;
                break;
            }
        }
        
        if (!foundArtInfo) {
            speak("Em có thể chia sẻ về lịch sử nghệ thuật như Mona Lisa, Van Gogh, Picasso...");
        }
    }

    // 43.74. Tính năng tạo kiến thức văn hóa
    else if (checkCmd(cmd, ['kiến thức văn hóa', 'phong tục', 'truyền thống', 'văn hóa dân gian'])) {
        const culturalFacts = {
            'tết nguyên đán': 'Lễ hội truyền thống lớn nhất của người Việt, đánh dấu năm mới theo lịch âm',
            'trung thu': 'Tết của thiếu nhi, diễn ra vào rằm tháng 8 âm lịch, có đèn lồng và bánh trung thu',
            'cồng chiêng': 'Di sản văn hóa phi vật thể của đồng bào Tây Nguyên',
            'hội an': 'Di sản văn hóa thế giới, nổi tiếng với kiến trúc cổ và đèn lồng',
            'ônichidori': 'Lễ hội ánh sáng truyền thống của Nhật Bản'
        };
        
        let foundCulturalFact = false;
        for (const [culture, fact] of Object.entries(culturalFacts)) {
            if (cmd.toLowerCase().includes(culture)) {
                speak(`Về ${culture}: ${fact}`);
                foundCulturalFact = true;
                break;
            }
        }
        
        if (!foundCulturalFact) {
            speak("Em có thể chia sẻ kiến thức về văn hóa như Tết Nguyên Đán, Trung Thu, cồng chiêng...");
        }
    }

    // 43.75. Tính năng tạo kiến thức thể thao
    else if (checkCmd(cmd, ['kiến thức thể thao', 'olympic', 'world cup', 'môn thể thao'])) {
        const sportsFacts = {
            'olympic': 'Được tổ chức lần đầu năm 776 TCN tại Hy Lạp, được phục hưng năm 1896',
            'world cup': 'Giải bóng đá vô địch thế giới đầu tiên được tổ chức năm 1930',
            'marathon': 'Cuộc đua dài 42.195km, kỷ niệm chiến thắng trận Marathon năm 490 TCN',
            'bơi lội': 'Một trong những môn thể thao Olympic đầu tiên, có từ thời Hy Lạp cổ đại',
            'bóng đá': 'Được coi là môn thể thao phổ biến nhất thế giới, có nguồn gốc từ Trung Quốc cổ đại'
        };
        
        let foundSportsFact = false;
        for (const [sport, fact] of Object.entries(sportsFacts)) {
            if (cmd.toLowerCase().includes(sport)) {
                speak(`Về ${sport}: ${fact}`);
                foundSportsFact = true;
                break;
            }
        }
        
        if (!foundSportsFact) {
            speak("Em có thể chia sẻ kiến thức về thể thao như Olympic, World Cup, marathon...");
        }
    }

    // 43.76. Tính năng tạo lịch sử văn học
    else if (checkCmd(cmd, ['lịch sử văn học', 'tác phẩm văn học', 'nhà văn nổi tiếng'])) {
        const literaryHistory = {
            'truyện kiều': 'Tác phẩm của Nguyễn Du, được coi là đỉnh cao của văn học Việt Nam',
            'shakespeare': 'Nhà văn Anh nổi tiếng với các vở kịch như Romeo và Juliet, Hamlet',
            'homer': 'Tác giả của các sử thi Iliad và Odyssey, biểu tượng của văn học Hy Lạp cổ đại',
            'dante': 'Tác giả của Thần khúc, một trong những tác phẩm vĩ đại nhất của văn học nhân loại',
            'tố hữu': 'Nhà thơ lớn của Việt Nam, nổi tiếng với thơ trữ tình chính trị'
        };
        
        let foundLitInfo = false;
        for (const [work, info] of Object.entries(literaryHistory)) {
            if (cmd.toLowerCase().includes(work)) {
                speak(`Về ${work}: ${info}`);
                foundLitInfo = true;
                break;
            }
        }
        
        if (!foundLitInfo) {
            speak("Em có thể chia sẻ về lịch sử văn học như Truyện Kiều, Shakespeare, Homer...");
        }
    }

    // 43.77. Tính năng tạo kiến thức kinh doanh
    else if (checkCmd(cmd, ['kiến thức kinh doanh', 'khởi nghiệp', 'quản trị kinh doanh'])) {
        const businessFacts = [
            "Nguyên tắc 80/20 (Pareto Principle): 80% kết quả thường đến từ 20% nguyên nhân.",
            "Thuyết Maslow về nhu cầu: Con người có 5 cấp bậc nhu cầu từ thấp đến cao.",
            "Phân tích SWOT: Công cụ đánh giá điểm mạnh, yếu, cơ hội và thách thức.",
            "Marketing 4Ps: Sản phẩm, Giá cả, Phân phối và Xúc tiến bán hàng.",
            "ROI (Return on Investment): Tỷ suất lợi nhuận trên vốn đầu tư.",
            "KPI (Key Performance Indicator): Chỉ số đo lường hiệu suất công việc.",
            "Lean Startup: Phương pháp phát triển doanh nghiệp nhanh chóng và hiệu quả.",
            "Business Model Canvas: Công cụ mô tả, thiết kế và phân tích mô hình kinh doanh."
        ];
        
        const randomFact = businessFacts[Math.floor(Math.random() * businessFacts.length)];
        speak(`Dưới đây là một kiến thức kinh doanh cho anh iu: ${randomFact}`);
    }

    // 43.78. Tính năng tạo kiến thức tâm lý học
    else if (checkCmd(cmd, ['kiến thức tâm lý học', 'hiểu bản thân', 'tâm lý con người'])) {
        const psychologyFacts = [
            "Hiệu ứng Dunning-Kruger: Những người kém hiểu biết thường đánh giá quá cao khả năng của mình.",
            "Hiệu ứng Barnum: Con người có xu hướng tin rằng những mô tả chung chung là dành riêng cho mình.",
            "Hiệu ứng Halo: Ấn tượng ban đầu ảnh hưởng đến cách đánh giá các đặc điểm khác.",
            "Hiệu ứng Zeigarnik: Con người nhớ công việc chưa hoàn thành tốt hơn công việc đã hoàn thành.",
            "Thuyết tự quyết: Con người có ba nhu cầu tâm lý cơ bản là tự chủ, năng lực và kết nối.",
            "Hiệu ứng phản hồi: Những người nhận được phản hồi thường cải thiện hiệu suất tốt hơn.",
            "Hiệu ứng xã hội: Sự hiện diện của người khác ảnh hưởng đến hành vi của một cá nhân.",
            "Hiệu ứng quên nhanh: Con người quên kho���ng 50% thông tin trong vòng 1 giờ sau khi học."
        ];
        
        const randomFact = psychologyFacts[Math.floor(Math.random() * psychologyFacts.length)];
        speak(`Dưới đây là một kiến thức tâm lý học cho anh iu: ${randomFact}`);
    }

    // 43.79. Tính năng tạo kiến thức môi trường
    else if (checkCmd(cmd, ['kiến thức môi trường', 'biến đổi khí hậu', 'bảo vệ môi trường'])) {
        const environmentalFacts = [
            "Hiệu ứng nhà kính: Là quá trình khí nhà kính hấp thụ và phát tán lại bức xạ nhiệt trong khí quyển.",
            "Thủng tầng Ozon: Lỗ thủng ở tầng ozon do khí CFC gây ra, làm tăng tia UV đến Trái Đất.",
            "Sự axit hóa đại dương: Nước biển hấp thụ CO2 làm giảm pH, ảnh hưởng đến sinh vật biển.",
            "Phá rừng nhiệt đới: Gây mất đa dạng sinh học và góp phần vào biến đổi khí hậu.",
            "Rác thải nhựa: Có thể mất hàng trăm năm để phân hủy, gây ô nhiễm môi trường nghiêm trọng.",
            "Năng lượng tái tạo: Bao gồm năng lượng mặt trời, gió, thủy điện, sinh khối và địa nhiệt.",
            "Dấu chân carbon: Tổng lượng khí nhà kính phát ra từ một cá nhân, tổ chức hoặc sản phẩm.",
            "3R: Reduce (giảm thiểu), Reuse (tái sử dụng), Recycle (tái chế) - nguyên tắc bảo vệ môi trường."
        ];
        
        const randomFact = environmentalFacts[Math.floor(Math.random() * environmentalFacts.length)];
        speak(`Dưới đây là một kiến thức môi trường cho anh iu: ${randomFact}`);
    }

    // 43.80. Tính năng tạo lời chúc ý nghĩa
    else if (checkCmd(cmd, ['lời chúc ý nghĩa', 'chúc mừng', 'lời chúc tốt đẹp', 'chúc ai đó'])) {
        const meaningfulWishes = [
            "Chúc bạn luôn giữ được niềm đam mê và nhiệt huyết trong cuộc sống!",
            "Mong rằng mỗi ngày trôi qua đều mang đến cho bạn những điều tốt đẹp nhất.",
            "Chúc bạn luôn mạnh khỏe, hạnh phúc và thành công trong mọi lĩnh vực!",
            "Hy vọng bạn luôn tìm thấy ánh sáng trong những ngày u ám nhất.",
            "Chúc bạn luôn có đủ can đảm để theo đuổi ước mơ và đủ kiên trì để đạt được chúng.",
            "Mong rằng mọi điều tốt lành sẽ đến với bạn trong hành trình phía trước.",
            "Chúc bạn luôn giữ được nụ cười trên môi và ánh sáng trong tim.",
            "Mong rằng bạn sẽ luôn được bao quanh bởi những con người yêu thương và thấu hiểu."
        ];
        
        const randomWish = meaningfulWishes[Math.floor(Math.random() * meaningfulWishes.length)];
        speak(`Dưới đây là một lời chúc ý nghĩa dành cho anh iu: ${randomWish}`);
    }
}