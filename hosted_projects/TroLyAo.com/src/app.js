import { processCommand } from './brain.js';

// Cấu hình nhận diện giọng nói
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = 'vi-VN'; // Đặt ngôn ngữ là tiếng Việt
recognition.continuous = true; // Bật chế độ liên tục để tiếp tục nhận diện
recognition.interimResults = true; // Bật kết quả trung gian để hiển thị ngay khi đang nói
recognition.maxAlternatives = 1; // Chỉ cần một kết quả duy nhất

// Biến trạng thái: Máy đang nói hay không
let isSpeaking = false;
let isMicActive = false;

// Biến cho timeout mic
let micTimeout;
const MIC_TIMEOUT_DURATION = 10000; // 10 giây timeout nếu không nghe thấy gì

// Các phần tử DOM
const micBtn = document.getElementById('mic-btn');
const sendBtn = document.getElementById('send-btn');
const textInput = document.getElementById('text-input');
const chatContainer = document.getElementById('chat-container');
const statusEl = document.getElementById('status');
const clearHistoryBtn = document.getElementById('clear-history');
const voiceSelect = document.getElementById('voice-select');
const menuBtn = document.getElementById('menu-btn');
const closeMenuBtn = document.getElementById('close-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const newChatMobile = document.getElementById('new-chat-mobile');
const clearHistoryMobile = document.getElementById('clear-history-mobile');
const voiceSelectMobile = document.getElementById('voice-select-mobile');

// Trạng thái giọng nói máy (Text-to-Speech)
const synth = window.speechSynthesis;

// --- QUẢN LÝ LỊCH SỬ CHAT ---
let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];

function saveHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function addMessageToUI(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);

    // Xử lý xuống dòng cho tin nhắn
    msgDiv.innerHTML = text.replace(/\n/g, '<br>');

    // Chèn tin nhắn trước status để status luôn ở cuối
    if (statusEl && statusEl.parentNode === chatContainer) {
        chatContainer.insertBefore(msgDiv, statusEl);
    } else {
        chatContainer.appendChild(msgDiv);
    }
    chatContainer.scrollTop = chatContainer.scrollHeight; // Tự động cuộn xuống cuối
}

function addMessage(text, sender) {
    // Thêm vào UI
    addMessageToUI(text, sender);

    // Lưu vào lịch sử
    chatHistory.push({ text, sender });
    saveHistory();
}

function loadHistory() {
    chatHistory.forEach(msg => {
        addMessageToUI(msg.text, msg.sender);
    });
    // Thêm tin nhắn chào mừng nếu lịch sử trống
    if (chatHistory.length === 0) {
        const uName = localStorage.getItem('user_name') || "anh iu";
        const aName = localStorage.getItem('assistant_name') || "em";
        addMessageToUI(`Xin chào! ${aName.charAt(0).toUpperCase() + aName.slice(1)} là Trợ lý DeepSeek. ${aName.charAt(0).toUpperCase() + aName.slice(1)} có thể giúp gì cho ${uName} hôm nay?`, "assistant");
    }
}

// --- QUẢN LÝ GIỌNG NÓI ---
let voices = [];

function populateVoiceList() {
    const allVoices = synth.getVoices();
    
    // Lọc các ngôn ngữ theo yêu cầu: Vi_VN, En_US, Ko_KR, Zh_CN_#Hans
    voices = allVoices.filter(voice => {
        const lang = voice.lang.replace('_', '-');
        return lang.includes('vi-VN') || lang.includes('en-US') || lang.includes('ko-KR') || lang.includes('zh-CN');
    });

    voiceSelect.innerHTML = '';
    
    // Sắp xếp: Ưu tiên giọng tiếng Việt lên đầu, sau đó là tiếng Anh, rồi theo tên
    voices.sort((a, b) => {
        const aVi = a.lang.includes('vi');
        const bVi = b.lang.includes('vi');
        const aEn = a.lang.includes('en');
        const bEn = b.lang.includes('en');
        
        if (aVi && !bVi) return -1;
        if (!aVi && bVi) return 1;
        if (aEn && !bEn) return -1;
        if (!aEn && bEn) return 1;
        return a.name.localeCompare(b.name);
    });

    voices.forEach((voice) => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        option.value = voice.name;
        option.setAttribute('data-lang', voice.lang);
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });

    // Cập nhật cho phiên bản mobile nếu tồn tại
    if (voiceSelectMobile) {
        voiceSelectMobile.innerHTML = '';
        voices.forEach((voice) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = voice.name;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelectMobile.appendChild(option);
        });
    }

    // Mặc định chọn giọng tiếng Việt nếu có
    const defaultVoice = voices.find(v => v.lang.includes('vi-VN')) || voices.find(v => v.lang.includes('vi'));
    if (defaultVoice) {
        voiceSelect.value = defaultVoice.name;
        if (voiceSelectMobile) {
            voiceSelectMobile.value = defaultVoice.name;
        }
    }
}

populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

// Hàm nói (Máy trả lời)
function speak(text, htmlContent = null, onEnd = null) {
    // 1. Cập nhật trạng thái ngay lập tức để giao diện phản hồi nhanh
    isSpeaking = true;
    const aName = localStorage.getItem('assistant_name') || "em";
    statusEl.innerText = `${aName.charAt(0).toUpperCase() + aName.slice(1)} đang trả lời`;
    statusEl.classList.add('typing-dots');

    // Hiển thị tin nhắn của máy lên màn hình
    addMessage(htmlContent || text, 'assistant');

    // 2. Chủ động tắt mic để tránh thu âm tiếng của máy
    if (isMicActive) {
        isMicActive = false;
        try { recognition.stop(); } catch(e) {}
        micBtn.classList.remove('listening');
    }

    // 3. Cấu hình giọng nói
    const utterThis = new SpeechSynthesisUtterance(text);
    utterThis.lang = 'vi-VN';
    utterThis.rate = 1; // Tốc độ nói
    utterThis.pitch = 1; // Cao độ

    // Chọn giọng nói từ dropdown
    const selectedOption = voiceSelect.selectedOptions[0]?.getAttribute('data-name');
    if (selectedOption) {
        const selectedVoice = voices.find(v => v.name === selectedOption);
        if (selectedVoice) utterThis.voice = selectedVoice;
    } else {
        // Fallback: Tự chọn giọng tiếng Việt đầu tiên tìm thấy
        const viVoice = voices.find(v => v.lang.includes('vi-VN')) || voices.find(v => v.lang.includes('vi'));
        if (viVoice) utterThis.voice = viVoice;
    }

    // 4. Khi nói xong thì bật lại mic nếu cần
    utterThis.onend = () => {
        if (onEnd && typeof onEnd === 'function') {
            onEnd();
        }

        isSpeaking = false;
        if (isMicActive) {
            // Nếu mic đã được kích hoạt lại trong khi nói
            try { recognition.start(); } catch(e) {}
        } else {
            // Nếu người dùng đã tắt mic trong lúc máy đang nói
            statusEl.innerText = "";
            statusEl.classList.remove('typing-dots');
        }
    };

    // 5. Bắt đầu nói
    if (synth.speaking) synth.cancel(); // Hủy câu nói cũ nếu có
    synth.speak(utterThis);
}

// Xử lý sự kiện nhận diện giọng nói
micBtn.addEventListener('click', () => {
    if (isMicActive) {
        isMicActive = false;
        clearTimeout(micTimeout); // Hủy timeout khi người dùng tắt mic thủ công
        recognition.stop();
        // Làm trống textarea khi tắt mic
        resetTextarea();
    } else {
        isMicActive = true;
        recognition.start();
        // Thiết lập timeout khi bắt đầu nhận diện
        setupMicTimeout();
    }
});

// Hàm thiết lập timeout cho mic
function setupMicTimeout() {
    clearTimeout(micTimeout);
    micTimeout = setTimeout(() => {
        if (isMicActive) {
            // Nếu mic vẫn đang hoạt động sau thời gian timeout
            isMicActive = false;
            recognition.stop();
            statusEl.innerText = "Đã tắt mic do không có âm thanh";
            statusEl.classList.remove('typing-dots');
            micBtn.classList.remove('listening');
            resetTextarea();
        }
    }, MIC_TIMEOUT_DURATION);
}

recognition.onstart = () => {
    statusEl.innerText = "Đang nghe...";
    statusEl.classList.add('typing-dots');
    micBtn.classList.add('listening');
    
    // Làm trống textarea khi bắt đầu nghe để chuẩn bị cho câu nói mới
    textInput.value = '';
    textInput.dispatchEvent(new Event('input')); // Cập nhật chiều cao textarea
};

