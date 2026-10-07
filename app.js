/*
 * app.js
 * Wires up the age gate, renders age-tiered content, handles navigation,
 * the quiz, and the always-available "Start Over" control.
 *
 * Depends on: content.js (CONTENT, AGE_TIERS, tierForAge) and
 *             fireworks.js (window.Fireworks)
 */
(function () {
  "use strict";

  const ageGate = document.getElementById("age-gate");
  const app = document.getElementById("app");
  const sectionsEl = document.getElementById("sections");
  const navEl = document.getElementById("nav");
  const tierBadge = document.getElementById("tier-badge");
  const startOverBtn = document.getElementById("start-over");
  const launchBtn = document.getElementById("launch-fireworks");

  let currentTier = null;

  /* ---------- Small helpers ---------- */
  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ---------- SVG diya (drawn, no external image) ----------
   * unlit=true renders the lamp with a dark wick and no flame.
   * Each SVG gets a unique gradient id so multiples can coexist. */
  let diyaSeq = 0;
  function diyaSVG(color, unlit) {
    const gid = "flame-grad-" + diyaSeq++;
    const flame = unlit
      ? '<line class="wick" x1="60" y1="52" x2="60" y2="44" stroke="#3a2a12" stroke-width="3" stroke-linecap="round"/>'
      : '<ellipse class="flame" cx="60" cy="30" rx="9" ry="18" fill="url(#' + gid + ')"/>' +
        '<line class="wick" x1="60" y1="52" x2="60" y2="46" stroke="#3a2a12" stroke-width="3" stroke-linecap="round"/>';
    return (
      '<svg class="diya-svg' + (unlit ? " is-unlit" : "") + '" viewBox="0 0 120 90" role="img" aria-label="Diya lamp">' +
      '<defs><radialGradient id="' + gid + '" cx="50%" cy="35%" r="65%">' +
      '<stop offset="0%" stop-color="#fff6c8"/><stop offset="45%" stop-color="#ffcf33"/>' +
      '<stop offset="100%" stop-color="#ff7a00"/></radialGradient></defs>' +
      flame +
      '<ellipse cx="60" cy="60" rx="50" ry="14" fill="' + color + '"/>' +
      '<path d="M12 60 Q60 92 108 60 Z" fill="' + shade(color, -25) + '"/>' +
      '<ellipse cx="60" cy="60" rx="50" ry="10" fill="' + shade(color, 15) + '" opacity="0.6"/>' +
      "</svg>"
    );
  }

  function shade(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00ff) + percent;
    let b = (num & 0x0000ff) + percent;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* ---------- Section builders ---------- */
  function buildIntro(tier) {
    const d = CONTENT.intro[tier];
    const sec = el("section", "content-section", "");
    sec.id = "sec-intro";
    sec.appendChild(el("h2", "section-title", "🪔 " + escapeHtml(d.title)));
    const card = el("div", "intro-card");
    card.appendChild(el("div", "intro-diyas", diyaSVG("#c0653a") + diyaSVG("#d94f8a") + diyaSVG("#e0a92e")));
    card.appendChild(el("p", "intro-text", escapeHtml(d.text)));
    sec.appendChild(card);
    return sec;
  }

  function buildDays(tier) {
    const sec = el("section", "content-section");
    sec.id = "sec-days";
    sec.appendChild(el("h2", "section-title", "📅 The 5 Days of Diwali"));
    const grid = el("div", "card-grid");
    CONTENT.days.forEach(function (day) {
      const card = el("article", "flip-card");
      card.innerHTML =
        '<div class="flip-inner">' +
        '<div class="flip-front"><span class="big-icon">' + day.icon + "</span>" +
        '<span class="day-num">Day ' + day.day + "</span>" +
        '<h3>' + escapeHtml(day.name) + "</h3>" +
        '<span class="tap-hint">Tap to learn more →</span></div>' +
        '<div class="flip-back"><h3>' + escapeHtml(day.name) + "</h3>" +
        "<p>" + escapeHtml(day[tier]) + "</p></div>" +
        "</div>";
      card.addEventListener("click", function () {
        card.classList.toggle("flipped");
      });
      grid.appendChild(card);
    });
    sec.appendChild(grid);
    return sec;
  }

  function buildDiyas(tier) {
    const sec = el("section", "content-section");
    sec.id = "sec-diyas";
    sec.appendChild(el("h2", "section-title", "🪔 Types of Diyas"));
    sec.appendChild(el("p", "section-sub", "Tap a diya to light it! ✨"));
    const grid = el("div", "card-grid");
    CONTENT.diyas.forEach(function (diya) {
      const card = el("article", "diya-card");
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "Light the " + diya.name);
      card.innerHTML =
        '<div class="diya-visual">' + diyaSVG(diya.color, true) + "</div>" +
        "<h3>" + escapeHtml(diya.name) + "</h3>" +
        '<span class="tap-hint">✨ Tap to light</span>';
      const open = function () { openDiyaModal(diya, tier); };
      card.addEventListener("click", open);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
      grid.appendChild(card);
    });
    sec.appendChild(grid);
    return sec;
  }

  /* ---------- Diya lighting popup ---------- */
  let lastFocusedEl = null;

  function openDiyaModal(diya, tier) {
    const overlay = document.getElementById("modal-overlay");
    lastFocusedEl = document.activeElement;

    overlay.innerHTML =
      '<div class="modal diya-modal" role="dialog" aria-modal="true" aria-labelledby="diya-modal-title">' +
      '<button class="modal-close" aria-label="Close">✕</button>' +
      '<div class="diya-stage lighting">' + diyaSVG(diya.color, false) + "</div>" +
      '<h3 id="diya-modal-title" class="modal-title">' + escapeHtml(diya.name) + "</h3>" +
      '<p class="modal-text">' + escapeHtml(diya[tier]) + "</p>" +
      '<div class="modal-actions">' +
      '<button class="btn-go modal-toggle">Blow it out 🌬️</button>' +
      "</div>" +
      "</div>";

    overlay.classList.add("open");
    document.body.classList.add("modal-open");

    const modal = overlay.querySelector(".modal");
    const stage = overlay.querySelector(".diya-stage");
    const closeBtn = overlay.querySelector(".modal-close");
    const toggleBtn = overlay.querySelector(".modal-toggle");

    // celebratory fireworks burst behind the diya as it lights
    if (window.Fireworks) {
      window.Fireworks.launchAt();
      setTimeout(function () { window.Fireworks.launchAt(); }, 300);
    }
    // remove the one-shot "lighting" animation class after it plays
    setTimeout(function () { stage.classList.remove("lighting"); }, 900);

    // blow out / relight toggle
    toggleBtn.addEventListener("click", function () {
      const svg = stage.querySelector(".diya-svg");
      const off = svg.classList.toggle("blown-out");
      toggleBtn.textContent = off ? "Light it 🔥" : "Blow it out 🌬️";
      if (!off && window.Fireworks) {
        stage.classList.add("lighting");
        setTimeout(function () { stage.classList.remove("lighting"); }, 900);
        window.Fireworks.launchAt();
      }
    });

    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });

    // focus trap
    modal.addEventListener("keydown", trapFocus);
    closeBtn.focus();
  }

  function closeModal() {
    const overlay = document.getElementById("modal-overlay");
    overlay.classList.remove("open");
    document.body.classList.remove("modal-open");
    overlay.innerHTML = "";
    if (lastFocusedEl && lastFocusedEl.focus) lastFocusedEl.focus();
    lastFocusedEl = null;
  }

  function trapFocus(e) {
    if (e.key === "Escape") { e.stopPropagation(); closeModal(); return; }
    if (e.key !== "Tab") return;
    const focusables = e.currentTarget.querySelectorAll("button, [href], input, [tabindex]:not([tabindex='-1'])");
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Place scenes (hand-built SVG, self-contained) ----------
   * Each scene is a stylized night view: sky + stars + landmark + diyas.
   * viewBox 0 0 400 240. Reused for both the card thumbnail and the popup. */
  let sceneSeq = 0;

  function starField(n) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = Math.round(rnd(10, 390));
      const y = Math.round(rnd(8, 90));
      const r = (rnd(0.6, 1.6)).toFixed(1);
      const dur = (rnd(1.5, 3.5)).toFixed(2);
      s +=
        '<circle class="sky-star" cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff6d0">' +
        '<animate attributeName="opacity" values="0.2;1;0.2" dur="' + dur + 's" repeatCount="indefinite"/></circle>';
    }
    return s;
  }

  // deterministic-ish random for scene decoration
  function rnd(min, max) { return Math.random() * (max - min) + min; }

  // a row of glowing diya dots along a baseline
  function diyaRow(y, count, startX, endX, glow) {
    let s = "";
    const step = (endX - startX) / (count - 1);
    for (let i = 0; i < count; i++) {
      const x = startX + step * i;
      const d = (rnd(0, 2)).toFixed(2);
      s +=
        '<g class="scene-diya">' +
        '<ellipse cx="' + x.toFixed(1) + '" cy="' + y + '" rx="4" ry="2" fill="#7a3b1a"/>' +
        '<circle cx="' + x.toFixed(1) + '" cy="' + (y - 3) + '" r="' + (glow ? 3.2 : 2.4) + '" fill="#ffcf4d">' +
        '<animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" begin="' + d + 's" repeatCount="indefinite"/>' +
        "</circle></g>";
    }
    return s;
  }

  // Landmark silhouettes, drawn at the horizon (~y 70–120)
  const LANDMARKS = {
    ayodhya:
      '<path d="M120 120 L120 96 L140 84 L160 96 L160 120 Z" fill="#2a1740"/>' +
      '<path d="M170 120 L170 78 L200 60 L230 78 L230 120 Z" fill="#33204d"/>' +
      '<path d="M240 120 L240 96 L260 84 L280 96 L280 120 Z" fill="#2a1740"/>' +
      '<circle cx="200" cy="58" r="6" fill="#ffcf4d"/>',
    amritsar:
      '<rect x="150" y="92" width="100" height="30" fill="#caa12e"/>' +
      '<path d="M170 92 Q200 58 230 92 Z" fill="#e0b93a"/>' +
      '<rect x="196" y="46" width="8" height="16" fill="#e0b93a"/>' +
      '<circle cx="200" cy="44" r="4" fill="#fff0b0"/>',
    varanasi:
      '<path d="M60 120 L120 120 L120 112 L100 112 L100 104 L80 104 L80 96 L60 96 Z" fill="#33204d"/>' +
      '<path d="M280 96 L300 96 L300 104 L320 104 L320 112 L340 112 L340 120 L280 120 Z" fill="#33204d"/>' +
      '<rect x="150" y="72" width="16" height="48" fill="#2a1740"/>' +
      '<rect x="234" y="72" width="16" height="48" fill="#2a1740"/>',
    jaipur:
      '<rect x="120" y="90" width="30" height="30" fill="#7a2f4a"/>' +
      '<rect x="160" y="78" width="34" height="42" fill="#8a3555"/>' +
      '<path d="M160 78 L177 66 L194 78 Z" fill="#a13f66"/>' +
      '<rect x="204" y="88" width="30" height="32" fill="#7a2f4a"/>' +
      '<rect x="244" y="82" width="34" height="38" fill="#8a3555"/>',
    leicester:
      '<path d="M120 120 L120 80 Q200 40 280 80 L280 120" fill="none" stroke="#ffcf4d" stroke-width="3"/>' +
      '<rect x="112" y="96" width="16" height="24" fill="#2a1740"/>' +
      '<rect x="272" y="96" width="16" height="24" fill="#2a1740"/>',
    singapore:
      '<path d="M90 120 L90 86 Q140 62 190 86 L190 120" fill="none" stroke="#ff7ab0" stroke-width="3"/>' +
      '<path d="M210 120 L210 86 Q260 62 310 86 L310 120" fill="none" stroke="#69f0ae" stroke-width="3"/>',
    // Mol, Belgium: a European townscape — church steeple + row houses strung with lights
    mol:
      '<polygon points="150,120 150,70 158,54 166,70 166,120" fill="#2a1740"/>' +
      '<polygon points="158,54 154,46 158,40 162,46 162,54" fill="#33204d"/>' +
      '<circle cx="158" cy="46" r="2" fill="#ffcf4d"/>' +
      '<rect x="100" y="88" width="34" height="32" fill="#33204d"/>' +
      '<polygon points="100,88 117,74 134,88" fill="#3a2650"/>' +
      '<rect x="178" y="84" width="38" height="36" fill="#33204d"/>' +
      '<polygon points="178,84 197,70 216,84" fill="#3a2650"/>' +
      '<rect x="232" y="90" width="34" height="30" fill="#33204d"/>' +
      '<polygon points="232,90 249,76 266,90" fill="#3a2650"/>' +
      '<path d="M100 74 Q160 40 216 70 T300 78" fill="none" stroke="#ffcf4d" stroke-width="2" opacity="0.9"/>',
  };

  function placeScene(key) {
    const gid = "sky-" + sceneSeq++;
    const landmark = LANDMARKS[key] || "";
    // arches (Leicester/Singapore) hang lights along the arch; others get a river reflection
    const hasWater = key === "ayodhya" || key === "amritsar" || key === "varanasi";
    const water = hasWater
      ? '<rect x="0" y="150" width="400" height="90" fill="url(#water-' + gid + ')"/>' +
        diyaRow(158, 14, 30, 370, false) +
        '<g opacity="0.35" transform="translate(0,314) scale(1,-1)">' + diyaRow(158, 14, 30, 370, false) + "</g>"
      : diyaRow(150, 16, 20, 380, true) + diyaRow(176, 16, 20, 380, false);
    return (
      '<svg class="place-scene" viewBox="0 0 400 240" role="img" aria-label="Illustration of Diwali night scene" preserveAspectRatio="xMidYMid slice">' +
      "<defs>" +
      '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#1a0b2e"/><stop offset="60%" stop-color="#3a1a52"/>' +
      '<stop offset="100%" stop-color="#5a2a3e"/></linearGradient>' +
      '<linearGradient id="water-' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#243a5e"/><stop offset="100%" stop-color="#101a30"/></linearGradient>' +
      "</defs>" +
      '<rect x="0" y="0" width="400" height="240" fill="url(#' + gid + ')"/>' +
      starField(28) +
      landmark +
      '<line x1="0" y1="120" x2="400" y2="120" stroke="#1a0f2a" stroke-width="2" opacity="0.5"/>' +
      water +
      "</svg>"
    );
  }

  function buildPlaces(tier) {
    const sec = el("section", "content-section");
    sec.id = "sec-places";
    sec.appendChild(el("h2", "section-title", "🗺️ Famous Places"));
    sec.appendChild(el("p", "section-sub", "Tap a place to see it light up ✨"));
    const grid = el("div", "card-grid");
    CONTENT.places.forEach(function (place) {
      const card = el("article", "place-card");
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "See " + place.name + " light up");
      const banner = place.photo
        ? '<div class="place-banner has-photo"><img src="' + place.photo.src + '" alt="' + escapeHtml(place.photo.alt) + '" loading="lazy"/></div>'
        : '<div class="place-banner">' + placeScene(place.scene) + "</div>";
      card.innerHTML =
        banner +
        "<h3>" + escapeHtml(place.name) + "</h3>" +
        '<p class="place-where">📍 ' + escapeHtml(place.where) + "</p>" +
        '<span class="tap-hint">✨ Tap to see it glow</span>';
      const open = function () { openPlaceModal(place, tier); };
      card.addEventListener("click", open);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
      grid.appendChild(card);
    });
    sec.appendChild(grid);
    return sec;
  }

  function openPlaceModal(place, tier) {
    const overlay = document.getElementById("modal-overlay");
    lastFocusedEl = document.activeElement;

    const stageInner = place.photo
      ? '<img class="place-photo" src="' + place.photo.src + '" alt="' + escapeHtml(place.photo.alt) + '"/>'
      : placeScene(place.scene);
    const credit = place.photo
      ? '<p class="photo-credit">📷 <a href="' + place.photo.sourceUrl + '" target="_blank" rel="noopener">Photo</a> by ' +
        '<a href="' + place.photo.authorUrl + '" target="_blank" rel="noopener">' + escapeHtml(place.photo.author) + "</a>, " +
        '<a href="' + place.photo.licenseUrl + '" target="_blank" rel="noopener">' + escapeHtml(place.photo.license) + "</a></p>"
      : "";

    overlay.innerHTML =
      '<div class="modal place-modal" role="dialog" aria-modal="true" aria-labelledby="place-modal-title">' +
      '<button class="modal-close" aria-label="Close">✕</button>' +
      '<div class="place-stage lighting' + (place.photo ? " has-photo" : "") + '">' + stageInner + "</div>" +
      credit +
      '<h3 id="place-modal-title" class="modal-title">' + escapeHtml(place.name) + "</h3>" +
      '<p class="place-where">📍 ' + escapeHtml(place.where) + "</p>" +
      '<p class="modal-text">' + escapeHtml(place[tier]) + "</p>" +
      "</div>";

    overlay.classList.add("open");
    document.body.classList.add("modal-open");

    const modal = overlay.querySelector(".modal");
    const stage = overlay.querySelector(".place-stage");
    const closeBtn = overlay.querySelector(".modal-close");

    if (window.Fireworks) {
      window.Fireworks.launchAt();
      setTimeout(function () { window.Fireworks.launchAt(); }, 300);
    }
    setTimeout(function () { stage.classList.remove("lighting"); }, 1000);

    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    modal.addEventListener("keydown", trapFocus);
    closeBtn.focus();
  }

  function buildCrackers(tier) {
    const sec = el("section", "content-section");
    sec.id = "sec-crackers";
    sec.appendChild(el("h2", "section-title", "🎆 Firecrackers"));
    sec.appendChild(el("p", "section-sub", "Tap one to see and hear how it lights up! (All safe & digital 😄)"));
    const grid = el("div", "card-grid");
    const icons = { sparkler: "✨", anar: "⛲", chakri: "🌀", rocket: "🚀", skyshot: "🎆", snake: "🐍", sutlibam: "💥", ladi: "🧨", sevenshots: "7️⃣" };
    CONTENT.crackers.forEach(function (cr) {
      const card = el("article", "cracker-card");
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "Light the " + cr.name);
      card.innerHTML =
        '<span class="big-icon">' + (icons[cr.anim] || "🎇") + "</span>" +
        "<h3>" + escapeHtml(cr.name) + '<span class="hindi"> · ' + escapeHtml(cr.hindi) + "</span></h3>" +
        "<p>" + escapeHtml(cr[tier]) + "</p>" +
        '<span class="tap-hint">✨ Tap to light!</span>';
      const open = function () { openCrackerModal(cr, tier); };
      card.addEventListener("click", open);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
      grid.appendChild(card);
    });
    sec.appendChild(grid);
    return sec;
  }

  function openCrackerModal(cr, tier) {
    const overlay = document.getElementById("modal-overlay");
    lastFocusedEl = document.activeElement;

    overlay.innerHTML =
      '<div class="modal cracker-modal" role="dialog" aria-modal="true" aria-labelledby="cracker-modal-title">' +
      '<button class="modal-close" aria-label="Close">✕</button>' +
      '<div class="cracker-stage"><canvas class="cracker-canvas"></canvas></div>' +
      '<h3 id="cracker-modal-title" class="modal-title">' + escapeHtml(cr.name) +
      '<span class="hindi"> · ' + escapeHtml(cr.hindi) + "</span></h3>" +
      '<p class="modal-text">' + escapeHtml(cr[tier]) + "</p>" +
      '<div class="modal-actions"><button class="btn-go cracker-replay">▶ Play again</button></div>' +
      "</div>";

    overlay.classList.add("open");
    document.body.classList.add("modal-open");

    const modal = overlay.querySelector(".modal");
    const canvas = overlay.querySelector(".cracker-canvas");
    const closeBtn = overlay.querySelector(".modal-close");
    const replayBtn = overlay.querySelector(".cracker-replay");

    let stopAnim = null;
    function run() {
      if (stopAnim) stopAnim();
      if (window.Sound) { window.Sound.resume(); window.Sound.play(cr.anim); }
      // slight delay so the canvas has laid out with correct size
      requestAnimationFrame(function () {
        if (window.CrackerAnim) stopAnim = window.CrackerAnim.play(canvas, cr.anim);
      });
    }

    function close() {
      if (stopAnim) stopAnim();
      closeModal();
    }

    replayBtn.addEventListener("click", run);
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    modal.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); close(); return; }
      trapFocus(e);
    });
    closeBtn.focus();
    run();
  }

  /* ---------- Optional video slot (self-contained by default) ---------- */
  function buildVideo() {
    const sec = el("section", "content-section");
    sec.id = "sec-video";
    sec.appendChild(el("h2", "section-title", "📺 Watch the Lights"));
    // By default we show our own animated fireworks button (no copyright).
    // To embed a real YouTube video, see README.md — replace the block below
    // with an <iframe> using a video you have the right to embed.
    const holder = el("div", "video-holder no-fireworks");
    holder.innerHTML =
      '<div class="video-placeholder">' +
      "<span class=\"big-icon\">🎆</span>" +
      "<p>Enjoy our live, hand-built fireworks show — tap anywhere on the screen!</p>" +
      '<button class="btn-go" id="video-fireworks-btn">Launch a show 🎇</button>' +
      "<p class=\"video-hint\">Want a real video here? See README.md to drop in a YouTube embed you have rights to.</p>" +
      "</div>";
    sec.appendChild(holder);
    return sec;
  }

  function buildMemories(tier) {
    const sec = el("section", "content-section");
    sec.id = "sec-memories";
    sec.appendChild(el("h2", "section-title", "🎉 Our Diwali Memories"));
    sec.appendChild(el("p", "section-sub", "Photos and videos from our celebrations — opens in Google Drive."));
    const grid = el("div", "card-grid");
    (CONTENT.memories || []).forEach(function (m) {
      const card = el("a", "memory-card no-fireworks");
      card.href = m.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.setAttribute("aria-label", "Open Diwali " + m.year + " memories in Google Drive (new tab)");
      card.innerHTML =
        '<span class="big-icon">' + m.emoji + "</span>" +
        "<h3>Diwali " + escapeHtml(m.year) + "</h3>" +
        "<p>" + escapeHtml(m[tier]) + "</p>" +
        '<span class="tap-hint">📂 Open album ↗</span>';
      grid.appendChild(card);
    });
    sec.appendChild(grid);
    return sec;
  }

  function buildQuiz(tier) {
    const sec = el("section", "content-section");
    sec.id = "sec-quiz";
    sec.appendChild(el("h2", "section-title", "🧠 Diwali Quiz"));
    const questions = CONTENT.quiz[tier];
    let score = 0;
    let answered = 0;

    const scoreEl = el("p", "quiz-score", "Score: 0 / " + questions.length);
    sec.appendChild(scoreEl);

    questions.forEach(function (item, qi) {
      const qCard = el("div", "quiz-card");
      qCard.appendChild(el("p", "quiz-q", (qi + 1) + ". " + escapeHtml(item.q)));
      const opts = el("div", "quiz-options");
      item.options.forEach(function (opt, oi) {
        const b = el("button", "quiz-option", escapeHtml(opt));
        b.addEventListener("click", function () {
          if (qCard.classList.contains("done")) return;
          qCard.classList.add("done");
          answered++;
          if (oi === item.answer) {
            b.classList.add("correct");
            score++;
            if (window.Fireworks) window.Fireworks.launchAt();
          } else {
            b.classList.add("wrong");
            // reveal correct one
            opts.children[item.answer].classList.add("correct");
          }
          scoreEl.textContent = "Score: " + score + " / " + questions.length;
          if (answered === questions.length) {
            const msg =
              score === questions.length
                ? "🎉 Perfect! You're a Diwali star!"
                : score >= questions.length / 2
                ? "👏 Well done!"
                : "🙂 Nice try — explore and play again!";
            scoreEl.textContent = "Score: " + score + " / " + questions.length + " — " + msg;
            if (window.Fireworks && score === questions.length) {
              for (let k = 0; k < 5; k++) {
                setTimeout(function () { window.Fireworks.launchAt(); }, k * 200);
              }
            }
          }
        });
        opts.appendChild(b);
      });
      qCard.appendChild(opts);
      sec.appendChild(qCard);
    });
    return sec;
  }

  /* ---------- Navigation ---------- */
  const SECTIONS = [
    { id: "sec-intro", label: "About", build: buildIntro },
    { id: "sec-days", label: "5 Days", build: buildDays },
    { id: "sec-diyas", label: "Diyas", build: buildDiyas },
    { id: "sec-places", label: "Places", build: buildPlaces },
    { id: "sec-crackers", label: "Crackers", build: buildCrackers },
    { id: "sec-video", label: "Watch", build: buildVideo },
    { id: "sec-memories", label: "Memories", build: buildMemories },
    { id: "sec-quiz", label: "Quiz", build: buildQuiz },
  ];

  function buildNav() {
    navEl.innerHTML = "";
    SECTIONS.forEach(function (s) {
      const b = el("button", "nav-btn", s.label);
      b.addEventListener("click", function () {
        const target = document.getElementById(s.id);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      navEl.appendChild(b);
    });
  }

  function renderContent(tier) {
    sectionsEl.innerHTML = "";
    SECTIONS.forEach(function (s) {
      sectionsEl.appendChild(s.build(tier));
    });
    // hook up the in-video fireworks button
    const vb = document.getElementById("video-fireworks-btn");
    if (vb) {
      vb.addEventListener("click", function () {
        for (let k = 0; k < 4; k++) {
          setTimeout(function () { window.Fireworks && window.Fireworks.launchAt(); }, k * 220);
        }
      });
    }
  }

  /* ---------- Screen transitions ---------- */
  function showApp(tier) {
    currentTier = tier;
    const info = AGE_TIERS[tier];
    tierBadge.textContent = info.emoji + " " + info.label + " (" + info.range + ")";
    buildNav();
    renderContent(tier);
    ageGate.classList.remove("active");
    app.classList.add("active");
    window.scrollTo(0, 0);
    // celebratory launch
    if (window.Fireworks) {
      window.Fireworks.launchAt();
      setTimeout(function () { window.Fireworks.launchAt(); }, 300);
    }
  }

  function startOver() {
    app.classList.remove("active");
    ageGate.classList.add("active");
    sectionsEl.innerHTML = "";
    navEl.innerHTML = "";
    currentTier = null;
    const input = document.getElementById("exact-age");
    if (input) input.value = "";
    window.scrollTo(0, 0);
  }

  function chooseAge(age) {
    const n = parseInt(age, 10);
    if (isNaN(n) || n < 1 || n > 120) return;
    showApp(tierForAge(n));
  }

  /* ---------- Event wiring ---------- */
  document.querySelectorAll(".age-card").forEach(function (btn) {
    btn.addEventListener("click", function () {
      chooseAge(btn.getAttribute("data-age"));
    });
  });

  document.getElementById("exact-age-go").addEventListener("click", function () {
    chooseAge(document.getElementById("exact-age").value);
  });

  document.getElementById("exact-age").addEventListener("keydown", function (e) {
    if (e.key === "Enter") chooseAge(this.value);
  });

  startOverBtn.addEventListener("click", startOver);

  // Mute toggle
  const muteBtn = document.getElementById("mute-toggle");
  function syncMuteBtn() {
    if (!muteBtn || !window.Sound) return;
    const m = window.Sound.isMuted();
    muteBtn.textContent = m ? "🔇" : "🔊";
    muteBtn.setAttribute("aria-pressed", m ? "true" : "false");
    muteBtn.title = m ? "Sound off (tap to turn on)" : "Sound on (tap to mute)";
  }
  if (muteBtn) {
    syncMuteBtn();
    muteBtn.addEventListener("click", function () {
      if (window.Sound) { window.Sound.resume(); window.Sound.toggleMuted(); }
      syncMuteBtn();
    });
  }

  if (launchBtn) {
    launchBtn.addEventListener("click", function () {
      for (let k = 0; k < 4; k++) {
        setTimeout(function () { window.Fireworks && window.Fireworks.launchAt(); }, k * 200);
      }
    });
  }

  // Keyboard shortcut: Escape = start over (handy for kiosk)
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && app.classList.contains("active")) startOver();
  });

  // Kick off the fireworks engine
  if (window.Fireworks) window.Fireworks.start();
})();
