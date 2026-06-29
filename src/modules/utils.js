window.MusicProModules = window.MusicProModules || {};
window.MusicProModules.utils = {
    // --- UTILITIES ---
    /**
     * Định dạng thời gian từ giây sang định dạng "phút:giây".
     * @param {number} s - Thời gian tính bằng giây.
     */
    formatTime(s) { if (isNaN(s)) return "0:00"; const m = Math.floor(s/60), sec = Math.floor(s%60); return `${m}:${sec<10?'0':''}${sec}`; },

};
