// 97_park25d — «قدم زدن در پارک» نسخهٔ ۲.۵بعدی: پارالاکس چندلایه، نور و سایهٔ نرم،
// پنج نما با برش (واید → کلوزآپ پسر → کلوزآپ سگ → زاویهٔ پایین → نمای پایانی) + حباب دیالوگ فارسی.
// بدون getImageData؛ همه‌چیز وکتوری/گرادیانی روی Canvas.
SCENES['97_park25d'] = (() => {
  const W = 1920, H = 1080, P = PAINT, TAU = Math.PI * 2, GY = 900;
  const { clamp, lerp } = U;

  // ---------- نماها ----------
  const SHOTS = [
    { id: 'wide', t0: 0, t1: 6 },
    { id: 'boy', t0: 6, t1: 11 },
    { id: 'dog', t0: 11, t1: 15.5 },
    { id: 'low', t0: 15.5, t1: 20 },
    { id: 'end', t0: 20, t1: 26 },
  ];
  const walk = t => 300 + t * 105;                       // مسیر پسر در جهان
  function camAt(t) {
    const k = SHOTS.findIndex(s => t < s.t1), s = SHOTS[k < 0 ? SHOTS.length - 1 : k];
    const lt = t - s.t0, wx = walk(t), dx = wx + 170;
    let cam = { x: wx - 220, y: 820, z: 1 + 0.05 * U.ease.inOut(clamp(lt / 5)), rot: 0, p: 1 };
    if (s.id === 'boy') cam = { x: wx + 30, y: 745, z: 2.35, rot: 0.012 * Math.sin(t * 0.7), p: 1 };
    if (s.id === 'dog') cam = { x: dx - 10, y: 828, z: 2.7, rot: -0.015, p: 1 };
    if (s.id === 'low') cam = { x: wx + 70, y: 715, z: 1.55, rot: -0.055, p: 1 };
    if (s.id === 'end') cam = { x: wx + 90, y: 790, z: 1.2 - 0.28 * U.ease.inOut(clamp(lt / 5)), rot: 0, p: 1 };
    cam.x += Math.sin(t * 1.1) * 3; cam.y += Math.sin(t * 1.7 + 2) * 2;   // نفسِ دوربین
    return { cam, shot: s, k, lt };
  }
  // لایه با ضریب پارالاکس p
  const layer = (c, cam, p, fn) => {
    c.save(); c.translate(W / 2, H / 2); c.scale(cam.z, cam.z); c.rotate(cam.rot || 0);
    c.translate(-(cam.x * p + 960 * (1 - p)), -(cam.y * p + 560 * (1 - p)));
    fn(); c.restore();
  };
  const vis = (cam, p, m = 200) => { const cx = cam.x * p + 960 * (1 - p), hw = W / 2 / cam.z + m; return [cx - hw, cx + hw]; };

  // ---------- اجزای جهان ----------
  function clouds(c, cam, t) {
    const [a, b] = vis(cam, 0.12, 400);
    for (let i = Math.floor(a / 640); i <= Math.ceil(b / 640); i++) {
      const h = U.hash(i, 7), x = i * 640 + h * 300 + t * (10 + h * 8), y = 120 + U.hash(i, 3) * 220, s = 0.8 + h * 0.7;
      c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = 0.92;
      blobs(c, '#ffffff', [[0, 0, 90, 34], [-70, 12, 60, 26], [75, 12, 66, 26], [10, -26, 55, 26]]);
      c.fillStyle = 'rgba(160,200,225,.5)'; c.beginPath(); c.ellipse(0, 22, 95, 14, 0, 0, TAU); c.fill();
      c.restore();
    }
  }
  function hills(c, cam) {
    const [a, b] = vis(cam, 0.2, 600);
    c.fillStyle = '#bfe3c0'; c.beginPath(); c.moveTo(a, 700);
    for (let x = a; x <= b; x += 40) c.lineTo(x, 640 - Math.sin(x * 0.004) * 60 - Math.sin(x * 0.0013 + 2) * 40);
    c.lineTo(b, 700); c.closePath(); c.fill();
    c.fillStyle = '#9ed3a4'; c.beginPath(); c.moveTo(a, 720);
    for (let x = a; x <= b; x += 40) c.lineTo(x, 690 - Math.sin(x * 0.003 + 5) * 46);
    c.lineTo(b, 720); c.closePath(); c.fill();
  }
  function treeline(c, cam) {
    const [a, b] = vis(cam, 0.45, 400);
    for (let i = Math.floor(a / 210); i <= Math.ceil(b / 210); i++) {
      const h = U.hash(i, 11), x = i * 210 + h * 90, s = 0.8 + h * 0.6, y = 760;
      blobs(c, h > 0.5 ? '#6fbf7c' : '#5cab6d', [[x, y - 60 * s, 70 * s, 62 * s], [x - 46 * s, y - 30 * s, 44 * s, 38 * s], [x + 48 * s, y - 32 * s, 46 * s, 40 * s]]);
      c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.ellipse(x - 18 * s, y - 82 * s, 30 * s, 18 * s, -0.4, 0, TAU); c.fill();
    }
  }
  function midworld(c, cam, t) {
    const [a, b] = vis(cam, 0.75, 400);
    // حصار
    c.fillStyle = '#f8f4e8'; c.fillRect(a, 812, b - a, 10); c.fillRect(a, 842, b - a, 8);
    for (let x = Math.floor(a / 46) * 46; x <= b; x += 46) { c.fillRect(x, 796, 10, 74); c.beginPath(); c.moveTo(x, 796); c.lineTo(x + 5, 786); c.lineTo(x + 10, 796); c.fill(); }
    c.fillStyle = 'rgba(90,110,90,.25)'; c.fillRect(a, 868, b - a, 5);
    for (let i = Math.floor(a / 760); i <= Math.ceil(b / 760); i++) {
      const h = U.hash(i, 21);
      if (h < 0.45) bench(c, i * 760 + 300); else lamp(c, i * 760 + 320, t);
      bigtree(c, i * 760 + h * 200, t, i);
    }
  }
  const bench = (c, x) => {
    c.fillStyle = 'rgba(40,60,40,.2)'; c.beginPath(); c.ellipse(x + 70, 872, 110, 12, 0, 0, TAU); c.fill();
    c.fillStyle = '#8a5a30'; c.fillRect(x, 800, 150, 12); c.fillRect(x, 764, 150, 10);
    c.fillStyle = '#a76b3a'; c.fillRect(x, 796, 150, 6); c.fillRect(x, 760, 150, 5);
    c.fillStyle = '#5d3a1c'; c.fillRect(x + 10, 812, 10, 58); c.fillRect(x + 130, 812, 10, 58); c.fillRect(x + 4, 764, 8, 46); c.fillRect(x + 138, 764, 8, 46);
  };
  const lamp = (c, x, t) => {
    c.fillStyle = 'rgba(40,60,40,.2)'; c.beginPath(); c.ellipse(x, 872, 26, 8, 0, 0, TAU); c.fill();
    c.fillStyle = '#3c4c58'; c.fillRect(x - 5, 700, 10, 170); c.fillRect(x - 14, 866, 28, 8);
    c.fillStyle = '#57707e'; c.beginPath(); c.arc(x, 692, 16, 0, TAU); c.fill();
    c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(x, 692, 9, 0, TAU); c.fill();
  };
  const bigtree = (c, x, t, i) => {
    const sw = Math.sin(t * 0.8 + i) * 4;
    c.fillStyle = 'rgba(40,60,40,.22)'; c.beginPath(); c.ellipse(x, 872, 120, 14, 0, 0, TAU); c.fill();
    c.fillStyle = '#6d4423'; c.beginPath(); c.moveTo(x - 16, 872); c.quadraticCurveTo(x - 10, 760, x - 6, 700); c.lineTo(x + 8, 700); c.quadraticCurveTo(x + 12, 770, x + 20, 872); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,240,200,.25)'; c.fillRect(x + 6, 720, 5, 140);
    blobs(c, '#3e9150', [[x + sw, 655, 104, 80], [x + sw, 640, 108, 92], [x - 70 + sw, 690, 66, 56], [x + 74 + sw, 686, 70, 58]]);
    blobs(c, '#57b066', [[x - 20 + sw, 610, 66, 52], [x + 52 + sw, 650, 52, 44]]);
    c.fillStyle = 'rgba(255,255,220,.3)'; c.beginPath(); c.ellipse(x - 34 + sw, 586, 34, 20, -0.4, 0, TAU); c.fill();
  };
  function ground(c, cam) {
    const [a, b] = vis(cam, 1, 300);
    const g = c.createLinearGradient(0, 862, 0, 1500);
    g.addColorStop(0, '#e8c98d'); g.addColorStop(0.25, '#dfba78'); g.addColorStop(1, '#c99b5c');
    c.fillStyle = g; c.fillRect(a, 862, b - a, 900);
    c.fillStyle = 'rgba(120,90,50,.35)'; c.fillRect(a, 862, b - a, 6);
    for (let i = Math.floor(a / 90); i <= Math.ceil(b / 90); i++) { const h = U.hash(i, 31); c.fillStyle = h > 0.5 ? 'rgba(255,240,200,.5)' : 'rgba(140,100,60,.4)'; c.beginPath(); c.ellipse(i * 90 + h * 60, 900 + U.hash(i, 5) * 160, 5 + h * 5, 3, 0, 0, TAU); c.fill(); }
  }
  function foreground(c, cam, t) {
    const [a, b] = vis(cam, 1.3, 300);
    const g = c.createLinearGradient(0, 980, 0, 1700);
    g.addColorStop(0, '#3f9a4b'); g.addColorStop(1, '#2a7437');
    c.fillStyle = g; c.beginPath(); c.moveTo(a, 1700); c.lineTo(a, 1030);
    for (let x = a; x <= b; x += 60) c.quadraticCurveTo(x + 30, 1006 + Math.sin(x * 0.05) * 8, x + 60, 1030);
    c.lineTo(b, 1700); c.closePath(); c.fill();
    for (let i = Math.floor(a / 34); i <= Math.ceil(b / 34); i++) {
      const h = U.hash(i, 41), x = i * 34 + h * 20, swn = Math.sin(t * 1.6 + i) * 3;
      c.strokeStyle = h > 0.5 ? '#2f8039' : '#46a452'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, 1046 + h * 40); c.quadraticCurveTo(x + swn, 1020 + h * 40, x + swn * 1.6, 1006 + h * 40); c.stroke();
      if (i % 7 === 0) { c.fillStyle = ['#e8433c', '#ffd93b', '#f78fb8'][i % 3]; c.beginPath(); c.arc(x + swn * 1.6, 1002 + h * 40, 6, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + swn * 1.6 - 2, 1000 + h * 40, 2, 0, TAU); c.fill(); }
    }
  }

  // ---------- شخصیت‌ها ----------
  const capsule = (c, x0, y0, x1, y1, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  const blobs = (c, col, list) => { c.fillStyle = col; for (const e of list) { c.beginPath(); c.ellipse(e[0], e[1], e[2], e[3], e[4] || 0, 0, TAU); c.fill(); } };
  function boyDraw(c, x, t) {
    const ph = t * 7.2, bob = Math.sin(ph * 2) * 3, lean = 0.06;
    const hy = GY - 78 + bob;                                    // لگن
    c.fillStyle = 'rgba(60,40,20,.25)'; c.beginPath(); c.ellipse(x - 26, GY + 4, 62, 10, 0, 0, TAU); c.fill();   // سایهٔ بلند
    for (const s of [1, -1]) {                                    // پاها
      const a = ph + (s > 0 ? 0 : Math.PI);
      const dx = Math.sin(a) * 34, lift = Math.max(0, Math.cos(a)) * 14;
      capsule(c, x, hy, x + dx, GY - 6 - lift, 16, s > 0 ? '#2a58b4' : '#1d3f83');
      c.fillStyle = s > 0 ? '#20242c' : '#141820'; c.beginPath(); c.roundRect(x + dx - 6, GY - 12 - lift, 26, 10, 5); c.fill();
    }
    c.save(); c.translate(x, hy); c.rotate(lean);
    const tg = c.createLinearGradient(-20, -70, 24, 0); tg.addColorStop(0, '#f0604c'); tg.addColorStop(1, '#c23a2c');
    c.fillStyle = tg; c.beginPath(); c.roundRect(-19, -72, 40, 78, 16); c.fill();
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.roundRect(6, -70, 13, 70, 8); c.fill();          // نور لبه
    capsule(c, -8, -60, -16 - Math.sin(ph) * 10, -26 + Math.cos(ph) * 6, 12, '#c23a2c');                     // دست عقب
    c.fillStyle = '#f2c79a'; c.beginPath(); c.arc(-16 - Math.sin(ph) * 10, -24 + Math.cos(ph) * 6, 6, 0, TAU); c.fill();
    c.restore();
    const hx = x + 6, hyy = hy - 88;                                // سر
    c.fillStyle = '#f6cf9f'; c.beginPath(); c.arc(hx, hyy, 24, 0, TAU); c.fill();
    c.fillStyle = '#4a2c14'; c.beginPath(); c.arc(hx - 2, hyy - 6, 24, Math.PI * 0.95, Math.PI * 2.02); c.fill();
    c.beginPath(); c.roundRect(hx - 26, hyy - 16, 14, 20, 7); c.fill();
    c.fillStyle = '#20242c'; c.beginPath(); c.arc(hx + 10, hyy - 2, 2.6, 0, TAU); c.fill();
    c.strokeStyle = '#a05a3a'; c.lineWidth = 2.4; c.beginPath(); c.arc(hx + 8, hyy + 8, 7, 0.2, Math.PI * 0.8); c.stroke();
    c.fillStyle = 'rgba(240,120,110,.4)'; c.beginPath(); c.arc(hx + 2, hyy + 8, 4, 0, TAU); c.fill();
    const hand = [x + 30, hy - 40];                                 // دست جلو (قلاده)
    capsule(c, x + 8, hy - 62, hand[0], hand[1], 12, '#e04a3a');
    c.fillStyle = '#f2c79a'; c.beginPath(); c.arc(hand[0], hand[1], 6, 0, TAU); c.fill();
    return hand;
  }
  function dogDraw(c, x, t, close) {
    const ph = t * 10.5, bob = Math.sin(ph) * 2, by = GY - 34 + bob;
    c.fillStyle = 'rgba(60,40,20,.25)'; c.beginPath(); c.ellipse(x - 20, GY + 4, 58, 9, 0, 0, TAU); c.fill();
    for (let i = 0; i < 4; i++) {
      const a = ph + i * Math.PI / 2 * 2, lx = x - 30 + i * 20;
      capsule(c, lx, by + 8, lx + Math.sin(a) * 12, GY - 2 - Math.max(0, Math.cos(a)) * 8, 9, i % 2 ? '#9c6a35' : '#c98a4b');
    }
    const bg = c.createLinearGradient(x - 40, by - 20, x + 40, by + 20); bg.addColorStop(0, '#d69a58'); bg.addColorStop(1, '#a9743c');
    const wag = Math.sin(t * 12) * 0.5;
    capsule(c, x - 36, by - 4, x - 56, by - 24 - wag * 14, 11, '#9c6a35');   // دم (پشت بدن)
    c.fillStyle = bg; c.beginPath(); c.ellipse(x, by, 44, 24, 0, 0, TAU); c.fill();
    c.fillStyle = '#f7ead6'; c.beginPath(); c.ellipse(x + 14, by + 10, 22, 12, 0, 0, TAU); c.fill();
    // سر
    const hx = x + 48, hyy = by - 22 + Math.sin(ph + 1) * 2;
    c.fillStyle = '#c98a4b'; c.beginPath(); c.arc(hx, hyy, 19, 0, TAU); c.fill();
    c.fillStyle = '#d69a58'; c.beginPath(); c.roundRect(hx + 6, hyy - 4, 22, 14, 7); c.fill();
    c.fillStyle = '#20242c'; c.beginPath(); c.arc(hx + 27, hyy - 1, 4, 0, TAU); c.fill();
    c.fillStyle = '#6b4423'; c.beginPath(); c.ellipse(hx - 6, hyy - 12, 8, 12, 0.5, 0, TAU); c.fill();
    c.fillStyle = '#20242c'; c.beginPath(); c.arc(hx + 6, hyy - 5, 2.4, 0, TAU); c.fill();
    if (close) { c.fillStyle = '#f78fb8'; c.beginPath(); c.ellipse(hx + 16, hyy + 12 + Math.sin(t * 9) * 1.5, 5, 8, 0.2, 0, TAU); c.fill(); }   // زبان
    c.fillStyle = '#d23c32'; c.fillRect(hx - 14, hyy + 10, 20, 7);   // قلاده
    return [hx - 8, hyy + 13];
  }

  // ---------- حباب دیالوگ و متن ----------
  function bubble(c, x, y, text, pop) {
    const s = U.ease.outBack(clamp(pop));
    c.save(); c.translate(x, y); c.scale(s, s);
    c.font = '42px "Vazirmatn-Medium"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl';
    const w = c.measureText(text).width + 64;
    c.fillStyle = 'rgba(40,40,60,.28)'; c.beginPath(); c.roundRect(-w / 2 + 4, -66, w, 66, 24); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.roundRect(-w / 2, -70, w, 66, 24); c.fill();
    c.beginPath(); c.moveTo(-14, -6); c.lineTo(14, -6); c.lineTo(-4, 22); c.closePath(); c.fill();
    c.fillStyle = '#2b3440'; c.fillText(text, 0, -36);
    c.restore();
  }
  const txt = (c, t, str, x, y, size, col, align = 'center') => {
    c.save(); c.font = `${size}px "Vazirmatn-Medium"`; c.textAlign = align; c.textBaseline = 'middle'; c.direction = 'rtl';
    c.fillStyle = 'rgba(30,40,60,.45)'; c.fillText(str, x + 3, y + 4);
    c.fillStyle = col; c.globalAlpha = clamp(t); c.fillText(str, x, y); c.restore();
  };

  return {
    init() {
      U.assertGlyphs('Vazirmatn-Medium', 'چه هوای قشنگی! مگه نه، راکو؟ هوف! قدم‌زدن در پارک پایان یک بعدازظهر آفتابی', '97_park25d');
    },
    draw(c, lt0, t) {
      const { cam, shot, lt } = camAt(t);
      const wx = walk(t), dxp = wx + 170;
      // آسمان
      const sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#69b7e8'); sky.addColorStop(0.55, '#a5daf5'); sky.addColorStop(0.8, '#dff4fb'); sky.addColorStop(1, '#f6efd8');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      // خورشید + هاله
      const sunX = 1500 - cam.x * 0.04, sunY = 200;
      const gl = c.createRadialGradient(sunX, sunY, 10, sunX, sunY, 420);
      gl.addColorStop(0, 'rgba(255,240,170,.9)'); gl.addColorStop(0.25, 'rgba(255,225,140,.35)'); gl.addColorStop(1, 'rgba(255,225,140,0)');
      c.fillStyle = gl; c.fillRect(sunX - 430, sunY - 430, 860, 860);
      c.fillStyle = '#ffdf6b'; c.beginPath(); c.arc(sunX, sunY, 58, 0, TAU); c.fill();
      c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(sunX - 12, sunY - 12, 30, 0, TAU); c.fill();

      layer(c, cam, 0.12, () => clouds(c, cam, t));
      layer(c, cam, 0.2, () => hills(c, cam));
      layer(c, cam, 0.45, () => treeline(c, cam));
      layer(c, cam, 0.75, () => midworld(c, cam, t));
      layer(c, cam, 1, () => {
        ground(c, cam);
        const neck = dogDraw(c, dxp, t, shot.id === 'dog');
        const hand = boyDraw(c, wx, t);
        c.strokeStyle = '#c23a2c'; c.lineWidth = 4; c.beginPath(); c.moveTo(...hand);
        c.quadraticCurveTo((hand[0] + neck[0]) / 2, Math.max(hand[1], neck[1]) + 46 + Math.sin(t * 2) * 4, ...neck); c.stroke();
      });
      layer(c, cam, 1.3, () => foreground(c, cam, t));

      // ---------- رنگ و نور نما ----------
      if (shot.id === 'low' || shot.id === 'end') {
        const warm = shot.id === 'end' ? 0.16 + 0.1 * clamp(lt / 4) : 0.12;
        c.fillStyle = `rgba(255,140,60,${warm})`; c.fillRect(0, 0, W, H);
        const fl = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, 900);
        fl.addColorStop(0, 'rgba(255,200,110,.5)'); fl.addColorStop(1, 'rgba(255,200,110,0)');
        c.fillStyle = fl; c.fillRect(0, 0, W, H);
      }
      const vg = c.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 0.95);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,30,50,.32)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);

      // ---------- برش بین نماها ----------
      if (lt < 0.18 && shot.t0 > 0) { c.fillStyle = `rgba(255,255,255,${0.5 * (1 - lt / 0.18)})`; c.fillRect(0, 0, W, H); }

      // ---------- دیالوگ و عنوان ----------
      if (shot.id === 'wide') {
        txt(c, clamp(lt / 0.8) * clamp((shot.t1 - t) / 0.5), 'قدم‌زدن در پارک', W / 2, 170, 92, '#ffffff');
        txt(c, clamp((lt - 0.5) / 0.8) * clamp((shot.t1 - t) / 0.5), 'یک بعدازظهر آفتابی', W / 2, 268, 44, '#eaf6ff');
      }
      if (shot.id === 'boy') bubble(c, W / 2 - 140, 300, 'چه هوای قشنگی! مگه نه، راکو؟', (lt - 0.9) / 0.45);
      if (shot.id === 'dog') bubble(c, W / 2 + 160, 330, 'هوف! هوف!', (lt - 0.8) / 0.4);
      if (shot.id === 'end') txt(c, clamp((lt - 4.2) / 0.8), 'پایان', W / 2, 330, 110, '#fff6e0');
      c.drawImage(P.grain('p25', 0.03, [40, 35, 25], 0.16), 0, 0);
    },
  };
})();
