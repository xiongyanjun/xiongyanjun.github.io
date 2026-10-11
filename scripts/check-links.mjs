// 内部链接自检：确认 dist/ 里每个 href / src 都能找到对应文件。
// 用法：node scripts/check-links.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const problems = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const attrs = html.matchAll(/(?:href|src)="([^"]+)"/g);
  for (const [, raw] of attrs) {
    const target = raw.split('#')[0].split('?')[0];
    if (!target) continue;
    if (/^(https?:|mailto:|data:|javascript:)/i.test(target)) continue;
    checked++;
    const resolved = path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) {
      problems.push(`${path.relative(ROOT, file)} → ${raw}`);
    }
  }
}

console.log(`检查 ${htmlFiles.length} 个页面，${checked} 个站内链接`);
if (problems.length) {
  console.log(`✗ 发现 ${problems.length} 个失效链接：`);
  problems.slice(0, 40).forEach((p) => console.log('  ' + p));
  process.exitCode = 1;
} else {
  console.log('✓ 所有站内链接都能解析到实际文件');
}
