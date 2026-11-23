# Mo & Pebble studio

Makes finished Shorts entirely from code: characters drawn with canvas paths, voices from a
local text-to-speech model, sound effects and music synthesised from sine waves and noise.
There are no image, sound or music assets, so there's nothing to license.

| File | Job |
| --- | --- |
| `shorts.py` | The shot list for every Short: lines, camera moves, character actions, sound effects |
| `audio.py` | Voices (Kokoro TTS, pitched per character), SFX, crickets, music → `audio.wav` + `timeline.json` |
| `scene.js` | Draws any frame: the porch set, Mo, Pebble, lighting, captions, hook text |
| `render.cjs` | Headless Chromium draws 30 fps frames → ffmpeg → 1080×1920 MP4, loudness -14 LUFS |
| `art.cjs` | Profile picture + banner |
| `make.sh` | Runs the whole chain |

## Setup (once)

```bash
python3 -m venv ~/mp-venv && ~/mp-venv/bin/pip install kokoro-onnx soundfile numpy
mkdir -p ~/mp-models && cd ~/mp-models
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
npm i -g playwright && npx playwright install chromium   # skip if Playwright is already installed
```
Then `PY=~/mp-venv/bin/python KOKORO_DIR=~/mp-models ./make.sh`.

## Making a new Short

Copy an entry in `shorts.py`, change the lines and actions, run `./make.sh <id>`. Preview single
frames first: `node render.cjs build/<id>/timeline.json --stills 1,5,9 previews/`.

Voices: Mo = `am_puck` pitched up 30%, Pebble = `am_onyx` pitched down 20% and slowed,
Narrator = `bm_fable`. Change them in `VOICES` in `audio.py`.
