// ==============================================================================
// D4M OMNI-PANEL CORE LOGIC - GOD MODE (SAFE VERSION)
// ==============================================================================

const API_BASE_URL = window.location.origin + "/api";

// ==========================================
// 🚀 1. HỆ THỐNG XÁC THỰC SSO & QUYỀN LỰC
// ==========================================
function redirectToAuth() { window.location.href = `/auth?redirect=${window.location.pathname}`; }

function parseJwt(token) {
    if(!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = decodeURIComponent(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(base64);
    } catch (e) { return null; }
}

function getAuthToken() { return localStorage.getItem('d4m_sso_token') || localStorage.getItem('token') || localStorage.getItem('ubuntu_token'); }
function getApiHeaders() { return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` }; }

function logout() { 
    localStorage.removeItem("d4m_sso_token"); 
    localStorage.removeItem("token"); 
    localStorage.removeItem("ubuntu_token"); 
    redirectToAuth(); 
}

function checkAuthorization() {
    const token = getAuthToken();
    const appNav = document.getElementById('appNav');
    const appMain = document.getElementById('appMain');
    const unauthorizedState = document.getElementById('unauthorizedState');

    const showLock = (title, desc) => {
        if(document.getElementById('unauthTitle')) document.getElementById('unauthTitle').innerText = title;
        if(document.getElementById('unauthDesc')) document.getElementById('unauthDesc').innerHTML = desc;
        unauthorizedState?.classList.remove('hidden');
        unauthorizedState?.classList.add('flex');
        appNav?.classList.add('hidden');
        appMain?.classList.add('hidden');
    };

    if (!token) return showLock("Cần Đăng Nhập", "Sếp chưa mang thẻ định danh D4M ID.<br>Vui lòng đăng nhập vào hệ sinh thái để tiếp tục.");

    const payload = parseJwt(token);
    if (!payload) return showLock("Lỗi Định Danh", "Thẻ D4M ID của sếp bị hỏng hoặc đã hết hạn.<br>Vui lòng đăng xuất và đăng nhập lại.");
    
    if (Number(payload.active) !== 1) return showLock("Tài Khoản Đóng Băng", "Tài khoản của sếp <b>chưa đăng ký</b>.<br>Vui lòng kích hoạt tài khoản!");

    // 🛡️ CHỐT CHẶN GOD MODE: CHỈ CÓ ROLE 1 HOẶC 'admin' MỚI QUA ĐƯỢC
    if (Number(payload.role) !== 1 && payload.role !== 'admin') {
        return showLock("Không Đủ Thẩm Quyền", "CẢNH BÁO: Chỉ có Tư Lệnh mới được phép truy cập Trung Tâm Lõi OMNI-PANEL.");
    }

    // Pass chặn -> Mở UI
    appNav?.classList.remove('hidden');
    appMain?.classList.remove('hidden');
    if(document.getElementById('top-admin-name')) document.getElementById('top-admin-name').innerText = payload.full_name || payload.username || "Tư Lệnh";
    
    // Nạp Avatar (Chạy ngầm)
    try {
        fetch(`${API_BASE_URL}/auth/profile/me`, { headers: getApiHeaders() })
            .then(res => res.json())
            .then(data => { if(data.status === 'success' && document.getElementById('adminAvatar')) document.getElementById('adminAvatar').src = data.data.avatar_url; });
    } catch(e){}

    return true;
}

// ==========================================
// 🔔 2. HỆ THỐNG GIAO DIỆN CHUNG (TOAST & MODAL)
// ==========================================
window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    const icon = type === 'success' ? '<i class="fa-solid fa-shield-check text-green-400 text-lg"></i>' : '<i class="fa-solid fa-triangle-exclamation text-red-400 text-lg"></i>';
    const border = type === 'success' ? 'border-green-500/30' : 'border-red-500/30';
    const glow = type === 'success' ? 'shadow-[0_0_20px_rgba(74,222,128,0.2)]' : 'shadow-[0_0_20px_rgba(239,68,68,0.2)]';

    toast.className = `flex items-center gap-3 px-5 py-4 rounded-2xl border ${border} bg-black/80 backdrop-blur-xl ${glow} toast-enter min-w-[280px] pointer-events-auto`;
    toast.innerHTML = `${icon} <span class="text-white text-sm font-medium tracking-wide">${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.4s ease-in';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

let pendingActionCallback = null;

window.openConfirmModal = function(title, message, iconClass, colorTheme, btnText, callback) {
    if(document.getElementById('confirmTitle')) document.getElementById('confirmTitle').innerText = title;
    if(document.getElementById('confirmMessage')) document.getElementById('confirmMessage').innerText = message;
    
    const iconBox = document.getElementById('confirmIconBox');
    const icon = document.getElementById('confirmIcon');
    const btn = document.getElementById('confirmBtn');

    if (iconBox && icon && btn) {
        iconBox.className = `w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5 border shadow-lg bg-${colorTheme}-500/10 border-${colorTheme}-500/30 shadow-[0_0_20px_rgba(var(--tw-color-${colorTheme}-500),0.3)]`;
        icon.className = `fa-solid ${iconClass} text-3xl text-${colorTheme}-500`;
        btn.className = `flex-1 py-3 px-4 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(var(--tw-color-${colorTheme}-500),0.4)] bg-${colorTheme}-600 hover:bg-${colorTheme}-500 hover:scale-105`;
        btn.innerText = btnText;
    }

    pendingActionCallback = callback;
    const modal = document.getElementById('customConfirmModal');
    const content = document.getElementById('customConfirmContent');
    if(modal && content) {
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); }, 10);
    }
}

