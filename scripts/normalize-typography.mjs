// 排版规整（一次性维护脚本）：把正文里的直引号换成中文引号，跳过代码块。
// 用法：node scripts/normalize-typography.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'content', 'posts');
let changed = 0;

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const full = path.join(DIR, file);
  const lines = fs.readFileSync(full, 'utf8').split('\n');
  let inFence = false;
  let touched = false;

  const out = lines.map((line) => {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    const next = line.replace(/"([^"]{1,200})"/g, (_, inner) => `“${inner}”`);
    if (next !== line) touched = true;
    return next;
  });

  if (touched) {
    fs.writeFileSync(full, out.join('\n'), 'utf8');
    changed++;
  }
}

console.log(`✓ 处理完成，${changed} 个文件有改动`);
