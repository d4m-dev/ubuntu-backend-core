// ==============================================================================
// D4M OMNI-PANEL CORE LOGIC - GOD MODE
// ==============================================================================

// Tự động nhận diện URL đang truy cập (dù là IP mạng Lan, ngrok, Cloudflare hay Domain public)
const API_BASE_URL = window.location.origin + "/api";

function getAuthToken() { return localStorage.getItem("d4m_sso_token"); }
function getApiHeaders() { return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` }; }

let globalTunnelUrl = "";
let activeIntervals = [];
let logInterval = null;

// ==========================================
// 🚀 1. HỆ THỐNG XÁC THỰC SSO VÀ ĐIỀU HƯỚNG
// ==========================================

function redirectToAuth() {
    window.location.href = `/auth?redirect=${window.location.pathname}`;
}

function parseJwt(token) {
    if(!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
}

function getAuthToken() { return localStorage.getItem('d4m_sso_token'); }
function getApiHeaders() { return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` }; }

function logout() { 
    localStorage.removeItem("d4m_sso_token"); 
    redirectToAuth(); 
}

async function fetchWithAuth(url, options = {}) {
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${getAuthToken()}`;
    const response = await fetch(url, options);
    if (response.status === 401) { logout(); throw new Error("Phiên bản hết hạn"); }
    return response;
}

function clearAllIntervals() {
    activeIntervals.forEach(clearInterval); activeIntervals = [];
    if(logInterval) clearInterval(logInterval);
}

// 🚀 ĐÂY LÀ HÀM CHECK CỦA SẾP (Đã được nâng cấp để điều khiển UI Omni-Panel)
function checkAuthorization() {
    const token = getAuthToken();
    const appContent = document.getElementById('appContent');
    const unauthorizedState = document.getElementById('unauthorizedState');
    const unauthTitle = document.getElementById('unauthTitle');
    const unauthDesc = document.getElementById('unauthDesc');

    const showLock = (title, desc) => {
        if(unauthTitle && title) unauthTitle.innerText = title;
        if(unauthDesc && desc) unauthDesc.innerHTML = desc;
        if(unauthorizedState) {
            unauthorizedState.classList.remove('hidden');
            unauthorizedState.classList.add('flex');
        }
        if(appContent) appContent.classList.add('hidden');
    };

    if (!token) {
        showLock("Cần Đăng Nhập", "Sếp chưa mang thẻ định danh D4M ID.<br>Vui lòng đăng nhập vào hệ sinh thái để tiếp tục.");
        return false;
    }

    const payload = parseJwt(token);
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
        showLock("Lỗi Định Danh", "Thẻ D4M ID của sếp bị hỏng hoặc đã hết hạn.<br>Vui lòng đăng xuất và đăng nhập lại.");
        return false;
    }

    if (Number(payload.active) !== 1) {
        showLock("Tài Khoản Bị Đóng Băng", "Tài khoản của sếp <b>chưa đăng ký</b>.<br>Vui lòng liên hệ Admin để kích hoạt!");
        return false;
    }

    // 🚀 BẮT BUỘC ROLE = 1 VÌ ĐÂY LÀ TRANG ADMIN
    if (Number(payload.role) !== 1) {
        showLock("Không Đủ Thẩm Quyền", "Khu vực này là trung tâm đầu não của Hệ thống.<br>Chỉ có <b>Tư Lệnh (Admin)</b> mới được phép truy cập!");
        return false;
    }

    // Pass mọi chốt chặn -> Load User Info và mở UI
    if(document.getElementById('adminName')) document.getElementById('adminName').innerText = payload.full_name || payload.sub || "Tư Lệnh";
    if(document.getElementById('adminAvatar') && payload.avatar_url) document.getElementById('adminAvatar').src = payload.avatar_url;
    
    if(unauthorizedState) {
        unauthorizedState.classList.remove('flex');
        unauthorizedState.classList.add('hidden');
    }
    if(appContent) {
        appContent.classList.remove('hidden');
        setTimeout(() => appContent.classList.remove('opacity-0'), 100);
    }
    return true;
}

window.switchView = function(viewId) {
    document.querySelectorAll('.nav-item').forEach(el => { el.classList.remove('active', 'active-red'); });
    const activeNav = document.getElementById(`nav-${viewId}`);
    if(activeNav) activeNav.classList.add(viewId === 'security' ? 'active-red' : 'active');
    
    const titles = { 'dashboard': 'Tổng Quan Hệ Thống', 'upload': 'Trung Tâm Dữ Liệu', 'scripts': 'Kịch Bản Vận Hành', 'security': 'Aegis Radar Shield' };
    if(document.getElementById('viewTitle')) document.getElementById('viewTitle').innerText = titles[viewId];

    document.querySelectorAll('.omni-view').forEach(el => { el.classList.add('hidden'); el.classList.remove('block'); });
    const viewEl = document.getElementById(`view-${viewId}`);
    if(viewEl) { viewEl.classList.remove('hidden'); viewEl.classList.add('block'); }

    clearAllIntervals();
    if (viewId === 'dashboard') initDashboard();
    else if (viewId === 'upload') initUpload();
    else if (viewId === 'scripts') initScripts();
    else if (viewId === 'security') initSecurity();
}

// 🚀 KÍCH HOẠT LÁ CHẮN NGAY KHI LOAD TRANG
document.addEventListener('DOMContentLoaded', () => {
    const isAuthorized = checkAuthorization();
    if (isAuthorized) {
        window.switchView('dashboard');
    }
});

// ==========================================
// 📊 2. LOGIC MODULE DASHBOARD
// ==========================================
let bioPlatformChartObj = null;

function initDashboard() {
    fetchSystemStats(); fetchBioStats(); fetchAITasks(); fetchServices();
    activeIntervals.push(setInterval(fetchSystemStats, 2000));
    activeIntervals.push(setInterval(fetchBioStats, 30000));
    activeIntervals.push(setInterval(fetchAITasks, 2000));
}

async function fetchSystemStats() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/dashboard/system-stats`);
        const data = await res.json();
        if(document.getElementById('cpu-val')) document.getElementById('cpu-val').innerText = `${data.cpu_usage_percent}%`;
        if(document.getElementById('ram-val')) document.getElementById('ram-val').innerText = `${data.ram.percent}%`;
        if(document.getElementById('ram-detail')) document.getElementById('ram-detail').innerText = `${data.ram.used_gb} / ${data.ram.total_gb} GB`;
        if(document.getElementById('disk-val')) document.getElementById('disk-val').innerText = `${data.storage.percent}%`;
        if(document.getElementById('disk-detail')) document.getElementById('disk-detail').innerText = `Free: ${data.storage.free_gb} GB`;
    } catch (e) {}
}

