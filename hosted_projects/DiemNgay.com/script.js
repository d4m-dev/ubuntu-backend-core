const title = document.querySelector(".title");
const countdown = document.querySelector(".countdown");
const eventNameInput = document.querySelector("#event-name");
const eventDateInput = document.querySelector("#event-date");
const enableSoundCheckbox = document.querySelector("#enable-sound");

let interval,
  enableSound = false,
  delay = 3000;

//* event listeners

const setupEventListeners = () => {
  document.querySelector(".form").addEventListener("submit", handleSubmit);

  document.querySelector("#reset").addEventListener("click", handleReset);

  document.querySelector("#new").addEventListener("click", handleReset);
};

//* event handlers

const handleReset = () => {
  // stop the timer
  clearInterval(interval);
  title.textContent = "Bộ Đếm Ngược";
  countdown.querySelector(".running").hidden = false;
  countdown.querySelector(".expired").hidden = true;
  countdown.hidden = true;
  updateCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // clear local storage
  localStorage.removeItem("countdownData");

  // reset form
  setDefaultEventDate();
  eventNameInput.value = "";
  enableSoundCheckbox.checked = false;
};

const handleSubmit = (e) => {
  e.preventDefault();

  const eventDate = new Date(eventDateInput.value);

  // check for past dates
  if (getTimeLeft(eventDate) <= 0) {
    alert("Vui lòng chọn ngày trong tương lai");
    return;
  }

  // show countdown timer
  countdown.hidden = false;
  title.textContent = eventNameInput.value;
  enableSound = enableSoundCheckbox.checked;

  // save to local storage
  localStorage.setItem(
    "countdownData",
    JSON.stringify({
      eventName: eventNameInput.value,
      eventDate,
      enableSound,
    })
  );

  // run timer every second
  runCountdown(eventDate);

  interval = setInterval(() => runCountdown(eventDate), 1000);
};

//* countdown

const initCountdown = () => {
  const countdownData = JSON.parse(localStorage.getItem("countdownData"));

  if (!Object.is(countdownData, null)) {
    countdown.hidden = false;
    title.textContent = countdownData.eventName;
    enableSound = countdownData.enableSound;

    const eventDate = new Date(countdownData.eventDate);

    runCountdown(eventDate);

    interval = setInterval(() => runCountdown(eventDate), 1000);
  }
};

const runCountdown = (eventDate) => {
  const timeLeft = getTimeLeft(eventDate);

  if (timeLeft <= 0) {
    // stop timer
    clearInterval(interval);
    title.textContent = "Hết Giờ Đếm Ngược";
    countdown.querySelector(".running").hidden = true;
    countdown.querySelector(".expired").hidden = false;

    handleSound(timeLeft);
  } else {
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    updateCountdown({
      days,
      hours,
      minutes,
      seconds,
    });
  }
};

const updateCountdown = ({ days, hours, minutes, seconds }) => {
  countdown.querySelector(".days").textContent = formatTime(days);
  countdown.querySelector(".hours").textContent = formatTime(hours);
  countdown.querySelector(".minutes").textContent = formatTime(minutes);
  countdown.querySelector(".seconds").textContent = formatTime(seconds);
};

//* helpers

const handleSound = (timeLeft) => {
  const isTimeout = timeLeft < -delay;
  if (enableSound && !isTimeout) {
    playSound();
  }
};

const playSound = () => {
  const sound = new Audio("./notification.mp3");
  sound.play();
};

const formatTime = (time) => {
  return time < 10 ? `0${time}` : time;
};

const getTimeLeft = (eventDate) => {
  return eventDate - new Date().getTime();
};

const setDefaultEventDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  eventDateInput.value = tomorrow.toISOString().split("T")[0];
};

//* initialize

setDefaultEventDate();
setupEventListeners();
initCountdown();
