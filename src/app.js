import { CATEGORIES, normalize, escapeHtml as esc, parseSaved, filterPosts, articleHref, formatDate, validatePosts } from './lib.js';

const $ = (selector) => document.querySelector(selector);
const storageKey = 'sh4mr0ck:ctf:saved:v2';
let posts = [], saved = new Set(), currentPost = null, scene = null, listScroll = 0, toastTimer;
try { saved = parseSaved(localStorage.getItem(storageKey)); } catch { /* Trình duyệt riêng tư vẫn đọc được blog. */ }
const params = new URLSearchParams(location.search);
const state = { query: params.get('q') || '', category: CATEGORIES[params.get('muc')] ? params.get('muc') : 'all', savedOnly: params.get('luu') === '1', sort: ['newest','oldest','shortest'].includes(params.get('sap-xep')) ? params.get('sap-xep') : 'newest' };
const icon = (name, className = '') => `<svg class="${className}" aria-hidden="true"><use href="./assets/icons.svg#${name}"></use></svg>`;
function notify(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false; toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3600); }
function setPageDescription(description) { document.querySelector('meta[name="description"]').setAttribute('content', description); }
function syncUrl() {
  const url = new URL(location.href);
  for (const key of ['q','muc','luu','sap-xep']) url.searchParams.delete(key);
  if (state.query.trim()) url.searchParams.set('q', state.query.trim());
  if (state.category !== 'all') url.searchParams.set('muc', state.category);
  if (state.savedOnly) url.searchParams.set('luu','1');
  if (state.sort !== 'newest') url.searchParams.set('sap-xep', state.sort);
  history.replaceState(null, '', url);
}
function visual(post, index = 0) { return `<div class="card-visual visual-${post.category}"><span class="visual-code">${esc(post.tags[0] || 'CTF')} / GHI CHÉP</span><svg class="cover-art" aria-hidden="true" viewBox="0 0 260 160"><use href="./assets/icons.svg#visual-${post.category}"></use></svg><span class="visual-index">${String(index + 1).padStart(2,'0')} / CTF</span></div>`; }
function postCard(post, index) {
  const isSaved = saved.has(post.slug);
  return `<article class="post-card" data-slug="${esc(post.slug)}">${visual(post,index)}<button class="bookmark-button" data-save="${esc(post.slug)}" aria-label="${isSaved ? 'Bỏ lưu' : 'Lưu'}: ${esc(post.title)}" aria-pressed="${isSaved}">${icon('bookmark')}</button><div class="card-content"><div class="card-tagline"><span class="category-label">${esc(CATEGORIES[post.category])}</span><span class="tag-separator" aria-hidden="true">/</span><span class="difficulty">${esc(post.difficulty)}</span></div><h3><a class="card-title-link" href="${articleHref(post.slug)}">${esc(post.title)}</a></h3><p class="card-summary">${esc(post.summary)}</p><div class="card-tags">${post.tags.slice(0,3).map(tag => `<span>${esc(tag)}</span>`).join('')}</div><div class="post-meta"><span class="post-meta-info"><time datetime="${esc(post.date)}">${formatDate(post.date)}</time><span aria-hidden="true">·</span>${icon('clock')} ${post.minutes} phút đọc</span><span class="read-link" aria-hidden="true">Đọc bài ${icon('arrow-right')}</span></div></div></article>`;
}
function renderFeatured() {
  const post = posts.find(p => p.featured) || posts[0];
  $('#featured-slot').innerHTML = `<article class="featured-card">${visual(post,0)}<div class="card-content"><span class="featured-label">${icon('spark')} BÀI VIẾT NỔI BẬT</span><h3><a class="card-title-link" href="${articleHref(post.slug)}">${esc(post.title)}</a></h3><p class="card-summary">${esc(post.summary)}</p><div class="post-meta"><span class="post-meta-info">${icon('clock')} ${post.minutes} phút đọc<span aria-hidden="true">·</span>${esc(CATEGORIES[post.category])}</span><span class="read-link" aria-hidden="true">Đọc bài ${icon('arrow-right')}</span></div></div></article>`;
  $('#featured-slot').setAttribute('aria-busy','false');
}
function renderLibrary({ updateUrl = true } = {}) {
  const results = filterPosts(posts, { ...state, saved });
  $('#post-grid').innerHTML = results.map(postCard).join('');
  $('#post-grid').setAttribute('aria-busy','false');
  $('#empty-state').hidden = results.length !== 0;
  $('#result-count').textContent = `${results.length} bài viết${state.savedOnly ? ' đã lưu' : ''}${state.category !== 'all' ? ` · ${CATEGORIES[state.category]}` : ''}${state.query ? ` · Tìm “${state.query}”` : ''}`;
  document.querySelectorAll('[data-category]').forEach(button => { const active = button.dataset.category === state.category; button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active)); });
  $('#saved-filter').setAttribute('aria-pressed',String(state.savedOnly));
  $('#saved-count').textContent = posts.filter(p => saved.has(p.slug)).length;
  $('#search').value = state.query;
  $('#sort').value = state.sort;
  if (updateUrl) syncUrl();
}
function updateArticleSave() {
  if (!currentPost) return;
  const isSaved = saved.has(currentPost.slug);
  $('#article-save').setAttribute('aria-pressed',String(isSaved));
  $('#article-save span').textContent = isSaved ? 'Đã lưu bài viết' : 'Lưu bài viết';
}
function toggleSaved(slug) {
  const post = posts.find(p => p.slug === slug);
  if (!post) return;
  const wasSaved = saved.has(slug);
  if (wasSaved) saved.delete(slug); else saved.add(slug);
  let persistent = true;
  try { localStorage.setItem(storageKey,JSON.stringify([...saved])); } catch { persistent = false; }
  // Không thay cả lưới khi nút đang có focus; giữ vị trí bàn phím sau thao tác lưu.
  const focused = document.activeElement?.dataset.save;
  renderLibrary();
  if (currentPost) { updateArticleSave(); renderRelated(); }
  if (focused) { const replacement = [...document.querySelectorAll('[data-save]')].find(button => button.dataset.save === focused && button.getClientRects().length); (replacement || $('#saved-filter')).focus({preventScroll:true}); }
  notify(`${wasSaved ? 'Đã bỏ lưu bài viết.' : 'Đã lưu bài viết để đọc sau.'}${persistent ? '' : ' Chỉ lưu trong phiên này vì trình duyệt chặn bộ nhớ.'}`);
}
function renderRelated() {
  if (!currentPost) return;
  const related = posts.filter(p => p.slug !== currentPost.slug).sort((a,b) => Number(b.category === currentPost.category) - Number(a.category === currentPost.category)).slice(0,3);
  $('#related-posts').innerHTML = related.map(postCard).join('');
}
function renderArticle(post) {
  currentPost = post;
  $('#article-title').textContent = post.title;
  $('#article-summary').textContent = post.summary;
  $('#article-badges').innerHTML = `<span>${esc(CATEGORIES[post.category])}</span><span>${esc(post.difficulty)}</span><span>${esc(post.kind || 'Ghi chép kỹ thuật')}</span>`;
  $('#article-meta').innerHTML = `<span>sh4mr0ck17</span><span aria-hidden="true">/</span><time datetime="${esc(post.date)}">${formatDate(post.date)}</time><span aria-hidden="true">/</span><span>${post.minutes} phút đọc</span>`;
  $('#article-body').innerHTML = post.sections.map((section,index) => {
    const sectionId = `phan-${index + 1}`;
    const paragraphs = section.paragraphs.map(p => `<p>${esc(p)}</p>`).join('');
    const list = section.list ? `<ul>${section.list.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : '';
    const code = section.code ? `<div class="code-block"><div class="code-toolbar"><span>${esc(section.code.language)}</span><button data-copy="${index}">${icon('copy')} Sao chép mã</button></div><pre tabindex="0" aria-label="Mã ví dụ ${esc(section.code.language)}"><code>${esc(section.code.text)}</code></pre></div>` : '';
    return `<section id="${sectionId}"><h2>${esc(section.heading)}</h2>${paragraphs}${list}${code}${section.note ? `<aside class="article-note">${esc(section.note)}</aside>` : ''}</section>`;
  }).join('');
  $('#article-toc').innerHTML = post.sections.map((section,index) => `<a href="${articleHref(post.slug)}/phan-${index+1}">${String(index+1).padStart(2,'0')} · ${esc(section.heading)}</a>`).join('');
  $('#article-view').classList.remove('article-not-found');
  $('#article-view .article-layout').hidden = false;
  $('#article-view .article-actions').hidden = false;
  $('#article-view .related-section').hidden = false;
  document.title = `${post.title} — sh4mr0ck`;
  setPageDescription(post.summary);
  updateArticleSave(); renderRelated();
}
function setNavigation(target) { document.querySelectorAll('.site-nav .nav-link').forEach(link => { if (link.getAttribute('href') === target) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current'); }); }
function closeMenu() { $('#site-nav').dataset.open = 'false'; $('#menu-toggle').setAttribute('aria-expanded','false'); $('#menu-toggle').setAttribute('aria-label','Mở điều hướng'); $('#menu-toggle').innerHTML = icon('menu'); }
function handleRoute({ initial = false } = {}) {
  closeMenu();
  let parts;
  try { parts = decodeURIComponent(location.hash).split('/'); } catch { parts = []; }
  if (parts[1] === 'bai-viet') {
    const post = posts.find(p => p.slug === parts[2]);
    const samePost = post && currentPost?.slug === post.slug && !$('#article-view').hidden;
    if (!$('#home-view').hidden) listScroll = window.scrollY;
    $('#home-view').hidden = true; $('#article-view').hidden = false;
    if (post) {
      if (!samePost) renderArticle(post);
      if (/^phan-\d+$/.test(parts[3] || '')) document.getElementById(parts[3])?.scrollIntoView({behavior: initial ? 'instant' : 'smooth'});
      else if (!samePost || initial) { window.scrollTo({top:0,behavior:'instant'}); $('#article-title').focus({preventScroll:true}); }
    } else {
      currentPost = null;
      $('#article-title').textContent = 'Không tìm thấy bài viết';
      $('#article-summary').textContent = 'Đường dẫn có thể đã thay đổi. Hãy trở về kho ghi chép để chọn một bài khác nhé.';
      $('#article-meta').textContent = ''; $('#article-badges').textContent = '';
      for (const selector of ['.article-layout','.article-actions','.related-section']) $('#article-view '+selector).hidden = true;
      document.title = 'Không tìm thấy bài viết — sh4mr0ck';
      window.scrollTo({top:0,behavior:'instant'}); $('#article-title').focus({preventScroll:true});
    }
    setNavigation('#bai-viet');
  } else {
    const fromArticle = !$('#article-view').hidden;
    $('#home-view').hidden = false; $('#article-view').hidden = true; currentPost = null;
    document.title = 'sh4mr0ck — Ghi chép CTF & an toàn thông tin';
    setPageDescription('Blog CTF tiếng Việt của sh4mr0ck: ghi chép về bảo mật web, khai thác nhị phân, dịch ngược, mật mã và điều tra số. Rèn tư duy. Giữ tò mò.');
    const hash = location.hash;
    setNavigation(['#bai-viet','#chuyen-muc','#ve-minh'].includes(hash) ? hash : '#trang-chu');
    if (fromArticle && hash === '#bai-viet' && !initial && listScroll > 0) window.scrollTo({top:listScroll,behavior:'instant'});
    else if (['#bai-viet','#chuyen-muc','#ve-minh','#trang-chu','#main'].includes(hash)) document.getElementById(hash.slice(1))?.scrollIntoView({behavior:initial ? 'instant':'smooth'});
    if (fromArticle && !initial) { $('#main').focus({preventScroll:true}); }
  }
  updateReadingProgress();
}
function searchFocus() {
  if (currentPost || location.hash !== '#bai-viet') location.hash = '#bai-viet';
  $('#home-view').hidden = false; $('#article-view').hidden = true;
  $('#bai-viet').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  $('#search').focus({preventScroll:true});
}
async function copyText(text, success) {
  try { await navigator.clipboard.writeText(text); notify(success); }
  catch { notify('Trình duyệt chưa cho phép sao chép. Hãy chọn và sao chép nội dung hoặc đường dẫn trên thanh địa chỉ.'); }
}
function updateReadingProgress() {
  const progress = $('#reading-progress');
  if ($('#article-view').hidden || !currentPost) { progress.style.transform = 'scaleX(0)'; return; }
  const rect = $('#article-body').getBoundingClientRect();
  const distance = rect.height - window.innerHeight + 130;
  const value = distance > 0 ? Math.max(0,Math.min(1,(130 - rect.top)/distance)) : 1;
  progress.style.transform = `scaleX(${value})`;
}
let scrollPending = false;
window.addEventListener('scroll',() => { if (scrollPending) return; scrollPending = true; requestAnimationFrame(() => { updateReadingProgress(); scrollPending = false; }); },{passive:true});
window.addEventListener('resize',updateReadingProgress,{passive:true});
window.addEventListener('hashchange',() => handleRoute());
window.addEventListener('storage',event => { if (event.key !== storageKey) return; saved = parseSaved(event.newValue); renderLibrary({updateUrl:false}); updateArticleSave(); if (currentPost) renderRelated(); });
$('#search').addEventListener('input',event => { state.query = event.target.value; renderLibrary(); });
$('#sort').addEventListener('change',event => { state.sort = event.target.value; renderLibrary(); });
$('#search-toggle').addEventListener('click',searchFocus);
$('#clear-filters').addEventListener('click',() => { Object.assign(state,{query:'',category:'all',savedOnly:false,sort:'newest'}); renderLibrary(); $('#search').focus({preventScroll:true}); });
$('#saved-filter').addEventListener('click',() => { state.savedOnly = !state.savedOnly; renderLibrary(); });
$('#menu-toggle').addEventListener('click',() => { const open = $('#menu-toggle').getAttribute('aria-expanded') !== 'true'; $('#site-nav').dataset.open = String(open); $('#menu-toggle').setAttribute('aria-expanded',String(open)); $('#menu-toggle').setAttribute('aria-label',open ? 'Đóng điều hướng' : 'Mở điều hướng'); $('#menu-toggle').innerHTML = icon(open ? 'close':'menu'); });
document.addEventListener('click',event => {
  const saveButton = event.target.closest('[data-save]');
  if (saveButton) { event.preventDefault(); toggleSaved(saveButton.dataset.save); return; }
  const categoryButton = event.target.closest('[data-category]');
  if (categoryButton) { state.category = categoryButton.dataset.category; renderLibrary(); return; }
  const copyButton = event.target.closest('[data-copy]');
  if (copyButton && currentPost) { copyText(currentPost.sections[Number(copyButton.dataset.copy)].code.text,'Đã sao chép mã ví dụ.'); return; }
  if (event.target.closest('.site-nav a')) closeMenu();
});
document.addEventListener('keydown',event => {
  const editing = event.target.closest('input,textarea,select,[contenteditable="true"]');
  if (event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); searchFocus(); }
  if (event.key === 'Escape') { if ($('#menu-toggle').getAttribute('aria-expanded') === 'true') { closeMenu(); $('#menu-toggle').focus(); } else if (event.target === $('#search') && state.query) { state.query = ''; renderLibrary(); } }
});
$('#article-save').addEventListener('click',() => { if (currentPost) toggleSaved(currentPost.slug); });
$('#article-share').addEventListener('click',() => copyText(location.href,'Đã sao chép liên kết bài viết.'));

async function loadPosts() {
  $('#load-error').hidden = true;
  try {
    const response = await fetch(new URL('../content/posts.json',import.meta.url));
    if (!response.ok) throw new Error('Không tải được kho bài viết.');
    posts = validatePosts(await response.json());
    // Loại đường dẫn cũ khỏi bộ nhớ nhưng không phá dữ liệu khi tải nội dung lỗi.
    saved = new Set([...saved].filter(slug => posts.some(post => post.slug === slug)));
    $('#post-total').textContent = posts.length;
    $('#category-total').textContent = new Set(posts.map(p => p.category)).size;
    renderFeatured(); renderLibrary({updateUrl:false}); handleRoute({initial:true});
  } catch {
    $('#post-grid').innerHTML = ''; $('#featured-slot').innerHTML = '<div class="loading-card">Kho ghi chép tạm thời chưa tải được.</div>';
    $('#post-grid').setAttribute('aria-busy','false'); $('#featured-slot').setAttribute('aria-busy','false');
    $('#result-count').textContent = 'Chưa kết nối được với kho bài viết.';
    $('#load-error').hidden = false; $('#empty-state').hidden = true;
    if (location.hash.startsWith('#/bai-viet/')) handleRoute({initial:true});
  }
}
$('#retry-load').addEventListener('click',loadPosts);

const pauseButton = $('#scene-pause'), pulseButton = $('#scene-pulse');
function sceneStatus(status) {
  const labels = {ready:'Mạng lưới đang chuyển động',running:'Mạng lưới đang chuyển động',paused:'Chuyển động đã tạm dừng',unsupported:'Đồ họa tĩnh · Không có WebGL',lost:'Đồ họa tĩnh · Mất kết nối GPU'};
  $('#scene-status').textContent = labels[status] || labels.unsupported;
  const paused = status === 'paused';
  pauseButton.setAttribute('aria-pressed',String(paused));
  pauseButton.innerHTML = `${icon(paused ? 'play':'pause')}<span>${paused ? 'Tiếp tục 3D' : 'Tạm dừng 3D'}</span>`;
  const unsupported = status === 'unsupported' || status === 'lost';
  pauseButton.disabled = unsupported; pulseButton.disabled = unsupported || paused;
}
async function startScene() {
  try { const {initScene} = await import('./scene.js'); scene = initScene($('#scene-host'),{onStatus:sceneStatus}); }
  catch { $('#scene-host').dataset.scene = 'unsupported'; sceneStatus('unsupported'); }
}
pauseButton.addEventListener('click',() => { if (scene) sceneStatus(scene.togglePause() ? 'paused':'running'); });
pulseButton.addEventListener('click',() => { if (scene) { scene.pulse(); notify('Đã phát một xung tới mạng lưới 3D.'); } });
window.addEventListener('pagehide',event => { if (!event.persisted) scene?.dispose(); });
if (navigator.connection?.saveData) { $('#scene-status').textContent = 'Đồ họa tĩnh · Tiết kiệm dữ liệu'; $('#scene-host').dataset.scene = 'unsupported'; }
else if ('requestIdleCallback' in window) requestIdleCallback(startScene,{timeout:1200});
else setTimeout(startScene,120);
loadPosts();
