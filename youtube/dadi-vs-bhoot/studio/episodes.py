"""दादी vs भूत: long-form episodes (16:9). Same event format as the Shorts, plus:
  "chapter": "<title>"  on an event marks a YouTube chapter starting there
  "en": "<English>"     on a line feeds the English subtitle file (captions.en.srt)
"""

WIDE = dict(a="cam", x=560, y=950, zoom=0.85)
TWO = dict(a="cam", x=600, y=1090, zoom=1.2)
DADI_CU = dict(a="cam", x=710, y=1140, zoom=1.7)
TREE = dict(a="cam", x=360, y=660, zoom=1.4)


def cut(c): return {**c, "dur": 0}
def music(m, off=0): return {"a": "music", "mode": m, "dur": 0, "off": off}
def title(t): return {"a": "overlay", "text": t, "color": "#a8f0ff"}


LICENSE_NOTICE = ("चमन भूत जी,\nदो सौ साल में आपने एक भी इंसान को नहीं डराया।\n"
                  "अगर कल सूरज उगने से पहले दादी नहीं डरीं…\nतो आपका भूत लाइसेंस रद्द!\n— भूत संघ")
DADI_STATEMENT = ("मैं, कमला देवी, लिखकर देती हूँ —\nआज रात चमन भूत ने मुझे बहुत डराया।\n"
                  "बहुत, बहुत डराया।\n— दादी")

