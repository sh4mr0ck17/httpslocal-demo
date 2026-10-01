# Tài nguyên bên thứ ba

## Three.js 0.186.1 — giấy phép MIT

Nguồn cung cấp: bộ `three.js-master.zip` của chủ repo. Chỉ nhập hai mô-đun đã biên dịch và giấy phép; không chép thư mục ví dụ, mô hình hoặc toàn bộ ZIP vào Git.

| Tệp gốc trong ZIP | Tệp trong repo | SHA-256 |
|---|---|---|
| `three.js-master/build/three.module.js` | `vendor/three.module.js` | `9052042d676cb0fdc1ddfefe193053f34b7ac0513a616fdac4535d49987812ea` |
| `three.js-master/build/three.core.js` | `vendor/three.core.js` | `9edde002b066a9a05676a6127f67735b62baf399bdea529f2f7e31657da769e6` |
| `three.js-master/LICENSE` | `vendor/LICENSE.three.txt` | `8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc` |

Bản thu gọn cho trình duyệt nằm ở `assets/scene.js`, tạo từ `src/scene.js` bằng esbuild. Giấy phép MIT được giữ ở `vendor/LICENSE.three.txt` và trong bản phân phối. Thư viện không tải từ CDN.

## Phông chữ — SIL Open Font License 1.1

- **Be Vietnam Pro**: The Be Vietnam Pro Project Authors. Bản phân phối trên Google Fonts; giấy phép đầy đủ ở `assets/fonts/LICENSE-bevietnampro.txt`.
- **IBM Plex Mono**: IBM Corp. Bản phân phối trên Google Fonts; giấy phép đầy đủ ở `assets/fonts/LICENSE-ibmplexmono.txt`.

Các tệp TTF được chuyển định dạng WOFF2 bằng FontTools, không sửa thiết kế chữ. `scripts/download-fonts.py` ghi lại URL nguồn, xác nhận bộ ký tự Việt và tái tạo tệp WOFF2. Công cụ này chỉ cần khi thay/tải lại font; việc build thông thường dùng các tệp đã lưu trong repo.

## Biểu tượng và đồ họa

Biểu tượng giao diện SVG và đồ họa minh họa bài viết được dựng cho blog; không dùng hình ảnh từ kho ví dụ Three.js. Dấu GitHub là biểu trưng GitHub, dùng để liên kết tới GitHub theo nhận diện của dịch vụ.

## Công cụ phát triển

esbuild và Playwright chỉ dùng cho build/kiểm thử, không tải thêm mã từ bên thứ ba khi người đọc mở blog. Giấy phép của các gói được cung cấp bởi chính các gói npm.
