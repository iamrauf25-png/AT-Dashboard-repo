"""Build the voice track, sound effects, ambience and music for one Short, plus timeline.json.

    venv/bin/python audio.py s01-moon-button build/

Voices come from Kokoro (an open-weights TTS model, run locally), pitched with ffmpeg so Mo sounds
small and Pebble sounds heavy. Every sound effect, the crickets and the music are synthesised
here from sine waves and noise: nothing is sampled, so there is nothing to license.
"""
import hashlib, json, os, subprocess, sys, tempfile, zlib
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from shorts import SHORTS  # noqa: E402

SR = 48000
FPS = 30
MODELS = os.environ.get("KOKORO_DIR", "/home/user/mp-tools/models")

VOICES = {  # kokoro voice, speed, pitch ratio, gain
    "MO": ("am_puck", 1.12, 1.30, 1.0),
    "MO_WHISPER": ("am_puck", 0.95, 1.30, 0.55),
    "PEBBLE": ("am_onyx", 0.82, 0.80, 1.15),
    "NARRATOR": ("bm_fable", 1.02, 1.0, 0.95),
}

_k = None


def kokoro():
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        _k = Kokoro(os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "voices-v1.0.bin"))
    return _k


def tts(who, text, cache):
    voice, speed, pitch, gain = VOICES[who]
    key = f"{who}|{text}"
    path = os.path.join(cache, hashlib.md5(key.encode()).hexdigest()[:16] + ".wav")
    if not os.path.exists(path):
        a, sr = kokoro().create(text, voice=voice, speed=speed, lang="en-us" if not voice.startswith("b") else "en-gb")
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            sf.write(f.name, a, sr)
            filt = f"asetrate={int(sr * pitch)},aresample={SR},atempo={1 / pitch:.5f}" if pitch != 1.0 else f"aresample={SR}"
            if who == "MO_WHISPER":
                filt += ",highpass=f=300"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f.name, "-af", filt, "-ac", "1", path], check=True)
            os.unlink(f.name)
    a, _ = sf.read(path, dtype="float32")
    # trim leading/trailing silence
    nz = np.where(np.abs(a) > 0.01)[0]
    if len(nz):
        a = a[max(0, nz[0] - int(0.02 * SR)): nz[-1] + int(0.06 * SR)]
    return a * gain


# ---------------- synthesis ----------------
def t_(d): return np.arange(int(d * SR)) / SR


def env_exp(d, k): return np.exp(-t_(d) * k)


def sfx(name, dur=None):
    rnd = np.random.default_rng(zlib.crc32(name.encode()))
    if name == "tink":
        t = t_(0.45)
        s = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, a, k in [(3150, .5, 9), (4720, .3, 12), (6230, .2, 16), (8400, .1, 22)])
        s[:200] += rnd.normal(0, .3, 200) * np.linspace(1, 0, 200)
        return s * 0.6
    if name == "click":
        t = t_(0.09)
        s = np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 90) * .5
        s[:150] += rnd.normal(0, .5, 150) * np.linspace(1, 0, 150)
        s2 = np.zeros(int(0.05 * SR)); return np.concatenate([s, s2, s * .6]) * 0.7
    if name == "buzz":
        d = dur or 2.0; t = t_(d)
        s = sum(np.sin(2 * np.pi * 120 * h * t) / h for h in range(1, 9))
        s *= (0.75 + 0.25 * np.sin(2 * np.pi * 7 * t)) * np.minimum(1, np.minimum(t / .3, (d - t) / .4))
        return s * 0.06
    if name == "whoosh":
        d = 0.55; n = rnd.normal(0, 1, int(d * SR)); t = t_(d)
        out = np.zeros_like(n); y = 0.0
        cut = 0.02 + 0.25 * np.sin(np.pi * t / d)
        for i in range(len(n)):
            y += cut[i] * (n[i] - y); out[i] = y
        return out * np.sin(np.pi * t / d) ** 2 * 0.9
    if name == "thud":
        t = t_(0.4); f = 95 * np.exp(-t * 6) + 40
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)
        return s * 0.9
    if name == "chime":
        out = np.zeros(int(2.6 * SR))
        for i, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
            t = t_(1.8); tone = (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 2.6)
            o = int(i * 0.22 * SR); out[o:o + len(tone)] += tone
        return out * 0.16
    if name == "pop":
        t = t_(0.09); f = 380 + 900 * t / 0.09
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.45
    raise ValueError(name)


def crickets(d, seed=3):
    rnd = np.random.default_rng(seed)
    out = np.zeros((int(d * SR), 2))
    for ch, (f0, period) in enumerate([(4300, 0.93), (4750, 1.31)]):
        t0 = rnd.uniform(0, period)
        while t0 < d - 0.2:
            for p in range(3):
                t = t_(0.022); pulse = np.sin(2 * np.pi * f0 * t) * np.sin(np.pi * t / 0.022) ** 2
                o = int((t0 + p * 0.034) * SR); out[o:o + len(pulse), ch] += pulse
            t0 += period * rnd.uniform(0.8, 1.2)
    return out * 0.022


