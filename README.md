# Friendly Class English

Web tiếng Anh giao tiếp cho lớp chủ nhiệm. Giáo viên đăng, sửa, xóa từ vựng (kèm ghi âm), video, podcast, trò chơi và chủ đề. Học sinh vào bằng link thường, không cần đăng nhập.

## Đưa lên Vercel (làm một lần)

1. **Đưa mã lên GitHub.** Tạo một kho mới (repository) trên github.com, rồi kéo toàn bộ nội dung thư mục này vào bằng nút *Add file > Upload files*. Giữ nguyên các thư mục `api`, `public`, `vendor-src`.
2. **Nối với Vercel.** Vào vercel.com > *Add New > Project*, chọn kho vừa tạo, bấm *Deploy*. Giữ nguyên cài đặt (Framework: Other). Lần deploy đầu có thể chưa chạy đủ vì chưa có kho lưu trữ, cứ làm tiếp bước 3 và 4.
3. **Tạo kho lưu file và dữ liệu.** Trong dự án trên Vercel, vào tab *Storage > Create Database > Blob*, đặt tên tùy ý, chọn quyền truy cập **Public**, rồi nối với dự án. Vercel tự thêm biến `BLOB_READ_WRITE_TOKEN`.
4. **Đặt mật khẩu giáo viên.** Vào *Settings > Environment Variables*, thêm 2 biến:
   - `ADMIN_PASSWORD`: mật khẩu bạn dùng để đăng nhập.
   - `SESSION_SECRET`: một chuỗi ngẫu nhiên dài ít nhất 32 ký tự (gõ bừa chữ và số).
5. **Deploy lại.** Vào tab *Deployments*, chọn lần deploy mới nhất > *Redeploy*.

## Cách dùng

- Mở web, kéo xuống cuối trang, bấm **Đăng nhập giáo viên**, nhập mật khẩu. Mục **Giáo viên** sẽ hiện trên thanh menu.
- Có 5 tab: Từ vựng, Video, Podcast, Trò chơi, Chủ đề. Mỗi mục đều có Sửa và Xóa.
- Ghi âm: m4a, mp3, wav, ogg, aac, mp4 hoặc webm, tối đa 100 MB mỗi file.
- Video: dán link YouTube/TikTok, hoặc tải file mp4/webm lên.
- Học sinh thấy nội dung mới sau khoảng 1 đến 2 phút (web lưu đệm ngắn để tiết kiệm lượt đọc).
- Từ của hôm nay được chọn ngẫu nhiên theo ngày từ kho từ vựng.

## Thử trên máy tính (không bắt buộc)

Cần Node 20 trở lên. Chạy `npm install` rồi `npm run dev`, mở http://localhost:3000, mật khẩu thử là `demo`. Dữ liệu thử lưu trong thư mục `.local-data`.

## Lưu ý

- File ghi âm và video có link công khai (ai có link đều xem được), nhưng link rất khó đoán và chỉ hiện trên web của lớp.
- Gói Vercel miễn phí có hạn mức lưu trữ và lượt đọc. Lớp nhỏ thường dùng thoải mái.
- Dữ liệu từ vựng nằm trong một file `class-data/data.json` trong Blob. Chỉ một giáo viên nên đăng bài cùng lúc.
