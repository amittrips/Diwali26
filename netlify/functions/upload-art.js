// POST /api/upload-art
// Body (JSON): { filename, contentType, size, author? }
// Validates type + per-file size, enforces the global budget via a ListObjects
// sum, then returns a short-lived presigned PUT URL for the browser to upload
// directly to R2. The browser never receives R2 credentials.
//
// This function only ever performs ListObjectsV2 (read) and generates a
// PutObject presigned URL — it never deletes anything.

const { PutObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
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
} = require("./_r2");

// Sum the size of all objects under PREFIX (handles pagination).
async function currentUsageBytes(client) {
  let total = 0;
  let token = undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: PREFIX,
        ContinuationToken: token,
      })
    );
    (res.Contents || []).forEach((o) => (total += o.Size || 0));
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return total;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(), body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const missing = missingEnv();
  if (missing.length) {
    return json(500, { error: "Server not configured. Missing: " + missing.join(", ") });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (_) {
    return json(400, { error: "Invalid JSON body" });
  }

  const { filename, contentType, size, author } = payload;

  // --- Validate content type ---
  if (!ALLOWED_TYPES.has(contentType)) {
    return json(400, {
      error: "Unsupported file type. Allowed: PNG, JPEG, WebP.",
    });
  }

  // --- Validate per-file size ---
  const declaredSize = Number(size);
  if (!Number.isFinite(declaredSize) || declaredSize <= 0) {
    return json(400, { error: "Missing or invalid file size." });
  }
  if (declaredSize > MAX_FILE_BYTES) {
    return json(413, {
      error: `File too large. Max ${(MAX_FILE_BYTES / (1024 * 1024)).toFixed(1)} MB.`,
    });
  }

  const client = makeClient();

  // --- Global budget guard ---
  try {
    const used = await currentUsageBytes(client);
    if (used + declaredSize > BUDGET_BYTES) {
      return json(507, {
        error:
          "Storage budget reached. Uploads are temporarily closed. Please tell the organiser.",
        usedBytes: used,
        budgetBytes: BUDGET_BYTES,
      });
    }
  } catch (err) {
    return json(502, { error: "Could not verify storage budget: " + err.name });
  }

  // --- Build a safe, unique object key ---
  const ext = EXT_BY_TYPE[contentType] || "png";
  const safeBase = sanitizeName(filename ? filename.replace(/\.[^.]+$/, "") : "artwork");
  const safeAuthor = sanitizeName(author || "anon").replace(/\s+/g, "-");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `${PREFIX}${safeAuthor}/${stamp}-${rand}-${safeBase}.${ext}`;

  // --- Presigned PUT URL (one-time, expires quickly) ---
  try {
    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: declaredSize,
      Metadata: {
        author: safeAuthor,
        title: safeBase,
      },
    });
    const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: 300 }); // 5 min

    return json(200, {
      uploadUrl,
      key,
      maxBytes: MAX_FILE_BYTES,
      requiredHeaders: { "Content-Type": contentType },
    });
  } catch (err) {
    return json(502, { error: "Could not create upload URL: " + err.name });
  }
};
