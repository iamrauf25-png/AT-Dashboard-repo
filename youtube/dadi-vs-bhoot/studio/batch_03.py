"""दादी vs भूत — batch 03: Shorts d15–d21 (calendar week 3)."""
from batch_02 import TWO, GHOST_NEAR, EYES_IN_TREE, SETTLE, COMIC, END, cut, scare_in

SHORTS = {
    "d15-bijli": {
        "title": "गाँव की बिजली गई… भूत पर इल्ज़ाम!",
        "hook": {"text": "बिजली किसने काटी? ⚡", "dur": 2.2},
        "initial": {"cam": {"x": 560, "y": 1060, "zoom": 1.15}, "ghost": GHOST_NEAR},
        "events": [
            {"dur": 1.0, "sfx": [["click", 0.2]], "act": [{"a": "lamp", "on": False, "off": 0.3, "dur": 0}, {"a": "dark", "v": 0.8, "off": 0.3, "dur": 0.2}]},
            {"say": "NARRATOR_HI", "text": "उस रात पूरे गाँव की बिजली चली गई… और सबको एक ही पर शक था।", "sfx": [["owl", 1.0]]},
            {"say": "CHAMAN_SCARED", "text": "दादी, मैंने बिजली नहीं काटी! क़सम से!", "act": [{"a": "ghost", "tremble": 0.5, "dur": 0}]},
            {"say": "DADI", "text": "पता है। तुझसे तो एक दीया भी ठीक से नहीं बुझता।", "act": [COMIC, {"a": "dadi", "expr": "smug", "look": [-1, -0.3], "dur": 0}]},
            {"say": "CHAMAN", "text": "…ये तारीफ़ थी या बेइज़्ज़ती?", "tts": "ये तारीफ़ थी या बेइज़्ज़ती?", "act": [{"a": "ghost", "tremble": 0, "expr": "neutral", "dur": 0}]},
            {"dur": 1.6, "sfx": [["click", 0.1], ["boing", 0.3]], "act": [{"a": "lamp", "on": True, "off": 0.1, "dur": 0}, {"a": "dark", "v": 0, "off": 0.1, "dur": 0.3}]},
        ],
    },
    "d16-sardi": {
        "title": "भूत को लगी ठंड! 🥶",
        "hook": {"text": "भूत को ठंड लग गई 🥶", "dur": 2.2},
        "initial": {"cam": {"x": 560, "y": 1060, "zoom": 1.15}, "ghost": {**GHOST_NEAR, "tremble": 0.8, "expr": "sad"}},
        "events": [
            {"say": "CHAMAN_SCARED", "text": "ब्र्र्र… भूतों को ठंड नहीं लगती… ब्र्र्र…", "tts": "ब्रर्र… भूतों को ठंड नहीं लगती… ब्रर्र…", "sfx": [["gust", 0.0, 3.0]]},
            {"say": "DADI", "text": "दाँत तो ऐसे बज रहे हैं जैसे ढोलक। ले, मेरी शॉल ओढ़ ले।", "act": [COMIC, {"a": "dadi", "look": [-1, -0.3], "dur": 0}]},
            {"say": "CHAMAN", "text": "शॉल में भूत डरावना नहीं लगेगा!"},
            {"say": "DADI", "text": "बेटा, तू बिना शॉल के भी नहीं लगता।", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            END,
        ],
    },
    "d17-daant-dard": {
        "title": "200 साल पुराना दाँत दर्द 🦷",
        "hook": {"text": "भूत को दाँत दर्द 🦷", "dur": 2.4},
        "initial": {**EYES_IN_TREE},
        "events": [
            {"say": "CHAMAN", "text": "आआह… ऊऊह… आआह…", "tts": "आआह… ऊऊह… आआआह…", "sfx": [["riser", 0.5, 1.6]], "act": [{"a": "cam", "x": 540, "y": 960, "zoom": 1.0}]},
            {"dur": 0.45, "sfx": [["sting", 0.3]],
             "act": [{"a": "ghost", "eyesOnly": False, "x": 450, "y": 990, "scale": 1.1, "pose": "scare", "expr": "sad"}, {"a": "dark", "v": 0, "dur": 0.3}, cut(TWO)]},
            {"say": "DADI", "text": "क्या हुआ? किसी ने डरा दिया?", "act": [COMIC, {"a": "dadi", "look": [-1, -0.3], "dur": 0}]},
            {"say": "CHAMAN_SCARED", "text": "दाँत में दर्द है, दादी! दो सौ साल पुराना दाँत!", "act": [{"a": "ghost", "pose": "float", "dur": 0}]},
            {"say": "DADI", "text": "लौंग दबा ले। और डॉक्टर ढूँढना है तो दो सौ साल पुराना ढूँढ।", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            END,
        ],
    },
    "d18-machchhar": {
        "title": "भूत vs मच्छर 🦟",
        "hook": {"text": "भूत vs मच्छर 🦟", "dur": 2.2},
        "initial": {"cam": {"x": 560, "y": 1060, "zoom": 1.15}, "ghost": GHOST_NEAR},
        "events": [
            {"dur": 1.4, "sfx": [["buzz", 0.0, 3.5]], "act": [{"a": "ghost", "look": [-0.5, -0.8], "expr": "scared", "dur": 0, "off": 0.6}]},
            {"say": "CHAMAN_SCARED", "text": "दादी! कोई कान में भिनभिना रहा है!", "act": [{"a": "ghost", "tremble": 0.8, "pose": "scared", "dur": 0}]},
            {"say": "DADI", "text": "मच्छर है।", "act": [COMIC, {"a": "dadi", "look": [-1, -0.3], "dur": 0}]},
            {"say": "CHAMAN_SCARED", "text": "वो मुझे काट लेगा!"},
            {"say": "DADI", "text": "काटेगा क्या? तुझमें ख़ून है ही नहीं। भूल गया?", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            {"dur": 1.6, "sfx": [["wahwah", 0.0]], "act": [{"a": "ghost", "tremble": 0, "pose": "float", "expr": "sad", "dur": 0}]},
        ],
    },
    "d19-serial": {
        "title": "भूत को लगी सीरियल की लत 📺",
        "hook": {"text": "भूत vs दादी का सीरियल 📺", "dur": 2.4},
        "initial": {**EYES_IN_TREE},
        "events": scare_in() + [
            {"say": "CHAMAN", "text": "डरो दादी! मैं आ गया!"},
            SETTLE,
            {"say": "DADI", "text": "श्श्श! सीरियल चल रहा है। बहू ने सास का अचार छुपा दिया है।", "act": [COMIC, {"a": "dadi", "look": [1, -0.2], "dur": 0}]},
            {"say": "CHAMAN", "text": "…फिर? फिर क्या हुआ?", "tts": "फिर? फिर क्या हुआ?", "act": [{"a": "ghost", "x": 470, "y": 1020, "expr": "neutral", "look": [1, 0.2], "dur": 0.8}]},
            {"say": "DADI", "text": "डराना है या सीरियल देखना है?", "act": [{"a": "dadi", "look": [-1, -0.3], "expr": "smug", "dur": 0}]},
            {"say": "CHAMAN", "text": "पहले सीरियल। डराना कल।"},
            {"dur": 1.4, "sfx": [["boing", 0.1]]},
        ],
    },
    "d20-naukri": {
        "title": "भूत को मिली चौकीदार की नौकरी",
        "hook": {"text": "भूत को नौकरी मिली 🔦", "dur": 2.2},
        "initial": {"cam": {"x": 560, "y": 1060, "zoom": 1.15}, "ghost": GHOST_NEAR},
        "events": [
            {"say": "CHAMAN", "text": "दादी! मुझे नौकरी मिल गई!", "sfx": [["pop", 1.2]],
             "act": [{"a": "letter", "title": "नियुक्ति पत्र", "text": "पद: चौकीदार\nड्यूटी: रात 10 से सुबह 6\nतनख़्वाह: ₹0 (भूत हैं, खाते क्या हैं?)", "v": 1, "off": 1.2, "dur": 0.8, "ease": "out"}]},
            {"dur": 2.6},
            {"say": "DADI", "text": "भूत चौकीदार? बढ़िया। चोर तो देखते ही भाग जाएँगे।", "act": [COMIC, {"a": "letter", "v": 0, "dur": 0.4}, {"a": "dadi", "look": [-1, -0.3], "dur": 0}]},
            {"say": "CHAMAN_SCARED", "text": "पर दादी… रात को गोदाम में बहुत अँधेरा होता है।", "act": [{"a": "ghost", "expr": "scared", "dur": 0}]},
            {"say": "DADI", "text": "तो दिन की ड्यूटी ले ले।"},
            {"say": "CHAMAN", "text": "दिन में भूत दिखते ही नहीं!", "act": [{"a": "ghost", "expr": "neutral", "dur": 0}]},
            {"say": "DADI", "text": "तो तनख़्वाह भी नहीं दिखेगी।", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            END,
        ],
    },
    "d21-reel": {
        "title": "भूत की रील पर ज़ीरो views 📱",
        "hook": {"text": "भूत की Reel: 0 Views 📱", "dur": 2.2},
        "initial": {"cam": {"x": 560, "y": 1060, "zoom": 1.15}, "ghost": GHOST_NEAR, "dadi": {"prop": "phone"}},
        "events": [
            {"say": "CHAMAN_SCARED", "text": "दादी! मेरी डरावनी रील पर ज़ीरो views!", "act": [{"a": "overlay", "text": "0 views", "color": "#ff5a4f", "dur": 2.6}], "sfx": [["pop", 0.0]]},
            {"say": "DADI", "text": "रील में तू दिखता ही नहीं, तो देखेगा कौन?", "act": [COMIC, {"a": "dadi", "look": [-1, -0.3], "dur": 0}]},
            {"say": "CHAMAN", "text": "तो आप मेरे साथ रील बनाओ ना!", "act": [{"a": "ghost", "pose": "scare", "expr": "neutral", "dur": 0}]},
            {"say": "DADI", "text": "ठीक है। पर रील का नाम होगा… दादी vs भूत।", "tts": "ठीक है। पर रील का नाम होगा… दादी वर्सेस भूत।", "act": [{"a": "dadi", "expr": "smug", "dur": 0}]},
            {"dur": 1.8, "sfx": [["boing", 0.2]], "act": [{"a": "overlay", "text": "Subscribe करो!", "color": "#ffd27a", "dur": 1.8}]},
        ],
    },
}
