#!/usr/bin/env bash
# One-time setup for the cartoon studio on a fresh machine or cloud session.
# Installs: Python venv with Kokoro TTS, the Kokoro model files (from GitHub releases),
# the Baloo 2 font. Needs ffmpeg, Node and Playwright's Chromium (preinstalled in Claude cloud sessions).
#   bash youtube/engine/setup.sh        then use PY=$HOME/mp-tools/venv/bin/python
set -euo pipefail
ROOT="$HOME/mp-tools"
mkdir -p "$ROOT/models" "$HOME/.local/share/fonts"
if [ ! -x "$ROOT/venv/bin/python" ]; then
  python3 -m venv "$ROOT/venv"
  "$ROOT/venv/bin/pip" install -q kokoro-onnx soundfile numpy
fi
cd "$ROOT/models"
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "$f" ] || curl -sSL --retry 3 -o "$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"
done
cp "$(dirname "$0")/fonts/Baloo2.ttf" "$HOME/.local/share/fonts/" 2>/dev/null || cp "$OLDPWD/$(dirname "$0")/fonts/Baloo2.ttf" "$HOME/.local/share/fonts/"
fc-cache -f >/dev/null 2>&1 || true
command -v ffmpeg >/dev/null || { echo "ffmpeg missing: apt-get install -y ffmpeg"; exit 1; }
node -e "require('playwright')" 2>/dev/null || echo "warning: playwright not found for node"
"$ROOT/venv/bin/python" -c "import kokoro_onnx" && echo "studio ready: PY=$ROOT/venv/bin/python"
