import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const args = process.argv.slice(2);
const root = resolve(import.meta.dirname,'..',args.includes('--dist') ? 'dist' : '.');
const portIndex = args.indexOf('--port');
const port = Number(portIndex >= 0 ? args[portIndex + 1] : 4173);
const base = '/httpslocal-demo';
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const server = createServer(async (req,res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405,{'Allow':'GET, HEAD'}).end(); return; }
    let path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (path === base) { res.writeHead(301,{'Location':base+'/'}).end(); return; }
    if (path.startsWith(base+'/')) path = path.slice(base.length);
    if (path.endsWith('/')) path += 'index.html';
    let file = resolve(root,'.'+path);
    if (file !== root && !file.startsWith(root+sep)) { res.writeHead(403).end('Không được phép.'); return; }
    // Chỉ cung cấp các tài nguyên công khai, không lộ .git, mã công cụ hay môi trường.
    const publicPath = path.slice(1);
    if (!(publicPath === 'index.html' || publicPath === '.nojekyll' || publicPath === 'build-info.json' || publicPath === 'THIRD_PARTY_NOTICES.md' || ['assets/','content/','vendor/LICENSE.three.txt'].some(prefix=>publicPath.startsWith(prefix))) || publicPath.split('/').some(part=>part.startsWith('.') && part!=='.nojekyll')) { res.writeHead(404).end('Không tìm thấy.'); return; }
    const info = await stat(file);
    if (!info.isFile()) { res.writeHead(404).end('Không tìm thấy.'); return; }
    res.writeHead(200,{'Content-Type':types[extname(file)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'});
    res.end(req.method==='HEAD' ? undefined : await readFile(file));
  } catch { res.writeHead(404).end('Không tìm thấy.'); }
});
server.listen(port,'127.0.0.1',()=>console.log(`Blog đang chạy: http://127.0.0.1:${port}/httpslocal-demo/ (${root})`));
