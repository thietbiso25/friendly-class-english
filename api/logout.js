import { clearCookie, jsonOnly } from './_lib.js';

export default function handler(req, res) {
  if (!jsonOnly(req, res, 'POST')) return;
  res.setHeader('Set-Cookie', clearCookie());
  res.status(200).json({ ok: true });
}
