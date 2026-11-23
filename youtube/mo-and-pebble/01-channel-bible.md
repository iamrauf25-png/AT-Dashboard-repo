# Mo & Pebble — channel guide

> **A moth who's always wrong. A rock who's always right.**

## The idea in one line

Mo, a moth, is sure every light he sees is the moon and spends every night trying to reach it.
Pebble, a pebble on the porch step, has never moved, says almost nothing, and is always right.

## Why this concept (the decisions made for you)

| Decision | Choice | Why |
| --- | --- | --- |
| Audience | Kids about 6–10, with a parent nearby | The biggest audience for cartoons on YouTube, and short gags suit it |
| Length | 2–4 min episodes plus Shorts | Short enough for one person to animate; long-form and Shorts feed each other |
| Cast | 2 characters, 1 voice actor (you) | Pitch-shift one voice; no casting or scheduling |
| Animation cost | Deliberately low | **Pebble never moves.** Half the cast is one drawing plus mouth shapes. Mo is a flutter loop plus poses. |
| Repeatable engine | "Mo sees a light → it's the moon → plan → fail → Pebble says one word" | Endless episodes, and every new light (lighthouse, firefly, TV, phone screen, birthday candles) is a new one |
| Recurring bits | Night counter ("Night 301."), Mo's "Step one" plans, Pebble's one-word lines | Bits people recognise are what make viewers come back |

## Characters

**MO** (the moth)
- Look: round fuzzy body, two big curved antennae, oversized eyes, small wings that never stop
  moving. Main colour: soft grey-brown with one cream stripe.
- Voice: your voice pitched up about 3–4 semitones, fast.
- Wants: the moon. Believes: anything bright is the moon. Flaw: commits completely before thinking.
- Never: mean, sad for longer than one beat.

**PEBBLE** (the rock)
- Look: smooth grey oval, two dot eyes, a mouth line. No arms, no legs. Sits on the bottom porch step.
- Voice: your voice pitched down about 3 semitones, slow, flat.
- Wants: nothing. Knows: everything. Flaw: answers only what he's asked, in as few words as possible.
- Animation: blink, eyes left/right, 3–4 mouth shapes. **He never moves.** If he ever does, make it
  the season finale.

**NARRATOR**: your normal voice, cold opens only.

**Recurring places**: the porch (home base), the porch light, the window, the street lamp at
the end of the road.

## Look and sound

- Night palette: deep navy background, warm yellow light, Mo in warm grey, Pebble in cool grey.
  The warm light against the dark background also makes thumbnails stand out in the feed.
- Thick outlines, flat colour, no gradients except the glow around lights.
- Sound: crickets for the background, a "tink" every time Mo hits glass (that's his running gag
  sound), and silence right before Pebble speaks.

## Production pipeline for one person

1. **Script** (`/yt-script`) → read aloud, time it.
2. **Voice record**: one take per character, all lines. Free tool: Audacity. Pitch-shift Mo up and Pebble down.
3. **Animatic**: rough sketches timed to the audio. Fix the pacing here, where it's cheap.
4. **Animate**: reuse the porch background and Pebble's drawing every episode. Free options:
   Krita (frame-by-frame), Blender Grease Pencil, OpenToonz, Synfig (puppet-style). Paid,
   faster for puppet rigs: Moho, Cartoon Animator, Adobe Animate, Toon Boom Harmony.
5. **Edit + sound effects + captions**: after export, run `/yt-edit` on the caption file to
   catch dead air.
6. **Package** (`/yt-package`) and **description** (`/yt-seo`).
7. **Shorts** (`/yt-shorts`): cut 3 vertical clips from each episode.

Track your real hours on episode 1. They set the pace for everything in `02-month-plan.md`.

## Channel setup copy

- **Channel name**: Mo & Pebble
- **Handle**: try `@MoAndPebble`; fallbacks `@MoAndPebbleToons`, `@MoPebbleCartoon`.
  *I can't check availability from here; check it in YouTube Studio.*
- **Banner text**: "A moth who's always wrong. A rock who's always right. New episodes every other Saturday."
- **About**:
  > Mo is a moth who thinks every light is the moon. Pebble is a rock who has never moved and is
  > always right. Short, original cartoons for kids and the grown-ups watching with them.
  > New episodes every other Saturday, Shorts all week.
- **Profile picture**: Pebble's face, big, on navy. It's simple enough to read at tiny sizes.

## ⚠️ Decide this before you upload: "made for kids"

YouTube requires you to say whether each video is made for kids (this follows US COPPA rules).
A cartoon aimed at 6–10-year-olds will very likely count as made for kids. That means:
**comments off, no personalised ads (so lower ad revenue), and some features turned off**.
`/yt-comment` won't apply. Read YouTube's current "made for kids" help page before your first upload.
Labelling a kids' video wrongly can get fines or penalties. If you'd rather keep comments
on, change the target audience to older viewers (10+, and adults who like dry humour) and write
for them. The concept still works, and you'd have to change the voice.md audience line.

## Originality rule

Mo, Pebble, the designs, the catchphrases and the stories are original. Keep them that way:
no lookalike characters, no borrowed theme music, no fan-art episodes of other shows. Use only
music and sound effects that are royalty-free or that you made yourself.
