import { requireAdmin, jsonOnly, sanitize, writeData } from './_lib.js';

export default async function handler(req, res) {
  if (!jsonOnly(req, res, 'POST')) return;
  if (!requireAdmin(req, res)) return;
  try {
    await writeData(sanitize(req.body && req.body.data));
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
