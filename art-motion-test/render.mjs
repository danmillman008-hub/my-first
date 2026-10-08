#!/usr/bin/env node
// Headless renderer for the huashu-art-motion engine.
//
// The skill's own scripts/engine/render.py drives Playwright Chromium and pipes frames to
// ffmpeg. Neither Chromium nor ffmpeg exists in this sandbox (and their download hosts are
// unreachable), so this file replaces both halves: the engine runs on @napi-rs/canvas (Skia)
// under a small DOM shim, and frames are piped into a static ffmpeg build.
//
//   node render.mjs --film test --out out/test.mp4 [--fps 30] [--scale 0.5] [--from 0 --to 4]
//   node render.mjs --film test --stills 0.2,1.5 --out out/stills
//   node render.mjs --solo 09_postimp --stills 0.3 --out out/stills
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync, spawn } from 'node:child_process';
import { installShim } from './shim.mjs';
import { HERE, resolveUrl } from './paths.mjs';

// ---------------- args ----------------
const argv = process.argv.slice(2);
const get = (k, d = undefined) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1]; };
const has = (k) => argv.includes('--' + k);
const FILM = get('film', '');
const OUT = get('out', 'renders/film.mp4');
const FPS = +get('fps', 30);
const SCALE = +get('scale', 1);
const T0 = get('from') == null ? 0 : +get('from');
const T1 = get('to') == null ? null : +get('to');
const STILLS = get('stills');
const SOLO = get('solo');
const CRF = +get('crf', 20);

// ---------------- ffmpeg ----------------
function findFfmpeg() {
  if (process.env.FFMPEG && fs.existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return 'ffmpeg'; } catch {}
  const probes = [
    path.resolve(HERE, '../../.venv-media/bin/python'),
    'python3',
  ];
  for (const py of probes) {
    try {
      const p = execFileSync(py, ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (p && fs.existsSync(p)) return p;
    } catch {}
  }
  throw new Error('no ffmpeg: `pip install imageio-ffmpeg` (or set FFMPEG=/path/to/ffmpeg)');
}

// ---------------- boot the engine ----------------
const LIBS = ['fonts', 'util', 'paint', 'brush', 'render', 'post', 'rig', 'rig_huashu', 'kit',
  'motion', 'camera', 'diagram', 'typo', 'chart', 'ui', 'collage', 'toon'].map(n => `lib/${n}.js`);
const filmSrc = FILM.startsWith('demos/') ? `${FILM}/eras.js` : FILM ? `eras_${FILM}.js` : 'eras.js';
const SCRIPTS = [...LIBS, filmSrc, 'transitions.js', 'scenes/index.js', 'engine.js'];

const W = 1920, H = 1080;
const canvas = installShim({ width: W, height: H });
const pageErrors = [];
const realError = console.error;
console.error = (...a) => { pageErrors.push(a.join(' ')); realError(...a); };

for (const s of SCRIPTS) {
  const file = resolveUrl(s);
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
  if (s === filmSrc) pruneFonts();
}

// The skill ships CJK display faces (NotoSansSC ×4, NotoSerifSC/JP, LXGWWenKai) that cost
// ~700 MB of Skia typeface memory when registered; this sandbox OOMs around 1 GB. If the
// film's sources contain no CJK text, drop them before boot.
function pruneFonts() {
  const texts = [fs.readFileSync(resolveUrl(filmSrc), 'utf8')];
  for (const e of globalThis.ERAS || []) { try { texts.push(fs.readFileSync(resolveUrl(`scenes/${e.id}.js`), 'utf8')); } catch {} }
  const cjk = /[⺀-鿿豈-﫿！-｠]/.test(texts.join(''));
  if (!cjk) {
    const before = globalThis.FONT_FACES.length;
    globalThis.FONT_FACES = globalThis.FONT_FACES.filter(f => !/^(NotoSansSC|NotoSerifSC|NotoSerifJP|LXGW)/.test(f.family));
    console.log(`fonts: ${globalThis.FONT_FACES.length}/${before} kept (no CJK text in film)`);
  }
}
if (globalThis.__bootErrors && globalThis.__bootErrors.length) {
  throw new Error('scene load failed:\n' + globalThis.__bootErrors.join('\n'));
}
const deadline = Date.now() + 180000;
while (!globalThis.__ready && !globalThis.__bootFailed) {
  if (Date.now() > deadline) throw new Error('boot timeout');
  await new Promise(r => setTimeout(r, 25));
}
if (globalThis.__bootFailed) throw new Error('boot failed:\n' + globalThis.__bootFailed);

const TOTAL = globalThis.__total;
const t1 = T1 == null ? TOTAL : Math.min(T1, TOTAL);
console.log(`film=${FILM || '(default eras.js)'}  duration=${TOTAL.toFixed(3)}s  rendering ${T0}..${t1}s @${FPS}fps  scale=${SCALE}`);

// ---------------- render ----------------
const grab = async (t) => { if (globalThis.prepare) await globalThis.prepare(t); globalThis.renderFrame(t); };

if (STILLS != null) {
  fs.mkdirSync(OUT, { recursive: true });
  const times = STILLS.split(',').map(Number);
  for (const t of times) {
    if (SOLO) globalThis.renderSolo(SOLO, t, { counter: true });
    else await grab(Math.min(t, TOTAL));
    const f = path.join(OUT, `${SOLO || FILM || 'film'}_${String(t).replace('.', '_')}s.png`);
    fs.writeFileSync(f, canvas.toBuffer('image/png'));
    console.log('still', f);
  }
} else {
  const ff = findFfmpeg();
  fs.mkdirSync(path.dirname(path.resolve(OUT)) || '.', { recursive: true });
  // frames go out as a PNG stream: toBuffer() is leak-free, getImageData() is not.
  const args = ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-vcodec', 'png', '-framerate', String(FPS), '-i', '-'];
  const vf = [];
  if (SCALE !== 1) vf.push(`scale=${Math.round(W * SCALE)}:${Math.round(H * SCALE)}:flags=lanczos`);
  if (OUT.endsWith('.gif')) vf.push(`fps=15,split[a][b];[a]palettegen[p];[b][p]paletteuse`);
  if (vf.length) args.push('-vf', vf.join(','));
  if (!OUT.endsWith('.gif')) args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-g', String(FPS), '-movflags', '+faststart');
  args.push(OUT);
  console.log('ffmpeg:', ff);
  const proc = spawn(ff, args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => { proc.on('exit', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))); });

  const n = Math.round((t1 - T0) * FPS);
  const t00 = Date.now();
  for (let i = 0; i < n; i++) {
    await grab(T0 + i / FPS);
    const buf = canvas.toBuffer('image/png');
    if (!proc.stdin.write(buf)) await new Promise(r => proc.stdin.once('drain', r));
    if (i % 30 === 0 || i === n - 1) process.stdout.write(`\r  frame ${i + 1}/${n}  ${(((i + 1) / (FPS || 1)) || 0).toFixed(2)}s  ${(((i + 1) / ((Date.now() - t00) / 1000))).toFixed(1)} fps   `);
  }
  process.stdout.write('\n');
  proc.stdin.end();
  await done;
  console.log('wrote', OUT, (fs.statSync(OUT).size / 1e6).toFixed(2) + ' MB');
}

// The skill treats any page console.error as a failed render (render.py exits non-zero),
// so keep that contract.
if (pageErrors.length) {
  realError(`\n${pageErrors.length} console.error(s) during render — the skill counts this as a failed render.`);
  process.exit(1);
}
