let timerInterval;          
let totalTimeLeft;          
let currentQuestion = null; 
let tempMode = 'normal';    
const STORAGE_KEY = 'vua_tieng_viet_leaderboard_v1';
let audioCtx = null;

function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone({ frequency = 440, duration = 0.18, type = 'sine', gain = 0.12 }) {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const volume = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    volume.gain.value = gain;
    oscillator.connect(volume);
    volume.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

function playSuccessSound() {
    playTone({ frequency: 740, duration: 0.12, type: 'triangle', gain: 0.12 });
    setTimeout(() => playTone({ frequency: 980, duration: 0.14, type: 'triangle', gain: 0.12 }), 90);
}

function playWrongSound() {
    playTone({ frequency: 220, duration: 0.2, type: 'sawtooth', gain: 0.1 });
}

function playSkipSound() {
    playTone({ frequency: 420, duration: 0.12, type: 'square', gain: 0.08 });
}

function playTimeoutSound() {
    playTone({ frequency: 180, duration: 0.25, type: 'sawtooth', gain: 0.12 });
}

function formatTime(seconds) {
    if (seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function selectMode(mode) {
    tempMode = mode;
    const modeText = mode === 'normal' 
        ? '🏆 CHẾ ĐỘ: ĐUA TOP (Tính giờ & Lưu điểm)' 
        : '🧘 CHẾ ĐỘ: LUYỆN TẬP (Thư giãn)';
    document.getElementById('mode-display').innerText = modeText;
    showScreen('screen-difficulty');
}

function startGame(difficulty) {
    initAudioContext();
    RiddleGame.start(tempMode, difficulty);
    showScreen('screen-game');
    updateScoreUI();
    
    totalTimeLeft = RiddleGame.getTotalTime();
    clearInterval(timerInterval);

    if (RiddleGame.mode !== 'practice') {
        updateTimerUI(); 
        startTotalTimer();
    } else {
        document.getElementById('game-timer').innerText = "∞"; 
        document.getElementById('game-timer').style.color = "#3498db";
    }
    loadNextQuestion();
}

function startTotalTimer() {
    timerInterval = setInterval(() => {
        totalTimeLeft--;
        updateTimerUI();
        if (totalTimeLeft <= 0) {
            clearInterval(timerInterval);
            handleGameOverTimeout(); 
        }
    }, 1000);
}

function updateTimerUI() {
    const el = document.getElementById('game-timer');
    el.innerText = formatTime(totalTimeLeft);
    if (totalTimeLeft <= 60) {
        el.style.color = 'red';
        el.style.fontWeight = '900';
    } else {
        el.style.color = '#e74c3c';
    }
}

function updateScoreUI() {
    document.getElementById('game-score').innerText = `Điểm: ${RiddleGame.score}`;
}

function loadNextQuestion() {
    currentQuestion = RiddleGame.getNextQuestion();
    document.getElementById('question-text').innerText = currentQuestion.question;
    const hintEl = document.getElementById('hint-text');
    hintEl.innerText = currentQuestion.hint ? `(Gợi ý: ${currentQuestion.hint})` : "";
    const input = document.getElementById('answer-input');
    input.value = '';
    input.classList.remove('answer-input--correct', 'answer-input--wrong');
    input.disabled = false;
    input.focus();
    input.onkeydown = function(e) {
        if(e.key === 'Enter') handleAnswer();
    };
}

function handleAnswer() {
    const val = document.getElementById('answer-input').value;
    if (!val) return; 
    const result = RiddleGame.submitAnswer(val, currentQuestion);
    const input = document.getElementById('answer-input');
    input.classList.remove('answer-input--correct', 'answer-input--wrong');
    input.classList.add(result.correct ? 'answer-input--correct' : 'answer-input--wrong');
    input.disabled = true;
    initAudioContext();
    if (result.correct) {
        playSuccessSound();
    } else {
        playWrongSound();
    }
    updateScoreUI();
    setTimeout(() => {
        loadNextQuestion();
    }, 700);
}

function handleSkip() {
    const result = RiddleGame.skipQuestion();
    initAudioContext();
    playSkipSound();
    updateScoreUI();
    loadNextQuestion();
}

function handleGameOverTimeout() {
    initAudioContext();
    playTimeoutSound();
    endGame();
}

function endGame() {
    clearInterval(timerInterval); 
    if (RiddleGame.mode === 'practice') {
        showScreen('screen-start');
    } else {
        document.getElementById('end-score').innerText = RiddleGame.score;
        showScreen('screen-end');
    }
}

function saveScoreAndExit() {
    const nameInput = document.getElementById('player-name').value.trim();
    const name = nameInput || "Ẩn danh"; 
    
    const newRecord = {
        name: name,
        score: RiddleGame.score,
        difficulty: RiddleGame.difficulty, 
        date: new Date().toLocaleDateString() 
    };

    let highScores = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    highScores.push(newRecord);
    highScores.sort((a, b) => b.score - a.score);
    if (highScores.length > 10) {
        highScores = highScores.slice(0, 10);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(highScores));
    showLeaderboard();
}

function showLeaderboard() {
    const list = document.getElementById('rank-list');
    list.innerHTML = ""; 
    const highScores = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    if (highScores.length === 0) {
        list.innerHTML = "<li style='padding:20px; color:#999; text-align:center'>Chưa có cao thủ nào. Hãy là người đầu tiên!</li>";
    } else {
        highScores.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = `rank-item top-${index + 1}`; 
            let rankIcon = `#${index + 1}`;
            if(index === 0) rankIcon = '🥇';
            if(index === 1) rankIcon = '🥈';
            if(index === 2) rankIcon = '🥉';
            const diffLabel = item.difficulty === 'hard' ? 'Khó' : (item.difficulty === 'medium' ? 'Vừa' : 'Dễ');

            li.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.2em; width:30px">${rankIcon}</span>
                    <div>
                        <div style="font-weight:bold; color:#333">${item.name}</div>
                        <small style="color:#999">${diffLabel} - ${item.date}</small>
                    </div>
                </div>
                <div style="font-weight:bold; color:#27ae60; font-size:1.2em;">${item.score}đ</div>
            `;
            list.appendChild(li);
        });
    }
    showScreen('screen-leaderboard');
}