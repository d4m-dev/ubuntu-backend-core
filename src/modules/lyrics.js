window.MusicProModules = window.MusicProModules || {};
window.MusicProModules.lyrics = {
    // --- FIX LỖI RESET NHẠC KHI CHUYỂN TAB LYRICS ---
    // --- REFACTORED FOR HOT-SWAPPING ---
    switchTab(tab) {
        // Close lyrics PiP when switching away from lyrics tab
        if (this.state.currentMode === 'lyrics' && tab !== 'lyrics') {
            if (this.lyricsPiPWindow) {
                this.lyricsPiPWindow.close();
                this.lyricsPiPWindow = null;
            }

            if (this.lyricsPipVideo && document.pictureInPictureElement === this.lyricsPipVideo) {
                this.lyricsPipVideo.exitPictureInPicture().catch(() => {});
            }
        }

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.querySelectorAll('.stage-view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${tab}`).classList.add('active');

        this.state.currentMode = tab;
        this.updatePiPButtonUI();

        // Logic mới: Chỉ thay đổi UI, không can thiệp vào trình phát đang chạy.
        // Trình phát (video hoặc audio) sẽ tiếp tục chạy nền, đảm bảo âm thanh liền mạch.
        if (tab === 'video') {
            if (!this.currentSongHasVideo) {
                // Nếu đang phát nhạc (chỉ audio) và người dùng chuyển sang tab video, hãy dừng phát.
                if (this.state.isPlaying) {
                    this.pause();
                    this.showToast('Video không khả dụng');
                }
                this.elements.videoMsg.style.display = 'flex';
                this.elements.videoMsg.innerHTML = '<span>Không có Video</span>';
            } else {
                // Nếu có video, đảm bảo thông báo được ẩn đi.
                this.elements.videoMsg.style.display = 'none';
            }
        }
    },

    /**
     * Setup swipe gestures for full player tabs
     */
    setupTabSwipeGestures() {
        const views = document.querySelectorAll('.stage-view');
        if (!views || views.length === 0) return;

        const tabs = ['song', 'video', 'lyrics'];
        
        views.forEach(view => {
            let startX = 0;
            let startY = 0;
            let isSwiping = false;
            const SWIPE_THRESHOLD = 30; // Minimum distance to trigger swipe
            
            view.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwiping = true;
            }, { passive: true });

            view.addEventListener('touchmove', (e) => {
                if (!isSwiping) return;
                
                const moveX = e.touches[0].clientX;
                const moveY = e.touches[0].clientY;
                
                // Check if vertical movement is greater than horizontal (to avoid conflicts with scroll)
                const diffX = Math.abs(moveX - startX);
                const diffY = Math.abs(moveY - startY);
                
                if (diffY > diffX) {
                    // Vertical movement, don't interfere
                    return;
                }
                
                // Prevent horizontal scroll if swiping horizontally
                if (diffX > 10) {
                    e.preventDefault();
                }
            }, { passive: false });

            view.addEventListener('touchend', (e) => {
                if (!isSwiping) return;
                
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                
                const diffX = startX - endX; // Negative = swipe right, Positive = swipe left
                const diffY = startY - endY;
                
                // Check if horizontal movement is significant and greater than vertical
                if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
                    // Determine current tab index
                    const currentIndex = tabs.indexOf(this.state.currentMode);
                    
                    if (diffX > 0) {
                        // Swipe left - go to next tab
                        const nextIndex = (currentIndex + 1) % tabs.length;
                        this.switchTab(tabs[nextIndex]);
                    } else {
                        // Swipe right - go to previous tab
                        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                        this.switchTab(tabs[prevIndex]);
                    }
                }
                
                isSwiping = false;
            }, { passive: true });
        });
    },

    // --- LYRICS MANAGEMENT ---
    /**
     * Tải lời bài hát từ URL và hiển thị lên giao diện. */
    async loadLyrics(url) {
        const c = this.elements.lyricsContainer; c.innerHTML = '<p style="text-align:center;color:var(--text-sub)">Đang tải...</p>'; this.lyricsData = [];
        if (!url) { c.innerHTML = '<p style="text-align:center;color:var(--text-sub)">Không có lời bài hát</p>'; return; }
        try {
            const txt = await (await fetch(url)).text();
            c.innerHTML = '<div style="height:40vh"></div>';
            txt.split('\n').forEach((line, i) => {
                const m = line.match(/^\[(\d{2}):(\d{2})(\.\d+)?\](.*)/);
                if (m) {
                    const t = parseInt(m[1])*60 + parseInt(m[2]) + (m[3]?parseFloat(m[3]):0);
                    if (m[4].trim()) {
                        this.lyricsData.push({ time: t, id: `l-${i}`, text: m[4].trim() });
                        const p = document.createElement('p'); p.className = 'lyric-row'; p.id = `l-${i}`; p.innerText = m[4].trim();
                        p.onclick = () => { this.seek(t); };
                        c.appendChild(p);
                    }
                }
            });
            c.innerHTML += '<div style="height:40vh"></div>';
        } catch { c.innerHTML = '<p style="text-align:center;color:var(--text-sub)">Lỗi tải lời</p>'; }
    },

    /**
     * Đồng bộ lời bài hát với thời gian phát nhạc.
     */
    syncLyrics(t) {
        if (!this.lyricsData.length) return;
        let id = null;
        for (let i = 0; i < this.lyricsData.length; i++) { if (this.lyricsData[i].time <= t) id = this.lyricsData[i].id; else break; }
        if (id) {
            const curr = this.elements.lyricsContainer.querySelector('.lyric-row.active'); 
            if (curr && curr.id !== id) {
                curr.classList.remove('active');
                // Reset color to default for previous active line
                curr.style.color = '';
                curr.style.opacity = '';
            }
            const next = this.elements.lyricsContainer.querySelector('#' + id); 
            if (next && !next.classList.contains('active')) { 
                next.classList.add('active'); 
                // Apply primary color to active line
                next.style.color = 'var(--primary)';
                next.style.opacity = '1';
                next.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
            }
            // Update canvas PiP lyrics if active
            if (this.isLyricsCanvasActive && this.lyricsCanvas) {
                this.updateLyricsCanvas(id);
            }
        }
    },


};
