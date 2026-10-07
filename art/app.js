// Art Studio — drawing canvas, Diwali stamps/scenes, photo upload, gallery.
// Backend: Netlify Functions at /api/* (presigned R2 URLs). No credentials here.

// Prefer friendly /api paths (redirected in netlify.toml); fall back to the
// default functions path if a redirect isn't present.
const API = {
  upload: "/api/upload-art",
  list: "/api/list-art",
  get: "/api/get-art",
};

const MAX_BYTES = 5 * 1024 * 1024;   // 5 MB client-side cap (server also enforces)
const MAX_DIM = 1600;                // downscale longest edge to this many px

// ---------- Tabs ----------
const tabs = document.querySelectorAll(".tab");
const views = {
  draw: document.getElementById("view-draw"),
  upload: document.getElementById("view-upload"),
  gallery: document.getElementById("view-gallery"),
};
tabs.forEach((t) => {
  t.addEventListener("click", () => {
    tabs.forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    Object.values(views).forEach((v) => v.classList.remove("active"));
    const view = t.dataset.view;
    views[view].classList.add("active");
    if (view === "gallery") loadGallery();
  });
});

// ================= DRAWING ENGINE =================
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

// Fill white background initially (so exported PNG isn't transparent).
function fillWhite() {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
fillWhite();

let tool = "brush";
let color = "#ff6a00";
let size = 8;
let stamp = null;        // active stamp name or null
let drawing = false;
let lastX = 0, lastY = 0;

// Undo stack (store limited snapshots).
const undoStack = [];
const UNDO_LIMIT = 20;
function pushUndo() {
  try {
    if (undoStack.length >= UNDO_LIMIT) undoStack.shift();
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  } catch (_) {}
}

// --- Tool buttons ---
document.querySelectorAll("[data-tool]").forEach((b) => {
  b.addEventListener("click", () => {
    tool = b.dataset.tool;
    stamp = null;
    setActive("[data-tool],[data-stamp]", b);
  });
});

// --- Stamp buttons ---
document.querySelectorAll("[data-stamp]").forEach((b) => {
  b.addEventListener("click", () => {
    stamp = b.dataset.stamp;
    tool = "stamp";
    setActive("[data-tool],[data-stamp]", b);
  });
});

// --- Scene buttons ---
document.querySelectorAll("[data-scene]").forEach((b) => {
  b.addEventListener("click", () => {
    pushUndo();
    drawScene(b.dataset.scene);
  });
});

function setActive(selector, el) {
  document.querySelectorAll(selector).forEach((x) => x.classList.remove("active"));
  el.classList.add("active");
}

// --- Colour swatches ---
const SWATCHES = ["#ff6a00", "#ffd400", "#ff2d7e", "#8a2be2", "#00c2ff", "#2ecc71", "#ffffff", "#111111"];
const swatchWrap = document.getElementById("swatches");
SWATCHES.forEach((c, i) => {
  const s = document.createElement("div");
  s.className = "swatch" + (i === 0 ? " active" : "");
  s.style.background = c;
  s.addEventListener("click", () => {
    color = c;
    document.getElementById("colorPicker").value = c;
    document.querySelectorAll(".swatch").forEach((x) => x.classList.remove("active"));
    s.classList.add("active");
  });
  swatchWrap.appendChild(s);
});
document.getElementById("colorPicker").addEventListener("input", (e) => {
  color = e.target.value;
  document.querySelectorAll(".swatch").forEach((x) => x.classList.remove("active"));
});

// --- Size ---
const sizeRange = document.getElementById("sizeRange");
const sizeVal = document.getElementById("sizeVal");
sizeRange.addEventListener("input", () => {
  size = parseInt(sizeRange.value, 10);
  sizeVal.textContent = size;
});

// --- Pointer handling (mouse + touch via Pointer Events) ---
function canvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  const { x, y } = canvasPos(e);
  pushUndo();
  if (tool === "stamp") {
    drawStamp(stamp, x, y);
    return;
  }
  drawing = true;
  lastX = x; lastY = y;
  // dot on single click
  strokeTo(x, y);
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  const { x, y } = canvasPos(e);
  strokeTo(x, y);
});