window.closeConfirmModal = function() {
    const modal = document.getElementById('customConfirmModal');
    const content = document.getElementById('customConfirmContent');
    if(modal && content) {
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        setTimeout(() => { modal.classList.add('hidden'); pendingActionCallback = null; }, 300);
    }
}

window.executeConfirmAction = function() {
    if (pendingActionCallback) { pendingActionCallback(); closeConfirmModal(); }
}


// ==========================================
// 👑 3. BẢNG PHONG THẦN (QUẢN LÝ USER)
// ==========================================
let globalUsersList = [];

window.fetchAdminUsers = async function() {
    const tbody = document.getElementById('usersTableBody');
    if(!tbody) return;
    tbody.innerHTML = `<tr><td colspan="4" class="px-4 py-10 text-center text-gray-500"><i class="fa-solid fa-circle-notch animate-spin text-purple-500 mr-2"></i>Đang triệu hồi dữ liệu...</td></tr>`;
    try {
        const res = await fetch(`${API_BASE_URL}/auth/admin/users`, { headers: getApiHeaders() });
        const data = await res.json();
        if(data.status === 'success') {
            globalUsersList = data.users;
            window.renderUsersTable(globalUsersList);
        } else { showToast(data.detail, "error"); }
    } catch(e) { showToast("Lỗi kết nối CSDL Người Dùng", "error"); }
}

