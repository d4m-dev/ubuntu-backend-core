import BootScene from './BootScene.js';
import GameScene from './GameScene.js';

// ==========================================
// 1. XÁC THỰC NGƯỜI DÙNG & TẠO BIẾN TOÀN CỤC
// ==========================================
window.currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('d4m_sso_token');
    if (!token) {
        alert("⚠️ Phiên bản lỗi! Sếp vui lòng quay lại Hub đăng nhập.");
        window.location.href = '/hub.html';
        return;
    }

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        window.currentUser = JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        document.getElementById('ui-username').innerText = window.currentUser.sub;
    } catch(e) {
        window.currentUser = { sub: "Khách", id: "guest_" + Math.floor(Math.random() * 1000) };
    }

    // Hiệu ứng mờ dần màn hình chờ
    setTimeout(() => {
        document.getElementById('sso-screen').style.opacity = '0';
        setTimeout(() => document.getElementById('sso-screen').classList.add('hidden'), 500);
        document.getElementById('game-ui').classList.remove('hidden');
        
        // Khởi động Engine Phaser
        launchGame();
    }, 800);
});

// ==========================================
// 2. CẤU HÌNH PHASER 3 ENGINE
// ==========================================
function launchGame() {
    const config = {
        type: Phaser.AUTO,
        parent: 'game-viewport',
        width: window.innerWidth,
        height: window.innerHeight,
        pixelArt: true, // Ép render đồ họa nét căng
        backgroundColor: '#1e293b',
        physics: {
            default: 'arcade',
            arcade: { debug: false }
        },
        // Khai báo 2 Màn chơi (Scene)
        scene: [BootScene, GameScene] 
    };

    const game = new Phaser.Game(config);

    // Xử lý tự động giãn màn hình khi xoay điện thoại
    window.addEventListener('resize', () => {
        game.scale.resize(window.innerWidth, window.innerHeight);
    });
}