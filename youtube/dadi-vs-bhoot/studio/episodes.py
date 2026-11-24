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


# ---------------------------------------------------------------------------
# Episode 2 — a different arc from Episode 1: an arranged-match comedy, not "Dadi beats the scare".
WELL = dict(a="cam", x=-200, y=1080, zoom=1.3)
THREE = dict(a="cam", x=300, y=1060, zoom=0.95)
CD = dict(a="cam", x=560, y=1090, zoom=1.2)


def cam(c, **kw): return {**c, **kw}


def L(who, text, en, **kw):
    d = {"say": who, "text": text, "en": en}; d.update(kw); return d


EPISODES["e02-chaman-ka-rishta"] = {
    "title": "चमन का रिश्ता",
    "aspect": "16:9",
    "hook": {"text": "दादी vs भूत", "sub": "एपिसोड 2 · चमन का रिश्ता", "dur": 4.2},
    "initial": {"cam": {"x": 360, "y": 700, "zoom": 1.35}, "dark": 0.1,
                "ghost": {"alpha": 1, "x": 340, "y": 640, "expr": "sad", "look": [0.3, 0.5]}},
    "events": [
        # ---------------- अकेला भूत ----------------
        L("NARRATOR_HI", "पीपल के पेड़ पर दो सौ साल से एक भूत रहता है। डराने में फ़ेल… और अकेला।",
          "A ghost has lived in the peepal tree for two hundred years. A failure at scaring… and alone.",
          chapter="अकेला भूत", sfx=[["owl", 0.8]]),
        L("CHAMAN", "ऊऊऊ… कोई तो डरो… कोई तो आओ…", "Oooh… somebody be scared… somebody come…",
          tts="ऊऊऊ… कोई तो डरो… कोई तो आओ…", act=[{"a": "cam", "x": 560, "y": 1000, "zoom": 1.0}, {"a": "dark", "v": 0, "dur": 1.0}]),
        {"dur": 1.2, "act": [{"a": "ghost", "x": 400, "y": 990, "ease": "inout"}, cam(CD)]},
        L("DADI", "फिर रो रहा है? आज क्या हुआ?", "Crying again? What happened today?", act=[{"a": "dadi", "look": [-1, -0.3], "expr": "flat", "dur": 0}]),
        L("CHAMAN", "दादी, आज पीपल पर दो उल्लू आए। दोनों जोड़े में। और मैं… अकेला।",
          "Dadi, two owls came to the peepal today. A couple. And me… all alone.", sfx=[["owl", 0.5]]),
        L("DADI", "दो सौ साल का हो गया। शादी की उम्र तो कब की निकल गई।", "You're two hundred. The marrying age passed long ago."),
        L("CHAMAN", "भूतों की शादी की कोई उम्र नहीं होती!", "Ghosts don't have a marrying age!", act=[{"a": "ghost", "expr": "neutral", "dur": 0}]),
        L("DADI", "हम्म… तो फिर रिश्ता ढूँढना पड़ेगा।", "Hmm… then we'll have to find you a match.",
          act=[{"a": "music", "mode": "comic", "dur": 0}, {"a": "dadi", "expr": "smug", "dur": 0}], gap=0.6),

        # ---------------- रिश्ते की बात ----------------
        L("CHAMAN", "पर दादी, मुझसे शादी कौन करेगा? मैं तो किसी को डरा भी नहीं पाता।",
          "But Dadi, who will marry me? I can't even scare anyone.", chapter="रिश्ते की बात", act=[{"a": "ghost", "expr": "sad", "dur": 0}]),
        L("DADI", "शादी में डराना नहीं पड़ता, निभाना पड़ता है।", "Marriage isn't about scaring. It's about sticking together.",
          act=[{"a": "dadi", "expr": "neutral", "dur": 0}]),
        L("DADI", "और रिश्ता मेरे पास है। कुएँ वाली चाँदनी।", "And I have just the match. Chandni, from the well.", act=[{"a": "dadi", "expr": "smug", "dur": 0}]),
        L("CHAMAN_SCARED", "कुएँ वाली चुड़ैल?! वो तो बहुत डरावनी है!", "The chudail from the well?! She's terrifying!",
          act=[{"a": "ghost", "expr": "scared", "tremble": 0.7, "dur": 0}]),
        L("DADI", "हाँ। तेरे लिए बिल्कुल सही।", "Yes. Perfect for you."),
        L("CHAMAN", "…सच में?", "…Really?", tts="सच में?", act=[{"a": "ghost", "tremble": 0, "expr": "neutral", "dur": 0}]),
        L("DADI", "चल, तैयार हो जा। बाल तो हैं नहीं, चोटी ही सँवार ले।", "Go, get ready. You've no hair, so at least fix your choti."),
        {"dur": 1.6, "sfx": [["boing", 0.1]], "act": [{"a": "music", "mode": "horror", "off": 1.4, "dur": 0}]},

        # ---------------- कुएँ वाली चुड़ैल ----------------
        {"dur": 2.4, "chapter": "कुएँ वाली चुड़ैल", "sfx": [["gust", 0.0, 2.4]],
         "act": [cam(WELL), {"a": "fog", "v": 1.4}, {"a": "dark", "v": 0.25},
                 {"a": "ghost2", "alpha": 1, "eyesOnly": True, "x": -280, "y": 1180, "dur": 0}]},
        L("NARRATOR_HI", "गाँव के पुराने कुएँ में रहती है चाँदनी चुड़ैल। कहते हैं, जो भी उसमें झाँकता है… वापस नहीं आता।",
          "In the village's old well lives Chandni Chudail. They say whoever peeks into it… never comes back.", sfx=[["riser", 4.0, 2.0]]),
        {"dur": 0.6, "act": [cam(THREE)]},
        L("DADI", "चाँदनी! ओ चाँदनी! बाहर आ, लड़के वाले आए हैं!", "Chandni! Oh, Chandni! Come out, the groom's family is here!",
          act=[{"a": "dadi", "look": [-1, -0.2], "dur": 0}]),
        {"dur": 1.8, "sfx": [["riser", 0.0, 1.6]], "act": [{"a": "ghost2", "y": 1120, "ease": "linear"}]},
        {"dur": 0.5, "sfx": [["sting", 0.3]],
         "act": [{"a": "ghost2", "eyesOnly": False, "y": 960, "scale": 1.35, "pose": "scare", "expr": "evil", "ease": "in", "dur": 0.4},
                 {"a": "flash", "off": 0.35, "dur": 0.3}, {"a": "shake", "v": 18, "off": 0.35, "dur": 0.5}, {"a": "dark", "v": 0, "dur": 0.4},
                 {"a": "ghost", "expr": "scared", "tremble": 1, "pose": "scared", "dur": 0, "off": 0.4}]},
        L("CHANDNI", "कौन है जो आधी रात को चाँदनी को बुलाता है?", "Who dares call Chandni at midnight?"),
        L("CHAMAN_SCARED", "द-द-दादी… मुझे घर जाना है।", "D-d-Dadi… I want to go home.", tts="द… द… दादी… मुझे घर जाना है।"),
        L("DADI", "तेरा घर ये पेड़ है, यहीं तो है। चुपचाप बैठ।", "Your home is this tree, it's right here. Sit quietly.",
          act=[{"a": "music", "mode": "comic", "dur": 0}, {"a": "dadi", "expr": "flat", "dur": 0}]),
        L("CHANDNI", "ओह… दादी, आप हैं? नमस्ते, नमस्ते।", "Oh… Dadi, it's you? Namaste, namaste.",
          act=[{"a": "ghost2", "pose": "float", "expr": "neutral", "scale": 1.0, "dur": 0.4}]),
        {"dur": 1.6, "sfx": [["whoosh", 0.0]],
         "act": [{"a": "ghost2", "x": 60, "y": 1000, "look": [1, 0.2]}, {"a": "ghost", "tremble": 0, "pose": "float", "expr": "neutral", "dur": 0.3}]},

        # ---------------- इंटरव्यू ----------------
        L("DADI", "बैठो बेटा। तो… ये है हमारा चमन। दो सौ साल का, और पेड़ अपना है।",
          "Sit, dear. So… this is our Chaman. Two hundred years old, and he has his own tree.", chapter="इंटरव्यू",
          act=[{"a": "dadi", "expr": "smug", "dur": 0}]),
        L("CHANDNI", "पेड़ किराये का है या अपना?", "Is the tree rented or owned?"),
        L("DADI", "किराया तो इसने आज तक दिया ही नहीं। तो अपना ही समझो।", "He's never paid a rupee of rent. So consider it his own."),
        L("CHANDNI", "हम्म। और काम क्या करते हैं?", "Hmm. And what does he do for a living?"),
        L("CHAMAN", "मैं… लोगों को डराता हूँ।", "I… scare people.", act=[{"a": "ghost", "look": [-1, 0.1], "dur": 0}]),
        L("CHANDNI", "अच्छा? अब तक कितनों को डराया?", "Really? How many have you scared so far?"),
        {"dur": 1.4, "sfx": [["owl", 0.2]]},
        L("CHAMAN", "…ज़ीरो।", "…Zero.", tts="ज़ीरो।", act=[{"a": "overlay", "text": "0", "color": "#ff5a4f", "dur": 1.6}, {"a": "ghost", "expr": "sad", "dur": 0}]),
        L("CHANDNI", "ज़ीरो?! दो सौ साल में ज़ीरो?", "Zero?! Zero in two hundred years?"),
        L("DADI", "पर बर्तन बहुत अच्छे धोता है।", "But he washes dishes really well."),
        L("CHANDNI", "…ये तो बड़ी बात है। मेरे कुएँ में तीन सौ साल के बर्तन पड़े हैं।",
          "…Now that's impressive. There are three hundred years of dishes in my well.", tts="ये तो बड़ी बात है। मेरे कुएँ में तीन सौ साल के बर्तन पड़े हैं।"),
        {"dur": 1.0, "sfx": [["boing", 0.0]]},
        L("DADI", "अब तुम बताओ, चाँदनी। खाना बनाना आता है?", "Now your turn, Chandni. Can you cook?"),
        L("CHANDNI", "डराना आता है।", "I can scare."),
        L("DADI", "वो तो इस घर में किसी को नहीं आता।", "Well, nobody in this house can do that."),
        L("CHAMAN", "दादी!", "Dadi!", gap=0.6),

        # ---------------- चमन का शो-ऑफ़ ----------------
        L("CHAMAN", "चाँदनी जी, मैं दिखाता हूँ मैं कितना डरावना हूँ! दादी, तैयार हो जाओ!",
          "Chandni ji, let me show you how scary I am! Dadi, get ready!", chapter="चमन का शो-ऑफ़",
          act=[{"a": "music", "mode": "horror", "dur": 0}, cam(CD)]),
        {"dur": 1.4, "sfx": [["chains", 0.2], ["riser", 0.0, 1.4]], "act": [{"a": "ghost", "pose": "chains", "expr": "evil", "scale": 1.25, "y": 960}]},
        L("CHAMAN", "हा हा हा! मैं हूँ चमन भूत! डरो!", "Ha ha ha! I am Chaman Bhoot! Be afraid!",
          sfx=[["sting", 0.0]], act=[{"a": "ghost", "pose": "scare", "dur": 0}, {"a": "flash", "dur": 0.3}, {"a": "shake", "v": 16, "dur": 0.4}]),
        L("DADI", "चाय ठंडी हो रही है। जल्दी डरा।", "My tea's getting cold. Scare me quickly.", act=[{"a": "music", "mode": "comic", "dur": 0}]),
        L("CHANDNI", "हा हा हा हा!", "Ha ha ha ha!", tts="हा हा हा हा हा!", act=[cam(THREE)]),
        L("CHAMAN", "आप… हँस रही हैं?", "You're… laughing?", tts="आप हँस रही हैं?", act=[{"a": "ghost", "pose": "float", "scale": 1.0, "y": 990, "expr": "sad", "dur": 0.3}]),
        L("CHANDNI", "रुको। मैं दिखाती हूँ, डराना किसे कहते हैं।", "Wait. Let me show you what real scaring looks like.",
          act=[{"a": "music", "mode": "horror", "dur": 0}]),
        {"dur": 1.6, "sfx": [["blow", 0.2], ["riser", 0.3, 1.3]],
         "act": [{"a": "lamp", "on": False, "off": 0.5, "dur": 0}, {"a": "dark", "v": 0.78, "off": 0.5, "dur": 0.4},
                 {"a": "ghost2", "x": 470, "y": 960, "scale": 1.45, "pose": "scare", "expr": "evil"}, {"a": "ghost", "x": 180, "y": 1000, "dur": 0.8}]},
        L("CHANDNI", "दादी… मैं तुम्हें… कुएँ में ले जाऊँगी…", "Dadi… I'll take you… into the well…", tts="दादी… मैं तुम्हें… कुएँ में… ले जाऊँगी…"),
        {"dur": 0.8, "sfx": [["click", 0.2]],
         "act": [{"a": "dadi", "prop": "phone", "dur": 0}, {"a": "beam", "v": 1, "to": [470, 880], "off": 0.25, "dur": 0.15},
                 {"a": "ghost2", "pose": "scared", "expr": "scared", "tremble": 1, "off": 0.3, "dur": 0}]},
        L("DADI", "कुएँ में? पहले उसकी सफ़ाई तो कर ले। तीन सौ साल के बर्तन पड़े हैं वहाँ।",
          "Into the well? Clean it first. Three hundred years of dishes are lying in there.",
          act=[{"a": "music", "mode": "comic", "dur": 0}]),
        {"dur": 1.0, "act": [{"a": "lamp", "on": True, "dur": 0}, {"a": "dark", "v": 0, "dur": 0.4}, {"a": "beam", "v": 0, "dur": 0.3},
                             {"a": "dadi", "prop": "chai", "dur": 0}, {"a": "ghost2", "x": 120, "y": 1000, "scale": 1.0, "pose": "float", "tremble": 0, "expr": "neutral"}]},
        L("CHANDNI", "दादी… आप सच में किसी से नहीं डरतीं?", "Dadi… are you really not afraid of anything?"),
        L("DADI", "डरती हूँ ना। बिजली के बिल से।", "Of course I am. Of the electricity bill.", act=[{"a": "dadi", "expr": "smug", "dur": 0}]),
        L("CHAMAN", "हा हा हा!", "Ha ha ha!", tts="हा हा हा हा!", act=[{"a": "ghost", "expr": "neutral", "pose": "scare", "dur": 0}]),
        L("CHANDNI", "हा हा हा!", "Ha ha ha!", tts="हा हा हा हा!", gap=0.8),

        # ---------------- रिश्ता पक्का? ----------------
        L("CHANDNI", "चमन जी… आप डरावने तो बिल्कुल नहीं हो।", "Chaman ji… you're not scary at all.", chapter="रिश्ता पक्का?",
          act=[{"a": "music", "mode": "tender", "dur": 0}, {"a": "ghost", "pose": "float", "dur": 0}, {"a": "ghost2", "x": 200, "dur": 1.0}]),
        L("CHAMAN", "पता है।", "I know.", act=[{"a": "ghost", "expr": "sad", "dur": 0}]),
        L("CHANDNI", "पर सच्चे हो। दो सौ साल में किसी ने मुझसे इतनी सच्ची बात नहीं की।",
          "But you're honest. In two hundred years, no one has been this honest with me."),
        L("CHAMAN", "तो… रिश्ता पक्का?", "So… is it a match?", tts="तो… रिश्ता पक्का?", act=[{"a": "ghost", "expr": "neutral", "dur": 0}]),
        L("CHANDNI", "पक्का। पर एक शर्त है।", "It's a match. But on one condition."),
        L("CHANDNI", "शादी के बाद हम पेड़ पर रहेंगे, कुएँ में नहीं। वहाँ सीलन बहुत है।",
          "After the wedding we live in the tree, not the well. It's far too damp down there."),
        L("DADI", "और मेरी भी एक शर्त है।", "And I have a condition too."),
        L("CHAMAN", "क्या, दादी?", "What is it, Dadi?"),
        L("DADI", "बर्तन अब तुम दोनों मिलकर धोओगे।", "From now on, you'll both wash the dishes together.", act=[{"a": "dadi", "expr": "smug", "dur": 0}]),
        L("CHANDNI", "दादी… सच बताऊँ? असली चुड़ैल तो आप हो।", "Dadi… shall I be honest? You're the real chudail here."),
        L("DADI", "तारीफ़ के लिए शुक्रिया, बहू।", "Thank you for the compliment, bahu.", sfx=[["chime", 1.6]], gap=0.8),
        {"dur": 2.6, "act": [{"a": "ghost", "x": 300, "y": 960}, {"a": "ghost2", "x": 160, "y": 960}, {"a": "cam", "x": 400, "y": 980, "zoom": 0.95}]},
        L("NARRATOR_HI", "और इस तरह, दो सौ साल बाद… पीपल वाले भूत का घर बस गया।",
          "And so, after two hundred years… the peepal ghost finally found a family."),
        L("NARRATOR_HI", "पर एक सवाल अब भी बाक़ी है… शादी में डरेगा कौन?", "But one question still remains… who's going to be scared at the wedding?",
          sfx=[["sting", 4.2]], act=[{"a": "music", "mode": "horror", "dur": 0, "off": 4.0}]),
        {"dur": 9.0, "act": [{"a": "overlay", "text": "अगला एपिसोड: भूत की शादी!", "color": "#ffd27a", "dur": 9.0}]},
    ],
}


