#!/usr/bin/env bash
# Smoke-тесты doc2md, не требующие сети и самого anydoc.
# Проверяют арг-парсинг и graceful-поведение обёртки, а не конвертацию форматов
# (её тестируем вживую на реальных файлах — см. SKILL.md, раздел «Протестировано»).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JS="$ROOT/skills/doc2md/scripts/convert.js"
SH="$ROOT/skills/doc2md/scripts/convert.sh"
fails=0

check() { # описание; ожидаемый_код; факт_код
  if [[ "$2" == "$3" ]]; then
    echo "ok   — $1"
  else
    echo "FAIL — $1 (ждали код $2, получили $3)"; fails=$((fails + 1))
  fi
}

# 1. Синтаксис обеих версий.
node --check "$JS"; check "convert.js: синтаксис Node" 0 $?
bash -n "$SH";      check "convert.sh: синтаксис bash" 0 $?

# 2. --help выходит с кодом 0.
node "$JS" --help >/dev/null 2>&1; check "convert.js --help → 0" 0 $?
bash "$SH" --help >/dev/null 2>&1; check "convert.sh --help → 0" 0 $?

# 3. Без аргументов — usage и код 2.
node "$JS" >/dev/null 2>&1; check "convert.js без аргументов → 2" 2 $?
bash "$SH" >/dev/null 2>&1; check "convert.sh без аргументов → 2" 2 $?

# 4. Несуществующий путь — код 1, batch не падает (не 130/segfault).
node "$JS" /nope/does-not-exist.docx >/dev/null 2>&1; check "convert.js missing-path → 1" 1 $?
bash "$SH" /nope/does-not-exist.docx >/dev/null 2>&1; check "convert.sh missing-path → 1" 1 $?

echo
if [[ $fails -eq 0 ]]; then
  echo "Smoke: всё зелёное."
  exit 0
else
  echo "Smoke: провалов — $fails"
  exit 1
fi
