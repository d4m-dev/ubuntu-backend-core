export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Vẽ thanh Loading Bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x000000, 0.4);
        progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 10);

        const loadingText = this.add.text(width / 2, height / 2 - 50, 'ĐANG TẢI VÙNG ĐẤT NÔNG TRẠI...', {
            fontFamily: 'sans-serif', fontSize: '14px', fill: '#60a5fa', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x8b5cf6, 1);
            progressBar.fillRoundedRect(width / 2 - 150, height / 2 - 15, 300 * value, 30, 8);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // ================= TẢI TÀI NGUYÊN GAME =================
        // Sếp có thể thay đổi link ảnh thành assets tĩnh lưu trên server sau này
        this.load.image('grass_tile', 'https://labs.phaser.io/assets/skies/grass.png');
        this.load.image('particle', 'https://labs.phaser.io/assets/particles/blue.png'); // Đom đóm
        this.load.spritesheet('farmer', 'https://labs.phaser.io/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create() {
        // Tải xong thì tự động chuyển sang Màn hình Game chính
        this.scene.start('GameScene');
    }
}