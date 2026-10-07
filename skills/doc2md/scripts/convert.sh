#!/usr/bin/env bash
# Совместимый вход для пользователей shell-версии; логика одна для всех ОС.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$SCRIPT_DIR/convert.js" "$@"
