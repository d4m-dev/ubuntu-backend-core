// ===========================
// DỮ LIỆU GIẢ LẬP
// ===========================
const storiesData = [
  { username: "ban_a", initial: "A" },
  { username: "ban_b", initial: "B" },
  { username: "ban_c", initial: "C" },
  { username: "dev_d", initial: "D" },
  { username: "design_e", initial: "E" },
  { username: "music_f", initial: "F" },
];

let postsData = [
  {
    id: 1,
    username: "ban_a",
    initial: "A",
    location: "TP. HCM, Việt Nam",
    image: "https://picsum.photos/600/600?random=1",
    caption: "Hôm nay trời đẹp quá 😎",
    likes: 8,
    createdAt: "1 GIỜ TRƯỚC",
    comments: [
      { username: "ban_b", text: "Đẹp quá bạn ơi!" },
      { username: "dev_d", text: "Chụp góc này xịn nè." },
    ],
  },
  {
    id: 2,
    username: "travel_c",
    initial: "C",
    location: "Đà Lạt, Việt Nam",
    image: "https://picsum.photos/600/600?random=2",
    caption: "Sáng Đà Lạt mờ sương 🌲",
    likes: 15,
    createdAt: "3 GIỜ TRƯỚC",
    comments: [{ username: "ban_a", text: "Nhìn chill thật." }],
  },
  {
    id: 3,
    username: "foodie_d",
    initial: "D",
    location: "Hà Nội, Việt Nam",
    image: "https://picsum.photos/600/600?random=3",
    caption: "Bún chả xong là không còn buồn nữa 😋",
    likes: 22,
    createdAt: "HÔM QUA",
    comments: [],
  },
];

const suggestionsData = [
  { username: "coder_c", initial: "C", subtitle: "Đề xuất cho bạn" },
  { username: "design_d", initial: "D", subtitle: "Đề xuất cho bạn" },
  { username: "music_e", initial: "E", subtitle: "Mới tham gia" },
];

// ===========================
// TIỆN ÍCH
// ===========================
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => parent.querySelectorAll(selector);

function showToast(message) {
  const toastEl = $("#toast");
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 1800);
}

// ===========================
// RENDER STORIES
// ===========================
function renderStories() {
  const container = $("#storiesContainer");
  if (!container) return;
  container.innerHTML = "";

  storiesData.forEach((story) => {
    const storyEl = document.createElement("button");
    storyEl.className = "pg-story";
    storyEl.innerHTML = `
      <div class="pg-story-avatar-border">
        <div class="pg-avatar">${story.initial}</div>
      </div>
      <span>${story.username}</span>
    `;
    storyEl.addEventListener("click", () => {
      showToast(`Story của ${story.username} (demo, không có video)`);
    });
    container.appendChild(storyEl);
  });
}

