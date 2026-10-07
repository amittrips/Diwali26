/*
 * counter.js
 * Simple, self-contained visitor counter for a static site (Netlify-friendly).
 *
 * Approach (Option A): calls a free hosted counter API. No backend needed.
 * - Increments once per browser session (sessionStorage guard) so reloads
 *   don't inflate the count.
 * - FAILS SILENTLY: if the service is unreachable, nothing is shown and the
 *   rest of the site is unaffected.
 * - Isolated here so you can later swap to a Netlify Function (Option B) by
 *   changing only hitEndpoint()/readEndpoint().
 *
 * To change the counter's identity, edit NAMESPACE and KEY below.
 */
(function () {
  "use strict";

  // ---- Config: counterapi.dev v2 ----
  // Workspace slug from your counterapi.dev account, and a counter name.
  // Public counters are readable/incrementable without an API key.
  var WORKSPACE = "amits-team-1-5811"; // your counterapi.dev workspace slug
  var KEY = "first-counter-5811";       // your counter's API slug
  var BASE = "https://api.counterapi.dev/v2/" + WORKSPACE + "/" + KEY;
  var HIT_URL = BASE + "/up";           // increment + return
  var GET_URL = BASE;                   // read only

  var SESSION_FLAG = "diwali-counted"; // sessionStorage key

  function alreadyCountedThisSession() {
    try { return sessionStorage.getItem(SESSION_FLAG) === "1"; }
    catch (e) { return false; }
  }
  function markCountedThisSession() {
    try { sessionStorage.setItem(SESSION_FLAG, "1"); } catch (e) {}
  }

  // Extract the numeric count from the API response (tolerant of shape changes)
  function extractCount(data) {
    if (data == null) return null;
    // counterapi v2: { code, data: { up_count, down_count, ... } }
    if (data.data && typeof data.data.up_count === "number") return data.data.up_count;
    if (typeof data.up_count === "number") return data.up_count;
    if (typeof data.count === "number") return data.count;
    if (data.data && typeof data.data.count === "number") return data.data.count;
    if (typeof data.value === "number") return data.value;
    return null;
  }

  function display(count) {
    if (count == null) return;
    var el = document.getElementById("visitor-count");
    if (!el) return;
    try {
      el.textContent = Number(count).toLocaleString();
    } catch (e) {
      el.textContent = String(count);
    }
    var wrap = document.getElementById("visitor-counter");
    if (wrap) wrap.hidden = false;
  }

  function fetchJson(url) {
    // Guard: fetch may be unavailable in very old browsers
    if (typeof fetch !== "function") return Promise.reject(new Error("no fetch"));
    return fetch(url, { method: "GET", mode: "cors", cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("bad status " + r.status);
        return r.json();
      });
  }

  function init() {
    // If we've counted this session already, just read (don't increment).
    var url = alreadyCountedThisSession() ? GET_URL : HIT_URL;
    fetchJson(url)
      .then(function (data) {
        markCountedThisSession();
        display(extractCount(data));
      })
      .catch(function () {
        // Fail silently — counter is a nice-to-have, never breaks the site.
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // expose for manual re-read if ever needed
  window.VisitorCounter = {
    refresh: function () { fetchJson(GET_URL).then(function (d) { display(extractCount(d)); }).catch(function () {}); },
  };
})();
