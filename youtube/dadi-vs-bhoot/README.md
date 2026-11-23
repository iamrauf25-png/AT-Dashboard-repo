# दादी vs भूत (Dadi vs Bhoot)

Hindi horror-comedy cartoon Shorts. **Start with [`output/UPLOAD-SHEET.md`](output/UPLOAD-SHEET.md) (channel setup), then [`output/CALENDAR.md`](output/CALENDAR.md) (what to post each day).**

| Path | What |
| --- | --- |
| `output/shorts/*.mp4` | 14 finished Shorts (Hindi voices + Devanagari captions, 1080×1920) |
| `output/channel-art/` | Profile picture, banner, long-video thumbnails |
| `output/long/` | Episode 1 (2:54) + Compilation 1 (4:21), 1920×1080, with Hindi + English subtitle files |
| `studio/episodes.py` | Long-form episode scripts (16:9, chapters, English subtitles) |
| `studio/batch_NN.py` | Each week's new Shorts (loaded automatically) |
| `studio/IDEAS.md` | Idea log the weekly batch draws from; paste viewer comments here |
| `output/CALENDAR.md` | **The day-by-day posting plan**: file, title and description for every day |
| `output/UPLOAD-SHEET.md` | Channel setup, schedule, copy-paste titles/descriptions/tags |
| `studio/shorts.py` | The scripts / shot lists (edit these to make new Shorts) |
| `studio/scene.js` | Village courtyard set, peepal tree, Dadi, Chaman Bhoot, fog, captions |
| `studio/make.sh` | Builds everything (uses the shared engine in `../engine/`) |

## Characters
- **चमन भूत (Chaman Bhoot)**: 200 years in the peepal tree. Glowing eyes, big moustache, choti,
  backwards feet. Speaks in dramatic old-film style. Always tries to scare. Always fails.
  Voice: Kokoro `hm_omega`, pitched down, with echo.
- **दादी (Dadi)**: about 75, white saree with a maroon border, round glasses, cutting chai. Has never been scared
  in her life. Every punchline is hers. Voice: Kokoro `hf_beta`, slowed and pitched down slightly.
- **Narrator**: `hm_psi`, deep, only for cold opens.

## The formula (every Short)
1. Horror cold open with a hook in red text: fog, owl, wind, riser, glowing eyes in the tree.
2. Jump scare: flash, shake, dissonant sting.
3. Dadi isn't scared. One deadpan line. The music flips from tanpura drone to comic dholak-pluck.
4. Chaman's sad reply, then a wah-wah sting. Under 25 seconds.

## Keep it original
Chaman and Dadi are original characters. Don't borrow characters, catchphrases, songs or dialogue
from existing films or shows. Folklore (peepal tree ghosts, backwards feet, chudails) is fair to use.
