document.addEventListener("DOMContentLoaded", () => {
  const secondHand = document.querySelector(".second");
  const minuteHand = document.querySelector(".minute");
  const hourHand = document.querySelector(".hour");
  const periodElement = document.querySelector(".period");

  const updateClock = () => {
    const currentDate = new Date();
    const seconds = currentDate.getSeconds();
    const minutes = currentDate.getMinutes();
    const hours = currentDate.getHours();

    setRotation(secondHand, seconds / 60);
    setRotation(minuteHand, (minutes * 60) / 3600);
    setRotation(hourHand, (minutes + (hours % 12) * 60) / 720);

    periodElement.textContent = hours >= 0 && hours < 12 ? "sáng" : "chiều";
  };

  const setRotation = (element, rotationRatio) => {
    element.style.transform = `rotate(${rotationRatio * 360}deg)`;
  };

  updateClock();
  setInterval(updateClock, 1000);
});
