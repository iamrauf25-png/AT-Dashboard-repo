#!/usr/bin/env bash
# Build Shorts end to end: voices + sfx + music -> timeline -> video.
#   ./make.sh                 # every Short in shorts.py
#   ./make.sh s01-moon-button # just one
# Needs: python venv with kokoro-onnx (see README.md), Node + Playwright, ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
PY=${PY:-/home/user/mp-tools/venv/bin/python}
BUILD=${BUILD:-build}
OUT=../output/shorts
mkdir -p "$OUT"
IDS=${1:-all}
"$PY" ../../engine/audio.py . "$IDS" "$BUILD"
if [ "$IDS" = all ]; then IDS=$("$PY" -c "from shorts import SHORTS; print(','.join(SHORTS))"); fi
for id in ${IDS//,/ }; do node ../../engine/render.cjs scene.js "$BUILD/$id/timeline.json" "$OUT/$id.mp4"; done
node art.cjs ../output/channel-art
