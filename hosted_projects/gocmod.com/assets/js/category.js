/* ========================================
   GocMod.com - Category Page JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // View Toggle (Grid/List)
    // ========================================
    const viewBtns = document.querySelectorAll('.view-btn');
    const appsGrid = document.getElementById('gamesContainer') || document.getElementById('appsContainer');
    
    if (viewBtns.length > 0 && appsGrid) {
        viewBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const view = this.dataset.view;
                
                // Update active state
                viewBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Toggle grid/list view
                if (view === 'list') {
                    appsGrid.classList.add('list-view');
                } else {
                    appsGrid.classList.remove('list-view');
                }
                
                // Save preference
                localStorage.setItem('categoryView', view);
            });
        });
        
        // Load saved preference
        const savedView = localStorage.getItem('categoryView');
        if (savedView === 'list' && appsGrid) {
            appsGrid.classList.add('list-view');
            viewBtns.forEach(b => {
                b.classList.toggle('active', b.dataset.view === 'list');
            });
        }
    }
    
    // ========================================
    // Category Filter
    // ========================================
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (categoryFilter && appsGrid) {
        categoryFilter.addEventListener('change', function() {
            const selectedCategory = this.value;
            filterApps();
        });
    }
    
    // ========================================
    // Mod Type Filter
    // ========================================
    const modTypeFilter = document.getElementById('modTypeFilter');
    
    if (modTypeFilter && appsGrid) {
        modTypeFilter.addEventListener('change', function() {
            const selectedMod = this.value;
            filterApps();
        });
    }
    
    // ========================================
    // Sort Functionality
    // ========================================
    const sortOrder = document.getElementById('sortOrder');
    
    if (sortOrder && appsGrid) {
        sortOrder.addEventListener('change', function() {
            const order = this.value;
            sortApps(order);
        });
    }
    
    // ========================================
    // Filter Function
    // ========================================
    function filterApps() {
        const category = categoryFilter?.value || 'all';
        const modType = modTypeFilter?.value || 'all';
        
        const cards = appsGrid.querySelectorAll('.app-card');
        let visibleCount = 0;
        
        cards.forEach(card => {
            const cardCategory = card.dataset.category || '';
            const cardMod = card.dataset.mod || '';
            
            const matchCategory = category === 'all' || cardCategory.includes(category);
            const matchMod = modType === 'all' || cardMod.includes(modType);
            
            if (matchCategory && matchMod) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Show/hide empty state
        toggleEmptyState(visibleCount);
    }
    
    // ========================================
    // Sort Function
    // ========================================
    function sortApps(order) {
        const cards = Array.from(appsGrid.querySelectorAll('.app-card'));
        
        cards.sort((a, b) => {
            const titleA = a.querySelector('.app-title')?.textContent.trim() || '';
            const titleB = b.querySelector('.app-title')?.textContent.trim() || '';
            
            switch(order) {
                case 'popular':
                case 'downloads':
                    // For demo, sort alphabetically reversed
                    return titleB.localeCompare(titleA);
                case 'rating':
                    // For demo, sort by badge type
                    const badgeA = a.querySelector('.badge')?.textContent || '';
                    const badgeB = b.querySelector('.badge')?.textContent || '';
                    return badgeA.localeCompare(badgeB);
                case 'newest':
                default:
                    return titleA.localeCompare(titleB);
            }
        });
        
        // Re-append sorted cards
        cards.forEach(card => appsGrid.appendChild(card));
    }
    
    // ========================================
    // Empty State Toggle
    // ========================================
    function toggleEmptyState(count) {
        let emptyState = document.querySelector('.empty-state');
        
        if (count === 0) {
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerHTML = `
                    <i class="fas fa-search"></i>
                    <h3>Không tìm thấy kết quả</h3>
                    <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                `;
                appsGrid.parentNode.appendChild(emptyState);
            }
            emptyState.style.display = 'block';
        } else if (emptyState) {
            emptyState.style.display = 'none';
        }
    }
    
    // ========================================
    // Search Integration
    // ========================================
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            
            searchTimeout = setTimeout(() => {
                const query = this.value.trim().toLowerCase();
                searchApps(query);
            }, 300);
        });
    }
    
    // ========================================
    // Search Function
    // ========================================
    function searchApps(query) {
        const cards = appsGrid.querySelectorAll('.app-card');
        let visibleCount = 0;
        
        cards.forEach(card => {
            const title = card.querySelector('.app-title')?.textContent.toLowerCase() || '';
            const matches = !query || title.includes(query);
            
            if (matches) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        toggleEmptyState(visibleCount);
    }
    
    // ========================================
    // Pagination (Basic)
    // ========================================
    const pageBtns = document.querySelectorAll('.page-btn');
    
    pageBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.classList.contains('active') || 
                this.querySelector('.fa-chevron-left') || 
                this.querySelector('.fa-chevron-right') ||
                this.querySelector('.fa-ellipsis-h')) {
                e.preventDefault();
                return;
            }
            
            // Update active state
            pageBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // In production, this would load the next page
            showToast(`Đang tải trang ${this.textContent}...`);
        });
    });
    
    // ========================================
    // Quick Download Button
    // ========================================
    const downloadBtns = document.querySelectorAll('.btn-download');
    
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const appCard = this.closest('.app-card');
            const appName = appCard?.querySelector('.app-title')?.textContent || 'Ứng dụng';
            
            // Show feedback
            const originalContent = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...';
            this.style.pointerEvents = 'none';
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-check"></i> Đã bắt đầu!';
                this.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
                
                showToast(`Đang tải ${appName}...`);
                
                setTimeout(() => {
                    this.innerHTML = originalContent;
                    this.style.background = '';
                    this.style.pointerEvents = '';
                }, 2000);
            }, 1000);
        });
    });
    
    // ========================================
    // App Card Click Animation
    // ========================================
    const appCards = document.querySelectorAll('.app-card');
    
    appCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.btn-download')) return;
            
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // ========================================
    // Infinite Scroll (Optional)
    // ========================================
    const observerOptions = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    };
    
    const loadMoreObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // In production, this would load more apps
                console.log('Load more apps...');
            }
        });
    }, observerOptions);
    
    const pagination = document.querySelector('.pagination');
    if (pagination) {
        loadMoreObserver.observe(pagination);
    }
    
    // ========================================
    // Share Category Page
    // ========================================
    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn btn-secondary';
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Chia sẻ';
    shareBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 999;';
    
    shareBtn.addEventListener('click', async function() {
        const shareData = {
            title: document.title,
            text: 'Check out this category on GocMod.com!',
            url: window.location.href
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share canceled:', err);
            }
        } else {
            copyToClipboard(shareData.url);
        }
    });
    
    // Uncomment to enable floating share button
    // document.body.appendChild(shareBtn);
    
    // ========================================
    // Helper: Copy to Clipboard
    // ========================================
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Đã sao chép liên kết!');
    }
    
    // ========================================
    // Helper: Toast Notification
    // ========================================
    function showToast(message, duration = 3000) {
        const toast = document.createElement('div');
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
    
    // ========================================
    // Initialize
    // ========================================
    console.log('Category page initialized');
    
});
