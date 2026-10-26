import { isAdmin, readVisits, writeVisits } from './_lib.js';

// GET: xem số lượt. POST: cộng 1 lượt (web chỉ gọi 1 lần mỗi thiết bị mỗi ngày). Giáo viên đang đăng nhập không được tính.
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Sai phương thức.' });
  try {
    let count = await readVisits();
    if (req.method === 'POST' && !isAdmin(req)) {
      count += 1;
      await writeVisits(count);
    }
    res.setHeader('Cache-Control', req.method === 'GET' ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store');
    res.status(200).json({ count });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
