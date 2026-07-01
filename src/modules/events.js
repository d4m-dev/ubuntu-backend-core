window.MusicProModules = window.MusicProModules || {};
window.MusicProModules.events = {
    // --- EVENT HANDLERS ---
    setupEventListeners() {
        // Virtual Scroll & Auto Hide Search Bar
        let lastScrollTop = 0;
        const searchWrapper = this.elements.searchInput.closest('.search-wrapper') || this.elements.searchInput.parentElement;

        this.elements.scrollContainer.addEventListener('scroll', () => {
            this.onScroll();

            const scrollTop = this.elements.scrollContainer.scrollTop;
            if (searchWrapper && Math.abs(scrollTop - lastScrollTop) > 5) {
                if (scrollTop > lastScrollTop && scrollTop > 60) {
                    searchWrapper.classList.add('hidden');
                } else if (scrollTop < lastScrollTop) {
                    searchWrapper.classList.remove('hidden');
                }
            }
            lastScrollTop = Math.max(0, scrollTop);
        }, { passive: true });

        window.addEventListener('resize', () => { clearTimeout(this.resizeTimer); this.resizeTimer = setTimeout(() => this.renderPlaylist(), 200); });

        window.addEventListener('beforeunload', () => {
            // Only save position if currently playing
            if (this.state.isPlaying) {
                const t = this.currentSongHasVideo ? this.video.currentTime : (this.state.isBeatMode ? this.beatAudio.currentTime : this.audio.currentTime);
                localStorage.setItem('lastIndex', this.state.currentIndex);
                localStorage.setItem('lastTime', t);
            } else {
                // Clear the saved position if not playing
                localStorage.removeItem('lastIndex');
                localStorage.removeItem('lastTime');
            }

            // Close spatial audio context if active
            if (this.state.spatialAudioEnabled && this.audioContext) {
                this.audioContext.close();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (this.elements.overlay.classList.contains('open')) {
                if (e.key === 'Escape') {
                    this.elements.overlay.classList.remove('open');
                    return;
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    const tabs = ['song', 'video', 'lyrics'];
                    const idx = tabs.indexOf(this.state.currentMode);
                    this.switchTab(tabs[(idx + 1) % tabs.length]);
                    return;
                }
            }

            if (e.code === 'Space') {
                e.preventDefault(); this.togglePlay();
            } else if (e.code === 'ArrowRight') {
                const t = this.currentSongHasVideo ? this.video.currentTime : (this.state.isBeatMode ? this.beatAudio.currentTime : this.audio.currentTime);
                this.seek(t + 5);
            } else if (e.code === 'ArrowLeft') {
                const t = this.currentSongHasVideo ? this.video.currentTime : (this.state.isBeatMode ? this.beatAudio.currentTime : this.audio.currentTime);
                this.seek(t - 5);
            } else if (e.code === 'KeyM') {
                this.state.isMuted = !this.state.isMuted;
                const v = this.state.isMuted ? 0 : this.state.volume;
                this.setVolume(this.state.volume, this.state.isMuted);
                this.showToast(this.state.isMuted ? 'Đã tắt tiếng' : 'Đã bật tiếng');
            } else if (e.code === 'ArrowUp') {
                e.preventDefault();
                this.state.isMuted = false;
                let v = parseFloat(this.state.volume);
                v = Math.min(1, v + 0.1);
                this.setVolume(v, false);
                this.showToast(`Âm lượng: ${Math.round(v * 100)}%`);
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                this.state.isMuted = false;
                let v = parseFloat(this.state.volume);
                v = Math.max(0, v - 0.1);
                this.setVolume(v, v === 0);
                this.showToast(`Âm lượng: ${Math.round(v * 100)}%`);
            } else if (e.code === 'KeyA') {
                // Open audio controls modal with keyboard shortcut
                e.preventDefault();
                document.getElementById('audio-controls-modal').classList.add('show');
                // Initially show the keypad
                document.getElementById('keypad-container').style.display = 'block';
                document.getElementById('audio-controls').style.display = 'none';
            } else if (e.code === 'KeyF') {
                // Toggle full player or video fullscreen based on current state
                e.preventDefault();
                
                // If video is in fullscreen, exit fullscreen
                if (document.fullscreenElement) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                    return;
                }
                
                // If full player is open and we're in video tab, toggle video fullscreen
                if (this.elements.overlay.classList.contains('open') && this.state.currentMode === 'video') {
                    const videoContainer = document.querySelector('.video-container');
                    if (videoContainer) {
                        if (!document.fullscreenElement) {
                            // Enter fullscreen
                            if (videoContainer.requestFullscreen) {
                                videoContainer.requestFullscreen();
                            } else if (videoContainer.webkitRequestFullscreen) {
                                videoContainer.webkitRequestFullscreen();
                            } else if (videoContainer.mozRequestFullScreen) {
                                videoContainer.mozRequestFullScreen();
                            } else if (videoContainer.msRequestFullscreen) {
                                videoContainer.msRequestFullscreen();
                            }
                        } else {
                            // Exit fullscreen
                            if (document.exitFullscreen) {
                                document.exitFullscreen();
                            } else if (document.webkitExitFullscreen) {
                                document.webkitExitFullscreen();
                            } else if (document.mozCancelFullScreen) {
                                document.mozCancelFullScreen();
                            } else if (document.msExitFullscreen) {
                                document.msExitFullscreen();
                            }
                        }
                    }
                } else {
                    // If full player is not open, open it
                    this.elements.overlay.classList.add('open');
                }
            } else if (e.key === 'Escape') {
                // If video is in fullscreen, exit fullscreen first
                if (document.fullscreenElement) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                } else if (this.elements.overlay.classList.contains('open')) {
                    // If full player is open, close it
                    this.elements.overlay.classList.remove('open');
                }
            }
        });

        // Xử lý khi tab trình duyệt bị ẩn/hiện
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                if (this.state.isPlaying && this.currentSongHasVideo && !this.state.isBeatMode && !document.pictureInPictureElement) {
                    this.isBackgroundFallback = true;
                    const t = this.video.currentTime;
                    this.video.pause();
                    this.audio.currentTime = t;
                    this.audio.play();
                }
            } else {
                if (this.isBackgroundFallback) {
                    this.isBackgroundFallback = false;
                    const t = this.audio.currentTime;
                    this.audio.pause();
                    this.video.currentTime = t;
                    this.video.play();
                }
                if (this.state.isPlaying && this.currentSongHasVideo && this.state.isBeatMode) {
                    const masterTime = this.video.currentTime;
                    if (Math.abs(this.beatAudio.currentTime - masterTime) > 0.5) {
                        this.beatAudio.currentTime = masterTime;
                    }
                }
            }
        });

        // Cập nhật thời gian phát nhạc/video
        const updateTime = (src) => {
            const d = src.duration || 0, c = src.currentTime || 0;
            if (d > 0) this.checkPreload(c, d);
            if (document.hidden) return; 
            if (d > 0) {
                const p = (c / d) * 100;
                this.elements.seekBar.value = p; this.elements.miniFill.style.width = p + '%';
                this.updateRangeInput(this.elements.seekBar);
                document.getElementById('curr-time').innerText = this.formatTime(c);
                document.getElementById('total-time').innerText = this.formatTime(d);
                this.syncLyrics(c);
            }
        };
        // Đồng bộ Master-Slave
        this.video.ontimeupdate = () => {
            if (this.currentSongHasVideo) { // Video là Master
                const masterTime = this.video.currentTime;
                // Luôn đồng bộ audio gốc (đang bị pause) một cách âm thầm
                try { if (this.audio.currentTime !== masterTime) this.audio.currentTime = masterTime; } catch(e) {}

                // Nếu ở chế độ beat, beatAudio đang phát. Chỉ đồng bộ khi có độ trễ lớn để tránh giật.
                if (this.state.isBeatMode && !this.beatAudio.paused) {
                    try {
                        if (Math.abs(this.beatAudio.currentTime - masterTime) > 0.3) {
                            this.beatAudio.currentTime = masterTime;
                        }
                    } catch(e) {}
                } else { // Nếu không, đồng bộ beatAudio (đang bị pause)
                    try { if (this.beatAudio.currentTime !== masterTime) this.beatAudio.currentTime = masterTime; } catch(e) {}
                }
                updateTime(this.video);
            }
        };
        this.audio.ontimeupdate = () => {
            if ((!this.currentSongHasVideo && !this.state.isBeatMode) || this.isBackgroundFallback) { // Audio là Master
                const t = this.audio.currentTime;
                try { if (this.beatAudio.currentTime !== t && !this.isBackgroundFallback) this.beatAudio.currentTime = t; } catch(e) {}
                updateTime(this.audio);
            }
        };
        this.beatAudio.ontimeupdate = () => {
            if (!this.currentSongHasVideo && this.state.isBeatMode) { // BeatAudio là Master
                const t = this.beatAudio.currentTime;
                try { if (this.audio.currentTime !== t) this.audio.currentTime = t; } catch(e) {}
                updateTime(this.beatAudio);
            }
        };
        
        const onEnd = () => {
            if (this.state.repeatMode === 1) {
                this.seek(0);
                this.play();
            } else {
                this.next();
            }
        };
        // Chỉ trình phát master mới kích hoạt onEnd
        this.video.onended = () => { if (this.currentSongHasVideo) onEnd(); };
        this.audio.onended = () => { if ((!this.currentSongHasVideo && !this.state.isBeatMode) || this.isBackgroundFallback) onEnd(); };
        this.beatAudio.onended = () => { if ((!this.currentSongHasVideo && this.state.isBeatMode) || (document.hidden && this.state.isBeatMode)) onEnd(); };

        this.elements.seekBar.oninput = (e) => {
            const masterPlayer = this.currentSongHasVideo ? this.video : (this.state.isBeatMode ? this.beatAudio : this.audio);
            const duration = masterPlayer.duration;
            if (!duration || isNaN(duration)) return;
            const t = (e.target.value / 100) * duration;
            this.seek(t);
            this.updateRangeInput(e.target);
        };

        // Điều khiển âm lượng
        const volBar = document.getElementById('vol-bar');
        if (volBar) {
            volBar.value = this.state.volume;
            this.updateRangeInput(volBar);
        }
        volBar.oninput = (e) => { 
            this.setVolume(parseFloat(e.target.value), parseFloat(e.target.value) === 0);
        };
        // Nút tắt/bật tiếng
        document.getElementById('btn-mute').onclick = () => { 
            this.setVolume(this.state.volume, !this.state.isMuted);
        };
        this.elements.playBtnMain.onclick = () => { this.resumeAudioContext(); this.togglePlay(); };
        this.elements.playBtnMini.onclick = (e) => { e.stopPropagation(); this.resumeAudioContext(); this.togglePlay(); };
        document.getElementById('btn-next').onclick = () => { this.resumeAudioContext(); this.next(); };
        document.getElementById('btn-mini-next').onclick = (e) => { e.stopPropagation(); this.resumeAudioContext(); this.next(); };
        document.getElementById('btn-prev').onclick = () => { this.resumeAudioContext(); this.prev(); };
        document.getElementById('btn-heart').onclick = () => this.toggleFavorite(this.state.currentIndex);
        document.getElementById('btn-shuffle').onclick = (e) => { this.state.isShuffle = !this.state.isShuffle; e.currentTarget.classList.toggle('active'); this.showToast(this.state.isShuffle ? 'Bật trộn bài' : 'Tắt trộn bài'); };
        document.getElementById('btn-repeat').onclick = (e) => { this.state.repeatMode = this.state.repeatMode === 0 ? 1 : 0; e.currentTarget.classList.toggle('active', this.state.repeatMode === 1); this.showToast(this.state.repeatMode ? 'Lặp 1 bài' : 'Lặp danh sách'); };
        document.getElementById('mini-click-area').onclick = () => this.elements.overlay.classList.add('open');
        // Đóng overlay player
        document.getElementById('btn-close').onclick = () => this.elements.overlay.classList.remove('open');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = () => this.switchTab(btn.dataset.tab));
        // Nút tải xuống trên full player
        document.getElementById('btn-dl').onclick = () => this.openDownloadModal(this.state.currentIndex);
        // Chuyển đổi navigation (Trang ch���, Khám phá, Yêu thích)
        
        document.querySelectorAll('.nav-link').forEach((nav, i) => nav.onclick = () => this.switchNavigation(i));
        document.querySelectorAll('.btn-sort').forEach(btn => btn.onclick = () => this.changeSortOrder(btn.dataset.sort));
        
        document.querySelectorAll('.chip').forEach(c => c.onclick = () => {
            document.querySelectorAll('.chip').forEach(ch => ch.classList.remove('active')); c.classList.add('active');
            this.state.currentFilter = c.dataset.type; this.renderPlaylist();
        });
        this.elements.searchInput.oninput = (e) => {
            this.state.searchQuery = e.target.value;
            // Lưu vị trí scroll hiện tại để khôi phục sau khi render
            const currentScrollTop = this.elements.scrollContainer.scrollTop;
            
            if (this.state.currentNav === 1) { // Trang khám phá
                this.renderExplore();
            } else if (this.state.currentNav === 3) { // Trang cài đặt
                this.renderSettings();
            } else { // Trang chủ và các trang khác
                this.renderPlaylist();
            }
            
            // Khôi phục vị trí scroll sau khi render xong
            setTimeout(() => {
                this.elements.scrollContainer.scrollTop = currentScrollTop;
            }, 0);
        };
        // N��t xóa tìm kiếm
        this.elements.clearSearchBtn.onclick = () => { 
            this.state.searchQuery = ''; 
            this.elements.searchInput.value = ''; 
            if (this.state.currentNav === 3) this.renderSettings();
            else this.renderPlaylist(); 
        };

        // Menu tùy chọn (3 chấm)
        this.elements.btnOptions.onclick = (e) => { e.stopPropagation(); this.elements.optionsMenu.classList.toggle('show'); };
        document.addEventListener('click', (e) => { if (!this.elements.optionsMenu.contains(e.target) && !this.elements.btnOptions.contains(e.target)) this.elements.optionsMenu.classList.remove('show'); });
        this.elements.btnSwitchBeat.onclick = (e) => { e.stopPropagation(); this.toggleBeatMode(); };
        // Hẹn giờ t���t nhạc

        this.elements.btnOpenTimer.onclick = (e) => { e.stopPropagation(); this.elements.timerModal.classList.add('show'); this.elements.optionsMenu.classList.remove('show'); };
        this.elements.btnCloseTimer.onclick = () => this.elements.timerModal.classList.remove('show');
        this.elements.timerModal.onclick = (e) => { if (e.target === this.elements.timerModal) this.elements.timerModal.classList.remove('show'); };
        document.querySelectorAll('.timer-btn').forEach(btn => {
            btn.onclick = () => {
                const min = parseInt(btn.dataset.time); this.startSleepTimer(min);
                document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
                if (min > 0) btn.classList.add('active'); this.elements.timerModal.classList.remove('show');
            };
        });

        // Modal Download
        this.elements.btnCloseDl.onclick = () => this.elements.dlModal.classList.remove('show');
        this.elements.dlModal.onclick = (e) => { if (e.target === this.elements.dlModal) this.elements.dlModal.classList.remove('show'); };
        document.querySelectorAll('.dl-btn').forEach(btn => {
            btn.onclick = () => this.triggerDownload(btn.dataset.type);
        });

        // Share to social media
        const shareButtons = document.querySelectorAll('.btn-share');
        shareButtons.forEach(btn => {
            btn.onclick = () => {
                this.shareCurrentSong();
            };
        });

        // Settings Modal
        const settingsModal = document.getElementById('settings-modal');
        const btnCloseSettings = document.getElementById('btn-close-settings');
        const themeToggleSwitch = document.getElementById('theme-toggle-switch');
        const soundEffectSwitch = document.getElementById('sound-effect-switch');
        const autoUpdateSwitch = document.getElementById('auto-update-switch');

        if (btnCloseSettings && settingsModal) {
            btnCloseSettings.onclick = () => settingsModal.classList.remove('show');
            settingsModal.onclick = (e) => { if (e.target === settingsModal) settingsModal.classList.remove('show'); };
        }

        // Toggle switches in settings modal
        if (themeToggleSwitch) {
            // Update the toggle switch state based on current theme
            const effectiveTheme = this.state.theme === 'auto' 
                ? window.matchMedia('(prefers-color-scheme: dark)').matches 
                : this.state.theme !== 'light';
            themeToggleSwitch.classList.toggle('active', effectiveTheme);

            themeToggleSwitch.onclick = () => {
                // Cycle through theme options: auto -> dark -> light -> auto
                if (this.state.theme === 'auto') {
                    this.state.theme = 'dark';
                } else if (this.state.theme === 'dark') {
                    this.state.theme = 'light';
                } else {
                    this.state.theme = 'auto';
                }

                localStorage.setItem('theme', this.state.theme);
                this.applyTheme();
                this.updateThemeColor();
                this.updateToggleStates();
                this.updateAllRangeInputs();

                // Update the toggle switch state after change
                const newEffectiveTheme = this.state.theme === 'auto' 
                    ? window.matchMedia('(prefers-color-scheme: dark)').matches 
                    : this.state.theme !== 'light';
                themeToggleSwitch.classList.toggle('active', newEffectiveTheme);
            };
        }

        if (soundEffectSwitch) {
            soundEffectSwitch.onclick = () => {
                soundEffectSwitch.classList.toggle('active');
                // Add sound effect toggle functionality here
                this.showToast(soundEffectSwitch.classList.contains('active') ? 'Hiệu ứng âm thanh đã bật' : 'Hiệu ứng âm thanh đã tắt');
            };
        }

        if (autoUpdateSwitch) {
            autoUpdateSwitch.onclick = () => {
                autoUpdateSwitch.classList.toggle('active');
                this.showToast(autoUpdateSwitch.classList.contains('active') ? 'Tự động cập nhật đã bật' : 'Tự động cập nhật đã tắt');
            };
        }

        // Reset Confirmation Modal
        const resetModal = document.getElementById('reset-modal');
        const btnCancelReset = document.getElementById('btn-cancel-reset');
        const btnConfirmReset = document.getElementById('btn-confirm-reset');

        if (btnCancelReset && resetModal) {
            btnCancelReset.onclick = () => resetModal.classList.remove('show');
        }

        if (btnConfirmReset) {
            btnConfirmReset.onclick = () => {
                this.resetApp();
                resetModal.classList.remove('show');
            };
        }

        if (resetModal) {
            resetModal.onclick = (e) => {
                if (e.target === resetModal) resetModal.classList.remove('show');
            };
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            // Check if theme is set to 'auto' in localStorage or if no theme is set (fallback to auto)
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme === 'auto' || (!storedTheme && document.documentElement.getAttribute('data-theme') === 'auto')) {
                // Update theme based on system preference
                this.state.theme = e.matches ? 'dark' : 'light';
                this.applyTheme();
                this.updateThemeColor();
                this.updateToggleStates();
                this.updateAllRangeInputs();
            }
        });

        // Global click handler to resume audio context if suspended
        document.addEventListener('click', () => {
            this.resumeAudioContext();
        }, { once: false, passive: true });
    },
    /**
     * Cập nhật biểu tượng nút tắt tiếng.
     */
    updateMuteUI() { 
        const btn = document.getElementById('btn-mute');
        if (!btn) return;
        btn.innerHTML = `<i class="fa-solid fa-volume-${this.state.isMuted ? 'xmark' : 'high'}"></i>`;
        btn.style.color = this.state.isMuted ? 'var(--text-sub)' : 'var(--primary)';
    },
    

    

};
