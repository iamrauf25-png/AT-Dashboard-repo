"""Shot lists for the Mo & Pebble Shorts.

Each Short is a list of events played in order. An event is either a spoken line
({"say": WHO, "text": ...}) or a timed action block ({"dur": seconds}). Either kind can carry
"act" (scene changes, see scene.js applyAct) and "sfx" ([name, offset, (dur)]).
"""

BULB_HUG = dict(x=560, y=615)
MO_SIT = dict(x=450, y=1255)
CAM_WIDE = dict(a="cam", x=540, y=960, zoom=1.0)
CAM_BULB = dict(a="cam", x=560, y=800, zoom=1.5)
CAM_TWO = dict(a="cam", x=400, y=1100, zoom=1.35)
CAM_PEB = dict(a="cam", x=290, y=1270, zoom=1.9)


def cut(c):  # instant camera cut
    return {**c, "dur": 0}


SHORTS = {
    # ------------------------------------------------------------------
    "s01-moon-button": {
        "title": "Never Press the Moon's Button",
        "hook": {"text": "THE MOON HAS A SWITCH", "dur": 2.6},
        "initial": {"cam": {"x": 560, "y": 800, "zoom": 1.5},
                    "mo": {**BULB_HUG, "pose": "hug", "expr": "wonder", "look": [0, 0.6]}},
        "events": [
            {"say": "NARRATOR", "text": "You should never press the one button on the moon. Mo is about to find out why, before Pebble can stop him.",
             "act": [{"a": "cam", "x": 540, "y": 900, "zoom": 1.25}]},
            {"say": "MO", "text": "I'm on the moon. I'm ON the moon!", "tts": "I'm on the moon! I'm on the moon!",
             "act": [{"a": "mo", "expr": "happy", "look": [0, -0.2], "dur": 0.1}]},
            {"say": "MO", "text": "The moon is warm. The moon is... buzzing.", "sfx": [["buzz", 0.0, 3.2]],
             "act": [{"a": "mo", "expr": "wonder", "look": [0, 1], "dur": 0.1, "off": 1.2}]},
            {"say": "MO", "text": "Pebble, I think the moon is hungry.",
             "act": [{"a": "mo", "look": [-0.8, 0.7], "expr": "worry", "dur": 0.1}, {"a": "cam", "x": 450, "y": 1000, "zoom": 1.1}]},
            {"dur": 0.8, "act": [{"a": "mo", "look": [0.5, 1], "expr": "wonder", "dur": 0.1}, {"a": "cam", "x": 600, "y": 860, "zoom": 1.35}]},
            {"say": "MO", "text": "The moon has a... button.", "tts": "The moon has a... button."},
            {"say": "PEBBLE", "text": "Don't.", "act": [cut(CAM_PEB), {"a": "pebble", "look": "up", "dur": 0}], "gap": 0.35},
            {"dur": 1.0, "sfx": [["whoosh", 0.05]],
             "act": [cut({"a": "cam", "x": 600, "y": 880, "zoom": 1.3}),
                     {"a": "mo", "x": 668, "y": 955, "pose": "fly", "expr": "happy", "look": [-0.2, 0.4], "trail": 1}]},
            {"dur": 0.45, "sfx": [["click", 0.3]],
             "act": [{"a": "mo", "squash": 1, "dur": 0.3, "ease": "in"}, {"a": "light", "on": False, "off": 0.3, "dur": 0},
                     {"a": "music", "on": False, "off": 0.3, "dur": 0}]},
            {"dur": 2.4, "act": [{"a": "mo", "squash": 0, "dur": 0.3}, {"a": "cam", "x": 540, "y": 960, "zoom": 1.0, "dur": 0, "off": 1.5},
                                 {"a": "mo", "x": 520, "y": 760, "pose": "fly", "look": [-0.6, -1], "expr": "wonder", "dur": 0, "off": 1.5}]},
            {"dur": 3.0, "sfx": [["chime", 0.4]], "act": [{"a": "clouds", "open": 1}]},
            {"say": "MO_WHISPER", "text": "Pebble. I broke the moon. And now there's a bigger one."},
            {"say": "PEBBLE", "text": "That's the moon.", "act": [{"a": "pebble", "look": "up", "dur": 0}]},
            {"say": "MO", "text": "Then what was that?", "act": [{"a": "mo", "look": [0.4, -0.3], "dur": 0}]},
            {"say": "PEBBLE", "text": "A light.", "gap": 0.7},
            {"say": "MO", "text": "...I'm going to touch it.", "tts": "I'm going to touch it.", "act": [{"a": "mo", "expr": "happy", "look": [-0.7, -0.8], "dur": 0}]},
            {"dur": 2.2, "sfx": [["whoosh", 0.0]],
             "act": [{"a": "mo", "x": 280, "y": 395, "scale": 0.16, "trail": 0, "ease": "inout"}]},
            {"dur": 0.35, "sfx": [["click", 0.05]],
             "act": [{"a": "light", "on": True, "off": 0.05, "dur": 0}, {"a": "music", "on": True, "off": 0.05, "dur": 0},
                     {"a": "clouds", "open": 0, "dur": 0}]},
            {"dur": 0.75, "sfx": [["whoosh", 0.0]],
             "act": [{"a": "mo", **BULB_HUG, "scale": 1, "look": [0, 0.6], "trail": 1, "ease": "in"},
                     {"a": "cam", "x": 560, "y": 800, "zoom": 1.5, "ease": "in"}]},
            {"dur": 0.7, "sfx": [["tink", 0.0]],
             "act": [{"a": "mo", "pose": "hug", "expr": "wonder", "squash": 0.7, "dur": 0.1},
                     {"a": "mo", "squash": 0, "dur": 0.5, "off": 0.1, "ease": "out"}, {"a": "shake", "v": 10, "dur": 0.3}]},
        ],
    },
    # ------------------------------------------------------------------
    "s02-made-of-glass": {
        "title": "The Moon Is Made of Glass",
        "hook": {"text": "ATTEMPT #1 OF 300", "dur": 2.4},
        "initial": {"cam": {"x": 400, "y": 1100, "zoom": 1.35},
                    "mo": {**MO_SIT, "pose": "sit", "look": [0.3, -1], "expr": "wonder"}, "pebble": {"look": "mo"}},
        "events": [
            {"say": "NARRATOR", "text": "You've failed at something 300 times? Mo has, and this is the first time he hit the moon. Nobody warned him why.",
             "act": [{"a": "cam", "x": 470, "y": 1000, "zoom": 1.2}]},
            {"say": "MO", "text": "Pebble. PEBBLE. I found the moon. It's on a house.", "tts": "Pebble! Pebble! I found the moon! It's on a house!",
             "act": [{"a": "mo", "look": [-1, 0.3], "expr": "happy", "dur": 0}]},
            {"say": "PEBBLE", "text": "That's a light."},
            {"say": "MO", "text": "It's the moon. And I'm going to touch it before you finish saying no.", "tts": "It's the moon! And I'm going to touch it before you finish saying no."},
            {"say": "PEBBLE", "text": "N—", "tts": "No.", "cut": 0.42, "gap": 0.0, "sfx": [["whoosh", 0.1]],
             "act": [{"a": "mo", "x": 560, "y": 790, "pose": "fly", "look": [0, -1], "trail": 1, "dur": 0.45, "off": 0.12, "ease": "in"},
                     {"a": "pebble", "look": "up", "dur": 0, "off": 0.3}]},
            {"dur": 0.3, "sfx": [["tink", 0.0]], "act": [{"a": "mo", "squash": 1, "dur": 0.08}, {"a": "shake", "v": 16, "dur": 0.3}]},
            {"dur": 1.0, "sfx": [["thud", 0.9]],
             "act": [{"a": "mo", "x": 520, "y": 1262, "rot": 3.14159, "squash": 0, "pose": "upside", "expr": "dazed", "trail": 0, "ease": "in"},
                     {"a": "cam", "x": 450, "y": 1150, "zoom": 1.4}]},
            {"say": "MO", "text": "The moon is... hard.", "act": [{"a": "pebble", "look": "mo", "dur": 0}]},
            {"say": "PEBBLE", "text": "Glass.", "gap": 0.5},
            {"dur": 0.45, "act": [{"a": "mo", "rot": 0, "y": 1255, "x": 470, "pose": "sit", "expr": "happy", "look": [-1, 0], "ease": "back"}]},
            {"say": "MO", "text": "The moon is made of glass. I knew it was fancy.", "tts": "The moon is made of glass! I knew it was fancy."},
            {"dur": 0.5, "act": [{"a": "mo", "look": [0.3, -1], "expr": "wonder", "dur": 0, "off": 0.2}]},
        ],
    },
    # ------------------------------------------------------------------
    "s03-why-moths-circle": {
        "title": "Why Moths Can't Fly Straight at Lights",
        "hook": {"text": "WHY MOTHS CIRCLE LIGHTS", "dur": 2.6},
        "initial": {"cam": {"x": 540, "y": 860, "zoom": 1.15}, "mo": {"x": 820, "y": 700}, "tally": 280},
        "events": [
            {"dur": 2.6, "sfx": [["whoosh", 0.2], ["whoosh", 1.4]],
             "act": [{"a": "spiral", "cx": 560, "cy": 700, "r0": 280, "r1": 170, "turns": 2.0, "ease": "linear"},
                     {"a": "tally", "n": 296}]},
            {"say": "MO", "text": "Why can't I fly straight at it?! Every time I aim, the moon goes behind me!",
             "tts": "Why can't I fly straight at it? Every time I aim, the moon goes behind me!",
             "act": [{"a": "spiral", "cx": 560, "cy": 700, "r0": 170, "r1": 200, "turns": 2.5, "a0": 12.566, "ease": "linear"},
                     {"a": "tally", "n": 298}]},
            {"dur": 0.9, "act": [{"a": "mo", **MO_SIT, "pose": "sit", "look": [-1, 0.2], "expr": "worry", "trail": 0, "arc": 80},
                                 {"a": "cam", "x": 400, "y": 1110, "zoom": 1.35}]},
            {"say": "PEBBLE", "text": "You keep your back to the light."},
            {"say": "MO", "text": "I do what?"},
            {"say": "PEBBLE", "text": "Moths keep their back to the brightest thing. Usually that's the sky. Tonight, it's a bulb."},
            {"dur": 1.4, "act": [{"a": "think"}, {"a": "mo", "look": [0.3, -1], "expr": "wonder", "dur": 0}]},
            {"say": "MO", "text": "...Then I'll fly backwards.", "tts": "Then I'll fly backwards!", "act": [{"a": "mo", "expr": "happy", "look": [-1, 0], "dur": 0}]},
            {"dur": 1.0, "sfx": [["whoosh", 0.0]],
             "act": [{"a": "mo", "x": 830, "y": 1040, "pose": "fly", "face": -1, "back": True, "trail": 1, "look": [-1, 0], "ease": "in"},
                     {"a": "cam", "x": 560, "y": 1050, "zoom": 1.15}]},
            {"dur": 0.4, "sfx": [["thud", 0.0]], "act": [{"a": "shake", "v": 18}, {"a": "mo", "squash": 1, "dur": 0.08}, {"a": "tally", "n": 299, "dur": 0}]},
            {"dur": 1.0, "act": [{"a": "mo", "y": 1262, "rot": 3.14159, "squash": 0, "pose": "upside", "expr": "dazed", "trail": 0, "ease": "in"}]},
            {"say": "PEBBLE", "text": "Two ninety-nine.", "act": [{"a": "pebble", "look": "cam", "dur": 0}, {"a": "cam", "x": 420, "y": 1150, "zoom": 1.25}], "gap": 0.6},
        ],
    },
    # ------------------------------------------------------------------
    "s04-pebble-says-no": {
        "title": "Mo's Plan to Become the Moon",
        "hook": {"text": "MO HAS A PLAN", "dur": 2.0},
        "initial": {"cam": {"x": 370, "y": 1150, "zoom": 1.45},
                    "mo": {**MO_SIT, "pose": "sit", "look": [-1, 0.2], "expr": "happy"}},
        "events": [
            {"say": "MO", "text": "Pebble. I have a plan.", "tts": "Pebble. I have a plan."},
            {"say": "MO", "text": "Step one: I sit on the moon all night.", "sfx": [["pop", 0.0]], "act": [{"a": "overlay", "text": "STEP 1", "color": "#ffe39a"}]},
            {"say": "MO", "text": "Step two: I start to glow.", "sfx": [["pop", 0.0]], "act": [{"a": "overlay", "text": "STEP 2", "color": "#ffe39a"}]},
            {"say": "MO", "text": "Step three: I AM the moon.", "tts": "Step three: I am the moon!", "sfx": [["pop", 0.0]],
             "act": [{"a": "overlay", "text": "STEP 3", "color": "#ffe39a"}, {"a": "mo", "expr": "wonder", "look": [0.3, -1], "dur": 0, "off": 1.0}]},
            {"dur": 1.3, "act": [{"a": "cam", "x": 260, "y": 1290, "zoom": 1.9, "ease": "inout"}, {"a": "pebble", "look": "cam", "dur": 0}]},
            {"say": "PEBBLE", "text": "No.", "gap": 0.6},
            {"dur": 0.1, "act": [cut(CAM_TWO), {"a": "mo", "expr": "worry", "look": [-1, 0.2], "dur": 0}]},
            {"say": "MO", "text": "...Step four?", "tts": "Step four?", "gap": 0.8},
            {"say": "PEBBLE", "text": "No.", "act": [cut(CAM_PEB)], "gap": 0.6},
        ],
    },
    # ------------------------------------------------------------------
    "s05-why-dont-you-fly": {
        "title": "Why Doesn't Pebble Fly?",
        "hook": {"text": "ASK A ROCK", "dur": 2.0},
        "initial": {"cam": {"x": 370, "y": 1150, "zoom": 1.45},
                    "mo": {**MO_SIT, "pose": "sit", "look": [-1, 0.2], "expr": "happy"}},
        "events": [
            {"say": "MO", "text": "Pebble, why don't you ever fly to the moon?"},
            {"dur": 1.1, "act": [{"a": "cam", "x": 260, "y": 1290, "zoom": 1.9}, {"a": "pebble", "look": "cam", "dur": 0}]},
            {"say": "PEBBLE", "text": "Rock.", "gap": 0.5},
            {"dur": 0.1, "act": [cut(CAM_TWO)]},
            {"say": "MO", "text": "Is that a reason?", "act": [{"a": "mo", "expr": "worry", "dur": 0}], "gap": 0.9},
            {"say": "PEBBLE", "text": "Yes.", "act": [cut(CAM_PEB)], "gap": 0.5},
            {"dur": 0.1, "act": [cut(CAM_TWO), {"a": "mo", "expr": "happy", "look": [0.3, -1], "dur": 0}]},
            {"dur": 0.7, "sfx": [["whoosh", 0.0]],
             "act": [{"a": "mo", "x": 560, "y": 790, "pose": "fly", "trail": 1, "look": [0, -1], "ease": "in"},
                     {"a": "pebble", "look": "up", "dur": 0},
                     {"a": "cam", "x": 470, "y": 1000, "zoom": 1.15}]},
            {"dur": 0.4, "sfx": [["tink", 0.0]], "act": [{"a": "mo", "squash": 1, "dur": 0.08}, {"a": "shake", "v": 14, "dur": 0.3}]},
            {"dur": 0.9, "sfx": [["thud", 0.85]],
             "act": [{"a": "mo", "x": 500, "y": 1262, "rot": 3.14159, "squash": 0, "pose": "upside", "expr": "dazed", "trail": 0, "ease": "in"}]},
            {"say": "PEBBLE", "text": "Glass.", "act": [{"a": "pebble", "look": "cam", "dur": 0}], "gap": 0.6},
        ],
    },
}