window.fetchBioStats = async function() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/dashboard/bio-stats`);
        const data = await res.json();
        if (data.status === 'success') {
            if(document.getElementById('totalBioClicks')) document.getElementById('totalBioClicks').innerText = data.total_clicks;
            
            const tbody = document.getElementById('bioHistoryTable');
            if(tbody) {
                tbody.innerHTML = '';
                if (data.recent_history.length > 0) {
                    data.recent_history.forEach(item => { tbody.innerHTML += `<tr class="hover:bg-white/5 transition border-b border-white/5 last:border-0"><td class="px-4 py-3 text-gray-400">${item.time}</td><td class="px-4 py-3 font-bold text-blue-400">${item.platform}</td><td class="px-4 py-3 text-gray-300">${item.link_id}</td><td class="px-4 py-3 text-gray-500 font-mono text-[10px]">${item.ip_address}</td></tr>`; });
                } else { tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">Hệ thống chưa ghi nhận lượt click nào.</td></tr>'; }
            }

            const canvas = document.getElementById('bioPlatformChart');
            if(canvas) {
                const ctx = canvas.getContext('2d');
                if (bioPlatformChartObj) bioPlatformChartObj.destroy();
                bioPlatformChartObj = new Chart(ctx, { type: 'doughnut', data: { labels: data.platform_stats.map(p => p.name), datasets: [{ data: data.platform_stats.map(p => p.count), backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'], borderColor: 'transparent', hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', font: {size: 10} } } } } });
            }
        }
    } catch (e) {}
}

async function fetchAITasks() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/dashboard/tasks`);
        const data = await res.json();
        const list = document.getElementById('ai-task-list');
        if(!list) return;
        if (data.tasks.length === 0) list.innerHTML = '<p class="text-gray-500 text-sm italic py-8 text-center"><i class="fa-solid fa-check-double text-2xl mb-2 block"></i>Hàng đợi trống rỗng.</p>';
        else {
            list.innerHTML = '';
            data.tasks.forEach(task => {
                let cClass = task.color === 'orange' ? 'bg-orange-500' : (task.color === 'purple' ? 'bg-purple-500' : 'bg-blue-500');
                list.innerHTML += `<div class="bg-black/30 p-3 rounded-xl border border-white/5"><div class="flex justify-between mb-2"><h3 class="font-bold text-[13px] text-white truncate max-w-[70%]">${task.title}</h3><span class="text-[10px] font-bold text-${task.color}-400">${task.status}</span></div><div class="w-full bg-[#111] rounded-full h-1.5"><div class="${cClass} h-1.5 rounded-full progress-striped" style="width: ${task.progress}%"></div></div></div>`;
            });
        }
    } catch (e) {}
}

