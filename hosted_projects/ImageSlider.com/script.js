const slider = document.querySelector(".slider");
const slides = document.querySelectorAll(".slide");
const nextNav = document.querySelector(".next");
const prevNav = document.querySelector(".prev");
const dotsNav = document.querySelector(".dots");

let currentIndex = 0;
let intervalId;

slides.forEach((slide, index) => {
  // set the initial position of each slide
  slide.style.transform = `translateX(${index * 100}%)`;

  // create the dot nav buttons
  const btn = document.createElement("button");
  btn.classList.add("dot");
  btn.classList.toggle("active", index === currentIndex);

  // handle dot nav click event
  btn.addEventListener("click", () => {
    setCurrentSlide(index);
    stopSlider();
  });

  dotsNav.appendChild(btn);
});

// start the slider when the page is loaded
startSlider();

// stop the slider when pointer is over the slides
slider.addEventListener("mouseenter", stopSlider);

// start the slider when pointer leaves the slides
slider.addEventListener("mouseleave", startSlider);

// handle next nav click event
nextNav.addEventListener("click", () => {
  showNextSlide();
  stopSlider();
});

// handle previous nav click event
prevNav.addEventListener("click", () => {
  showPreviousSlide();
  stopSlider();
});

function startSlider() {
  intervalId = setInterval(showNextSlide, 10000); // 10s
}

function stopSlider() {
  clearInterval(intervalId);
}

function showNextSlide() {
  currentIndex = (currentIndex + 1) % slides.length;

  updateSlides();
  updateDots();
}

function showPreviousSlide() {
  currentIndex = (currentIndex - 1 + slides.length) % slides.length;

  updateSlides();
  updateDots();
}

function setCurrentSlide(index) {
  currentIndex = index;

  updateSlides();
  updateDots();
}

function updateSlides() {
  slides.forEach((slide, index) => {
    const offset = (index - currentIndex) * 100;
    slide.style.transform = `translateX(${offset}%)`;

    slide.classList.toggle("active", index === currentIndex);
  });
}

function updateDots() {
  const dots = document.querySelectorAll(".dot");
  [...dots].map((dot, i) => dot.classList.toggle("active", i === currentIndex));
}
