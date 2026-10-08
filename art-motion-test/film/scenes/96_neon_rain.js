// 96_neon_rain — «شبِ نئون»: بازسازی یک سکانس سینمایی فوق‌رئال با است‌های تولیدی (هوش مصنوعی)
// + کامپوزیت و حرکتِ کدی: کلیدِ پردهٔ سبز (نمای نزدیک)، پارالاکسِ لایه‌های تخت (۲.۵بعدی)، باران دولایه، مه،
// ماشین‌های پرنده، جارو نور، سوسوی نئون، انعکاس پویای تابلوها در آبِ کف خیابان، دو نما با برش،
// لترباکس + گرین + وینیت. بدون getImageData در حلقهٔ فریم (کلید فقط یک‌بار در init).
// نمای A: «تراولینگ‌شات» — کاراکتر با ریگ اسکلتی رویه‌ای (۲۴fps) راه می‌رود و دوربین دنبال می‌کند؛
// شهر با کاشی آینه‌ای بی‌نهایت اسکرول می‌شود. سرعت = طولِ گام × کادنس (بدون سُرخوردن پا).
// نمای B: استِ فوتورئالِ تولیدی (ایستاده + تنفس ظریف).
SCENES['96_neon_rain'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp } = U, P = PAINT;
  const SPR = {};   // { stand } استِ کلیدشده+کراپ‌شده برای نمای نزدیک

  const HERO_V = 430;                                  // سرعت راه‌رفتن (واحد دنیا/ثانیه)
  const camAt = (t) => {
    if (t < 9) {
      const q = U.ease.inOut(clamp(t / 9));
      const heroX = 880 + HERO_V * t;
      return { x: heroX + 90, y: lerp(600, 640, q), z: lerp(1.02, 1.08, q), rot: 0, beat: 0, lt: t, heroX };
    }
    const lt = t - 9, q = U.ease.inOut(clamp(lt / 1.2));
    return { x: lerp(880 + HERO_V * 9 + 90, 1330, q), y: lerp(640, 620, q), z: lerp(1.08, 1.42, q), rot: -0.012, beat: 1, lt, heroX: 0 };
  };
  // لایه با عمق p: ترجمه کمتر/بیشتر + زوم کمی متفاوت → عمق از صفحهٔ تخت
  const layer = (c, cam, p, fn) => {
    c.save(); c.translate(W / 2, H / 2); c.scale(cam.z * (1 + (p - 1) * 0.35), cam.z * (1 + (p - 1) * 0.35)); c.rotate(cam.rot);
    c.translate(-(cam.x * p + 960 * (1 - p)), -(cam.y * p + 540 * (1 - p)));
    fn(); c.restore();
  };
  const cover = (im) => Math.max(W / im.width, H / im.height) * 1.12;
  // کاشی آینه‌ای افقی: تصویر + نسخهٔ قرینه → اسکرول بی‌نهایت بدون درزِ سخت
  function mtile(c, cam, p, img, dw, dh, y) {
    const per = 2 * dw, sc = cam.z * (1 + (p - 1) * 0.35);
    const cx = cam.x * p + 960 * (1 - p), half = (W / 2) / sc + dw;
    const x0 = Math.floor((cx - half) / per) * per;
    for (let x = x0; x < cx + half; x += per) {
      c.drawImage(img, x, y, dw, dh);
      c.save(); c.translate(x + 2 * dw, y); c.scale(-1, 1); c.drawImage(img, 0, 0, img.width, img.height, 0, 0, dw, dh); c.restore();
    }
  }

  // باران: قطره‌های کج با باد + برخورد به زمین (حول cx پنجرهٔ دید)
  function rain(c, t, n, spd, len, alpha, seed, cx) {
    c.save(); c.lineCap = 'round'; c.strokeStyle = `rgba(190,220,255,${alpha})`;
    for (let i = 0; i < n; i++) {
      const h1 = U.hash(i, seed), h2 = U.hash(i, seed + 1);
      const vx = 260 + h1 * 240, x = cx - 1400 + ((h2 * 2800 + t * vx * 0.35) % 2800), y = ((h1 * 1400 + t * (700 + h2 * 500) * spd) % 1400) - 160;
      c.lineWidth = 1.4 + h1 * 1.4;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - len * 0.22, y + len); c.stroke();
    }
    c.restore();
  }
  function splashes(c, t, cx) {
    c.save(); c.strokeStyle = 'rgba(200,230,255,.4)'; c.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const h = U.hash(i, 77), q = (t * 2.2 + h * 3) % 1, x = cx - 1300 + h * 2600, y = 900 + U.hash(i, 5) * 160;
      if (q < 0.5) { c.globalAlpha = (1 - q * 2) * 0.5; c.beginPath(); c.ellipse(x, y, 4 + q * 26, (4 + q * 26) * 0.28, 0, 0, TAU); c.stroke(); }
    }
    c.restore();
  }
  // مه: کاشی دود با blend افزایشی حول پنجرهٔ دید
  function fog(c, cam, p, t, img, y, scale, alpha, speed, seed) {
    c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = alpha;
    const w = img.width * scale, hh = img.height * scale;
    const sc = cam.z * (1 + (p - 1) * 0.35), cx = cam.x * p + 960 * (1 - p), half = (W / 2) / sc + w;
    const off = (t * speed) % (w * 0.72);
    for (let x = cx - half - off; x < cx + half; x += w * 0.72) c.drawImage(img, x, y + Math.sin(t * 0.3 + seed + x * 0.001) * 14, w, hh);
    c.restore();
  }
  function cars(c, t, cx) {
    // چراغ‌های ماشین پرنده با دنباله
    const lane = (i, y, spd, dir, colA, colB) => {
      const q = ((t * spd + i * 0.37) % 1.4) - 0.2, x = dir > 0 ? cx - 1300 + q * 2600 : cx + 1300 - q * 2600;
      const g = c.createLinearGradient(x - dir * 220, y, x, y);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, colA);
      c.strokeStyle = g; c.lineWidth = 5; c.beginPath(); c.moveTo(x - dir * 220, y); c.lineTo(x, y); c.stroke();
      c.fillStyle = colB; c.beginPath(); c.ellipse(x, y, 9, 4, 0, 0, TAU); c.fill();
    };
    lane(0, 300, 0.16, 1, 'rgba(255,190,120,.7)', '#ffe9c8');
    lane(1, 342, 0.11, -1, 'rgba(255,90,90,.6)', '#ffd0c8');
    lane(2, 262, 0.2, 1, 'rgba(120,220,255,.55)', '#e8fbff');
    // اسپینرِ نزدیک‌تر با چشمک و جارو نور
    const sx = cx - 1300 + ((t * 0.07) % 1.3) * 2600, sy = 210 + Math.sin(t * 0.8) * 8;
    c.save(); c.globalAlpha = 0.9;
    c.fillStyle = '#1a222c'; c.beginPath(); c.ellipse(sx, sy, 34, 10, 0, 0, TAU); c.fill();
    c.fillStyle = Math.floor(t * 3) % 2 ? '#ff5040' : '#701818'; c.beginPath(); c.arc(sx - 30, sy, 3.4, 0, TAU); c.fill();
    c.fillStyle = '#bff4ff'; c.beginPath(); c.arc(sx + 30, sy, 3.4, 0, TAU); c.fill();
    const cone = c.createLinearGradient(sx, sy, sx + 140, sy + 320);
    cone.addColorStop(0, 'rgba(180,240,255,.28)'); cone.addColorStop(1, 'rgba(180,240,255,0)');
    c.fillStyle = cone; c.save(); c.translate(sx, sy); c.rotate(0.9 + Math.sin(t * 0.5) * 0.25); c.beginPath(); c.moveTo(0, 0); c.lineTo(300, -46); c.lineTo(300, 46); c.closePath(); c.fill(); c.restore();
    c.restore();
  }

  // ---------- ریگ اسکلتی راه‌رفتن (نمای جانبی، رو به راست) ----------
  // گیت واقعی: ران کورسینوسی + خمِ زانو در فازswing + قفلِ پا به زمین + بُب عمودی طبیعی
  function walker(c, x, t) {
    const Gy = 1005, Lt = 175, Ls = 165, cad = 2.0, p = t * cad * Math.PI;
    const cap = (x0, y0, x1, y1, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
    const leg = (a) => {
      const th = 0.36 * Math.sin(a) + 0.06;                       // ران
      const kn = 0.10 + 0.95 * Math.max(0, Math.sin(a - 0.5));    // خم زانو (اوج در swing)
      const sh = th - kn;
      const kx = Math.sin(th) * Lt, ky = Math.cos(th) * Lt;
      const fa = 0.10 + 0.22 * Math.max(0, Math.sin(a + 0.9));    // پنجه‌پایینی در swing
      return { kx, ky, fx: kx + Math.sin(sh) * Ls, fy: ky + Math.cos(sh) * Ls, fa };
    };
    const A = leg(p), B = leg(p + Math.PI);
    const hipY = Gy - Math.max(A.fy, B.fy);                       // پایین‌ترین پا همیشه روی زمین
    const hipX = x;
    // سایهٔ خیس
    c.fillStyle = 'rgba(0,0,10,.5)'; c.beginPath(); c.ellipse(hipX + 6, Gy + 8, 92, 12, 0, 0, TAU); c.fill();
    const lean = 0.10 + 0.02 * Math.sin(p);
    const shX = hipX + Math.sin(lean) * 205, shY = hipY - Math.cos(lean) * 205;
    // دستِ دور (پشت بدن) swing متقابل با پای دور
    const uaF = 0.34 * Math.sin(p + Math.PI) + 0.12;
    const eFx = shX + Math.sin(uaF) * 92, eFy = shY + Math.cos(uaF) * 92;
    const aF = uaF - (0.95 + 0.3 * Math.sin(p + Math.PI + 0.7));
    cap(shX, shY, eFx, eFy, 21, '#070a10'); cap(eFx, eFy, eFx + Math.sin(aF) * 82, eFy + Math.cos(aF) * 82, 17, '#070a10');
    // پای دور
    cap(hipX, hipY, hipX + B.kx, hipY + B.ky, 36, '#070a10');
    cap(hipX + B.kx, hipY + B.ky, hipX + B.fx, hipY + B.fy, 29, '#070a10');
    c.save(); c.translate(hipX + B.fx, hipY + B.fy); c.rotate(B.fa); c.fillStyle = '#05070c'; c.beginPath(); c.roundRect(-18, -12, 84, 25, 9); c.fill(); c.restore();
    // پالتو + تنه
    const sway = Math.sin(p) * 9 - 7;
    c.fillStyle = '#0b0e15';
    cap(hipX, hipY - 20, shX, shY, 66, '#0b0e15');
    c.beginPath(); c.moveTo(hipX - 36, hipY - 40);
    c.quadraticCurveTo(hipX - 62 + sway, hipY + 100, hipX - 50 + sway, hipY + 188);
    c.lineTo(hipX + 48 + sway * 0.6, hipY + 188);
    c.quadraticCurveTo(hipX + 48, hipY + 40, hipX + 36, hipY - 40); c.closePath(); c.fill();
    c.beginPath(); c.arc(shX, shY, 36, 0, TAU); c.fill();
    // پای نزدیک (جلوی پالتو)
    cap(hipX, hipY, hipX + A.kx, hipY + A.ky, 38, '#0e1219');
    cap(hipX + A.kx, hipY + A.ky, hipX + A.fx, hipY + A.fy, 31, '#0e1219');
    c.save(); c.translate(hipX + A.fx, hipY + A.fy); c.rotate(A.fa); c.fillStyle = '#06080d'; c.beginPath(); c.roundRect(-18, -13, 86, 26, 10); c.fill(); c.restore();
    // برق لبهٔ پالتو: پشت سرخابی، جلو فیروزه‌ای (نور نئون)
    cap(hipX - 32, hipY - 6, shX - 30, shY + 8, 4.5, 'rgba(255,80,190,.34)');
    cap(shX + 31, shY + 10, hipX + 36, hipY - 2, 4, 'rgba(110,230,255,.30)');
    c.strokeStyle = 'rgba(110,230,255,.22)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(hipX - 48 + sway, hipY + 184); c.lineTo(hipX + 46 + sway * 0.6, hipY + 184); c.stroke();
    // سر + مو (گوجه‌ای پشت سر)
    const hdX = shX + Math.sin(lean + 0.05) * 62, hdY = shY - Math.cos(lean + 0.05) * 62;
    c.fillStyle = '#0b0e15'; c.beginPath(); c.arc(hdX, hdY, 42, 0, TAU); c.fill();
    c.beginPath(); c.arc(hdX - 36, hdY - 16, 17, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,80,190,.3)'; c.lineWidth = 3.5; c.beginPath(); c.arc(hdX - 4, hdY - 4, 38, Math.PI * 0.75, Math.PI * 1.6); c.stroke();
    // دستِ نزدیک: آرنج خم، دست چتر را گرفته
    const elX = shX + Math.sin(0.5) * 92, elY = shY + Math.cos(0.5) * 92;
    const haX = elX + Math.sin(2.5) * 88, haY = elY + Math.cos(2.5) * 88;
    cap(shX, shY, elX, elY, 22, '#0e1219'); cap(elX, elY, haX, haY, 18, '#0e1219');
    c.fillStyle = '#0e1219'; c.beginPath(); c.arc(haX, haY, 11, 0, TAU); c.fill();
    // چتر: دسته + canopy با لبهٔ موج‌دار + برق فیروزه‌ای + چکه
    const cnX = haX + 48, cnY = haY - 205;
    c.strokeStyle = '#141a22'; c.lineWidth = 7; c.beginPath(); c.moveTo(haX, haY); c.lineTo(cnX, cnY); c.stroke();
    c.save(); c.translate(cnX, cnY); c.rotate(0.12);
    c.fillStyle = '#0c1017';
    c.beginPath(); c.moveTo(-190, 16); c.quadraticCurveTo(0, -92, 190, 16);
    c.quadraticCurveTo(141, 32, 95, 18); c.quadraticCurveTo(47, 34, 0, 20);
    c.quadraticCurveTo(-47, 34, -95, 18); c.quadraticCurveTo(-141, 32, -190, 16); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(120,230,255,.45)'; c.lineWidth = 3.5;
    c.beginPath(); c.moveTo(-190, 16); c.quadraticCurveTo(0, -92, 190, 16); c.stroke();
    c.fillStyle = '#141a22'; c.fillRect(-2.5, -116, 5, 28);
    c.restore();
    for (let i = 0; i < 3; i++) {
      const q = (t * 1.5 + i * 0.37) % 1, dx = cnX - 150 + i * 140;
      c.save(); c.globalAlpha = (1 - q) * 0.5; c.strokeStyle = 'rgba(190,220,255,.6)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(dx, cnY + 22 + q * 70); c.lineTo(dx, cnY + 30 + q * 70); c.stroke(); c.restore();
    }
  }

  return {
    init(IMG) {
      U.assertGlyphs('Vazirmatn-Medium', 'شبِ نئون تهران ۲۰۷ ادامه دارد… بازسازی یک سکانس سینمایی', '96_neon_rain');
      // کلید پردهٔ سبز + برش bounding-box (یک‌بار) برای استِ نمای نزدیک
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
    },
    draw(c, lt0, t) {
      const cam = camAt(t), IM = window.IMG;
      c.fillStyle = '#05070c'; c.fillRect(0, 0, W, H);
      // هالهٔ نور شهر پشت همه‌چیز
      const glow = c.createRadialGradient(W * 0.62, 430, 60, W * 0.62, 430, 1200);
      glow.addColorStop(0, 'rgba(60,140,190,.34)'); glow.addColorStop(0.5, 'rgba(150,60,140,.16)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = glow; c.fillRect(0, 0, W, H);

      // L1 شهر (کاشی آینه‌ای بی‌نهایت)
      layer(c, cam, 0.9, () => {
        const im = IM['img/city_bg.jpg'], s = cover(im);
        mtile(c, cam, 0.9, im, im.width * s, im.height * s, 540 - im.height * s / 2);
      });
      // L2 مه دور
      layer(c, cam, 0.96, () => fog(c, cam, 0.96, t, IM['img/fog_tile.png'], 330, 1.5, 0.14, 26, 3));
      // L3 نئون (screen) + سوسو — این هم آینه‌ای اسکرول می‌شود
      const flick = 0.78 + 0.22 * Math.abs(Math.sin(t * 11.3) * Math.sin(t * 5.7 + 1));
      const drop = (t > 4.2 && t < 4.42) || (t > 11.4 && t < 11.55) ? 0.35 : 1;
      layer(c, cam, 1, () => {
        c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.85 * flick * drop;
        const n = IM['img/neon_layer.png'], s = 1.28;
        mtile(c, cam, 1, n, n.width * s, n.height * s, 540 - n.height * s / 2 - 60);
        c.restore();
      });
      // L3.5 ماشین‌های پرنده
      layer(c, cam, 1.02, () => cars(c, t, cam.x * 1.02 + 960 * -0.02));
      // L4 قهرمان: ریگ راه‌رفتن + دوربین دنبال‌کننده (نمای A) / استِ فوتورئال ایستاده+تنفس (نمای B)
      layer(c, cam, 1.12, () => {
        if (cam.beat === 0) {
          // انعکاس خیسِ ریگ
          c.save(); c.globalAlpha = 0.20; c.translate(0, 1013 * 1.42); c.scale(1, -0.42);
          walker(c, cam.heroX, t); c.restore();
          walker(c, cam.heroX, t);
        } else {
          const spr = SPR.stand, hx = 1346, s = 800 / spr.h;
          const fy = 1005 + Math.sin(t * 1.6) * 2;
          const lean = 0.006 * Math.sin(t * 0.9);
          c.save(); c.globalAlpha = 0.22; c.translate(hx, fy + 8); c.scale(s, -s * 0.42); c.rotate(-lean);
          c.drawImage(spr.cv, -spr.w / 2, 0); c.restore();
          c.save(); c.translate(hx, fy); c.rotate(lean); c.scale(s, s * (1 + 0.005 * Math.sin(t * 1.9)));
          c.drawImage(spr.cv, -spr.w / 2, -spr.h); c.restore();
          c.save(); c.strokeStyle = 'rgba(190,220,255,.5)'; c.lineWidth = 2;
          for (let i = 0; i < 3; i++) { const q = (t * 1.4 + i * 0.37) % 1, dx = hx - 118 + i * 96; c.globalAlpha = (1 - q) * 0.5; c.beginPath(); c.moveTo(dx, fy - 470 + q * 60); c.lineTo(dx, fy - 462 + q * 60); c.stroke(); }
          c.restore();
        }
      });
      // L5 باران نزدیک + برخورد
      layer(c, cam, 1.22, () => {
        const cx = cam.x * 1.22 + 960 * -0.22;
        rain(c, t, 130, 1.15, 34, 0.34, 11, cx); splashes(c, t, cx);
      });
      // L6 مه نزدیک
      layer(c, cam, 1.3, () => fog(c, cam, 1.3, t * 1.6, IM['img/fog_tile.png'], 700, 2.2, 0.11, 46, 9));
      // باران دور روی همه (ظریف)
      rain(c, t, 90, 0.8, 20, 0.16, 31, 960);

      // ---- انعکاس نئون در آب کف خیابون (اسلایس‌های موج‌دار، با اسکرول دوربین) ----
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.14;
      const n2 = IM['img/neon_layer.png'], scrol = (cam.x - 970) * 0.6;
      for (let i = 0; i < 10; i++) {
        const sy = H - 30 - i * 26, off = Math.sin(t * 2.1 + i * 0.9) * (3 + i * 1.4) - (scrol % 300);
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