async function fetchServices() {
    const container = document.getElementById('services-container');
    if(!container) return;
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/dashboard/services`);
        const data = await res.json();
        container.innerHTML = ''; 
        for (const [serviceName, info] of Object.entries(data.services)) {
            const isChecked = info.active ? 'checked' : '';
            let linkHtml = (info.active && info.public_url) ? `<div class="mt-3 text-[11px] bg-black/40 py-2 px-3 rounded-lg flex items-center justify-between border border-green-500/20 group w-full"><i class="fa-solid fa-globe text-green-400 mr-2 animate-pulse"></i><a href="${info.public_url}" target="_blank" class="text-green-400 hover:text-green-300 font-mono tracking-wider truncate flex-1">${info.public_url}</a><button onclick="copyToClipboard('${info.public_url}', this)" class="text-gray-400 hover:text-white bg-white/5 p-1 rounded ml-2"><i class="fa-regular fa-copy"></i></button></div>` : '';
            container.innerHTML += `<div class="flex justify-between items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition border border-white/5"><div class="flex-1 pr-4 min-w-0"><h4 class="font-bold text-blue-300 capitalize text-sm truncate">${serviceName.replace(/_/g, ' ')}</h4><p class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest truncate">${info.description}</p>${linkHtml}</div><label class="relative inline-flex items-center cursor-pointer flex-shrink-0"><input type="checkbox" id="toggle-${serviceName}" ${isChecked} onchange="toggleService('${serviceName}')" class="sr-only peer"><div class="w-10 h-5 bg-gray-700 rounded-full peer peer-checked:bg-purple-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div></label></div>`;
        }
    } catch (e) {}
}

window.toggleService = async function(serviceName) {
    try { await fetchWithAuth(`${API_BASE_URL}/dashboard/services/toggle/${serviceName}`, { method: 'POST' }); setTimeout(fetchServices, 600); } catch (e) { fetchServices(); }
}

// === AI SYSADMIN CHAT ===
window.sendQuickPrompt = function(promptText) {
    const aiInput = document.getElementById('ai-input');
    if(!aiInput) return;
    aiInput.value = promptText;
    document.getElementById('ai-form').dispatchEvent(new Event('submit')); 
}

function appendMessage(sender, text, actionText = null) {
    const box = document.getElementById('ai-chat-box');
    if(!box) return;
    const isUser = sender === 'user';
    const bg = isUser ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-none shadow-md border border-purple-500/50' : 'bg-black/50 text-gray-300 rounded-bl-none shadow-sm border border-white/10';
    const icon = isUser ? '' : '<div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex flex-shrink-0 items-center justify-center shadow-md"><i class="fa-solid fa-robot text-white text-xs"></i></div>';
    let actionHtml = actionText ? `<div class="mt-3 text-xs text-green-400 bg-green-500/10 py-1.5 px-3 rounded-lg border border-green-500/20 flex items-center"><i class="fa-solid fa-bolt text-yellow-400 mr-2 animate-pulse"></i>${actionText}</div>` : '';
    const displayText = isUser ? text : parseAIMessage(text);
    box.innerHTML += `<div class="flex items-start space-x-3 ${isUser?'justify-end':'justify-start'} w-full">${!isUser ? icon : ''}<div class="${bg} p-3.5 rounded-2xl max-w-[85%] text-[13px] leading-relaxed relative">${displayText}${actionHtml}</div></div>`;
    box.scrollTop = box.scrollHeight;
}

const aiForm = document.getElementById('ai-form');
if (aiForm) {
    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const aiInput = document.getElementById('ai-input');
        const msg = aiInput.value.trim(); if (!msg) return;
        appendMessage('user', msg);
        aiInput.value = ''; aiInput.disabled = true;

        const box = document.getElementById('ai-chat-box');
        const tempId = 'loading-' + Date.now();
        box.innerHTML += `<div id="${tempId}" class="flex items-start space-x-3 w-full"><div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex flex-shrink-0 items-center justify-center shadow-md"><i class="fa-solid fa-robot text-white text-xs animate-pulse"></i></div><div class="bg-black/50 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-none flex items-center space-x-1 h-10"><div class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div><div class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div><div class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div></div></div>`;
        box.scrollTop = box.scrollHeight;

        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/ai-admin/chat`, { method: 'POST', body: JSON.stringify({ message: msg }) });
            document.getElementById(tempId).remove();
            if (res.ok) {
                const data = await res.json();
                appendMessage('ai', data.reply, data.action_executed);
                if(data.action_executed) fetchServices();
            } else { appendMessage('ai', `❌ Lỗi kết nối: ${(await res.json()).detail}`); }
        } catch (error) {
            if(document.getElementById(tempId)) document.getElementById(tempId).remove();
            appendMessage('ai', "❌ Lão đại, tôi không thể kết nối tới lõi xử lý AI.");
        } finally { aiInput.disabled = false; aiInput.focus(); }
    });
}

// ==========================================
// ☁️ 3. LOGIC MODULE UPLOAD CENTER
// ==========================================
let typingTimer;

function initUpload() { window.switchUploadTab('music'); }

window.switchUploadTab = function(tab) {
    if(document.getElementById('tab-up-music')) document.getElementById('tab-up-music').className = tab === 'music' ? "flex-1 py-3 rounded-xl border border-blue-500/50 bg-blue-500/10 text-blue-400 font-bold transition-all" : "flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white transition-all";
    if(document.getElementById('tab-up-image')) document.getElementById('tab-up-image').className = tab === 'image' ? "flex-1 py-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold transition-all" : "flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white transition-all";
    if(document.getElementById('form-music')) document.getElementById('form-music').style.display = tab === 'music' ? 'block' : 'none';
    if(document.getElementById('form-image')) document.getElementById('form-image').style.display = tab === 'image' ? 'block' : 'none';
}

window.checkFolderExistence = async function(type, value) {
    clearTimeout(typingTimer);
    const wEl = document.getElementById(`${type}-warning`);
    const name = value.trim();
    if (!name) { wEl.classList.add('hidden'); return; }
    wEl.className = "text-sm font-bold mt-2 text-blue-400"; wEl.innerHTML = 'Đang tìm kiếm...'; wEl.classList.remove('hidden');
    
    typingTimer = setTimeout(async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/check-folder?folder_type=${type}&name=${name}`);
            if (res.ok) {
                const data = await res.json();
                if (data.exists) wEl.innerHTML = type === 'music' ? '<span class="text-yellow-500">⚠️ Thư mục đã tồn tại! Sẽ GHI ĐÈ.</span>' : '<span class="text-blue-400">ℹ️ Thư viện đã có! Ảnh sẽ CỘNG DỒN.</span>';
                else wEl.innerHTML = '<span class="text-green-400">✅ Hợp lệ: Thư mục mới!</span>';
            }
        } catch (e) { wEl.innerHTML = '<span class="text-red-400">Lỗi kết nối</span>'; }
    }, 500);
}

