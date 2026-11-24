"""दादी vs भूत — batch 02: Shorts d06–d14 (days 6–14 of the calendar)."""

TWO = dict(a="cam", x=560, y=1060, zoom=1.15)
DADI_CU = dict(a="cam", x=690, y=1130, zoom=1.55)
GHOST_NEAR = {"alpha": 1, "x": 450, "y": 1000, "expr": "neutral", "look": [1, 0.3]}


def cut(c): return {**c, "dur": 0}


COMIC = {"a": "music", "mode": "comic", "dur": 0}
END = {"dur": 1.6, "sfx": [["wahwah", 0.0]]}


def scare_in(x=540, y=900):
    """The standard 2-beat horror open: eyes in the tree, then a swoop + sting."""
    return [
        {"dur": 1.6, "sfx": [["owl", 0.1], ["riser", 0.4, 1.2]], "act": [{"a": "cam", "x": 540, "y": 960, "zoom": 1.0}]},
        {"dur": 0.45, "sfx": [["sting", 0.4]],
         "act": [{"a": "ghost", "eyesOnly": False, "x": x, "y": y, "scale": 1.4, "pose": "scare", "expr": "evil", "look": [0, 0.3], "ease": "in"},
                 {"a": "flash", "off": 0.4, "dur": 0.3}, {"a": "shake", "v": 18, "off": 0.4, "dur": 0.4}, {"a": "dark", "v": 0, "dur": 0.3}]},
    ]


EYES_IN_TREE = {"cam": {"x": 360, "y": 700, "zoom": 1.4}, "dark": 0.15,
                "ghost": {"alpha": 1, "eyesOnly": True, "x": 330, "y": 600, "look": [0.6, 0.4]}}
SETTLE = {"dur": 0.4, "act": [cut(TWO), {"a": "ghost", "x": 450, "y": 1000, "scale": 1.0, "pose": "float", "dur": 0}]}

