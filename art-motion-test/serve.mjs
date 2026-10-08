#!/usr/bin/env node
// Live preview server: serves the skill's Canvas engine (vendored at ../../huashu-art-motion)
// with this repo's film files overlaid on top, plus the rendered outputs under /out/.
//   node serve.mjs [port]     (default 8080, binds 0.0.0.0)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ENGINE, FILM_DIR, HERE, resolveUrl, MIME, hasUrl } from './paths.mjs';

const PORT = +(process.argv[2] || process.env.PORT || 8080);

const OVERLAYS = {
  '/': path.join(FILM_DIR, 'portal.html'),
  '/portal.html': path.join(FILM_DIR, 'portal.html'),
};

const srv = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);
  try {
    let file;
    if (OVERLAYS[p]) file = OVERLAYS[p];
    else if (p.startsWith('/out/') || p.startsWith('/renders/')) file = path.join(HERE, p.slice(1));
    else if (hasUrl(p)) file = resolveUrl(p);
    else { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('404 ' + p); return; }
    const st = fs.statSync(file);
    res.writeHead(200, {
      'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'content-length': st.size,
      'cache-control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain' }); res.end(String(e && e.message || e));
  }
});
srv.listen(PORT, '0.0.0.0', () => console.log(`art-motion preview on http://0.0.0.0:${PORT}/  (films: /index.html?film=test | test_lite | gallery ; outputs: /out/)`));
