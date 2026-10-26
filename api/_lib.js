import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const LOCAL = process.env.LOCAL_STORE === '1';
const LOCAL_DIR = path.join(process.cwd(), '.local-data');
const LOCAL_FILE = path.join(LOCAL_DIR, 'data.json');
const BLOB_KEY = 'class-data/data.json';
export const COLS = ['topics', 'vocab', 'podcasts', 'videos', 'games', 'photos'];

/* s: chuỗi ngắn, l: chuỗi dài, n: số, b: đúng/sai, f: link file đã tải lên, u: link http(s) */
const SCHEMA = {
  topics:   { name: 's', note: 's', order: 'n' },
  vocab:    { en: 's', vi: 's', t: 's', ex: 's', exvi: 's', icon: 's', audioId: 'f', audioExId: 'f', order: 'n' },
  podcasts: { en: 's', vi: 's', t: 's', script: 'l', audioId: 'f', order: 'n' },
  videos:   { en: 's', vi: 's', t: 's', len: 's', url: 'u', assetId: 'f', order: 'n' },
  games:    { kind: 's', name: 's', desc: 's', url: 'u', items: 'l', speak: 'b', order: 'n' },
  photos:   { cap: 's', assetId: 'f', order: 'n' }
};

export const emptyData = () => ({ topics: {}, vocab: {}, podcasts: {}, videos: {}, games: {}, photos: {} });

function isFileUrl(v) {
  if (v === '') return true;
  if (LOCAL && v.startsWith('/local-files/')) return true;
  try { const u = new URL(v); return u.protocol === 'https:' && u.hostname.endsWith('.blob.vercel-storage.com'); }
  catch { return false; }
}
function isHttpUrl(v) {
  if (v === '') return true;
  try { const u = new URL(v); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; }
}

/* Chỉ giữ các trường hợp lệ, cắt độ dài, bỏ mọi thứ lạ. */
export function sanitize(input) {
  const out = emptyData();
  for (const col of COLS) {
    const src = input && typeof input[col] === 'object' && input[col] ? input[col] : {};
    let n = 0;
    for (const [id, doc] of Object.entries(src)) {
      if (!/^[A-Za-z0-9_-]{1,60}$/.test(id) || !doc || typeof doc !== 'object') continue;
      if (++n > 2000) break;
      const clean = {};
      for (const [k, type] of Object.entries(SCHEMA[col])) {
        let v = doc[k];
        if (type === 'n') clean[k] = Number.isFinite(v) ? v : 0;
        else if (type === 'b') clean[k] = v !== false;
        else {
          v = typeof v === 'string' ? v : '';
          v = v.slice(0, type === 'l' ? 20000 : 600);
          if (type === 'f' && !isFileUrl(v)) v = '';
          if (type === 'u' && !isHttpUrl(v)) v = '';
          clean[k] = v;
        }
      }
      out[col][id] = clean;
    }
  }
  return out;
}

export async function readData() {
  if (LOCAL) {
    try { return sanitize(JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'))); } catch { return emptyData(); }
  }
  const { list } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
  if (!blobs.length) return emptyData();
  const r = await fetch(blobs[0].url + '?t=' + Date.now());
  if (!r.ok) throw new Error('Không đọc được dữ liệu (' + r.status + ')');
  return sanitize(await r.json());
}

export async function writeData(data) {
  const body = JSON.stringify(data);
  if (body.length > 1500000) throw new Error('Dữ liệu quá lớn');
  if (LOCAL) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
    fs.writeFileSync(LOCAL_FILE, body);
    return;
  }
  const { put } = await import('@vercel/blob');
  await put(BLOB_KEY, body, {
    access: 'public', contentType: 'application/json',
    addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60
  });
}

/* ---- đếm lượt truy cập (file riêng để không đụng dữ liệu bài đăng) ---- */
const VISIT_KEY = 'class-data/visits.json';
const VISIT_FILE = path.join(LOCAL_DIR, 'visits.json');
export async function readVisits() {
  if (LOCAL) {
    try { return Math.max(0, Number(JSON.parse(fs.readFileSync(VISIT_FILE, 'utf8')).count) || 0); } catch { return 0; }
  }
  const { list } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: VISIT_KEY, limit: 1 });
  if (!blobs.length) return 0;
  const r = await fetch(blobs[0].url + '?t=' + Date.now());
  if (!r.ok) return 0;
  try { return Math.max(0, Number((await r.json()).count) || 0); } catch { return 0; }
}
export async function writeVisits(count) {
  const body = JSON.stringify({ count });
  if (LOCAL) { fs.mkdirSync(LOCAL_DIR, { recursive: true }); fs.writeFileSync(VISIT_FILE, body); return; }
  const { put } = await import('@vercel/blob');
  await put(VISIT_KEY, body, {
    access: 'public', contentType: 'application/json',
    addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60
  });
}

/* ---- đăng nhập admin bằng cookie ký ---- */
const COOKIE = 'fce_admin';
function secret() { return process.env.SESSION_SECRET || ''; }
function sign(payload) { return crypto.createHmac('sha256', secret()).update(payload).digest('base64url'); }

export function makeCookie() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 30 * 24 * 3600 * 1000 })).toString('base64url');
  const flags = 'Path=/; HttpOnly; SameSite=Lax; Max-Age=' + 30 * 24 * 3600 + (LOCAL ? '' : '; Secure');
  return `${COOKIE}=${payload}.${sign(payload)}; ${flags}`;
}
export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` + (LOCAL ? '' : '; Secure');
}
export function isAdmin(req) {
  if (!secret()) return false;
  const m = (req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '='));
  if (!m) return false;
  const [payload, sig] = m.slice(COOKIE.length + 1).split('.');
  if (!payload || !sig) return false;
  const want = sign(payload);
  const a = Buffer.from(sig), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}
export function checkPassword(pw) {
  const real = process.env.ADMIN_PASSWORD || '';
  if (!real || typeof pw !== 'string') return false;
  const a = crypto.createHash('sha256').update(pw).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
}
export function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  res.status(401).json({ error: 'Cần đăng nhập giáo viên.' });
  return false;
}
export function jsonOnly(req, res, method) {
  if (req.method !== method) { res.status(405).json({ error: 'Sai phương thức.' }); return false; }
  return true;
}