recognition.onend = () => {
    // Nếu máy đang nói (do hàm speak kích hoạt), BỎ QUA sự kiện này
    // để tránh xung đột giao diện hoặc khởi động lại mic sai thời điểm.
    if (isSpeaking) return;

    // Nếu có transcript chưa xử lý, xử lý nó trước khi đóng mic
    if (finalTranscript.trim()) {
        clearTimeout(timeoutHandler);
        if (isValidTranscript(finalTranscript)) {
            addMessage(finalTranscript, 'user');
            processCommand(finalTranscript, speak);
        } else {
            const aName = localStorage.getItem('assistant_name') || "em";
            addMessage(`${aName.charAt(0).toUpperCase() + aName.slice(1)} không nghe rõ, hãy nói lại...`, 'user');
            speak(`${aName.charAt(0).toUpperCase() + aName.slice(1)} không nghe rõ, hãy nói lại...`);
        }
        finalTranscript = '';
    }
    
    // Luôn làm trống textarea khi tắt mic
    setTimeout(() => {
        resetTextarea();
    }, 100); // Thêm độ trễ nhỏ để đảm bảo xử lý xong trước khi reset

    // Nếu mic đang active mà bị tắt (do im lặng), bật lại ngay
    if (isMicActive) {
        try { recognition.start(); } catch(e) {}
    } else {
        micBtn.classList.remove('listening');
        statusEl.innerText = ""; // Xóa trạng thái khi rảnh để chat gọn gàng
        statusEl.classList.remove('typing-dots');
    }
};

// Biến để theo dõi thời gian và transcript cuối cùng
let finalTranscript = '';
let timeoutHandler;
let lastProcessedText = ''; // Biến để theo dõi văn bản đã xử lý để tránh lặp lại

// Cập nhật văn bản trong khi đang nghe (hiển thị văn bản đang nhận diện)
recognition.onresult = (event) => {
    let currentFinal = '';
    
        // Duyệt qua tất cả các kết quả
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
            // Nếu là kết quả cuối cùng, gán trực tiếp
            currentFinal = transcript; // Gán trực tiếp thay vì cộng dồn để tránh lặp
        } else {
            // Nếu là kết quả trung gian, hiển thị trực tiếp
            textInput.value = transcript;
            
            // Kích hoạt lại sự kiện input để điều chỉnh chiều cao của textarea
            textInput.dispatchEvent(new Event('input'));
        }
    }
    
    // Reset timeout mỗi khi có kết quả (trung gian hoặc cuối cùng)
    if (isMicActive) {
        setupMicTimeout();
    }
    
    // Nếu có kết quả cuối cùng, thêm vào finalTranscript
    if (currentFinal) {
        finalTranscript = currentFinal; // Thay vì cộng dồn, gán trực tiếp để tránh lặp
        
        // Xử lý tin nhắn sau một khoảng thời gian ngắn để đảm bảo người dùng đã ngừng nói
        clearTimeout(timeoutHandler);
        timeoutHandler = setTimeout(() => {
            if (finalTranscript.trim() && finalTranscript !== lastProcessedText) {
                // Kiểm tra xem transcript có hợp lệ không (không phải là tiếng ồn hoặc không nghe rõ)
                if (isValidTranscript(finalTranscript)) {
                    // Kiểm tra xem người dùng có muốn ngưng trò chuyện không
                    if (shouldStopListening(finalTranscript)) {
                        isMicActive = false;
                        micBtn.classList.remove('listening');
                        statusEl.innerText = "Đã tắt mic";
                        statusEl.classList.remove('typing-dots');
                        recognition.stop();
                        resetTextarea(); // Làm trống textarea khi ngưng trò chuyện
                        return;
                    }
                    
                    // Hiển thị kết quả cuối cùng trong input trước khi xử lý
                    textInput.value = finalTranscript;
                    textInput.dispatchEvent(new Event('input'));
                    
                    addMessage(finalTranscript, 'user'); // Hiển thị tin nhắn người dùng
                    processCommand(finalTranscript, speak);
                    
                    // Cập nhật văn bản đã xử lý để tránh lặp lại
                    lastProcessedText = finalTranscript;
                    
                    // Làm trống lại textarea và biến lưu trữ sau khi xử lý
                    finalTranscript = '';
                } else {
                    // Transcript không hợp lệ (quá ngắn, toàn ký tự đặc biệt, hoặc không nghe rõ)
                    const aName = localStorage.getItem('assistant_name') || "em";
                    addMessage(`${aName.charAt(0).toUpperCase() + aName.slice(1)} không nghe rõ, hãy nói lại...`, 'user');
                    speak(`${aName.charAt(0).toUpperCase() + aName.slice(1)} không nghe rõ, hãy nói lại...`);
                    finalTranscript = '';
                }
            } else {
                // Nếu transcript không hợp lệ, vẫn làm trống textarea
                resetTextarea();
                finalTranscript = '';
            }
            
            // Luôn làm trống textarea sau khi xử lý xong để chuẩn bị cho câu nói tiếp theo
            if (isMicActive) {
                textInput.value = '';
                textInput.dispatchEvent(new Event('input'));
            }
        }, 500); // Giảm thời gian chờ để phản hồi nhanh hơn
    }
};

