// GET /api/list-memories?year=2025
//
// Lists IMAGE files from a public Google Drive folder (the Diwali "memories"
// album) so the TV slideshow can display them. Images only — any video or
// non-image MIME type is filtered out server-side, so videos never reach the
// slideshow.
//
// Why a function (not client-side)? A static page cannot list a Drive folder's
// contents without the Drive API, and the API key must not sit in the browser.
// This mirrors the existing list-art/get-art pattern: credentials live only in
// Netlify environment variables and are read via process.env here.
//
// Required environment variable (set in Netlify dashboard, NOT in code):
//   GOOGLE_API_KEY   a Google API key with the "Google Drive API" enabled.
//                    The target folder must be shared "Anyone with the link".
//
// Optional environment variables (fall back to the known 2025 album folder):
//   DRIVE_FOLDER_2025   folder ID for the 2025 photo album
//   DRIVE_FOLDER_2024   folder ID for the 2024 album (videos — not used here)

const https = require("https");

// Known public folders from content.js (memories). 2025 = portrait photos.
const FOLDERS = {
  2025: process.env.DRIVE_FOLDER_2025 || "1v83v36u6cqFN9p8eE2o-yIvqZnimTqEd",
  2024: process.env.DRIVE_FOLDER_2024 || "1--CZLz5lvgSI9ByG13zxVc6nsB6wKxCa",
};

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...cors() },
    body: JSON.stringify(body),
  };
}

// Minimal GET-JSON helper (avoids pulling in a dependency).
function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data || "{}") });
          } catch (e) {
            reject(new Error("Bad JSON from Drive API"));
          }
        });
      })
      .on("error", reject);
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(), body: "" };
  }
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return json(500, {
      error:
        "Server not configured. Set GOOGLE_API_KEY (a key with the Google Drive API enabled) in Netlify environment variables.",
    });
  }

  const year = (event.queryStringParameters?.year || "2025").trim();
  const folderId = FOLDERS[year];
  if (!folderId) {
    return json(400, { error: "Unknown year. Available: " + Object.keys(FOLDERS).join(", ") });
  }

  // Only images; exclude trashed items. The mimeType filter guarantees no
  // videos (e.g. video/mp4) are ever returned to the slideshow.
  const q = encodeURIComponent(
    `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`
  );
  const fields = encodeURIComponent("nextPageToken, files(id, name, mimeType, imageMediaMetadata(width,height))");

  try {
    const items = [];
    let pageToken = undefined;
    do {
      const url =
        `https://www.googleapis.com/drive/v3/files?q=${q}` +
        `&key=${apiKey}` +
        `&fields=${fields}` +
        `&pageSize=1000` +
        `&supportsAllDrives=true&includeItemsFromAllDrives=true` +
        (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");

      const res = await getJson(url);
      if (res.status !== 200) {
        const msg = res.body?.error?.message || "Drive API error " + res.status;
        return json(502, { error: msg });
      }

      (res.body.files || []).forEach((f) => {
        // Defensive double-check: never emit a non-image.
        if (!f.mimeType || !f.mimeType.startsWith("image/")) return;
        items.push({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          width: f.imageMediaMetadata?.width || null,
          height: f.imageMediaMetadata?.height || null,
          // Directly-embeddable image URL. The drive.google.com/thumbnail
          // endpoint only 302-redirects to this host and carries
          // X-Frame-Options, so bare <img> loads from our origin fail; the
          // resolved lh3 URL returns image/jpeg with 200 and embeds fine.
          // `=w1920` caps the longest edge (originals are up to 8192px).
          url: `https://lh3.googleusercontent.com/d/${f.id}=w1920`,
        });
      });

      pageToken = res.body.nextPageToken;
    } while (pageToken);

    return json(200, { year, folderId, count: items.length, items });
  } catch (err) {
    return json(502, { error: "Could not list Drive folder: " + (err.message || err.name) });
  }
};
