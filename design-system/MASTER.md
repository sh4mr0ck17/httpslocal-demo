# sh4mr0ck CTF — Hệ thống thiết kế

## Ý đồ

Blog kỹ thuật bằng tiếng Việt, phong cách biên tập tối giản kết hợp hình khối công nghệ 3D. Nội dung đọc là trung tâm; 3D là điểm nhấn có thể tạm dừng, không phủ lên chữ. Bố cục bất đối xứng nhưng tiết chế; không giả số liệu thành tích hay trạng thái hệ thống trực tiếp.

Đã tham khảo `ui-ux-pro-max` với truy vấn `cybersecurity blog dark immersive`: khuyến nghị bố cục bất đối xứng/biên tập, độ tương phản cao, điều khiển chuyển động. Điều chỉnh theo yêu cầu người dùng: bỏ màu xanh Matrix và font không tối ưu tiếng Việt; dùng bảng đỏ–đen và Be Vietnam Pro.

## Token

| Vai trò | Giá trị |
|---|---|
| Nền | `#09090b` |
| Bề mặt | `#111114` |
| Chữ chính | `#f2f0f0` |
| Chữ phụ | `#a4a0a5` |
| Chữ nhẹ | `#807b82` |
| Điểm nhấn / hành động | `#ff414a` |
| Nhãn đỏ trên nền tối | `#ff858c` |
| Viền | `#29262c` |
| Chữ tiêu đề / nội dung | Be Vietnam Pro, bản tự lưu, có ký tự Việt |
| Chữ kỹ thuật | IBM Plex Mono, bản tự lưu |

## Bố cục

- Vùng nội dung tối đa 1240px; gutter 48/32/20/18px tùy breakpoint.
- Hero hai cột: thông điệp trái; cảnh 3D phải. Điện thoại chuyển một cột.
- Bài nổi bật + lời ghi chú; lưới bài viết ba/hai/một cột.
- Trang đọc: measure giới hạn, mục lục bên cạnh trên desktop và phía trên trên mobile.
- Giao diện tiếng Việt có dấu; giữ tên dịch vụ, mã nguồn và viết tắt kỹ thuật như CTF, IDOR, RSA.

## Tương tác và khả năng tiếp cận

- SVG đồng nhất, không emoji làm icon. Nút icon có accessible name, trạng thái `aria-pressed`/`aria-expanded`.
- Focus visible, skip-link, tìm kiếm có label; `/` là phím tắt nhưng không chặn khi đang nhập.
- Bài mở bằng hash-route để refresh được trên GitHub Pages trong thư mục con; nút quay lại giữ bộ lọc.
- Không tự động gửi yêu cầu ra ngoài khi đọc. Lưu bài chỉ lưu slug trong localStorage, không tài khoản/cookie.
- Chuyển động tôn trọng `prefers-reduced-motion`; ngừng khi tab/cảnh không nhìn thấy; DPR giới hạn.
- Thiếu WebGL hoặc lỗi mô-đun vẫn giữ đồ họa SVG và nội dung blog.

## Tiêu chí bàn giao

Build thực tế, kiểm thử tìm kiếm/lọc/lưu/đọc/sao chép/deep-link, ảnh 1440px và 390px, không tràn ngang, không lỗi JS hay yêu cầu CDN ở runtime; CI và đọc lại nhánh GitHub sau push.
