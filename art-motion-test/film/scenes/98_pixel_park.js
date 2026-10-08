// 98_pixel_park — قدم‌زدن پیکسلی در پارک: پسر + سگ با قلاده، دوچرخه‌سوارِ ابر و پروانه.
// تکنیکِ scenes/14_8bit: همه‌چیز روی بوم ۲۴۰×۱۳۵ پیکسل‌به‌پیکسل (هر ۱ پیکسل = ۸ پیکسل صفحه)
// و بزرگ‌نمایی nearest؛ بدون getImageData (چرخهٔ قدم با MO.step پله‌ای است).
SCENES['98_pixel_park'] = (() => {
  const W = 1920, H = 1080, S = 8, LW = 240, LH = 135, P = PAINT;
  const C = {
    sky0: '#7ecbf0', sky1: '#a8e0f8', sky2: '#d8f4fc', sun: '#ffd93b', sunHi: '#fff3a0',
    cloud: '#ffffff', cloudSh: '#cfe8f2', hill: '#59b25a', hillDk: '#3f9448',
    trunk: '#7a4a21', trunkDk: '#5d3517', leaf: '#2f8f3e', leafHi: '#63c455', leafDk: '#1f6e2e',
    fence: '#f6f1e2', fenceSh: '#cfc7ae', path: '#e4c079', pathDk: '#c89b52', pathSp: '#f4dca0',
    grass: '#4aa84e', grassDk: '#37863c', flower1: '#e8433c', flower2: '#ffd93b', flower3: '#f78fb8',
    bench: '#a7683a', benchDk: '#7c4a24', lamp: '#33424e', lampHi: '#8fa3b0',
    hair: '#4a2c14', skin: '#f2c79a', shirt: '#e04a3a', shirtDk: '#a83226', pant: '#2a58b4', pantDk: '#1d3f83', shoe: '#20242c',
    dog: '#c98a4b', dogDk: '#9c6a35', dogW: '#f7ead6', ear: '#6b4423', collar: '#d23c32', nose: '#20242c',
    bird: '#33424e', butterfly: '#f78fb8', butterfly2: '#ffd93b',
  };
  const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w, h); };

  // ---------- پس‌زمینهٔ ثابت ----------
  const bg = () => P.cached('pp_bg', LW, LH, (g) => {
    px(g, 0, 0, LW, 52, C.sky0); px(g, 0, 52, LW, 22, C.sky1); px(g, 0, 74, LW, 16, C.sky2);
    // خط‌درختان دوردست
    for (let x = 0; x < LW; x += 3) { const h = 6 + ((x * 37) % 5); px(g, x, 90 - h, 3, h, (x / 3) % 2 ? C.hill : C.hillDk); }
    px(g, 0, 90, LW, 10, C.hill);
    // حصار سفید
    for (let x = 2; x < LW; x += 7) { px(g, x, 92, 2, 8, C.fence); px(g, x, 91, 2, 1, C.fence); }
    px(g, 0, 95, LW, 1, C.fenceSh); px(g, 0, 98, LW, 1, C.fenceSh);
    // مسیر شنی
    px(g, 0, 100, LW, 20, C.path); px(g, 0, 100, LW, 1, C.pathDk);
    const r = U.rng(41);
    for (let i = 0; i < 70; i++) px(g, r() * LW, 102 + r() * 17, 1, 1, r() < 0.5 ? C.pathSp : C.pathDk);
    // چمن پیش‌زمینه + گل‌ها
    px(g, 0, 120, LW, LH - 120, C.grass); px(g, 0, 120, LW, 1, C.grassDk);
    for (let i = 0; i < 46; i++) { const x = r() * LW, y = 122 + r() * 12; px(g, x, y, 1, 1, C.grassDk); }
    const fl = [C.flower1, C.flower2, C.flower3];
    for (let i = 0; i < 12; i++) { const x = 4 + ((i * 53) % (LW - 8)), y = 124 + ((i * 29) % 9);
      px(g, x, y, 1, 1, fl[i % 3]); px(g, x, y + 1, 1, 1, C.grassDk); }
    // نیمکت
    px(g, 24, 108, 26, 2, C.bench); px(g, 24, 112, 26, 2, C.bench); px(g, 26, 114, 2, 6, C.benchDk); px(g, 46, 114, 2, 6, C.benchDk);
    px(g, 24, 102, 2, 6, C.benchDk); px(g, 48, 102, 2, 6, C.benchDk); px(g, 24, 102, 26, 2, C.bench);
    // چراغ پارک
    px(g, 208, 88, 2, 32, C.lamp); px(g, 206, 86, 6, 3, C.lamp); px(g, 207, 84, 4, 2, C.lampHi); px(g, 205, 118, 6, 2, C.lamp);
    // درخت بزرگ چپ
    px(g, 58, 62, 5, 38, C.trunk); px(g, 58, 62, 1, 38, C.trunkDk); px(g, 52, 70, 6, 3, C.trunk); px(g, 63, 78, 4, 2, C.trunkDk);
  });

  // تاج درخت (دو فازِ تکان خوردن)
  const crown = (g, x, y, ph) => {
    const o = ph ? 1 : 0;
    px(g, x - 14 + o, y - 4, 28, 10, C.leaf); px(g, x - 10 + o, y - 10, 20, 8, C.leaf);
    px(g, x - 6 + o, y - 13, 12, 4, C.leafHi); px(g, x - 12 + o, y - 2, 8, 3, C.leafHi);
    px(g, x + 2 + o, y - 8, 6, 2, C.leafDk); px(g, x - 14 + o, y + 4, 28, 2, C.leafDk);
  };

  // ---------- پسر (رو به راست) ----------
  const LEGS = [[2, 0, -2, 0], [0, -1, 0, 0], [-2, 0, 2, 0], [0, 0, 0, -1]];   // [Adx,Ady,Bdx,Bdy]
  function boy(g, x, y, f, t) {        // x,y = پاشنهٔ پای جلو
    const [adx, ady, bdx, bdy] = LEGS[f], bob = (f === 1 || f === 3) ? -1 : 0;
    y += bob;
    // پای عقب (B) و جلو (A): ران + کفش
    px(g, x - 2 + bdx, y - 6, 2, 5 + bdy, C.pantDk); px(g, x - 2 + bdx, y - 1 + bdy, 3, 1, C.shoe);
    px(g, x - 1 + adx, y - 6, 2, 5 + ady, C.pant);   px(g, x - 1 + adx, y - 1 + ady, 3, 1, C.shoe);
    // تنه (پیراهن)
    px(g, x - 3, y - 12, 6, 6, C.shirt); px(g, x - 3, y - 7, 6, 1, C.shirtDk);
    // دست عقب تاب‌خور
    px(g, x - 3, y - 11, 1, 4, C.shirtDk); px(g, x - 3 - (f === 0 || f === 3 ? 1 : 0), y - 8, 1, 1, C.skin);
    // دست جلو: جلو آمده و قلاده را گرفته
    px(g, x + 2, y - 11, 2, 1, C.shirt); px(g, x + 3, y - 10, 2, 1, C.shirt); px(g, x + 4, y - 10, 1, 1, C.skin);
    // سر
    px(g, x - 3, y - 17, 6, 5, C.skin);
    px(g, x - 3, y - 18, 6, 2, C.hair); px(g, x - 4, y - 17, 1, 3, C.hair); px(g, x - 3, y - 16, 1, 1, C.hair);
    px(g, x + 1, y - 15, 1, 1, C.shoe);                       // چشم
    px(g, x + 2, y - 13, 1, 1, C.skin);                       // بینی
    return [x + 4, y - 10];                                    // نقطهٔ دست (اتصال قلاده)
  }

  // ---------- سگ ----------
  const DLEGS = [[1, 0, -1, 0, 0, 0, 0, 0], [0, -1, 0, 0, 1, 0, -1, 0], [-1, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, -1, 0, -1, 0, 0]];
  function dog(g, x, y, f, t) {         // x,y = زیرِ شکم
    const L = DLEGS[f], bob = (f === 1 || f === 3) ? -1 : 0; y += bob;
    for (let i = 0; i < 4; i++) px(g, x - 4 + i * 3 + L[i * 2], y - 1, 1, 3 + L[i * 2 + 1], i % 2 ? C.dogDk : C.dog);  // پاها
    px(g, x - 5, y - 5, 10, 4, C.dog); px(g, x - 5, y - 2, 10, 1, C.dogDk);
    px(g, x - 2, y - 4, 5, 2, C.dogW);                                          // سینهٔ روشن
    // دم (دو فاز wag)
    const wag = Math.floor(t * 6) % 2;
    px(g, x - 6, y - 6 + wag, 2, 1, C.dogDk); px(g, x - 7, y - 7 + wag, 1, 2, C.dogDk);
    // سر رو به راست
    px(g, x + 4, y - 9, 5, 4, C.dog); px(g, x + 8, y - 8, 2, 2, C.dog); px(g, x + 9, y - 8, 1, 1, C.nose);
    px(g, x + 4, y - 10, 2, 2, C.ear); px(g, x + 6, y - 8, 1, 1, C.shoe);       // گوش و چشم
    px(g, x + 3, y - 6, 2, 1, C.collar);                                        // قلاده
    return [x + 4, y - 6];
  }

  // خط پله‌ای بین دو نقطه (قلاده با افت)
  function leash(g, a, b, t) {
    const n = 14, sag = 3 + Math.sin(t * 2) * 0.6;
    for (let i = 0; i <= n; i++) {
      const q = i / n, x = a[0] + (b[0] - a[0]) * q, y = a[1] + (b[1] - a[1]) * q + Math.sin(q * Math.PI) * sag;
      px(g, x, y, 1, 1, C.collar);
    }
  }

  return {
    init() { U.assertGlyphs('PressStart2P-400', 'A WALK IN THE PARK', '98_pixel_park عنوان'); },
    draw(c, lt, t) {
      const g0 = P.cached('pp_frame', LW, LH, () => {}).getContext('2d');
      const g = g0;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, LW, LH);
      g.drawImage(bg(), 0, 0);
      // خورشید پیکسلی + پرتوهای چشمک‌زن
      const sx = 206, sy = 14;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if (dx * dx + dy * dy <= 17) px(g, sx + dx, sy + dy, 1, 1, (dx + dy < -3) ? C.sunHi : C.sun);
      if (Math.floor(t * 2) % 2 === 0) { px(g, sx - 6, sy, 2, 1, C.sunHi); px(g, sx + 5, sy, 2, 1, C.sunHi); px(g, sx, sy - 6, 1, 2, C.sunHi); px(g, sx, sy + 5, 1, 2, C.sunHi); }
      // ابرها می‌لغزند
      for (const [cx0, cy, sp, w] of [[30, 12, 2.2, 20], [120, 22, 1.5, 26], [190, 8, 2.8, 16]]) {
        const cx = ((cx0 + t * sp) % (LW + 40)) - 20;
        px(g, cx, cy, w, 4, C.cloud); px(g, cx + 3, cy - 2, w - 8, 2, C.cloud); px(g, cx, cy + 3, w, 1, C.cloudSh);
      }
      // پرنده‌های «~»
      for (let i = 0; i < 2; i++) {
        const bx = LW - ((t * (6 + i * 2)) % (LW + 30)) + 10, by = 18 + i * 9 + Math.floor(Math.sin(t * 3 + i) * 1);
        const f = Math.floor(t * 6 + i) % 2;
        px(g, bx, by, 1, 1, C.bird); px(g, bx + 1, by - (f ? 1 : 0), 1, 1, C.bird); px(g, bx + 2, by, 1, 1, C.bird);
      }
      // تاج درخت بزرگ + درخت راست، تکان آهسته
      crown(g, 60, 58, Math.floor(t * 1.5) % 2);
      crown(g, 226, 66, Math.floor(t * 1.5 + 1) % 2);
      px(g, 224, 74, 4, 26, C.trunk);
      // برگ‌های ریزان
      for (let i = 0; i < 3; i++) { const q = ((t * 0.14 + i * 0.37) % 1), lx = 66 + i * 8 + Math.sin(t * 2 + i * 2) * 4, ly = 60 + q * 58;
        px(g, lx, ly, 1, 1, i % 2 ? C.leafHi : C.leafDk); }
      // پروانه نزدیک گل‌ها
      { const q = t * 0.5 % 1, fx = 90 + Math.sin(t * 0.9) * 26, fy = 116 + Math.sin(t * 2.2) * 3 - q * 2, wf = Math.floor(t * 8) % 2;
        px(g, fx, fy, 1, 1, C.butterfly); px(g, fx + (wf ? 2 : 1), fy, 1, 1, wf ? C.butterfly2 : C.butterfly); }

      // پسر و سگ از چپ به راست
      const span = LW + 50, bx = -20 + ((t * 22) % span), dx = bx + 17;
      const fB = Math.floor(t * 7) % 4, fD = Math.floor(t * 9 + 1) % 4;
      const hand = boy(g, bx, 117, fB, t);
      const neck = dog(g, dx, 118, fD, t);
      leash(g, hand, neck, t);

      // بزرگ‌نمایی nearest به تمام‌صفحه
      c.imageSmoothingEnabled = false;
      c.drawImage(g0, 0, 0, LW, LH, 0, 0, W, H);
      c.imageSmoothingEnabled = true;
      // عنوان پیکسلی
      c.font = '44px "PressStart2P-400"'; c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillStyle = '#1d3f83'; c.fillText('A WALK IN THE PARK', 44, 40);
      c.fillStyle = '#ffffff'; c.fillText('A WALK IN THE PARK', 40, 36);
    },
  };
})();
