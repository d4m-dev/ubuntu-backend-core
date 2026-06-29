const API_BASE_URL = window.location.origin.includes("16868") 
    ? window.location.origin + "/api" 
    : "http://192.168.110.2:16868/api"; 

let authToken = localStorage.getItem("backend_token");
let statInterval;
let globalTunnelUrl = "";

// Tiện ích: Copy siêu tốc
window.copyToClipboard = async function(text, btnElement) {
    try {
        await navigator.clipboard.writeText(text);
        const originalHTML = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fa-solid fa-check text-green-400 scale-125 transition-transform duration-200"></i>';
        setTimeout(() => { btnElement.innerHTML = originalHTML; }, 2000);
    } catch(e) { console.error(e); }
}

// Tiện ích: Phân tích định dạng tin nhắn của AI (Markdown cơ bản)
function parseAIMessage(text) {
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em class="text-purple-300">$1</em>');
    formattedText = formattedText.replace(/\n/g, '<br>');
    return formattedText;
}

// Xác thực tài khoản Admin
async function checkAuth() {
    if (!authToken) {
        document.getElementById('login-overlay').classList.remove('hidden');
        clearInterval(statInterval);
    } else {
        document.getElementById('login-overlay').classList.add('hidden');
        await fetchServices(); 
        fetchAdminProjects();  
        fetchSystemStats();
        statInterval = setInterval(fetchSystemStats, 2000);
    }
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameVal = document.getElementById('username').value;
    const passwordVal = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    const spinner = document.getElementById('login-spinner');
    spinner.classList.remove('hidden'); errorDiv.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameVal, password: passwordVal })
        });
        const data = await response.json();
        if (response.ok) {
            authToken = data.access_token;
            localStorage.setItem("backend_token", authToken);
            checkAuth();
        } else {
            errorDiv.innerText = data.detail || "Sai thông tin bảo mật!";
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorDiv.innerText = "Mất kết nối đến Backend Core (Port 16868)!";
        errorDiv.classList.remove('hidden');
    } finally { spinner.classList.add('hidden'); }
});

function logout() { localStorage.removeItem("backend_token"); authToken = null; checkAuth(); }

async function fetchWithAuth(url, options = {}) {
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${authToken}`;
    const response = await fetch(url, options);
    if (response.status === 401) { logout(); throw new Error("Phiên bản hết hạn"); }
    return response;
}

// Cập nhật thông số phần cứng Real-time
async function fetchSystemStats() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/dashboard/system-stats`);
        const data = await response.json();
        document.getElementById('cpu-val').innerText = `${data.cpu_usage_percent}%`;
        document.getElementById('ram-val').innerText = `${data.ram.percent}%`;
        document.getElementById('ram-detail').innerText = `${data.ram.used_gb} / ${data.ram.total_gb} GB`;
        document.getElementById('disk-val').innerText = `${data.storage.percent}%`;
        document.getElementById('disk-detail').innerText = `Free: ${data.storage.free_gb} GB`;
    } catch (e) {}
}