// Hàm kiểm tra transcript có hợp lệ không
function isValidTranscript(transcript) {
    // Loại bỏ khoảng trắng
    const cleanText = transcript.trim();
    
    // Kiểm tra độ dài
    if (cleanText.length < 2) {
        return false;
    }
    
    // Kiểm tra nếu toàn ký tự đặc biệt hoặc số
    const onlySpecialChars = /^[^\w\s\dàáảãạăắằẵẳặâấầẫẩậđéèẻẽẹêếềễểệíìỉĩịóòỏõọôốồỗổộơớờỡởợúùủũụưứừữửựýỳỷỹỵÀÁẢÃẠĂẮẰẴẲẶÂẤẦẪẨẬĐÉÈẺẼẸÊẾỀỄỂỆÍÌỈĨỊÓÒỎÕỌÔỐỒỖỔỘƠỚỜỠỞỢÚÙỦŨỤƯỨỪỮỬỰÝỲỶỸỴ\s]+$/u.test(cleanText);
    if (onlySpecialChars && cleanText.length < 5) {
        return false;
    }
    
    // Transcript hợp lệ
    return true;
}

// Hàm kiểm tra xem người dùng có muốn ngưng trò chuyện bằng mic không
function shouldStopListening(transcript) {
    const normalizedText = transcript.toLowerCase().trim();
    
    // Danh sách các lệnh để ngưng trò chuyện bằng mic
    const stopCommands = [
        'tắt mic',
        'dừng mic',
        'ngừng mic',
        'tắt micro',
        'dừng micro',
        'ngừng micro',
        'dừng lại',
        'thôi',
        'đừng nghe nữa',
        'dừng nghe',
        'tạm biệt',
        'bye',
        'tắt',
        'dừng',
        'ngừng'
    ];
    
    // Kiểm tra xem transcript có chứa lệnh ngưng không
    return stopCommands.some(command => normalizedText.includes(command));
}

recognition.onerror = (event) => {
    if (event.error !== 'no-speech') {
        statusEl.innerText = "Lỗi: " + event.error;
        statusEl.classList.remove('typing-dots');
    }
};

// --- XỬ LÝ NHẬP VĂN BẢN ---
function handleTextInput() {
    const text = textInput.value.trim();
    if (text) {
        addMessage(text, 'user');
        processCommand(text, speak);
        // Làm trống textarea và thiết lập lại chiều cao
        resetTextarea();
    }
}

// Hàm reset textarea
function resetTextarea() {
    textInput.value = '';
    textInput.style.height = 'auto';
    textInput.style.overflowY = 'hidden';
    textInput.dispatchEvent(new Event('input')); // Kích hoạt lại sự kiện input để thiết lập lại chiều cao
}

sendBtn.addEventListener('click', handleTextInput);

textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Ngăn xuống dòng trong textarea
        handleTextInput();
    }
});

// Tự động điều chỉnh chiều cao của textarea khi người dùng gõ
textInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    
    // Giới hạn chiều cao tối đa cho textarea
    if (this.scrollHeight > 150) {
        this.style.overflowY = 'scroll';
    } else {
        this.style.overflowY = 'hidden';
    }
});

