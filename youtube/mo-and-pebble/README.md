# Mo & Pebble — cartoon channel launch kit

> A moth who's always wrong. A rock who's always right.

Made with the yt-* skills in `.claude/skills/`. Nothing here gets published automatically; you upload everything yourself.

| File | What's in it | Skill |
| --- | --- | --- |
| [`../../.claude/youtube/voice.md`](../../.claude/youtube/voice.md) | The show's voice: audience, characters' speech, banned words | (read by every skill) |
| [`01-channel-bible.md`](01-channel-bible.md) | Concept, characters, look, production pipeline, channel setup text, the made-for-kids decision | — |
| [`02-month-plan.md`](02-month-plan.md) | Pre-launch stockpile + first month calendar + next 4 episode ideas | `/yt-plan` |
| [`episodes/ep01-…/script.md`](episodes/ep01-moth-touches-the-moon/script.md) | Scored hooks + the full episode 1 script with on-screen notes | `/yt-script` |
| [`episodes/ep01-…/package.md`](episodes/ep01-moth-touches-the-moon/package.md) | Title (100/100) + thumbnail brief | `/yt-package` |
| [`episodes/ep01-…/seo.md`](episodes/ep01-moth-touches-the-moon/seo.md) | Description, tags, target search queries | `/yt-seo` |
| [`episodes/ep01-…/shorts.md`](episodes/ep01-moth-touches-the-moon/shorts.md) | 3 Shorts cut from episode 1 | `/yt-shorts` |

## Only you can do these
1. **Decide "made for kids"** (channel guide, ⚠️ section). It changes comments and ad revenue.
2. **Check the handle** `@MoAndPebble` in YouTube Studio.
3. **Verify the moth-science citation** in script.md before using that line.
4. **Draw, voice and animate** episode 1 (pipeline in the channel guide). Time how long it takes.

## Skills for after launch
- `/yt-edit`: run on each episode's caption file to find dead air.
- `/yt-retention`: after ~2 weeks, export the retention CSV for episode 1.
- `/yt-viral`: research other cartoon channels. Needs a video list collected with
  `yt-dlp --flat-playlist -J <channel URL>` on your own computer (this cloud session can't reach YouTube).
- `/yt-audit`: after episode 4.
