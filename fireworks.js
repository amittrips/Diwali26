/*
 * fireworks.js
 * A lightweight, self-contained canvas fireworks engine.
 * No external assets. Tap/click anywhere to launch a rocket that bursts.
 *
 * Exposes window.Fireworks with:
 *   - start(): begin the animation loop
 *   - launchAt(x, y): launch a firework that bursts near (x, y)
 *   - burst(x, y, color): immediate burst at a point
 *   - setEnabled(bool): pause/resume tap-to-launch
 */
(function () {
  const canvas = document.getElementById("fireworks-canvas");
  const ctx = canvas.getContext("2d");

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  const rockets = [];
  const particles = [];
  let running = false;
  let enabled = true;

  const COLORS = [
    "#ff5252", "#ffab40", "#ffd740", "#69f0ae",
    "#40c4ff", "#e040fb", "#ff4081", "#b2ff59",
  ];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pickColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  function Rocket(targetX, targetY) {
    this.x = targetX + rand(-40, 40);
    this.y = height;
    this.targetY = targetY;
    this.vx = rand(-0.6, 0.6);
    this.vy = -rand(9, 13);
    this.color = pickColor();
    this.trail = [];
  }

  Rocket.prototype.update = function () {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.18; // gravity slows ascent
    // burst when it slows near apex or reaches target
    return this.vy >= -2 || this.y <= this.targetY;
  };

  Rocket.prototype.draw = function () {
    ctx.lineWidth = 3;
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
  };

  function Particle(x, y, color) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(1.5, 7);
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.life = 1; // 1 -> 0
    this.decay = rand(0.008, 0.02);
    this.size = rand(1.5, 3.5);
  }

  Particle.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.985;
    this.vy *= 0.985;
    this.vy += 0.05; // gravity
    this.life -= this.decay;
    return this.life <= 0;
  };

  Particle.prototype.draw = function () {
    ctx.globalAlpha = Math.max(this.life, 0);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  function burst(x, y, color) {
    const c = color || pickColor();
    const count = 60 + Math.floor(rand(0, 40));
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y, c));
    }
    // a few sparkles in a second color
    const c2 = pickColor();
    for (let i = 0; i < 20; i++) {
      particles.push(new Particle(x, y, c2));
    }
  }

  function launchAt(x, y) {
    const targetY = y != null ? y : rand(height * 0.15, height * 0.45);
    const targetX = x != null ? x : rand(width * 0.2, width * 0.8);
    rockets.push(new Rocket(targetX, targetY));
  }

  function loop() {
    if (!running) return;
    // translucent fill creates the fading trail effect
    ctx.fillStyle = "rgba(10, 4, 24, 0.25)";
    ctx.fillRect(0, 0, width, height);

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      const exploded = r.update();
      r.draw();
      if (exploded) {
        burst(r.x, r.y, r.color);
        rockets.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const dead = p.update();
      p.draw();
      if (dead) particles.splice(i, 1);
    }

    requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    resize();
    running = true;
    requestAnimationFrame(loop);
  }

  function setEnabled(v) {
    enabled = !!v;
  }

  // Tap / click to launch (ignore taps on buttons, inputs, links)
  function onPointer(e) {
    if (!enabled) return;
    const target = e.target;
    if (target.closest && target.closest("button, a, input, label, .no-fireworks")) {
      return;
    }
    const point = e.touches && e.touches[0] ? e.touches[0] : e;
    launchAt(point.clientX, point.clientY);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointerdown", onPointer, { passive: true });

  window.Fireworks = { start, launchAt, burst, setEnabled };
})();
