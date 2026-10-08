// Minimal browser shim so the skill's Canvas engine can run under plain Node.
// The engine needs: canvas 2d, Path2D, DOMMatrix, Image, FontFace/document.fonts,
// synchronous XHR (scene loading), fetch + DecompressionStream (glyph cmaps), performance.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import napi, { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { resolveUrl, HERE } from './paths.mjs';

const FONT_CACHE = path.join(HERE, '.cache/fonts');
fs.mkdirSync(FONT_CACHE, { recursive: true });

// ---- WOFF1 -> TTF. Skia (which @napi-rs/canvas uses) does not read WOFF1, and every
// font shipped by the skill is .woff. WOFF1 is just an sfnt with zlib-deflated tables.
export function woffToTtf(buf) {
  if (buf.readUInt32BE(0) !== 0x774f4646) return buf;            // already a raw sfnt
  const flavor = buf.readUInt32BE(4);
  const n = buf.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < n; i++) {
    const o = 44 + i * 20;
    const tag = buf.toString('latin1', o, o + 4);
    const off = buf.readUInt32BE(o + 4), comp = buf.readUInt32BE(o + 8);
    const orig = buf.readUInt32BE(o + 12), sum = buf.readUInt32BE(o + 16);
    const raw = buf.subarray(off, off + comp);
    tables.push({ tag, sum, data: comp < orig ? zlib.inflateSync(raw) : Buffer.from(raw) });
  }
  let size = 12 + 16 * n;
  for (const t of tables) { t.off = size; size += t.data.length; size = (size + 3) & ~3; }
  const out = Buffer.alloc(size);
  out.writeUInt32BE(flavor, 0); out.writeUInt16BE(n, 4);
  let pow = 1, exp = 0; while (pow * 2 <= n) { pow *= 2; exp++; }
  out.writeUInt16BE(pow * 16, 6); out.writeUInt16BE(exp, 8); out.writeUInt16BE(n * 16 - pow * 16, 10);
  tables.forEach((t, i) => {
    const o = 12 + i * 16;
    out.write(t.tag, o, 'latin1');
    out.writeUInt32BE(t.sum, o + 4); out.writeUInt32BE(t.off, o + 8); out.writeUInt32BE(t.data.length, o + 12);
    t.data.copy(out, t.off);
  });
  return out;
}

function readBuf(url) { return fs.readFileSync(resolveUrl(url)); }

// ---- Image: browser src/onload/decode semantics on top of napi's native loader
// (native src accepts a file path and fires onload; width/height are native getters).
class ImageShim extends napi.Image {
  set src(v) {
    try { super.src = resolveUrl(v); }
    catch (e) { queueMicrotask(() => (this.onerror ? this.onerror(e) : console.error('[image]', v, e.message))); }
  }
  get src() { return super.src; }
}

class FontFaceShim {
  constructor(family, src, desc) { this.family = family; this.src = src; this.desc = desc || {}; this.status = 'unloaded'; }
  async load() {
    const url = /url\(["']?([^"')]+)["']?\)/.exec(this.src)[1];
    const file = path.join(FONT_CACHE, this.family.replace(/[^\w.-]/g, '_') + '.ttf');
    if (!fs.existsSync(file)) fs.writeFileSync(file, woffToTtf(readBuf(url)));
    const ok = GlobalFonts.registerFromPath(file, this.family);
    if (!ok) console.error('[font] could not register', this.family);
    this.status = 'loaded';
    return this;
  }
}

class XHR {
  constructor() { this.status = 0; this.responseText = ''; }
  open(_m, url) { this._url = url; }
  send() { try { this.responseText = fs.readFileSync(resolveUrl(this._url), 'utf8'); this.status = 200; } catch { this.status = 404; this.responseText = ''; } }
}

const el = () => ({ style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, addEventListener() {}, appendChild() {} });

