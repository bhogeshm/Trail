#!/usr/bin/env bash
# Renders the root composition (index.html) to a temp file and confirms
# the HyperFrames engine still produces valid video output. Run via
# `npm run hf:smoke-test`.
set -euo pipefail

cd "$(dirname "$0")/.."

OUT_DIR="$(mktemp -d)"
OUT_FILE="$OUT_DIR/smoke-test.mp4"
trap 'rm -rf "$OUT_DIR"' EXIT

npx hyperframes check

npx hyperframes render --output "$OUT_FILE"

if [ ! -s "$OUT_FILE" ]; then
  echo "smoke test failed: $OUT_FILE was not created" >&2
  exit 1
fi

echo "smoke test passed: rendered $(du -h "$OUT_FILE" | cut -f1) to $OUT_FILE"