// --- XỬ LÝ MENU HAMBURGER ---
menuBtn.addEventListener('click', () => {
    mobileMenu.classList.add('active');
});

closeMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
});

// Đóng menu khi click bên ngoài
document.addEventListener('click', (event) => {
    if (!mobileMenu.contains(event.target) &&
        !menuBtn.contains(event.target) &&
        mobileMenu.classList.contains('active')) {
        mobileMenu.classList.remove('active');
    }
});

// Xử lý nút xóa cuộc trò chuyện hiện tại trên mobile
const deleteCurrentConversationMobile = document.getElementById('delete-current-conversation-mobile');
deleteCurrentConversationMobile.addEventListener('click', () => {
    if(confirm("Anh iu có chắc chắn muốn xóa cuộc trò chuyện hiện tại?")) {
        // Xóa toàn bộ tin nhắn hiện tại
        chatContainer.innerHTML = '';
        // Thêm lại tin nhắn chào mừng
        const uName = localStorage.getItem('user_name') || "anh iu";
        const aName = localStorage.getItem('assistant_name') || "em";
        addMessageToUI(`Xin chào! ${aName.charAt(0).toUpperCase() + aName.slice(1)} là Trợ lý DeepSeek. ${aName.charAt(0).toUpperCase() + aName.slice(1)} có thể giúp gì cho ${uName} hôm nay?`, "assistant");
        // Đóng menu sau khi xóa cuộc trò chuyện
        mobileMenu.classList.remove('active');
    }
});

// Xử lý nút trò chuyện mới trên mobile
newChatMobile.addEventListener('click', () => {
    // Xóa toàn bộ tin nhắn hiện tại
    chatContainer.innerHTML = '';
    // Thêm lại tin nhắn chào mừng
    const uName = localStorage.getItem('user_name') || "anh iu";
    const aName = localStorage.getItem('assistant_name') || "em";
    addMessageToUI(`Xin chào! ${aName.charAt(0).toUpperCase() + aName.slice(1)} là Trợ lý DeepSeek. ${aName.charAt(0).toUpperCase() + aName.slice(1)} có thể giúp gì cho ${uName} hôm nay?`, "assistant");
    // Đóng menu sau khi tạo cuộc trò chuyện mới
    mobileMenu.classList.remove('active');
});

// --- XÓA LỊCH SỬ ---
clearHistoryBtn.addEventListener('click', () => {
    if(confirm("Anh iu có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?")) {
        chatHistory = [];
        saveHistory();
        chatContainer.innerHTML = '';
        addMessageToUI("Đã xóa lịch sử. Xin chào lại từ đầu!", "assistant");
    }
});

// Xử lý xóa lịch sử từ menu di động
if (clearHistoryMobile) {
    clearHistoryMobile.addEventListener('click', () => {
        if(confirm("Anh iu có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?")) {
            chatHistory = [];
            saveHistory();
            chatContainer.innerHTML = '';
            addMessageToUI("Đã xóa lịch sử. Xin chào lại từ đầu!", "assistant");
            mobileMenu.classList.remove('active'); // Đóng menu sau khi xóa
        }
    });
}

