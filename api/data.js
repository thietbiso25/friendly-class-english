import { readData } from './_lib.js';

export default async function handler(req, res) {
  try {
    const data = await readData();
    // Học sinh: lưu đệm ngắn để đỡ tốn lượt đọc. Giáo viên gọi kèm ?t=... để lấy bản mới nhất.
    if (req.query && req.query.t) res.setHeader('Cache-Control', 'no-store');
    else res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
