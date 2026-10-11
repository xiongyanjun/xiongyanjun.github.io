// 本地预览用的极简静态服务器（零依赖）：node scripts/serve.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.env.PORT || 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

if (!fs.existsSync(ROOT)) {
  console.error('找不到 dist/，请先运行 npm run build');
  process.exit(1);
}

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(ROOT, urlPath);

    if (urlPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
    if (!path.extname(filePath)) {
      if (fs.existsSync(filePath + '.html')) filePath += '.html';
      else if (fs.existsSync(path.join(filePath, 'index.html'))) filePath = path.join(filePath, 'index.html');
    }

    // 防止越出 dist 目录
    if (!path.resolve(filePath).startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        fs.readFile(path.join(ROOT, '404.html'), (e2, page) => {
          res.writeHead(404, { 'Content-Type': TYPES['.html'] });
          res.end(e2 ? 'Not found' : page);
        });
        return;
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(PORT, () => {
    console.log(`预览地址：http://localhost:${PORT}`);
  });
