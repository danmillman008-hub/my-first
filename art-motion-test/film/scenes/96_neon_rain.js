// 96_neon_rain — «شبِ نئون»: بازسازی یک سکانس سینمایی فوق‌رئال با است‌های تولیدی (هوش مصنوعی)
// + کامپوزیت و حرکتِ کدی: کلیدِ پردهٔ سبز، پارالاکسِ لایه‌های تخت (۲.۵بعدی)، باران دولایه، مه،
// ماشین‌های پرنده، جارو نور، سوسوی نئون، انعکاس پویای تابلوها در آبِ کف خیابان، دو نما با برش،
// لترباکس + گرین + وینیت. بدون getImageData در حلقهٔ فریم (کلید فقط یک‌بار در init).
SCENES['96_neon_rain'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp } = U, P = PAINT;
  const SPR = {};   // { stand, walk[4] } فریم‌های کلیدشده+کراپ‌شده

  const camAt = (t) => {
    if (t < 9) { const q = U.ease.inOut(clamp(t / 9)); return { x: lerp(940, 1010, q), y: lerp(560, 585, q), z: lerp(1.05, 1.16, q), rot: 0, beat: 0, lt: t }; }
    const lt = t - 9, q = U.ease.inOut(clamp(lt / 1.2));
    return { x: lerp(1010, 1330, q), y: lerp(585, 620, q), z: lerp(1.16, 1.42, q), rot: -0.012, beat: 1, lt };
  };
  // لایه با عمق p: ترجمه کمتر/بیشتر + زوم کمی متفاوت → عمق از صفحهٔ تخت
  const layer = (c, cam, p, fn) => {
    c.save(); c.translate(W / 2, H / 2); c.scale(cam.z * (1 + (p - 1) * 0.35), cam.z * (1 + (p - 1) * 0.35)); c.rotate(cam.rot);
    c.translate(-(cam.x * p + 960 * (1 - p)), -(cam.y * p + 540 * (1 - p)));
    fn(); c.restore();
  };
  const cover = (im) => Math.max(W / im.width, H / im.height) * 1.12;

  // باران: قطره‌های کج با باد + برخورد به زمین
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
  // مه: کاشی دود با blend افزایشی، دو_bank دور/نزدیک
  function fog(c, cam, t, img, y, scale, alpha, speed, seed) {
    c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = alpha;
    const w = img.width * scale, hh = img.height * scale;
    const off = (t * speed) % w;
    for (let x = -w - off; x < W + w; x += w * 0.72) c.drawImage(img, x, y + Math.sin(t * 0.3 + seed + x * 0.001) * 14, w, hh);
    c.restore();
  }
  function cars(c, t) {
    // چراغ‌های ماشین پرنده با دنباله
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
    // اسپینرِ نزدیک‌تر با چشمک و جارو نور
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

  return {
    init(IMG) {
      U.assertGlyphs('Vazirmatn-Medium', 'شبِ نئون تهران ۲۰۷ ادامه دارد… بازسازی یک سکانس سینمایی', '96_neon_rain');
      // کلید پردهٔ سبز + برش bounding-box برای همهٔ فریم‌ها (یک‌بار) تا تعویض فریم نپر
      const key = (src) => {
        const cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
        const g = cv.getContext('2d', { willReadFrequently: true });
        g.drawImage(src, 0, 0);
        const im = g.getImageData(0, 0, cv.width, cv.height), d = im.data;
        let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], gg = d[i + 1], b = d[i + 2], gn = gg - Math.max(r, b);
          if (gn > 42) d[i + 3] = 0;
          else if (gn > 16) d[i + 3] = Math.round(255 * (1 - (gn - 16) / 26));
          if (d[i + 3] > 0 && gg > Math.max(r, b)) d[i + 1] = Math.min(gg, Math.max(r, b) + 26);
          if (d[i + 3] > 12) { const p = i / 4, px = p % cv.width, py = (p / cv.width) | 0;
            if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
        }
        g.putImageData(im, 0, 0);
        const w = x1 - x0 + 1, h = y1 - y0 + 1, cc = document.createElement('canvas');
        cc.width = w; cc.height = h; cc.getContext('2d').drawImage(cv, x0, y0, w, h, 0, 0, w, h);
        return { cv: cc, w, h };
      };
      SPR.stand = key(IMG['img/hero_green.png']);
      SPR.walk = ['img/hero_walk1.png', 'img/hero_walk2.png', 'img/hero_walk3.png', 'img/hero_walk4.png'].map(f => key(IMG[f]));
    },
    draw(c, lt0, t) {
      const cam = camAt(t), IM = window.IMG;
      c.fillStyle = '#05070c'; c.fillRect(0, 0, W, H);
      // هالهٔ نور شهر پشت همه‌چیز
      const glow = c.createRadialGradient(W * 0.62, 430, 60, W * 0.62, 430, 1200);
      glow.addColorStop(0, 'rgba(60,140,190,.34)'); glow.addColorStop(0.5, 'rgba(150,60,140,.16)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = glow; c.fillRect(0, 0, W, H);

      // L1 شهر
      layer(c, cam, 0.9, () => {
        const s = cover(IM['img/city_bg.jpg']);
        c.drawImage(IM['img/city_bg.jpg'], (960 - IM['img/city_bg.jpg'].width * s / 2), (540 - IM['img/city_bg.jpg'].height * s / 2), IM['img/city_bg.jpg'].width * s, IM['img/city_bg.jpg'].height * s);
      });
      // L2 مه دور
      layer(c, cam, 0.96, () => fog(c, cam, t, IM['img/fog_tile.png'], 330, 1.5, 0.14, 26, 3));
      // L3 نئون (screen) + سوسو
      const flick = 0.78 + 0.22 * Math.abs(Math.sin(t * 11.3) * Math.sin(t * 5.7 + 1));
      const drop = (t > 4.2 && t < 4.42) || (t > 11.4 && t < 11.55) ? 0.35 : 1;
      layer(c, cam, 1, () => {
        c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.85 * flick * drop;
        const n = IM['img/neon_layer.png'], s = 1.28;
        c.drawImage(n, 960 - n.width * s / 2 - 120, 540 - n.height * s / 2 - 60, n.width * s, n.height * s);
        c.restore();
      });
      // L3.5 ماشین‌های پرنده
      layer(c, cam, 1.02, () => cars(c, t));
      // L4 قهرمان: سیکل قدم + حرکت در صحنه (نمای A) / ایستادن+تنفس (نمای B)
      layer(c, cam, 1.12, () => {
        const walking = cam.beat === 0;
        const spr = walking ? SPR.walk[Math.floor(t * 4.6) % 4] : SPR.stand;
        const hx = walking ? 860 + t * 54 : 860 + 9 * 54;
        const s = 800 / spr.h;
        const bob = walking ? Math.abs(Math.sin(t * 4.6 * Math.PI / 2)) * -5 : Math.sin(t * 1.6) * 2;
        const fy = 1005 + bob;
        const lean = walking ? 0.025 : 0.006 * Math.sin(t * 0.9);
        // انعکاس
        c.save(); c.globalAlpha = 0.22; c.translate(hx, fy + 8); c.scale(s, -s * 0.42); c.rotate(-lean);
        c.drawImage(spr.cv, -spr.w / 2, 0); c.restore();
        // خودِ کاراکتر
        c.save(); c.translate(hx, fy); c.rotate(lean); c.scale(s, s * (walking ? 1 : 1 + 0.005 * Math.sin(t * 1.9)));
        c.drawImage(spr.cv, -spr.w / 2, -spr.h); c.restore();
        // چکه از چتر
        c.save(); c.strokeStyle = 'rgba(190,220,255,.5)'; c.lineWidth = 2;
        for (let i = 0; i < 3; i++) { const q = (t * 1.4 + i * 0.37) % 1, dx = hx - 118 + i * 96; c.globalAlpha = (1 - q) * 0.5; c.beginPath(); c.moveTo(dx, fy - 470 + q * 60); c.lineTo(dx, fy - 462 + q * 60); c.stroke(); }
        c.restore();
      });
      // L5 باران نزدیک + برخورد
      layer(c, cam, 1.22, () => { rain(c, cam, t, 130, 1.15, 34, 0.34, 11); splashes(c, t); });
      // L6 مه نزدیک
      layer(c, cam, 1.3, () => fog(c, cam, t * 1.6, IM['img/fog_tile.png'], 700, 2.2, 0.11, 46, 9));
      // باران دور روی همه (ظریف)
      rain(c, cam, t, 90, 0.8, 20, 0.16, 31);

      // ---- انعکاس نئون در آب کف خیابون (اسلایس‌های موج‌دار) ----
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.14;
      const n2 = IM['img/neon_layer.png'];
      for (let i = 0; i < 10; i++) {
        const sy = H - 30 - i * 26, off = Math.sin(t * 2.1 + i * 0.9) * (3 + i * 1.4);
        c.drawImage(n2, 0, n2.height * (0.55 + i * 0.04), n2.width, n2.height * 0.05, 360 + off, sy, 1200, 22);
      }
      c.restore();

      // ---- اسکن‌لاین هولوگرام + گرید سینمایی ----
      c.save(); c.globalAlpha = 0.05; c.fillStyle = '#000';
      for (let y = 0; y < H; y += 5) c.fillRect(0, y, W, 1.6);
      c.restore();
      const vg = c.createRadialGradient(W / 2, H / 2, H * 0.36, W / 2, H / 2, H * 0.98);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,10,.55)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
      c.drawImage(P.grain('nr', 0.05, [20, 25, 35], 0.22), 0, 0);

      // ---- برش نما ----
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