// Cập nhật trạng thái các API dịch vụ
async function fetchServices() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/dashboard/services`);
        const data = await response.json();
        const container = document.getElementById('services-container');
        container.innerHTML = ''; 

        for (const [serviceName, info] of Object.entries(data.services)) {
            const isChecked = info.active ? 'checked' : '';
            
            if (serviceName === 'internet_tunnel') {
                globalTunnelUrl = (info.active && info.public_url) ? info.public_url : "";
            }

            let linkHtml = '';
            if (info.active && info.public_url) {
                linkHtml = `<div class="mt-3 text-xs bg-black/40 py-2 px-3 rounded-lg flex items-center justify-between border border-green-500/20 group w-full max-w-full">
                        <i class="fa-solid fa-globe text-green-400 mr-2 flex-shrink-0 animate-pulse"></i>
                        <a href="${info.public_url}" target="_blank" class="text-green-400 hover:text-green-300 font-mono tracking-wider mr-3 truncate flex-1 min-w-0 block">${info.public_url}</a>
                        <button onclick="copyToClipboard('${info.public_url}', this)" class="text-gray-400 hover:text-white transition-colors bg-white/5 p-1.5 rounded flex-shrink-0"><i class="fa-regular fa-copy"></i></button>
                    </div>`;
            }

            const html = `
                <div class="flex justify-between items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition border border-white/5">
                    <div class="flex-1 pr-4 min-w-0"> 
                        <h4 class="font-bold text-blue-300 capitalize text-sm truncate">${serviceName.replace(/_/g, ' ')}</h4>
                        <p class="text-[11px] text-gray-400 mt-1 uppercase tracking-widest truncate">${info.description}</p>
                        ${linkHtml}
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-2">
                        <input type="checkbox" id="toggle-${serviceName}" ${isChecked} onchange="toggleService('${serviceName}')" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 shadow-inner"></div>
                    </label>
                </div>`;
            container.innerHTML += html;
        }
    } catch (e) {}
}

async function toggleService(serviceName) {
    try {
        await fetchWithAuth(`${API_BASE_URL}/dashboard/services/toggle/${serviceName}`, { method: 'POST' });
        setTimeout(async () => {
            await fetchServices();
            if (serviceName === 'internet_tunnel') {
                fetchAdminProjects(); 
            }
        }, 600); 
    } catch (error) { fetchServices(); }
}

// Quản lý danh sách các dự án con
async function fetchAdminProjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/`); 
        const data = await response.json();
        const listDiv = document.getElementById('admin-project-list');
        listDiv.innerHTML = '';

        if(data.projects.length === 0) {
            listDiv.innerHTML = '<p class="text-gray-500 text-center text-xs py-4 font-mono">/hosted_projects đang trống</p>';
            return;
        }

        const baseUrl = globalTunnelUrl ? globalTunnelUrl : `${window.location.protocol}//${window.location.hostname}:16868`;

        data.projects.forEach(proj => {
            const isFrozenClass = proj.is_frozen ? 'frozen-item' : '';
            const statusIcon = proj.is_frozen ? '<i class="fa-solid fa-play text-green-400 ml-1"></i>' : '<i class="fa-solid fa-pause text-yellow-400 ml-1"></i>';
            const statusText = proj.is_frozen ? '<span class="text-red-400 text-[10px] ml-2 border border-red-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider bg-red-500/10">Bảo trì</span>' : '';

            listDiv.innerHTML += `
                <div class="flex items-center justify-between p-3 bg-black/40 rounded-xl hover:bg-black/60 transition mb-2 border border-white/5 ${isFrozenClass}">
                    <div class="flex items-center space-x-3 min-w-0">
                        <div class="w-8 h-8 rounded-lg bg-blue-500/10 flex flex-shrink-0 items-center justify-center border border-blue-500/20"><i class="fa-solid fa-folder-open text-blue-400 text-xs"></i></div>
                        <div class="min-w-0">
                            <p class="font-bold text-sm text-gray-200 capitalize flex items-center truncate">${proj.name.replace(/-/g, ' ')} ${statusText}</p>
                            <p class="text-[10px] text-gray-500 font-mono tracking-wider mt-0.5 truncate"><i class="fa-solid fa-hard-drive mr-1"></i>${proj.size}</p>
                        </div>
                    </div>
                    <div class="flex space-x-2 flex-shrink-0 ml-2">
                        <button onclick="toggleAdminFreeze('${proj.name}')" class="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white w-8 h-8 rounded-lg transition-colors flex items-center justify-center shadow-md">
                            ${statusIcon}
                        </button>
                        <a href="${baseUrl}/${proj.name}" target="_blank" class="bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white w-8 h-8 rounded-lg transition-all flex items-center justify-center shadow-md">
                            <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                        </a>
                    </div>
                </div>
            `;
        });
    } catch(e) {}
}

window.toggleAdminFreeze = async function(projectName) {
    try {
        await fetchWithAuth(`${API_BASE_URL}/projects/toggle/${projectName}`, { method: 'POST' });
        fetchAdminProjects();
    } catch (e) { alert("Lỗi hệ thống thao tác!"); }
}

// Logic Kéo thả và triển khai dự án dạng .ZIP
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadText = document.getElementById('upload-text');
const uploadIcon = document.getElementById('upload-icon');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-active'); });

dropZone.addEventListener('dragleave', () => { 
    dropZone.classList.remove('drag-active'); 
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); dropZone.classList.remove('drag-active');
    if(e.dataTransfer.files.length) handleAdminUpload(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
    if(e.target.files.length) handleAdminUpload(e.target.files[0]);
});