canvas.addEventListener("pointerup", () => (drawing = false));
canvas.addEventListener("pointerleave", () => (drawing = false));

function strokeTo(x, y) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = size;
  ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  lastX = x; lastY = y;
}

// --- Undo / Clear ---
document.getElementById("undoBtn").addEventListener("click", () => {
  const prev = undoStack.pop();
  if (prev) ctx.putImageData(prev, 0, 0);
});
document.getElementById("clearBtn").addEventListener("click", () => {
  pushUndo();
  fillWhite();
});

// ================= STAMPS =================
function drawStamp(name, x, y) {
  const s = Math.max(size * 3, 30); // stamp scale from brush size
  switch (name) {
    case "diya": return drawDiya(x, y, s);
    case "rangoli": return drawRangoli(x, y, s);
    case "firework": return drawFirework(x, y, s);
    case "star": return drawStar(x, y, s * 0.6, 5, color);
    default: return;
  }
}

function drawDiya(x, y, s) {
  // bowl
  ctx.fillStyle = "#8b3a1b";
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.6, s * 0.28, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = "#b4521f";
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.6, s * 0.14, 0, Math.PI, 2 * Math.PI);
  ctx.fill();
  // flame
  const grad = ctx.createRadialGradient(x, y - s * 0.5, 1, x, y - s * 0.5, s * 0.4);
  grad.addColorStop(0, "#fff3b0");
  grad.addColorStop(0.5, "#ffb400");
  grad.addColorStop(1, "#ff5e00");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.95);
  ctx.quadraticCurveTo(x + s * 0.22, y - s * 0.45, x, y - s * 0.28);
  ctx.quadraticCurveTo(x - s * 0.22, y - s * 0.45, x, y - s * 0.95);
  ctx.fill();
}

