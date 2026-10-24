import { handleUpload } from '@vercel/blob/client';
import { isAdmin } from './_lib.js';

// Tải file lên thẳng Vercel Blob từ trình duyệt (không bị giới hạn 4,5 MB của hàm).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sai phương thức.' });
  try {
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!isAdmin(req)) throw new Error('Cần đăng nhập giáo viên.');
        return {
          allowedContentTypes: ['audio/*', 'video/*'],
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true
        };
      },
      onUploadCompleted: async () => {}
    });
    res.status(200).json(json);
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
}
