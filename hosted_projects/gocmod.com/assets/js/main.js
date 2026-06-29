/* ========================================
   GocMod.com - Main JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // Theme Toggle (Dark/Light Mode)
    // ========================================
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            body.classList.toggle('dark-mode');
            
            // Save theme preference
            const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
            
            // Announce to screen readers
            this.setAttribute('aria-label', 
                body.classList.contains('dark-mode') ? 'Chế độ sáng' : 'Chế độ tối'
            );
        });
    }
    
    // ========================================
    // Search Toggle
    // ========================================
    const searchToggle = document.getElementById('searchToggle');
    const searchClose = document.getElementById('searchClose');
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.querySelector('.search-input');
    
    if (searchToggle) {
        searchToggle.addEventListener('click', function() {
            searchBar.classList.add('active');
            searchInput.focus();
        });
    }
    
    if (searchClose) {
        searchClose.addEventListener('click', function() {
            searchBar.classList.remove('active');
            searchInput.value = '';
        });
    }
    
    // Close search on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (searchBar && searchBar.classList.contains('active')) {
                searchBar.classList.remove('active');
                searchInput.value = '';
            }
        }
    });
    
    // ========================================
    // Lazy Loading Images
    // ========================================
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // ========================================
    // Smooth Scroll for Internal Links
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // ========================================
    // App Card Click Animation
    // ========================================
    const appCards = document.querySelectorAll('.app-card');
    
    appCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't animate if clicking on download button
            if (e.target.closest('.btn-download')) {
                return;
            }
            
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // ========================================
    // Download Button Ripple Effect
    // ========================================
    const downloadButtons = document.querySelectorAll('.btn-download');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // ========================================
    // Online Status Indicator
    // ========================================
    function updateOnlineStatus() {
        if (navigator.onLine) {
            document.body.classList.remove('offline');
        } else {
            document.body.classList.add('offline');
            showToast('Bạn đang ngoại tuyến. Một số tính năng có thể không hoạt động.');
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // ========================================
    // Toast Notification
    // ========================================
    function showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-card);
            color: var(--text-color);
            padding: 12px 24px;
            border-radius: var(--radius);
            box-shadow: var(--shadow-hover);
            z-index: 9999;
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    // Add toast animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        @keyframes slideDown {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
        }
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        }
        .btn-download {
            position: relative;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
    
    // ========================================
    // Search Functionality (Basic)
    // ========================================
    const searchForm = document.querySelector('.search-form');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            const query = this.querySelector('.search-input').value.trim();
            
            if (!query) {
                e.preventDefault();
                showToast('Vui lòng nhập từ khóa tìm kiếm');
                return;
            }
            
            // For demo purposes, show a toast
            // In production, this would redirect to search results
            console.log('Searching for:', query);
        });
    }
    
    // ========================================
    // Performance: Debounce Function
    // ========================================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // ========================================
    // Handle Scroll Effects
    // ========================================
    let lastScroll = 0;
    const header = document.querySelector('.header');
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', debounce(() => {
        const currentScroll = window.pageYOffset;
        
        // Add shadow on scroll
        if (currentScroll > 10) {
            header.style.boxShadow = 'var(--shadow-hover)';
        } else {
            header.style.boxShadow = 'var(--shadow)';
        }
        
        lastScroll = currentScroll;
    }, 100));
    
    // ========================================
    // Service Worker Registration (PWA)
    // ========================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Uncomment to enable PWA
            // navigator.serviceWorker.register('/sw.js')
            //     .then(reg => console.log('Service Worker registered'))
            //     .catch(err => console.log('Service Worker registration failed'));
        });
    }
    
    // ========================================
    // Analytics (Optional)
    // ========================================
    function trackPageView() {
        // Add your analytics code here
        // Google Analytics, Matomo, etc.
        console.log('Page view tracked:', window.location.pathname);
    }
    
    trackPageView();
    
    // ========================================
    // Initialize
    // ========================================
    console.log('GocMod.com initialized');
    
});

// ========================================
// Utility Functions
// ========================================

// Format download count
function formatDownloadCount(count) {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Get URL parameter
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Đã sao chép vào bộ nhớ tạm!');
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

// Share API
async function shareContent(title, text, url) {
    if (navigator.share) {
        try {
            await navigator.share({ title, text, url });
            return true;
        } catch (err) {
            console.log('Share canceled:', err);
            return false;
        }
    } else {
        // Fallback: copy URL
        return copyToClipboard(url);
    }
}
