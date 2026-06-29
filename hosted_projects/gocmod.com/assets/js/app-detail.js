/* ========================================
   GocMod.com - App Detail Page JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // Share Functionality
    // ========================================
    const shareBtn = document.getElementById('shareBtn');
    
    if (shareBtn) {
        shareBtn.addEventListener('click', async function() {
            const shareData = {
                title: document.title,
                text: 'Check out this awesome app on GocMod.com!',
                url: window.location.href
            };
            
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.log('Share canceled:', err);
                }
            } else {
                // Fallback: Show share modal or copy link
                showShareModal(shareData);
            }
        });
    }
    
    // Show share modal for browsers without Web Share API
    function showShareModal(shareData) {
        // Create modal if it doesn't exist
        let modal = document.querySelector('.share-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'share-modal';
            modal.innerHTML = `
                <div class="share-modal-content">
                    <h3 class="share-modal-title">Chia sẻ ứng dụng</h3>
                    <div class="share-options">
                        <button class="share-option" data-share="facebook">
                            <i class="fab fa-facebook-f"></i>
                            <span>Facebook</span>
                        </button>
                        <button class="share-option" data-share="zalo">
                            <i class="fas fa-comment"></i>
                            <span>Zalo</span>
                        </button>
                        <button class="share-option" data-share="messenger">
                            <i class="fab fa-facebook-messenger"></i>
                            <span>Messenger</span>
                        </button>
                        <button class="share-option" data-share="copy">
                            <i class="fas fa-link"></i>
                            <span>Sao chép</span>
                        </button>
                        <button class="share-option" data-share="twitter">
                            <i class="fab fa-twitter"></i>
                            <span>Twitter</span>
                        </button>
                        <button class="share-option" data-share="more">
                            <i class="fas fa-ellipsis-h"></i>
                            <span>Thêm</span>
                        </button>
                    </div>
                    <button class="share-close">Đóng</button>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Add event listeners
            modal.querySelector('.share-close').addEventListener('click', () => {
                modal.classList.remove('active');
            });
            
            modal.querySelectorAll('.share-option').forEach(option => {
                option.addEventListener('click', function() {
                    const shareType = this.dataset.share;
                    handleShare(shareType, shareData);
                });
            });
            
            // Close on outside click
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }
        
        modal.classList.add('active');
    }
    
    // Handle different share types
    function handleShare(type, shareData) {
        const url = encodeURIComponent(shareData.url);
        const text = encodeURIComponent(shareData.text);
        const title = encodeURIComponent(shareData.title);
        
        switch(type) {
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                break;
            case 'zalo':
                window.open(`https://zalo.me/share?url=${url}`, '_blank');
                break;
            case 'messenger':
                window.open(`https://www.facebook.com/dialog/send?link=${url}&app_id=YOUR_APP_ID&redirect_uri=${url}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
                break;
            case 'copy':
                copyToClipboard(shareData.url);
                document.querySelector('.share-modal').classList.remove('active');
                break;
            case 'more':
                if (navigator.share) {
                    navigator.share(shareData);
                }
                break;
        }
    }
    
    // Copy to clipboard helper
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        // Show toast notification
        showToast('Đã sao chép liên kết!');
    }
    
    // Toast notification helper
    function showToast(message) {
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
        }, 3000);
    }
    
    // ========================================
    // Download Button with Countdown
    // ========================================
    const downloadBtn = document.querySelector('.btn-download-primary');
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
            // Prevent default for demo
            // In production, this would trigger actual download
            
            const originalContent = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang chuẩn bị...';
            this.style.pointerEvents = 'none';
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-check"></i> Đã bắt đầu tải!';
                this.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
                
                setTimeout(() => {
                    this.innerHTML = originalContent;
                    this.style.background = '';
                    this.style.pointerEvents = '';
                }, 2000);
            }, 1500);
        });
    }
    
    // ========================================
    // Screenshot Lightbox
    // ========================================
    const screenshots = document.querySelectorAll('.screenshot img');
    
    screenshots.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function() {
            openLightbox(this.src);
        });
    });
    
    function openLightbox(src) {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const lightboxImg = document.createElement('img');
        lightboxImg.src = src;
        lightboxImg.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: none;
            border: none;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            padding: 10px;
        `;
        
        closeBtn.addEventListener('click', () => {
            lightbox.style.opacity = '0';
            setTimeout(() => lightbox.remove(), 300);
        });
        
        lightbox.appendChild(lightboxImg);
        lightbox.appendChild(closeBtn);
        document.body.appendChild(lightbox);
        
        // Trigger animation
        setTimeout(() => {
            lightbox.style.opacity = '1';
        }, 10);
        
        // Close on outside click
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) {
                lightbox.style.opacity = '0';
                setTimeout(() => lightbox.remove(), 300);
            }
        });
    }
    
    // ========================================
    // Comment Form
    // ========================================
    const commentForm = document.querySelector('.comment-form');
    
    if (commentForm) {
        const commentInput = commentForm.querySelector('.comment-input');
        const submitBtn = commentForm.querySelector('.btn-primary');
        
        if (submitBtn) {
            submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                const commentText = commentInput.value.trim();
                
                if (!commentText) {
                    showToast('Vui lòng nhập bình luận!');
                    commentInput.focus();
                    return;
                }
                
                // Create new comment
                const newComment = document.createElement('div');
                newComment.className = 'comment';
                newComment.innerHTML = `
                    <div class="comment-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-author">Bạn</span>
                            <span class="comment-date">Vừa xong</span>
                        </div>
                        <p class="comment-text">${escapeHtml(commentText)}</p>
                        <div class="comment-actions">
                            <button class="comment-action"><i class="far fa-thumbs-up"></i> 0</button>
                            <button class="comment-action"><i class="far fa-comment"></i> Trả lời</button>
                        </div>
                    </div>
                `;
                
                const commentsList = document.querySelector('.comments-list');
                commentsList.insertBefore(newComment, commentsList.firstChild);
                
                // Clear input
                commentInput.value = '';
                
                showToast('Đã gửi bình luận!');
            });
        }
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ========================================
    // Like/Dislike Comment
    // ========================================
    document.querySelectorAll('.comment-action').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.innerHTML.includes('fa-thumbs-up')) {
                const icon = this.querySelector('i');
                const countSpan = this.childNodes[2];
                let count = parseInt(countSpan.textContent.trim());
                
                if (icon.classList.contains('far')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    count++;
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    count--;
                }
                
                countSpan.textContent = ' ' + count;
            }
        });
    });
    
    // ========================================
    // Related Apps Slider (if needed)
    // ========================================
    const relatedApps = document.querySelector('.apps-grid');
    
    if (relatedApps && window.innerWidth <= 768) {
        relatedApps.style.overflowX = 'auto';
        relatedApps.style.display = 'flex';
        relatedApps.style.gap = '15px';
        relatedApps.style.padding = '10px 0';
        
        const appCards = relatedApps.querySelectorAll('.app-card');
        appCards.forEach(card => {
            card.style.flex = '0 0 auto';
            card.style.width = '200px';
        });
    }
    
    // ========================================
    // Rating Stars Animation
    // ========================================
    const stars = document.querySelectorAll('.stars i');
    
    stars.forEach((star, index) => {
        star.style.animationDelay = `${index * 0.1}s`;
        star.style.animation = 'starPulse 2s ease infinite';
    });
    
    // Add star pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes starPulse {
            0%, 100% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.1);
                opacity: 0.8;
            }
        }
    `;
    document.head.appendChild(style);
    
    // ========================================
    // Version History Toggle (if exists)
    // ========================================
    const versionToggle = document.querySelector('.version-toggle');
    
    if (versionToggle) {
        versionToggle.addEventListener('click', function() {
            const versionHistory = document.querySelector('.version-history');
            if (versionHistory) {
                versionHistory.classList.toggle('active');
                this.textContent = versionHistory.classList.contains('active') 
                    ? 'Ẩn phiên bản cũ' 
                    : 'Xem phiên bản cũ';
            }
        });
    }
    
    console.log('App detail page initialized');
});

// ========================================
// Utility: Format numbers
// ========================================
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ========================================
// Utility: Get download link from URL param
// ========================================
function getDownloadLink() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('download') || '#';
}
