// 99_farm — «مزرعهٔ آفتابی»: انیمیشن پیکسلی ماریویی با کیفیت بالاتر (بوم ۴۸۰×۲۷۰، هر پیکسل=۴).
// صاحب مزرعه + سگش از جلوی طویله می‌گذرند، به گاوها و گوسفندها غذا می‌دهند.
// حرکت: ریگ دومفصلی (IK زانو) برای انسان و سگ — چرخهٔ قدم پلهٔ ثابت نیست؛
// دوربین دنبال‌کننده، پارالاکس تپه‌ها + آسیاب بادی، ذرات غذا قوسی، قلب، حباب دیالوگ فارسی.
SCENES['99_farm'] = (() => {
  const W = 1920, H = 1080, S = 4, LW = 480, LH = 270, TAU = Math.PI * 2;
  const { clamp, lerp } = U, P = PAINT;
  const WORLD = 800, GY = 236;
  const C = {
    sky0: '#5c94fc', sky1: '#7db2fd', sky2: '#b8dcfe',
    sun: '#ffd93b', sunHi: '#fff3a0', cloud: '#ffffff', cloudSh: '#cfe8f2',
    hill: '#6cc46a', hillDk: '#4aa84e', hill2: '#8ad478', trunk: '#7a4a21', trunkDk: '#5d3517',
    leaf: '#2f8f3e', leafHi: '#63c455', leafDk: '#1f6e2e',
    fence: '#f6f1e2', fenceSh: '#cfc7ae', path: '#e4c079', pathDk: '#c89b52', pathSp: '#f4dca0',
    grass: '#4aa84e', grassDk: '#37863c', grassF: '#2f7034', flower1: '#e8433c', flower2: '#ffd93b', flower3: '#f78fb8',
    barn: '#c8301c', barnDk: '#9c2415', barnTrim: '#f6f1e2', roof: '#8a1f10', silo: '#c8ccd4', siloDk: '#9aa0ac', siloTop: '#d23c32',
    hay: '#e8b84a', hayDk: '#c8963a', wood: '#a7683a', woodDk: '#7c4a24',
    skin: '#f2c79a', shirt: '#e04a3a', shirtDk: '#a83226', pant: '#2a58b4', pantDk: '#1d3f83', shoe: '#4a2c14',
    hat: '#e8c85a', hatDk: '#a8642a', beard: '#e8e4da', sack: '#a8763a', sackDk: '#7c5426',
    dog: '#c98a4b', dogDk: '#9c6a35', dogW: '#f7ead6', ear: '#6b4423', collar: '#d23c32', nose: '#20242c',
    cowW: '#f6f1e2', cowWSh: '#d8d2c0', cowP: '#8a5a2a', cowP2: '#5d3517', muzzle: '#f7a8b8', horn: '#e8e4da', udder: '#f7a8b8',
    sheepW: '#f2efe6', sheepWSh: '#d4cfc2', sheepF: '#4a4038', sheepF2: '#332c26',
    chick: '#ffd93b', chickDk: '#e8a33c', beak: '#e8722a',
    heart: '#f7568a', seed: '#ffd93b', seedDk: '#e8a33c', bird: '#33424e',
  };
  const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w, h); };
  const ln = (g, x0, y0, x1, y1, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const cir = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  // زانو: IK دومفصلی
  function ik(g, hx, hy, tx, ty, l1, l2, fwd, w, col) {
    let dx = tx - hx, dy = ty - hy, d = Math.hypot(dx, dy); const m = l1 + l2 - 0.01;
    if (d > m) { dx *= m / d; dy *= m / d; d = m; tx = hx + dx; ty = hy + dy; }
    const a = Math.atan2(dy, dx);
    const ac = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const ka = a - ac * fwd;
    const kx = hx + l1 * Math.cos(ka), ky = hy + l1 * Math.sin(ka);
    ln(g, hx, hy, kx, ky, w, col); ln(g, kx, ky, tx, ty, w * 0.85, col);
    return [kx, ky];
  }

  // ---------------- تایم‌لاین صاحب مزرعه ----------------
  const V = 48;
  const TL = [
    [0, 1.2, 'idle', 95], [1.2, 5.62, 'walk', 95], [5.62, 9.0, 'feed', 307],
    [9.0, 13.23, 'walk', 307], [13.23, 16.2, 'feed', 510], [16.2, 19.6, 'walk', 510], [19.6, 99, 'wave', 673],
  ];
  const farmAt = (t) => {
    for (const [a, b, mode, x0] of TL) if (t >= a && t < b)
      return { mode, x: mode === 'walk' ? x0 + (t - a) * V : x0, mt: t - a };
    return { mode: 'wave', x: 673, mt: t - 19.6 };
  };
  const farmX = (t) => farmAt(t).x;
  const THROWS_C = [6.6, 7.6], THROWS_S = [14.2, 15.2];

  // ---------------- لایهٔ دوردست (تپه + آسیاب بادی) ----------------
  const farBg = () => P.cached('farm_far', 640, LH, (g) => {
    px(g, 0, 150, 640, 60, C.hill2);
    for (let x = 0; x < 640; x += 2) { const h = 14 + Math.sin(x * 0.02) * 8 + Math.sin(x * 0.045 + 2) * 5; px(g, x, 168 - h, 2, h, C.hill); }
    px(g, 0, 168, 640, 40, C.hill);
    for (let x = 6; x < 640; x += 26) { const h = 8 + ((x * 13) % 6); px(g, x, 170 - h, 5, h, (x / 26) % 2 ? C.hillDk : C.leaf); }
    // درختان پراکندهٔ دوردست
    for (const [tx, ty] of [[70, 150], [210, 143], [390, 148], [560, 141]]) {
      px(g, tx, ty, 2, 8, C.trunk); cir(g, tx + 1, ty - 4, 6, C.hillDk); cir(g, tx - 2, ty - 1, 4, C.leaf); cir(g, tx + 4, ty - 1, 4, C.leaf);
    }
  });
  const windmill = (g, x, y, t) => {
    px(g, x - 3, y - 26, 6, 26, C.barnTrim); px(g, x - 4, y - 27, 8, 2, C.fenceSh);
    px(g, x - 2, y - 20, 2, 2, C.sky0);
    const a = t * 1.2;
    g.strokeStyle = C.woodDk; g.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) { const an = a + i * TAU / 4; g.beginPath(); g.moveTo(x, y - 27); g.lineTo(x + Math.cos(an) * 12, y - 27 + Math.sin(an) * 12); g.stroke(); }
    cir(g, x, y - 27, 1.6, C.barn);
  };

  // ---------------- دنیای ثابت ----------------
  const worldBg = () => P.cached('farm_world', WORLD, LH, (g) => {
    px(g, 0, 196, WORLD, 24, C.grass); px(g, 0, 196, WORLD, 1, C.grassDk);
    // مسیر خاکی
    px(g, 0, 216, WORLD, 28, C.path); px(g, 0, 216, WORLD, 1, C.pathDk); px(g, 0, 243, WORLD, 1, C.pathDk);
    const r = U.rng(7);
    for (let i = 0; i < 240; i++) px(g, r() * WORLD, 219 + r() * 22, 1, 1, r() < 0.5 ? C.pathSp : C.pathDk);
    // چمن پیش‌زمینه
    px(g, 0, 244, WORLD, LH - 244, C.grassF);
    for (let i = 0; i < 130; i++) px(g, r() * WORLD, 246 + r() * 20, 1, 1, C.grassDk);
    const fl = [C.flower1, C.flower2, C.flower3];
    for (let i = 0; i < 26; i++) { const x = 6 + ((i * 97) % (WORLD - 12)), y = 248 + ((i * 37) % 16); px(g, x, y, 1, 1, fl[i % 3]); px(g, x, y + 1, 1, 1, C.grassDk); }
    // حصار سفید با درگاه
    const gate = (x) => x > 296 && x < 322 || x > 468 && x < 492 || x > 636 && x < 660;
    for (let x = 4; x < WORLD; x += 9) if (!gate(x)) { px(g, x, 200, 2, 14, C.fence); px(g, x, 199, 2, 1, C.fence); }
    px(g, 0, 204, WORLD, 1, C.fenceSh); px(g, 0, 209, WORLD, 1, C.fenceSh);
    // طویلهٔ قرمز
    px(g, 60, 150, 100, 66, C.barn); px(g, 60, 150, 100, 3, C.barnDk);
    px(g, 52, 150, 116, 6, C.roof); px(g, 56, 144, 108, 6, C.roof); px(g, 66, 138, 88, 6, C.barnDk);
    px(g, 96, 176, 28, 40, C.barnDk); px(g, 98, 178, 24, 38, C.wood);
    ln(g, 98, 178, 122, 216, 2, C.barnTrim); ln(g, 122, 178, 98, 216, 2, C.barnTrim);
    px(g, 96, 174, 30, 2, C.barnTrim);
    px(g, 102, 156, 16, 12, C.barnDk); px(g, 104, 158, 12, 8, C.hay);           // پنجرهٔ کاه
    px(g, 66, 182, 14, 14, C.barnTrim); px(g, 68, 184, 10, 10, C.sky0);        // پنجره
    px(g, 140, 182, 14, 14, C.barnTrim); px(g, 142, 184, 10, 10, C.sky0);
    // سیلو
    px(g, 172, 128, 22, 88, C.silo); px(g, 172, 128, 4, 88, C.siloDk);
    for (let y = 136; y < 214; y += 10) px(g, 172, y, 22, 1, C.siloDk);
    px(g, 170, 122, 26, 7, C.siloTop); px(g, 174, 117, 18, 5, C.siloTop);
    // آبخوری/تشتهٔ چوبی (گاو)
    px(g, 330, 226, 26, 8, C.wood); px(g, 330, 226, 26, 2, C.woodDk); px(g, 332, 234, 3, 4, C.woodDk); px(g, 351, 234, 3, 4, C.woodDk);
    // bale های کاه
    for (const [bx, by] of [[452, 224], [466, 224], [459, 214]]) { px(g, bx, by, 14, 10, C.hay); px(g, bx, by + 3, 14, 1, C.hayDk); px(g, bx, by + 7, 14, 1, C.hayDk); px(g, bx, by, 14, 1, C.hayDk); }
    // درخت بزرگ انتهای مزرعه
    px(g, 700, 176, 7, 60, C.trunk); px(g, 700, 176, 2, 60, C.trunkDk); px(g, 692, 196, 8, 4, C.trunk);
    // تابلوی چوبی
    px(g, 744, 210, 3, 26, C.woodDk); px(g, 734, 202, 24, 10, C.wood); px(g, 734, 202, 24, 2, C.woodDk);
    px(g, 738, 207, 16, 1, C.barnTrim); px(g, 740, 209, 12, 1, C.barnTrim);
  });
  const treeCrown = (g, x, y, ph) => {
    const o = ph ? 1 : 0;
    cir(g, x + 3 + o, y - 8, 16, C.leaf); cir(g, x - 8 + o, y - 2, 12, C.leafDk); cir(g, x + 12 + o, y - 2, 12, C.leaf);
    cir(g, x + 2 + o, y - 16, 10, C.leafHi); cir(g, x - 6 + o, y + 4, 10, C.leaf); cir(g, x + 10 + o, y + 4, 10, C.leafDk);
  };

  // ---------------- صاحب مزرعه ----------------
  function farmer(g, x, y, t, st) {
    const { mode, mt } = st;
    const walking = mode === 'walk';
    const A = walking ? 1 : 0;
    const phi = walking ? (x / (2 * 12)) * 2 : 0;   // فاز از مسافت
    const L = 12 * A, liftMax = 5 * A + 1;
    const bob = -A * 1.6 * (0.5 + 0.5 * Math.cos(TAU * (2 * phi - 0.5))) + (mode === 'feed' ? Math.sin(t * 2.2) * 0.4 : 0);
    const hipY = y - 16 + bob, shY = y - 27 + bob, headY = y - 32 + bob;
    const pN = ((phi % 1) + 1) % 1, pF = ((phi + 0.5) % 1);
    const legT = (p, sx) => {
      let fx, lift;
      if (p < 0.5) { const u = p / 0.5; fx = L * (0.5 - u); lift = 0; } else { const u = (p - 0.5) / 0.5; fx = L * (u - 0.5); lift = Math.sin(Math.PI * u) * liftMax; }
      return { fx: lerp(fx, sx, 1 - A), lift };
    };
    const near = legT(pN, 2), far = legT(pF, -2);
    // دست دور
    const sw = A * 0.55 * Math.sin(TAU * phi + Math.PI);
    // حالت دست نزدیک
    let a1, bend;
    if (walking) { a1 = 0.55 * Math.sin(TAU * phi); bend = 0.5 + 0.2 * Math.sin(TAU * phi + 1); }
    else if (mode === 'feed') {
      const tc = ((t + 0.4) % 1.0 + 1.0) % 1.0;
      if (tc < 0.3) { a1 = lerp(0.5, 2.5, tc / 0.3); bend = 0.9; }
      else if (tc < 0.6) { a1 = lerp(2.5, -1.8, (tc - 0.3) / 0.3); bend = 0.25; }
      else { a1 = lerp(-1.8, 0.5, (tc - 0.6) / 0.4); bend = 0.6; }
    }
    else if (mode === 'wave') { a1 = -2.5 + 0.4 * Math.sin(t * 9); bend = 0.25; }
    else { a1 = 0.12 + 0.05 * Math.sin(t * 2); bend = 0.5; }
    // کیسهٔ علوفه پشت
    if (mode !== 'wave') { px(g, x - 8, y - 24 + bob, 5, 9, C.sack); px(g, x - 8, y - 24 + bob, 5, 2, C.sackDk); ln(g, x - 5, y - 24 + bob, x + 1, shY + 1, 1, C.sackDk); }
    // دست دور + پای دور
    { const ex = x + Math.sin(sw) * 7, ey = shY + Math.cos(sw) * 7; ln(g, x, shY, ex, ey, 2.4, C.shirtDk); ln(g, ex, ey, ex + Math.sin(sw + 0.6) * 6, ey + Math.cos(sw + 0.6) * 6, 2, C.shirtDk); }
    ik(g, x, hipY, x + far.fx, y - 2 - far.lift, 8, 8, 1, 3, C.pantDk);
    px(g, x + far.fx - 1, y - 2 - far.lift, 5, 2, C.shoe);
    // تنه: پیراهن + اورال
    px(g, x - 3, y - 27 + bob, 7, 7, C.shirt);
    px(g, x - 3, y - 21 + bob, 7, 6, C.pant); px(g, x - 2, y - 27 + bob, 1, 7, C.pant); px(g, x + 2, y - 27 + bob, 1, 7, C.pant);
    px(g, x - 1, y - 19 + bob, 3, 2, C.pantDk);
    // سر + ریش + کلاه
    cir(g, x + 1, headY, 4.6, C.skin);
    px(g, x - 2, headY + 1, 6, 3, C.beard); px(g, x + 3, headY + 1, 2, 2, C.beard);
    px(g, x + 3, headY - 1, 1, 1, C.nose);
    px(g, x - 5, headY - 4, 12, 2, C.hat); px(g, x - 3, headY - 8, 8, 4, C.hat); px(g, x - 3, headY - 5, 8, 1, C.hatDk);
    // پای نزدیک
    ik(g, x, hipY, x + near.fx, y - 2 - near.lift, 8, 8, 1, 3, C.pant);
    px(g, x + near.fx - 1, y - 2 - near.lift, 5, 2, C.shoe);
    // دست نزدیک
    const ex2 = x + Math.sin(a1) * 7, ey2 = shY + Math.cos(a1) * 7;
    ln(g, x, shY, ex2, ey2, 2.4, C.shirt);
    const h2x = ex2 + Math.sin(a1 + bend) * 6, h2y = ey2 + Math.cos(a1 + bend) * 6;
    ln(g, ex2, ey2, h2x, h2y, 2, C.shirt); cir(g, h2x, h2y, 1.4, C.skin);
    return { hand: [h2x, h2y] };
  }

  // ---------------- سگ ----------------
  function dog(g, x, y, t, sit) {
    const bob = sit ? 0 : Math.abs(Math.sin(t * 10)) * -1;
    const wag = Math.sin(t * 14) * 0.5;
    if (sit) {
      cir(g, x - 4, y - 4, 4, C.dog); px(g, x - 8, y - 2, 6, 2, C.dog);
      ln(g, x - 8, y - 2, x - 11, y, 2, C.dogDk);                       // دم روی زمین
      px(g, x + 1, y - 4, 2, 4, C.dog); px(g, x + 4, y - 4, 2, 4, C.dog); // پاهای جلو
      cir(g, x + 2, y - 9, 3.4, C.dog); px(g, x + 4, y - 10, 3, 2, C.dog); px(g, x + 7, y - 9, 1, 1, C.nose);
      px(g, x + 1, y - 12, 2, 2, C.ear); px(g, x + 3, y - 10, 1, 1, C.nose);
      px(g, x, y - 6, 3, 1, C.collar);
      return;
    }
    const ps = [0, 0.5, 0.5, 0]; // trot جفت‌های قطری
    for (let i = 0; i < 4; i++) {
      const a = 0.55 * Math.sin(TAU * (t * 3.4) + ps[i] * TAU);
      const hx = x - 5 + i * 3.4;
      ln(g, hx, y - 4 + bob, hx + Math.sin(a) * 3.4, y, 1.8, i % 2 ? C.dogDk : C.dog);
    }
    px(g, x - 6, y - 7 + bob, 12, 4, C.dog); px(g, x - 6, y - 4 + bob, 12, 1, C.dogDk);
    px(g, x - 2, y - 6 + bob, 5, 2, C.dogW);
    ln(g, x - 6, y - 7 + bob, x - 9, y - 9 + bob + wag * 2, 2, C.dogDk);  // دم بالا
    cir(g, x + 7, y - 10 + bob, 3.2, C.dog); px(g, x + 9, y - 10 + bob, 3, 2, C.dog); px(g, x + 12, y - 10 + bob, 1, 1, C.nose);
    px(g, x + 5, y - 13 + bob, 2, 2, C.ear); px(g, x + 7, y - 11 + bob, 1, 1, C.nose);
    px(g, x + 4, y - 8 + bob, 3, 1, C.collar);
  }

  // ---------------- گاو ----------------
  function cow(g, x, y, t, eat, id) {
    const tail = Math.sin(t * 2 + id) * 2;
    const chew = eat && Math.floor(t * 6) % 2;
    for (const [lx, col] of [[-11, C.cowWSh], [-5, C.cowWSh], [3, C.cowWSh], [9, C.cowWSh]])
      px(g, x + lx, y - 6, 3, 6, col);
    px(g, x - 14, y - 18, 28, 13, C.cowW); px(g, x - 14, y - 7, 28, 2, C.cowWSh);
    cir(g, x - 6, y - 13, 4, C.cowP); cir(g, x + 5, y - 10, 3, C.cowP2); cir(g, x + 9, y - 15, 2.5, C.cowP);
    ln(g, x + 14, y - 16, x + 16, y - 10 + tail, 1.4, C.cowWSh); px(g, x + 15, y - 10 + tail, 2, 2, C.cowP2); // دم
    px(g, x + 2, y - 6, 5, 3, C.udder);
    // سر: بالا یا پایین (علوفه‌خوری)
    const hy = eat ? y - 6 + (chew ? 1 : 0) : y - 16 + Math.sin(t * 1.3 + id) * 0.7;
    const hx = x - 18;
    px(g, hx, hy, 9, 7, C.cowW); px(g, hx - 1, hy + 4, 6, 3, C.muzzle);
    px(g, hx + 1, hy + 5, 1, 1, C.cowP2);
    px(g, hx + 5, hy + 1, 1, 1, C.nose);
    px(g, hx + 1, hy - 2, 2, 2, C.horn); px(g, hx + 6, hy - 2, 2, 2, C.horn);
    px(g, hx + 8, hy + 1, 2, 2, C.cowWSh);                                  // گوش
    if (eat && chew) px(g, hx - 1, hy + 7, 6, 1, C.hay);
  }

  // ---------------- گوسفند ----------------
  function sheep(g, x, y, t, eat, id, small) {
    const s = small ? 0.62 : 1;
    g.save(); g.translate(x, y); g.scale(s, s);
    const chew = eat && Math.floor(t * 7 + id) % 2;
    for (const lx of [-6, -2, 3, 6]) px(g, lx, -5, 2, 5, C.sheepF);
    cir(g, -4, -10, 5, C.sheepW); cir(g, 2, -11, 5.5, C.sheepW); cir(g, 7, -9, 4.5, C.sheepWSh); cir(g, 0, -8, 5, C.sheepW);
    cir(g, 1, -13, 3, C.sheepW);                                            // پشم بالای سر
    const hy = eat ? -4 + (chew ? 1 : 0) : -10 + Math.sin(t * 1.7 + id) * 0.6;
    px(g, -11, hy, 6, 5, C.sheepF); px(g, -11, hy + 1, 1, 1, C.sheepW);     // سر تیره + چشم
    px(g, -6, hy + 1, 2, 2, C.sheepF2);                                     // گوش
    if (eat && chew) px(g, -11, hy + 5, 4, 1, C.grassDk);
    px(g, 9, -10, 2, 2, C.sheepWSh);                                        // دم
    g.restore();
  }

  // ---------------- جوجه ----------------
  function chick(g, x, y, t, id) {
    const peck = Math.floor(t * 4 + id * 2) % 3 === 0;
    const hop = Math.floor(t * 0.4 + id) % 4 === 0 ? Math.abs(Math.sin(t * 8)) * -1 : 0;
    px(g, x, y - 3 + hop, 4, 3, id % 2 ? C.chick : C.chickDk);
    px(g, x - 1, y - 4 + hop, 2, 2, id % 2 ? C.chick : C.chickDk);
    px(g, x + (peck ? 0 : -2), y - (peck ? 2 : 3) + hop, 1, 1, C.beak);
    px(g, x, y - 4 + hop, 1, 1, C.nose);
    px(g, x, y, 1, 1, C.beak); px(g, x + 2, y, 1, 1, C.beak);
  }

  const heart = (g, x, y, a) => {
    g.globalAlpha = a;
    px(g, x + 1, y, 1, 1, C.heart); px(g, x + 3, y, 1, 1, C.heart);
    px(g, x, y + 1, 5, 2, C.heart); px(g, x + 1, y + 3, 3, 1, C.heart); px(g, x + 2, y + 4, 1, 1, C.heart);
    g.globalAlpha = 1;
  };

  // دانه‌های پرتابی (تحلیلی و قطعی)
  function seeds(g, t, tt, hx0, hy0) {
    if (t < tt || t > tt + 5) return;
    for (let i = 0; i < 12; i++) {
      const h1 = U.hash(i, tt * 10), h2 = U.hash(i, tt * 10 + 3);
      const vx = 20 + h1 * 26, vy = -(30 + h2 * 16), gr = 150;
      const tl = (vy + Math.sqrt(vy * vy + 2 * gr * (GY - 4 - hy0))) / -gr * -1;
      const tLand = (Math.sqrt(vy * vy + 2 * gr * (GY - 4 - hy0)) - vy) / gr;
      const q = t - tt;
      if (q < tLand) { px(g, hx0 + vx * q, hy0 + vy * q + 0.5 * gr * q * q, 2, 2, i % 3 ? C.seed : C.seedDk); }
      else if (q < 4.2) { px(g, hx0 + vx * tLand, GY - 3 + (h2 * 3 | 0), 2, 1.4, i % 3 ? C.seed : C.seedDk); }
    }
  }

  return {
    init() {
      U.assertGlyphs('Vazirmatn-Medium', 'مزرعهٔ آفتابی وقتِ غذا پایان یک روز در مزرعه', '99_farm عنوان');
      U.assertGlyphs('PressStart2P-400', 'SUNNY FARM', '99_farm en');
    },
    draw(c, lt0, t) {
      const g = P.cached('farm_frame', LW, LH, () => {}).getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, LW, LH);
      // آسمان
      px(g, 0, 0, LW, 90, C.sky0); px(g, 0, 90, LW, 50, C.sky1); px(g, 0, 140, LW, 60, C.sky2);
      // خورشید
      const sx = 428, sy = 26;
      for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) if (dx * dx + dy * dy <= 30) px(g, sx + dx, sy + dy, 1, 1, dx + dy < -4 ? C.sunHi : C.sun);
      if (Math.floor(t * 2) % 2 === 0) { px(g, sx - 9, sy, 2, 1, C.sunHi); px(g, sx + 8, sy, 2, 1, C.sunHi); px(g, sx, sy - 9, 1, 2, C.sunHi); px(g, sx, sy + 8, 1, 2, C.sunHi); }
      // ابرها
      for (const [cx0, cy, sp, w] of [[40, 22, 2.4, 26], [180, 40, 1.6, 32], [320, 14, 3, 20]]) {
        const cx = ((cx0 + t * sp) % (LW + 60)) - 30;
        px(g, cx, cy, w, 5, C.cloud); px(g, cx + 4, cy - 3, w - 10, 3, C.cloud); px(g, cx, cy + 4, w, 1, C.cloudSh);
      }
      // پرنده‌ها
      for (let i = 0; i < 2; i++) {
        const bx = LW - ((t * (7 + i * 2)) % (LW + 40)) + 14, by = 30 + i * 12 + (Math.floor(Math.sin(t * 3 + i)) | 0);
        const f = Math.floor(t * 6 + i) % 2;
        px(g, bx, by, 1, 1, C.bird); px(g, bx + 1, by - (f ? 1 : 0), 1, 1, C.bird); px(g, bx + 2, by, 1, 1, C.bird);
      }
      // دوربین
      const st = farmAt(t), fx = st.x;
      const cq = clamp((fx - 105) / 565, 0, 1), camX = Math.round(320 * cq * cq * (3 - 2 * cq));
      // تپه‌ها + آسیاب بادی (پارالاکس)
      g.save(); g.translate(-Math.round(camX * 0.4), 0);
      g.drawImage(farBg(), 0, 0);
      windmill(g, 300, 168, t); // جای ثابت در فضای لایهٔ دور
      g.restore();
      // دنیا
      g.save(); g.translate(-camX, 0);
      g.drawImage(worldBg(), 0, 0);
      treeCrown(g, 703, 172, Math.floor(t * 1.5) % 2);
      // جوجه‌ها
      chick(g, 128, 236, t, 1); chick(g, 146, 240, t, 2); chick(g, 205, 238, t, 3);
      // گاوها
      const cowEat = t > 6.9 && t < 11.5;
      cow(g, 376, GY, t, cowEat, 1); cow(g, 408, GY, t, cowEat, 2);
      // گوسفندها
      const shEat = t > 14.5 && t < 18.6;
      sheep(g, 536, GY, t, shEat, 1); sheep(g, 572, GY, t, shEat, 2); sheep(g, 602, GY, t, shEat, 3); sheep(g, 620, GY, t, shEat, 4, true);
      // سگ
      const dogSit = st.mode !== 'walk';
      dog(g, fx + 20, GY, t, dogSit);
      // صاحب مزرعه
      farmer(g, fx, GY, t, st);
      // دانه‌ها
      for (const tt of THROWS_C) seeds(g, t, tt, farmX(tt) + 6, GY - 26);
      for (const tt of THROWS_S) seeds(g, t, tt, farmX(tt) + 6, GY - 26);
      // قلب‌ها
      const hearts = [[376, 8.4], [408, 9.3], [536, 16.0], [572, 16.8], [620, 17.4]];
      for (const [hx, ht] of hearts) if (t > ht && t < ht + 1.4) { const q = (t - ht) / 1.4; heart(g, hx - 2, GY - 30 - q * 12, 1 - q); }
      g.restore();

      // بزرگ‌نمایی nearest
      c.imageSmoothingEnabled = false;
      c.drawImage(g, 0, 0, LW, LH, 0, 0, W, H);
      c.imageSmoothingEnabled = true;

      // ---- متن‌ها (وضوح بالا) ----
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.font = '28px "PressStart2P-400"';
      c.fillStyle = '#1d3f83'; c.fillText('SUNNY FARM', 44, 40);
      c.fillStyle = '#ffffff'; c.fillText('SUNNY FARM', 41, 37);
      if (t < 3.6) {
        const a = clamp(t / 0.7) * clamp((3.6 - t) / 0.6);
        c.save(); c.globalAlpha = a; c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = '92px "Vazirmatn-Medium"';
        c.fillStyle = 'rgba(29,63,131,.55)'; c.fillText('مزرعهٔ آفتابی', W / 2 + 4, 300 + 4);
        c.fillStyle = '#ffffff'; c.fillText('مزرعهٔ آفتابی', W / 2, 300);
        c.font = '40px "Vazirmatn-Regular"'; c.fillStyle = '#1d3f83';
        c.fillText('یک روز در مزرعه — صاحب مزرعه و سگش', W / 2, 390);
        c.restore();
      }
      const bubble = (wx, wy, txt) => {
        const bx = (wx - camX) * S, by = wy * S;
        c.save(); c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = '34px "Vazirmatn-Medium"';
        const w = c.measureText(txt).width + 56;
        c.fillStyle = '#fff'; c.strokeStyle = '#1d3f83'; c.lineWidth = 4;
        c.beginPath();
        if (c.roundRect) c.roundRect(bx - w / 2, by - 66, w, 66, 18); else c.rect(bx - w / 2, by - 66, w, 66);
        c.fill(); c.stroke();
        c.beginPath(); c.moveTo(bx - 10, by); c.lineTo(bx + 10, by); c.lineTo(bx, by + 18); c.closePath(); c.fill();
        c.fillStyle = '#1d3f83'; c.fillText(txt, bx, by - 33);
        c.restore();
      };
      if (t > 6.1 && t < 8.6) bubble(fx + 2, GY - 48, 'وقتِ غذا!');
      if (t > 14.0 && t < 16.4) bubble(fx + 2, GY - 48, 'بفرمایید گوسفندها!');
      if (t > 19.9) {
        const a = clamp((t - 19.9) / 0.8);
        c.save(); c.globalAlpha = a; c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = '84px "Vazirmatn-Medium"'; c.fillStyle = '#1d3f83'; c.fillText('پایان', W / 2 + 4, H / 2 - 40 + 4);
        c.fillStyle = '#ffffff'; c.fillText('پایان', W / 2, H / 2 - 40);
        c.font = '38px "Vazirmatn-Regular"'; c.fillStyle = '#1d3f83';
        c.fillText('گاو و گوسفند سیر، دل‌ها خوش', W / 2, H / 2 + 40);
        c.restore();
      }
    },
  };
})();