// ===========================
// RENDER GỢI Ý FOLLOW
// ===========================
function renderSuggestions() {
  const container = $("#suggestionsContainer");
  if (!container) return;
  container.innerHTML = "";

  suggestionsData.forEach((s) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="pg-avatar">${s.initial}</div>
      <div class="pg-suggestion-info">
        <div class="pg-username">${s.username}</div>
        <div class="pg-text-muted">${s.subtitle}</div>
      </div>
      <button class="link-btn" type="button">Theo dõi</button>
    `;
    const followBtn = $("button", li);
    followBtn.addEventListener("click", () => {
      showToast(`Bạn đã theo dõi ${s.username} (demo)`);
    });
    container.appendChild(li);
  });
}

// ===========================
// RENDER FEED (POSTS)
// ===========================
function renderPosts(filterKeyword = "") {
  const container = $("#feedContainer");
  if (!container) return;
  container.innerHTML = "";

  const keyword = filterKeyword.trim().toLowerCase();

  postsData
    .filter((post) =>
      keyword ? post.username.toLowerCase().includes(keyword) : true
    )
    .forEach((post) => {
      const article = document.createElement("article");
      article.className = "pg-post";
      article.dataset.postId = post.id;

      const commentsHtml = post.comments
        .map(
          (c) =>
            `<li><strong>${c.username}</strong> ${escapeHtml(c.text)}</li>`
        )
        .join("");

      article.innerHTML = `
        <header class="pg-post-header">
          <div class="pg-avatar">${post.initial}</div>
          <div class="pg-post-user">
            <span class="pg-username">${post.username}</span>
            <span class="pg-text-muted">${post.location || ""}</span>
          </div>
        </header>

        <div class="pg-post-image">
          <img src="${post.image}" alt="Ảnh của ${post.username}" />
        </div>

        <div class="pg-post-actions">
          <div class="pg-post-actions-left">
            <button class="pg-like-btn" data-liked="false">🤍</button>
            <button class="icon-btn" title="Bình luận">💬</button>
            <button class="icon-btn" title="Chia sẻ">📤</button>
          </div>
          <div class="pg-post-actions-right">
            <button class="icon-btn" title="Lưu">🔖</button>
          </div>
        </div>

        <div class="pg-post-likes">
          <span class="likes-count">${post.likes}</span> lượt thích
        </div>

        <div class="pg-post-caption">
          <strong>${post.username}</strong>
          <span>${escapeHtml(post.caption)}</span>
        </div>

        <div class="pg-post-comments">
          <ul class="comments-list">
            ${commentsHtml}
          </ul>
        </div>

        <div class="pg-post-time">${post.createdAt}</div>

        <form class="pg-comment-form">
          <input
            type="text"
            class="pg-comment-input"
            placeholder="Thêm bình luận..."
          />
          <button type="submit" class="pg-comment-submit">Đăng</button>
        </form>
      `;

      container.appendChild(article);
      attachPostEvents(article, post.id);
    });
}

// Escape HTML đơn giản để tránh lỗi khi user gõ ký tự đặc biệt
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ===========================
// SỰ KIỆN TRÊN MỖI POST
// ===========================
function attachPostEvents(postEl, postId) {
  const likeBtn = $(".pg-like-btn", postEl);
  const likesCountEl = $(".likes-count", postEl);
  const imgEl = $(".pg-post-image img", postEl);
  const commentForm = $(".pg-comment-form", postEl);
  const commentInput = $(".pg-comment-input", postEl);
  const commentsList = $(".comments-list", postEl);

  const postData = postsData.find((p) => p.id === postId);
  if (!postData) return;

  // Like/unlike
  likeBtn.addEventListener("click", () => {
    toggleLike(postData, likeBtn, likesCountEl);
  });

  // Double click hình để like
  imgEl.addEventListener("dblclick", () => {
    if (likeBtn.dataset.liked === "false") {
      toggleLike(postData, likeBtn, likesCountEl);
      showToast("Đã thích bài viết");
    }
  });

  // Comment
  commentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = commentInput.value.trim();
    if (!text) return;
    const newComment = { username: "you", text };

    // Lưu vào dữ liệu
    postData.comments.push(newComment);

    // Render nhanh vào DOM
    const li = document.createElement("li");
    li.innerHTML = `<strong>${newComment.username}</strong> ${escapeHtml(
      newComment.text
    )}`;
    commentsList.appendChild(li);

    commentInput.value = "";
  });
}

function toggleLike(postData, likeBtn, likesCountEl) {
  const liked = likeBtn.dataset.liked === "true";
  if (!liked) {
    postData.likes += 1;
    likeBtn.textContent = "❤️";
    likeBtn.dataset.liked = "true";
  } else {
    postData.likes -= 1;
    likeBtn.textContent = "🤍";
    likeBtn.dataset.liked = "false";
  }
  likesCountEl.textContent = postData.likes;
}

// ===========================
// MODAL TẠO BÀI MỚI
// ===========================
function setupCreatePostModal() {
  const openBtn = $("#openCreateModal");
  const modal = $("#createModal");
  const closeBackdrop = $("#closeCreateModal");
  const closeBtn = $("#closeCreateModalBtn");
  const form = $("#createPostForm");

  if (!openBtn || !modal || !closeBackdrop || !closeBtn || !form) return;

  const openModal = () => {
    modal.setAttribute("aria-hidden", "false");
  };
  const closeModal = () => {
    modal.setAttribute("aria-hidden", "true");
    form.reset();
  };

  openBtn.addEventListener("click", openModal);
  closeBackdrop.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = $("#newPostUsername").value.trim() || "user";
    const location = $("#newPostLocation").value.trim();
    const image = $("#newPostImage").value.trim();
    const caption = $("#newPostCaption").value.trim();

    if (!image || !caption) return;

    const newPost = {
      id: Date.now(),
      username,
      initial: username[0]?.toUpperCase() || "U",
      location,
      image,
      caption,
      likes: 0,
      createdAt: "VỪA XONG",
      comments: [],
    };

    postsData.unshift(newPost); // thêm lên đầu
    renderPosts($("#searchInput").value);
    closeModal();
    showToast("Đã đăng bài (demo – không lưu server)");
  });

  // Đóng modal bằng phím Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      modal.setAttribute("aria-hidden", "true");
    }
  });
}

// ===========================
// TÌM KIẾM NGƯỜI DÙNG
// ===========================
function setupSearch() {
  const input = $("#searchInput");
  if (!input) return;
  input.addEventListener("input", () => {
    const value = input.value;
    renderPosts(value);
  });
}

// ===========================
// KHỞI TẠO
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  renderStories();
  renderSuggestions();
  renderPosts(); // toàn bộ post
  setupCreatePostModal();
  setupSearch();
});