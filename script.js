// Load Bootstrap from CDN
const bootstrapScript = document.createElement('script');
bootstrapScript.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";
bootstrapScript.integrity = "sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL";
bootstrapScript.crossOrigin = "anonymous";
document.head.appendChild(bootstrapScript);

// Array of background image paths for desktop
const desktopBackgrounds = [
  './images/BG1.gif',
  './images/BG2.gif',
  './images/BG3.gif',
  './images/BG4.gif'
];

// Array of background image paths for mobile
const mobileBackgrounds = [
  './images/Mobile_BG1.gif',
  './images/Mobile_BG2.gif',
  './images/Mobile_BG3.gif',
  './images/Mobile_BG4.gif'
];

// Function to set a random background
function setRandomBackground() {
  const isMobile = window.innerWidth <= 680; // Check if screen width is for mobile
  const backgrounds = isMobile ? mobileBackgrounds : desktopBackgrounds;
  const randomIndex = Math.floor(Math.random() * backgrounds.length);
  const randomBackground = backgrounds[randomIndex];
  document.querySelector('.bg-gif').src = randomBackground;
}

// Apply fade-in effect on page load and set random background
window.addEventListener('load', () => {
  document.body.classList.add('fade-in');
  setRandomBackground();
});

// Apply fade-out effect on link click, then redirect
document.querySelectorAll('.page-link').forEach(link => {
  link.addEventListener('click', (event) => {
      event.preventDefault(); // Prevent immediate navigation
      const targetUrl = event.currentTarget.href;
      document.body.classList.add('fade-out');

      // Delay navigation until fade-out is complete
      setTimeout(() => {
          window.location.href = targetUrl;
      }, 500); // Match this with the CSS transition duration
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const loadingOverlay = document.getElementById("loading-overlay");
  const loadingImg = document.getElementById("loading-img"); // Reference the image tag

  // List of GIFs with different probabilities
  const gifs = [
      { src: './images/Loading1.gif', probability: 0.9 }, // Common GIF (90%)
      { src: './images/Loading2.gif', probability: 0.1 }  // Rare GIF (10%)
  ];

  // Randomly select a GIF based on probability
  let randomNumber = Math.random(); // Generates a number between 0 and 1
  let selectedGif = gifs[0].src; // Default to common GIF

  if (randomNumber > gifs[0].probability) {
      selectedGif = gifs[1].src; // Use rare GIF if random number is greater than 0.9
  }

  // Set the chosen GIF
  loadingImg.src = selectedGif;

  // Simulate a loading delay
  setTimeout(() => {
      loadingOverlay.style.display = "none"; // Hide loading screen
      document.getElementById("main-content").style.display = "block"; // Show main content
  }, 2000); // Adjust time if needed
});

