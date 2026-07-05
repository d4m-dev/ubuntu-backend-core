class MusicPro {
    constructor() {
        const savedVol = localStorage.getItem('volume');
        this.state = {
            playlist: [], currentIndex: 0, isPlaying: false, isShuffle: false, repeatMode: 0,
            currentMode: 'audio', volume: savedVol !== null ? parseFloat(savedVol) : 0.8, isMuted: false, 
            theme: this.getInitialTheme(),
            favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
            history: JSON.parse(localStorage.getItem('history') || '[]'),
            currentFilter: 'all', searchQuery: '', sortBy: 'id', currentNav: 0, isBeatMode: false,
            currentUserPlaylistIndex: -1,
            isPreloading: false, nextTrackData: null,
            sleepTimer: null, sleepTimeLeft: parseInt(localStorage.getItem('sleepTimeLeft') || '0'), sleepInterval: null, downloadTargetIndex: 0,
            customPrimaryColor: localStorage.getItem('customPrimaryColor') || null,
            fontFamily: localStorage.getItem('fontFamily') || 'Urbanist',
            fontWeight: localStorage.getItem('fontWeight') || '400',
            layoutMode: localStorage.getItem('layoutMode') || 'standard',
            autoThemeByCover: localStorage.getItem('autoThemeByCover') === 'true',
            userPlaylists: JSON.parse(localStorage.getItem('userPlaylists') || '[]'),
            isProUnlocked: localStorage.getItem('isProUnlocked') === 'true',
            smartSleepEnabled: localStorage.getItem('smartSleepEnabled') === 'true',
            smartSleepFadeOutTime: parseInt(localStorage.getItem('smartSleepFadeOutTime')) || 30
        };
        this.playlistSlideshows = [];

        // Initialize spatial audio state
        this.state.spatialAudioEnabled = false;

        // Initialize equalizer state
        this.state.equalizerEnabled = false;

        // Initialize audio context for volume control and spatial audio
        this.audioContext = null;
        this.sourceNodes = { audio: null, video: null, beat: null };
        this.effectNodes = { gain: null, panner: null }; 
        this.isQueueVisible = false;

        // Apply saved customization settings on initialization
        if (this.state.customPrimaryColor) {
            document.documentElement.style.setProperty('--primary', this.state.customPrimaryColor);
            document.documentElement.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${this.state.customPrimaryColor} 0%, ${this.darkenColor(this.state.customPrimaryColor, 30)} 100%)`);
            this.applyColorToUIElements(this.state.customPrimaryColor);
        }

        if (this.state.fontFamily) {
            document.documentElement.style.setProperty('font-family', `${this.state.fontFamily}, sans-serif`);
            document.documentElement.style.setProperty('font-weight', this.state.fontWeight);
            if (this.state.fontFamily !== 'Urbanist') {
                setTimeout(() => {
                    this.loadLocalFont(this.state.fontFamily);
                    this.applyFontToAllElements(this.state.fontFamily, this.state.fontWeight);
                }, 0);
            } else {
                setTimeout(() => {
                    this.applyFontToAllElements(this.state.fontFamily, this.state.fontWeight);
                }, 0);
            }
        }

        if (this.state.layoutMode) {
            document.body.classList.add(`layout-${this.state.layoutMode}`);
        }
        
        this.virtual = { displayList: [], rowHeight: 75, itemsPerRow: 1, buffer: 4, isTicking: false, lastStartRow: -1, lastEndRow: -1 };
        this.lyricsPiPWindow = null;
        this.isLyricsCanvasActive = false;
        this.lyricsCanvas = null;
        this.lyricsPipVideo = null;
        this.croppedImageDataUrl = null;

        this.isBackgroundFallback = false;
        this.currentSongHasVideo = false;

        // 🌟 BỔ SUNG: NÂNG CẤP ĐỐI TƯỢNG AUDIO BẢO VỆ CHẠY NGẦM VÀ CACHE 🌟
        this.beatAudio = new Audio();
        this.beatAudio.preload = "auto";
        this.beatAudio.setAttribute('playsinline', '');
        this.beatAudio.setAttribute('webkit-playsinline', '');
        this.beatAudio.setAttribute('x-webkit-airplay', 'allow'); // Hỗ trợ Apple

        this.audio = new Audio();
        this.audio.preload = "auto"; 
        this.audio.setAttribute('playsinline', '');
        this.audio.setAttribute('webkit-playsinline', '');
        this.audio.setAttribute('x-webkit-airplay', 'allow');

        this.preloadAudioAgent = new Audio();
        this.preloadAudioAgent.setAttribute('playsinline', '');
        this.preloadAudioAgent.setAttribute('webkit-playsinline', '');

        this.preloadVideoAgent = document.createElement('video');
        this.preloadVideoAgent.preload = "auto";
        this.preloadVideoAgent.muted = true;
        this.preloadVideoAgent.setAttribute('playsinline', '');
        this.preloadVideoAgent.setAttribute('webkit-playsinline', '');

        this.video = document.getElementById('video-element');
        this.lyricsData = [];
        
        this.elements = {
            loader: document.getElementById('loader'), list: document.getElementById('track-list'), scrollContainer: document.getElementById('main-scroll'),
            overlay: document.getElementById('player-overlay'), mini: document.getElementById('mini-player'),
            toast: document.getElementById('toast'), toastMsg: document.getElementById('toast-msg'),
            playBtnMain: document.getElementById('btn-main-play'), playBtnMini: document.getElementById('btn-mini-play'),
            seekBar: document.getElementById('seek-bar'), miniFill: document.getElementById('mini-fill'),
            ambient: document.getElementById('ambient-light'), videoMsg: document.getElementById('video-msg'),
            searchInput: document.getElementById('search-input'), clearSearchBtn: document.getElementById('btn-clear-search'),
            btnOptions: document.getElementById('btn-options'), optionsMenu: document.getElementById('options-menu'),
            btnSwitchBeat: document.getElementById('btn-switch-beat'),
            btnOpenTimer: document.getElementById('btn-open-timer'),
            timerModal: document.getElementById('timer-modal'), btnCloseTimer: document.getElementById('btn-close-timer'),
            timerMenuText: document.getElementById('timer-menu-text'),
            dlModal: document.getElementById('download-modal'),
            btnCloseDl: document.getElementById('btn-close-dl'),
            dlTitle: document.getElementById('dl-song-title'),
            lyricsContainer: document.getElementById('lyrics-content')
        };

        this.init();

        // 🌟 BỔ SUNG: BẪY KÍCH HOẠT ÂM THANH NGẦM CHUYÊN NGHIỆP 🌟
        const unlockAudioEngine = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            } else if (!this.audioContext) {
                if (typeof this.initAudioContext === 'function') this.initAudioContext();
                if (typeof this.initAudioEffects === 'function') this.initAudioEffects();
            }
            
            // Kích hoạt một âm thanh câm để hệ điều hành cấp phép "Chạy ngầm"
            const silentAudio = new Audio('data:audio/mp3;base64,//MkxAA....'); 
            silentAudio.volume = 0;
            silentAudio.play().then(() => {
                document.removeEventListener('click', unlockAudioEngine);
                document.removeEventListener('touchstart', unlockAudioEngine);
                console.log("🔊 Cỗ máy âm thanh đã được cấp thẻ VIP chạy ngầm!");
            }).catch(e => console.log("Chưa unlock được Audio: ", e));
        };

        document.addEventListener('click', unlockAudioEngine, { once: true, passive: true });
        document.addEventListener('touchstart', unlockAudioEngine, { once: true, passive: true });
    }
}

Object.assign(MusicPro.prototype, window.MusicProModules.ui);
Object.assign(MusicPro.prototype, window.MusicProModules.audio);
Object.assign(MusicPro.prototype, window.MusicProModules.events);
Object.assign(MusicPro.prototype, window.MusicProModules.utils);
Object.assign(MusicPro.prototype, window.MusicProModules.lyrics);
Object.assign(MusicPro.prototype, window.MusicProModules.other);

window.app = new MusicPro();