window.uploadMusic = async function() {
    const name = document.getElementById('music-name').value.trim();
    if(!name) return showToast('LỖI', 'Vui lòng nhập tên bài hát!', 'error');
    const fd = new FormData(); fd.append('base_name', name);
    const files = { 'audio': document.getElementById('m-audio')?.files[0], 'beat': document.getElementById('m-beat')?.files[0], 'video': document.getElementById('m-video')?.files[0], 'cover': document.getElementById('m-cover')?.files[0], 'lyric': document.getElementById('m-lyric')?.files[0] };
    let hasFiles = false; for (const [k, v] of Object.entries(files)) if (v) { fd.append(k, v); hasFiles = true; }
    if (!hasFiles) return showToast('LỖI', 'Vui lòng chọn ít nhất 1 file!', 'error');
    try {
        showToast('HỆ THỐNG', 'Đang tải lên cloud...', 'success');
        const res = await fetch(`${API_BASE_URL}/admin/upload-music`, { method: 'POST', headers: {'Authorization': `Bearer ${getAuthToken()}`}, body: fd });
        if(res.ok) { showToast('THÀNH CÔNG', 'Tải lên hoàn tất!', 'success'); document.getElementById('music-name').value = ''; }
        else showToast('THẤT BẠI', 'Upload lỗi', 'error');
    } catch(e) {}
}