function drawRangoli(x, y, s) {
  const petals = 8;
  const colors = ["#ff2d7e", "#ffd400", "#8a2be2", "#00c2ff", "#2ecc71"];
  for (let ring = 3; ring >= 1; ring--) {
    const r = s * 0.22 * ring;
    ctx.fillStyle = colors[ring % colors.length];
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      ctx.beginPath();
      ctx.arc(px, py, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawFirework(x, y, s) {
  const rays = 16;
  const palette = ["#ffd400", "#ff2d7e", "#00c2ff", "#ffffff", "#ff6a00"];
  ctx.lineWidth = 2;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    ctx.strokeStyle = palette[i % palette.length];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
    ctx.stroke();
    ctx.fillStyle = palette[i % palette.length];
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * s, y + Math.sin(a) * s, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStar(cx, cy, outer, points, fill) {
  const inner = outer * 0.45;
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// ================= SCENES (one-tap compositions) =================
function drawScene(name) {
  const W = canvas.width, H = canvas.height;
  if (name === "city") return sceneCity(W, H);
  if (name === "riverbank") return sceneRiverbank(W, H);
  if (name === "rangoli-bg") return sceneRangoliBg(W, H);
}

function nightSky(W, H) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0b1026");
  grad.addColorStop(1, "#2a1b4a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // stars
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 60; i++) {
    ctx.globalAlpha = Math.random() * 0.8 + 0.2;
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H * 0.6, Math.random() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function sceneCity(W, H) {
  nightSky(W, H);
  // skyline
  const colors = ["#1b2440", "#232f52", "#2d3a63"];
  let x = 0;
  while (x < W) {
    const bw = 40 + Math.random() * 70;
    const bh = 120 + Math.random() * (H * 0.45);
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(x, H - bh, bw, bh);
    // lit windows
    ctx.fillStyle = "#ffd36b";
    for (let wy = H - bh + 12; wy < H - 12; wy += 20) {
      for (let wx = x + 8; wx < x + bw - 8; wx += 16) {
        if (Math.random() > 0.4) ctx.fillRect(wx, wy, 6, 10);
      }
    }
    x += bw + 6;
  }
  // fireworks in the sky
  drawFirework(W * 0.25, H * 0.22, 70);
  drawFirework(W * 0.6, H * 0.15, 90);
  drawFirework(W * 0.82, H * 0.3, 60);
}

function sceneRiverbank(W, H) {
  nightSky(W, H);
  const waterTop = H * 0.6;
  // water
  const wg = ctx.createLinearGradient(0, waterTop, 0, H);
  wg.addColorStop(0, "#13385c");
  wg.addColorStop(1, "#0a1f36");
  ctx.fillStyle = wg;
  ctx.fillRect(0, waterTop, W, H - waterTop);
  // bank
  ctx.fillStyle = "#3b2a1a";
  ctx.fillRect(0, waterTop - 14, W, 16);
  // floating diyas on the water with reflections
  for (let i = 0; i < 7; i++) {
    const dx = (W / 8) * (i + 1) + (Math.random() * 20 - 10);
    const dy = waterTop + 10 + (i % 3) * 22;
    drawDiya(dx, dy, 46);
    // reflection glow
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#ffb400";
    ctx.beginPath();
    ctx.ellipse(dx, dy + 26, 10, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // moon
  ctx.fillStyle = "#fdf6d8";
  ctx.beginPath();
  ctx.arc(W * 0.85, H * 0.18, 34, 0, Math.PI * 2);
  ctx.fill();
}

function sceneRangoliBg(W, H) {
  const grad = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2);
  grad.addColorStop(0, "#2a1b4a");
  grad.addColorStop(1, "#0b1026");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  drawRangoli(W / 2, H / 2, 260);
  drawRangoli(W * 0.18, H * 0.2, 110);
  drawRangoli(W * 0.82, H * 0.2, 110);
  drawRangoli(W * 0.18, H * 0.82, 110);
  drawRangoli(W * 0.82, H * 0.82, 110);
}

// ================= SUBMIT DRAWING =================
const drawStatus = document.getElementById("drawStatus");
document.getElementById("submitDrawingBtn").addEventListener("click", async () => {
  // Name is mandatory.
  const author = askRequiredName();
  if (!author) {
    return setStatus(drawStatus, "Please enter your name to share your artwork.", "err");
  }
  setStatus(drawStatus, "Preparing your artwork…", "busy");
  canvas.toBlob(async (blob) => {
    if (!blob) return setStatus(drawStatus, "Could not read the canvas.", "err");
    await uploadBlob(blob, "my-drawing.png", "image/png", author, drawStatus);
  }, "image/png");
});

// Prompt for a name and require a non-empty value. Returns a clean name, or
// null if the user cancels or leaves it blank.
function askRequiredName() {
  let name = prompt("Please enter your name for the gallery (required):", "");
  if (name === null) return null;          // cancelled
  name = name.trim().slice(0, 24);
  return name.length > 0 ? name : null;    // blank not allowed
}

// ================= PHOTO UPLOAD =================
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const previewImg = document.getElementById("previewImg");
const uploadBtn = document.getElementById("uploadBtn");
const uploadStatus = document.getElementById("uploadStatus");
const uploadAuthor = document.getElementById("uploadAuthor");
let processedBlob = null;
let processedType = "image/jpeg";

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("dragover"); });
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

async function handleFile(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    return setStatus(uploadStatus, "Please choose a PNG, JPEG, or WebP image.", "err");
  }
  setStatus(uploadStatus, "Processing image…", "busy");
  try {
    const { blob, type } = await downscaleImage(file, MAX_DIM);
    if (blob.size > MAX_BYTES) {
      return setStatus(uploadStatus, "Image is still larger than 5 MB after shrinking. Try a smaller photo.", "err");
    }
    processedBlob = blob;
    processedType = type;
    previewImg.src = URL.createObjectURL(blob);
    previewImg.style.display = "block";
    uploadBtn.disabled = false;
    setStatus(uploadStatus, `Ready — ${(blob.size / 1024).toFixed(0)} KB after shrinking.`, "ok");
  } catch (err) {
    setStatus(uploadStatus, "Could not process that image.", "err");
  }
}

// Downscale with a canvas; output JPEG (smaller) unless source is PNG w/ transparency.
function downscaleImage(file, maxDim) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const c = document.createElement("canvas");
      c.width = width; c.height = height;
      const cctx = c.getContext("2d");
      cctx.drawImage(img, 0, 0, width, height);
      const outType = "image/jpeg";
      c.toBlob(
        (blob) => (blob ? resolve({ blob, type: outType }) : reject(new Error("toBlob failed"))),
        outType,
        0.85
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

uploadBtn.addEventListener("click", async () => {
  if (!processedBlob) return;
  const author = (uploadAuthor.value || "").trim().slice(0, 24);
  if (!author) {
    uploadAuthor.focus();
    return setStatus(uploadStatus, "Please enter your name before uploading.", "err");
  }
  const ext = processedType === "image/png" ? "png" : "jpg";
  uploadBtn.disabled = true;
  await uploadBlob(processedBlob, `handmade.${ext}`, processedType, author, uploadStatus);
  uploadBtn.disabled = false;
});

// ================= UPLOAD CORE (presigned PUT) =================
async function uploadBlob(blob, filename, contentType, author, statusEl) {
  if (blob.size > MAX_BYTES) {
    return setStatus(statusEl, "File too large (max 5 MB).", "err");
  }
  setStatus(statusEl, "Requesting upload…", "busy");
  try {
    // 1) Ask the function for a presigned PUT URL (validates size/type/budget).
    const res = await fetch(API.upload, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, contentType, size: blob.size, author }),
    });
    const data = await res.json();
    if (!res.ok) {
      return setStatus(statusEl, data.error || "Upload refused.", "err");
    }

    // 2) PUT the bytes straight to R2.
    setStatus(statusEl, "Uploading…", "busy");
    const put = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!put.ok) {
      return setStatus(statusEl, "Upload to storage failed (" + put.status + ").", "err");
    }

    setStatus(statusEl, "🎉 Shared to the gallery!", "ok");
  } catch (err) {
    setStatus(statusEl, "Network error during upload.", "err");
  }
}

function setStatus(el, msg, cls) {
  el.textContent = msg;
  el.className = "status-line" + (cls ? " " + cls : "");
}

// ================= GALLERY =================
const galleryGrid = document.getElementById("galleryGrid");
const galleryEmpty = document.getElementById("galleryEmpty");
const usageBar = document.getElementById("usageBar");
const usageText = document.getElementById("usageText");
document.getElementById("refreshGalleryBtn").addEventListener("click", loadGallery);

let galleryLoading = false;
async function loadGallery() {
  if (galleryLoading) return;
  galleryLoading = true;
  galleryEmpty.style.display = "block";
  galleryEmpty.textContent = "Loading gallery…";
  galleryGrid.innerHTML = "";

  try {
    const res = await fetch(API.list + "?limit=100");
    const data = await res.json();
    if (!res.ok) {
      galleryEmpty.textContent = data.error || "Could not load gallery.";
      return;
    }

    // usage bar
    if (typeof data.usedBytes === "number" && data.budgetBytes) {
      const pct = Math.min(100, (data.usedBytes / data.budgetBytes) * 100);
      usageBar.style.width = pct.toFixed(1) + "%";
      usageText.textContent =
        `${(data.usedBytes / (1024 * 1024)).toFixed(0)} MB used of ${(data.budgetBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }

    if (!data.items || data.items.length === 0) {
      galleryEmpty.textContent = "No artwork yet — be the first to share!";
      return;
    }
    galleryEmpty.style.display = "none";

    // Fetch presigned GET URLs (in parallel) and render.
    await Promise.all(
      data.items.map(async (item) => {
        try {
          const r = await fetch(API.get + "?key=" + encodeURIComponent(item.key));
          const d = await r.json();
          if (!r.ok || !d.url) return;
          const cell = document.createElement("div");
          cell.className = "gallery-item";
          const img = document.createElement("img");
          img.loading = "lazy";
          img.src = d.url;
          img.alt = item.author || "artwork";
          const who = document.createElement("div");
          who.className = "who";
          who.textContent = item.author || "anon";
          cell.appendChild(img);
          cell.appendChild(who);
          galleryGrid.appendChild(cell);
        } catch (_) {}
      })
    );
  } catch (err) {
    galleryEmpty.textContent = "Network error loading gallery.";
  } finally {
    galleryLoading = false;
  }
}
