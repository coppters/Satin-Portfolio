// ============ script.js (full) ============

// ---------- 1) Loading overlay + link fade + bootstrap init ----------
document.addEventListener("DOMContentLoaded", function () {
  // 1a) Loading overlay with rare GIF
  const loadingOverlay = document.getElementById("loading-overlay");
  const loadingImg = document.getElementById("loading-img");

  if (loadingOverlay && loadingImg) {
    const gifs = [
      { src: "./images/Loading1.gif", probability: 0.9 },
      { src: "./images/Loading2.gif", probability: 0.1 },
    ];
    const randomNumber = Math.random();
    loadingImg.src = randomNumber > gifs[0].probability ? gifs[1].src : gifs[0].src;

    setTimeout(() => {
      loadingOverlay.style.display = "none";
      const main = document.getElementById("main-content") || document.querySelector(".fantasy");
      if (main) main.style.display = "";
    }, 2000);
  }

  // 1b) Fade-out on nav click
  document.querySelectorAll(".page-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetUrl = event.currentTarget.href;
      if (!targetUrl) return;
      event.preventDefault();
      document.body.classList.add("fade-out");
      setTimeout(() => (window.location.href = targetUrl), 500); // match your CSS transition
    });
  });

  // 1c) After DOM is ready, ensure Bootstrap then init gallery
  ensureBootstrap(initSimpleGallery);
});

// ---------- 2) Backgrounds: random only on index.html ----------
(function setupBackgrounds() {
  const desktopBackgrounds = [
    "./images/BG1.gif",
    "./images/BG2.gif",
    "./images/BG3.gif",
    "./images/BG4.gif",
  ];
  const mobileBackgrounds = [
    "./images/Mobile_BG1.gif",
    "./images/Mobile_BG2.gif",
    "./images/Mobile_BG3.gif",
    "./images/Mobile_BG4.gif",
  ];

  function isIndexPage() {
    const p = window.location.pathname;
    // supports "/", "/index.html", or "/folder/index.html"
    return p === "/" || /\/index\.html?$/.test(p);
  }

  function setBackground() {
    const target = document.querySelector(".bg-gif") || document.querySelector(".space");
    if (!target) return;

    if (isIndexPage()) {
      const isMobile = window.innerWidth <= 680;
      const backgrounds = isMobile ? mobileBackgrounds : desktopBackgrounds;
      const randomIndex = Math.floor(Math.random() * backgrounds.length);
      target.src = backgrounds[randomIndex];
    } else {
      // all non-index pages use Space.gif
      target.src = "./images/Space.gif";
    }
  }

  window.addEventListener("load", () => {
    document.body.classList.add("fade-in");
    setBackground();
  });
})();

// ---------- 3) Simple Gallery bootstrap guard ----------
function ensureBootstrap(cb) {
  if (window.bootstrap && typeof window.bootstrap.Modal === "function") return cb();

  // If a bootstrap bundle tag exists, hook into it
  const existing = document.querySelector('script[src*="bootstrap.bundle"]');
  if (existing) {
    existing.addEventListener?.("load", cb);
    // tiny fallback in case it was already loaded
    setTimeout(() => (window.bootstrap ? cb() : null), 100);
    return;
  }

  // Otherwise, load it (harmless if also present in HTML)
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";
  s.crossOrigin = "anonymous";
  s.addEventListener("load", cb);
  document.head.appendChild(s);
}

