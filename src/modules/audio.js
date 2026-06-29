window.MusicProModules = window.MusicProModules || {};
window.MusicProModules.audio = {
    // --- AUDIO EFFECTS INTEGRATION ---
    initAudioEffects() {
        // Initialize audio context for spatial audio and other effects
        this.initAudioContext();
        
        // Create audio controls modal with spatial audio controls
        let audioControlsModal = document.getElementById('audio-controls-modal');
        if (!audioControlsModal) {
            audioControlsModal = document.createElement('div');
            audioControlsModal.id = 'audio-controls-modal';
            audioControlsModal.className = 'modal-overlay';
            document.body.appendChild(audioControlsModal);
        }

        // Display audio controls with spatial audio option
        audioControlsModal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; width: 90%; max-height: 85vh; overflow-y: auto; border-radius: 16px; padding: 24px;">
                <h3 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 700; text-align: center;">Cài đặt âm thanh</h3>
                <div class="settings-section">
                    <div class="settings-title">ÂM THANH KHÔNG GIAN</div>
                    <div class="settings-item">
                        <div class="settings-icon"><i class="fa-solid fa-headphones"></i></div>
                        <div class="settings-info">
                            <div class="settings-name">Âm thanh 3D</div>
                            <div class="settings-desc">Tạo hiệu ứng âm thanh không gian sống động</div>
                        </div>
                        <div class="toggle-switch" id="spatial-audio-toggle"></div>
                    </div>
                </div>
                <div class="settings-section">
                    <div class="settings-title">CÂN BẰNG ÂM THANH</div>
                    <div class="eq-controls">
                        <div class="eq-slider">
                            <label>Trầm (60Hz)</label>
                            <input type="range" id="eq-low" min="-12" max="12" value="0">
                            <span id="eq-low-value">0dB</span>
                        </div>
                        <div class="eq-slider">
                            <label>Trung-Trầm (230Hz)</label>
                            <input type="range" id="eq-mid-low" min="-12" max="12" value="0">
                            <span id="eq-mid-low-value">0dB</span>
                        </div>
                        <div class="eq-slider">
                            <label>Trung (910Hz)</label>
                            <input type="range" id="eq-mid" min="-12" max="12" value="0">
                            <span id="eq-mid-value">0dB</span>
                        </div>
                        <div class="eq-slider">
                            <label>Trung-Cao (3.5kHz)</label>
                            <input type="range" id="eq-mid-high" min="-12" max="12" value="0">
                            <span id="eq-mid-high-value">0dB</span>
                        </div>
                        <div class="eq-slider">
                            <label>Caо (14kHz)</label>
                            <input type="range" id="eq-high" min="-12" max="12" value="0">
                            <span id="eq-high-value">0dB</span>
                        </div>
                    </div>
                </div>
                <button class="btn-close-modal" id="btn-close-audio-controls">Đóng</button>
            </div>
        `;

        // Setup spatial audio toggle
        const spatialToggle = document.getElementById('spatial-audio-toggle');
        if (spatialToggle) {
            spatialToggle.onclick = () => {
                this.toggleSpatialAudio();
            };
        }

        // Setup EQ controls
        const eqControls = ['eq-low', 'eq-mid-low', 'eq-mid', 'eq-mid-high', 'eq-high'];
        eqControls.forEach(controlId => {
            const control = document.getElementById(controlId);
            const valueDisplay = document.getElementById(`${controlId}-value`);
            if (control && valueDisplay) {
                control.oninput = () => {
                    valueDisplay.textContent = `${control.value}dB`;
                    this.updateEqualizer();
                };
            }
        });

        const btnCloseAudioControls = document.getElementById('btn-close-audio-controls');
        if (btnCloseAudioControls && audioControlsModal) {
            btnCloseAudioControls.onclick = () => audioControlsModal.classList.remove('show');
            audioControlsModal.onclick = (e) => { if (e.target === audioControlsModal) audioControlsModal.classList.remove('show'); };
        }
    },

    /**
     * Show layout selector modal
     */
    showLayoutSelectorModal() {
        let modal = document.getElementById('layout-selector-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'layout-selector-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px; width: 90%; max-height: 85vh; overflow-y: auto; border-radius: 16px; padding: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h3 style="margin: 0; font-size: 20px; font-weight: 700;">Chọn bố cục</h3>
                        <button class="btn-close-modal" style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-secondary); border: none; color: var(--text-main); display: flex; align-items: center; justify-content: center; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div style="margin-bottom: 24px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="layout-option ${this.state.layoutMode === 'standard' ? 'selected' : ''}" data-layout="standard" style="padding: 15px; border-radius: 12px; background: var(--bg-secondary); cursor: pointer; border: 2px solid ${this.state.layoutMode === 'standard' ? 'var(--primary)' : 'transparent'};">
                                <div style="display: flex; justify-content: center; align-items: center; height: 80px; background: var(--bg-surface); border-radius: 8px; margin-bottom: 10px;">
                                    <div style="width: 60%; height: 10px; background: var(--primary); border-radius: 5px;"></div>
                                </div>
                                <div style="text-align: center; font-weight: 600; color: var(--text-main);">Tiêu chuẩn</div>
                            </div>
                            <div class="layout-option ${this.state.layoutMode === 'compact' ? 'selected' : ''}" data-layout="compact" style="padding: 15px; border-radius: 12px; background: var(--bg-secondary); cursor: pointer; border: 2px solid ${this.state.layoutMode === 'compact' ? 'var(--primary)' : 'transparent'};">
                                <div style="display: flex; justify-content: center; align-items: center; height: 80px; background: var(--bg-surface); border-radius: 8px; margin-bottom: 10px;">
                                    <div style="width: 80%; height: 8px; background: var(--primary); border-radius: 4px; margin-bottom: 5px;"></div>
                                    <div style="width: 70%; height: 8px; background: var(--primary); border-radius: 4px;"></div>
                                </div>
                                <div style="text-align: center; font-weight: 600; color: var(--text-main);">Gọn nhẹ</div>
                            </div>
                            <div class="layout-option ${this.state.layoutMode === 'spacious' ? 'selected' : ''}" data-layout="spacious" style="padding: 15px; border-radius: 12px; background: var(--bg-secondary); cursor: pointer; border: 2px solid ${this.state.layoutMode === 'spacious' ? 'var(--primary)' : 'transparent'};">
                                <div style="display: flex; justify-content: center; align-items: center; height: 80px; background: var(--bg-surface); border-radius: 8px; margin-bottom: 10px; flex-direction: column;">
                                    <div style="width: 50%; height: 12px; background: var(--primary); border-radius: 6px; margin-bottom: 8px;"></div>
                                    <div style="width: 40%; height: 12px; background: var(--primary); border-radius: 6px;"></div>
                                </div>
                                <div style="text-align: center; font-weight: 600; color: var(--text-main);">Rộng rãi</div>
                            </div>
                            <div class="layout-option ${this.state.layoutMode === 'minimal' ? 'selected' : ''}" data-layout="minimal" style="padding: 15px; border-radius: 12px; background: var(--bg-secondary); cursor: pointer; border: 2px solid ${this.state.layoutMode === 'minimal' ? 'var(--primary)' : 'transparent'};">
                                <div style="display: flex; justify-content: center; align-items: center; height: 80px; background: var(--bg-surface); border-radius: 8px; margin-bottom: 10px;">
                                    <div style="width: 70%; height: 6px; background: var(--primary); border-radius: 3px;"></div>
                                </div>
                                <div style="text-align: center; font-weight: 600; color: var(--text-main);">Tối giản</div>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn-close-modal" id="btn-cancel-layout" style="flex: 1; background: rgba(255,255,255,0.05);">Hủy</button>
                        <button id="btn-save-layout" style="flex: 1; background: var(--primary); color: white; padding: 12px; border-radius: 12px; font-weight: 600;">Lưu</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Show the modal
        modal.classList.add('show');

        // Add event listeners
        const layoutOptions = document.querySelectorAll('.layout-option');
        const btnCancel = document.getElementById('btn-cancel-layout');
        const btnSave = document.getElementById('btn-save-layout');

        // Update selection when clicking an option
        layoutOptions.forEach(option => {
            option.onclick = () => {
                // Remove selection from all options
                layoutOptions.forEach(opt => {
                    opt.classList.remove('selected');
                    opt.style.border = '2px solid transparent';
                });

                // Add selection to clicked option
                option.classList.add('selected');
                option.style.border = '2px solid var(--primary)';
            };
        });

        modal.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.onclick = () => modal.classList.remove('show');
        });

        btnCancel.onclick = () => {
            modal.classList.remove('show');
        };

        btnSave.onclick = () => {
            const selectedLayout = document.querySelector('.layout-option.selected')?.dataset.layout || 'standard';
            this.setLayoutMode(selectedLayout);
            modal.classList.remove('show');
            this.showToast('Đã cập nhật bố cục');
        };

        // Close modal when clicking outside
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        };
    },

    /**
     * Set layout mode
     */
    setLayoutMode(layoutMode) {
        this.state.layoutMode = layoutMode;
        localStorage.setItem('layoutMode', layoutMode);

        // Apply layout-specific styles
        const body = document.body;
        body.classList.remove('layout-standard', 'layout-compact', 'layout-spacious', 'layout-minimal');
        body.classList.add(`layout-${layoutMode}`);

        // Update CSS variables based on layout
        switch(layoutMode) {
            case 'compact':
                document.documentElement.style.setProperty('--spacing-multiplier', '0.8');
                break;
            case 'spacious':
                document.documentElement.style.setProperty('--spacing-multiplier', '1.2');
                break;
            case 'minimal':
                document.documentElement.style.setProperty('--spacing-multiplier', '0.9');
                break;
            default:
                document.documentElement.style.setProperty('--spacing-multiplier', '1');
        }

        // Re-render settings to update status indicators
        if (this.state.currentNav === 3) { // Assuming 3 is the settings page
            this.renderSettings();
        }
    },

    /**
     * Thêm/xóa bài hát khỏi danh sách yêu thích.
     */
    toggleFavorite(idx) {
        const id = String(this.state.playlist[idx].id);
        if (this.state.favorites.includes(id)) {
            this.state.favorites = this.state.favorites.filter(x => x !== id);
            this.showToast('Đã xóa khỏi yêu thích');
        } else {
            this.state.favorites.push(id);
            this.showToast('Đã thêm vào yêu thích');
        }
        localStorage.setItem('favorites', JSON.stringify(this.state.favorites));
        this.updateHeartButton();
        this.renderPlaylist();
    }, 
    /**
     * Cập nhật trạng thái nút trái tim (yêu thích) trên giao diện.
     */
    updateHeartButton() {
        if (!this.state.playlist[this.state.currentIndex]) return;
        const isFav = this.state.favorites.includes(String(this.state.playlist[this.state.currentIndex].id));
        const btn = document.getElementById('btn-heart');
        if (!btn) return;

        btn.className = `btn-icon ${isFav ? 'active' : ''}`;
        btn.innerHTML = `<i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>`;
        
        if (isFav) {
            btn.style.color = 'var(--primary)';
        } else {
            btn.style.color = '';
        }
    },

    // --- PLAYBACK CONTROLS ---
    /**
     * Tải một bài hát vào trình phát.
     * @param {number} idx - Chỉ số của bài hát trong playlist.
     * @param {boolean} autoPlay - Tự động phát sau khi tải xong.
     */
    loadSong(idx, autoPlay = true) {
        // Store PiP state to restore after loading new song
        const wasLyricsPiPOpen = this.lyricsPiPWindow !== null || this.isLyricsCanvasActive;
        const wasCanvasPiP = this.isLyricsCanvasActive;

        // Close lyrics PiP temporarily to prevent crashes during song change
        if (this.lyricsPiPWindow) {
            this.lyricsPiPWindow.close();
            this.lyricsPiPWindow = null;
        }

        if (this.lyricsPipVideo && document.pictureInPictureElement === this.lyricsPipVideo) {
            this.lyricsPipVideo.exitPictureInPicture().catch(() => {});
            this.isLyricsCanvasActive = false;
        }

        this.pause(); // Dừng mọi thứ trước khi tải bài hát mới
        this.state.currentIndex = idx;
        this.state.isPreloading = false;
        this.state.nextTrackData = null;
        this.isBackgroundFallback = false;

        const song = this.state.playlist[idx];
        this.updateUI(song);
        this.updateHeartButton();
        this.updateBeatBtnUI();
        this.renderPlaylist();
        this.loadLyrics(song.lyric);
        this.renderContextQueue(); // Update active state in queue
        this.addToHistory(song.id);

        this.currentSongHasVideo = !!(song.vid && !song.vid.includes('..4.mp4') && !song.vid.includes('ERROR'));
        this.updatePiPButtonUI();

        // Tải trước tất cả các nguồn có thể có
        this.video.src = this.currentSongHasVideo ? song.vid : '';
        this.audio.src = song.path;
        this.beatAudio.src = (song.instrumental && song.instrumental !== 'Tạm thời chưa có!') ? song.instrumental : '';

        if (!this.currentSongHasVideo) {
            this.elements.videoMsg.style.display = 'none';
            if (this.state.currentMode === 'video') {
                this.showToast('Video không khả dụng');
                this.switchTab('song');
            }
        }

        if (autoPlay) {
            this.resumeAudioContext(); // Ensure audio context is ready before playing
            this.play();
        }
        this.checkMarquee();
        localStorage.setItem('lastIndex', idx);
        localStorage.setItem('lastTime', 0);

        // Restore PiP if it was open before
        if (wasLyricsPiPOpen) {
            setTimeout(() => {
                if (wasCanvasPiP) {
                    // Try to reopen canvas PiP
                    if (this.lyricsPipVideo && !document.pictureInPictureElement) {
                        this.lyricsPipVideo.play().then(() => {
                            this.lyricsPipVideo.requestPictureInPicture();
                            this.isLyricsCanvasActive = true;
                            this.updatePiPButtonUI();
                        }).catch(() => {});
                    }
                } else {
                    // For document PiP, we can't automatically restore it due to browser policies
                    // Just update the UI to show it's available
                    this.updatePiPButtonUI();
                }
            }, 500); // Wait a bit for the new song to load
        }
    },

    /**
     * Thêm bài hát vào lịch sử nghe.
     */
    addToHistory(id) {
        this.state.history = [String(id), ...this.state.history.filter(x => x !== String(id))].slice(0, 20);
        localStorage.setItem('history', JSON.stringify(this.state.history));
    },

    /**
     * Cập nhật các thông tin hiển thị trên giao diện người dùng (tiêu đề, nghệ sĩ, ảnh bìa).
     */
    updateUI(song) {
        const t = document.getElementById('full-title');
        t.innerText = song.name;
        t.removeAttribute('d');
        t.parentElement.classList.remove('animate');
        document.getElementById('full-artist').innerText = song.artist;
        document.getElementById('mini-title').innerText = song.name;
        document.getElementById('mini-artist').innerText = song.artist;
        document.getElementById('full-artwork').src = song.artwork;
        document.getElementById('mini-img').src = song.artwork;

        // Apply dynamic UI colors based on album artwork if auto theme by cover is enabled
        if (this.state.autoThemeByCover) {
            this.applyDynamicUIColors(song.artwork).then(() => {
                // Fallback to hue if color extraction fails
                this.extractColor(song.artwork).then(color => {
                    if (!color) {
                        const hue = (this.state.currentIndex * 50) % 360;
                        this.elements.ambient.style.background = `radial-gradient(circle, hsl(${hue},70%,50%), transparent 70%)`;
                    }
                });
            });
        }

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.name,
                artist: song.artist,
                artwork: [{ src: song.artwork, sizes: '512x512', type: 'image/jpeg' }]
            });
        }
    },

    /**
     * Trích xuất màu chủ đạo từ ảnh (sử dụng Canvas).
     */
    extractColor(url) {
        return new Promise((resolve) => {
            if (url && url.includes('github.com') && url.includes('/raw/')) {
                url = url.replace('github.com', 'raw.githubusercontent.com').replace('/raw/', '/');
            }
            
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = url;
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 1; canvas.height = 1;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 1, 1);
                    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                    const rgbColor = `rgb(${r}, ${g}, ${b})`;
                    const hexColor = this.rgbToHex(r, g, b);
                    resolve({rgb: rgbColor, hex: hexColor});
                } catch (e) { resolve(null); }
            };
            img.onerror = () => resolve(null);
        });
    },
    
    /**
     * Convert RGB to Hex
     */
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    
    /**
     * Apply dynamic UI colors based on album artwork
     */
    async applyDynamicUIColors(albumArtwork) {
        const colors = await this.extractColor(albumArtwork);
        if (colors) {
            // Update primary color based on album artwork
            document.documentElement.style.setProperty('--primary', colors.rgb);
            document.documentElement.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${colors.hex} 0%, ${this.darkenColor(colors.hex, 30)} 100%)`);

            // Update ambient light to match album color
            if (this.elements.ambient) {
                this.elements.ambient.style.background = `radial-gradient(circle, ${colors.hex}, transparent 70%)`;
            }

            // Apply color to progress bar, volume bar, and other UI elements
            this.applyColorToUIElements(colors.hex);
            
            // Update all range inputs to reflect new color
            this.updateAllRangeInputs();
        }
    },

    // --- PRELOADING LOGIC ---
    /**
     * Kiểm tra và kích hoạt preload bài hát tiếp theo nếu thời gian còn lại ít. */
    checkPreload(currentTime, duration) {
        let threshold = 10; // Mặc định 10s cho mạng nhanh
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn && conn.downlink) {
            // Mạng chậm (< 2Mbps): Preload trước 30s
            if (conn.downlink < 2) threshold = 30;
            // Mạng trung bình (< 5Mbps): Preload trước 20s
            else if (conn.downlink < 5) threshold = 20;
        }

        const timeLeft = duration - currentTime;
        if (timeLeft <= threshold && !this.state.isPreloading) {
            this.state.isPreloading = true;
            this.executePreload();
        }
    },

    /**
     * Thực hiện preload bài hát ti��p theo vào các đối tượng Audio/Video ẩn.
     */
    executePreload() {
        const nextIdx = this.getNextIndex();
        if (nextIdx === -1) return;
        const nextSong = this.state.playlist[nextIdx];
        this.state.nextTrackData = nextSong;
        const nextAudioSrc = this.state.isBeatMode ? nextSong.instrumental : nextSong.path;
        this.preloadAudioAgent.src = nextAudioSrc;
        this.preloadAudioAgent.load(); 
        if (this.state.currentMode === 'video' && nextSong.vid && !nextSong.vid.includes('ERROR')) {
            this.preloadVideoAgent.src = nextSong.vid;
            this.preloadVideoAgent.load();
        }
        console.log(`[Preload] ${nextSong.name}`);
    },

    /**
     * Lấy chỉ số của bài hát tiếp theo trong danh sách phát (có tính đến shuffle).
     */
    getNextIndex() {
        const display = this.getDisplayPlaylist(); if (!display.length) return -1;
        const curr = this.state.playlist[this.state.currentIndex];
        let idx = display.findIndex(t => t.id === curr.id);
        let nextIdx = 0;
        if (this.state.isShuffle) {
            if (display.length > 1) do { nextIdx = Math.floor(Math.random() * display.length); } while (nextIdx === idx);
        } else { if (idx !== -1) nextIdx = idx + 1 >= display.length ? 0 : idx + 1; }
        return this.state.playlist.findIndex(t => t.id === display[nextIdx].id);
    },


};
