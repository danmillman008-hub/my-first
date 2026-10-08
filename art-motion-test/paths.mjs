// Where the skill lives, and how film files written in THIS repo are overlaid onto the
// skill's engine directory (so `index.html?film=<name>` and the headless renderer both
// find them without copying the 97 MB vendored skill into git).
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ENGINE = path.resolve(HERE, '../..', 'huashu-art-motion/scripts/engine');
export const FILM_DIR = path.join(HERE, 'film');

if (!fs.existsSync(path.join(ENGINE, 'engine.js'))) {
  throw new Error(`skill engine not found at ${ENGINE}\nRun:  git clone https://github.com/alchaincyf/huashu-art-motion ${path.resolve(ENGINE, '../..')}`);
}

// url (as the engine would request it, e.g. "eras_test.js" or "scenes/99_arena.js")
// -> absolute file path. Film dir wins, engine dir is the fallback.
export function resolveUrl(url) {
  let p = String(url).split('?')[0].split('#')[0].replace(/^\/+/, '');
  const local = path.join(FILM_DIR, p);
  if (fs.existsSync(local) && fs.statSync(local).isFile()) return local;
  const eng = path.join(ENGINE, p);
  if (fs.existsSync(eng) && fs.statSync(eng).isFile()) return eng;
  throw Object.assign(new Error(`404 ${p}`), { code: 404, urlPath: p });
}

export function hasUrl(url) { try { resolveUrl(url); return true; } catch { return false; } }

export const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.wav': 'audio/wav',
  '.md': 'text/markdown; charset=utf-8',
};