window.renderUsersTable = function(users) {
    const tbody = document.getElementById('usersTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if(users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-4 py-10 text-center text-gray-500">Hệ thống chưa có người dùng nào.</td></tr>`;
        return;
    }

    users.forEach(u => {
        const roleBadge = u.role === 1 || u.role === 'admin' 
            ? `<span class="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-1 rounded text-[9px] font-black tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.3)]"><i class="fa-solid fa-crown mr-1"></i>ADMIN</span>`
            : `<span class="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-1 rounded text-[9px] font-bold tracking-widest">USER</span>`;
            
        const activeBadge = u.active === 1
            ? `<span class="text-green-400 text-[10px] font-bold block mt-1.5"><i class="fa-solid fa-circle-check"></i> Được Phép</span>`
            : `<span class="text-red-400 text-[10px] font-bold block mt-1.5"><i class="fa-solid fa-ban"></i> Bị Khóa Ngục</span>`;

        tbody.innerHTML += `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors user-row" data-search="${(u.full_name + ' ' + u.username + ' ' + u.email).toLowerCase()}">
                <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                        <img src="${u.avatar_url}" class="w-8 h-8 rounded-lg border border-white/10 object-cover shadow-lg">
                        <div>
                            <p class="font-bold text-xs text-white">${u.full_name || u.username}</p>
                            <p class="text-[9px] font-mono text-blue-400 bg-blue-500/10 inline-block px-1 mt-0.5 rounded border border-blue-500/20">@${u.username}</p>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <p class="text-[11px] text-gray-300 font-medium mb-0.5"><i class="fa-solid fa-envelope text-gray-500 w-3"></i> ${u.email}</p>
                    <span class="text-[9px] font-bold ${u.is_verified ? 'text-green-400' : 'text-orange-400'}">${u.is_verified ? '<i class="fa-solid fa-shield-check"></i> Đã xác thực' : '<i class="fa-solid fa-triangle-exclamation"></i> Chờ xác thực'}</span>
                </td>
                <td class="px-4 py-3">${roleBadge}${activeBadge}</td>
                <td class="px-4 py-3 text-right">
                    <div class="flex gap-1.5 justify-end">
                        <button onclick="actionToggleStatus(${u.id}, ${u.active})" class="w-7 h-7 rounded border border-white/10 bg-black/40 hover:bg-white/10 text-gray-300 transition-all flex items-center justify-center hover:scale-110" title="Khóa / Mở Khóa">
                            <i class="fa-solid ${u.active === 1 ? 'fa-lock text-orange-400' : 'fa-unlock text-green-400'} text-[10px]"></i>
                        </button>
                        <button onclick="actionToggleRole(${u.id}, ${u.role})" class="w-7 h-7 rounded border border-white/10 bg-black/40 hover:bg-white/10 text-gray-300 transition-all flex items-center justify-center hover:scale-110" title="Phong Tước / Giáng Chức">
                            <i class="fa-solid fa-user-shield ${u.role === 1 ? 'text-red-400' : 'text-purple-400'} text-[10px]"></i>
                        </button>
                        <button onclick="actionDeleteUser(${u.id})" class="w-7 h-7 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-all flex items-center justify-center hover:scale-110 shadow-[0_0_10px_rgba(239,68,68,0.2)]" title="Thanh Trừng">
                            <i class="fa-solid fa-skull text-[10px]"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

window.filterUsers = function() {
    const input = document.getElementById('userSearchInput');
    if(!input) return;
    const query = input.value.toLowerCase();
    document.querySelectorAll('.user-row').forEach(row => {
        row.style.display = row.getAttribute('data-search').includes(query) ? '' : 'none';
    });
}

window.actionToggleStatus = function(id, currentActive) {
    const isLocking = currentActive === 1;
    openConfirmModal(
        isLocking ? "Giam Cầm Tài Khoản?" : "Ân Xá Tài Khoản?",
        isLocking ? "Người này sẽ bị mất toàn quyền truy cập. Xác nhận khóa?" : "Khôi phục lại quyền truy cập cho tài khoản này vào hệ thống?",
        isLocking ? "fa-lock" : "fa-unlock",
        isLocking ? "orange" : "green",
        isLocking ? "Khóa Ngay" : "Mở Khóa",
        async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/admin/users/${id}/toggle-active`, { method: 'PUT', headers: getApiHeaders() });
                const data = await res.json();
                if(data.status === 'success') { showToast("Lệnh thay đổi Trạng Thái đã được thi hành!"); window.fetchAdminUsers(); }
                else showToast(data.detail, "error");
            } catch(e) { showToast("Lỗi mạng", "error"); }
        }
    );
}

window.actionToggleRole = function(id, currentRole) {
    const isPromoting = currentRole !== 1;
    openConfirmModal(
        isPromoting ? "Phong Tước Tư Lệnh?" : "Giáng Chức Dân Thường?",
        isPromoting ? "Tài khoản này sẽ có quyền hạn tối cao, kiểm soát sinh tử các user khác. Sếp chắc chứ?" : "Tước bỏ quyền Admin của tài khoản này?",
        "fa-crown",
        isPromoting ? "purple" : "orange",
        isPromoting ? "Sắc Phong" : "Giáng Chức",
        async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/admin/users/${id}/change-role`, { method: 'PUT', headers: getApiHeaders() });
                const data = await res.json();
                if(data.status === 'success') { showToast("Chiếu chỉ Tước Vị đã được ban hành!"); window.fetchAdminUsers(); }
                else showToast(data.detail, "error");
            } catch(e) { showToast("Lỗi mạng", "error"); }
        }
    );
}

window.actionDeleteUser = function(id) {
    openConfirmModal(
        "LỆNH THANH TRỪNG",
        "CẢNH BÁO MỨC ĐỘ 1: Tài khoản này sẽ bị xóa VĨNH VIỄN khỏi Database. Không thể hoàn tác!",
        "fa-skull-crossbones",
        "red",
        "Khai Đao",
        async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/admin/users/${id}`, { method: 'DELETE', headers: getApiHeaders() });
                const data = await res.json();
                if(data.status === 'success') { showToast("Kẻ phản nghịch đã bị loại bỏ khỏi hệ thống!"); window.fetchAdminUsers(); }
                else showToast(data.detail, "error");
            } catch(e) { showToast("Lỗi mạng", "error"); }
        }
    );
}