# ---------------------------------------------------------------------------
# Episode 3 — the wedding. Payoff for the series: Chaman finally scares his first human (a thief).
RIGHT = dict(a="cam", x=1180, y=1060, zoom=1.1)
M = lambda m, off=0: {"a": "music", "mode": m, "dur": 0, "off": off}

WEDDING_LIST = ("1. पीपल पर झालर ✔\n2. कुएँ से दुल्हन ✔\n3. बारात: उल्लू, चमगादड़, एक मेंढक\n"
                "4. मिठाई: दादी के लड्डू\n5. मेहमान (इंसान): ज़ीरो… अब तक")
UNION_LETTER = ("चमन भूत जी,\nबधाई हो! आपकी शादी और…\nआपका पहला डराया हुआ इंसान: 1\n"
                "आपका लाइसेंस अब 'जूनियर भूत' से 'भूत' हो गया है।\n— भूत संघ")

EPISODES["e03-bhoot-ki-shaadi"] = {
    "title": "भूत की शादी",
    "aspect": "16:9",
    "pace": 0.9, "gap": 0.5,   # slower delivery and longer comic pauses for long-form
    "hook": {"text": "दादी vs भूत", "sub": "एपिसोड 3 · भूत की शादी", "dur": 4.2},
    "initial": {"cam": {"x": 400, "y": 1000, "zoom": 1.0}, "dark": 0.1,
                "ghost": {"alpha": 1, "x": 380, "y": 990, "expr": "scared", "look": [1, 0.2], "tremble": 0.5},
                "ghost2": {"alpha": 0, "x": -280, "y": 1180}},
    "events": [
        # ---------------- शादी की तैयारी ----------------
        L("NARRATOR_HI", "आज पीपल वाले पेड़ पर एक ऐसी शादी है… जो गाँव ने दो सौ साल में नहीं देखी।",
          "Tonight, the peepal tree hosts a wedding… the kind this village hasn't seen in two hundred years.",
          chapter="शादी की तैयारी", sfx=[["owl", 0.6]], act=[{"a": "dark", "v": 0, "dur": 1.5}]),
        L("CHAMAN_SCARED", "दादी, मेरा दिल ज़ोर-ज़ोर से धड़क रहा है!", "Dadi, my heart is pounding!",
          act=[cam(CD)]),
        L("DADI", "भूत का दिल कब से धड़कने लगा?", "Since when does a ghost's heart beat?", act=[{"a": "dadi", "look": [-1, -0.3], "expr": "smug", "dur": 0}, M("comic")]),
        L("CHAMAN", "आज से। शादी का दिन है ना।", "Since today. It's my wedding day.", act=[{"a": "ghost", "tremble": 0, "expr": "neutral", "dur": 0}]),
        L("DADI", "ठीक है, लिस्ट देख लेते हैं। सब तैयार है ना?", "Fine, let's check the list. Is everything ready?"),
        {"dur": 1.2, "sfx": [["pop", 0.0]], "act": [{"a": "letter", "title": "शादी की लिस्ट", "text": WEDDING_LIST, "v": 1, "ease": "out"}]},
        {"dur": 5.0},
        L("CHAMAN", "बस एक दिक़्क़त है, दादी। कोई इंसान मेहमान नहीं आ रहा।", "Just one problem, Dadi. No human guests are coming.",
          act=[{"a": "letter", "v": 0, "dur": 0.6}, {"a": "ghost", "expr": "sad", "dur": 0}]),
        L("DADI", "क्यों? न्योता दिया था?", "Why? Did you invite them?"),
        L("CHAMAN", "दिया था। रात के बारह बजे, पीपल के पेड़ से, चिल्ला-चिल्ला के।", "I did. At midnight, from the peepal tree, at the top of my voice."),
        L("DADI", "तो फिर तो पूरा गाँव ताले लगाकर सो गया होगा।", "Then the whole village has locked its doors and gone to sleep."),
        L("CHAMAN", "देखा? मैं डरा सकता हूँ! बस किसी के सामने नहीं।", "See? I CAN scare people! Just not in front of them.",
          act=[{"a": "ghost", "pose": "scare", "expr": "neutral", "dur": 0}]),
        L("DADI", "चल, कोई बात नहीं। इंसान मेहमान मैं हूँ ना।", "Never mind. I'm your human guest, aren't I?",
          act=[{"a": "dadi", "expr": "neutral", "dur": 0}, M("tender")], gap=0.6),
        L("CHAMAN", "…दादी, आप सच में आएँगी?", "…Dadi, you'll really come?", tts="दादी, आप सच में आएँगी?",
          act=[{"a": "ghost", "pose": "float", "expr": "neutral", "dur": 0}]),
        L("DADI", "आना कहाँ है? शादी मेरे आँगन में ही तो है।", "Come where? The wedding is right here in my courtyard.",
          act=[{"a": "dadi", "expr": "smug", "dur": 0}], gap=0.6),

        # ---------------- आधी रात की बारात ----------------
        {"dur": 1.4, "chapter": "आधी रात की बारात", "act": [M("comic"), cam(THREE)]},
        L("NARRATOR_HI", "आधी रात। बारात तैयार। बाराती: दो उल्लू, चार चमगादड़… और एक मेंढक, जो रास्ता भूलकर आ गया था।",
          "Midnight. The baraat is ready. The guests: two owls, four bats… and a frog who got lost on the way.",
          sfx=[["owl", 2.0], ["boing", 6.5]]),
        L("CHAMAN", "दादी, मैं अपनी एंट्री डरावनी करूँगा! धुआँ, आवाज़ें, ज़ंजीरें!", "Dadi, I'll make my entry scary! Smoke, noises, chains!",
          act=[{"a": "ghost", "pose": "chains", "expr": "evil", "dur": 0}], sfx=[["chains", 0.4]]),
        L("DADI", "शादी में डराते नहीं, नाचते हैं।", "At a wedding you don't scare people. You dance."),
        L("CHAMAN_SCARED", "पर मुझे नाचना नहीं आता!", "But I can't dance!", act=[{"a": "ghost", "pose": "scared", "expr": "scared", "dur": 0}]),
        L("DADI", "डराना भी कहाँ आता है? फिर भी दो सौ साल से कर रहा है।", "You can't scare either. You've still been at it for two hundred years.",
          act=[{"a": "dadi", "expr": "smug", "dur": 0}]),
        {"dur": 3.2, "sfx": [["boing", 0.2], ["boing", 1.2], ["boing", 2.2]],
         "act": [{"a": "ghost", "pose": "scare", "expr": "neutral", "dur": 0}, {"a": "ghost", "x": 460, "y": 960, "dur": 0.8, "off": 0.0},
                 {"a": "ghost", "x": 300, "y": 1000, "dur": 0.8, "off": 0.8}, {"a": "ghost", "x": 460, "y": 960, "dur": 0.8, "off": 1.6},
                 {"a": "ghost", "x": 380, "y": 990, "dur": 0.8, "off": 2.4}, {"a": "overlay", "text": "नागिन डांस?!", "color": "#ffd27a", "dur": 3.0}]},
        L("DADI", "बस, बस। मेंढक भी डर गया।", "Enough, enough. Even the frog is scared.", act=[{"a": "ghost", "pose": "float", "dur": 0}]),
        L("CHAMAN", "देखा! मैंने किसी को डराया!", "See! I scared someone!", act=[{"a": "ghost", "pose": "scare", "dur": 0}]),
        L("DADI", "मेंढक इंसान नहीं होता, चमन।", "A frog isn't a human, Chaman.", act=[{"a": "ghost", "pose": "float", "expr": "sad", "dur": 0}], gap=0.6),

        # ---------------- कुएँ वाले ससुराल वाले ----------------
        {"dur": 2.2, "chapter": "कुएँ वाले ससुराल वाले", "sfx": [["gust", 0.0, 2.2]],
         "act": [M("horror"), cam(WELL), {"a": "fog", "v": 1.4}]},
        L("AMMA", "कौन है जो मेरी बेटी से शादी करने आया है?", "Who has come to marry my daughter?", sfx=[["riser", 0.2, 2.0]]),
        L("CHAMAN_SCARED", "स-सास जी! नमस्ते! मैं चमन!", "M-mother-in-law! Namaste! I'm Chaman!", tts="स… सास जी! नमस्ते! मैं चमन!",
          act=[{"a": "ghost", "x": 60, "y": 1000, "tremble": 0.8, "expr": "scared", "dur": 0.8}]),
        L("AMMA", "मैं कुएँ से बाहर नहीं आती। यहीं से पूछूँगी। कितने लोगों को डराया है?",
          "I don't come out of the well. I'll ask from right here. How many people have you scared?"),
        {"dur": 1.4, "sfx": [["owl", 0.3]]},
        L("CHAMAN", "…ज़ीरो। पर आज एक मेंढक को डराया!", "…Zero. But today I scared a frog!", tts="ज़ीरो। पर आज एक मेंढक को डराया!",
          act=[{"a": "ghost", "tremble": 0, "expr": "neutral", "dur": 0}]),
        L("AMMA", "ज़ीरो?! मेरी बेटी ने तीन सौ साल में तीन गाँव ख़ाली करवाए हैं!",
          "Zero?! In three hundred years my daughter has emptied three villages!"),
        L("DADI", "और बर्तन कितने धोए हैं?", "And how many dishes has she washed?", act=[cam(THREE), M("comic"), {"a": "dadi", "look": [-1, -0.2], "expr": "flat", "dur": 0}]),
        {"dur": 1.2},
        L("AMMA", "…एक भी नहीं।", "…Not a single one.", tts="एक भी नहीं।"),
        L("DADI", "तो रिश्ता बराबर का है। लड़का डराता नहीं, लड़की बर्तन नहीं धोती।",
          "Then it's an equal match. The boy doesn't scare, the girl doesn't wash dishes.", act=[{"a": "dadi", "expr": "smug", "dur": 0}]),
        L("AMMA", "…ये दादी कौन है? मुझे इससे डर लग रहा है।", "…Who is this Dadi? She scares me.", tts="ये दादी कौन है? मुझे इससे डर लग रहा है।"),
        L("CHAMAN", "सबको लगता है, सास जी। सबको।", "Everyone feels that, mother-in-law. Everyone.", gap=0.6),

        # ---------------- वरमाला ----------------
        {"dur": 3.0, "chapter": "वरमाला", "sfx": [["chime", 0.4]],
         "act": [M("tender"), {"a": "ghost2", "alpha": 1, "x": -280, "y": 1120, "pose": "float", "expr": "neutral", "dur": 0},
                 {"a": "ghost2", "x": 160, "y": 990, "off": 0.2, "dur": 2.6}, {"a": "ghost", "x": 400, "y": 990, "look": [-1, 0], "dur": 1.0},
                 {"a": "cam", "x": 320, "y": 1040, "zoom": 1.0}]},
        L("NARRATOR_HI", "और फिर… कुएँ से निकली दुल्हन। चाँदनी।", "And then… out of the well came the bride. Chandni."),
        L("CHAMAN", "चाँदनी जी… आप… बहुत डरावनी लग रही हैं।", "Chandni ji… you look… absolutely terrifying.", tts="चाँदनी जी… आप… बहुत डरावनी लग रही हैं।"),
        L("CHANDNI", "शुक्रिया। आप भी… ठीक-ठाक लग रहे हैं।", "Thank you. You look… alright too.", tts="शुक्रिया। आप भी… ठीक-ठाक लग रहे हैं।"),
        L("DADI", "चलो, वरमाला।", "Come on, the garlands."),
        {"dur": 2.2, "sfx": [["pop", 0.3], ["pop", 1.3], ["chime", 1.4]],
         "act": [{"a": "ghost2", "garland": True, "off": 0.3, "dur": 0}, {"a": "ghost", "garland": True, "off": 1.3, "dur": 0},
                 {"a": "ghost", "x": 330, "dur": 1.0}, {"a": "ghost2", "x": 200, "dur": 1.0}]},
        L("DADI", "बस। अब तुम दोनों पति-पत्नी।", "That's it. You two are now husband and wife.", act=[{"a": "dadi", "expr": "smug", "dur": 0}], gap=0.8),

        # ---------------- पहला इंसान ----------------
        {"dur": 1.4, "chapter": "पहला इंसान", "sfx": [["click", 0.4]],
         "act": [M("off"), {"a": "lamp", "on": False, "off": 0.4, "dur": 0}, {"a": "dark", "v": 0.8, "off": 0.4, "dur": 0.3}]},
        L("CHANDNI", "बिजली चली गई?", "Did the power go?"),
        L("DADI", "श्श्श… आँगन के पीछे कोई है।", "Shhh… someone's behind the courtyard.", act=[{"a": "dadi", "look": [1, 0], "dur": 0}, M("horror")]),
        {"dur": 1.6, "sfx": [["riser", 0.0, 1.6]], "act": [cam(RIGHT)]},
        L("CHOR", "हे हे… सब शादी में बिज़ी हैं। बुढ़िया का बक्सा उठा लेता हूँ।",
          "Heh heh… everyone's busy at the wedding. I'll grab the old lady's trunk."),
        L("CHANDNI", "चोर! चमन जी, कुछ करो!", "A thief! Chaman ji, do something!", act=[cam(THREE)]),
        L("CHAMAN_SCARED", "म-मैं? मुझसे तो कोई डरता ही नहीं!", "M-me? Nobody is ever scared of me!", tts="म… मैं? मुझसे तो कोई डरता ही नहीं!"),
        L("DADI", "चमन। आज तेरी शादी है। आज नहीं डराया, तो कभी नहीं।", "Chaman. It's your wedding day. If not today, then never.",
          act=[{"a": "dadi", "expr": "neutral", "dur": 0}], gap=0.6),
        {"dur": 1.6, "sfx": [["whoosh", 0.2], ["riser", 0.2, 1.3]],
         "act": [{"a": "ghost", "x": 1150, "y": 980, "scale": 1.5, "pose": "scare", "expr": "evil", "garland": False, "dur": 1.2, "ease": "in"}, cam(RIGHT)]},
        L("CHAMAN", "हा हा हा! मैं हूँ चमन भूत! दो सौ साल से इस पीपल पर रहता हूँ!",
          "Ha ha ha! I am Chaman Bhoot! I've lived in this peepal tree for two hundred years!",
          sfx=[["sting", 0.0]], act=[{"a": "flash", "dur": 0.3}, {"a": "shake", "v": 20, "dur": 0.5}]),
        L("CHOR", "भ-भ-भूत! बचाओ! माँ!", "G-g-ghost! Help! Mummy!", tts="भ… भ… भूत! बचाओ! माँ!", sfx=[["whoosh", 1.2]]),
        {"dur": 1.4, "sfx": [["thud", 0.3], ["thud", 0.7]], "act": [{"a": "shake", "v": 10, "dur": 0.8}]},
        {"dur": 1.2, "sfx": [["click", 0.2]],
         "act": [{"a": "lamp", "on": True, "off": 0.2, "dur": 0}, {"a": "dark", "v": 0, "off": 0.2, "dur": 0.4}, M("comic", 0.2),
                 {"a": "ghost", "scale": 1.0, "pose": "float", "expr": "scared", "dur": 0.4}]},
        L("CHAMAN_SCARED", "वो… वो डर गया? सच में डर गया?!", "He… he got scared? He really got scared?!", tts="वो… वो डर गया? सच में डर गया?"),
        L("DADI", "डर गया। चप्पल भी छोड़ गया।", "He did. He even left his slippers behind.",
          act=[cam(THREE), {"a": "dadi", "expr": "smug", "dur": 0}, {"a": "ghost", "x": 400, "y": 990, "dur": 1.2}]),
        {"dur": 2.0, "sfx": [["chime", 0.0]], "act": [{"a": "overlay", "text": "डराए गए इंसान: 1", "color": "#a8f0ff", "dur": 2.0},
                                                      {"a": "ghost", "pose": "scare", "expr": "neutral", "garland": True, "dur": 0}]},
        L("CHANDNI", "मेरे पति ने इंसान डराया! हाय, कितने बहादुर हैं!", "My husband scared a human! Oh, how brave he is!"),
        L("CHAMAN", "दो सौ साल लगे… पर हो गया!", "It took two hundred years… but I did it!", gap=0.8),

        # ---------------- विदाई ----------------
        {"dur": 3.4, "chapter": "विदाई", "sfx": [["birds", 0.6]],
         "act": [M("tender"), {"a": "dawn", "v": 0.85}, {"a": "fog", "v": 0.4}, {"a": "cam", "x": 400, "y": 960, "zoom": 0.9},
                 {"a": "ghost", "pose": "float", "dur": 0}]},
        L("NARRATOR_HI", "सुबह होने को थी। और भूत संघ से एक चिट्ठी आई।", "Dawn was breaking. And a letter arrived from the Ghost Union."),
        {"dur": 1.2, "sfx": [["whoosh", 0.0]], "act": [{"a": "letter", "title": "भूत संघ", "text": UNION_LETTER, "v": 1, "ease": "out"}]},
        {"dur": 5.5},
        L("CHAMAN", "दादी! मैं अब पूरा भूत हूँ!", "Dadi! I'm a full ghost now!", act=[{"a": "letter", "v": 0, "dur": 0.6}, {"a": "ghost", "pose": "scare", "dur": 0}]),
        L("DADI", "बधाई हो। और अब घर में दो भूत हैं…", "Congratulations. And now there are two ghosts in this house…"),
        L("CHANDNI", "हाँ, दादी?", "Yes, Dadi?"),
        L("DADI", "तो किराया भी दो लोगों का लगेगा।", "So the rent is for two now.", act=[{"a": "dadi", "expr": "smug", "dur": 0}], sfx=[["boing", 1.6]]),
        L("CHAMAN", "दादी!", "Dadi!", tts="दादी!", act=[{"a": "ghost", "expr": "sad", "pose": "float", "dur": 0}]),
        L("CHANDNI", "हा हा हा! मुझे ये घर पसंद है।", "Ha ha ha! I like this house.", tts="हा हा हा! मुझे ये घर पसंद है।", gap=0.6),
        {"dur": 2.0, "act": [{"a": "ghost", "x": 330, "y": 660, "scale": 0.8, "alpha": 0.5}, {"a": "ghost2", "x": 250, "y": 680, "scale": 0.8, "alpha": 0.5}]},
        L("NARRATOR_HI", "और उस दिन से, पीपल के पेड़ पर दो भूत रहते हैं… और आँगन में एक दादी, जो किसी से नहीं डरती।",
          "And from that day on, two ghosts live in the peepal tree… and in the courtyard, a Dadi who's afraid of no one."),
        {"dur": 9.0, "act": [{"a": "overlay", "text": "अगले रविवार: नया एपिसोड!", "color": "#ffd27a", "dur": 9.0}]},
    ],
}