// P.strokes/P.dabs read getImageData(1920x1080) ≈ 8 MB on every call; the napi-rs native
// buffers are not reclaimed quickly and ~5 reads/frame leaked ~100 MB/frame. Cache one
// snapshot per canvas, invalidated on any pixel-mutating call.
function wrapCtx(ctx) {
  let snap = null;
  const KEEP = new Set(['getImageData', 'measureText', 'save', 'restore', 'translate', 'scale', 'rotate', 'setTransform', 'transform', 'clip', 'resetTransform', 'closePath']);
  ctx.__wrapped = true;
  return new Proxy(ctx, {
    get(t, prop, recv) {
      const v = Reflect.get(t, prop, recv);
      if (prop === 'getImageData') return (x, y, w, h) => {
        if (snap && snap.x === x && snap.y === y && snap.w === w && snap.h === h) return snap.img;
        let img;
        if (w * h > 250000) {
          if (process.env.SHIM_FAKE_READ) { const z = new Uint8ClampedArray(w * h * 4); z.fill(128); return { data: z, width: w, height: h }; }
          // native getImageData leaks its buffer in @napi-rs/canvas; read at 1/4 res and
          // nearest-upsample into a GC-managed ImageData (callers only sample colors).
          const S = 8, lw = Math.max(2, Math.round(w / S)), lh = Math.max(2, Math.round(h / S));
          const lo = t.getImageData(x, y, lw, lh);
          const ld = lo.data, data = new Uint8ClampedArray(w * h * 4);
          for (let yy = 0; yy < h; yy++) {
            const sy = Math.min(lh - 1, (yy / h * lh) | 0) * lw, o0 = yy * w * 4;
            for (let xx = 0; xx < w; xx++) {
              const s = (sy + Math.min(lw - 1, (xx / w * lw) | 0)) * 4, o = o0 + xx * 4;
              data[o] = ld[s]; data[o + 1] = ld[s + 1]; data[o + 2] = ld[s + 2]; data[o + 3] = ld[s + 3];
            }
          }
          img = { data, width: w, height: h };   // plain object: napi ImageData ctor leaks native memory
          snap = { x, y, w, h, img };
        } else img = t.getImageData(x, y, w, h);
        return img;
      };
      if (typeof v === 'function') return (...a) => { if (!KEEP.has(prop)) snap = null; return v.apply(t, a); };
      return v;
    },
    set(t, prop, val) { t[prop] = val; return true; },
  });
}
{
  const orig = napi.Canvas.prototype.getContext;
  const PROX = new WeakMap();                    // scenes key their caches by ctx identity
  napi.Canvas.prototype.getContext = function (kind, ...rest) {
    const c = orig.call(this, kind, ...rest);
    if (kind !== '2d' || c.__wrapped) return c;
    let p = PROX.get(c);
    if (!p) { p = wrapCtx(c); PROX.set(c, p); }
    return p;
  };
}

export function installShim({ width = 1920, height = 1080 } = {}) {
  const canvas = createCanvas(width, height);
  const els = { c: canvas, scrub: el(), tt: el(), play: el() };

  globalThis.window = globalThis;
  globalThis.self = globalThis;
  globalThis.Path2D = napi.Path2D;
  globalThis.DOMMatrix = napi.DOMMatrix;
  globalThis.DOMPoint = napi.DOMPoint;
  globalThis.DOMRect = napi.DOMRect;
  globalThis.ImageData = napi.ImageData;
  globalThis.Image = ImageShim;
  globalThis.FontFace = FontFaceShim;
  globalThis.XMLHttpRequest = XHR;
  globalThis.location = { search: '?render=1', href: 'http://localhost/index.html?render=1' };
  globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 16);
  globalThis.cancelAnimationFrame = clearTimeout;
  globalThis.document = {
    createElement: (tag) => { if (String(tag).toLowerCase() !== 'canvas') return el(); return createCanvas(1, 1); },
    getElementById: (id) => (els[id] || (els[id] = el())),
    fonts: { add() {}, check: () => true, ready: Promise.resolve(), load: async () => [] },
    body: { classList: { add() {}, remove() {} }, style: {}, appendChild() {} },
    documentElement: { style: {} },
    addEventListener() {}, write() {},
  };
  const _fetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (typeof url === 'string' && !/^[a-z]+:/i.test(url)) return new Response(new Blob([readBuf(url)]));
    return _fetch(url);
  };
  return canvas;
}