window.uploadImages = async function() {
    const folder = document.getElementById('image-folder').value.trim();
    const files = document.getElementById('i-files')?.files;
    if(!folder || !files || files.length===0) return showToast('LỖI', 'Chưa nhập đủ thông tin!', 'error');
    const fd = new FormData(); fd.append('folder_name', folder); for(let f of files) fd.append('images', f);
    try {
        showToast('HỆ THỐNG', 'Đang tải ảnh lên...', 'success');
        const res = await fetch(`${API_BASE_URL}/admin/upload-images`, { method: 'POST', headers: {'Authorization': `Bearer ${getAuthToken()}`}, body: fd });
        if(res.ok) { showToast('THÀNH CÔNG', 'Tải lên hoàn tất!', 'success'); document.getElementById('image-folder').value = ''; }
    } catch(e) {}
}

// ==========================================
// ⚙️ 4. LOGIC MODULE BỘ TƯ LỆNH SCRIPTS
// ==========================================
let currentScript = null, isRunning = false, currentScriptConfig = {};

function initScripts() { 
    window.fetchScripts(); 
    const grid = document.getElementById('cronMonthlyDaysGrid');
    if(grid && grid.innerHTML === '') {
        for(let i=1; i<=31; i++) grid.innerHTML += `<label class="flex items-center gap-1 bg-white/5 p-1 rounded"><input type="checkbox" name="cronMonthDays" value="${i}" onchange="compileCronFromUI()"><span>${i}</span></label>`;
    }
}

