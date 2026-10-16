/* Diwali Memories slideshow engine.
 *
 * Pulls IMAGES ONLY from the public Google Drive "memories" album via the
 * Netlify function /api/list-memories (which filters out videos server-side).
 * Renders them fullscreen on a TV with a crossfade, auto-advance, periodic
 * refresh (so newly added photos appear), a screen Wake Lock (so the TV does
 * not sleep), and fullscreen-on-start. No videos are ever loaded.
 */

(function () {
  "use strict";

  // ---------- Config ----------
  var API_LIST = "/api/list-memories";
  var YEAR = "2025";                 // 2025 = portrait PHOTOS album
  var SLIDE_MS = 7000;               // time each photo is shown
  var REFRESH_MS = 3 * 60 * 1000;    // re-list the folder every 3 minutes
  var CONTROLS_HIDE_MS = 3500;       // auto-hide controls after inactivity

  // Allow quick overrides via query string, e.g. ?year=2024&seconds=10
  var params = new URLSearchParams(location.search);
  if (params.get("year")) YEAR = params.get("year");
  if (params.get("seconds")) {
    var s = parseInt(params.get("seconds"), 10);
    if (s >= 2 && s <= 120) SLIDE_MS = s * 1000;
  }
  var SHUFFLE = params.get("shuffle") !== "0"; // shuffle by default

  // ---------- DOM ----------
  var layers = [document.getElementById("layerA"), document.getElementById("layerB")];
  var captionEl = document.getElementById("caption");
  var overlay = document.getElementById("overlay");
  var overlayMsg = document.getElementById("overlayMsg");
  var startBtn = document.getElementById("startBtn");
  var controls = document.getElementById("controls");
  var statusEl = document.getElementById("status");
  var prevBtn = document.getElementById("prevBtn");
  var nextBtn = document.getElementById("nextBtn");
  var playBtn = document.getElementById("playBtn");
  var fsBtn = document.getElementById("fsBtn");

  // ---------- State ----------
  var photos = [];        // [{ url, name }]
  var order = [];         // indices into photos (possibly shuffled)
  var pos = 0;            // current position in `order`
  var activeLayer = 0;    // which layer is currently visible
  var playing = true;
  var timer = null;
  var refreshTimer = null;
  var wakeLock = null;
  var started = false;
  var idleTimer = null;

  // ---------- Helpers ----------
  function setStatus(msg) {
    if (!msg) { statusEl.hidden = true; return; }
    statusEl.hidden = false;
    statusEl.textContent = msg;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function buildOrder() {
    order = photos.map(function (_, i) { return i; });
    if (SHUFFLE) shuffle(order);
  }

  function isImageUrl(u) {
    // Defensive: our API only returns images, but never show anything that
    // looks like a video even if the data were tampered with.
    return typeof u === "string" && !/\.(mp4|mov|webm|mkv|avi|m4v)(\?|$)/i.test(u);
  }

  // Preload an image URL; resolves when ready (or rejects on error).
  function preload(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(url); };
      img.onerror = function () { reject(new Error("image failed")); };
      img.src = url;
    });
  }

  // ---------- Fetching ----------
  function fetchPhotos() {
    return fetch(API_LIST + "?year=" + encodeURIComponent(YEAR))
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || "Could not load memories.");
          return data;
        });
      })
      .then(function (data) {
        var items = (data.items || [])
          .filter(function (it) { return it && isImageUrl(it.url); })
          .map(function (it) { return { url: it.url, name: it.name || "" }; });
        return items;
      });
  }

  // ---------- Rendering ----------
  function showPhotoAt(index) {
    if (!photos.length) return;
    var photo = photos[order[index]];
    if (!photo) return;

    preload(photo.url)
      .then(function () {
        var next = 1 - activeLayer;
        var el = layers[next];
        // Both the blurred backdrop (.bg) and the sharp photo (.fg) read this
        // CSS variable, so one assignment updates both.
        el.style.setProperty("--img", "url('" + photo.url.replace(/'/g, "%27") + "')");
        // crossfade
        layers[activeLayer].classList.remove("show");
        el.classList.add("show");
        activeLayer = next;

        // caption
        var label = photo.name ? photo.name.replace(/\.[^.]+$/, "") : "";
        captionEl.textContent = (label ? label + " · " : "") + "Diwali " + YEAR;
        captionEl.classList.add("show");
      })
      .catch(function () {
        // Skip a broken image and move on.
        advance(1);
      });
  }

  function advance(step) {
    if (!photos.length) return;
    pos = (pos + step + order.length) % order.length;
    showPhotoAt(pos);
  }

  function scheduleNext() {
    clearTimeout(timer);
    if (!playing) return;
    timer = setTimeout(function () {
      advance(1);
      scheduleNext();
    }, SLIDE_MS);
  }

  // ---------- Controls ----------
  function setPlaying(on) {
    playing = on;
    playBtn.textContent = on ? "⏸" : "▶";
    if (on) scheduleNext(); else clearTimeout(timer);
  }

  function next() { advance(1); scheduleNext(); }
  function prev() { advance(-1); scheduleNext(); }

  function showControls() {
    controls.classList.add("show");
    document.body.classList.remove("idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      controls.classList.remove("show");
      document.body.classList.add("idle");
    }, CONTROLS_HIDE_MS);
  }

  // ---------- Fullscreen + Wake Lock ----------
  function enterFullscreen() {
    var el = document.documentElement;
    var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (fn) {
      try { fn.call(el); } catch (e) { /* ignored — some TVs block it */ }
    }
  }

  function requestWakeLock() {
    if (!("wakeLock" in navigator)) return;
    navigator.wakeLock
      .request("screen")
      .then(function (lock) {
        wakeLock = lock;
        wakeLock.addEventListener("release", function () { wakeLock = null; });
      })
      .catch(function () { /* not fatal — TV may ignore sleep anyway */ });
  }

  // Re-acquire the wake lock when the tab becomes visible again.
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      if (!wakeLock) requestWakeLock();
    }
  });

  // ---------- Periodic refresh (pick up newly added photos) ----------
  function refreshLoop() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () {
      fetchPhotos()
        .then(function (items) {
          if (items.length) {
            photos = items;
            buildOrder();
            // keep pos in range
            if (pos >= order.length) pos = 0;
          }
        })
        .catch(function () { /* keep showing what we have */ })
        .finally(refreshLoop);
    }, REFRESH_MS);
  }

  // ---------- Start ----------
  function begin() {
    if (started) return;
    started = true;
    overlay.classList.add("hidden");
    enterFullscreen();
    requestWakeLock();
    setPlaying(true);
    showPhotoAt(pos);
    scheduleNext();
    refreshLoop();
    showControls();
  }

  function boot() {
    overlayMsg.textContent = "Loading our Diwali " + YEAR + " photos…";
    fetchPhotos()
      .then(function (items) {
        if (!items.length) {
          overlayMsg.textContent =
            "No photos found yet in the " + YEAR + " album. (The slideshow shows images only.)";
          return;
        }
        photos = items;
        buildOrder();
        overlayMsg.textContent = items.length + " photos ready. Tap to start.";
      })
      .catch(function (err) {
        overlayMsg.textContent = err.message || "Could not load memories.";
      });
  }

  // ---------- Events ----------
  startBtn.addEventListener("click", function (e) { e.stopPropagation(); begin(); });
  overlay.addEventListener("click", function () { if (photos.length) begin(); });

  prevBtn.addEventListener("click", function (e) { e.stopPropagation(); prev(); showControls(); });
  nextBtn.addEventListener("click", function (e) { e.stopPropagation(); next(); showControls(); });
  playBtn.addEventListener("click", function (e) { e.stopPropagation(); setPlaying(!playing); showControls(); });
  fsBtn.addEventListener("click", function (e) { e.stopPropagation(); enterFullscreen(); showControls(); });

  document.addEventListener("mousemove", function () { if (started) showControls(); });
  document.addEventListener("touchstart", function () { if (started) showControls(); }, { passive: true });

  document.addEventListener("keydown", function (e) {
    if (!started) {
      if (e.key === "Enter" || e.key === " ") { if (photos.length) begin(); }
      return;
    }
    switch (e.key) {
      case "ArrowRight": next(); showControls(); break;
      case "ArrowLeft": prev(); showControls(); break;
      case " ": e.preventDefault(); setPlaying(!playing); showControls(); break;
      case "f": case "F": enterFullscreen(); break;
      default: break;
    }
  });

  boot();
})();
