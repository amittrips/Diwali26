# 🪔 Diwali — Festival of Lights (Interactive Kiosk)

A self-contained, kiosk-friendly infotainment site about Diwali, built with plain
HTML, CSS, and JavaScript. No build step, no external assets, no tracking — it
works offline and can be dropped onto any static host (Netlify, GitHub Pages, etc.).

## ✨ Features

- **Age gate first** — pick an age group (or type an exact age) and content adapts:
  - 🌟 Little Star (3–7): simple words, big visuals
  - 🧭 Explorer (8–12): stories and facts
  - 📚 Scholar (13+): richer history, regional variations, firework chemistry
- **Start Over anytime** — the top-right button (or the `Esc` key) resets to the age gate.
- **Interactive fireworks** — tap/click anywhere to launch canvas-drawn fireworks. Fully hand-built, so there are **no copyright concerns** and nothing to load.
- **Hand-drawn diyas** — SVG diyas with animated flames; tap to "light" them.
- **Sections**: About · The 5 Days (flip cards) · Diyas · Famous Places · Firecrackers · Watch · Quiz.
- **Age-tiered quiz** with live scoring and celebratory fireworks.
- **Kiosk-ready**: large touch targets, no hover-only interactions, `Esc` to reset, responsive.

## 📂 Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure: age gate + app shell + canvas |
| `styles.css` | All styling (colorful, responsive, kiosk-friendly) |
| `content.js` | All text content, organized by age tier |
| `app.js` | Age selection, content rendering, navigation, quiz, start-over |
| `fireworks.js` | Canvas fireworks engine (tap to launch) |
| `netlify.toml` | Netlify hosting config (static, with headers) |

## ▶️ Run locally

It's static, so any local web server works. From the project folder:

```bash
# Python 3
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` directly in a browser (the canvas and everything work
from `file://` too).

## 🚀 Deploy to Netlify

**Option A — drag & drop:** zip or drag the project folder into the Netlify
"Deploy" dropzone. Done.

**Option B — Git:** push this folder to a repo and connect it in Netlify.
No build command is needed; `netlify.toml` already sets `publish = "."`.

**Option C — CLI:**

```bash
npm install -g netlify-cli
netlify deploy --prod
```

## 📺 Adding a real YouTube video (optional)

By default the **"Watch"** section shows our own animated fireworks (zero
copyright risk). If you want to embed a real video, only embed content you have
the right to use — for example, an official channel's video where embedding is
enabled, or your own footage.

To swap it in, open **`app.js`**, find the `buildVideo()` function, and replace
the `.video-placeholder` block with a standard YouTube privacy-friendly embed:

```js
holder.innerHTML =
  '<iframe ' +
  'src="https://www.youtube-nocookie.com/embed/VIDEO_ID" ' +
  'title="Diwali fireworks" ' +
  'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
  'allowfullscreen loading="lazy"></iframe>';
```

Replace `VIDEO_ID` with the ID from the video URL
(`https://www.youtube.com/watch?v=VIDEO_ID`). Using the `youtube-nocookie.com`
domain is the privacy-enhanced embed option.

> Tip: the `.video-holder` already has the `no-fireworks` class so tapping the
> video won't trigger the fireworks overlay.

## 🎨 Editing content

All the text lives in `content.js` in the `CONTENT` object, split into `little`,
`kids`, and `teen` variants. Add or edit facts there — no other file needs to
change. To add a new diya/place/cracker, add an object to the matching array.

## 🖼️ Images & credits (hybrid approach)

Places use a **hybrid** visual strategy:

- Where a real photo with a **verified, permissive license** exists, it is bundled
  locally in `images/` and shown in the card and popup, with a visible credit.
- Everywhere else, an **original hand-built SVG night scene** is used (zero
  copyright concern).

Bundled photos (downloaded locally so the site stays offline-capable):

| Place | File | Author | License | Source |
|-------|------|--------|---------|--------|
| Ayodhya — Ram Mandir | `images/ayodhya-ram-mandir.jpg` | Prime Minister's Office | [GODL-India](https://data.gov.in/sites/default/files/Gazette_Notification_OGDL.pdf) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Ram_Janmbhoomi_Mandir,_Ayodhya_Dham.jpg) |
| Amritsar — Golden Temple | `images/amritsar-golden-temple.jpg` | Bernard Gagnon | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Golden_Temple,_Amritsar_02.jpg) |
| Varanasi — Namo Ghat | `images/varanasi-namo-ghat.jpg` | Bimalsaha25 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Namo_Ghat.jpg) |
| Jaipur — Hawa Mahal | `images/jaipur-hawa-mahal.jpg` | SaibalG | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hawa_Mahal_by_Saibal_Ghosh.jpg) |

All four featured places (Ayodhya, Amritsar, Varanasi, Jaipur) now use verified,
permissively licensed photos. Any place without a verified photo falls back to an
original hand-built SVG night scene.

Attribution is shown both in the place popup and in the page footer, as required
by CC BY / CC BY-SA. **CC BY-SA 4.0 also carries a share-alike obligation**: if
you adapt this image, distribute the adaptation under the same/compatible license.

### Adding another verified photo

1. Confirm the image's license on its source page (must be public domain, CC0,
   CC BY, or CC BY-SA — verify the actual file page, not just a search result).
2. Download it into `images/`.
3. Add a `photo` object to that place in `content.js`:
   ```js
   photo: {
     src: "images/your-file.jpg",
     alt: "Descriptive alt text",
     author: "Author Name",
     authorUrl: "https://…",
     license: "CC BY 2.0",
     licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
     sourceUrl: "https://…file page…",
   }
   ```
4. Add a matching row to the footer credits in `index.html`.

The card and popup automatically show the photo when a `photo` object is present,
and fall back to the SVG scene otherwise — no other code changes needed.

## ♿ Notes

- Respects `prefers-reduced-motion` (animations calm down).
- All content is self-authored factual text; all visuals are CSS/SVG/canvas.
- No external network calls, cookies, or third-party scripts (unless you add a
  YouTube embed yourself).
