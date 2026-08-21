// ============ script.js (full) ============

// ---------- 1) Fast startup + shared navigation + bootstrap init ----------
document.addEventListener("DOMContentLoaded", function () {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) loadingOverlay.hidden = true;

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".navbar .nav-link[href]").forEach((link) => {
    const linkPage = new URL(link.href, window.location.href).pathname.split("/").pop();
    const isCurrent = linkPage === currentPage;
    link.classList.toggle("active", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const socialLabels = {
    "twitter.com": "Follow Coppters on X",
    "instagram.com": "Follow Coppters on Instagram",
    "facebook.com": "Follow Coppters on Facebook",
    "youtube.com": "Watch Coppters on YouTube",
  };
  document.querySelectorAll('a[href^="http"]').forEach((link) => {
    const label = Object.entries(socialLabels).find(([domain]) => link.href.includes(domain));
    if (label) {
      link.setAttribute("aria-label", label[1]);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  });

  document.querySelectorAll(".copyright-year").forEach((year) => {
    year.textContent = new Date().getFullYear();
  });

  ensureBootstrap(initSimpleGallery);
});

// ---------- 2) Backgrounds: random only on index.html ----------
(function setupBackgrounds() {
  const desktopBackgrounds = [
    "./images/BG1.webm",
    "./images/BG2.webm",
    "./images/BG3.webm",
    "./images/BG4.webm",
  ];
  const mobileBackgrounds = [
    "./images/Mobile_BG1.webm",
    "./images/Mobile_BG2.webm",
    "./images/Mobile_BG3.webm",
    "./images/Mobile_BG4.webm",
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
      target.load?.();
      target.play?.().catch(() => {});
    } else {
      // all non-index pages use Space.gif
      target.src = "./images/Space.gif";
    }
  }

  setBackground();
  window.addEventListener("load", () => {
    document.body.classList.add("fade-in");
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

// ---------- 4) Simple Gallery: tabs + thumbnails + lightbox ----------
function initSimpleGallery() {
  // Load gallery data from galleryList.js if present
  const SG_ITEMS = window.SG_ITEMS || [];

  const sgTabs = document.getElementById("sgTabs");
  const sgTabContent = document.getElementById("sgTabContent");
  const modalEl = document.getElementById("sgLightbox");

  if (!sgTabs || !sgTabContent || !modalEl) return; // no gallery found

  // Group items by category
  const grouped = SG_ITEMS.reduce((m, i) => ((m[i.category] ||= []).push(i), m), {});
  const categoryPriority = ["Commission", "Streamer", "Game", "Cyberpunk", "Japanese"];
  const categories = Object.keys(grouped).sort((a, b) => {
    const aIndex = categoryPriority.indexOf(a);
    const bIndex = categoryPriority.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
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

  // Panes
  sgTabContent.innerHTML = categories
    .map((c, i) => {
      const cards = grouped[c]
        .map(
          (item, k) => `
          <figure class="sg-card m-0" data-category="${c}" data-index="${k}" data-preview="${escapeAttr(item.full || item.thumb)}" data-media-type="${escapeAttr(item.type || "image")}" role="button" tabindex="0" aria-label="View ${escapeAttr(item.title)}">
            <img class="sg-thumb sg-fade" alt="${escapeHtml(item.title)}" loading="lazy" src="${escapeAttr(item.thumb)}">
            <video class="sg-thumb-video" muted loop playsinline preload="none" aria-hidden="true"></video>
            <figcaption class="card-body p-2">
              <div class="sg-title h6 m-0">${escapeHtml(item.title)}</div>
            </figcaption>
          </figure>`
        )
        .join("");
      return `
        <div class="tab-pane fade ${i ? "" : "show active"}"
             id="${slug(c)}"
             role="tabpanel"
             aria-labelledby="${slug(c)}-tab"
             tabindex="0">
          <div class="sg-grid">${cards}</div>
        </div>`;
    })
    .join("");

  const previewCards = document.querySelectorAll("figure.sg-card");
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function startCardPreview(card) {
    if (!canHover || card.dataset.mediaType !== "video") return;
    const video = card.querySelector(".sg-thumb-video");
    if (!video) return;
    if (!video.src) {
      video.src = card.dataset.preview;
      video.load();
    }
    card.classList.add("is-previewing");
    video.play().catch(() => {});
  }

  function stopCardPreview(card) {
    const video = card.querySelector(".sg-thumb-video");
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    card.classList.remove("is-previewing");
  }

  previewCards.forEach((card) => {
    card.addEventListener("mouseenter", () => startCardPreview(card));
    card.addEventListener("mouseleave", () => stopCardPreview(card));
    card.addEventListener("focus", () => startCardPreview(card));
    card.addEventListener("blur", () => stopCardPreview(card));
  });

  // Lightbox (Bootstrap)
  const modal = new bootstrap.Modal(modalEl);
  const sgLbImg = document.getElementById("sgLbImg");
  const sgLbVideo = document.getElementById("sgLbVideo");
  const sgLbTitle = document.getElementById("sgLbTitle");

  function openGalleryItem(fig) {
    if (!fig) return;
    const category = fig.getAttribute("data-category");
    const index = +fig.getAttribute("data-index");
    const item = (grouped[category] || [])[index];
    if (!item) return;

    const isVideo = item.type === "video" || /\.webm(?:$|\?)/i.test(item.full || "");
    if (isVideo && sgLbVideo) {
      if (sgLbImg) {
        sgLbImg.classList.add("d-none");
        sgLbImg.removeAttribute("src");
      }
      sgLbVideo.classList.remove("d-none");
      sgLbVideo.src = item.full;
      sgLbVideo.load();
      sgLbVideo.play().catch(() => {});
    } else if (sgLbImg) {
      if (sgLbVideo) {
        sgLbVideo.pause();
        sgLbVideo.removeAttribute("src");
        sgLbVideo.classList.add("d-none");
      }
      sgLbImg.classList.remove("d-none");
      sgLbImg.src = item.full || item.thumb;
      sgLbImg.alt = item.title || "Artwork";
    }
    if (sgLbTitle) sgLbTitle.textContent = item.title || "Preview";
    modal.show();
  }

  document.addEventListener("click", (e) => {
    openGalleryItem(e.target.closest("figure.sg-card"));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const fig = e.target.closest("figure.sg-card");
    if (!fig) return;
    e.preventDefault();
    openGalleryItem(fig);
  });

  modalEl.addEventListener("hidden.bs.modal", () => {
    if (!sgLbVideo) return;
    sgLbVideo.pause();
    sgLbVideo.removeAttribute("src");
    sgLbVideo.load();
  });

  // Fade-in thumbnails + broken path logging
  document.querySelectorAll("img.sg-thumb").forEach((img) => {
    if (img.complete) img.classList.add("is-loaded");
    img.addEventListener("load", () => img.classList.add("is-loaded"));
    img.addEventListener("error", () =>
      console.warn("Missing image:", img.getAttribute("src"))
    );
  });

  // Helpers (scoped to gallery init)
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
