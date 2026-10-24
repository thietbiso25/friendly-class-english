// Máy chủ thử trên máy tính: npm run dev  ->  http://localhost:3000
// Dữ liệu và file lưu trong thư mục .local-data (không dùng Vercel Blob). Mật khẩu thử: demo
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isAdmin } from './api/_lib.js';

const ROOT = process.cwd();
const PORT = process.env.PORT || 3000;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.aac': 'audio/aac', '.mp4': 'video/mp4', '.webm': 'video/webm' };

function readBody(req) {
  return new Promise((resolve) => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => resolve(Buffer.concat(c))); });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.status = (n) => { res.statusCode = n; return res; };
  res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
  try {
    if (url.pathname === '/api/local-upload' && req.method === 'POST') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Cần đăng nhập giáo viên.' });
      const buf = await readBody(req);
      const name = Date.now().toString(36) + '-' + path.basename(url.searchParams.get('name') || 'file').replace(/[^A-Za-z0-9._-]+/g, '-');
      fs.mkdirSync(path.join(ROOT, '.local-data', 'files'), { recursive: true });
      fs.writeFileSync(path.join(ROOT, '.local-data', 'files', name), buf);
      return res.json({ url: '/local-files/' + name });
    }
    if (url.pathname.startsWith('/api/')) {
      const name = url.pathname.slice(5).replace(/[^a-z-]/g, '');
      const file = path.join(ROOT, 'api', name + '.js');
      if (name.startsWith('_') || !fs.existsSync(file)) return res.status(404).json({ error: 'Không có' });
      const mod = await import(pathToFileURL(file).href);
      req.query = Object.fromEntries(url.searchParams);
      if (req.method === 'POST') {
        const raw = await readBody(req);
        try { req.body = raw.length ? JSON.parse(raw.toString()) : {}; } catch { req.body = {}; }
      }
      return await mod.default(req, res);
    }
    let rel = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    let base = ROOT + '/public';
    if (rel.startsWith('/local-files/')) { base = ROOT + '/.local-data/files'; rel = rel.slice(12); }
    const file = path.normalize(path.join(base, rel));
    if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end('Not found'); }
    const range = req.headers.range, size = fs.statSync(file).size, type = MIME[path.extname(file)] || 'application/octet-stream';
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range); const s = m[1] ? +m[1] : 0, e = m[2] ? +m[2] : size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${s}-${e}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1 });
      return fs.createReadStream(file, { start: s, end: e }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    res.statusCode = 500; res.end(String(e.stack || e));
  }
});
server.listen(PORT, () => console.log('Mở http://localhost:' + PORT + '  (mật khẩu giáo viên: ' + (process.env.ADMIN_PASSWORD || '?') + ')'));