// Function to create and show modals
function createAndShowModal(title, content) {
    // Remove any existing modal to prevent duplicates
    const existingModal = document.getElementById('dynamic-modal');
    if(existingModal) existingModal.remove();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'dynamic-modal';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'modal-header';
    
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-modal';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => {
        document.body.removeChild(overlay);
    };
    
    header.appendChild(titleElement);
    header.appendChild(closeBtn);
    
    // Create body
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.innerHTML = `<p>${content}</p>`;
    
    // Add theme switcher if it's the settings modal
    if(title === "Cài đặt") {
        body.innerHTML += `
            <div class="settings-option">
                <label for="user-name-input">Tên bạn (Trợ lý gọi bạn là):</label>
                <input type="text" id="user-name-input" placeholder="Ví dụ: Anh iu" value="${localStorage.getItem('user_name') || 'Anh iu'}" style="padding: 8px; border-radius: 5px; border: 1px solid #ccc; width: 100%; box-sizing: border-box; margin-top: 5px; margin-bottom: 10px;">
            </div>
            <div class="settings-option">
                <label for="assistant-name-input">Tên trợ lý (Trợ lý xưng là):</label>
                <input type="text" id="assistant-name-input" placeholder="Ví dụ: Em" value="${localStorage.getItem('assistant_name') || 'Em'}" style="padding: 8px; border-radius: 5px; border: 1px solid #ccc; width: 100%; box-sizing: border-box; margin-top: 5px; margin-bottom: 10px;">
            </div>
            <div class="settings-option" style="text-align: center; margin-bottom: 15px;">
                <button id="save-names-btn" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Lưu tên gọi</button>
            </div>
            <div class="settings-option">
                <label for="voice-select-mobile">Chọn giọng đọc:</label>
                <select id="voice-select-mobile" title="Cài đặt giọng nói"></select>
            </div>
            <div class="settings-option">
                <label>Chế độ giao diện:</label>
                <div class="theme-switcher">
                    <button id="light-theme-btn" class="theme-btn">Sáng</button>
                    <button id="dark-theme-btn" class="theme-btn">Tối</button>
                </div>
            </div>
        `;
        
        // Add theme switching functionality
        setTimeout(() => {
            const lightThemeBtn = document.getElementById('light-theme-btn');
            const darkThemeBtn = document.getElementById('dark-theme-btn');
            const voiceSelectInModal = document.getElementById('voice-select-mobile');
            const saveNamesBtn = document.getElementById('save-names-btn');
            
            if (saveNamesBtn) {
                saveNamesBtn.addEventListener('click', () => {
                    const userName = document.getElementById('user-name-input').value.trim();
                    const assistantName = document.getElementById('assistant-name-input').value.trim();
                    if (userName) localStorage.setItem('user_name', userName);
                    if (assistantName) localStorage.setItem('assistant_name', assistantName);
                    alert('Đã lưu cài đặt tên gọi!');
                });
            }
            
            if(lightThemeBtn) {
                lightThemeBtn.addEventListener('click', () => {
                    applyTheme('light');
                });
            }
            
            if(darkThemeBtn) {
                darkThemeBtn.addEventListener('click', () => {
                    applyTheme('dark');
                });
            }
            
            // Populate voice options in modal if available
            if(voiceSelectInModal && typeof voiceSelect !== 'undefined' && voiceSelect) {
                voiceSelectInModal.innerHTML = '';
                for (let i = 0; i < voiceSelect.options.length; i++) {
                    const option = voiceSelect.options[i];
                    const newOption = document.createElement('option');
                    newOption.value = option.value;
                    newOption.text = option.text;
                    newOption.selected = option.selected;
                    voiceSelectInModal.appendChild(newOption);
                }
                
                // Sync voice selection
                voiceSelectInModal.addEventListener('change', () => {
                    if(voiceSelect) {
                        voiceSelect.value = voiceSelectInModal.value;
                    }
                });
            }
        }, 10);
    }
    
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    overlay.appendChild(modalContent);
    
    // Close modal when clicking outside
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
    
    document.body.appendChild(overlay);
}

// Đồng bộ hóa các lựa chọn giọng nói giữa desktop và mobile
voiceSelect.addEventListener('change', () => {
    if (voiceSelectMobile) {
        voiceSelectMobile.value = voiceSelect.value;
    }
});

if (voiceSelectMobile) {
    voiceSelectMobile.addEventListener('change', () => {
        voiceSelect.value = voiceSelectMobile.value;
    });
}

// Thử tự động chạy khi tải trang
window.addEventListener('load', () => {
    loadHistory();

    // Đồng bộ các phần tử voiceSelect khi tải trang
    if (voiceSelect && voiceSelectMobile) {
        // Sao chép các tùy chọn từ voiceSelect chính sang mobile
        voiceSelectMobile.innerHTML = '';
        for (let i = 0; i < voiceSelect.options.length; i++) {
            const option = voiceSelect.options[i];
            const newOption = document.createElement('option');
            newOption.value = option.value;
            newOption.text = option.text;
            newOption.selected = option.selected;
            voiceSelectMobile.appendChild(newOption);
        }
    }
    
    // Apply saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Update theme buttons if they exist in the modal
    setTimeout(() => {
        const lightThemeBtn = document.getElementById('light-theme-btn');
        const darkThemeBtn = document.getElementById('dark-theme-btn');
        
        if (savedTheme === 'light' && lightThemeBtn) {
            lightThemeBtn.classList.add('active');
            if (darkThemeBtn) darkThemeBtn.classList.remove('active');
        } else if (savedTheme === 'dark' && darkThemeBtn) {
            darkThemeBtn.classList.add('active');
            if (lightThemeBtn) lightThemeBtn.classList.remove('active');
        }
    }, 100);
    
    // Setup event listeners for mobile menu items after DOM is loaded
    setupMobileMenuEventListeners();
});

