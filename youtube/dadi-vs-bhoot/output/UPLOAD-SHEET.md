# दादी vs भूत (Dadi vs Bhoot): upload sheet

> **हर रात भूत डराने आता है… दादी डरती नहीं।**
> (Every night the ghost comes to scare her… Dadi is never scared.)

A Hindi horror-comedy Shorts channel. Chaman Bhoot has lived in the peepal tree outside Dadi's
house for 200 years. Every night he tries to scare her, and every night Dadi wins with one deadpan line.
Each Short opens with real horror (fog, owl, glowing eyes, a jump scare), then the music flips
to comic on Dadi's punchline.

**This is a separate channel from Mo & Pebble.** Mo & Pebble is set as made for kids. This one
is horror-comedy for teens and adults, so it keeps comments on, which matters because the comment section is
where Indian Shorts audiences suggest the next scare.

## Part 1: create the channel (about 5 minutes)

1. youtube.com → sign in → avatar → **Create a channel** (or youtube.com/account → "Create a new
   channel" for a Brand Account, recommended so it's separate from Mo & Pebble).
2. Name: **`दादी vs भूत | Dadi vs Bhoot`**. Handle: **`@DadiVsBhoot`** (fallbacks `@DadiVsBhootToons`,
   `@DadiAurBhoot`).
3. Profile picture: `channel-art/profile.png`. Banner: `channel-art/banner.png`.
4. **Customization → Basic info → Description**:
   ```
   पीपल वाले पेड़ पर 200 साल से रहता है चमन भूत। हर रात वो दादी को डराने आता है… और हर रात दादी उसे बर्तन धुलवा देती हैं। 😂👻
   Hindi horror comedy cartoon Shorts. नए Shorts हर हफ़्ते।
   ```
5. **Settings → Channel → Advanced → Audience**: **"No, set this channel as not made for kids."**
   The jump scares are aimed at teens and adults. Each video also gets "No" (below).
6. **Settings → Channel → Basic info → Country**: India. **Upload defaults**: Category **Comedy**,
   Video language **Hindi**, Title & description language **Hindi**.

## Part 2: schedule (two weeks)

Indian Shorts traffic usually peaks in the evening. Start with **7:30 pm IST** and adjust after two
weeks using Studio → Analytics → Audience → "When your viewers are on YouTube". (That's a common
starting point, not your data yet.)

| # | Day | File | Title |
| --- | --- | --- | --- |
| 1 | Day 1 | `shorts/d01-kiraya.mp4` | भूत से 200 साल का किराया माँगा 😂 Dadi vs Bhoot |
| 2 | Day 3 | `shorts/d05-multani-mitti.mp4` | भूत को किससे डर लगता है? 👻 Dadi vs Bhoot |
| 3 | Day 5 | `shorts/d04-boo.mp4` | भूत ने कहा "बू!"… दादी का जवाब 😂 Dadi vs Bhoot |
| 4 | Day 8 | `shorts/d02-ulte-pair.mp4` | भूत के पैर उल्टे क्यों होते हैं? 👣 Dadi vs Bhoot |
| 5 | Day 10 | `shorts/d03-photo.mp4` | दादी ने भूत की फ़ोटो खींची… फिर? 📸 Dadi vs Bhoot |

All five: vertical 1080×1920, 14–24 seconds, Hindi voices, Hindi (Devanagari) captions burned in,
loudness about -14 LUFS.

> Note: the pack's `title.py` linter only understands English words, so it can't check these
> Hindi titles. They follow its rules by hand: under 60 characters before the series name, a
> number where one fits, and thumbnail/cover text different from the title.

## Part 3: copy-paste fields

Same for all five:
- **Audience**: No, not made for kids
- **Altered or synthetic content**: Yes. The voices are synthetic (Kokoro TTS).
- **Tags**: `dadi vs bhoot, दादी vs भूत, bhoot cartoon, horror comedy, hindi cartoon, bhoot wala cartoon, chudail, funny bhoot, hindi kahaniya, animated shorts`

### 1 · भूत से 200 साल का किराया माँगा
```
200 साल से पीपल पर रहने वाला चमन भूत दादी को डराने आया… दादी ने किराया माँग लिया। 😂
Chaman Bhoot tried to scare Dadi. Dadi asked for 200 years of rent.

#DadiVsBhoot #bhoot #horrorcomedy #hindicartoon #shorts
```
Pin this comment yourself: `अगली बार भूत दादी को कैसे डराए? Comment में बताओ 👇`

### 2 · भूत को किससे डर लगता है?
```
चमन भूत ने ठान लिया था… आज दादी को डराकर ही रहेगा। फिर दादी ने मुड़कर देखा। 💚 (मुल्तानी मिट्टी!)

#DadiVsBhoot #bhoot #horrorcomedy #hindicartoon #shorts
```

### 3 · भूत ने कहा "बू!"… दादी का जवाब
```
आधी रात, दादी के पीछे भूत… "बू!" 👻 और दादी बोलीं — बू तो तुम्हारे कुर्ते से आ रही है! 😂

#DadiVsBhoot #bhoot #horrorcomedy #hindicartoon #shorts
```

### 4 · भूत के पैर उल्टे क्यों होते हैं?
```
कहते हैं भूत के पैर उल्टे होते हैं… चमन भूत दादी को डराने चला, और चलता गया… उल्टा! 👣

#DadiVsBhoot #bhoot #horrorcomedy #hindicartoon #shorts
```

### 5 · दादी ने भूत की फ़ोटो खींची… फिर?
```
200 साल में पहली बार चमन भूत ने फ़ोटो खिंचवाई… 📸 फ़ोटो में कौन आया?

#DadiVsBhoot #bhoot #horrorcomedy #hindicartoon #shorts
```

## After posting
- Read the comments. Viewers will suggest scares ("भूत दादी का TV चला दे", "चुड़ैल को लाओ").
  The best ones become the next Shorts.
- Next ideas already lined up: **चुड़ैल की शादी** (a chudail comes to the house to arrange a match with
  Chaman); **भूत और बिजली कटौती** (a power cut: is the ghost to blame?); **दादी का Wi-Fi password**; **भूत की
  नौकरी** (Chaman gets a night-watchman job); **श्मशान से रील** (Chaman starts making Reels).
- Make new ones: add an entry to `studio/shorts.py`, then run `studio/make.sh <id>`.

---

# Long videos (16:9)

| File | Length | Thumbnail | Subtitles |
| --- | --- | --- | --- |
| `long/e01-bhoot-ka-license.mp4` | 2:54 | `channel-art/thumb_e01.png` | `long/e01-bhoot-ka-license.hi.srt`, `.en.srt` |
| `long/compilation-01.mp4` | 4:21 | `channel-art/thumb_comp.png` | — (Hindi captions are burned in) |

**When:** post Episode 1 on a weekend (for example **Saturday 7:30 pm IST**) once 3–4 Shorts are already up.
The Shorts bring in viewers, and the episode gives them something longer to watch. Post the compilation a week later.

**Upload settings (both):** Not made for kids · Altered/synthetic content: Yes · Category Comedy ·
Language Hindi · upload the custom thumbnail · add an **end screen** (the last 9 seconds of the episode
are a "फिर मिलेंगे… आज रात!" card, left clear for it): one "subscribe" element and one "best for viewer"
video. **Subtitles** (episode only): Studio → Subtitles → Add language → Hindi → Upload file → *with timing* →
`.hi.srt`; repeat for English → `.en.srt`. The English track opens the episode to non-Hindi viewers.

## Episode 1 · भूत का लाइसेंस

**Title**
```
भूत का लाइसेंस रद्द?! 👻 दादी vs भूत | Episode 1 | Hindi Horror Comedy Cartoon
```
**Description**
```
भूत संघ ने चमन भूत को नोटिस भेजा है — अगर सूरज उगने से पहले दादी नहीं डरीं, तो उसका भूत लाइसेंस रद्द! 😱
पाँच प्लान। एक रात। एक दादी जो कभी नहीं डरती। 😂

The Ghost Union has warned Chaman Bhoot: scare Dadi before sunrise, or lose his ghost licence. Five plans. One night. One Dadi who is never scared.

0:00 भूत का नोटिस
0:27 प्लान 1: ज़ंजीरें
0:47 प्लान 2: अँधेरा
1:09 प्लान 3: चुड़ैल
1:35 प्लान 4: उल्टा भूत
1:55 प्लान 5: आख़िरी रात
2:26 सुबह

अगली बार भूत कौन सा प्लान आज़माए? Comment करो 👇

#DadiVsBhoot #bhoot #horrorcomedy #hindicartoon #bhootwalacartoon
```
**Tags**: `dadi vs bhoot, दादी vs भूत, bhoot cartoon, hindi cartoon, horror comedy cartoon, bhoot wala cartoon, chudail cartoon, funny bhoot story, hindi kahaniya, animated story hindi`

## Compilation 1 · सारे किस्से

**Title**
```
दादी vs भूत — सारे किस्से 👻😂 Episode 1 + 5 Funny Bhoot Stories | Hindi Cartoon
```
**Description**
```
चमन भूत 200 साल से दादी को डराने की कोशिश कर रहा है… एक भी बार कामयाब नहीं हुआ। 😂 पूरा पहला एपिसोड और पाँच छोटे किस्से, एक साथ।

0:00 एपिसोड 1: भूत का लाइसेंस
2:54 भूत से 200 साल का किराया
3:17 भूत को किससे डर लगता है?
3:36 भूत ने कहा 'बू!'
3:50 भूत के उल्टे पैर
4:05 भूत की फ़ोटो

#DadiVsBhoot #bhoot #hindicartoon #horrorcomedy
```
