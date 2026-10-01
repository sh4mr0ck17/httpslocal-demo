import { build } from 'esbuild';
import { readFile, readdir, mkdir, rm, cp, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validatePosts } from '../src/lib.js';

const root = resolve(import.meta.dirname,'..');
const posts = validatePosts(JSON.parse(await readFile(resolve(root,'content/posts.json'),'utf8')));
await mkdir(resolve(root,'assets'),{recursive:true});
await build({entryPoints:[resolve(root,'src/app.js')],outfile:resolve(root,'assets/app.js'),bundle:true,minify:true,format:'esm',target:'es2022',external:['./scene.js'],legalComments:'eof',logLevel:'info'});
await build({entryPoints:[resolve(root,'src/scene.js')],outfile:resolve(root,'assets/scene.js'),bundle:true,minify:true,format:'esm',target:'es2022',legalComments:'eof',logLevel:'info'});
await rm(resolve(root,'dist'),{recursive:true,force:true});
await mkdir(resolve(root,'dist'),{recursive:true});
for (const path of ['index.html','.nojekyll','assets','content','vendor/LICENSE.three.txt','THIRD_PARTY_NOTICES.md']) {
  const target = resolve(root,'dist',path);
  await mkdir(resolve(target,'..'),{recursive:true});
  await cp(resolve(root,path),target,{recursive:true});
}
await writeFile(resolve(root,'dist/build-info.json'),JSON.stringify({name:'sh4mr0ck-ctf-blog',posts:posts.length,categories:[...new Set(posts.map(p=>p.category))],three:'0.186.1'},null,2));
console.log(`Build thành công: ${posts.length} bài viết, ${new Set(posts.map(p=>p.category)).size} chuyên mục. Đầu ra: dist/; assets/ ở gốc tương thích GitHub Pages hiện tại.`);
