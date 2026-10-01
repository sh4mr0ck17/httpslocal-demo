import { test, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

const publishedPosts = JSON.parse(await readFile(new URL('../../content/posts.json',import.meta.url),'utf8'));
const totalPosts = publishedPosts.length;
const home = './';
async function ready(page) { await page.goto(home); await expect(page.locator('#post-grid .post-card')).toHaveCount(totalPosts); }
async function getPosts(request) { return (await request.get('content/posts.json')).json(); }

test('Trang chủ tiếng Việt: 10 bài, 7 chuyên mục, không lỗi JS/CDN/CSP',async({page})=>{
  const errors=[],outside=[],violations=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:4173/')) outside.push(request.url());});
  page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
  await page.addInitScript(()=>{document.addEventListener('securitypolicyviolation',event=>{window.__csp=(window.__csp||[]).concat(event.violatedDirective);});Object.defineProperty(navigator,'webdriver',{get:()=>false});});
  await ready(page);
  await expect(page).toHaveTitle(/sh4mr0ck/);
  await expect(page.locator('html')).toHaveAttribute('lang','vi');
  await expect(page.locator('#hero-title')).toContainText('Giải mã giới hạn.');
  await expect(page.locator('#post-total')).toHaveText(String(totalPosts));
  await expect(page.locator('#category-total')).toHaveText(String(new Set(publishedPosts.map(p=>p.category)).size));
  expect(await page.locator('#search-toggle svg').evaluate(el=>getComputedStyle(el).stroke===getComputedStyle(el).color)).toBe(true);
  await expect(page.locator('#scene-host')).toHaveAttribute('data-scene',/ready|running|paused/);
  await expect(page.locator('#scene-host canvas')).toHaveCount(1);
  expect(await page.evaluate(()=>window.__csp||[])).toEqual([]);
  expect(errors).toEqual([]);expect(outside).toEqual([]);
  await mkdir('test-results/evidence',{recursive:true});
  await page.screenshot({path:'test-results/evidence/desktop-1440.png',fullPage:true});
  await page.screenshot({path:'test-results/evidence/hero-1440.png'});
});

test('Tìm không dấu và trạng thái rỗng, phím tắt / và Escape',async({page})=>{
  await ready(page);await page.keyboard.press('/');await expect(page.locator('#search')).toBeFocused();
  await page.locator('#search').fill('Mật mã');
  const accented = await page.locator('#post-grid .post-card').evaluateAll(cards=>cards.map(card=>card.dataset.slug));
  expect(accented.length).toBeGreaterThan(0);
  await page.locator('#search').fill('mat ma');
  expect(await page.locator('#post-grid .post-card').evaluateAll(cards=>cards.map(card=>card.dataset.slug))).toEqual(accented);
  await page.locator('#search').fill('RSA');await expect(page.locator('#post-grid .post-card')).toHaveCount(1);
  await page.locator('#search').fill('xyzkhongcotrongblog');await expect(page.locator('#empty-state')).toBeVisible();
  await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();await expect(page.locator('#post-grid .post-card')).toHaveCount(totalPosts);
  await page.locator('#search').fill('IDOR');await expect(page.locator('#post-grid .post-card')).toHaveCount(1);
  await page.keyboard.press('Escape');await expect(page.locator('#search')).toHaveValue('');await expect(page.locator('#post-grid .post-card')).toHaveCount(totalPosts);
});

test('Lọc đủ chuyên mục và sắp xếp đọc nhanh',async({page,request})=>{
  const posts=await getPosts(request);await ready(page);
  for(const category of [...new Set(posts.map(p=>p.category))]){
    await page.locator(`[data-category="${category}"]`).click();
    await expect(page.locator('#post-grid .post-card')).toHaveCount(posts.filter(p=>p.category===category).length);
    await expect(page.locator(`[data-category="${category}"]`)).toHaveAttribute('aria-pressed','true');
  }
  await page.locator('[data-category="all"]').click();await page.locator('#sort').selectOption('shortest');
  expect(await page.locator('#post-grid .post-card').first().getAttribute('data-slug')).toBe([...posts].sort((a,b)=>a.minutes-b.minutes||b.date.localeCompare(a.date))[0].slug);
});

test('Lưu bài, lọc đã lưu và khôi phục sau refresh',async({page})=>{
  await ready(page);const first=page.locator('#post-grid .bookmark-button').first();const slug=await first.getAttribute('data-save');
  await first.click();await expect(page.locator('#saved-count')).toHaveText('1');
  await page.locator('#saved-filter').click();await expect(page.locator('#post-grid .post-card')).toHaveCount(1);
  await page.reload();await expect(page.locator('#post-grid .post-card')).toHaveCount(1);
  await expect(page.locator('#post-grid .post-card')).toHaveAttribute('data-slug',slug);
  await page.locator('#post-grid .bookmark-button').click();await expect(page.locator('#empty-state')).toBeVisible();await expect(page.locator('#saved-count')).toHaveText('0');
});

test('Cả 10 bài có trang đọc, mục lục và đường dẫn refresh độc lập',async({page,request})=>{
  const posts=await getPosts(request);
  for(const post of posts){
    await page.goto(`./#/bai-viet/${post.slug}`);
    await expect(page.locator('#article-title')).toHaveText(post.title);
    await expect(page.locator('#article-body section')).toHaveCount(post.sections.length);
    await expect(page.locator('#article-toc a')).toHaveCount(post.sections.length);
    await expect(page.locator('#home-view')).toBeHidden();
    await expect(page.locator('#article-title')).toBeFocused();
  }
  await page.reload();await expect(page.locator('#article-title')).toHaveText(posts.at(-1).title);
  await page.getByRole('link',{name:'Trở về kho ghi chép'}).click();await expect(page.locator('#home-view')).toBeVisible();await expect(page.locator('#post-grid .post-card')).toHaveCount(totalPosts);
});

test('Mục lục không mất trang đọc, sao chép mã/liên kết và lưu trong trang đọc',async({page,context,request})=>{
  const posts=await getPosts(request);const post=posts.find(p=>p.sections.some(s=>s.code));
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto(`./#/bai-viet/${post.slug}`);await expect(page.locator('#article-title')).toHaveText(post.title);
  await page.locator('#article-toc a').last().click();await expect(page.locator('#article-view')).toBeVisible();await expect(page).toHaveURL(/\/phan-\d+$/);
  const copyIndex=post.sections.findIndex(s=>s.code);
  await page.locator(`[data-copy="${copyIndex}"]`).click();await expect(page.locator('#toast')).toHaveText('Đã sao chép mã ví dụ.');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(post.sections[copyIndex].code.text);
  await page.locator('#article-share').click();await expect(page.locator('#toast')).toHaveText('Đã sao chép liên kết bài viết.');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(page.url());
  await page.locator('#article-save').click();await expect(page.locator('#article-save')).toHaveAttribute('aria-pressed','true');
  await page.screenshot({path:'test-results/evidence/article-desktop.png',fullPage:true});
});

test('Cảnh 3D tạm dừng, tiếp tục và phát xung',async({page})=>{
  await ready(page);await expect(page.locator('#scene-pause')).toBeEnabled();
  await page.locator('#scene-pause').click();await expect(page.locator('#scene-pause')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#scene-status')).toHaveText('Chuyển động đã tạm dừng');
  await expect(page.locator('#scene-pulse')).toBeDisabled();
  await page.locator('#scene-pause').click();await expect(page.locator('#scene-pause')).toHaveAttribute('aria-pressed','false');
  await page.locator('#scene-pulse').click();await expect(page.locator('#toast')).toContainText('Đã phát một xung');
});

test('375/390/768/1024px không tràn ngang, menu mobile dùng được',async({page})=>{
  for(const width of [375,390,768,1024]){
    await page.setViewportSize({width,height:844});await ready(page);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    if(width<760){
      await page.locator('#menu-toggle').click();await expect(page.locator('#menu-toggle')).toHaveAttribute('aria-expanded','true');
      await page.locator('#site-nav').getByRole('link',{name:'Về mình',exact:true}).click();await expect(page.locator('#menu-toggle')).toHaveAttribute('aria-expanded','false');
      await page.locator('#trang-chu').scrollIntoViewIfNeeded();
    }
    if(width===390){await page.screenshot({path:'test-results/evidence/mobile-390.png',fullPage:true});}
  }
});

test('Giảm chuyển động và WebGL không hỗ trợ vẫn đọc được',async({browser})=>{
  const reduced=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}});
  const page=await reduced.newPage();await page.goto('http://127.0.0.1:4173/httpslocal-demo/');await expect(page.locator('#post-grid .post-card')).toHaveCount(totalPosts);
  await expect(page.locator('#scene-pause')).toHaveAttribute('aria-pressed','true');
  await reduced.close();
  const fallback=await browser.newContext();await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl2'||type==='webgl'||type==='experimental-webgl')return null;return original.call(this,type,...args);};});
  const fb=await fallback.newPage();await fb.goto('http://127.0.0.1:4173/httpslocal-demo/');await expect(fb.locator('#post-grid .post-card')).toHaveCount(totalPosts);
  await expect(fb.locator('#scene-host')).toHaveAttribute('data-scene','unsupported');await expect(fb.locator('.scene-fallback')).toBeVisible();await expect(fb.locator('#scene-pause')).toBeDisabled();
  await fallback.close();
});

test('Nội dung được escape, đường dẫn sai và JSON lỗi có thông báo phục hồi',async({page,request})=>{
  const posts=await getPosts(request);const malicious=structuredClone(posts);malicious[0].title='<img src=x onerror="window.injected=true">';malicious[0].sections[0].paragraphs=['<script>window.injected=true</script>'];
  await page.route('**/content/posts.json',route=>route.fulfill({json:malicious}));
  await page.goto(`./#/bai-viet/${malicious[0].slug}`);await expect(page.locator('#article-title')).toHaveText(malicious[0].title);
  expect(await page.evaluate(()=>window.injected)).toBeUndefined();await expect(page.locator('#article-title img')).toHaveCount(0);
  await page.unroute('**/content/posts.json');await page.goto('./#/bai-viet/khong-ton-tai');await expect(page.locator('#article-title')).toHaveText('Không tìm thấy bài viết');
  await page.route('**/content/posts.json',route=>route.fulfill({status:503,body:'Không kết nối được.'}));await page.goto(home);await expect(page.locator('#load-error')).toBeVisible();
  await page.unroute('**/content/posts.json');await page.getByRole('button',{name:'Thử lại',exact:true}).click();await expect(page.locator('#post-grid .post-card')).toHaveCount(totalPosts);
});
