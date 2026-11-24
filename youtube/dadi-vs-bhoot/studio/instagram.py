"""Instagram-first Reels for दादी vs भूत (9:16). Merged into SHORTS by shorts.py, so the same tools build them.

Built from reports/Instagram Reels growth for Dadi vs Bhoot.md:
- hook in the first 2 s, on screen AND spoken (sound-off viewers read it)
- narrator voiceover carries the story; character voices land the jokes
- designed for DM shares ("send this to your Dadi"), the strongest signal for reaching non-followers
- 25–35 s, cliffhanger that loops back to the first frame; only original audio (no licensed music)
- no gore or shock imagery in the first frame or cover
"""
from batch_02 import TWO, COMIC, cut

REELS = {
    "i01-har-ghar-ki-dadi": {
        "title": "हर घर में एक ऐसी दादी होती है",
        "hook": {"text": "हर घर में एक ऐसी दादी होती है 😂", "dur": 2.6},
        "initial": {"cam": {"x": 600, "y": 1100, "zoom": 1.45},
                    "ghost": {"alpha": 0, "x": 450, "y": 980, "expr": "evil", "look": [1, 0.3]},
                    "dadi": {"expr": "smug", "look": [0, 0.2]}},
        "events": [
            {"say": "NARRATOR_HI", "text": "हर घर में एक ऐसी दादी होती है… जिससे भूत भी डरता है।",
             "act": [{"a": "cam", "x": 560, "y": 1060, "zoom": 1.15}]},
            {"dur": 0.5, "sfx": [["sting", 0.25]],
             "act": [{"a": "ghost", "alpha": 1, "x": 450, "y": 960, "scale": 1.3, "pose": "scare", "ease": "in", "dur": 0.3},
                     {"a": "flash", "off": 0.25, "dur": 0.25}, {"a": "shake", "v": 16, "off": 0.25, "dur": 0.4}]},
            {"say": "CHAMAN", "text": "बू…! मैं हूँ चमन भूत!", "tts": "बूऽऽ! मैं हूँ चमन भूत!"},
            {"say": "DADI", "text": "भूत है तो क्या? दरवाज़ा खटखटा के आया कर।", "act": [COMIC, {"a": "dadi", "look": [-1, -0.3], "expr": "flat", "dur": 0}]},
            {"say": "NARRATOR_HI", "text": "दो सौ साल का भूत… और पचहत्तर साल की दादी।",
             "act": [{"a": "overlay", "text": "Ultra Pro Max दादी", "color": "#ffd27a", "dur": 3.0}, {"a": "ghost", "scale": 1.0, "pose": "float", "expr": "neutral", "dur": 0.3}]},
            {"say": "CHAMAN", "text": "दादी, मैं गाँव का सबसे डरावना भूत हूँ!", "act": [{"a": "ghost", "pose": "scare", "dur": 0}]},
            {"say": "DADI", "text": "अच्छा? तो जा, बर्तन भी डरावने तरीक़े से धो।", "act": [{"a": "dadi", "expr": "smug", "dur": 0}], "sfx": [["clatter", 2.4]]},
            {"dur": 0.6, "act": [{"a": "ghost", "pose": "plates", "expr": "sad", "dur": 0}]},
            {"say": "NARRATOR_HI", "text": "पर कल रात… कुएँ से कोई और भी आ रहा है।", "sfx": [["riser", 0.6, 2.0]],
             "act": [{"a": "music", "mode": "horror", "dur": 0}, {"a": "dark", "v": 0.7, "dur": 1.0},
                     {"a": "ghost2", "alpha": 1, "eyesOnly": True, "x": 160, "y": 1330, "dur": 0, "off": 1.0}]},
            {"say": "NARRATOR_HI", "text": "अपनी दादी को ये भेजो… और Follow करो।", "tts": "अपनी दादी को ये भेजो… और फ़ॉलो करो।",
             "act": [{"a": "overlay", "text": "अपनी दादी को भेजो 👵", "color": "#ffd27a", "dur": 3.2}]},
            {"dur": 0.6, "act": [{"a": "dark", "v": 0, "dur": 0.5}, {"a": "ghost2", "alpha": 0, "dur": 0.3},
                                 {"a": "ghost", "alpha": 0, "dur": 0.4}, {"a": "cam", "x": 600, "y": 1100, "zoom": 1.45, "dur": 0.5}]},
        ],
    },
    "i02-kuen-se-kaun": {
        "title": "कुएँ से कौन आया?",
        "hook": {"text": "कुएँ से कौन आया? 👀", "dur": 2.4},
        "initial": {"cam": {"x": 520, "y": 1080, "zoom": 1.15}, "dark": 0.55,
                    "ghost": {"alpha": 1, "x": 560, "y": 980, "expr": "neutral", "look": [-1, 0.4]},
                    "ghost2": {"alpha": 1, "eyesOnly": True, "x": 200, "y": 1330, "look": [1, -0.3]}},
        "events": [
            {"say": "NARRATOR_HI", "text": "कल रात कहा था ना… कुएँ से कोई आ रहा है।", "sfx": [["gust", 0.0, 3.0], ["riser", 1.2, 2.2]]},
            {"dur": 0.5, "sfx": [["sting", 0.3]],
             "act": [{"a": "ghost2", "eyesOnly": False, "x": 230, "y": 1020, "scale": 1.3, "pose": "scare", "expr": "evil", "ease": "in", "dur": 0.35},
                     {"a": "flash", "off": 0.3, "dur": 0.25}, {"a": "shake", "v": 16, "off": 0.3, "dur": 0.4}, {"a": "dark", "v": 0, "dur": 0.4},
                     {"a": "ghost", "pose": "scared", "expr": "scared", "tremble": 1, "off": 0.35, "dur": 0}]},
            {"say": "CHANDNI", "text": "मैं हूँ चाँदनी! तीन सौ साल से कुएँ में रहती हूँ!"},
            {"say": "CHAMAN_SCARED", "text": "दादी! बचाओ! चुड़ैल!", "act": [{"a": "ghost", "x": 800, "y": 780, "dur": 0.6}]},
            {"say": "DADI", "text": "तीन सौ साल कुएँ में? बेटा, कभी धूप भी देख लिया कर।",
             "act": [{"a": "music", "mode": "comic", "dur": 0}, {"a": "dadi", "look": [-1, -0.3], "expr": "flat", "dur": 0},
                     {"a": "ghost2", "scale": 1.0, "pose": "float", "expr": "neutral", "dur": 0.4}]},
            {"say": "CHANDNI", "text": "भूत तो डर गया… पर ये दादी क्यों नहीं डरी?", "act": [{"a": "ghost2", "look": [1, 0.2], "dur": 0}]},
            {"say": "NARRATOR_HI", "text": "कहानी अभी बाक़ी है… पूरा एपिसोड YouTube पर, दादी vs भूत।", "tts": "कहानी अभी बाक़ी है… पूरा एपिसोड यूट्यूब पर, दादी वर्सेस भूत।",
             "act": [{"a": "overlay", "text": "उसे भेजो जो चुड़ैल से डरता है 😂", "color": "#ffd27a", "dur": 3.4}, {"a": "ghost", "tremble": 0, "expr": "sad", "dur": 0}]},
            {"dur": 0.8, "act": [{"a": "dark", "v": 0.55, "dur": 0.6}, {"a": "ghost2", "eyesOnly": True, "x": 200, "y": 1330, "dur": 0.6},
                                 {"a": "ghost", "x": 560, "y": 980, "pose": "float", "expr": "neutral", "dur": 0.6}]},
        ],
    },
}
