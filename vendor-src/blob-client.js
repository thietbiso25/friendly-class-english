// Được gói thành public/blob-client.js khi Vercel build (npm run build).
import { upload } from '@vercel/blob/client';
window.BlobClient = { upload };