EPISODES = {
    "e01-bhoot-ka-license": {
        "title": "भूत का लाइसेंस",
        "aspect": "16:9",
        "hook": {"text": "दादी vs भूत", "sub": "एपिसोड 1 · भूत का लाइसेंस", "dur": 4.2},
        "initial": {"cam": {"x": 360, "y": 660, "zoom": 1.4}, "dark": 0.15,
                    "ghost": {"alpha": 1, "eyesOnly": True, "x": 330, "y": 600, "look": [0.6, 0.4]}},
        "events": [
            # ---------------- cold open ----------------
            {"say": "NARRATOR_HI", "chapter": "भूत का नोटिस", "sfx": [["owl", 0.6]],
             "text": "एक गाँव… एक पुराना पीपल… और उस पर दो सौ साल से रहने वाला एक भूत।",
             "en": "A village… an old peepal tree… and a ghost who has lived in it for two hundred years.",
             "act": [{"a": "cam", "x": 560, "y": 950, "zoom": 0.85}]},
            {"say": "NARRATOR_HI", "text": "नाम — चमन भूत। काम — लोगों को डराना। रिकॉर्ड — ज़ीरो।",
             "tts": "नाम, चमन भूत। काम, लोगों को डराना। रिकॉर्ड, ज़ीरो।",
             "en": "Name: Chaman Bhoot. Job: scaring people. Record: zero.",
             "act": [{"a": "ghost", "eyesOnly": False, "expr": "neutral", "dur": 0}, {"a": "dark", "v": 0, "dur": 0.4},
                     {"a": "cam", "x": 420, "y": 760, "zoom": 1.3}], "sfx": [["pop", 4.0]]},
            {"dur": 1.2, "sfx": [["whoosh", 0.0]], "act": [{"a": "letter", "text": LICENSE_NOTICE, "title": "भूत संघ — नोटिस", "v": 1, "ease": "out"}]},
            {"dur": 4.5},
            {"say": "CHAMAN_SCARED", "text": "लाइसेंस रद्द?! फिर मैं कहाँ जाऊँगा? मुझे तो ठीक से उड़ना भी नहीं आता!",
             "en": "Licence cancelled?! Where will I go? I can't even fly properly!",
             "act": [{"a": "ghost", "expr": "scared", "dur": 0}]},
            {"dur": 0.7, "act": [{"a": "letter", "v": 0}]},
            {"say": "CHAMAN", "text": "ठीक है। आज रात… दादी डरेगी। पाँच प्लान… पाँचों पक्के!",
             "en": "Fine. Tonight… Dadi will be scared. Five plans… all foolproof!",
             "act": [{"a": "ghost", "pose": "scare", "expr": "evil", "dur": 0}], "sfx": [["sting", 0.2]], "gap": 0.5},

            # ---------------- plan 1: chains ----------------
            {"dur": 2.4, "chapter": "प्लान 1: ज़ंजीरें", "sfx": [["chains", 0.6]],
             "act": [title("प्लान 1: ज़ंजीरें"), {"a": "cam", **{k: v for k, v in TWO.items() if k != "a"}},
                     {"a": "ghost", "x": 430, "y": 1000, "pose": "chains", "expr": "evil", "look": [1, 0.3]},
                     {"a": "dadi", "prop": "chai", "expr": "flat", "look": [0, 0], "dur": 0}]},
            {"say": "CHAMAN", "text": "छन… छन… छन… मैं अपनी ज़ंजीरें लेकर आ गया हूँ!", "tts": "छन, छन, छन! मैं अपनी ज़ंजीरें लेकर आ गया हूँ!",
             "en": "Clink… clink… clink… I have brought my chains!", "sfx": [["chains", 0.0], ["chains", 1.6]]},
            {"dur": 1.2, "sfx": [["riser", 0.0, 1.2]], "act": [{"a": "dadi", "look": [-1, -0.3], "dur": 0}]},
            {"say": "DADI", "text": "इतनी चर्र-चर्र क्यों कर रही हैं? कभी तेल नहीं डाला?",
             "en": "Why are they squeaking so much? Have you never oiled them?", "act": [music("comic")]},
            {"say": "CHAMAN", "text": "भूतों की ज़ंजीरों में तेल नहीं डालते!", "en": "You don't oil a ghost's chains!",
             "act": [{"a": "ghost", "pose": "float", "expr": "neutral", "dur": 0}]},
            {"say": "DADI", "text": "तो फिर मेरे दरवाज़े में डाल दे। वो भी चर्र-चर्र करता है।",
             "en": "Then oil my door instead. It squeaks too.", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            {"dur": 1.8, "sfx": [["wahwah", 0.0]], "act": [{"a": "ghost", "expr": "sad", "dur": 0}, music("horror", 1.7)]},

            # ---------------- plan 2: darkness ----------------
            {"dur": 2.2, "chapter": "प्लान 2: अँधेरा",
             "act": [title("प्लान 2: अँधेरा"), {"a": "ghost", "x": 600, "y": 960, "expr": "evil", "pose": "float"},
                     {"a": "dadi", "expr": "flat", "look": [0, 0], "dur": 0}, {"a": "cam", "x": 640, "y": 1060, "zoom": 1.25}]},
            {"say": "CHAMAN", "text": "अँधेरा… सबको अँधेरे से डर लगता है।", "en": "Darkness… everyone is afraid of the dark.",
             "act": [{"a": "ghost", "look": [0.8, 0.2], "dur": 0}]},
            {"dur": 1.0, "sfx": [["blow", 0.1]], "act": [{"a": "lamp", "on": False, "off": 0.5, "dur": 0}, {"a": "dark", "v": 0.82, "off": 0.5, "dur": 0.4}]},
            {"dur": 1.6, "sfx": [["riser", 0.0, 1.6]], "act": [{"a": "ghost", "x": 560, "y": 1010, "pose": "scare"}]},
            {"say": "CHAMAN", "text": "हा हा हा… अब तुम्हें कौन बचाएगा?", "en": "Ha ha ha… who will save you now?"},
            {"dur": 0.7, "sfx": [["click", 0.1]],
             "act": [{"a": "dadi", "prop": "phone", "dur": 0}, {"a": "beam", "v": 1, "to": [560, 930], "off": 0.15, "dur": 0.15},
                     {"a": "ghost", "pose": "scared", "expr": "scared", "tremble": 1, "off": 0.2, "dur": 0}]},
            {"say": "CHAMAN_SCARED", "text": "आँख में टॉर्च मत मारो! आँख में टॉर्च मत मारो!", "en": "Don't shine the torch in my eyes! Don't shine it in my eyes!"},
            {"say": "DADI", "text": "दो सौ साल का भूत… और टॉर्च से डरता है।", "en": "A two-hundred-year-old ghost… scared of a torch.", "act": [music("comic")]},
            {"say": "DADI", "text": "चल, दीया वापस जला।", "en": "Go on, light the lamp again."},
            {"dur": 1.8, "sfx": [["wahwah", 0.2]],
             "act": [{"a": "lamp", "on": True, "dur": 0}, {"a": "dark", "v": 0, "dur": 0.4}, {"a": "beam", "v": 0, "dur": 0.3},
                     {"a": "dadi", "prop": "chai", "dur": 0}, {"a": "ghost", "pose": "float", "expr": "sad", "tremble": 0, "dur": 0.3}, music("horror", 1.7)]},

            # ---------------- plan 3: chudail ----------------
            {"dur": 2.4, "chapter": "प्लान 3: चुड़ैल", "sfx": [["gust", 0.0, 2.4]],
             "act": [title("प्लान 3: चुड़ैल"), {"a": "ghost", "x": 440, "y": 990, "wig": True, "pose": "scare", "expr": "evil", "look": [1, 0.3]},
                     {"a": "cam", **{k: v for k, v in TWO.items() if k != "a"}}]},
            {"say": "CHAMAN_SCARED", "text": "मैं… चुड़ैल हूँ… मेरे लंबे… काले… बाल…", "tts": "मैं चुड़ैल हूँ… मेरे लंबे, काले, बाल…",
             "en": "I am… a chudail… my long… black… hair…"},
            {"dur": 0.9, "act": [{"a": "dadi", "look": [-1, -0.3], "expr": "flat", "dur": 0}]},
            {"say": "DADI", "text": "हाय राम, इतने उलझे बाल! कभी तेल लगाया है?", "en": "Oh my, such tangled hair! Have you ever oiled it?", "act": [music("comic")]},
            {"say": "CHAMAN", "text": "चुड़ैलें तेल नहीं लगातीं!", "en": "Chudails don't oil their hair!", "act": [{"a": "ghost", "pose": "float", "dur": 0}]},
            {"say": "DADI", "text": "इसीलिए तो डरावनी लगती हैं। बैठ, चम्पी कर दूँ।", "en": "That's exactly why they look scary. Sit, I'll give you a head massage.",
             "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            {"dur": 1.4, "sfx": [["boing", 0.6]], "act": [{"a": "ghost", "x": 560, "y": 1110, "scale": 0.85, "expr": "neutral", "look": [0, 0]}]},
            {"say": "CHAMAN", "text": "आह… दो सौ साल में पहली बार… बड़ा अच्छा लग रहा है।", "tts": "आह… दो सौ साल में पहली बार, बड़ा अच्छा लग रहा है।",
             "en": "Ahh… first time in two hundred years… this feels so good."},
            {"dur": 0.6},
            {"say": "CHAMAN", "text": "अरे! ये तो प्लान था ही नहीं!", "en": "Hey! This wasn't the plan at all!",
             "act": [{"a": "ghost", "x": 400, "y": 980, "scale": 1, "wig": False, "expr": "sad", "dur": 0.5}], "sfx": [["whoosh", 0.0]]},
            {"dur": 1.6, "sfx": [["wahwah", 0.0]], "act": [music("horror", 1.5)]},

            # ---------------- plan 4: upside-down ghost ----------------
            {"dur": 2.2, "chapter": "प्लान 4: उल्टा भूत", "sfx": [["whoosh", 0.3]],
             "act": [title("प्लान 4: उल्टा भूत"), {"a": "ghost", "x": 470, "y": 800, "rot": 3.14159, "expr": "evil", "pose": "float", "look": [0.6, -0.5]},
                     {"a": "cam", "x": 580, "y": 980, "zoom": 1.05}]},
            {"say": "NARRATOR_HI", "text": "कहते हैं, पीपल से उल्टा लटका भूत सबसे ख़तरनाक होता है।",
             "en": "They say a ghost hanging upside down from a peepal tree is the most dangerous of all.", "sfx": [["riser", 1.5, 2.0]]},
            {"say": "CHAMAN", "text": "दादी… ऊपर देखो…", "tts": "दादी… ऊपर देखो…", "en": "Dadi… look up…"},
            {"dur": 0.6, "sfx": [["sting", 0.0]], "act": [{"a": "flash", "dur": 0.3}, {"a": "shake", "v": 18, "dur": 0.5}, {"a": "dadi", "look": [-0.5, -1], "dur": 0}]},
            {"say": "DADI", "text": "उल्टा लटक के क्या मिलेगा? सीधा हो जा, ख़ून सिर में चढ़ जाएगा।",
             "en": "What will you get hanging upside down? Straighten up, the blood will rush to your head.", "act": [music("comic")]},
            {"say": "CHAMAN", "text": "भूतों में ख़ून नहीं होता, दादी!", "en": "Ghosts don't have blood, Dadi!"},
            {"say": "DADI", "text": "तो फिर दिमाग़ भी नहीं होगा।", "en": "Then you don't have a brain either.", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            {"dur": 1.8, "sfx": [["thud", 0.4], ["wahwah", 0.5]],
             "act": [{"a": "ghost", "rot": 0, "x": 430, "y": 1000, "expr": "sad", "dur": 0.4, "ease": "in"}]},

            # ---------------- plan 5: the last night ----------------
            {"dur": 2.2, "chapter": "प्लान 5: आख़िरी रात",
             "act": [title("प्लान 5: ???"), music("off"), {"a": "cam", **{k: v for k, v in TWO.items() if k != "a"}},
                     {"a": "dadi", "expr": "neutral", "dur": 0}]},
            {"say": "CHAMAN", "text": "कोई प्लान नहीं बचा। कल से मैं भूत भी नहीं रहूँगा।",
             "en": "No plans left. From tomorrow, I won't even be a ghost.", "act": [music("tender")]},
            {"say": "DADI", "text": "क्या हुआ? बता मुझे।", "en": "What happened? Tell me.", "act": [{"a": "dadi", "look": [-1, -0.2], "dur": 0}]},
            {"say": "CHAMAN", "text": "भूत संघ ने लिखा है… अगर आप नहीं डरीं, तो मेरा लाइसेंस रद्द।",
             "en": "The Ghost Union wrote… if you aren't scared, my licence is cancelled."},
            {"dur": 1.2},
            {"say": "DADI", "text": "बस इतनी सी बात? ला, काग़ज़ दे।", "en": "That's all? Give me the paper."},
            {"dur": 1.2, "sfx": [["pop", 0.0]], "act": [{"a": "letter", "text": DADI_STATEMENT, "title": "दादी का बयान", "v": 1, "ease": "out"}]},
            {"dur": 4.0},
            {"say": "CHAMAN", "text": "पर दादी… आप तो डरी ही नहीं!", "en": "But Dadi… you weren't scared at all!",
             "act": [{"a": "letter", "v": 0, "dur": 0.6}, {"a": "ghost", "expr": "neutral", "dur": 0}]},
            {"say": "DADI", "text": "दो सौ साल से मेरे पेड़ पर रहता है। तू भूत है… पर अपना है।",
             "en": "You've lived in my tree for two hundred years. You're a ghost… but you're family.",
             "act": [{"a": "dadi", "expr": "smug", "dur": 0}], "gap": 0.6},
            {"say": "DADI", "text": "ले, चाय पी।", "en": "Here, have some tea.", "act": [{"a": "ghost", "pose": "chai", "dur": 0, "off": 0.5}]},

            # ---------------- sunrise ----------------
            {"dur": 3.6, "chapter": "सुबह", "sfx": [["birds", 0.5]],
             "act": [{"a": "dawn", "v": 0.85}, {"a": "fog", "v": 0.3}, {"a": "cam", "x": 560, "y": 950, "zoom": 0.85}]},
            {"say": "NARRATOR_HI", "text": "उस सुबह, भूत संघ को एक चिट्ठी मिली। और चमन भूत का लाइसेंस… बच गया।",
             "en": "That morning, the Ghost Union received a letter. And Chaman Bhoot's licence… was saved.", "sfx": [["birds", 2.0]]},
            {"say": "CHAMAN", "text": "शुक्रिया दादी! मैं चलता हूँ… सूरज निकल रहा है!", "en": "Thank you, Dadi! I'll be going… the sun is coming up!",
             "act": [{"a": "ghost", "pose": "float", "dur": 0}]},
            {"dur": 1.8, "sfx": [["whoosh", 0.0]], "act": [{"a": "ghost", "x": 330, "y": 640, "alpha": 0.35, "scale": 0.8}]},
            {"say": "DADI", "text": "हाँ हाँ, जा। और सुन… रात को आ जाना। बर्तन बहुत पड़े हैं।",
             "en": "Yes, yes, go. And listen… come back tonight. There are lots of dishes waiting.",
             "act": [{"a": "dadi", "look": [-1, -1], "dur": 0}], "sfx": [["boing", 4.6]]},
            {"dur": 9.0, "act": [{"a": "overlay", "text": "फिर मिलेंगे… आज रात!", "color": "#ffd27a", "dur": 9.0}]},
        ],
    },
}