def music(d, seed=11):
    """Soft marimba-and-bass loop, 96 bpm, C-Am-F-G, pentatonic melody."""
    rnd = np.random.default_rng(seed)
    beat = 60 / 96; e8 = beat / 2
    out = np.zeros(int((d + 2) * SR))
    chords = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [53, 57, 60]), (43, [55, 59, 62])]
    pent = [72, 74, 76, 79, 81, 84]
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)

    def note(m, start, ln, amp, k):
        t = t_(ln); f = hz(m)
        tone = (np.sin(2 * np.pi * f * t) + 0.22 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 20)) * np.exp(-t * k)
        o = int(start * SR); seg = out[o:o + len(tone)]; seg += tone[:len(seg)] * amp

    melody = []
    for bar in range(8):
        root, tri = chords[bar % 4]
        for step in range(8):
            if step in (0, 3, 4, 6) or rnd.random() < 0.25:
                melody.append((bar, step, int(rnd.choice(pent + [m + 12 for m in tri]))))
    loop = 8 * 4 * beat; t0 = 0.0
    while t0 < d:
        for bar in range(8):
            root, tri = chords[bar % 4]
            note(root - 12 + 12, t0 + bar * 4 * beat, 1.6, 0.55, 2.5)
            note(root + 12 - 12, t0 + bar * 4 * beat + 2 * beat, 1.2, 0.35, 3)
        for bar, step, m in melody:
            note(m, t0 + bar * 4 * beat + step * e8, 0.6, 0.28, 7)
        t0 += loop
    return out[: int(d * SR)] * 0.11


def envelope(a, n_frames):
    hop = SR // FPS
    v = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2)) if i * hop < len(a) else 0 for i in range(n_frames)])
    if v.max() > 0: v = v / v.max()
    v = np.clip((v - 0.12) / 0.6, 0, 1)
    return [round(float(x), 2) for x in v]


# ---------------- build ----------------
def build(sid, outdir):
    spec = SHORTS[sid]
    out = os.path.join(outdir, sid); os.makedirs(out, exist_ok=True)
    cache = os.path.join(outdir, "_tts"); os.makedirs(cache, exist_ok=True)
    cur = 0.35
    lines, acts, sfx_ev, voice = [], [], [], []
    for ev in spec["events"]:
        start = cur
        if "say" in ev:
            a = tts(ev["say"], ev.get("tts", ev["text"]), cache)
            if ev.get("cut"):
                a = a[: int(len(a) * ev["cut"])]; a[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
            d = len(a) / SR
            voice.append((start, a))
            lines.append({"start": round(start, 3), "end": round(start + d, 3), "who": ev["say"], "text": ev["text"],
                          "env": envelope(a, int(d * FPS) + 1)})
            cur += d + ev.get("gap", 0.22)
            evdur = d
        else:
            evdur = ev["dur"]; cur += evdur
        for ac in ev.get("act", []):
            ac = dict(ac)
            ac["start"] = round(start + ac.pop("off", 0), 3)
            ac["dur"] = ac.get("dur", evdur)
            acts.append(ac)
        for s in ev.get("sfx", []):
            sfx_ev.append((start + s[1], s[0], s[2] if len(s) > 2 else None))
    total = cur + 0.25
    acts.sort(key=lambda a: a["start"])

    n = int(total * SR) + SR
    dia = np.zeros(n); fx = np.zeros(n)
    for st, a in voice: o = int(st * SR); dia[o:o + len(a)] += a
    for st, name, d in sfx_ev:
        s = sfx(name, d); o = int(st * SR); fx[o:o + len(s)] += s[: n - o]
    # music gate from "music" acts, ducked under dialogue
    gate = np.ones(n)
    for ac in acts:
        if ac["a"] == "music":
            gate[int(ac["start"] * SR):] = 1.0 if ac["on"] else 0.0
    k = int(0.15 * SR); gate = np.convolve(gate, np.ones(k) / k, mode="same")
    speech = np.convolve((np.abs(dia) > 0.02).astype(float), np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
    duck = 1 - 0.55 * np.clip(speech * 3, 0, 1)
    m = music(n / SR + 0.1)[:n]
    mus = m * gate * duck
    cr = crickets(n / SR + 0.1)[:n]
    mix = np.stack([dia + fx + mus, dia + fx + mus], axis=1) + cr
    mix[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))[:, None]
    mix = mix[: int(total * SR)]
    mix *= 0.89 / max(1e-6, np.abs(mix).max())
    sf.write(os.path.join(out, "audio.wav"), mix.astype(np.float32), SR)

    tl = {"id": sid, "title": spec["title"], "fps": FPS, "duration": round(total, 3), "hook": spec.get("hook"),
          "initial": spec.get("initial", {}), "acts": acts, "lines": lines}
    with open(os.path.join(out, "timeline.json"), "w") as f: json.dump(tl, f)
    print(f"{sid}: {total:.1f}s, {len(lines)} lines, {len(acts)} acts")


if __name__ == "__main__":
    ids = sys.argv[1].split(",") if sys.argv[1] != "all" else list(SHORTS)
    for sid in ids: build(sid, sys.argv[2])
