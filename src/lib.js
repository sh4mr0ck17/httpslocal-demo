export const CATEGORIES = Object.freeze({
  web: 'Bảo mật web', pwn: 'Khai thác nhị phân', reverse: 'Dịch ngược',
  crypto: 'Mật mã', forensics: 'Điều tra số', infra: 'Hạ tầng', ai: 'Bảo mật AI',
});
export function normalize(value = '') {
  return String(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}
export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
export function parseSaved(raw) {
  try { const value = JSON.parse(raw); return new Set(Array.isArray(value) ? value.filter(slug => typeof slug === 'string' && /^[a-z0-9-]+$/.test(slug)) : []); }
  catch { return new Set(); }
}
export function filterPosts(posts, { query = '', category = 'all', savedOnly = false, saved = new Set(), sort = 'newest' } = {}) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return posts.filter(post => {
    if (category !== 'all' && post.category !== category) return false;
    if (savedOnly && !saved.has(post.slug)) return false;
    const searchable = normalize([post.title, post.summary, CATEGORIES[post.category], ...(post.tags || [])].join(' '));
    return words.every(word => searchable.includes(word));
  }).sort((a, b) => {
    if (sort === 'shortest') return a.minutes - b.minutes || b.date.localeCompare(a.date);
    return sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
  });
}
export function articleHref(slug) { return `#/bai-viet/${encodeURIComponent(slug)}`; }
export function formatDate(date) { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${date}T12:00:00`)); }
export function validatePosts(posts) {
  if (!Array.isArray(posts) || !posts.length) throw new Error('Kho bài viết phải là một mảng không rỗng.');
  const slugs = new Set();
  for (const post of posts) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || slugs.has(post.slug)) throw new Error('Đường dẫn bài viết không hợp lệ hoặc trùng lặp.');
    slugs.add(post.slug);
    if (!Object.hasOwn(CATEGORIES,post.category) || !post.title || !post.summary || !Array.isArray(post.tags) || !Number.isInteger(post.minutes) || post.minutes < 1 || !/^\d{4}-\d{2}-\d{2}$/.test(post.date) || Number.isNaN(Date.parse(post.date))) throw new Error(`Thông tin bài viết không hợp lệ: ${post.slug}`);
    if (!Array.isArray(post.sections) || !post.sections.length || post.sections.some(s => !s.heading || !Array.isArray(s.paragraphs) || !s.paragraphs.length || (s.code && typeof s.code.text !== 'string') || (s.list && !Array.isArray(s.list)))) throw new Error(`Nội dung bài viết không hợp lệ: ${post.slug}`);
  }
  return posts;
}
