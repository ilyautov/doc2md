#!/usr/bin/env node
// doc2md — пакетная конвертация документов в Markdown.
// Обёртка над firecrawl/anydoc (npx -y @firecrawl/anydoc).
// Кросс-платформенная версия: работает одинаково на Windows/macOS/Linux,
// нужен только Node.js (тот же, что уже требуется для npx/anydoc).
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const SUPPORTED_EXT = new Set([
  'doc', 'docx', 'docm', 'odt', 'rtf', 'epub', 'pdf',
  'ppt', 'pps', 'pot', 'pptx', 'pptm', 'ppsx', 'ppsm', 'odp',
  'xls', 'xlsx', 'xlsm', 'xlsb', 'ods', 'csv',
]);

function usage() {
  console.log(`doc2md — конвертирует документы в Markdown перед тем, как их читает агент.

Использование:
  node convert.js <файл-или-папка> [ещё файлы/папки...] [-o ВЫХОДНАЯ_ПАПКА]

Примеры:
  node convert.js договор.docx
  node convert.js ~/Downloads/акты/ -o ~/Downloads/акты-md/
  node convert.js a.pdf b.xlsx "отчёт за март.pptx"

Без -o каждый файл.md пишется рядом с исходником.
Папка сканируется рекурсивно по поддерживаемым расширениям.`);
}

function walk(dir, out, seen) {
  // Защита от циклов по симлинкам: запоминаем реальные пути каталогов.
  let real;
  try {
    real = fs.realpathSync(dir);
  } catch {
    return;
  }
  if (seen.has(real)) return;
  seen.add(real);

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    let st;
    try {
      st = fs.statSync(full); // statSync резолвит симлинки — на папки заходим, файлы проверяем по расширению
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, out, seen);
    } else if (st.isFile()) {
      const ext = path.extname(e.name).toLowerCase().replace(/^\./, '');
      if (SUPPORTED_EXT.has(ext)) out.push(full);
    }
  }
}

function main() {
  const argv = process.argv.slice(2);
  let outDir = null;
  const args = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-o' || a === '--output') {
      if (!argv[i + 1] || argv[i + 1].startsWith('-')) {
        console.error('doc2md: после -o нужна выходная папка');
        process.exit(2);
      }
      outDir = argv[++i];
    } else if (a === '-h' || a === '--help') {
      usage();
      process.exit(0);
    } else {
      args.push(a);
    }
  }

  if (args.length === 0) {
    usage();
    process.exit(2);
  }

  if (outDir) fs.mkdirSync(outDir, { recursive: true });

  const files = [];
  const seen = new Set();
  for (const a of args) {
    let st = null;
    try {
      st = fs.statSync(a);
    } catch {
      st = null;
    }
    if (st && st.isDirectory()) {
      walk(a, files, seen);
    } else if (st && st.isFile()) {
      files.push(a);
    } else {
      console.error(`doc2md: пропускаю, не найден: ${a}`);
    }
  }

  if (files.length === 0) {
    console.error('doc2md: подходящих файлов не найдено');
    process.exit(1);
  }

  let ok = 0;
  let skip = 0;
  let fail = 0;
  const isWin = process.platform === 'win32';
  const outputNames = new Map();
  for (const f of files) {
    const name = `${path.basename(f)}.md`;
    const sources = outputNames.get(name) || new Set();
    sources.add(path.resolve(f));
    outputNames.set(name, sources);
  }

  for (const f of files) {
    // Полное имя файла + .md (не срезаем расширение): "отчёт.csv" и "отчёт.docx"
    // иначе оба лягут в "отчёт.md" и второй перезапишет первый.
    const base = path.basename(f);
    let outputName = `${base}.md`;
    if (outDir && outputNames.get(outputName).size > 1) {
      const suffix = crypto.createHash('sha256').update(path.resolve(f)).digest('hex').slice(0, 12);
      outputName = `${base}.${suffix}.md`;
    }
    const out = outDir ? path.join(outDir, outputName) : path.join(path.dirname(f), outputName);

    // На Windows npx.cmd запускается через cmd.exe. Пользовательский путь
    // никогда не попадает в командную строку: документ передаётся через stdin.
    // Формат указан явно, потому что CSV без имени файла не определяется.
    let input;
    try {
      input = fs.readFileSync(f);
    } catch (error) {
      console.error(`ОШИБКА  ${f} — не удалось прочитать файл: ${error.message}`);
      fail++;
      continue;
    }
    const format = path.extname(f).slice(1).toLowerCase();
    if (!SUPPORTED_EXT.has(format)) {
      console.error(`ОШИБКА  ${f} — неподдерживаемое расширение`);
      fail++;
      continue;
    }
    const res = spawnSync('npx', ['-y', '@firecrawl/anydoc', '-', '--format', format], {
      shell: isWin,
      input,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });

    const errOutput = (res.stderr || res.error?.message || '').trim();

    if (res.status === 3) {
      console.error(`ПРОПУСК ${f} — ${errOutput}`);
      skip++;
    } else if (res.status !== 0 || res.error) {
      console.error(`ОШИБКА  ${f} — ${errOutput || `anydoc завершился с кодом ${res.status}`}`);
      fail++;
    } else {
      try {
        fs.writeFileSync(out, res.stdout, { flag: 'w' });
        console.log(`OK      ${f} -> ${out}`);
        ok++;
      } catch (error) {
        console.error(`ОШИБКА  ${f} — не удалось записать результат: ${error.message}`);
        fail++;
      }
    }
  }

  console.log('');
  console.log(`Готово: конвертировано ${ok}, нужен OCR ${skip}, ошибок ${fail}`);
  if (skip > 0) {
    console.log('Пропущенным PDF нужен OCR: сделайте текстовый слой и повторите конвертацию.');
  }

  process.exit(fail > 0 ? 1 : 0);
}

main();
