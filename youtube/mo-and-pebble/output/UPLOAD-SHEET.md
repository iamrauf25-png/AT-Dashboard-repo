# Mo & Pebble: upload sheet

Everything here is finished. Your part is about 5 minutes to create the channel, then about 2 minutes per Short to upload.

## Part 1: create the channel (once, about 5 minutes)

1. Go to **youtube.com** and sign in with the Google account you want to own the channel.
   *Tip: if you want co-managers later, or want to keep it separate from your personal account,
   create a **Brand Account**: youtube.com/account → "Create a new channel".*
2. Click your avatar → **Create a channel**. Name: **`Mo & Pebble`**. Handle: **`@MoAndPebble`**
   (fallbacks: `@MoAndPebbleToons`, `@MoPebbleCartoon`).
3. Upload the **profile picture**: `channel-art/profile.png`.
4. Open **YouTube Studio → Customization → Branding**:
   - Banner: `channel-art/banner.png`
5. **Customization → Basic info → Description**, paste:
   ```
   Mo is a moth who thinks every light is the moon. Pebble is a rock who has never moved and is always right.
   Short, original cartoons for kids and the grown-ups watching with them. New Shorts every week.
   ```
6. **Settings → Channel → Advanced settings → Audience**: choose
   **"Yes, set this channel as made for kids."** (This is a children's cartoon, so this is the
   setting that follows YouTube's and COPPA rules. Comments and personalised ads will be off.)
7. **Settings → Upload defaults**: Category **Film & Animation**, Language **English**,
   Caption certification **"This content has never aired on TV in the US"**. Leave the licence as Standard.
8. Your phone number may be needed for verification (YouTube asks once). That's expected.

## Part 2: upload schedule

Upload in this order. Pick one fixed time of day and keep using it. Studio → Create → Upload videos →
choose the file → fill in the fields below → **Visibility: Schedule**.

| # | When | File | Title |
| --- | --- | --- | --- |
| 1 | Day 1 | `shorts/s01-moon-button.mp4` | This Moth Found the Moon's Off Switch |
| 2 | Day 3 | `shorts/s02-made-of-glass.mp4` | The Moon Is Made of Glass (Attempt #1 of 300) |
| 3 | Day 5 | `shorts/s04-pebble-says-no.mp4` | Mo's 3-Step Plan to Become the Moon |
| 4 | Day 8 | `shorts/s05-why-dont-you-fly.mp4` | I Asked a Rock Why It Never Flies (1 Word) |
| 5 | Day 10 | `shorts/s03-why-moths-circle.mp4` | Why Moths Circle Lights: 299 Tries Later |

That's two weeks of posts. Day 1 opens with the strongest video.

All five are vertical 1080×1920, under 60 seconds, 30 fps, loudness normalised to about -14 LUFS. YouTube
treats them as Shorts automatically.

## Part 3: copy-paste fields for each Short

Fields that are the same for every Short:
- **Audience**: Yes, made for kids
- **Altered or synthetic content**: **Yes.** The voices are synthetic (generated with the Kokoro text-to-speech model).
  YouTube's disclosure rules focus on realistic content, but declaring it costs nothing.
- **Tags**: `mo and pebble, moth cartoon, cartoon for kids, funny cartoon, animated short, moth, pebble`

### 1 · This Moth Found the Moon's Off Switch
```
Mo the moth finally reached the moon. It's warm, it's buzzing, and it has a button. Pebble said don't.

#MoAndPebble #cartoon #shorts
```

### 2 · The Moon Is Made of Glass (Attempt #1 of 300)
```
Mo found the moon. It's on a house. Pebble tried to say no.

#MoAndPebble #cartoon #shorts
```

### 3 · Mo's 3-Step Plan to Become the Moon
```
Step one: sit on the moon. Step two: glow. Step three: BE the moon. Pebble has notes. One note.

#MoAndPebble #cartoon #shorts
```

### 4 · I Asked a Rock Why It Never Flies (1 Word)
```
Mo asks Pebble why he never flies to the moon. Pebble answers.

#MoAndPebble #cartoon #shorts
```

### 5 · Why Moths Circle Lights: 299 Tries Later
```
Why can't Mo fly straight at the light? Moths keep their back toward the brightest thing they see. Outdoors that's the sky, so near a lamp they end up circling it.

Science: Fabian, S. T. et al. (2024). "Why flying insects gather at artificial light." Nature Communications.

#MoAndPebble #cartoon #shorts #science
```
> Before posting #5, open that paper (search the title) and confirm the citation. I cited it
> from memory and couldn't check it from the cloud session. If it doesn't check out, post #5 without the
> two science lines.

## After posting
- Week 2: check Studio → Analytics → which Short got the most views. Make the next ones like it.
- Each new Short: add it to `studio/shorts.py`, then run `studio/make.sh` (see `studio/README.md`).
