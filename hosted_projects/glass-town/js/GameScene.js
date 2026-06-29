export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.otherPlayers = {};
        this.lastMovedTime = 0;
    }

    create() {
        // 1. TẠO BẢN ĐỒ VỚI HIỆU ỨNG ÁNH SÁNG
        // Lợp cỏ liên tục khắp màn hình
        this.bg = this.add.tileSprite(window.innerWidth/2, window.innerHeight/2, window.innerWidth * 2, window.innerHeight * 2, 'grass_tile').setAlpha(0.8);
        
        // Hiệu ứng "Đom đóm" (Particles) bay lơ lửng tạo cảm giác ảo diệu
        const particles = this.add.particles('particle');
        const emitter = particles.createEmitter({
            x: { min: 0, max: window.innerWidth },
            y: { min: 0, max: window.innerHeight },
            lifespan: 6000,
            speedY: { min: -10, max: -30 },
            speedX: { min: -20, max: 20 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            frequency: 300
        });

        // 2. TẠO NHÂN VẬT CHÍNH
        this.mySprite = this.physics.add.sprite(window.innerWidth/2, window.innerHeight/2, 'farmer');
        this.mySprite.setBounce(0.1);
        this.mySprite.setCollideWorldBounds(true);

        // Vẽ bóng đổ dưới chân nhân vật
        this.mySprite.shadow = this.add.ellipse(this.mySprite.x, this.mySprite.y + 20, 24, 8, 0x000000, 0.4);
        
        // Bảng tên
        this.mySprite.nameTag = this.add.text(this.mySprite.x, this.mySprite.y - 35, window.currentUser.sub, {
            fontSize: '12px', fontFamily: 'sans-serif', color: '#a78bfa', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        this.cursors = this.input.keyboard.createCursorKeys();

        // 3. KẾT NỐI WEBSOCKET
        this.connectToServer();
        this.setupUIBindings();
    }

    connectToServer() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const playerKey = window.currentUser.sub.replace(/\s+/g, '_'); 
        this.gameSocket = new WebSocket(`${wsProtocol}${window.location.host}/api/ws/game/${playerKey}`);

        this.gameSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'init') {
                for (let id in data.players) {
                    if (id !== playerKey) this.spawnOtherPlayer(id, data.players[id].x, data.players[id].y);
                }
            } 
            else if (data.type === 'player_joined') {
                if (data.id !== playerKey) this.spawnOtherPlayer(data.id, data.state.x, data.state.y);
            } 
            else if (data.type === 'player_left') {
                if (this.otherPlayers[data.id]) {
                    this.otherPlayers[data.id].shadow.destroy();
                    this.otherPlayers[data.id].nameTag.destroy();
                    this.otherPlayers[data.id].destroy();
                    delete this.otherPlayers[data.id];
                }
            } 
            else if (data.type === 'player_moved') {
                if (data.id !== playerKey && this.otherPlayers[data.id]) {
                    const target = this.otherPlayers[data.id];
                    // Di chuyển mượt mà tới tọa độ mới (Interpolation)
                    this.tweens.add({ targets: target, x: data.x, y: data.y, duration: 100 });
                    this.tweens.add({ targets: target.shadow, x: data.x, y: data.y + 20, duration: 100 });
                    this.tweens.add({ targets: target.nameTag, x: data.x, y: data.y - 35, duration: 100 });
                }
            }
            else if (data.type === 'chat') {
                let targetSprite = data.id === playerKey ? this.mySprite : this.otherPlayers[data.id];
                if(targetSprite) this.showBubbleChat(targetSprite, data.msg);
            }
        };
    }

    spawnOtherPlayer(id, x, y) {
        let sprite = this.physics.add.sprite(x, y, 'farmer');
        sprite.setTint(0xffb3ba); // Đổi tông màu
        sprite.shadow = this.add.ellipse(x, y + 20, 24, 8, 0x000000, 0.4);
        sprite.nameTag = this.add.text(x, y - 35, id.replace(/_/g, ' '), {
            fontSize: '12px', fontFamily: 'sans-serif', color: '#ffffff', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);
        this.otherPlayers[id] = sprite;
    }

    showBubbleChat(sprite, text) {
        if(sprite.chatBubble) { sprite.chatBubble.destroy(); sprite.chatText.destroy(); }
        
        let chatText = this.add.text(sprite.x, sprite.y - 65, text, {
            fontFamily: 'sans-serif', fontSize: '12px', color: '#1e293b', fontStyle: 'bold', wordWrap: { width: 160 }
        }).setOrigin(0.5).setDepth(10);
        
        let padding = 8;
        let bubble = this.add.graphics({ fillStyle: { color: 0xffffff, alpha: 0.95 } }).setDepth(9);
        bubble.fillRoundedRect(chatText.x - chatText.width/2 - padding, chatText.y - chatText.height/2 - padding, chatText.width + padding*2, chatText.height + padding*2, 10);
        
        sprite.chatText = chatText;
        sprite.chatBubble = bubble;

        this.tweens.add({ targets: [chatText, bubble], y: '-=25', alpha: 0, duration: 4000, ease: 'Sine.easeOut', onComplete: () => {
            chatText.destroy(); bubble.destroy();
        }});
    }

    setupUIBindings() {
        const chatInput = document.getElementById('game-chat-input');
        const btnSend = document.getElementById('btn-send-chat');

        const sendChat = () => {
            const msg = chatInput.value.trim();
            if(msg && this.gameSocket.readyState === WebSocket.OPEN) {
                this.gameSocket.send(JSON.stringify({ type: 'chat', msg: msg }));
                chatInput.value = '';
            }
        };

        btnSend.onclick = sendChat;
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChat(); });
    }

    update(time, delta) {
        if(!this.mySprite) return;
        
        let isMoving = false;
        const speed = 250;

        this.mySprite.setVelocity(0);

        if (this.cursors.left.isDown) { this.mySprite.setVelocityX(-speed); isMoving = true; }
        else if (this.cursors.right.isDown) { this.mySprite.setVelocityX(speed); isMoving = true; }
        
        if (this.cursors.up.isDown) { this.mySprite.setVelocityY(-speed); isMoving = true; }
        else if (this.cursors.down.isDown) { this.mySprite.setVelocityY(speed); isMoving = true; }

        if (isMoving) {
            this.mySprite.shadow.setPosition(this.mySprite.x, this.mySprite.y + 20);
            this.mySprite.nameTag.setPosition(this.mySprite.x, this.mySprite.y - 35);
            
            // Đồng bộ lên máy chủ (10 FPS)
            if (time > this.lastMovedTime && this.gameSocket && this.gameSocket.readyState === WebSocket.OPEN) {
                this.gameSocket.send(JSON.stringify({ type: 'move', x: this.mySprite.x, y: this.mySprite.y }));
                this.lastMovedTime = time + 100;
            }
        }
    }
}