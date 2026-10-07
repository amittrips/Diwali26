// GET /api/list-art?limit=60
// Returns metadata for gallery items (key, size, lastModified), newest first.
// Does NOT return the images themselves — the gallery requests presigned GET
// URLs per item via /api/get-art. Only performs ListObjectsV2 (read).

const { ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { makeClient, BUCKET, PREFIX, BUDGET_BYTES, missingEnv, cors, json } = require("./_r2");

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

  const limit = Math.min(parseInt(event.queryStringParameters?.limit || "60", 10) || 60, 200);
  const client = makeClient();

  try {
    const items = [];
    let totalBytes = 0;
    let token = undefined;
    do {
      const res = await client.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: PREFIX,
          ContinuationToken: token,
        })
      );
      (res.Contents || []).forEach((o) => {
        totalBytes += o.Size || 0;
        // Skip "folder" placeholder keys
        if (o.Key && !o.Key.endsWith("/")) {
          items.push({
            key: o.Key,
            size: o.Size || 0,
            lastModified: o.LastModified,
            // derive author + title from the key structure submissions/<author>/<stamp>-<rand>-<title>.<ext>
            author: o.Key.split("/")[1] || "anon",
          });
        }
      });
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);

    // newest first
    items.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    return json(200, {
      items: items.slice(0, limit),
      count: items.length,
      usedBytes: totalBytes,
      budgetBytes: BUDGET_BYTES,
    });
  } catch (err) {
    return json(502, { error: "Could not list gallery: " + err.name });
  }
};
