import { loadAllWallpapers } from './wallpapers-loader.js';

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('wallpaper-grid');
    const modal = document.getElementById('image-modal');
    const closeButton = document.querySelector('.close-button');
    const searchInput = document.getElementById('search-input');
    const loadingSpinner = document.getElementById('loading-spinner');
    const navLinks = document.querySelectorAll('.nav-link');

    // --- DOM Restructuring and Style Injection ---
    function injectStylesAndRestructureDOM() {
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --bg-primary: #F5F1E6;      /* --cream-white from styles.css */
                --bg-secondary: #ffffff;    /* white for cards/chips */
                --bg-tertiary: #f0ebe0;     /* hover color */
                --text-main: #333;          /* --dark-text from styles.css */
                --text-sub: #888;           /* lighter dark text */
                --primary-color: #F9A7BB;   /* --peach-pink from styles.css */
                --light-text: #fff;         /* --light-text from styles.css */
                --border: rgba(0, 0, 0, 0.1);
                --shadow-lg: 0 4px 15px rgba(0, 0, 0, 0.1); /* --shadow from styles.css */
            }

            body.modal-open {
                overflow: hidden; /* Chặn cuộn nền khi modal mở */
            }

            /* Explore Category Chips */
            #explore-categories {
                padding: 10px 15px 15px 15px;
                display: flex;
                gap: 10px;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch; /* For smoother scrolling on iOS */
                scrollbar-width: none; /* Firefox */
                -ms-overflow-style: none; /* IE and Edge */
            }
            #explore-categories::-webkit-scrollbar {
                display: none; /* Chrome, Safari, Opera */
            }
            .category-chip {
                padding: 9px 18px;
                border-radius: 25px;
                background-color: var(--bg-secondary);
                color: var(--text-sub);
                cursor: pointer;
                font-weight: 500;
                font-size: 0.9em;
                white-space: nowrap;
                transition: all 0.2s ease-in-out;
                border: 1px solid var(--border);
            }
            .category-chip:hover {
                background-color: var(--bg-tertiary);
                color: var(--text-main);
                border-color: var(--primary-color);
                transform: translateY(-1px);
            }
            .category-chip.active {
                background-color: var(--primary-color);
                color: var(--light-text);
                border-color: var(--primary-color);
                font-weight: 600;
                box-shadow: 0 3px 10px -2px var(--primary-color);
            }

            /* Grid Styles */
            #wallpaper-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 15px;
                padding: 15px;
            }
    
            .wallpaper-item {
                position: relative;
                aspect-ratio: 9 / 16;
                border-radius: 12px;
                overflow: hidden;
                cursor: pointer;
                transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                background-color: var(--bg-secondary); /* Placeholder color */
            }
    
            .wallpaper-item:hover {
                transform: scale(1.03);
                box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            }
    
            .wallpaper-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: opacity 0.3s ease-in-out;
            }
            
            .wallpaper-item img[data-src] {
                opacity: 0; /* Hide until loaded */
            }
            
            .wallpaper-item img:not([data-src]) {
                opacity: 1; /* Show when loaded */
            }
    
            .wallpaper-item .title {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
                color: white;
                padding: 20px 10px 10px;
                font-size: 0.9em;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                transition: opacity 0.2s ease;
                opacity: 0;
            }
            
            .wallpaper-item:hover .title {
                opacity: 1;
            }
    
            .wallpaper-item-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: flex-end;
                align-items: flex-start;
                padding: 10px;
                background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%);
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .wallpaper-item:hover .wallpaper-item-overlay {
                opacity: 1;
            }
    
            /* --- Button Styles --- */
            .btn-icon {
                background-color: rgba(20, 20, 20, 0.5);
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                width: 36px;
                height: 36px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background-color 0.2s, transform 0.2s, color 0.2s;
                font-size: 16px;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
            }

            .btn-icon:hover {
                background-color: rgba(40, 40, 40, 0.7);
                transform: scale(1.1);
            }

            .btn-icon.active {
                color: #ff4757; /* Red for active */
                border-color: rgba(255, 71, 87, 0.3);
                background-color: rgba(255, 71, 87, 0.15);
            }

    
            /* Modal Styles */
            .modal {
                display: none; /* Ẩn modal theo mặc định */
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                background-color: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                align-items: center;
                justify-content: center;
                padding: 10px;
            }
    
            .modal.show {
                display: flex; /* Hiển thị modal khi có class 'show' */
            }
    
            .modal-content-wrapper {
                position: relative;
                margin: auto;
                display: block;
                width: auto;
                height: auto;
            }
    
            #modal-image {
                display: block;
                max-width: 85vw;
                max-height: 85vh;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                object-fit: contain;
            }
    
            .modal-overlay-content {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 20px;
                background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
                border-bottom-left-radius: 16px;
                border-bottom-right-radius: 16px;
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 15px;
                opacity: 1; /* Luôn hiển thị caption và nút */
                transform: translateY(0); /* Bỏ hiệu ứng trượt lên */
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
    
            #modal-title {
                font-size: 1.2em;
                font-weight: bold;
                margin: 0;
                flex-grow: 1;
                text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
            }
    
            .modal-actions {
                display: flex;
                gap: 10px;
                align-items: center;
                flex-shrink: 0;
            }
            
            #download-button {
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 20px;
                font-weight: bold;
            }
            
            #modal-favorite-button {
                width: 44px;
                height: 44px;
                font-size: 20px;
                background-color: rgba(255, 255, 255, 0.1);
            }

            #modal-favorite-button.active {
                background-color: rgba(255, 71, 87, 0.2);
                color: #ff4757;
            }
            
            .close-button {
                position: absolute;
                top: 10px;
                right: 10px;
                color: #fff;
                font-size: 20px;
                font-weight: normal;
                transition: 0.3s;
                cursor: pointer;
                z-index: 1010;
                text-shadow: none;
                background: rgba(30, 30, 30, 0.7);
                border-radius: 50%;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .close-button:hover {
                background: rgba(50, 50, 50, 0.9);
                transform: scale(1.1);
            }
        `;
        document.head.appendChild(style);

        // Restructure Modal DOM for new overlay design
        if (modal && !modal.querySelector('.modal-content-wrapper')) {
            const modalImage = document.getElementById('modal-image');
            const modalTitle = document.getElementById('modal-title');
            const downloadButton = document.getElementById('download-button');
            
            let modalHeartButton = document.getElementById('modal-favorite-button');
            if (!modalHeartButton) {
                modalHeartButton = document.createElement('button');
                modalHeartButton.id = 'modal-favorite-button';
                modalHeartButton.className = 'btn-icon';
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'modal-content-wrapper';

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay-content';

            const actions = document.createElement('div');
            actions.className = 'modal-actions';

            // Detach elements from their current parents before moving
            [modalTitle, modalHeartButton, downloadButton, modalImage].forEach(el => el?.parentNode?.removeChild(el));

            wrapper.appendChild(modalImage);
            overlay.appendChild(modalTitle);
            actions.appendChild(modalHeartButton);
            actions.appendChild(downloadButton);
            overlay.appendChild(actions);
            wrapper.appendChild(overlay);

            // Để đảm bảo căn giữa chính xác, chúng ta phải xóa mọi phần tử cũ khỏi modal
            // trước khi thêm cấu trúc mới được tạo vào.
            const closeBtn = modal.querySelector('.close-button');
            if (closeBtn) closeBtn.parentNode.removeChild(closeBtn); // Tách nút đóng ra trước
            modal.innerHTML = ''; // Xóa sạch modal
            modal.appendChild(wrapper);
            if (closeBtn) wrapper.appendChild(closeBtn); // Gắn lại nút đóng vào bên trong wrapper
        }

        // Inject explore categories container
        const gridElement = document.getElementById('wallpaper-grid');
        if (gridElement && !document.getElementById('explore-categories')) {
            const categoryContainer = document.createElement('div');
            categoryContainer.id = 'explore-categories';
            categoryContainer.style.display = 'none'; // Hide by default
            gridElement.parentNode.insertBefore(categoryContainer, gridElement);
        }
    }

    injectStylesAndRestructureDOM();

    // Re-select elements after potential DOM restructuring
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const downloadButton = document.getElementById('download-button');
    const modalHeartButton = document.getElementById('modal-favorite-button');

    let allWallpapers = [];
    let favoriteWallpapers = JSON.parse(localStorage.getItem('favoriteWallpapers')) || [];
    let currentFilter = 'all'; // 'all', 'explore', 'favorites'
    let currentExploreCategory = 'all'; // New state for explore sub-filter
    let currentModalWallpaper = null;

    const categoryDisplayNames = {
        'all': 'Tất cả',
        'aodai': 'Áo dài',
        'damlua': 'Đầm lụa',
        'bikini': 'Bikini',
        'nicebody': 'Nice Body',
        'ngaunhien': 'Internet'
    };

    // --- Favorites Logic ---
    function isFavorite(wallpaperId) {
        return favoriteWallpapers.includes(wallpaperId);
    }

    function toggleFavorite(wallpaper) {
        const wallpaperId = wallpaper.id;
        if (isFavorite(wallpaperId)) {
            favoriteWallpapers = favoriteWallpapers.filter(id => id !== wallpaperId);
        } else {
            favoriteWallpapers.push(wallpaperId);
        }
        localStorage.setItem('favoriteWallpapers', JSON.stringify(favoriteWallpapers));
        
        renderFilteredWallpapers();
        if (currentModalWallpaper && currentModalWallpaper.id === wallpaper.id) {
            updateModalFavoriteButton();
        }
    }

    // --- New Function: Render Explore Categories ---
    function renderExploreCategories() {
        const container = document.getElementById('explore-categories');
        if (!container) return;

        const uniqueCategories = ['all', ...new Set(allWallpapers.map(w => w.topLevelCategory).filter(Boolean))];
        
        container.innerHTML = '';

        uniqueCategories.forEach(catKey => {
            // Only render if a display name is defined
            if (categoryDisplayNames[catKey]) {
                const displayName = categoryDisplayNames[catKey];
                
                const chip = document.createElement('button');
                chip.className = 'category-chip';
                chip.dataset.category = catKey;
                chip.textContent = displayName;

                if (catKey === currentExploreCategory) {
                    chip.classList.add('active');
                }

                chip.addEventListener('click', () => {
                    currentExploreCategory = catKey;
                    // Update active state on chips
                    container.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    // Re-render wallpapers for the explore view
                    renderFilteredWallpapers();
                });

                container.appendChild(chip);
            }
        });
    }

        // --- Tải dữ liệu hình nền bằng bộ tải động ---
    async function loadWallpapers() {
        loadingSpinner.style.display = 'block';
        grid.innerHTML = '';
        try {
            allWallpapers = await loadAllWallpapers();
            renderExploreCategories(); // Render categories after data is loaded
            renderFilteredWallpapers();
        } catch (error) {
            console.error("Could not load wallpapers:", error);
            grid.innerHTML = '<p style="text-align: center; color: red;">Lỗi: Không thể tải dữ liệu hình nền.</p>';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    // --- Display Wallpapers in the Grid ---
    function displayWallpapers(wallpapers) {
        grid.innerHTML = '';
        if (wallpapers.length === 0) {
            grid.innerHTML = '<p style="text-align: center;">Không tìm thấy hình nền nào.</p>';
            return;
        }
        wallpapers.forEach(wallpaper => {
            const item = document.createElement('div');
            item.className = 'wallpaper-item';
            
            // Lazy loading setup
            const img = document.createElement('img');
            img.dataset.src = wallpaper.url; // Store real src in data attribute
            img.alt = wallpaper.title;
            
            const overlayButtons = document.createElement('div');
            overlayButtons.className = 'wallpaper-item-overlay';

            const isFav = isFavorite(wallpaper.id);
            const heartButton = document.createElement('button');
            heartButton.className = `btn-icon btn-favorite ${isFav ? 'active' : ''}`;
            heartButton.innerHTML = `<i class="${isFav ? 'fas' : 'far'} fa-heart"></i>`;
            heartButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent modal from opening
                toggleFavorite(wallpaper);
            });

            const titleDiv = document.createElement('div');
            titleDiv.className = 'title';
            titleDiv.textContent = wallpaper.title;

            overlayButtons.appendChild(heartButton);
            item.appendChild(img);
            item.appendChild(overlayButtons);
            item.appendChild(titleDiv);
            
            item.addEventListener('click', () => openModal(wallpaper));
            grid.appendChild(item);
        }); 
        
        // Initialize lazy loading
        lazyLoadImages();
    }

    // --- Lazy Loading with Intersection Observer ---
    function lazyLoadImages() {
        const itemsToLoad = document.querySelectorAll('.wallpaper-item');
        
        const itemObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const item = entry.target;
                    const img = item.querySelector('img[data-src]');
                    if (img) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(item);
                }
            });
        });

        itemsToLoad.forEach(item => {
            itemObserver.observe(item);
        });
    }

    // --- Modal Logic ---
    function openModal(wallpaper) {
        currentModalWallpaper = wallpaper;
        modalImage.src = ''; // Clear previous image
        modalImage.src = wallpaper.url; // Set new image
        modalTitle.textContent = wallpaper.title;
        if (downloadButton) {
            downloadButton.href = wallpaper.url;
            downloadButton.setAttribute('download', `${wallpaper.title.replace(/\s+/g, '_')}.jpg`);
        }
        document.body.classList.add('modal-open'); // Thêm class để chặn cuộn
        modal.classList.add('show');
        updateModalFavoriteButton();
    }

    function closeModal() {
        modal.classList.remove('show');
        document.body.classList.remove('modal-open'); // Xóa class để cho phép cuộn lại
        currentModalWallpaper = null;
    }

    function updateModalFavoriteButton() {
        if (!modalHeartButton || !currentModalWallpaper) return;

        if (isFavorite(currentModalWallpaper.id)) {
            modalHeartButton.classList.add('active');
            modalHeartButton.innerHTML = '<i class="fas fa-heart"></i>';
        } else {
            modalHeartButton.classList.remove('active');
            modalHeartButton.innerHTML = '<i class="far fa-heart"></i>';
        }
    }

    // --- Event Listeners ---
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });

    modalHeartButton.addEventListener('click', () => {
        if (currentModalWallpaper) {
            toggleFavorite(currentModalWallpaper);
        }
    });

    // --- Search Functionality ---
    searchInput.addEventListener('input', (e) => {
        renderFilteredWallpapers();
    });

    // --- Navigation Logic ---
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentFilter = link.dataset.filter;

            // Show/hide explore categories container
            const exploreCatContainer = document.getElementById('explore-categories');
            if (exploreCatContainer) {
                exploreCatContainer.style.display = (currentFilter === 'explore') ? 'flex' : 'none';
            }

            renderFilteredWallpapers();
        });
    });

    function renderFilteredWallpapers() {
        const searchTerm = searchInput.value.toLowerCase();
        let sourceList;

        if (currentFilter === 'favorites') {
            sourceList = allWallpapers.filter(w => isFavorite(w.id));
        } else if (currentFilter === 'explore') {
            if (currentExploreCategory !== 'all') {
                // Với các danh mục cụ thể, chỉ lọc và không trộn
                sourceList = allWallpapers.filter(w => w.topLevelCategory === currentExploreCategory);
            } else {
                // Với mục "Tất cả" trong Khám phá, trộn ngẫu nhiên toàn bộ ảnh
                sourceList = [...allWallpapers].sort(() => 0.5 - Math.random());
            }
        } else { // 'all'
            sourceList = allWallpapers;
        }

        const wallpapersToDisplay = sourceList.filter(wallpaper => 
            wallpaper.title.toLowerCase().includes(searchTerm) ||
            wallpaper.category.toLowerCase().includes(searchTerm)
        );

        displayWallpapers(wallpapersToDisplay);
    }

    // --- Initial Load ---
    loadWallpapers();
});