import { checkPassword, makeCookie, jsonOnly } from './_lib.js';

export default async function handler(req, res) {
  if (!jsonOnly(req, res, 'POST')) return;
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return res.status(500).json({ error: 'Chưa đặt ADMIN_PASSWORD và SESSION_SECRET trong Vercel.' });
  }
  const pw = req.body && req.body.password;
  if (!checkPassword(pw)) {
    await new Promise(r => setTimeout(r, 800)); // làm chậm việc đoán mật khẩu
    return res.status(401).json({ error: 'Mật khẩu chưa đúng.' });
  }
  res.setHeader('Set-Cookie', makeCookie());
  res.status(200).json({ ok: true });
}