async function handleAdminUpload(file) {
    if(!file.name.endsWith('.zip')) return alert("Chỉ hỗ trợ nén .ZIP");
    
    uploadIcon.className = "fa-solid fa-circle-notch fa-spin text-3xl text-yellow-400 mb-2";
    uploadText.innerText = `Deploying: ${file.name}...`;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(`${API_BASE_URL}/projects/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });
        
        if (!res.ok) {
            if(res.status === 401) { logout(); throw new Error("Vui lòng đăng nhập lại!"); }
            throw new Error("Lỗi Server Giải nén");
        }

        uploadIcon.className = "fa-solid fa-check-circle text-3xl text-green-400 mb-2";
        uploadText.innerText = "Deploy Hoàn Tất!";
        setTimeout(() => {
            uploadIcon.className = "fa-solid fa-cloud-arrow-up text-3xl text-blue-400 mb-2";
            uploadText.innerText = "Thả file .ZIP vào đây để Deploy";
        }, 3000);
        
        fetchAdminProjects(); 
    } catch (err) {
        uploadIcon.className = "fa-solid fa-triangle-exclamation text-3xl text-red-400 mb-2";
        uploadText.innerText = err.message || "Lỗi. Thử lại sau.";
    }
}

// Bộ não xử lý hội thoại AI Admin
const aiForm = document.getElementById('ai-form');
const aiInput = document.getElementById('ai-input');
const aiChatBox = document.getElementById('ai-chat-box');

window.sendQuickPrompt = function(promptText) {
    aiInput.value = promptText;
    aiForm.dispatchEvent(new Event('submit')); 
}

function appendMessage(sender, text, actionText = null) {
    const isUser = sender === 'user';
    const align = isUser ? 'justify-end' : 'justify-start';
    
    const bg = isUser 
        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-none shadow-md shadow-purple-500/20 border border-purple-500/50' 
        : 'bg-black/50 text-gray-300 rounded-bl-none shadow-sm border border-white/10';
        
    const icon = isUser ? '' : '<div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex flex-shrink-0 items-center justify-center shadow-md"><i class="fa-solid fa-robot text-white text-xs"></i></div>';
    
    let actionHtml = '';
    if (actionText) {
        actionHtml = `<div class="mt-3 text-xs text-green-400 bg-green-500/10 py-1.5 px-3 rounded-lg border border-green-500/20 flex items-center"><i class="fa-solid fa-bolt text-yellow-400 mr-2 animate-pulse"></i>${actionText}</div>`;
    }

    const displayText = isUser ? text : parseAIMessage(text);

    const html = `
        <div class="flex items-end space-x-3 ${align}">
            ${!isUser ? icon : ''}
            <div class="${bg} p-3.5 rounded-2xl max-w-[85%] text-[13px] leading-relaxed relative">
                ${displayText}
                ${actionHtml}
            </div>
        </div>
    `;
    aiChatBox.innerHTML += html;
    aiChatBox.scrollTop = aiChatBox.scrollHeight;
}

aiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = aiInput.value.trim();
    if (!msg) return;

    appendMessage('user', msg);
    aiInput.value = '';
    aiInput.disabled = true;

    const tempId = 'loading-' + Date.now();
    aiChatBox.innerHTML += `
        <div id="${tempId}" class="flex items-end space-x-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex flex-shrink-0 items-center justify-center shadow-md"><i class="fa-solid fa-robot text-white text-xs ai-glow"></i></div>
            <div class="bg-black/50 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-none flex items-center space-x-1 h-10">
                <div class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                <div class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
        </div>`;
    aiChatBox.scrollTop = aiChatBox.scrollHeight;

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/ai-admin/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        
        document.getElementById(tempId).remove();
        
        if (response.ok) {
            const data = await response.json();
            appendMessage('ai', data.reply, data.action_executed);
            if(data.action_executed) fetchServices();
        } else {
            const err = await response.json();
            appendMessage('ai', `❌ Lỗi kết nối: ${err.detail}`);
        }
    } catch (error) {
        document.getElementById(tempId).remove();
        appendMessage('ai', "❌ Lão đại, tôi không thể kết nối tới lõi xử lý AI.");
    } finally {
        aiInput.disabled = false;
        aiInput.focus();
    }
});

document.addEventListener('DOMContentLoaded', checkAuth);