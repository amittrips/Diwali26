// GET /api/get-art?key=submissions/....
// Returns a short-lived presigned GET URL for a single object so the gallery
// can display a private-bucket image without exposing credentials. Only
// generates a GetObject presigned URL — never deletes.

const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { makeClient, BUCKET, PREFIX, missingEnv, cors, json } = require("./_r2");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(), body: "" };
  }
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const missing = missingEnv();
  if (missing.length) {
    return json(500, { error: "Server not configured. Missing: " + missing.join(", ") });
  }

  const key = event.queryStringParameters?.key;
  if (!key) {
    return json(400, { error: "Missing 'key' parameter." });
  }

  // Safety: only allow keys inside our submissions prefix (prevents reading
  // arbitrary objects by crafting a key).
  if (!key.startsWith(PREFIX) || key.includes("..")) {
    return json(403, { error: "Forbidden key." });
  }

  const client = makeClient();
  try {
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: 3600 } // 1 hour
    );
    return json(200, { url });
  } catch (err) {
    return json(502, { error: "Could not create view URL: " + err.name });
  }
};
