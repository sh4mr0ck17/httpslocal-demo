import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, escapeHtml, parseSaved, filterPosts, articleHref, formatDate, validatePosts } from '../src/lib.js';

const fixture = [
  {slug:'web-co-ban',title:'Kiểm tra quyền truy cập',summary:'IDOR trong phòng thực hành',category:'web',difficulty:'Cơ bản',tags:['IDOR','HTTP'],date:'2026-09-18',minutes:7,sections:[{heading:'Bắt đầu',paragraphs:['Đây là dữ liệu kiểm thử.']}]},
  {slug:'mat-ma',title:'Mật mã và cấu trúc RSA',summary:'Hiểu khóa công khai',category:'crypto',difficulty:'Cơ bản',tags:['RSA'],date:'2026-10-01',minutes:4,sections:[{heading:'Bắt đầu',paragraphs:['Đây là dữ liệu kiểm thử.']}]},
  {slug:'dich-nguoc',title:'Dịch ngược nhị phân',summary:'Ghi chép hàm kiểm tra',category:'reverse',difficulty:'Trung bình',tags:['ELF'],date:'2026-08-14',minutes:10,sections:[{heading:'Bắt đầu',paragraphs:['Đây là dữ liệu kiểm thử.']}]},
];
test('Tìm kiếm tiếng Việt có dấu và chữ đ',()=>{assert.equal(normalize('  ĐIỀU TRA SỐ '),'dieu tra so');assert.equal(normalize('Mật mã'),'mat ma');});
test('Dữ liệu bài viết không được chèn HTML',()=>{assert.equal(escapeHtml('<img src=x onerror="x"> &'),'&lt;img src=x onerror=&quot;x&quot;&gt; &amp;');assert.equal(escapeHtml("'"),'&#39;');});
test('Dữ liệu lưu hỏng không làm hỏng trang',()=>{assert.equal(parseSaved('not-json').size,0);assert.equal(parseSaved('{}').size,0);assert.deepEqual([...parseSaved('["mat-ma",null,"<x>","mat-ma"]')],['mat-ma']);});
test('Tìm kiếm không dấu và nhiều từ',()=>{assert.deepEqual(filterPosts(fixture,{query:'mat ma rsa'}).map(p=>p.slug),['mat-ma']);assert.deepEqual(filterPosts(fixture,{query:'quyen truy cap'}).map(p=>p.slug),['web-co-ban']);});
test('Bộ lọc chuyên mục và đã lưu kết hợp được',()=>{assert.equal(filterPosts(fixture,{category:'web'}).length,1);assert.equal(filterPosts(fixture,{category:'web',savedOnly:true,saved:new Set(['mat-ma'])}).length,0);assert.deepEqual(filterPosts(fixture,{savedOnly:true,saved:new Set(['mat-ma'])}).map(p=>p.slug),['mat-ma']);});
test('Sắp xếp thời gian và thời lượng đúng, không sửa mảng gốc',()=>{assert.deepEqual(filterPosts(fixture).map(p=>p.slug),['mat-ma','web-co-ban','dich-nguoc']);assert.equal(filterPosts(fixture,{sort:'oldest'})[0].slug,'dich-nguoc');assert.equal(filterPosts(fixture,{sort:'shortest'})[0].minutes,4);assert.equal(fixture[0].slug,'web-co-ban');});
test('Đường dẫn phù hợp GitHub Pages dưới thư mục con',()=>{assert.equal(articleHref('mat-ma'),'#/bai-viet/mat-ma');assert.equal(articleHref('x/y'),'#/bai-viet/x%2Fy');assert.equal(formatDate('2026-10-01'),'01/10/2026');});
test('Kiểm tra schema thực sự từ chối lỗi và slug trùng',()=>{assert.equal(validatePosts(fixture).length,3);assert.throws(()=>validatePosts([]));assert.throws(()=>validatePosts([fixture[0],fixture[0]]));assert.throws(()=>validatePosts([{...fixture[0],category:'unknown'}]));assert.throws(()=>validatePosts([{...fixture[0],sections:[]}]));assert.throws(()=>validatePosts([{...fixture[0],slug:'<script>'}]));});
