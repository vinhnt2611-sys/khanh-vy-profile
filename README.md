# Khánh Vy — Hồ sơ cá nhân

Trang giới thiệu Nguyễn Đặng Khánh Vy, với màu hồng pastel và đầy đủ sáu phần, 30 câu hỏi từ bài tự đánh giá và định hướng thương hiệu cá nhân.

Website: https://vinhnt2611-sys.github.io/khanh-vy-profile/

## Cách xem và chỉnh sửa

Mở `index.html` trực tiếp bằng trình duyệt. File đã nhúng ảnh, font và mã JavaScript, có thể xem ngoại tuyến.

- `template.html`: bố cục và nội dung giới thiệu.
- `content.txt`: toàn bộ bài viết gốc, được giữ nguyên khi dựng trang.
- `theme.css`, `chapters.css`: giao diện hồng pastel và hiệu ứng các chương.
- `app.js`: menu, điều hướng, câu hỏi mở rộng và chuyển chương.
- `fonts.css`: font Be Vietnam Pro đã nhúng, hỗ trợ tiếng Việt ở năm độ đậm.

Sau khi sửa nguồn, chạy bằng Node.js 20 trở lên:

```sh
node build.mjs
```

Chỉ cần chạy `node prepare-fonts.mjs` khi muốn tải lại font. Lệnh này cần kết nối Internet; việc dựng trang từ các file sẵn có không cần tải thư viện.

## Các chương trượt ngang

Trên màn hình lớn đủ chiều cao, cuộn trang để chuyển lần lượt sáu chương. Có thể dùng các nút chọn chương, nút trước/sau hoặc phím mũi tên khi đang ở vùng nội dung. Các câu trả lời dài có vùng cuộn riêng.

Trên điện thoại, màn hình thấp hoặc khi bật giảm chuyển động, các chương dùng thanh cuộn ngang và thao tác vuốt. Khi in, sáu chương trở thành nội dung dọc và mở toàn bộ câu trả lời.

## Xuất bản

GitHub Pages phục vụ nhánh `main`, thư mục gốc. Sau khi dựng lại `index.html`, commit và push thay đổi để cập nhật website. File `.nojekyll` giữ nguyên nội dung HTML tĩnh.

## Nguồn hình ảnh và font

- Ảnh thư viện: [Richard Stachmann / Unsplash](https://unsplash.com/es/fotos/una-estanteria-llena-de-muchos-libros-en-una-biblioteca-0Wp92SJp9G8).
- [Be Vietnam Pro / Google Fonts](https://fonts.google.com/specimen/Be+Vietnam+Pro), giấy phép SIL Open Font License trong `fonts/OFL.txt` và `fonts.css`.
