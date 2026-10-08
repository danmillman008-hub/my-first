// 99_persian — اصفهان ۱۶۱: کاشی‌کاری صفوی (ایوان + شمسه + حوض) — pure code, skill's own libs.
// Motif loops: star-tile shimmer sweep + rotating shamseh + pool ripples; action: slow push-in + a bird.
SCENES['99_persian'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp } = U, P = PAINT;
  const C = { night: '#0d1834', dusk: '#27356b', hor: '#c96f2e', turq: '#1d9a94', turqD: '#0d6b68',
    lapis: '#1f4e9c', lapisD: '#153a78', cream: '#f2e7c9', gold: '#d9a441', dark: '#081124', water: '#0c2136', sand: '#8a6a44' };

  const star8 = (g, x, y, r, rot, fill) => {
    g.save(); g.translate(x, y); g.rotate(rot); g.beginPath();
    for (let i = 0; i < 16; i++) { const rr = i % 2 ? r * 0.42 : r, a = i / 16 * TAU; i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(rr, 0); }
    g.closePath(); g.fillStyle = fill; g.fill(); g.restore();
  };
  const arch = (g, x, y, w, h) => {            // pointed (four-centred) iwan arch
    g.moveTo(x, y + h); g.lineTo(x, y + h * 0.42);
    g.quadraticCurveTo(x + w * 0.03, y + h * 0.08, x + w * 0.5, y);
    g.quadraticCurveTo(x + w * 0.97, y + h * 0.08, x + w, y + h * 0.42);
    g.lineTo(x + w, y + h); g.closePath();
  };

  // ---------- static plate ----------
  const base = () => P.cached('ps_base', W, H, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, C.night); sky.addColorStop(0.5, C.dusk); sky.addColorStop(0.8, C.hor); sky.addColorStop(1, '#33200f');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // minarets
    for (const mx of [262, 1658]) {
      g.fillStyle = C.turqD; g.fillRect(mx - 40, 210, 80, 650);
      g.fillStyle = C.turq; g.fillRect(mx - 40, 210, 80, 26); g.fillRect(mx - 40, 470, 80, 18); g.fillRect(mx - 40, 700, 80, 18);
      g.fillStyle = C.lapis; g.beginPath(); g.arc(mx, 210, 44, Math.PI, 0); g.fill();
      g.fillStyle = C.gold; g.fillRect(mx - 3, 132, 6, 40); g.beginPath(); g.arc(mx, 130, 7, 0, TAU); g.fill();
      for (let i = 0; i < 5; i++) star8(g, mx, 260 + i * 118, 22, 0, C.cream);
    }
    // facade with girih star lattice
    g.fillStyle = C.turq; g.fillRect(360, 150, 1200, 710);
    const rng = U.rng(99);
    for (let j = 0; j < 7; j++) for (let i = 0; i < 12; i++) {
      const x = 410 + i * 100 + (j % 2) * 50, y = 200 + j * 96;
      if (x < 380 || x > 1540) continue;
      star8(g, x, y, 34, 0, (i + j) % 3 === 0 ? C.lapis : (i + j) % 3 === 1 ? C.turqD : C.lapisD);
      star8(g, x + 50, y + 48, 16, TAU / 16, C.cream);
      g.fillStyle = P.rgb(P.jitter(P.hex(C.gold), rng, 30), 0.9); g.fillRect(x - 3, y - 3, 6, 6);
    }
    // iwan frame + inscription band
    g.fillStyle = C.cream; g.fillRect(470, 170, 980, 690);
    g.fillStyle = C.lapis; g.fillRect(486, 186, 948, 42);
    for (let i = 0; i < 30; i++) { g.fillStyle = i % 2 ? C.cream : C.gold; g.fillRect(496 + i * 31, 194 + (i % 3) * 4, 18, 26 - (i % 3) * 8); }   // square-Kufic dash
    g.fillStyle = C.turq; g.fillRect(486, 236, 948, 614);
    // spandrel arabesque
    for (const sx of [560, 1360]) for (let k = 0; k < 6; k++) { const a = U.rng(sx + k)() * TAU; star8(g, sx + Math.cos(a) * 60, 300 + (k % 3) * 40 + Math.sin(a) * 30, 14, a, C.gold); }
    // arch opening + muqarnas rows
    g.beginPath(); arch(g, 640, 280, 640, 570); g.fillStyle = C.dark; g.fill();
    g.save(); g.beginPath(); arch(g, 640, 280, 640, 570); g.clip();
    for (let r = 0; r < 5; r++) for (let i = 0; i <= r + 3; i++) {
      const x = 960 + (i - (r + 3) / 2) * (300 - r * 34) / ((r + 3) / 2 + 0.5), y = 300 + r * 44;
      g.fillStyle = r % 2 ? C.lapis : C.turqD; g.beginPath(); g.arc(x, y, 30 - r * 3, 0, Math.PI, true); g.fill();
    }
    g.restore();
    g.strokeStyle = C.gold; g.lineWidth = 6; g.beginPath(); arch(g, 640, 280, 640, 570); g.stroke();
    // ground + pool rim
    g.fillStyle = C.sand; g.fillRect(0, 860, W, 46);
    g.fillStyle = C.cream; g.fillRect(330, 900, 1260, 12);
  });

  const shamseh = () => P.cached('ps_sham', 420, 420, (g) => {
    g.translate(210, 210);
    for (let i = 0; i < 12; i++) { g.save(); g.rotate(i / 12 * TAU); g.fillStyle = i % 2 ? C.gold : C.cream; g.beginPath(); g.ellipse(0, -128, 26, 78, 0, 0, TAU); g.fill(); g.restore(); }
    star8(g, 0, 0, 118, 0, C.lapis); star8(g, 0, 0, 86, TAU / 16, C.turq); star8(g, 0, 0, 48, 0, C.gold);
    g.fillStyle = C.cream; g.beginPath(); g.arc(0, 0, 16, 0, TAU); g.fill();
  });

  const POOL = 912;
  return {
    draw(c, lt, t) {
      const push = 1 + 0.05 * U.ease.inOut(clamp(lt / 4.2));          // slow push-in
      c.save(); c.translate(W / 2, 560); c.scale(push, push); c.translate(-W / 2, -560);
      c.drawImage(base(), 0, 0);
      // sky stars twinkle
      const r = U.rng(7);
      for (let i = 0; i < 46; i++) { const x = r() * W, y = r() * 250, s = 1 + r() * 2, ph = r() * TAU;
        c.globalAlpha = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.8 + ph)); c.fillStyle = '#fff7dc'; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
      // rotating shamseh medallion in the arch
      c.save(); c.translate(960, 560); c.rotate(t * 0.22); c.drawImage(shamseh(), -210, -210); c.restore();
      // warm glow flicker inside arch
      const gl = c.createRadialGradient(960, 780, 40, 960, 780, 420);
      gl.addColorStop(0, `rgba(255,176,84,${0.20 + 0.06 * Math.sin(t * 7.3) + 0.04 * Math.sin(t * 13.1)})`); gl.addColorStop(1, 'rgba(255,176,84,0)');
      c.save(); c.beginPath(); arch(c, 640, 280, 640, 570); c.clip(); c.fillStyle = gl; c.fillRect(600, 240, 720, 640); c.restore();
      // tile shimmer sweep across facade
      for (let j = 0; j < 7; j++) for (let i = 0; i < 12; i++) {
        const x = 410 + i * 100 + (j % 2) * 50, y = 200 + j * 96;
        if (x < 380 || x > 1540 || (x > 600 && x < 1320 && y > 240)) continue;
        const a = 0.05 + 0.09 * (0.5 + 0.5 * Math.sin(t * 2.1 - (x + y) * 0.004));
        star8(c, x, y, 34, 0, `rgba(255,246,220,${a.toFixed(3)})`);
      }
      // a bird crosses once
      if (lt > 0.6 && lt < 3.6) {
        const p = (lt - 0.6) / 3, bx = lerp(-80, W + 80, p), by = 150 + 40 * Math.sin(p * 5), f = Math.sin(t * 11) * 14;
        c.strokeStyle = '#0a0f1e'; c.lineWidth = 6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(bx - 34, by - f); c.quadraticCurveTo(bx, by + 10, bx + 2, by); c.quadraticCurveTo(bx + 4, by + 10, bx + 38, by - f); c.stroke();
      }
      c.restore();
      // pool: reflection + travelling ripples
      c.save(); c.beginPath(); c.rect(0, POOL, W, H - POOL); c.clip();
      c.fillStyle = C.water; c.fillRect(0, POOL, W, H - POOL);
      c.translate(0, 2 * POOL); c.scale(1, -1); c.globalAlpha = 0.22; c.drawImage(base(), 0, 0);
      c.restore();
      c.save(); c.beginPath(); c.rect(0, POOL, W, H - POOL); c.clip();
      for (let k = 0; k < 7; k++) {
        const y = POOL + 14 + k * 24, off = 30 * Math.sin(t * 1.4 + k * 1.7), a = 0.16 - k * 0.018;
        c.strokeStyle = `rgba(190,235,235,${a.toFixed(3)})`; c.lineWidth = 3;
        c.beginPath(); for (let x = 340; x <= 1580; x += 24) { const yy = y + 4 * Math.sin(x * 0.02 + t * 2.2 + k); x === 340 ? c.moveTo(x + off, yy) : c.lineTo(x + off, yy); } c.stroke();
      }
      c.restore();
      c.drawImage(P.grain('ps', 0.02, [30, 25, 18], 0.28), 0, 0);
    },
  };
})();
