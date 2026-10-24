(() => {
  "use strict";
  const data = window.PORTFOLIO_CONTENT;
  if (!data) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const safeImagePath = (slot) => data.photos[slot] || "";
  const photoOverridesKey = "dreem-portfolio-photo-overrides";
  let photoOverrides = {};
  try { photoOverrides = JSON.parse(localStorage.getItem(photoOverridesKey) || "{}"); } catch { photoOverrides = {}; }

  document.title = `${data.name} | ${data.role}`;
  $$("[data-name]").forEach(el => el.textContent = data.name);
  $$("[data-hero]").forEach(el => { const key = el.dataset.hero; if (data.hero[key] !== undefined && key !== "headline") el.textContent = data.hero[key]; });
  $$("[data-section]").forEach(el => {
    const path = el.dataset.section.split(".");
    const value = path.reduce((obj, key) => obj?.[key], data);
    if (value !== undefined) el.textContent = value;
  });
  $$("[data-link]").forEach(el => { const key = el.dataset.link; if (data.links[key]) el.href = data.links[key]; });
  $("[data-footer]").textContent = data.footer;

  function photoMarkup(slot, alt, className = "") {
    const src = photoOverrides[slot] || safeImagePath(slot);
    return `<img class="${className}" data-photo="${escapeHTML(slot)}" src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" loading="${slot === "hero" ? "eager" : "lazy"}"><div class="image-placeholder" data-placeholder="${escapeHTML(slot)}">Add image<br><small>${escapeHTML(safeImagePath(slot))}</small></div>`;
  }
  function wireImages(root = document) {
    $$("img[data-photo]", root).forEach(img => {
      const showFallback = () => {
        img.style.display = "none";
        const placeholder = img.parentElement.querySelector(`[data-placeholder="${img.dataset.photo}"]`);
        if (placeholder) placeholder.classList.add("visible");
      };
      img.addEventListener("error", showFallback, { once: true });
      if (!img.getAttribute("src")) img.src = photoOverrides[img.dataset.photo] || safeImagePath(img.dataset.photo);
      if (img.complete && img.naturalWidth === 0) showFallback();
    });
  }
  wireImages($(".hero"));
  const serviceGrid = $("#service-grid");
  serviceGrid.innerHTML = data.services.items.map(item => `<article class="service-card reveal"><div class="icon-box" aria-hidden="true">${escapeHTML(item.icon)}</div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description)}</p><ul class="star-list">${item.bullets.map(line => `<li>${escapeHTML(line)}</li>`).join("")}</ul></article>`).join("");

  const projectTrack = $("#project-track");
  projectTrack.innerHTML = data.projects.items.map((item) => `<article class="project-card reveal"><div class="project-image"><div class="project-image-inner">${photoMarkup(item.image, `${item.title} project artwork`)}</div></div><div class="project-body"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description)}</p><a class="view-project" href="${escapeHTML(item.projectUrl || "#")}" target="_blank" rel="noopener noreferrer">Preview Project <span aria-hidden="true">↗</span></a></div></article>`).join("");
  wireImages(projectTrack);

  $("#timeline").innerHTML = data.experience.items.map(item => `<article class="timeline-item reveal"><p class="timeline-dates">${escapeHTML(item.dates)}</p><h3>${escapeHTML(item.title)}</h3><p class="timeline-company">${escapeHTML(item.company)}</p><ul class="star-list">${item.bullets.map(line => `<li>${escapeHTML(line)}</li>`).join("")}</ul><div class="tag-list">${item.tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}</div></article>`).join("");

  $("#learning-grid").innerHTML = data.learning.items.map(item => `<article class="learning-card reveal"><div class="icon-box" aria-hidden="true">${escapeHTML(item.icon)}</div><h3>${escapeHTML(item.title)}</h3><p class="learning-status">${escapeHTML(item.status)}</p><div class="progress-bar" role="progressbar" aria-label="${escapeHTML(item.title)} learning progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Number(item.progress) || 0}"><span style="--progress:${Math.min(100, Math.max(0, Number(item.progress) || 0))}%"></span></div>${item.description ? `<p class="learning-description">${escapeHTML(item.description)}</p>` : ""}<ul class="star-list">${item.bullets.map(line => `<li>${escapeHTML(line)}</li>`).join("")}</ul></article>`).join("");

  // Accessible responsive navigation.
  const menuToggle = $(".menu-toggle"), nav = $("#site-nav");
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
  $$(".site-nav a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open"); menuToggle.setAttribute("aria-expanded", "false"); menuToggle.setAttribute("aria-label", "Open navigation");
  }));

  // Header treatment and active section tracking.
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  const sections = $$("main section[id]");
  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$(".nav-link").forEach(link => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("active", active);
          if (active) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
        });
      }
    }), { rootMargin: "-30% 0px -55% 0px", threshold: 0 });
    sections.forEach(section => navObserver.observe(section));
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); }
    }), { threshold: .12 });
    $$(".reveal").forEach(el => revealObserver.observe(el));
  } else $$(".reveal").forEach(el => el.classList.add("is-visible"));

  // Project carousel controls.
  $("#project-prev").addEventListener("click", () => projectTrack.scrollBy({ left: -projectTrack.clientWidth * .8, behavior: "smooth" }));
  $("#project-next").addEventListener("click", () => projectTrack.scrollBy({ left: projectTrack.clientWidth * .8, behavior: "smooth" }));

  // Lightbox dialog: native dialog handles focus containment and Escape.
  const dialog = $("#project-dialog"), dialogImage = $("#dialog-image"), dialogPlaceholder = $("#dialog-placeholder");
  let returnFocus = null;
  function openProject(index, trigger) {
    const item = data.projects.items[index]; if (!item) return;
    returnFocus = trigger;
    $("#dialog-category").textContent = item.category;
    $("#dialog-title").textContent = item.title;
    $("#dialog-description").textContent = item.detail || item.description;
    $("#dialog-tags").innerHTML = item.tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join("");
    $("#dialog-caption").textContent = item.caption || "";
    $("#dialog-status").textContent = item.status || "";
    dialogImage.alt = item.caption || `${item.title} preview`;
    dialogImage.src = photoOverrides[item.image] || safeImagePath(item.image);
    dialogImage.style.display = "block"; dialogPlaceholder.classList.remove("visible");
    dialogImage.onerror = () => { dialogImage.style.display = "none"; dialogPlaceholder.classList.add("visible"); };
    dialog.showModal(); document.body.classList.add("modal-open");
  }
  $(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => { document.body.classList.remove("modal-open"); returnFocus?.focus(); });

  // Dark/light mode preference.
  const themeToggle = $(".theme-toggle");
  let theme = "light";
  try { theme = localStorage.getItem("dreem-portfolio-theme") || "light"; } catch {}
  function applyTheme(value) {
    document.documentElement.dataset.theme = value;
    themeToggle.setAttribute("aria-label", value === "dark" ? "Switch to light theme" : "Switch to dark theme");
    themeToggle.title = value === "dark" ? "Switch to light theme" : "Switch to dark theme";
    themeToggle.textContent = value === "dark" ? "☼" : "◐";
  }
  applyTheme(theme);
  themeToggle.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark"; applyTheme(theme);
    try { localStorage.setItem("dreem-portfolio-theme", theme); } catch {}
  });

  // Optional private photo editing mode: visit the site URL with #edit.
  const editBadge = $("#edit-badge"), filePicker = $("#photo-file-picker");
  let currentPhotoSlot = null;
  function activateEditMode() {
    editBadge.hidden = false;
    $$("img[data-photo]").forEach(img => {
      img.style.cursor = "pointer";
      img.title = "Click to replace this image in edit mode";
      img.addEventListener("click", () => { currentPhotoSlot = img.dataset.photo; filePicker.click(); });
    });
  }
  if (location.hash === "#edit") activateEditMode();
  filePicker.addEventListener("change", () => {
    const file = filePicker.files?.[0]; if (!file || !currentPhotoSlot) return;
    const reader = new FileReader();
    reader.onload = () => {
      photoOverrides[currentPhotoSlot] = reader.result;
      try { localStorage.setItem(photoOverridesKey, JSON.stringify(photoOverrides)); } catch {}
      $$(`img[data-photo="${currentPhotoSlot}"]`).forEach(img => { img.src = reader.result; img.style.display = "block"; img.parentElement.querySelector(`[data-placeholder="${currentPhotoSlot}"]`)?.classList.remove("visible"); });
      if (currentPhotoSlot === "hero") $("[data-photo='hero']").src = reader.result;
    };
    reader.readAsDataURL(file); filePicker.value = "";
  });
  $("#reset-photos").addEventListener("click", () => {
    photoOverrides = {};
    try { localStorage.removeItem(photoOverridesKey); } catch {}
    location.reload();
  });
})();