// ---------- 4) Simple Gallery: tabs + thumbnails + lightbox + pagination ----------
function initSimpleGallery() {
  const SG_ITEMS = window.SG_ITEMS || [];

  const sgTabs = document.getElementById("sgTabs");
  const sgTabContent = document.getElementById("sgTabContent");
  const modalEl = document.getElementById("sgLightbox");

  if (!sgTabs || !sgTabContent || !modalEl) return;

  const grouped = SG_ITEMS.reduce((m, i) => ((m[i.category] ||= []).push(i), m), {});
  const categories = Object.keys(grouped);
  const slug = (t) => "sg-" + t.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Tabs
  sgTabs.innerHTML = categories
    .map(
      (c, i) => `
      <li class="nav-item" role="presentation">
        <button class="nav-link ${i ? "" : "active"}"
                id="${slug(c)}-tab"
                data-bs-toggle="pill"
                data-bs-target="#${slug(c)}"
                type="button"
                role="tab"
                aria-controls="${slug(c)}"
                aria-selected="${!i}">
          ${c}
        </button>
      </li>`
    )
    .join("");

  // Paginated grids
  sgTabContent.innerHTML = categories
    .map((c, i) => {
      const items = grouped[c];
      const firstPage = items.slice(0, 12);
      const hasMore = items.length > 12;

      const cards = firstPage
        .map(
          (item, k) => `
          <figure class="sg-card m-0" data-category="${c}" data-index="${k}">
            <img class="sg-thumb sg-fade" alt="${escapeHtml(item.title)}" loading="lazy" src="${escapeAttr(item.thumb)}">
            <figcaption class="card-body p-2">
              <div class="sg-title h6 m-0">${escapeHtml(item.title)}</div>
            </figcaption>
          </figure>`
        )
        .join("");

      const loadBtn = hasMore
        ? `<div class="text-center mt-4">
             <button class="btn btn-outline-light load-more-btn" data-category="${c}">Load More</button>
           </div>`
        : "";

      return `
        <div class="tab-pane fade ${i ? "" : "show active"}"
             id="${slug(c)}"
             role="tabpanel"
             aria-labelledby="${slug(c)}-tab"
             tabindex="0">
          <div class="sg-grid" data-category="${c}">${cards}</div>
          ${loadBtn}
        </div>`;
    })
    .join("");

  // Lightbox
  const modal = new bootstrap.Modal(modalEl);
  const sgLbImg = document.getElementById("sgLbImg");
  const sgLbTitle = document.getElementById("sgLbTitle");

  document.addEventListener("click", (e) => {
    const fig = e.target.closest("figure.sg-card");
    if (!fig) return;
    const category = fig.getAttribute("data-category");
    const index = +fig.getAttribute("data-index");
    const item = (grouped[category] || [])[index];
    if (!item) return;

    sgLbImg.src = item.full || item.thumb;
    sgLbImg.alt = item.title || "Artwork";
    sgLbTitle.textContent = item.title || "Preview";
    modal.show();
  });

  // Pagination handler
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".load-more-btn");
    if (!btn) return;

    const cat = btn.getAttribute("data-category");
    const grid = document.querySelector(`.sg-grid[data-category="${cat}"]`);
    const shown = grid.querySelectorAll(".sg-card").length;
    const remaining = grouped[cat].slice(shown, shown + 12);

    remaining.forEach((item, k) => {
      const fig = document.createElement("figure");
      fig.className = "sg-card m-0";
      fig.dataset.category = cat;
      fig.dataset.index = shown + k;
      fig.innerHTML = `
        <img class="sg-thumb sg-fade" alt="${escapeHtml(item.title)}" loading="lazy" src="${escapeAttr(item.thumb)}">
        <figcaption class="card-body p-2"><div class="sg-title h6 m-0">${escapeHtml(item.title)}</div></figcaption>`;
      grid.appendChild(fig);
    });

    if (shown + 12 >= grouped[cat].length) btn.remove();
  });

  // Fade-in images
  document.querySelectorAll("img.sg-thumb").forEach((img) => {
    if (img.complete) img.classList.add("is-loaded");
    img.addEventListener("load", () => img.classList.add("is-loaded"));
    img.addEventListener("error", () => console.warn("Missing:", img.src));
  });

  // Escape helpers
  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function escapeAttr(str = "") {
    return escapeHtml(str).replaceAll("`", "&#096;");
  }
}
