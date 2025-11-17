// main.js

// Minimal Markdown-Renderer
function mdToHtml(md) {
  if (!md) return "";
  let s = md.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

  s = s.replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return "<p>" + s.replace(/\n/g, "<br>") + "</p>";
}

document.addEventListener("DOMContentLoaded", () => {
  const siteConfig  = window.SITE_CONFIG || {};
  const doorContent = window.DOOR_CONTENT || {};

  /* -------------------- Base-Config -------------------- */

  // Title
  if (siteConfig.pageTitle) {
    document.title = siteConfig.pageTitle;
    const titleEl = document.getElementById("pageTitleElement");
    if (titleEl) titleEl.textContent = siteConfig.pageTitle;
  }

  // Background
  if (siteConfig.backgroundImage) {
    document.body.style.backgroundImage = `url("${siteConfig.backgroundImage}")`;
  }

  // Logo
  const logoEl = document.getElementById("siteLogo");
  if (logoEl) {
    if (siteConfig.logoSrc) logoEl.src = siteConfig.logoSrc;
    if (siteConfig.logoAlt) logoEl.alt = siteConfig.logoAlt;
  }

  // Footer & Imprint
  const footerTitleEl  = document.getElementById("footerTitle");
  const githubLinkEl   = document.getElementById("githubLink");
  const legalTitleEl   = document.getElementById("legalTitle");
  const legalContentEl = document.getElementById("legalContent");

  if (footerTitleEl && siteConfig.footerTitle) {
    footerTitleEl.textContent = siteConfig.footerTitle;
  }

  if (githubLinkEl) {
    if (siteConfig.githubUrl)   githubLinkEl.href = siteConfig.githubUrl;
    if (siteConfig.githubLabel) githubLinkEl.textContent = siteConfig.githubLabel;
  }

  if (legalTitleEl && siteConfig.legalTitle) {
    legalTitleEl.textContent = siteConfig.legalTitle;
  }
  if (legalContentEl && siteConfig.legalMd) {
    legalContentEl.innerHTML = mdToHtml(siteConfig.legalMd);
  }

  /* -------------------- calendar elements -------------------- */

  const area         = document.getElementById("calendarArea");
  const overlay      = document.getElementById("calendarOverlay");
  const panel        = document.getElementById("calendarOverlayPanel");
  const titleEl      = document.getElementById("overlayTitle");
  const contentEl    = document.getElementById("overlayContent");
  const closeBtn     = document.getElementById("overlayClose");

  const legalOverlay = document.getElementById("legalOverlay");
  const legalPanel   = document.getElementById("legalOverlayPanel");
  const legalClose   = document.getElementById("legalClose");
  const legalLink    = document.getElementById("legalLink");

  const doors = [];

  // fallback if there is nothing behind the door
  function getDoorContent(day) {
    if (doorContent[day]) return doorContent[day];
    return {
      title: `Day ${day}`,
      contentMd: `Unfortunatelly ther is nothing to see here.`
    };
  }

  // Doors
  for (let i = 1; i <= 24; i++) {
    const d = document.createElement("button");
    d.className = "calendar-door";
    d.innerHTML = `<span>${i}</span>`;
    d.dataset.day = String(i);
    area.appendChild(d);
    doors.push(d);
  }

  /* -------------------- Layout -------------------- */

  let currentCols = null;
  let cellAssignments = [];

  function computeCellAssignments(cols, rows) {
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({ r, c });
      }
    }
    cells.sort(() => Math.random() - 0.5);
    return cells.slice(0, doors.length);
  }

  function placeDoorsResponsive() {
    const rect = area.getBoundingClientRect();
    const isMobile = window.innerWidth <= 750;

    // Grid:
    const cols = isMobile ? 3 : 6;
    const rows = Math.ceil(24 / cols);

    const cellW = rect.width  / cols;
    const cellH = rect.height / rows;

    // door sizes
    const maxFromWidth  = cellW * 0.8;
    const maxFromHeight = cellH * 0.8;
    const doorSize = Math.max(Math.min(maxFromWidth, maxFromHeight, 120), 48);

    // change assignments, if cols change
    if (currentCols !== cols) {
      currentCols = cols;
      cellAssignments = computeCellAssignments(cols, rows);
    }

    // door positioning
    doors.forEach((door, i) => {
      const cell = cellAssignments[i];
      const cx = (cell.c + 0.5) * cellW;
      const cy = (cell.r + 0.5) * cellH;

      door.style.width  = doorSize + "px";
      door.style.height = doorSize + "px";
      door.style.left   = (cx - doorSize / 2) + "px";
      door.style.top    = (cy - doorSize / 2) + "px";
    });
  }

  // initial + if window resizes
  placeDoorsResponsive();
  window.addEventListener("resize", placeDoorsResponsive);

  /* -------------------- Overlay, when door opens -------------------- */

  doors.forEach(door => {
    door.addEventListener("click", () => {
      const day = Number(door.dataset.day);
      const data = getDoorContent(day);

      doors.forEach(d => d.classList.remove("calendar-door--open"));
      door.classList.add("calendar-door--open");

      titleEl.textContent = data.title;
      contentEl.innerHTML = mdToHtml(data.contentMd);

      overlay.classList.add("is-visible");

      // Animation for overlay, moving out of the opened door
      const r  = door.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top  + r.height / 2;
      const dx = cx - window.innerWidth  / 2;
      const dy = cy - window.innerHeight / 2;

      panel.style.transition = "none";
      panel.style.transform  = `translate(${dx}px, ${dy}px) scale(0.1)`;
      panel.style.opacity    = "0";
      panel.offsetHeight; // Reflow

      panel.style.transition =
        "transform .55s cubic-bezier(.23,1,.32,1), opacity .55s ease";
      panel.style.transform = "translate(0,0) scale(1)";
      panel.style.opacity   = "1";
    });
  });

  function closeDoorOverlay() {
    overlay.classList.remove("is-visible");
    doors.forEach(d => d.classList.remove("calendar-door--open"));
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeDoorOverlay);
  }

  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeDoorOverlay();
  });

  /* -------------------- Imprint-Overlay -------------------- */

  function openLegalOverlay() {
    legalOverlay.classList.add("is-visible");

    legalPanel.style.transition = "none";
    legalPanel.style.transform  = "scale(0.1)";
    legalPanel.style.opacity    = "0";
    legalPanel.offsetHeight;

    legalPanel.style.transition =
      "transform .55s cubic-bezier(.23,1,.32,1), opacity .55s ease";
    legalPanel.style.transform = "scale(1)";
    legalPanel.style.opacity   = "1";
  }

  function closeLegalOverlay() {
    legalOverlay.classList.remove("is-visible");
  }

  if (legalLink) {
    legalLink.addEventListener("click", openLegalOverlay);
  }
  if (legalClose) {
    legalClose.addEventListener("click", closeLegalOverlay);
  }
  legalOverlay.addEventListener("click", e => {
    if (e.target === legalOverlay) closeLegalOverlay();
  });

  /* -------------------- esc closes overlay -------------------- */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (overlay.classList.contains("is-visible")) closeDoorOverlay();
      if (legalOverlay.classList.contains("is-visible")) closeLegalOverlay();
    }
  });
});
