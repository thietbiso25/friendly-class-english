import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin, jsonOnly, LOCAL } from './_lib.js';

export default async function handler(req, res) {
  if (!jsonOnly(req, res, 'POST')) return;
  if (!requireAdmin(req, res)) return;
  try {
    const url = req.body && req.body.url;
    if (LOCAL && typeof url === 'string' && url.startsWith('/local-files/')) {
      fs.rmSync(path.join(process.cwd(), '.local-data', 'files', path.basename(url)), { force: true });
      return res.status(200).json({ ok: true });
    }
    if (typeof url !== 'string' || !/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url)) {
      return res.status(400).json({ error: 'Link file không hợp lệ.' });
    }
    const { del } = await import('@vercel/blob');
    await del(url);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