SHORTS = {
    "d06-wifi": {
        "title": "भूत ने माँगा Wi-Fi पासवर्ड",
        "hook": {"text": "भूत को चाहिए Wi-Fi 📶", "dur": 2.2},
        "initial": {"cam": {"x": 560, "y": 1060, "zoom": 1.15}, "ghost": GHOST_NEAR},
        "events": [
            {"say": "CHAMAN", "text": "दादी! आपके घर का Wi-Fi पासवर्ड क्या है?", "tts": "दादी! आपके घर का वाई-फ़ाई पासवर्ड क्या है?"},
            {"say": "DADI", "text": "भूत को Wi-Fi का क्या काम?", "tts": "भूत को वाई-फ़ाई का क्या काम?", "act": [COMIC, {"a": "dadi", "look": [-1, -0.3], "dur": 0}]},
            {"say": "CHAMAN", "text": "डरावनी रील्स बनानी हैं। दो सौ साल से कोई followers नहीं।", "tts": "डरावनी रील्स बनानी हैं। दो सौ साल से कोई फ़ॉलोअर्स नहीं।"},
            {"say": "DADI", "text": "पहले बर्तन धो। फिर पासवर्ड मिलेगा।", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            {"dur": 0.9, "sfx": [["clatter", 0.0]], "act": [{"a": "ghost", "pose": "plates", "expr": "sad", "dur": 0}]},
            {"say": "CHAMAN", "text": "धो दिए! अब पासवर्ड?", "act": [{"a": "ghost", "pose": "float", "expr": "neutral", "dur": 0}]},
            {"say": "DADI", "text": "पासवर्ड है… बर्तनधो123।", "tts": "पासवर्ड है… बर्तन धो, एक दो तीन।", "sfx": [["pop", 1.2]],
             "act": [{"a": "overlay", "text": "बर्तनधो123", "color": "#ffd27a", "off": 1.2, "dur": 2.2}]},
            END,
        ],
    },
    "d07-diet": {
        "title": "भूत डाइट पर है!",
        "hook": {"text": "भूत Diet पर है 🍵", "dur": 2.2},
        "initial": EYES_IN_TREE,
        "events": scare_in() + [
            {"say": "CHAMAN", "text": "डरो दादी! मैं भूखा भूत हूँ!", "tts": "डरो दादी! मैं भूखा भूत हूँ!"},
            SETTLE,
            {"say": "DADI", "text": "भूखा है? तो क्या खाता है?", "act": [COMIC, {"a": "dadi", "look": [-1, -0.3], "dur": 0}]},
            {"say": "CHAMAN", "text": "मैं डाइट पर हूँ। सिर्फ़ इंसानों का डर खाता हूँ।"},
            {"say": "DADI", "text": "तभी इतना दुबला है। दो सौ साल से भूखा है बेचारा।", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            {"say": "DADI", "text": "ले, चाय पी। पराठा भी लाती हूँ।", "act": [{"a": "ghost", "pose": "chai", "expr": "neutral", "dur": 0, "off": 0.6}]},
            {"say": "CHAMAN", "text": "…आलू वाला?", "tts": "आलू वाला?"},
            END,
        ],
    },
    "d08-gaana": {
        "title": "आधी रात भूत का गाना",
        "hook": {"text": "रात 2 बजे भूत का गाना 🎤", "dur": 2.4},
        "initial": {**EYES_IN_TREE, "ghost": {**EYES_IN_TREE["ghost"]}},
        "events": [
            {"say": "CHAMAN", "text": "ऊऊऊऊ… ऊऊऊऊऊ…", "tts": "ऊऊऊऊऊ… ऊऊऊऊऊऊ…", "sfx": [["gust", 0.0, 3.0]],
             "act": [{"a": "cam", "x": 540, "y": 960, "zoom": 1.0}]},
            {"dur": 0.45, "sfx": [["sting", 0.3]],
             "act": [{"a": "ghost", "eyesOnly": False, "x": 450, "y": 980, "scale": 1.1, "pose": "scare", "expr": "evil"}, {"a": "dark", "v": 0, "dur": 0.3}, cut(TWO)]},
            {"say": "DADI", "text": "सुर तो लगा ले, बेसुरे।", "act": [COMIC, {"a": "dadi", "look": [-1, -0.3], "dur": 0}]},
            {"say": "CHAMAN", "text": "ये डरावना गाना है, दादी!", "act": [{"a": "ghost", "pose": "float", "expr": "neutral", "dur": 0}]},
            {"say": "DADI", "text": "हाँ, डरावना तो है। मोहल्ले के कुत्ते रोने लगे।", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            {"say": "CHAMAN", "text": "…वो मेरे fans हैं।", "tts": "वो मेरे फ़ैन्स हैं।", "act": [{"a": "ghost", "expr": "sad", "dur": 0}]},
            END,
        ],
    },
    "d09-janmdin": {
        "title": "भूत का 201वाँ जन्मदिन",
        "hook": {"text": "भूत का 201वाँ Birthday 🎂", "dur": 2.0},
        "initial": {"cam": {"x": 560, "y": 1060, "zoom": 1.15}, "ghost": GHOST_NEAR},
        "events": [
            {"say": "CHAMAN", "text": "दादी! आज मेरा दो सौ एकवाँ जन्मदिन है!", "act": [{"a": "overlay", "text": "201", "color": "#ffd27a", "dur": 2.5}], "sfx": [["pop", 0.0]]},
            {"say": "DADI", "text": "अच्छा? तो केक पर कितनी मोमबत्तियाँ लगाऊँ?", "act": [COMIC, {"a": "dadi", "look": [-1, -0.3], "dur": 0}]},
            {"say": "CHAMAN", "text": "दो सौ एक!"},
            {"say": "DADI", "text": "इतनी मोमबत्तियों में तो पूरा पीपल जल जाएगा। एक दीया काफ़ी है।", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            {"say": "CHAMAN", "text": "और गिफ़्ट?", "act": [{"a": "ghost", "expr": "neutral", "dur": 0}]},
            {"say": "DADI", "text": "गिफ़्ट ये है… आज बर्तन मैं धोऊँगी।"},
            {"say": "CHAMAN_SCARED", "text": "दादी… आप सच में मुझसे प्यार करती हो!", "act": [{"a": "ghost", "pose": "scare", "dur": 0}]},
            {"dur": 1.4, "sfx": [["boing", 0.1]]},
        ],
    },
    "d10-chudail-moonchh": {
        "title": "चुड़ैल की मूँछें?!",
        "hook": {"text": "मूँछों वाली चुड़ैल?! 😂", "dur": 2.2},
        "initial": {**EYES_IN_TREE, "ghost": {**EYES_IN_TREE["ghost"], "wig": True}},
        "events": scare_in() + [
            {"say": "CHAMAN_SCARED", "text": "मैं… चुड़ैल हूँ… डरो!", "tts": "मैं चुड़ैल हूँ… डरो!"},
            SETTLE,
            {"say": "DADI", "text": "चमन, तेरी मूँछें दिख रही हैं।", "act": [COMIC, {"a": "dadi", "look": [-1, -0.3], "dur": 0}]},
            {"say": "CHAMAN_SCARED", "text": "चुड़ैल की भी मूँछें हो सकती हैं!", "act": [{"a": "ghost", "expr": "neutral", "dur": 0}]},
            {"say": "DADI", "text": "हाँ हाँ। और भूत का दिमाग़ भी।", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            {"dur": 0.4, "sfx": [["whoosh", 0.0]], "act": [{"a": "ghost", "wig": False, "expr": "sad", "dur": 0}]},
            END,
        ],
    },
    "d11-ulta-latka": {
        "title": "उल्टा लटका भूत… दादी का जवाब",
        "hook": {"text": "दादी, ऊपर देखो… 🙃", "dur": 2.2},
        "initial": {"cam": {"x": 560, "y": 1000, "zoom": 1.1},
                    "ghost": {"alpha": 1, "x": 470, "y": 800, "rot": 3.14159, "expr": "evil", "look": [0.6, -0.5]}},
        "events": [
            {"dur": 1.6, "sfx": [["riser", 0.0, 1.6]], "act": [{"a": "cam", "x": 560, "y": 1000, "zoom": 1.05}]},
            {"say": "CHAMAN", "text": "दादी… ऊपर देखो… मैं उल्टा लटका हूँ!", "sfx": [["sting", 0.0]], "act": [{"a": "dadi", "look": [-0.5, -1], "dur": 0}]},
            {"say": "DADI", "text": "अच्छा है। लटका रह। जेब से सिक्के गिरेंगे।", "act": [COMIC]},
            {"say": "CHAMAN", "text": "भूतों की जेब नहीं होती, दादी!"},
            {"say": "DADI", "text": "तभी तो दो सौ साल से किराया नहीं दिया।", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            {"dur": 1.8, "sfx": [["thud", 0.4], ["wahwah", 0.5]],
             "act": [{"a": "ghost", "rot": 0, "x": 450, "y": 1000, "expr": "sad", "dur": 0.4, "ease": "in"}]},
        ],
    },
    "d12-exam": {
        "title": "भूत का एग्ज़ाम: इंसान को कैसे डराएँ?",
        "hook": {"text": "इंसान किससे डरता है? 📝", "dur": 2.0},
        "initial": {"cam": {"x": 560, "y": 1060, "zoom": 1.15}, "ghost": GHOST_NEAR},
        "events": [
            {"say": "CHAMAN", "text": "दादी, मदद करो! भूत संघ का एग्ज़ाम है!", "act": [{"a": "ghost", "expr": "scared", "dur": 0}]},
            {"dur": 1.0, "sfx": [["whoosh", 0.0]],
             "act": [{"a": "letter", "title": "भूत संघ — परीक्षा", "text": "प्रश्न 1:\nएक इंसान को सबसे ज़्यादा\nकिस चीज़ से डर लगता है?", "v": 1, "ease": "out"}]},
            {"dur": 2.4},
            {"say": "DADI", "text": "आसान है। लिख… बिजली का बिल।", "act": [COMIC, {"a": "letter", "v": 0, "dur": 0.5}, {"a": "dadi", "expr": "smug", "dur": 0}]},
            {"say": "CHAMAN", "text": "बिजली का बिल? भूत से भी ज़्यादा?", "act": [{"a": "ghost", "expr": "neutral", "dur": 0}]},
            {"say": "DADI", "text": "भूत तो रात को आता है। बिल हर महीने।"},
            {"dur": 1.4, "sfx": [["boing", 0.1]], "act": [{"a": "overlay", "text": "पूरे नंबर!", "color": "#a8f0ff", "dur": 1.4}]},
        ],
    },
    "d13-teen-baje": {
        "title": "रात 3 बजे भूत सबसे ताक़तवर…",
        "hook": {"text": "रात 3 बजे भूत का राज 💪", "dur": 2.4},
        "initial": {**EYES_IN_TREE, "dark": 0.3},
        "events": [
            {"say": "NARRATOR_HI", "text": "कहते हैं… रात के तीन बजे भूत सबसे ताक़तवर होते हैं।", "sfx": [["owl", 0.5]],
             "act": [{"a": "cam", "x": 540, "y": 960, "zoom": 1.0}]},
            {"dur": 0.45, "sfx": [["sting", 0.3]],
             "act": [{"a": "ghost", "eyesOnly": False, "x": 450, "y": 980, "scale": 1.2, "pose": "scare", "expr": "evil"}, {"a": "dark", "v": 0, "dur": 0.3}, cut(TWO)]},
            {"say": "CHAMAN", "text": "तीन बज गए! अब मैं सबसे ताक़तवर हूँ!"},
            {"say": "DADI", "text": "अच्छा? ताक़त है तो चल, कुएँ से दो बाल्टी पानी भर ला।", "act": [COMIC, {"a": "dadi", "look": [-1, -0.3], "dur": 0}]},
            {"dur": 0.6, "sfx": [["boing", 0.0]], "act": [{"a": "props", "bucket": True, "dur": 0}, {"a": "ghost", "pose": "float", "expr": "sad", "dur": 0}]},
            {"say": "CHAMAN", "text": "भूत की ताक़त डराने के लिए होती है, पानी भरने के लिए नहीं!"},
            {"say": "DADI", "text": "डरा तो पाया नहीं। कम से कम पानी तो भर।", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            END,
        ],
    },
    "d14-machis": {
        "title": "भूत ने दीया बुझाया… फिर ख़ुद डर गया",
        "hook": {"text": "भूत अँधेरे से डर गया 🕯️", "dur": 2.2},
        "initial": {"cam": {"x": 620, "y": 1060, "zoom": 1.2},
                    "ghost": {"alpha": 1, "x": 600, "y": 960, "expr": "evil", "look": [0.8, 0.2]}},
        "events": [
            {"say": "CHAMAN", "text": "अँधेरा… अब तुम डरोगी, दादी!"},
            {"dur": 1.0, "sfx": [["blow", 0.1]], "act": [{"a": "lamp", "on": False, "off": 0.5, "dur": 0}, {"a": "dark", "v": 0.85, "off": 0.5, "dur": 0.4}]},
            {"say": "DADI", "text": "दीया बुझाया है? तो माचिस भी तू ही ढूँढ।", "act": [COMIC]},
            {"dur": 1.2, "act": [{"a": "ghost", "x": 380, "y": 1040, "ease": "inout"}]},
            {"say": "CHAMAN_SCARED", "text": "दादी… यहाँ बहुत अँधेरा है… माचिस कहाँ है?", "act": [{"a": "ghost", "x": 720, "y": 1000}, {"a": "ghost", "tremble": 0.6, "dur": 0}]},
            {"say": "DADI", "text": "क्यों? डर लग रहा है क्या?", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            {"say": "CHAMAN_SCARED", "text": "…थोड़ा-थोड़ा।", "tts": "थोड़ा थोड़ा।"},
            {"dur": 1.6, "sfx": [["click", 0.1], ["wahwah", 0.3]],
             "act": [{"a": "lamp", "on": True, "off": 0.1, "dur": 0}, {"a": "dark", "v": 0, "off": 0.1, "dur": 0.3}, {"a": "ghost", "expr": "sad", "tremble": 0, "dur": 0}]},
        ],
    },
}