// ==========================================
// 📡 4. HỆ THỐNG GỌI TÀI NGUYÊN (DASHBOARD)
// ==========================================
async function fetchSystemStats() {
    try {
        const res = await fetch(`${API_BASE_URL}/dashboard/system-stats`, { headers: getApiHeaders() });
        const data = await res.json();
        if(data.status === 'success') {
            if(document.getElementById('cpu-val')) document.getElementById('cpu-val').innerText = `${data.cpu_usage_percent}%`;
            if(document.getElementById('ram-val')) document.getElementById('ram-val').innerText = `${data.ram.percent}%`;
            if(document.getElementById('ram-detail')) document.getElementById('ram-detail').innerText = `${data.ram.used_gb} / ${data.ram.total_gb} GB`;
            if(document.getElementById('disk-val')) document.getElementById('disk-val').innerText = `${data.storage.percent}%`;
            if(document.getElementById('disk-detail')) document.getElementById('disk-detail').innerText = `Free: ${data.storage.free_gb} GB`;
        }
    } catch (e) {}
}

async function fetchServices() {
    const container = document.getElementById('services-container');
    if(!container) return;
    try {
        const res = await fetch(`${API_BASE_URL}/dashboard/services`, { headers: getApiHeaders() });
        const data = await res.json();
        container.innerHTML = ''; 
        for (const [serviceName, info] of Object.entries(data.services)) {
            const isChecked = info.active ? 'checked' : '';
            let linkHtml = (info.active && info.public_url) ? `<div class="mt-2 text-[10px] bg-black/40 py-1.5 px-2 rounded flex justify-between"><a href="${info.public_url}" target="_blank" class="text-green-400 truncate">${info.public_url}</a></div>` : '';
            container.innerHTML += `<div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5"><div class="flex-1 pr-4 min-w-0"><h4 class="font-bold text-blue-300 capitalize text-sm">${serviceName.replace(/_/g, ' ')}</h4><p class="text-[10px] text-gray-400 mt-0.5 truncate">${info.description}</p>${linkHtml}</div><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" ${isChecked} onchange="toggleService('${serviceName}')" class="sr-only peer"><div class="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-purple-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div></label></div>`;
        }
    } catch (e) {}
}

window.toggleService = async function(serviceName) {
    try { await fetch(`${API_BASE_URL}/dashboard/services/toggle/${serviceName}`, { method: 'POST', headers: getApiHeaders() }); setTimeout(fetchServices, 500); } catch (e) {}
}

window.fetchAITasks = async function() {
    try {
        const res = await fetch(`${API_BASE_URL}/dashboard/tasks`, { headers: getApiHeaders() });
        const data = await res.json();
        const list = document.getElementById('ai-task-list');
        if(!list) return;
        if (data.tasks.length === 0) {
            list.innerHTML = '<p class="text-gray-500 text-sm italic py-8 text-center"><i class="fa-solid fa-check-double text-2xl mb-2 block"></i>Hàng đợi trống rỗng.</p>';
        } else {
            list.innerHTML = '';
            data.tasks.forEach(task => {
                let cClass = task.color === 'orange' ? 'bg-orange-500' : (task.color === 'purple' ? 'bg-purple-500' : 'bg-blue-500');
                list.innerHTML += `
                    <div class="bg-black/30 p-3 rounded-xl border border-white/5 relative overflow-hidden group">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="font-bold text-[13px] text-white truncate max-w-[65%]" title="${task.title}">${task.title}</h3>
                            <span class="text-[10px] font-bold text-${task.color}-400 px-2 py-0.5 bg-${task.color}-900/30 rounded border border-${task.color}-500/20">${task.status}</span>
                        </div>
                        <div class="w-full bg-[#111] rounded-full h-1.5 mt-2">
                            <div class="${cClass} h-1.5 rounded-full transition-all duration-1000 progress-striped progress-animated" style="width: ${task.progress}%"></div>
                        </div>
                    </div>`;
            });
        }
    } catch (e) {}
}

// ==========================================
// 📦 5. TÍNH NĂNG UPLOAD & AI CHAT
// ==========================================
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-active'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-active'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); dropZone.classList.remove('drag-active');
        if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; handleFileUpload(fileInput.files[0]); }
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFileUpload(fileInput.files[0]); });
}

