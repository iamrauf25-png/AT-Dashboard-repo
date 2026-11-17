// 08 — Notion + Gemini automation: settings for the AI Billi page
//
// 1. In Apps Script, make a COPY of your existing project (File > Make a copy)
//    so your other channel's pipeline keeps working.
// 2. In Notion, duplicate your scripts database for this page and point the
//    copied project at the new database ID.
// 3. Replace the NICHE line in the copied project with the one below.
// 4. Put STYLE_LINE in as the first sentence of every Flow prompt the script writes.
// 5. Run autoJob, then read and fix every script (Hindi + tool facts) before
//    you generate any clips.

const NICHE = 'practical AI tips for beginners in India (students, job seekers, small business), explained by a friendly cat mascot. No hype, no income claims.';

// Replace [CAT] with the same cat description you used in 02-image-prompts.md.
const STYLE_LINE = 'A friendly [CAT] cat mascot wearing small round glasses, in flat vector sticker style with thick clean outlines and bright flat colours, sitting at a tidy desk in front of a solid deep teal background.';

// Reel structure the script should follow (5 parts of 10 seconds each):
// Part 1 (0:00-0:10) Curiosity hook and promise
// Part 2 (0:10-0:20) Step 1
// Part 3 (0:20-0:30) Step 2
// Part 4 (0:30-0:40) Step 3
// Part 5 (0:40-0:50) Payoff and "Comment [KEYWORD]"
