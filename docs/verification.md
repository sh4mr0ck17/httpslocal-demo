# Kết quả kiểm chứng trước xuất bản

## Bản dựng

- `npm run check` thực thi thành công: **8 unit test + 10 nhóm kiểm thử Playwright**.
- Build thực tế: **10 bài viết, 7 chuyên mục**, 10 slug duy nhất, 1 bài nổi bật.
- `npm audit --audit-level=high`: **found 0 vulnerabilities** tại thời điểm kiểm tra.
- `git diff --check`: không phát hiện lỗi whitespace.
- Font Be Vietnam Pro chứa đầy đủ các ký tự chữ tiếng Việt có trong `index.html` và `content/posts.json`.
- Three.js **0.186.1** dùng đúng các mô-đun trích từ ZIP của chủ repo; SHA-256 tại `THIRD_PARTY_NOTICES.md`.

## Trình duyệt đã chạy

Chromium 150 trên Linux, Playwright 1.63.0. Kiểm thử trên bản `dist/`, dưới tiền tố `/httpslocal-demo/` như GitHub Pages; GPU software WebGL dùng cho môi trường kiểm thử.

1. Trang chủ tiếng Việt, số liệu từ dữ liệu thật, canvas WebGL 2 thực sự xuất hiện.
2. Không có lỗi JavaScript/console/CSP trong tải trang chuẩn; không có yêu cầu runtime tới CDN hoặc origin ngoài website.
3. Tìm kiếm có dấu/không dấu cho cùng kết quả; kiểm thử trạng thái rỗng, xóa bộ lọc, `/` và `Escape`.
4. Lọc cả 7 chuyên mục, sắp xếp theo thời lượng đọc.
5. Lưu bài, lọc đã lưu, đọc lại sau refresh, bỏ lưu.
6. Mở đủ 10 bài, xác nhận tiêu đề/số mục/mục lục, focus và deep-link; refresh không 404.
7. Mục lục giữ trang đọc; sao chép mã và liên kết được đối chiếu với clipboard thật.
8. Tạm dừng/tiếp tục/phát xung 3D; phát xung bị vô hiệu khi đã tạm dừng.
9. 375/390/768/1024px không tràn ngang, menu mobile mở/đóng và điều hướng được; desktop 1440px.
10. Giảm chuyển động khởi tạo tạm dừng; thiếu WebGL dùng SVG và vẫn đọc đủ bài.
11. HTML trong dữ liệu không được thực thi; slug không tồn tại có thông báo; tải JSON lỗi có nút thử lại hoạt động.

Ảnh thực tế do kiểm thử tạo ở `test-results/evidence/`: `hero-1440.png`, `desktop-1440.png`, `mobile-390.png`, `article-desktop.png`. Báo cáo tại `playwright-report/`. Các tệp này được loại khỏi Git và đính kèm trong artifact CI.

## Sửa lỗi đã phát hiện

- SVG sprite ngoài tệp cần `fill: none; stroke: currentColor` trên SVG host; đã kiểm tra lại ảnh và computed style.
- Tìm kiếm nhiều từ là AND trên tập nội dung, không phải bộ lọc chuyên mục. Test đối chiếu tiếng Việt có/không dấu và truy vấn RSA cụ thể, không giả định từ khóa rộng chỉ có một kết quả.
- Chuyển động tạm dừng không được phát xung hoặc báo thành công giả.
- Không dispose scene khi trang đi vào back/forward cache; sự kiện ẩn trang tự ngừng RAF.
- Giao diện mobile có khoảng cách giữa hai câu khi ẩn dấu xuống dòng trong hero.
- Nhãn liên kết GitHub dùng “Xem mã nguồn”, không mặc nhiên cấp giấy phép mới cho mã của chủ repo.

## Độ tương phản token đã tính

| Chữ / nền | Tỷ lệ |
|---|---:|
| `#f2f0f0` / `#09090b` | 17.52:1 |
| `#a4a0a5` / `#111114` | 7.32:1 |
| `#807b82` / `#111114` | 4.55:1 |
| `#ff858c` / `#111114` | 8.07:1 |
| `#09090b` / `#ff414a` | 5.79:1 |

Đây là phép đo cặp token, không phải chứng nhận WCAG cho toàn website. Các dòng mã, thẻ và trạng thái vẫn có kiểm thử bàn phím và kiểm tra trực quan riêng.

## Giới hạn

Blog tĩnh, lưu bài cục bộ; không có CMS/đăng nhập/bình luận. Bài là ghi chép kỹ thuật biên soạn, không phải writeup thi đấu có flag đã xác minh. Metadata từng bài cập nhật phía client, chưa prerender SEO riêng. Không đổi thiết lập bảo mật hay cơ chế Pages đang có của repo.
