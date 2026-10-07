// Shared helpers for the Art Studio Netlify Functions.
// Talks to Cloudflare R2 via the S3-compatible API.
//
// Required environment variables (set in Netlify dashboard, NOT in code):
//   R2_ACCOUNT_ID        e.g. 37b97dfe6d98bb0635b4368e96aa6fa4
//   R2_ACCESS_KEY_ID     from the R2 API token you create
//   R2_SECRET_ACCESS_KEY from the R2 API token you create
//   R2_BUCKET            e.g. diwali26mol
// Optional:
//   ART_MAX_FILE_BYTES   per-file cap (default 5 MB)
//   ART_BUDGET_BYTES     global soft cap (default 4.5 GB)
//   ART_PREFIX           key prefix for submissions (default "submissions/")

const { S3Client } = require("@aws-sdk/client-s3");

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const BUCKET = process.env.R2_BUCKET;

const MAX_FILE_BYTES = parseInt(process.env.ART_MAX_FILE_BYTES || "", 10) || 5 * 1024 * 1024; // 5 MB
const BUDGET_BYTES = parseInt(process.env.ART_BUDGET_BYTES || "", 10) || Math.floor(4.5 * 1024 * 1024 * 1024); // 4.5 GB
const PREFIX = process.env.ART_PREFIX || "submissions/";

// Allowed image content types (uploads only — never anything executable).
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const EXT_BY_TYPE = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function missingEnv() {
  const missing = [];
  if (!ACCOUNT_ID) missing.push("R2_ACCOUNT_ID");
  if (!BUCKET) missing.push("R2_BUCKET");
  if (!process.env.R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!process.env.R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  return missing;
}

function makeClient() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// Standard CORS/JSON response helpers.
function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

function sanitizeName(name) {
  return String(name || "")
    .normalize("NFKD")
    .replace(/[^\w.\- ]/g, "")
    .trim()
    .slice(0, 60) || "artwork";
}

module.exports = {
  S3Client,
  makeClient,
  BUCKET,
  PREFIX,
  MAX_FILE_BYTES,
  BUDGET_BYTES,
  ALLOWED_TYPES,
  EXT_BY_TYPE,
  missingEnv,
  cors,
  json,
  sanitizeName,
};
