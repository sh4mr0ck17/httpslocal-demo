# sh4mr0ck · Blog CTF tiếng Việt

Blog CTF & an toàn thông tin bằng **tiếng Việt**, tông **đỏ–đen**, có cảnh **Three.js 3D** tương tác. Dùng JavaScript mô-đun và website tĩnh; không cần cơ sở dữ liệu, tài khoản hay máy chủ ứng dụng.

- Website GitHub Pages: **https://sh4mr0ck17.github.io/httpslocal-demo/**
- Tác giả: [sh4mr0ck17](https://github.com/sh4mr0ck17)

## Có gì trong blog?

- Giao diện, thông báo, điều hướng, mục lục và nội dung đọc bằng tiếng Việt có dấu.
- Cảnh mạng lưới 3D đỏ với lõi hình học, quỹ đạo, chuyển động nhẹ và nút **Phát xung / Tạm dừng 3D**.
- 10 ghi chép kỹ thuật thuộc 7 chuyên mục; không gắn nhãn thành tích hay lời giải cuộc thi chưa được xác minh.
- Tìm kiếm không phân biệt dấu; lọc chuyên mục; sắp xếp mới nhất/cũ nhất/đọc nhanh nhất.
- Lưu bài để đọc sau trong **localStorage của trình duyệt**. Không tài khoản, không đồng bộ máy chủ.
- Trang đọc riêng với mục lục, sao chép mã, sao chép liên kết, bài liên quan và thanh tiến độ đọc.
- Bố cục đáp ứng điện thoại/máy tính; phím `/` mở tìm kiếm, `Escape` đóng menu hoặc xóa từ khóa đang nhập.
- Tôn trọng giảm chuyển động; tự ngừng 3D khi khuất màn hình/tab ẩn; có SVG dự phòng khi không hỗ trợ WebGL.
- Font và thư viện 3D lưu tại chỗ. Không yêu cầu CDN/analytics khi người đọc mở trang.

## Chạy trên máy

Cần Node.js **22 trở lên** (khuyến nghị 24):

```bash
npm ci
npm run build
npm run preview
```

Mở **http://127.0.0.1:4173/httpslocal-demo/**.

Khi sửa mã nguồn:

```bash
npm run build
npm run dev
```

Sau mỗi lần sửa `src/`, chạy lại `npm run build` rồi làm mới trình duyệt. Đây là bản tĩnh tối giản, không có HMR. `npm run dev` phục vụ tài nguyên ở gốc repo; `npm run preview` phục vụ bản `dist/` đã build. Không mở `index.html` bằng `file://`, vì trình duyệt chặn tải JSON/mô-đun.

## Kiểm thử

```bash
npm test
npx playwright install chromium
npm run test:e2e
```

Trên Kali, kiểm thử ưu tiên `/usr/bin/chromium` nếu đã có. Trên CI và máy khác dùng Chromium của Playwright. Khi Linux thiếu thư viện hệ thống, dùng `npx playwright install --with-deps chromium` theo hướng dẫn Playwright (có thể cần quyền quản trị).

Các kiểm thử bao gồm: dấu tiếng Việt, escape HTML, tìm kiếm/lọc/sắp xếp, lưu bài và refresh, cả 10 trang đọc, deep-link trong thư mục con GitHub Pages, sao chép mã/liên kết, điều khiển 3D, kích thước 375/390/768/1024/1440px, giảm chuyển động, thiếu WebGL và lỗi tải JSON. Ảnh chụp kiểm thử nằm ở `test-results/evidence/`; báo cáo HTML ở `playwright-report/`.

## Viết / chỉnh bài

Sửa **`content/posts.json`**. Mỗi bài có cấu trúc:

```json
{
  "slug": "ten-bai-viet-khong-dau",
  "title": "Tên bài viết tiếng Việt",
  "category": "web",
  "difficulty": "Cơ bản",
  "date": "2026-10-01",
  "minutes": 5,
  "summary": "Mô tả ngắn.",
  "tags": ["HTTP", "IDOR"],
  "featured": false,
  "kind": "Ghi chép kỹ thuật",
  "sections": [
    {
      "heading": "Bắt đầu từ hành vi",
      "paragraphs": ["Nội dung đoạn văn."],
      "list": ["Điều cần nhớ."],
      "code": {"language": "bash", "text": "curl -I http://127.0.0.1:8000/"},
      "note": "Chỉ thử trong phạm vi được phép."
    }
  ]
}
```

`list`, `code`, `note` là tùy chọn. Slug phải duy nhất, chỉ chữ thường/số/dấu gạch nối. Chuyên mục: `web`, `pwn`, `reverse`, `crypto`, `forensics`, `infra`, `ai`. Đặt **một** bài `featured: true` để chọn bài nổi bật. Số bài/chuyên mục trên giao diện được tính từ nội dung thật.

Đường dẫn bài dùng `#/bai-viet/slug` nên chia sẻ hoặc làm mới trang vẫn hoạt động trên GitHub Pages. Mục lục dùng `#/bai-viet/slug/phan-1`. Mã và văn bản được escape trước khi hiển thị; không nhúng HTML tùy ý vào JSON.

## Cấu trúc

```text
index.html               Khung website và metadata tiếng Việt
assets/styles.css        Token đỏ–đen, giao diện đáp ứng
assets/icons.svg         Biểu tượng và hình minh họa
assets/fonts/            Phông Việt WOFF2 + giấy phép OFL
assets/app.js            JavaScript giao diện đã build
assets/scene.js          Three.js/cảnh 3D đã gộp và thu gọn
src/app.js               Tìm kiếm, lưu bài, trang đọc, điều khiển
src/lib.js               Hàm thuần + kiểm tra dữ liệu
src/scene.js             Cảnh Three.js
content/posts.json       Nội dung blog
vendor/                  Three.js 0.186.1 nhập từ ZIP + MIT
scripts/build.mjs        Build tài nguyên và tạo dist/
scripts/serve.mjs        Máy chủ thử tại 127.0.0.1
tests/                   Unit test và Playwright
design-system/MASTER.md  Quyết định thiết kế
```

## Three.js từ bộ ZIP được cung cấp

Chỉ trích `build/three.module.js`, `build/three.core.js` và giấy phép MIT từ bộ Three.js của chủ repo. Không tải/copy cả ZIP hay thư mục ví dụ lớn vào Git. `assets/scene.js` được esbuild gộp từ chính các tệp này; người đọc không cần ZIP. Nguồn và SHA-256 được ghi tại [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## Triển khai GitHub Pages

Repo hiện dùng Pages từ **nhánh `main`, thư mục `/`**. Vì vậy các tài nguyên đã build ở `assets/` được commit cùng mã nguồn; giữ `.nojekyll`. Không cần chuyển sang framework hay đổi cấu hình Pages.

```bash
npm ci
npm test
npm run build
npm run test:e2e
git add index.html assets src content scripts tests package.json package-lock.json
# Commit và đẩy/merge nhánh khi kiểm thử thành công.
```

Workflow `kiem-thu.yml` kiểm tra mã/nội dung/build/giao diện và đính kèm báo cáo. Khi merge vào `main`, Pages sẽ triển khai theo cấu hình hiện có. Có thể dùng `dist/` trên dịch vụ hosting tĩnh khác.

## Giới hạn có chủ đích

- Đây là blog tĩnh: không có đăng nhập, bình luận, trình quản trị, cơ sở dữ liệu hay thống kê theo dõi người dùng.
- Cảnh 3D cần WebGL 2; máy không hỗ trợ vẫn có SVG và toàn bộ bài viết.
- Một canonical/OG trang chủ cho website tĩnh; metadata bài được cập nhật phía trình duyệt, chưa phải SEO prerender từng bài.
- Lưu bài phụ thuộc trình duyệt; xóa dữ liệu website sẽ xóa danh sách đã lưu.
- Nội dung là ghi chép biên soạn cho CTF/lab; không phải báo cáo khai thác mục tiêu thật.

Chỉ thực hành trên CTF, phòng thực hành hoặc hệ thống được cho phép.
