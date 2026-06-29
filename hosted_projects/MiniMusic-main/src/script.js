//* state
const state = { activeTrack: 0, initPlay: false };

//* selectors
const audio = new Audio();

const ui = {
  // sliders
  seekBar: document.querySelector(".seek-slider input"),
  volumeBar: document.querySelector(".volume-slider input"),

  // buttons
  showPlayListBtn: document.querySelector(".show"),
  hidePlayListBtn: document.querySelector(".hide"),
  prevBtn: document.querySelector(".prev"),
  nextBtn: document.querySelector(".next"),
  playPauseBtn: document.querySelector(".play-pause"),
  lyricBtn: document.querySelector(".lyric"),  // Nút lyric để hiển thị lời bài hát

  // text and image
  playList: document.querySelector(".playlist"),
  playListContent: document.querySelector(".playlist-content"),
  artwork: document.querySelector(".artwork"),
  trackName: document.querySelector(".name"),
  artist: document.querySelector(".artist"),
  currentTime: document.querySelector(".current-time"),
  duration: document.querySelector(".duration"),
};


//* event listeners
const setupEventListeners = () => {
  document.addEventListener("DOMContentLoaded", loadTrack);

  // player events
  ui.playPauseBtn.addEventListener("click", playPauseTrack);
  ui.seekBar.addEventListener("input", updateSeek);
  ui.volumeBar.addEventListener("input", updateVolume);
  ui.nextBtn.addEventListener("click", nextTrack);
  ui.prevBtn.addEventListener("click", prevTrack);
  ui.showPlayListBtn.addEventListener("click", showPlayList);
  ui.hidePlayListBtn.addEventListener("click", hidePlayList);

  // lyric button event
  ui.lyricBtn.addEventListener("click", showLyric); // Gọi hàm showLyric khi nhấn nút lyric

  // audio events
  audio.addEventListener("ended", nextTrack);
  audio.addEventListener("timeupdate", updateTime);
  audio.addEventListener("loadedmetadata", updateTrackInfo);
  audio.addEventListener("durationchange", updateDuration);
  audio.addEventListener("play", updateTrackState);
  audio.addEventListener("pause", updateTrackState);
};

//* event handlers

const showLyric = () => {
  const currentTrack = tracks[state.activeTrack]; // Lấy track hiện tại
  fetch(currentTrack.lyric)  // Lấy lời bài hát từ URL trong `lyric`
    .then(response => response.text())  // Chuyển phản hồi thành văn bản
    .then(data => {
      var content = document.getElementById('lyrics-content');
      content.innerHTML = data;  // Hiển thị lời bài hát vào phần tử
      toggleLyrics();  // Mở phần lời bài hát khi có dữ liệu
    })
    .catch(error => {
      document.getElementById('lyrics-content').textContent = 'Có lỗi khi tải văn bản: ' + error.message;
      toggleLyrics();  // Mở phần lời bài hát khi không có dữ liệu
    });
};

// Hàm để bật/tắt phần lời bài hát
function toggleLyrics() {
  var lyrics = document.getElementById('lyrics');
  lyrics.classList.toggle('open'); // Thêm hoặc bỏ class 'open' khi nhấn nút
}

// Các hàm khác như playPauseTrack, loadTrack, updateVolume v.v...

const updateVolume = () => {
  audio.volume = ui.volumeBar.value / 100;
  audio.muted = audio.volume === 0;
};

const updateSeek = () => {
  audio.currentTime = (ui.seekBar.value / 100) * audio.duration;
};

const updateTime = () => {
  ui.seekBar.value = (audio.currentTime / audio.duration) * 100;
  ui.currentTime.textContent = formatTime(audio.currentTime);
};

const updateDuration = () => {
  ui.seekBar.value = 0;
  ui.duration.textContent = formatTime(audio.duration);
};

const updateTrackInfo = () => {
  ui.artwork.src = tracks[state.activeTrack].artwork;
  ui.trackName.textContent = tracks[state.activeTrack].name;
  ui.artist.textContent = tracks[state.activeTrack].artist;
  updateTrackState();
};

const playPauseTrack = () => {
  audio.paused ? audio.play() : audio.pause();
  if (!state.initPlay) state.initPlay = true;
};

const prevTrack = () => {
  state.activeTrack = (state.activeTrack - 1 + tracks.length) % tracks.length;
  loadTrack();
};

const nextTrack = () => {
  state.activeTrack = (state.activeTrack + 1) % tracks.length;
  loadTrack();
};

const playTrack = (index) => {
  if (index === state.activeTrack) {
    playPauseTrack();
  } else {
    state.activeTrack = index;
    loadTrack();
  }
};

const loadTrack = () => {
  audio.src = tracks[state.activeTrack].path;
  if (state.initPlay) playPauseTrack();
};

const updateTrackState = () => {
  console.log("updateTrackState");
  ui.playPauseBtn.classList.toggle("paused", audio.paused);
  updateActiveItem();
};

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const showPlayList = () => {
  ui.playList.classList.add("show");
};

const hidePlayList = () => {
  ui.playList.classList.remove("show");
};

const updateActiveItem = () => {
  console.log("updateActiveItem");
  const currentTrackEl = ui.playListContent.querySelector(".active");
  if (currentTrackEl) {
    currentTrackEl.classList.remove("active");
    const button = currentTrackEl.querySelector("button");
    if (button) button.remove();
  }

  const targetTrackEl = ui.playListContent.children[state.activeTrack];
  if (targetTrackEl) {
    const icon = audio.paused ? "bi-play-fill" : "bi-pause-fill";
    targetTrackEl.classList.add("active");
    targetTrackEl.insertAdjacentHTML(
      "beforeend",
      `<button><i class="bi ${icon}"></i></button>`
    );
  }
};

const renderPlayList = () => {
  ui.playListContent.innerHTML = "";

  tracks.forEach((track, index) => {
    const item = document.createElement("div");
    item.classList.add("item");
    item.addEventListener("click", () => playTrack(index));
    item.innerHTML = `
    <img src="${track.artwork}" alt="${track.name}" />
    <div class="item-detail">
      <h4>${track.name}</h4>
      <p>${track.artist}</p>
    </div>`;

    ui.playListContent.appendChild(item);
  });
};

// Xử lý việc tải bài hát đang phát khi nhấn vào nút Download
document.querySelector('.download').addEventListener('click', function () {
  // Lấy thông tin bài hát đang phát
  const track = tracks[state.activeTrack];
  // Tạo một thẻ <a> để thực hiện tải tệp
  const link = document.createElement("a");
        
  // Đường dẫn tới tệp MP3
  link.href = track.path; 
        
  // Tên tệp khi tải về
  link.download = track.name; 
        
  // Mô phỏng hành động click vào thẻ <a> để tải tệp
  link.click(); 
});

renderPlayList();
setupEventListeners();