/*
 * cracker-anim.js
 * Self-contained per-type firecracker animations drawn on a canvas.
 * No external assets. Each animation plays for a few seconds then settles.
 *
 * window.CrackerAnim.play(canvas, type)
 *   type: "sparkler" | "anar" | "chakri" | "rocket" | "skyshot" | "snake"
 * Returns a stop() function to cancel the animation (e.g., on popup close).
 */
(function () {
  const COLORS = ["#ff5252", "#ffab40", "#ffd740", "#69f0ae", "#40c4ff", "#e040fb", "#ff4081"];
  function rand(a, b) { return Math.random() * (b - a) + a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function play(canvas, type) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Size the canvas to its displayed box
    const rect = canvas.getBoundingClientRect();
    const W = rect.width || 320;
    const H = rect.height || 260;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let particles = [];
    let frame = 0;
    let raf = null;
    let running = true;
    let angleAccum = 0;
    let flash = 0; // white-flash overlay (used by sutli bam)

    function spark(x, y, vx, vy, color, life, size, gravity) {
      particles.push({ x, y, vx, vy, color, life, maxLife: life, size, gravity: gravity == null ? 0.05 : gravity });
    }

    function step() {
      if (!running) return;
      frame++;
      // fade background for trails
      ctx.fillStyle = "rgba(10,4,24,0.28)";
      ctx.fillRect(0, 0, W, H);

      emit();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.99; p.vy *= 0.99; p.vy += p.gravity;
        p.life--;
        const a = Math.max(p.life / p.maxLife, 0);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // draw type-specific solid elements over particles
      drawProps();

      // white flash overlay (sutli bam bang), decays quickly
      if (flash > 0.01) {
        ctx.globalAlpha = flash;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        flash *= 0.78;
      }

      raf = requestAnimationFrame(step);
    }

    // ---- per-type emitters ----
    function emit() {
      switch (type) {
        case "sparkler": {
          // handheld: sparks fly from a point near center
          const cx = W * 0.5, cy = H * 0.42;
          if (frame < 150) {
            for (let k = 0; k < 8; k++) {
              const ang = rand(0, Math.PI * 2);
              const sp = rand(1, 4.5);
              spark(cx, cy, Math.cos(ang) * sp, Math.sin(ang) * sp, pick(["#fff6c8", "#ffd740", "#ffab40"]), rand(15, 30), rand(1, 2.2), 0.06);
            }
          }
          break;
        }
        case "anar": {
          // ground fountain: upward cone of sparks from bottom center
          const cx = W * 0.5, cy = H * 0.9;
          if (frame < 150) {
            for (let k = 0; k < 10; k++) {
              const ang = -Math.PI / 2 + rand(-0.35, 0.35);
              const sp = rand(4, 9);
              spark(cx, cy, Math.cos(ang) * sp, Math.sin(ang) * sp, pick(["#ffd740", "#ffab40", "#fff6c8", "#ff8f3f"]), rand(30, 55), rand(1.4, 2.6), 0.12);
            }
          }
          break;
        }
        case "chakri": {
          // spinner: sparks fly tangentially from a rotating point
          const cx = W * 0.5, cy = H * 0.55, r = Math.min(W, H) * 0.18;
          if (frame < 170) {
            angleAccum += 0.5;
            for (let k = 0; k < 3; k++) {
              const a = angleAccum + k * 2.1;
              const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
              // tangential velocity
              const tx = -Math.sin(a), ty = Math.cos(a);
              const sp = rand(2, 4);
              spark(px, py, tx * sp, ty * sp, pick(COLORS), rand(20, 35), rand(1.2, 2.2), 0.03);
            }
          }
          break;
        }
        case "rocket": {
          // rises, then bursts once
          if (frame === 1) {
            rocket = { x: W * 0.5, y: H * 0.95, vy: -rand(5.5, 6.5), color: pick(COLORS), burst: false };
          }
          if (rocket && !rocket.burst) {
            rocket.y += rocket.vy;
            rocket.vy += 0.03;
            // trail
            spark(rocket.x + rand(-2, 2), rocket.y, rand(-0.3, 0.3), rand(0.5, 1.5), "#ffd27a", rand(10, 18), rand(1, 1.8), 0.02);
            if (rocket.vy >= -1 || rocket.y <= H * 0.3) {
              burstAt(rocket.x, rocket.y, rocket.color, 70);
              rocket.burst = true;
            }
          }
          break;
        }
        case "skyshot": {
          // several bursts at intervals
          if (frame === 1 || frame === 30 || frame === 60) {
            burstAt(rand(W * 0.25, W * 0.75), rand(H * 0.2, H * 0.45), pick(COLORS), 90);
          }
          break;
        }
        case "snake": {
          // no flame: grow an ash coil (drawn in drawProps); a little smoke
          if (frame < 200 && frame % 3 === 0) {
            const p = snakePathPoint(frame / 200);
            spark(p.x + rand(-2, 2), p.y - 4, rand(-0.2, 0.2), rand(-0.4, -0.1), "rgba(120,120,120,0.5)", rand(20, 40), rand(1, 2), -0.01);
          }
          break;
        }
        case "sutlibam": {
          // loud bang: a single bright flash of white sparks + smoke, little color
          if (frame === 20) {
            const cx = W * 0.5, cy = H * 0.6;
            flash = 1; // triggers white flash overlay in drawProps
            for (let i = 0; i < 50; i++) {
              const ang = rand(0, Math.PI * 2);
              const sp = rand(2, 7);
              spark(cx, cy, Math.cos(ang) * sp, Math.sin(ang) * sp, i % 6 === 0 ? "#ffab40" : "#fffbe6", rand(15, 30), rand(1.5, 3), 0.08);
            }
            for (let i = 0; i < 25; i++) {
              const ang = rand(0, Math.PI * 2);
              spark(cx, cy, Math.cos(ang) * rand(0.5, 2), Math.sin(ang) * rand(0.5, 2), "rgba(130,130,130,0.5)", rand(40, 70), rand(2, 4), -0.01);
            }
          }
          break;
        }
        case "ladi": {
          // string of crackers: rapid small pops marching across the bottom
          if (frame < 150 && frame % 4 === 0) {
            const prog = frame / 150;
            const x = 30 + (W - 60) * prog;
            const y = H * 0.82;
            for (let i = 0; i < 10; i++) {
              const ang = rand(-Math.PI, 0);
              const sp = rand(1.5, 4);
              spark(x + rand(-4, 4), y, Math.cos(ang) * sp, Math.sin(ang) * sp, pick(["#fffbe6", "#ffd740", "#ffab40"]), rand(10, 20), rand(1, 2), 0.1);
            }
          }
          break;
        }
        case "sevenshots": {
          // seven aerial bursts, one every ~20 frames
          if (frame > 0 && frame <= 140 && frame % 20 === 0) {
            burstAt(rand(W * 0.2, W * 0.8), rand(H * 0.18, H * 0.5), pick(COLORS), 55);
          }
          break;
        }
      }
    }

    function burstAt(x, y, color, n) {
      for (let i = 0; i < n; i++) {
        const ang = rand(0, Math.PI * 2);
        const sp = rand(1.5, 6);
        spark(x, y, Math.cos(ang) * sp, Math.sin(ang) * sp, i % 5 === 0 ? pick(COLORS) : color, rand(30, 60), rand(1.5, 3), 0.05);
      }
    }

    // rocket state
    let rocket = null;

    // snake ash coil path (a growing spiral)
    function snakePathPoint(tt) {
      const cx = W * 0.5, cy = H * 0.7;
      const a = tt * Math.PI * 6;
      const r = tt * Math.min(W, H) * 0.28;
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.5 };
    }

    function drawProps() {
      if (type === "sparkler") {
        // draw the stick + glowing tip
        const cx = W * 0.5, cy = H * 0.42;
        ctx.strokeStyle = "#caa";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, H * 0.9);
        ctx.stroke();
        if (frame < 150) {
          ctx.fillStyle = "#fff6c8";
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(cx, cy, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else if (type === "anar") {
        // draw the cone
        const cx = W * 0.5, by = H * 0.92;
        ctx.fillStyle = "#7a3b1a";
        ctx.beginPath();
        ctx.moveTo(cx - 22, by);
        ctx.lineTo(cx + 22, by);
        ctx.lineTo(cx + 10, by - 26);
        ctx.lineTo(cx - 10, by - 26);
        ctx.closePath();
        ctx.fill();
      } else if (type === "chakri") {
        const cx = W * 0.5, cy = H * 0.55, r = Math.min(W, H) * 0.18;
        ctx.strokeStyle = "rgba(255,215,64,0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (type === "snake") {
        // draw the growing ash coil as a thick dark line
        const cx = W * 0.5, by = H * 0.82;
        // base tablet
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(cx, by, 6, 0, Math.PI * 2);
        ctx.fill();
        const tt = Math.min(frame / 200, 1);
        ctx.strokeStyle = "#3a3a3a";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        const steps = Math.floor(tt * 120);
        for (let i = 0; i <= steps; i++) {
          const p = snakePathPoint(i / 120);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        // glowing tip while growing
        if (tt < 1) {
          const tip = snakePathPoint(tt);
          ctx.fillStyle = "#ff6a3f";
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    // initial clear
    ctx.fillStyle = "#0a0418";
    ctx.fillRect(0, 0, W, H);
    step();

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    }
    return stop;
  }

  window.CrackerAnim = { play };
})();
