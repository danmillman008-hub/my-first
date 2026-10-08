// 96_neon_rain — «شبِ نئون»: بازسازی یک سکانس سینمایی فوق‌رئال
// محیط: است‌های فتورئال تولیدی (هوش مصنوعی) + کامپوزیت کدی (باران دولایه، مه، ماشین پرنده،
// سوسوی نئون، انعکاس آب کف خیابان، لترباکس/گرین/وینیت).
// کاراکتر: ریگ اسکلتی رویه‌ای تمام‌کدی — پاهای دو-مفصلی با IK و فازِ کف‌پا روی زمین،
// گام‌های کوتاهِ احتیاطی زیر باران، تابِ مخالف دست‌ها، بوب عمودی، دنبالهٔ لبهٔ بارانی،
// چتر با چکه، سیلوئتِ شب با ریملایت نئون + انعکاس خیس. دوربین: تراکینگ‌شات واقعی
// (دنیای پشت سر با mirror-wrap جریان دارد) و کات به نمای نزدیکِ ایستاده.
SCENES['96_neon_rain'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp } = U, P = PAINT;

  // ---------------- حرکت جهانی قهرمان + دوربین ----------------
  const VMAX = 225, T1 = 7.8, T2 = 8.9, DEC = T2 - T1;
  const speedAt = (t) => t < T1 ? VMAX : t < T2 ? VMAX * (1 - (t - T1) / DEC) : 0;
  const heroX = (t) => {
    if (t <= T1) return 700 + VMAX * t;
    const d1 = VMAX * T1;
    if (t <= T2) { const q = t - T1; return 700 + d1 + VMAX * q - (VMAX / (2 * DEC)) * q * q; }
    return 700 + d1 + VMAX * DEC / 2;
  };
  const EX = heroX(99); // جای ایستادن بعد از ترمز
  const camAt = (t) => {
    if (t < 9) {
      const q = U.ease.inOut(clamp(t / 9));
      return {
        x: heroX(t) + 150 + Math.sin(t * 1.55) * 3 + Math.sin(t * 2.7 + 1) * 2,
        y: 575 + Math.sin(t * 0.9) * 5, z: lerp(1.05, 1.14, q), rot: 0, beat: 0, lt: t, v: speedAt(t),
      };
    }
    const lt = t - 9, q = U.ease.inOut(clamp(lt / 1.2));
    return { x: lerp(EX + 150, EX + 215, q), y: lerp(585, 618, q), z: lerp(1.14, 1.42, q), rot: -0.012, beat: 1, lt, v: 0 };
  };
  const layer = (c, cam, p, fn) => {
    c.save(); c.translate(W / 2, H / 2); c.scale(cam.z * (1 + (p - 1) * 0.35), cam.z * (1 + (p - 1) * 0.35)); c.rotate(cam.rot);
    c.translate(-(cam.x * p + 960 * (1 - p)), -(cam.y * p + 540 * (1 - p)));
    fn(); c.restore();
  };
  const cover = (im) => Math.max(W / im.width, H / im.height) * 1.12;
  // کاشی افقی یک است در فضای لایه (آینه‌ای برای عکس، تکراری برای png شفاف)
  const wrapImg = (c, cam, p, img, dx, dy, dw, dh, mirror) => {
    const z = cam.z * (1 + (p - 1) * 0.35);
    const off = cam.x * p + 960 * (1 - p);
    const half = (W / 2) / z + 90;
    const period = mirror ? dw * 2 : dw;
    const v0 = off - half - dx, v1 = off + half - dx;
    for (let x = Math.floor(v0 / period) * period; x < v1; x += period) {
      if (mirror) {
        c.drawImage(img, dx + x, dy, dw, dh);
        c.save(); c.translate(dx + x + dw * 2, dy); c.scale(-1, 1); c.drawImage(img, 0, 0, dw, dh); c.restore();
      } else c.drawImage(img, dx + x, dy, dw, dh);
    }
  };

  // ---------------- باران / مه / ماشین‌ها ----------------
  function rain(c, cam, t, n, spd, len, alpha, seed) {
    c.save(); c.lineCap = 'round'; c.strokeStyle = `rgba(190,220,255,${alpha})`;
    for (let i = 0; i < n; i++) {
      const h1 = U.hash(i, seed), h2 = U.hash(i, seed + 1);
      const vx = 260 + h1 * 240, x = ((h2 * 2400 + t * vx * 0.35) % 2400) - 240, y = ((h1 * 1400 + t * (700 + h2 * 500) * spd) % 1400) - 160;
      c.lineWidth = 1.4 + h1 * 1.4;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - len * 0.22, y + len); c.stroke();
    }
    c.restore();
  }
  function splashes(c, t) {
    c.save(); c.strokeStyle = 'rgba(200,230,255,.4)'; c.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const h = U.hash(i, 77), q = (t * 2.2 + h * 3) % 1, x = h * 2200 - 140, y = 900 + U.hash(i, 5) * 160;
      if (q < 0.5) { c.globalAlpha = (1 - q * 2) * 0.5; c.beginPath(); c.ellipse(x, y, 4 + q * 26, (4 + q * 26) * 0.28, 0, 0, TAU); c.stroke(); }
    }
    c.restore();
  }
  function fog(c, cam, t, img, y, scale, alpha, speed, seed) {
    c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = alpha;
    const w = img.width * scale, hh = img.height * scale;
    const off = (t * speed) % w;
    for (let x = -w - off; x < W + w; x += w * 0.72) c.drawImage(img, x, y + Math.sin(t * 0.3 + seed + x * 0.001) * 14, w, hh);
    c.restore();
  }
  function cars(c, t) {
    const lane = (i, y, spd, dir, colA, colB) => {
      const q = ((t * spd + i * 0.37) % 1.4) - 0.2, x = dir > 0 ? q * 2600 - 300 : 2200 - q * 2600;
      const g = c.createLinearGradient(x - dir * 220, y, x, y);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, colA);
      c.strokeStyle = g; c.lineWidth = 5; c.beginPath(); c.moveTo(x - dir * 220, y); c.lineTo(x, y); c.stroke();
      c.fillStyle = colB; c.beginPath(); c.ellipse(x, y, 9, 4, 0, 0, TAU); c.fill();
    };
    lane(0, 300, 0.16, 1, 'rgba(255,190,120,.7)', '#ffe9c8');
    lane(1, 342, 0.11, -1, 'rgba(255,90,90,.6)', '#ffd0c8');
    lane(2, 262, 0.2, 1, 'rgba(120,220,255,.55)', '#e8fbff');
    const sx = ((t * 0.07) % 1.3) * 2600 - 300, sy = 210 + Math.sin(t * 0.8) * 8;
    c.save(); c.globalAlpha = 0.9;
    c.fillStyle = '#1a222c'; c.beginPath(); c.ellipse(sx, sy, 34, 10, 0, 0, TAU); c.fill();
    c.fillStyle = Math.floor(t * 3) % 2 ? '#ff5040' : '#701818'; c.beginPath(); c.arc(sx - 30, sy, 3.4, 0, TAU); c.fill();
    c.fillStyle = '#bff4ff'; c.beginPath(); c.arc(sx + 30, sy, 3.4, 0, TAU); c.fill();
    const cone = c.createLinearGradient(sx, sy, sx + 140, sy + 320);
    cone.addColorStop(0, 'rgba(180,240,255,.28)'); cone.addColorStop(1, 'rgba(180,240,255,0)');
    c.fillStyle = cone; c.save(); c.translate(sx, sy); c.rotate(0.9 + Math.sin(t * 0.5) * 0.25); c.beginPath(); c.moveTo(0, 0); c.lineTo(300, -46); c.lineTo(300, 46); c.closePath(); c.fill(); c.restore();
    c.restore();
  }

  // ---------------- ریگ اسکلتی انسان (رویه‌ای) ----------------
  // مختصات محلی: کف زمین y=0، بالا منفی، رو به +x. قد کل ≈ 700.
  const RIG = { hipY: 372, shY: 556, headC: 620, headR: 40, th: 186, sh: 180, ank: 12, footL: 64, ua: 120, fa: 112, T: 1.3 };
  function legPose(p, L, S, liftMax, standX) {
    let fx, lift, ang;
    if (p < 0.5) { const u = p / 0.5, su = u * u * (3 - 2 * u); fx = L * (0.5 - u); lift = 0; ang = lerp(-0.2, 0.34, su); }
    else { const u = (p - 0.5) / 0.5; fx = L * (u - 0.5); lift = Math.sin(Math.PI * u) * liftMax; ang = lerp(0.28, -0.1, u); }
    fx = lerp(fx, standX, S); lift *= (1 - S); ang = lerp(ang, 0.02, S);
    return { fx, lift, ang };
  }
  function ikLeg(g, hipy, lp, col, w1, w2) {
    const dx0 = lp.fx, dy0 = (RIG.hipY - RIG.ank) - lp.lift;
    let dx = dx0, dy = dy0, d = Math.hypot(dx, dy);
    const m = RIG.th + RIG.sh - 1; if (d > m) { dx *= m / d; dy *= m / d; d = m; }
    const a = Math.atan2(dy, dx);
    const ac = Math.acos(clamp((RIG.th * RIG.th + d * d - RIG.sh * RIG.sh) / (2 * RIG.th * d), -1, 1));
    const ka = a - ac; // زانو به جلو
    const kx = RIG.th * Math.cos(ka), ky = hipy + RIG.th * Math.sin(ka);
    const ax = dx, ay = hipy + dy;
    g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
    g.lineWidth = w1; g.beginPath(); g.moveTo(0, hipy); g.lineTo(kx, ky); g.stroke();
    g.lineWidth = w2; g.beginPath(); g.moveTo(kx, ky); g.lineTo(ax, ay); g.stroke();
    g.save(); g.translate(ax, ay + 2); g.rotate(lp.ang);
    g.beginPath();
    if (g.roundRect) g.roundRect(-18, -8, 80, 15, 7); else g.rect(-18, -8, 80, 15);
    g.fillStyle = col; g.fill(); g.restore();
    return { ax, ay };
  }
  function swingArm(g, shY, a1, bend, col, w) {
    const ex = 6 + Math.sin(a1) * RIG.ua, ey = shY + Math.cos(a1) * RIG.ua;
    const a2 = a1 + bend;
    const hx = ex + Math.sin(a2) * RIG.fa, hy = ey + Math.cos(a2) * RIG.fa;
    g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = w;
    g.beginPath(); g.moveTo(6, shY); g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke();
    return { hx, hy };
  }
  // فیگور کامل روی ctx با مبدأ کف زمین؛ برمی‌گرداند {fxN} برای افکت برخورد پا
  function drawFigure(g, t, o) {
    const { A, S, v, beat } = o;
    const phi = t / RIG.T;
    const L = v * RIG.T / 2, liftMax = 30 * A + 7;
    const bob = -A * 7 * (0.5 + 0.5 * Math.cos(TAU * (2 * phi - 0.5)));
    const lean = 0.035 * A + 0.015 + (beat ? 0.004 * Math.sin(t * 0.9) : 0);
    const breath = beat ? Math.sin(t * 1.9) : 0;
    const hipY = -RIG.hipY + bob, shY = -RIG.shY + bob + breath * 1.5, headY = -RIG.headC + bob + breath * 2;
    const xo = (y) => -y * lean; // خمیدگی ملایم به جلو
    const pN = ((phi % 1) + 1) % 1, pF = ((phi + 0.5) % 1);
    const near = legPose(pN, L, S, liftMax, 16), far = legPose(pF, L, S, liftMax, -16);
    const DARK = '#0a0e13', FARD = '#151b23';
    // دست دور (تاب مخالف پا)
    const sw = A * 0.5 * Math.sin(TAU * phi + Math.PI) + (beat ? 0.06 * Math.sin(t * 0.8) : 0);
    swingArm(g, shY, sw, 0.5 + 0.25 * A * Math.sin(TAU * phi + 2), '#1b2430', 28);
    // پای دور
    ikLeg(g, hipY, far, '#1b2430', 38, 28);
    // بارانی (کت بلند) با دنبالهٔ لبه
    const hs = -(v * 0.06) - 8 * A * Math.sin(TAU * phi + 1.3);
    const cg = g.createLinearGradient(0, shY, 0, -180);
    cg.addColorStop(0, '#10161d'); cg.addColorStop(1, '#070b10');
    g.fillStyle = cg;
    g.beginPath();
    g.moveTo(xo(shY) - 34, shY);
    g.quadraticCurveTo(xo(-450) + 40, -450, xo(-300) + 48 + hs * 0.3, -300);
    g.lineTo(xo(-160) + 58 + hs * 0.4, -160);
    g.lineTo(xo(-160) - 62 + hs, -154);
    g.quadraticCurveTo(xo(-450) - 46, -450, xo(shY) - 36, shY - 8);
    g.closePath(); g.fill();
    // یقه/شال
    g.fillStyle = '#1a222c'; g.beginPath(); g.ellipse(xo(shY) + 4, shY - 6, 30, 16, -0.2, 0, TAU); g.fill();
    // سر + مو (گوجه‌ای پشت سر)
    g.fillStyle = DARK;
    g.beginPath(); g.arc(xo(headY) + 6, headY, RIG.headR, 0, TAU); g.fill();
    g.beginPath(); g.arc(xo(headY) - 34, headY - 14, 17, 0, TAU); g.fill();
    g.strokeStyle = DARK; g.lineWidth = 26; g.beginPath(); g.moveTo(xo(headY), headY + 32); g.lineTo(xo(shY) + 2, shY); g.stroke();
    // پای نزدیک
    ikLeg(g, hipY, near, DARK, 44, 34);
    // دست نزدیک + چتر
    const ex = 6 + 50, ey = shY + 98, hnx = ex + 24, hny = ey - 90 + bob * 0.4;
    g.strokeStyle = DARK; g.lineCap = 'round'; g.lineWidth = 32;
    g.beginPath(); g.moveTo(6, shY); g.lineTo(ex, ey); g.stroke();
    g.lineWidth = 28; g.beginPath(); g.moveTo(ex, ey); g.lineTo(hnx, hny); g.stroke();
    g.fillStyle = DARK; g.beginPath(); g.arc(hnx, hny, 12, 0, TAU); g.fill();
    const tb = -0.10 - 0.02 * Math.sin(t * 1.1) - A * 0.04; // چتر کمی به عقب
    const tx = hnx + Math.sin(tb) * 262, ty = hny - Math.cos(tb) * 262;
    g.strokeStyle = '#2a3440'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(hnx, hny + 16); g.lineTo(tx, ty); g.stroke();
    g.save(); g.translate(tx, ty); g.rotate(tb * 1.6);
    g.fillStyle = 'rgba(215,238,255,.30)';
    g.beginPath(); g.moveTo(-192, 14);
    g.quadraticCurveTo(-150, -78, 0, -92); g.quadraticCurveTo(150, -78, 192, 14);
    for (let i = 4; i >= 1; i--) g.quadraticCurveTo(i * 76.8 - 38.4, 26, (i - 1) * 76.8 - 192, 14);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(225,245,255,.6)'; g.lineWidth = 2.6; g.stroke();
    g.strokeStyle = 'rgba(220,242,255,.35)'; g.lineWidth = 1.6;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, -80); g.lineTo(i * 76.8 - 153.6, 12); g.stroke(); }
    g.strokeStyle = '#2a3440'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -92); g.lineTo(0, -108); g.stroke();
    g.restore();
    return { fxN: near.fx, pN, hnx, hny, tx, ty };
  }

  // ---------------- بوم خارج‌صفحه‌ای فیگور + تینت ریملایت ----------------
  const F = {};
  function initFigure() {
    F.fc = document.createElement('canvas'); F.fc.width = 700; F.fc.height = 1000;
    F.g = F.fc.getContext('2d');
    F.cyan = document.createElement('canvas'); F.cyan.width = 700; F.cyan.height = 1000; F.cg = F.cyan.getContext('2d');
    F.mag = document.createElement('canvas'); F.mag.width = 700; F.mag.height = 1000; F.mg = F.mag.getContext('2d');
  }
  const tint = (g, src, col) => {
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, 700, 1000);
    g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in';
    g.fillStyle = col; g.fillRect(0, 0, 700, 1000); g.globalCompositeOperation = 'source-over';
  };

  return {
    init(IMG) {
      U.assertGlyphs('Vazirmatn-Medium', 'شبِ نئون تهران ۲۰۷۷ ادامه دارد… بازسازی یک سکانس سینمایی', '96_neon_rain');
      initFigure();
    },
    draw(c, lt0, t) {
      const cam = camAt(t), IM = window.IMG;
      c.fillStyle = '#05070c'; c.fillRect(0, 0, W, H);
      const glow = c.createRadialGradient(W * 0.62, 430, 60, W * 0.62, 430, 1200);
      glow.addColorStop(0, 'rgba(60,140,190,.34)'); glow.addColorStop(0.5, 'rgba(150,60,140,.16)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = glow; c.fillRect(0, 0, W, H);

      // L1 شهر (mirror-wrap برای تراکینگ)
      layer(c, cam, 0.9, () => {
        const im = IM['img/city_bg.jpg'], s = cover(im);
        wrapImg(c, cam, 0.9, im, 960 - im.width * s / 2, 540 - im.height * s / 2, im.width * s, im.height * s, true);
      });
      // L2 مه دور
      layer(c, cam, 0.96, () => fog(c, cam, t, IM['img/fog_tile.png'], 330, 1.5, 0.14, 26, 3));
      // L3 نئون (screen) + سوسو
      const flick = 0.78 + 0.22 * Math.abs(Math.sin(t * 11.3) * Math.sin(t * 5.7 + 1));
      const drop = (t > 4.2 && t < 4.42) || (t > 11.4 && t < 11.55) ? 0.35 : 1;
      layer(c, cam, 1, () => {
        c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.85 * flick * drop;
        const n = IM['img/neon_layer.png'], s = 1.28;
        wrapImg(c, cam, 1, n, 960 - n.width * s / 2 - 120, 540 - n.height * s / 2 - 60, n.width * s, n.height * s, false);
        c.restore();
      });
      // L3.5 ماشین‌های پرنده
      layer(c, cam, 1.02, () => cars(c, t));
      // L4 قهرمان: ریگ اسکلتی رویه‌ای — راه‌رفتنhuman‌وار + ترمز + ایستادن/تنفس
      layer(c, cam, 1.12, () => {
        const beat = cam.beat, v = cam.v;
        const A = clamp(v / VMAX, 0, 1), S = clamp((1 - v / VMAX) * 1.25 - 0.25, 0, 1);
        F.g.clearRect(0, 0, 700, 1000);
        F.g.save(); F.g.translate(350, 960);
        const info = drawFigure(F.g, t, { A, S, v, beat });
        F.g.restore();
        // نور محیطی ظریف روی سیلوئت
        F.g.globalCompositeOperation = 'source-atop';
        const eg = F.g.createLinearGradient(0, 40, 0, 960);
        eg.addColorStop(0, 'rgba(130,210,255,.16)'); eg.addColorStop(0.6, 'rgba(255,120,220,.08)'); eg.addColorStop(1, 'rgba(0,0,0,0)');
        F.g.fillStyle = eg; F.g.fillRect(0, 0, 700, 1000);
        F.g.globalCompositeOperation = 'source-over';
        tint(F.cg, F.fc, '#7de8ff'); tint(F.mg, F.fc, '#ff5fd0');
        const s = 0.85, hx = beat ? EX : heroX(t), fy = 1005;
        const dw = 700 * s, dh = 1000 * s;
        // انعکاس خیس
        c.save(); c.globalAlpha = 0.2; c.translate(hx, fy + 4); c.scale(s, -s * 0.48);
        c.drawImage(F.fc, -350, -960); c.restore();
        // ریملایت نئون (دو لبهٔ رنگی)
        c.save(); c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.65; c.drawImage(F.cyan, hx - 350 * s - 5, fy - 960 * s - 3, dw, dh);
        c.globalAlpha = 0.45; c.drawImage(F.mag, hx - 350 * s + 5, fy - 960 * s - 3, dw, dh);
        c.restore();
        // فیگور
        c.drawImage(F.fc, hx - 350 * s, fy - 960 * s, dw, dh);
        // برخورد پاشنه به آب
        if (A > 0.25 && info.pN < 0.12) {
          const q = info.pN / 0.12, fxw = hx + info.fxN * s;
          c.save(); c.globalAlpha = (1 - q) * 0.5 * A; c.strokeStyle = 'rgba(200,235,255,.7)'; c.lineWidth = 2;
          c.beginPath(); c.ellipse(fxw, fy + 2, 6 + q * 26, (6 + q * 26) * 0.26, 0, 0, TAU); c.stroke(); c.restore();
        }
        // چکه از لبهٔ چتر
        c.save(); c.strokeStyle = 'rgba(190,220,255,.5)'; c.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const q = (t * 1.4 + i * 0.37) % 1, dx = hx + (info.tx - 350 + (i - 1) * 130) * s;
          c.globalAlpha = (1 - q) * 0.5;
          c.beginPath(); c.moveTo(dx, fy + (info.ty - 960 + 20) * s + q * 60); c.lineTo(dx, fy + (info.ty - 960 + 28) * s + q * 60); c.stroke();
        }
        c.restore();
      });
      // L5 باران نزدیک + برخورد
      layer(c, cam, 1.22, () => { rain(c, cam, t, 130, 1.15, 34, 0.34, 11); splashes(c, t); });
      // L6 مه نزدیک
      layer(c, cam, 1.3, () => fog(c, cam, t * 1.6, IM['img/fog_tile.png'], 700, 2.2, 0.11, 46, 9));
      rain(c, cam, t, 90, 0.8, 20, 0.16, 31);

      // ---- انعکاس نئون در آب کف خیابون ----
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.14;
      const n2 = IM['img/neon_layer.png'];
      for (let i = 0; i < 10; i++) {
        const sy = H - 30 - i * 26, off = Math.sin(t * 2.1 + i * 0.9) * (3 + i * 1.4);
        c.drawImage(n2, 0, n2.height * (0.55 + i * 0.04), n2.width, n2.height * 0.05, 360 + off, sy, 1200, 22);
      }
      c.restore();

      // ---- اسکن‌لاین + گرید ----
      c.save(); c.globalAlpha = 0.05; c.fillStyle = '#000';
      for (let y = 0; y < H; y += 5) c.fillRect(0, y, W, 1.6);
      c.restore();
      const vg = c.createRadialGradient(W / 2, H / 2, H * 0.36, W / 2, H / 2, H * 0.98);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,10,.55)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
      c.drawImage(P.grain('nr', 0.05, [20, 25, 35], 0.22), 0, 0);

      if (cam.beat === 1 && cam.lt < 0.16) { c.fillStyle = `rgba(220,240,255,${0.55 * (1 - cam.lt / 0.16)})`; c.fillRect(0, 0, W, H); }

      // ---- لترباکس + متن ----
      const bar = 108;
      c.fillStyle = '#000'; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
      if (t < 4.6) {
        const a = clamp(t / 0.9) * clamp((4.6 - t) / 0.6);
        c.save(); c.globalAlpha = a; c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = '104px "Vazirmatn-Medium"'; c.fillStyle = 'rgba(120,220,255,.5)'; c.fillText('شبِ نئون', W / 2 + 4, 250 + 4);
        c.fillStyle = '#f4fbff'; c.fillText('شبِ نئون', W / 2, 250);
        c.font = '40px "Vazirmatn-Regular"'; c.fillStyle = '#9fd8ea'; c.fillText('تهران — ۲۰۷۷ · بازسازی یک سکانس سینمایی', W / 2, 340);
        c.restore();
      }
      if (t > 14.4) {
        const a = clamp((t - 14.4) / 0.8);
        c.save(); c.globalAlpha = a; c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = '56px "Vazirmatn-Medium"'; c.fillStyle = '#ffe9c8'; c.fillText('ادامه دارد…', W / 2, H / 2 - 60);
        c.restore();
      }
    },
  };
})();
