/*
 * sound.js
 * Synthesized firecracker sounds via the Web Audio API.
 * No audio files — everything is generated from code (zero copyright).
 *
 * window.Sound API:
 *   play(type)         -> "sparkler" | "anar" | "chakri" | "rocket" | "skyshot" | "snake"
 *   setMuted(bool), toggleMuted() -> boolean, isMuted() -> boolean
 *   resume()           -> unlock audio on first user gesture
 *
 * Mute state persists in localStorage ("diwali-muted").
 */
(function () {
  let ctx = null;
  let muted = false;

  try {
    muted = localStorage.getItem("diwali-muted") === "1";
  } catch (e) {
    muted = false;
  }

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  }

  function resume() {
    const c = getCtx();
    if (c && c.state === "suspended") c.resume();
  }

  // ---- Building blocks ----

  // White-noise buffer generator (cached)
  let noiseBuffer = null;
  function getNoise(c) {
    if (noiseBuffer) return noiseBuffer;
    const len = c.sampleRate * 2;
    noiseBuffer = c.createBuffer(1, len, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return noiseBuffer;
  }

  // A short filtered-noise "crackle" burst
  function crackle(c, t, dur, gain, filterFreq) {
    const src = c.createBufferSource();
    src.buffer = getNoise(c);
    src.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = filterFreq || 2500;
    bp.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(c.destination);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  // A low-frequency "boom" for bursts
  function boom(c, t, freq, dur, gain) {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // A rising/falling "whoosh" (filtered noise sweep) for launches
  function whoosh(c, t, dur, rising) {
    const src = c.createBufferSource();
    src.buffer = getNoise(c);
    src.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    const f0 = rising ? 400 : 1600;
    const f1 = rising ? 1800 : 300;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.15, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(c.destination);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  // ---- Per-type compositions ----
  function play(type) {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    if (c.state === "suspended") c.resume();
    const t = c.currentTime;

    switch (type) {
      case "sparkler":
        // sustained fine high crackle
        crackle(c, t, 1.6, 0.12, 5000);
        crackle(c, t + 0.05, 1.5, 0.08, 7000);
        break;
      case "anar":
        // fountain: sustained mid crackle that swells
        crackle(c, t, 1.8, 0.18, 3000);
        crackle(c, t + 0.1, 1.7, 0.12, 4500);
        break;
      case "chakri":
        // spinning: oscillating whoosh loop feel
        whoosh(c, t, 0.5, true);
        whoosh(c, t + 0.45, 0.5, false);
        whoosh(c, t + 0.9, 0.5, true);
        crackle(c, t, 1.4, 0.06, 3500);
        break;
      case "rocket":
        // whoosh up, then a bang + crackle
        whoosh(c, t, 0.7, true);
        boom(c, t + 0.72, 180, 0.5, 0.35);
        crackle(c, t + 0.74, 0.8, 0.15, 3000);
        break;
      case "skyshot":
        // multiple bangs with big crackle
        boom(c, t + 0.0, 160, 0.6, 0.4);
        boom(c, t + 0.25, 200, 0.5, 0.3);
        boom(c, t + 0.5, 140, 0.7, 0.35);
        crackle(c, t + 0.05, 1.2, 0.18, 2600);
        break;
      case "snake":
        // gentle low fizz, no bang
        crackle(c, t, 1.6, 0.06, 1200);
        break;
      case "sutlibam":
        // one big loud bang, minimal crackle
        boom(c, t + 0.33, 110, 0.8, 0.6);
        crackle(c, t + 0.33, 0.3, 0.2, 1800);
        break;
      case "ladi": {
        // rapid chain of small pops marching along
        for (let i = 0; i < 18; i++) {
          crackle(c, t + i * 0.09, 0.1, 0.14, 3200);
        }
        break;
      }
      case "sevenshots":
        // seven aerial bangs in sequence
        for (let i = 0; i < 7; i++) {
          boom(c, t + i * 0.33, 150 + (i % 3) * 30, 0.4, 0.3);
          crackle(c, t + i * 0.33 + 0.02, 0.4, 0.1, 2800);
        }
        break;
      default:
        crackle(c, t, 0.8, 0.1, 3000);
    }
  }

  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem("diwali-muted", muted ? "1" : "0"); } catch (e) {}
    return muted;
  }
  function toggleMuted() { return setMuted(!muted); }
  function isMuted() { return muted; }

  window.Sound = { play, setMuted, toggleMuted, isMuted, resume };
})();
