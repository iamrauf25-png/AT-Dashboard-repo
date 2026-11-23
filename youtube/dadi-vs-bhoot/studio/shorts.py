"""दादी vs भूत: shot lists. Same event format as Mo & Pebble (see youtube/engine/audio.py).

Formula for every Short: real horror build-up (fog, owl, riser, glowing eyes, jump scare) ->
Chaman Bhoot's big scare -> Dadi isn't scared -> one deadpan punchline -> music flips from horror to comic.
"""

SERIES = {"music": "horror", "ambience": ["crickets", "wind"]}

WIDE = dict(a="cam", x=540, y=960, zoom=1.0)
TWO = dict(a="cam", x=560, y=1060, zoom=1.15)
DADI_CU = dict(a="cam", x=690, y=1130, zoom=1.55)
TREE = dict(a="cam", x=340, y=680, zoom=1.6)


def cut(c): return {**c, "dur": 0}


COMIC = {"a": "music", "mode": "comic", "dur": 0}

SHORTS = {
    # ------------------------------------------------------------------
    "d01-kiraya": {
        "title": "भूत से 200 साल का किराया माँगा",
        "hook": {"text": "रात 12 बजे… पीपल पर कोई है", "dur": 2.6},
        "initial": {"cam": {"x": 380, "y": 780, "zoom": 1.3}, "dark": 0.15,
                    "ghost": {"alpha": 1, "eyesOnly": True, "x": 330, "y": 600, "look": [0.6, 0.4]}},
        "events": [
            {"say": "NARRATOR_HI", "text": "रात के बारह बजे… पीपल के पेड़ पर कोई था।", "sfx": [["owl", 0.4]],
             "act": [{"a": "cam", **{k: v for k, v in TREE.items() if k != "a"}}]},
            {"dur": 1.1, "sfx": [["riser", 0.0, 1.2]], "act": [{"a": "cam", "x": 540, "y": 960, "zoom": 1.0}]},
            {"dur": 0.45, "sfx": [["sting", 0.4]],
             "act": [{"a": "ghost", "eyesOnly": False, "x": 540, "y": 880, "scale": 1.6, "pose": "scare", "expr": "evil", "look": [0, 0.3], "ease": "in"},
                     {"a": "flash", "off": 0.4, "dur": 0.35}, {"a": "shake", "v": 22, "off": 0.4, "dur": 0.5}, {"a": "dark", "v": 0, "dur": 0.3}]},
            {"say": "CHAMAN", "text": "हा हा हा! मैं हूँ चमन भूत! दो सौ साल से इस पेड़ पर रहता हूँ!", "gap": 0.4},
            {"dur": 0.5, "act": [cut(DADI_CU), {"a": "ghost", "x": 430, "y": 980, "scale": 1.0, "pose": "float", "dur": 0},
                                 {"a": "dadi", "expr": "flat", "look": [-1, -0.3], "dur": 0}]},
            {"say": "DADI", "text": "दो सौ साल? और किराया एक रुपया नहीं दिया।", "act": [COMIC]},
            {"say": "CHAMAN", "text": "…किराया?", "tts": "किराया?", "act": [cut(TWO), {"a": "ghost", "expr": "sad", "look": [1, 0.3], "dur": 0}]},
            {"say": "DADI", "text": "हाँ। आज से बर्तन तुम धोओगे।", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            {"dur": 0.6, "sfx": [["clatter", 0.0]], "act": [{"a": "ghost", "pose": "plates", "expr": "sad", "dur": 0}]},
            {"say": "CHAMAN", "text": "भूत की भी कोई इज़्ज़त है या नहीं…", "tts": "भूत की भी कोई इज़्ज़त है, या नहीं?"},
            {"dur": 1.6, "sfx": [["wahwah", 0.0]]},
        ],
    },
    # ------------------------------------------------------------------
    "d02-ulte-pair": {
        "title": "भूत के पैर उल्टे क्यों होते हैं?",
        "hook": {"text": "भूत के पैर उल्टे क्यों?", "dur": 2.4},
        "initial": {"cam": {"x": 330, "y": 1290, "zoom": 1.7},
                    "ghost": {"alpha": 1, "x": 330, "y": 1280, "feet": True, "expr": "evil", "look": [1, 0]}},
        "events": [
            {"say": "NARRATOR_HI", "text": "कहते हैं… भूत के पैर उल्टे होते हैं।", "sfx": [["owl", 1.0]],
             "act": [{"a": "cam", "x": 460, "y": 1080, "zoom": 1.1}]},
            {"say": "CHAMAN", "text": "दादी! आज तो तुम डरोगी! मैं आ रहा हूँ!", "sfx": [["riser", 0.2, 2.0]],
             "act": [{"a": "ghost", "pose": "scare", "dur": 0}]},
            {"dur": 1.6, "act": [{"a": "ghost", "x": 150, "ease": "linear"}, {"a": "dadi", "look": [-1, 0], "expr": "flat", "dur": 0}]},
            {"say": "CHAMAN", "text": "मैं… आ… रहा… हूँ…", "tts": "मैं, आ, रहा, हूँ!",
             "act": [{"a": "ghost", "x": 0, "y": 1330, "scale": 0.75, "ease": "linear"}, {"a": "cam", "x": 470, "y": 1060, "zoom": 1.05}]},
            {"say": "DADI", "text": "बेटा, तुम जा रहे हो।", "act": [COMIC, {"a": "ghost", "x": -90, "ease": "linear"}]},
            {"say": "CHAMAN", "text": "ये पैर भी ना!", "tts": "अरे! ये पैर भी ना!", "act": [{"a": "ghost", "expr": "sad", "dur": 0}]},
            {"dur": 1.6, "sfx": [["wahwah", 0.0]], "act": [{"a": "dadi", "expr": "smug", "look": [0, 0], "dur": 0}]},
        ],
    },
    # ------------------------------------------------------------------
    "d03-photo": {
        "title": "दादी ने भूत की फ़ोटो खींची… फिर?",
        "hook": {"text": "भूत फ़ोटो में आता है?", "dur": 2.4},
        "initial": {"cam": {"x": 560, "y": 1060, "zoom": 1.15},
                    "ghost": {"alpha": 1, "x": 470, "y": 1020, "expr": "neutral", "look": [1, 0.3]},
                    "dadi": {"prop": "phone", "expr": "flat"}},
        "events": [
            {"say": "CHAMAN", "text": "दादी, मेरी एक फ़ोटो खींचो! दो सौ साल से कोई फ़ोटो नहीं है।"},
            {"say": "DADI", "text": "चल, मुस्कुरा।", "act": [{"a": "dadi", "look": [-1, 0], "dur": 0}]},
            {"dur": 0.9, "sfx": [["shutter", 0.5]], "act": [{"a": "ghost", "pose": "scare", "expr": "neutral", "dur": 0}, {"a": "flash", "off": 0.5, "dur": 0.25}]},
            {"dur": 0.8, "sfx": [["pop", 0.0]], "act": [{"a": "photo", "v": 1, "ease": "out"}]},
            {"say": "CHAMAN", "text": "मैं… फ़ोटो में क्यों नहीं आया?", "tts": "मैं फ़ोटो में क्यों नहीं आया?",
             "act": [{"a": "ghost", "pose": "float", "expr": "sad", "dur": 0}]},
            {"say": "DADI", "text": "अच्छा ही हुआ। चेहरा देखा है अपना?", "act": [COMIC]},
            {"dur": 1.6, "sfx": [["wahwah", 0.0]], "act": [{"a": "photo", "v": 0, "dur": 0.4}]},
        ],
    },
    # ------------------------------------------------------------------
    "d04-boo": {
        "title": "भूत ने कहा 'बू!'… दादी बोलीं…",
        "hook": {"text": "आधी रात… दादी के पीछे कौन?", "dur": 2.6},
        "initial": {"cam": {"x": 640, "y": 1060, "zoom": 1.2}, "dark": 0.3,
                    "ghost": {"alpha": 0, "x": 640, "y": 1000, "scale": 1.1, "pose": "float", "expr": "evil", "look": [0.3, 0.6]}},
        "events": [
            {"dur": 3.0, "sfx": [["gust", 0.0, 3.0], ["riser", 1.0, 2.0]],
             "act": [{"a": "cam", "x": 690, "y": 1080, "zoom": 1.45}, {"a": "ghost", "alpha": 1, "y": 900, "ease": "inout"}]},
            {"say": "CHAMAN", "text": "बू!", "tts": "बूऽऽ!", "sfx": [["sting", 0.0]],
             "act": [{"a": "ghost", "pose": "scare", "dur": 0}, {"a": "flash", "dur": 0.3}, {"a": "shake", "v": 20, "dur": 0.5}, {"a": "dark", "v": 0, "dur": 0.2}]},
            {"dur": 0.8},
            {"say": "DADI", "text": "बू तो तुम्हारे कुर्ते से आ रही है। नहाए कब थे?",
             "act": [COMIC, {"a": "dadi", "look": [-0.4, -1], "expr": "flat", "dur": 0}]},
            {"say": "CHAMAN", "text": "अठारह सौ सत्तर में।", "act": [{"a": "ghost", "pose": "float", "expr": "neutral", "dur": 0}]},
            {"say": "DADI", "text": "चल। बाल्टी उठा।", "sfx": [["boing", 0.4]],
             "act": [{"a": "dadi", "expr": "angry", "dur": 0}, {"a": "props", "bucket": True, "dur": 0, "off": 0.4}]},
            {"dur": 1.6, "sfx": [["wahwah", 0.0]], "act": [{"a": "ghost", "expr": "sad", "dur": 0}]},
        ],
    },
    # ------------------------------------------------------------------
    "d05-multani-mitti": {
        "title": "भूत को किससे डर लगता है?",
        "hook": {"text": "भूत भी डरता है?", "dur": 2.2},
        "initial": {"cam": {"x": 520, "y": 1040, "zoom": 1.15}, "dark": 0.72,
                    "ghost": {"alpha": 1, "x": 250, "y": 1080, "expr": "evil", "look": [1, 0.2]},
                    "dadi": {"facepack": True, "prop": "none", "expr": "flat", "look": [-1, 0]}},
        "events": [
            {"say": "NARRATOR_HI", "text": "उस रात चमन भूत ने ठान लिया… आज दादी को डराकर ही रहेगा।", "sfx": [["owl", 0.6]],
             "act": [{"a": "ghost", "x": 420, "ease": "linear"}]},
            {"say": "CHAMAN", "text": "श्श्श… दादी सो रही है।", "act": [{"a": "ghost", "x": 470, "ease": "linear"}]},
            {"dur": 1.3, "sfx": [["riser", 0.0, 1.3]], "act": [{"a": "ghost", "x": 540, "y": 1040, "pose": "scare", "ease": "in"}]},
            {"dur": 0.5, "sfx": [["sting", 0.0]],
             "act": [{"a": "dark", "v": 0, "dur": 0}, {"a": "dadi", "glint": 1, "dur": 0.2}, {"a": "flash", "dur": 0.3},
                     {"a": "shake", "v": 20, "dur": 0.5}, cut(DADI_CU), {"a": "music", "mode": "off", "dur": 0}]},
            {"say": "CHAMAN_SCARED", "text": "आआआआ!", "tts": "आआआआआ!",
             "act": [{"a": "ghost", "pose": "scared", "expr": "scared", "tremble": 1, "dur": 0}]},
            {"dur": 0.8, "sfx": [["whoosh", 0.0]],
             "act": [{"a": "ghost", "x": 330, "y": 620, "scale": 0.8, "ease": "in"}, {"a": "cam", "x": 540, "y": 960, "zoom": 1.0}]},
            {"say": "DADI", "text": "मुल्तानी मिट्टी है, पागल।", "act": [COMIC, {"a": "dadi", "glint": 0, "look": [-1, -1], "dur": 0.3}]},
            {"say": "CHAMAN_SCARED", "text": "दो सौ साल में इतना डरावना कुछ नहीं देखा।"},
            {"dur": 1.4, "sfx": [["boing", 0.1]]},
        ],
    },
}

# Long-form episodes (16:9) live in episodes.py and build with the same tools.
try:
    from episodes import EPISODES
    SHORTS.update(EPISODES)
except ImportError:
    pass