// Function to setup mobile menu event listeners
function setupMobileMenuEventListeners() {
    // Xử lý nút cài đặt trên mobile
    const settingsMobile = document.getElementById('settings-mobile');
    if(settingsMobile) {
        settingsMobile.addEventListener('click', () => {
            // Lấy danh sách lệnh đã học từ localStorage
            const learned = JSON.parse(localStorage.getItem('brain_learned_commands')) || {};
            const learnedKeys = Object.keys(learned);
            let learnedHtml = '';
            
            if (learnedKeys.length > 0) {
                const uName = localStorage.getItem('user_name') || "anh iu";
                learnedHtml = `<div style="margin-top: 20px; border-top: 1px solid rgba(128,128,128,0.2); padding-top: 15px;"><p><strong>Các lệnh ${uName} đã dạy:</strong></p><ul style="margin-left: 0; padding-left: 0; list-style: none; margin-bottom: 10px;">`;
                learnedKeys.forEach(key => {
                    learnedHtml += `<li style="margin-bottom: 8px; padding: 8px; background: rgba(128,128,128,0.1); border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="flex: 1; margin-right: 10px; word-break: break-word;">"${key}" ➔ "${learned[key]}"</span>
                        <button class="btn-edit-learned" data-key="${key}" style="padding: 4px 8px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; white-space: nowrap;"><i class="fa-solid fa-pen"></i> Sửa</button>
                    </li>`;
                });
                learnedHtml += '</ul>';
                learnedHtml += '<div style="text-align: center; margin-top: 15px;"><button id="btn-clear-learned" style="padding: 8px 15px; background-color: #ff4444; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;"><i class="fa-solid fa-trash"></i> Xóa tất cả lệnh đã học</button></div></div>';
            } else {
                const uName = localStorage.getItem('user_name') || "anh iu";
                const aName = localStorage.getItem('assistant_name') || "em";
                learnedHtml = `<div style="margin-top: 20px; border-top: 1px solid rgba(128,128,128,0.2); padding-top: 15px;"><p><em>Chưa có lệnh nào được học. ${uName} có thể dạy ${aName} bằng cách nói: "Học lệnh [A] trả lời [B]".</em></p></div>`;
            }

            // Create modal for settings
            const uName = localStorage.getItem('user_name') || "anh iu";
            createAndShowModal("Cài đặt", `Tùy chỉnh cài đặt cho ứng dụng của ${uName}.` + learnedHtml);
            mobileMenu.classList.remove('active'); // Đóng menu khi mở modal

            // Xử lý sự kiện cho nút xóa lệnh đã học
            const btnClear = document.getElementById('btn-clear-learned');
            if (btnClear) {
                btnClear.addEventListener('click', () => {
                    if (confirm("Anh iu có chắc chắn muốn xóa tất cả các lệnh đã học không?")) {
                        localStorage.removeItem('brain_learned_commands');
                        alert("Đã xóa tất cả lệnh đã học.");
                        const overlay = document.getElementById('dynamic-modal');
                        if (overlay) document.body.removeChild(overlay);
                    }
                });
            }

            // Xử lý sự kiện cho các nút sửa lệnh
            const editBtns = document.querySelectorAll('.btn-edit-learned');
            editBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.getAttribute('data-key');
                    const currentResponse = learned[key];
                    const newResponse = prompt(`Nhập câu trả lời mới cho lệnh "${key}":`, currentResponse);
                    
                    if (newResponse !== null && newResponse.trim() !== "") {
                        learned[key] = newResponse.trim();
                        localStorage.setItem('brain_learned_commands', JSON.stringify(learned));
                        
                        // Cập nhật giao diện
                        const span = btn.previousElementSibling;
                        if (span) {
                            span.textContent = `"${key}" ➔ "${newResponse.trim()}"`;
                        }
                    }
                });
            });
        });
    }

    // Xử lý các mục lịch sử trong menu di động
    const todayItem = document.querySelector('.mobile-history-item.today');
    const yesterdayItem = document.querySelector('.mobile-history-item.yesterday');
    const allConversationsItem = document.querySelector('.mobile-history-item.all-conversations');

    if(todayItem) {
        todayItem.addEventListener('click', () => {
            // Create modal for today's conversations
            createAndShowModal("Hôm nay", "Hiển thị các cuộc trò chuyện trong ngày hôm nay. Anh iu có thể xem, tìm kiếm hoặc quản lý các cuộc trò chuyện đã diễn ra trong ngày hôm nay.");
            mobileMenu.classList.remove('active');
        });
    }

    if(yesterdayItem) {
        yesterdayItem.addEventListener('click', () => {
            // Create modal for yesterday's conversations
            createAndShowModal("Hôm qua", "Hiển thị các cuộc trò chuyện trong ngày hôm qua. Anh iu có thể xem lại nội dung các cuộc trò chuyện đã diễn ra vào ngày hôm qua.");
            mobileMenu.classList.remove('active');
        });
    }

    if(allConversationsItem) {
        allConversationsItem.addEventListener('click', () => {
            // Create modal for all conversations
            createAndShowModal("Tất cả cuộc trò chuyện", "Hiển thị danh sách tất cả các cuộc trò chuyện đã lưu. Anh iu có thể tìm kiếm, lọc hoặc xóa các cuộc trò chuyện theo nhu cầu.");
            mobileMenu.classList.remove('active');
        });
    }

    // Xử lý nút người dùng trong menu di động
    const mobileUserInfoForListener = document.querySelector('.mobile-user-info');
    if(mobileUserInfoForListener) {
        mobileUserInfoForListener.addEventListener('click', () => {
            // Create modal for user info
            createAndShowModal("Người dùng", "Hiển thị thông tin tài khoản người dùng. Anh iu có thể cập nhật hồ sơ, cài đặt bảo mật và tùy chọn cá nhân.");
            mobileMenu.classList.remove('active');
        });
    }

    // Tạo và xử lý nút Trợ giúp (nếu chưa có)
    let helpMobile = document.getElementById('help-mobile');
    if (!helpMobile) {
        const settingsMobile = document.getElementById('settings-mobile');
        if (settingsMobile && settingsMobile.parentNode) {
            // Clone nút cài đặt để giữ nguyên style
            helpMobile = settingsMobile.cloneNode(true);
            helpMobile.id = 'help-mobile';
            helpMobile.innerHTML = '<i class="fa-solid fa-circle-question"></i> <span>Trợ giúp</span>';
            // Chèn nút Trợ giúp vào sau nút Cài đặt
            settingsMobile.parentNode.insertBefore(helpMobile, settingsMobile.nextSibling);
        }
    }

    if (helpMobile) {
        helpMobile.addEventListener('click', () => {
            const helpContent = `
                <div style="text-align: left; line-height: 1.6;">
                    <p><strong>Cách sử dụng:</strong></p>
                    <ul style="margin-left: 20px; margin-bottom: 10px;">
                        <li>Nhấn biểu tượng <strong>Micro</strong> để nói lệnh.</li>
                        <li>Hoặc nhập tin nhắn và nhấn <strong>Gửi</strong>.</li>
                    </ul>
                    <p><strong>Một số lệnh mẫu:</strong> "Mấy giờ rồi?", "Thời tiết Hà Nội", "Mở Youtube", "Kể chuyện cười", "Tìm kiếm [từ khóa]"...</p>
                </div>
            `;
            createAndShowModal("Hướng dẫn sử dụng", helpContent);
            mobileMenu.classList.remove('active');
        });
    }
}

// Function to apply theme
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update active states of theme buttons if they exist
    const lightThemeBtn = document.getElementById('light-theme-btn');
    const darkThemeBtn = document.getElementById('dark-theme-btn');
    
    if (theme === 'light' && lightThemeBtn) {
        lightThemeBtn.classList.add('active');
        if (darkThemeBtn) darkThemeBtn.classList.remove('active');
    } else if (theme === 'dark' && darkThemeBtn) {
        darkThemeBtn.classList.add('active');
        if (lightThemeBtn) lightThemeBtn.classList.remove('active');
    }
}