async function handleFileUpload(file) {
    if (!file.name.endsWith('.zip')) return showToast("Chỉ chấp nhận định dạng .zip", "error");
    const uploadText = document.getElementById('upload-text');
    const uploadIcon = document.getElementById('upload-icon');
    uploadText.innerText = `Đang xử lý: ${file.name}...`;
    uploadIcon.className = "fa-solid fa-circle-notch fa-spin text-4xl text-yellow-400 mb-3";
    
    const formData = new FormData(); formData.append("file", file);
    try {
        const res = await fetch(`${API_BASE_URL}/projects/upload`, { method: "POST", headers: {'Authorization': `Bearer ${getAuthToken()}`}, body: formData });
        if (res.ok) {
            uploadText.innerText = "Triển khai thành công!";
            uploadIcon.className = "fa-solid fa-circle-check text-4xl text-green-400 mb-3";
            showToast("Đã deploy xong dự án mới!", "success");
        } else {
            uploadText.innerText = "Lỗi khi triển khai!";
            uploadIcon.className = "fa-solid fa-circle-xmark text-4xl text-red-400 mb-3";
            showToast("Có lỗi xảy ra", "error");
        }
    } catch(e) {
        uploadText.innerText = "Mất kết nối máy chủ!";
    }
    setTimeout(() => {
        uploadText.innerText = "Thả file .ZIP vào đây để Deploy";
        uploadIcon.className = "fa-solid fa-cloud-arrow-up text-4xl text-blue-400 mb-3";
    }, 3000);
}

const aiForm = document.getElementById('ai-form');
if(aiForm) {
    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputEl = document.getElementById('ai-input');
        const box = document.getElementById('ai-chat-box');
        const msg = inputEl.value.trim(); if(!msg) return;
        
        box.innerHTML += `<div class="flex items-start space-x-3 justify-end w-full"><div class="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-3.5 rounded-2xl rounded-br-none max-w-[85%] text-[13px]">${msg}</div></div>`;
        inputEl.value = ''; inputEl.disabled = true; box.scrollTop = box.scrollHeight;
        
        const tempId = 'loading-' + Date.now();
        box.innerHTML += `<div id="${tempId}" class="flex items-start space-x-3 w-full"><div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex justify-center items-center"><i class="fa-solid fa-robot text-white text-xs animate-pulse"></i></div><div class="bg-black/50 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-none text-gray-400 text-xs">Đang suy nghĩ...</div></div>`;
        box.scrollTop = box.scrollHeight;

        try {
            const res = await fetch(`${API_BASE_URL}/ai-admin/chat`, { method: 'POST', headers: getApiHeaders(), body: JSON.stringify({ message: msg }) });
            document.getElementById(tempId)?.remove();
            if(res.ok) {
                const data = await res.json();
                let actionHtml = data.action_executed ? `<div class="mt-2 text-[10px] text-green-400 bg-green-500/10 py-1 px-2 rounded border border-green-500/20"><i class="fa-solid fa-bolt mr-1"></i>${data.action_executed}</div>` : '';
                box.innerHTML += `<div class="flex items-start space-x-3 w-full"><div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex justify-center items-center"><i class="fa-solid fa-robot text-white text-xs"></i></div><div class="bg-black/50 border border-white/10 p-3.5 rounded-2xl rounded-bl-none max-w-[85%] text-[13px] text-gray-300">${data.reply}${actionHtml}</div></div>`;
                if(data.action_executed) fetchServices();
            }
        } catch(e) { document.getElementById(tempId)?.remove(); }
        inputEl.disabled = false; inputEl.focus(); box.scrollTop = box.scrollHeight;
    });
}
window.sendQuickPrompt = function(txt) { const input = document.getElementById('ai-input'); if(input) { input.value = txt; document.getElementById('ai-form').dispatchEvent(new Event('submit')); } }

// ==========================================
// 🚀 6. KHỞI ĐỘNG CHUNG (LIFECYCLE)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if(checkAuthorization()) {
        // Nạp dữ liệu lần đầu
        fetchSystemStats(); 
        fetchServices(); 
        fetchAdminUsers(); 
        fetchAITasks();
        
        // Cắm cờ lập lịch tải ngầm (Tránh Spam)
        setInterval(fetchSystemStats, 2000); // 2s / lần
        setInterval(fetchAITasks, 2000);     // Hàng đợi Redis
        setInterval(fetchServices, 10000);   // Các API Service đang mở
    }
});