window.fetchScripts = async function() {
    try {
        const res = await fetch(`${API_BASE_URL}/scripts/list`, { headers: getApiHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const listEl = document.getElementById('scriptList');
        if(!listEl) return;
        listEl.innerHTML = '';
        data.scripts.forEach(sc => {
            const isRun = sc.status === 'running';
            if (currentScript === sc.name) { isRunning = isRun; currentScriptConfig = {expr: sc.raw_cron_expr, auto_yes: sc.raw_auto_yes, args: sc.raw_args}; updateControlPanel(sc.cron); }
            const badge = sc.cron ? `<span class="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">Cron</span>` : '';
            listEl.innerHTML += `<div onclick="selectScript('${sc.name}', ${isRun}, '${sc.cron || ''}')" class="glass-card p-3 flex justify-between items-center ${currentScript===sc.name?'border-purple-500 bg-purple-500/10 cursor-pointer':'cursor-pointer'}"><div class="flex items-center gap-3"><i class="fa-brands fa-python text-lg ${isRun?'text-green-400':'text-gray-500'}"></i><div><h3 class="font-bold text-white text-xs">${sc.name}</h3><div class="text-[9px] mt-0.5 ${isRun?'text-green-400':'text-gray-500'}">${isRun?'Running':'Ready'}</div></div></div>${badge}</div>`;
        });
    } catch(e) {}
}

function updateControlPanel(cronInfo) {
    if(document.getElementById('ctrlTitle')) document.getElementById('ctrlTitle').innerText = currentScript;
    if(document.getElementById('terminalTitle')) document.getElementById('terminalTitle').innerText = `root@d4m-server:~/scripts/${currentScript}`;
    if(document.getElementById('ctrlStatus')) document.getElementById('ctrlStatus').innerHTML = isRunning ? `<i class="fa-solid fa-circle text-[10px] text-green-500 animate-pulse mr-1"></i> Đang chạy` : `<i class="fa-solid fa-circle text-[10px] text-gray-500 mr-1"></i> Đã dừng`;
    if(document.getElementById('ctrlCron')) document.getElementById('ctrlCron').innerHTML = cronInfo ? `<i class="fa-solid fa-clock text-purple-400 mr-1"></i> ${cronInfo}` : `<i class="fa-solid fa-clock text-gray-600 mr-1"></i> Trống`;
    
    const btnPlay = document.getElementById('btnPlayStop');
    if(btnPlay) {
        btnPlay.disabled = false; 
        if (isRunning) { btnPlay.className = "px-6 py-2 rounded-lg font-bold bg-red-600 text-white"; btnPlay.innerText = "Buộc Dừng"; document.getElementById('terminalInputBox')?.classList.remove('hidden'); document.getElementById('manualAutoYesLabel')?.classList.add('hidden'); } 
        else { btnPlay.className = "px-6 py-2 rounded-lg font-bold bg-green-600 text-white"; btnPlay.innerText = "Khởi Động"; document.getElementById('terminalInputBox')?.classList.add('hidden'); document.getElementById('manualAutoYesLabel')?.classList.remove('hidden'); }
    }
    if(document.getElementById('btnCron')) document.getElementById('btnCron').disabled = false;
}

window.selectScript = function(name, runState, cronInfo) {
    currentScript = name; isRunning = runState; window.fetchScripts();
    if(document.getElementById('terminalBody')) document.getElementById('terminalBody').innerHTML = `> Đang tải log của ${name}...\n`;
    if(logInterval) clearInterval(logInterval);
    fetchLogs(); logInterval = setInterval(() => { fetchLogs(); window.fetchScripts(); }, 2000); 
}

window.toggleCurrentScript = async function() {
    if (!currentScript) return;
    const action = isRunning ? 'stop' : 'start';
    const autoYes = document.getElementById('manualAutoYes')?.checked || false;
    if(document.getElementById('btnPlayStop')) document.getElementById('btnPlayStop').innerText = "Đang gửi...";
    try {
        const res = await fetch(`${API_BASE_URL}/scripts/${action}/${currentScript}${action==='start'?'?auto_yes='+autoYes:''}`, { method: 'POST', headers: getApiHeaders() });
        if(res.ok) { isRunning = !isRunning; updateControlPanel(''); window.fetchScripts(); } 
        else showToast('LỖI', (await res.json()).detail, 'error');
    } catch(e) {}
}

async function fetchLogs() {
    if (!currentScript) return;
    try {
        const res = await fetch(`${API_BASE_URL}/scripts/logs/${currentScript}`, { headers: getApiHeaders() });
        if (res.ok) {
            const data = await res.json();
            let coloredLog = data.logs.replace(/ERROR|LỖI/g, '<span class="text-red-400 font-bold">$&</span>').replace(/BẮT ĐẦU CHẠY/g, '<span class="text-blue-400 font-bold">$&</span>');
            const term = document.getElementById('terminalBody');
            if (term && coloredLog !== term.innerHTML) { term.innerHTML = coloredLog || '> Chưa có log...'; term.scrollTop = term.scrollHeight; }
        }
    } catch(e) {}
}

window.sendTerminalInput = async function() {
    if (!currentScript || !isRunning) return;
    const inputEl = document.getElementById('terminalInput');
    const cmd = inputEl.value; inputEl.value = ''; inputEl.disabled = true;
    try {
        await fetch(`${API_BASE_URL}/scripts/input/${currentScript}`, { method: 'POST', headers: getApiHeaders(), body: JSON.stringify({ command: cmd }) });
        fetchLogs(); 
    } catch (e) { showToast("LỖI", "Không thể gửi lệnh!", "error"); }
    inputEl.disabled = false; inputEl.focus();
}

if(document.getElementById('terminalInput')) {
    document.getElementById('terminalInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); window.sendTerminalInput(); }
    });
}

// CRON MODAL UI
window.openCronModal = function() { 
    if(!currentScript) return; 
    if(document.getElementById('cronFileName')) document.getElementById('cronFileName').innerText = currentScript;
    if(document.getElementById('cronInput')) document.getElementById('cronInput').value = currentScriptConfig.expr || '* * * * *';
    if(document.getElementById('cronTypeSelect')) { document.getElementById('cronTypeSelect').value = 'custom'; window.handleCronTypeChange(); }
    const modal = document.getElementById('cronModal');
    if(modal) { modal.classList.remove('hidden'); setTimeout(() => modal.classList.remove('opacity-0'), 10); }
}
window.closeCronModal = function() { 
    const modal = document.getElementById('cronModal');
    if(modal) { modal.classList.add('opacity-0'); setTimeout(() => modal.classList.add('hidden'), 300); }
}
window.handleCronTypeChange = function() { 
    document.querySelectorAll('.cron-sub-panel').forEach(p => p.classList.add('hidden')); 
    const typeSelect = document.getElementById('cronTypeSelect');
    if(typeSelect) {
        const panel = document.getElementById(`panel-${typeSelect.value}`);
        if(panel) panel.classList.remove('hidden'); 
        window.compileCronFromUI(); 
    }
}
window.compileCronFromUI = function() { 
    if(document.getElementById('computedCronString') && document.getElementById('cronInput')) {
        document.getElementById('computedCronString').innerText = document.getElementById('cronInput').value; 
    }
}
window.saveCron = async function() { 
    const e = document.getElementById('computedCronString')?.innerText; 
    if(e) {
        await fetch(`${API_BASE_URL}/scripts/schedule/${currentScript}`, { method:'POST', headers: getApiHeaders(), body:JSON.stringify({cron_expr: e, auto_yes: false, args: ""}) }); 
        window.closeCronModal(); window.fetchScripts(); 
    }
}
window.removeCron = async function() { 
    await fetch(`${API_BASE_URL}/scripts/unschedule/${currentScript}`, { method:'POST', headers: getApiHeaders() }); 
    window.closeCronModal(); window.fetchScripts(); 
}

// ==========================================
// 🛡️ 5. LOGIC MODULE AEGIS RADAR
// ==========================================
function initSecurity() {
    window.fetchRadarData(); window.fetchBlacklist();
    activeIntervals.push(setInterval(window.fetchRadarData, 5000));
    activeIntervals.push(setInterval(window.fetchBlacklist, 10000));
}

window.fetchRadarData = async function() {
    try {
        const res = await fetch(`${API_BASE_URL}/security/radar`, { headers: getApiHeaders() });
        if(!res.ok) return; const data = await res.json();
        if(data.report) {
            if(document.getElementById('statTotal')) document.getElementById('statTotal').innerText = data.report.total_requests;
            if(document.getElementById('statPeak')) document.getElementById('statPeak').innerText = data.report.peak_hour.split(' ')[0];
            const devBox = document.getElementById('statDevices'); 
            if(devBox) {
                devBox.innerHTML = '';
                for (const [device, count] of Object.entries(data.report.device_stats)) devBox.innerHTML += `<div class="text-center"><i class="fa-solid fa-microchip text-xl text-gray-400 mb-1"></i><div class="text-[10px] font-bold text-white">${count}</div></div>`;
            }
            const ipList = document.getElementById('topIpList');
            if(ipList) {
                if(data.report.top_attackers_or_users.length === 0) ipList.innerHTML = '<div class="text-gray-500 font-mono text-center text-sm">Radar trống.</div>';
                else {
                    const maxReq = data.report.top_attackers_or_users[0].count; ipList.innerHTML = '';
                    data.report.top_attackers_or_users.forEach((item, index) => {
                        const percent = Math.max(5, (item.count / maxReq) * 100);
                        const isThreat = item.count > 100 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-blue-500';
                        ipList.innerHTML += `<div class="glass-card p-3 group"><div class="flex justify-between items-center mb-2"><div class="flex gap-2 items-center"><span class="text-[10px] text-gray-500">#${index+1}</span><span class="font-mono text-sm ${item.count>100?'text-red-400':'text-blue-300'} font-bold">${item.ip}</span></div><div class="flex items-center gap-2"><span class="font-black text-white">${item.count}</span> <button onclick="quickBan('${item.ip}')" class="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><i class="fa-solid fa-crosshairs"></i></button></div></div><div class="w-full bg-black/50 rounded-full h-1"><div class="h-1 rounded-full ${isThreat}" style="width: ${percent}%"></div></div></div>`;
                    });
                }
            }
        }
    } catch(e) {}
}

window.fetchBlacklist = async function() {
    try {
        const res = await fetch(`${API_BASE_URL}/security/blacklist`, { headers: getApiHeaders() });
        if(!res.ok) return; const data = await res.json();
        const keys = Object.keys(data.blacklist);
        if(document.getElementById('blacklistCount')) document.getElementById('blacklistCount').innerText = `${keys.length} Bị Giam`;
        if(document.getElementById('statBannedCount')) document.getElementById('statBannedCount').innerText = `${keys.length} IP bị giam`;
        
        const threatEl = document.getElementById('statThreat');
        if(threatEl) {
            if(keys.length > 5) { threatEl.innerText = "BÁO ĐỘNG"; threatEl.className = "text-2xl font-black text-red-500 mt-1"; } 
            else { threatEl.innerText = "AN TOÀN"; threatEl.className = "text-2xl font-black text-green-500 mt-1"; }
        }
        
        const container = document.getElementById('blacklistContainer');
        if(container) {
            if(keys.length === 0) container.innerHTML = '<div class="text-center text-gray-600 py-8 font-mono text-sm">Hầm ngục trống.</div>';
            else {
                container.innerHTML = '';
                for (const [ip, info] of Object.entries(data.blacklist)) {
                    const d = new Date(info.expires_at * 1000).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'});
                    container.innerHTML += `<div class="bg-red-950/20 p-2 rounded-lg flex justify-between items-center group"><div class="font-mono text-xs text-red-400">${ip}<div class="text-[9px] text-gray-500 mt-0.5">Khóa đến: ${d}</div></div><button onclick="unbanIp('${ip}')" class="px-2 py-1 bg-gray-800 text-[10px] text-white rounded hover:bg-green-600 opacity-0 group-hover:opacity-100 transition">Thả</button></div>`;
                }
            }
        }
    } catch(e) {}
}

window.quickBan = function(ip) { 
    if(document.getElementById('banIpInput')) { document.getElementById('banIpInput').value = ip; document.getElementById('banIpInput').focus(); }
}

window.executeBan = async function() {
    const ip = document.getElementById('banIpInput')?.value.trim(); 
    const hours = document.getElementById('banHoursInput')?.value || 24;
    if(!ip) return showToast('LỖI', 'Chưa nhập IP', 'error');
    try {
        const res = await fetch(`${API_BASE_URL}/security/ban`, { method: 'POST', headers: getApiHeaders(), body: JSON.stringify({ ip, hours, reason: "Manual Ban from Omni-Panel" }) });
        if(res.ok) { document.getElementById('banIpInput').value = ''; window.fetchBlacklist(); showToast('ĐÃ KHÓA', `IP ${ip} đã bị giam ${hours} giờ.`, 'success'); }
        else showToast('THẤT BẠI', (await res.json()).detail, 'error');
    } catch(e) {}
}

window.unbanIp = async function(ip) {
    try { 
        const res = await fetch(`${API_BASE_URL}/security/unban/${ip}`, { method: 'POST', headers: getApiHeaders() }); 
        if(res.ok) { window.fetchBlacklist(); showToast('PHÓNG THÍCH', `Đã mở khóa IP ${ip}`, 'success'); } 
    } catch(e) {}
}

// ==========================================
// 🚀 KHỞI ĐỘNG HỆ THỐNG GỐC (LIFECYCLE)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const payload = parseJwt(getAuthToken());
    if (!payload || Number(payload.role) !== 1) {
        if(document.getElementById('lockScreen')) document.getElementById('lockScreen').style.display = 'flex';
    } else {
        if(document.getElementById('lockScreen')) document.getElementById('lockScreen').style.display = 'none';
        if(document.getElementById('adminName')) document.getElementById('adminName').innerText = payload.full_name || payload.sub;
        if(document.getElementById('adminAvatar') && payload.avatar_url) document.getElementById('adminAvatar').src = payload.avatar_url;
        
        // Mở màn hình đầu tiên
        window.switchView('dashboard');
    }
});