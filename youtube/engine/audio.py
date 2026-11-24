"""Shared audio engine: voices, sound effects, ambience and music for one Short, plus timeline.json.

    python audio.py <series_dir> <id|id,id|all> <build_dir>

<series_dir> holds shorts.py (SHORTS dict, optional SERIES dict). Voices come from Kokoro (an
open-weights TTS model, run locally), shaped with ffmpeg per character. Every sound effect, the
ambience and the music are synthesised here from sine waves and noise, so there is nothing to license.
"""
import hashlib, importlib.util, json, os, subprocess, sys, tempfile, zlib
import numpy as np
import soundfile as sf

SR = 48000
FPS = 30
MODELS = os.environ.get("KOKORO_DIR", os.path.expanduser("~/mp-tools/models"))

# who: (kokoro voice, lang, speed, pitch ratio, gain, extra ffmpeg filter)
VOICES = {
    "MO": ("am_puck", "en-us", 1.12, 1.30, 1.0, ""),
    "MO_WHISPER": ("am_puck", "en-us", 0.95, 1.30, 0.55, "highpass=f=300"),
    "PEBBLE": ("am_onyx", "en-us", 0.82, 0.80, 1.15, ""),
    "NARRATOR": ("bm_fable", "en-gb", 1.02, 1.0, 0.95, ""),
    # दादी vs भूत (Hindi)
    "DADI": ("hf_beta", "hi", 0.92, 0.90, 1.05, "treble=g=2"),
    "CHAMAN": ("hm_omega", "hi", 0.95, 0.86, 1.0, "aecho=0.8:0.6:70|140:0.35|0.2"),
    "CHAMAN_SCARED": ("hm_omega", "hi", 1.15, 1.12, 1.0, "aecho=0.8:0.6:60:0.3"),
    "CHANDNI": ("hf_alpha", "hi", 0.95, 0.92, 1.0, "aecho=0.8:0.6:60|120:0.3|0.18"),
    "NARRATOR_HI": ("hm_psi", "hi", 0.9, 0.90, 0.95, "aecho=0.8:0.5:90:0.25"),
}

_k = None


def kokoro():
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        _k = Kokoro(os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "voices-v1.0.bin"))
    return _k


def tts(who, text, cache):
    voice, lang, speed, pitch, gain, extra = VOICES[who]
    key = f"{who}|{text}|{VOICES[who]}"
    path = os.path.join(cache, hashlib.md5(key.encode()).hexdigest()[:16] + ".wav")
    if not os.path.exists(path):
        a, sr = kokoro().create(text, voice=voice, speed=speed, lang=lang)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            sf.write(f.name, a, sr)
            filt = f"asetrate={int(sr * pitch)},aresample={SR},atempo={1 / pitch:.5f}" if pitch != 1.0 else f"aresample={SR}"
            if extra: filt += "," + extra
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f.name, "-af", filt, "-ac", "1", path], check=True)
            os.unlink(f.name)
    a, _ = sf.read(path, dtype="float32")
    nz = np.where(np.abs(a) > 0.01)[0]
    if len(nz):
        a = a[max(0, nz[0] - int(0.02 * SR)): nz[-1] + int(0.06 * SR)]
    return a * gain


# ---------------- synthesis ----------------
def t_(d): return np.arange(int(d * SR)) / SR


def lowpass_noise(n, cut, rnd):
    x = rnd.normal(0, 1, n); out = np.zeros(n); y = 0.0
    cut = np.broadcast_to(cut, (n,))
    for i in range(n):
        y += cut[i] * (x[i] - y); out[i] = y
    return out


def sfx(name, dur=None):
    rnd = np.random.default_rng(zlib.crc32(name.encode()))
    if name == "tink":
        t = t_(0.45)
        s = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, a, k in [(3150, .5, 9), (4720, .3, 12), (6230, .2, 16), (8400, .1, 22)])
        s[:200] += rnd.normal(0, .3, 200) * np.linspace(1, 0, 200)
        return s * 0.6
    if name == "click":
        t = t_(0.09); s = np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 90) * .5
        s[:150] += rnd.normal(0, .5, 150) * np.linspace(1, 0, 150)
        return np.concatenate([s, np.zeros(int(0.05 * SR)), s * .6]) * 0.7
    if name == "buzz":
        d = dur or 2.0; t = t_(d)
        s = sum(np.sin(2 * np.pi * 120 * h * t) / h for h in range(1, 9))
        s *= (0.75 + 0.25 * np.sin(2 * np.pi * 7 * t)) * np.minimum(1, np.minimum(t / .3, (d - t) / .4))
        return s * 0.06
    if name == "whoosh":
        d = 0.55; t = t_(d)
        return lowpass_noise(len(t), 0.02 + 0.25 * np.sin(np.pi * t / d), rnd) * np.sin(np.pi * t / d) ** 2 * 0.9
    if name == "thud":
        t = t_(0.4); f = 95 * np.exp(-t * 6) + 40
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) * 0.9
    if name == "chime":
        out = np.zeros(int(2.6 * SR))
        for i, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
            t = t_(1.8); tone = (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 2.6)
            o = int(i * 0.22 * SR); out[o:o + len(tone)] += tone
        return out * 0.16
    if name == "pop":
        t = t_(0.09); f = 380 + 900 * t / 0.09
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.45
    if name == "owl":
        out = np.zeros(int(1.6 * SR))
        for st, d, f in [(0, 0.35, 420), (0.5, 0.25, 400), (0.8, 0.55, 380)]:
            t = t_(d); vib = f * (1 + 0.01 * np.sin(2 * np.pi * 6 * t))
            tone = np.sin(2 * np.pi * np.cumsum(vib) / SR) * np.sin(np.pi * t / d) ** 1.5
            tone += 0.3 * np.sin(2 * 2 * np.pi * np.cumsum(vib) / SR) * np.sin(np.pi * t / d) ** 2
            o = int(st * SR); out[o:o + len(tone)] += tone
        return out * 0.22
    if name == "sting":  # jump-scare stab: dissonant cluster + noise hit
        t = t_(1.6)
        s = sum(np.sin(2 * np.pi * f * t + rnd.uniform(0, 6)) for f in [138.6, 146.8, 207.7, 293.7, 311.1, 587.3, 622.3])
        s = s / 7 * np.exp(-t * 2.2) + rnd.normal(0, 1, len(t)) * np.exp(-t * 18) * 0.6
        return s * 0.9
    if name == "riser":  # creepy rising tone before a scare
        d = dur or 2.0; t = t_(d); f = 180 * (2 ** (2 * t / d))
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.06) / SR)
        return s * (t / d) ** 2 * 0.18
    if name == "wahwah":  # comic sad trombone
        out = np.zeros(int(2.0 * SR)); notes = [(0, 0.3, 311.1), (0.32, 0.3, 293.7), (0.64, 0.3, 277.2), (0.96, 0.9, 261.6)]
        for st, d, f in notes:
            t = t_(d); vib = f * (1 + (0.03 * np.sin(2 * np.pi * 7 * t) if d > 0.5 else 0))
            ph = 2 * np.pi * np.cumsum(vib) / SR
            tone = sum(np.sin(ph * h) / h ** 1.2 for h in range(1, 7)) * np.minimum(1, np.minimum(t / 0.03, (d - t) / 0.08))
            o = int(st * SR); out[o:o + len(tone)] += tone
        return out * 0.18
    if name == "boing":
        t = t_(0.5); f = 220 + 160 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 5)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * 0.45
    if name == "clatter":
        out = np.zeros(int(1.0 * SR))
        for i in range(9):
            t = t_(0.25); f = rnd.uniform(1800, 4200)
            hit = (np.sin(2 * np.pi * f * t) + np.sin(2 * np.pi * f * 1.47 * t)) * np.exp(-t * rnd.uniform(14, 30))
            o = int(rnd.uniform(0, 0.7) * SR); out[o:o + len(hit)] += hit * rnd.uniform(0.3, 0.8)
        return out * 0.3
    if name == "shutter":
        t = t_(0.06); s = rnd.normal(0, 1, len(t)) * np.exp(-t * 80)
        return np.concatenate([s, np.zeros(int(0.07 * SR)), s * 0.8]) * 0.5
    if name == "gust":
        d = dur or 2.5; t = t_(d)
        return lowpass_noise(len(t), 0.01 + 0.03 * np.sin(np.pi * t / d), rnd) * np.sin(np.pi * t / d) * 2.2
    if name == "chains":
        out = np.zeros(int(1.4 * SR))
        for i in range(14):
            t = t_(0.18); f = rnd.uniform(2400, 5200)
            hit = (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.33 * t) + 0.4 * np.sin(2 * np.pi * f * 2.1 * t)) * np.exp(-t * rnd.uniform(20, 40))
            o = int((i * 0.09 + rnd.uniform(0, 0.03)) * SR); out[o:o + len(hit)] += hit * rnd.uniform(0.3, 0.7)
        return out * 0.25
    if name == "blow":
        t = t_(0.7); return lowpass_noise(len(t), 0.08, rnd) * np.sin(np.pi * t / 0.7) ** 0.7 * 1.6
    if name == "birds":
        out = np.zeros(int(4.0 * SR))
        for k in range(14):
            st = rnd.uniform(0, 3.4); d = rnd.uniform(0.06, 0.14); t = t_(d)
            f = rnd.uniform(2800, 4200) + rnd.uniform(-1500, 1500) * t / d
            chirp = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d)
            o = int(st * SR); out[o:o + len(chirp)] += chirp * rnd.uniform(0.2, 0.5)
        return out * 0.35
    raise ValueError(name)


def crickets(d, seed=3, level=0.022):
    rnd = np.random.default_rng(seed)
    out = np.zeros((int(d * SR), 2))
    for ch, (f0, period) in enumerate([(4300, 0.93), (4750, 1.31)]):
        t0 = rnd.uniform(0, period)
        while t0 < d - 0.2:
            for p in range(3):
                t = t_(0.022); pulse = np.sin(2 * np.pi * f0 * t) * np.sin(np.pi * t / 0.022) ** 2
                o = int((t0 + p * 0.034) * SR); out[o:o + len(pulse), ch] += pulse
            t0 += period * rnd.uniform(0.8, 1.2)
    return out * level


def wind(d, seed=8):
    rnd = np.random.default_rng(seed); n = int(d * SR)
    base = lowpass_noise(n, 0.012, rnd)
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * t_(d)[:n] / 7.0 + 1)
    return np.stack([base * swell, np.roll(base, 2400) * swell], 1) * 0.9


def hz(m): return 440 * 2 ** ((m - 69) / 12)


def music_marimba(d, seed=11):
    """Soft marimba-and-bass loop, 96 bpm, C-Am-F-G, pentatonic melody (Mo & Pebble)."""
    rnd = np.random.default_rng(seed); beat = 60 / 96; e8 = beat / 2
    out = np.zeros(int((d + 2) * SR))
    chords = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [53, 57, 60]), (43, [55, 59, 62])]
    pent = [72, 74, 76, 79, 81, 84]

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
            root, _ = chords[bar % 4]
            note(root, t0 + bar * 4 * beat, 1.6, 0.55, 2.5)
            note(root, t0 + bar * 4 * beat + 2 * beat, 1.2, 0.35, 3)
        for bar, step, m in melody:
            note(m, t0 + bar * 4 * beat + step * e8, 0.6, 0.28, 7)
        t0 += loop
    return out[: int(d * SR)] * 0.11


def music_horror(d, seed=5):
    """Tanpura-like drone on Sa and Pa (C#), a low pad that slowly beats, and sparse high glass notes."""
    rnd = np.random.default_rng(seed); n = int(d * SR); t = t_(d)[:n]
    out = np.zeros(n)
    sa = hz(37)  # C#2
    for f, a in [(sa, 1.0), (sa * 1.5, 0.6), (sa * 2, 0.5), (sa * 1.01, 0.4)]:
        ph = 2 * np.pi * f * t
        out += a * sum(np.sin(ph * h) / h ** 1.6 for h in range(1, 10))
    out *= 0.6 + 0.4 * np.sin(2 * np.pi * t / 3.2) ** 2  # tanpura pluck-like swell
    # sparse eerie high notes (minor second, tritone)
    for k in range(int(d / 2.6)):
        st = k * 2.6 + rnd.uniform(0, 1.2); m = int(rnd.choice([73, 74, 79, 80, 85]))
        tt = t_(2.2); tone = np.sin(2 * np.pi * hz(m) * tt) * np.exp(-tt * 1.8) * 0.35
        o = int(st * SR); seg = out[o:o + len(tone)]; seg += tone[:len(seg)]
    return out * 0.05


def music_comic(d, seed=9):
    """Bouncy plucked loop in Raag Bhupali notes (S R G P D) over a dholak-ish thump, 112 bpm."""
    rnd = np.random.default_rng(seed); beat = 60 / 112; n = int((d + 2) * SR); out = np.zeros(n)
    scale = [61, 63, 65, 68, 70, 73, 75, 77]

    def pluck(m, st, amp):
        tt = t_(0.5); f = hz(m)
        tone = (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(4 * np.pi * f * tt) * np.exp(-tt * 12)) * np.exp(-tt * 9)
        o = int(st * SR); seg = out[o:o + len(tone)]; seg += tone[:len(seg)] * amp

    def drum(st, f, amp):
        tt = t_(0.25); tone = np.sin(2 * np.pi * np.cumsum(f * np.exp(-tt * 9) + 50) / SR) * np.exp(-tt * 14)
        o = int(st * SR); seg = out[o:o + len(tone)]; seg += tone[:len(seg)] * amp

    pattern = [int(rnd.choice(scale)) for _ in range(16)]
    t0 = 0.0
    while t0 < d:
        for i in range(16):
            if i % 4 != 3 or rnd.random() < 0.3: pluck(pattern[i], t0 + i * beat / 2, 0.35)
        for b in range(8): drum(t0 + b * beat, 110 if b % 2 == 0 else 170, 0.6 if b % 2 == 0 else 0.35)
        t0 += 8 * beat
    return out[: int(d * SR)] * 0.12


MUSIC = {"marimba": music_marimba, "tender": music_marimba, "horror": music_horror, "comic": music_comic}


def envelope(a, n_frames):
    hop = SR // FPS
    v = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2)) if i * hop < len(a) else 0 for i in range(n_frames)])
    if v.max() > 0: v = v / v.max()
    v = np.clip((v - 0.12) / 0.6, 0, 1)
    return [round(float(x), 2) for x in v]


def load_series(series_dir):
    sys.path.insert(0, os.path.abspath(series_dir))
    spec = importlib.util.spec_from_file_location("shorts", os.path.join(series_dir, "shorts.py"))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod.SHORTS, getattr(mod, "SERIES", {})


# ---------------- build ----------------
def build(sid, spec, series, outdir):
    out = os.path.join(outdir, sid); os.makedirs(out, exist_ok=True)
    cache = os.path.join(outdir, "_tts"); os.makedirs(cache, exist_ok=True)
    cur = 0.35
    lines, acts, sfx_ev, voice, chapters = [], [], [], [], []
    for ev in spec["events"]:
        start = cur
        if ev.get("chapter"): chapters.append({"start": round(start, 2), "title": ev["chapter"]})
        if "say" in ev:
            a = tts(ev["say"], ev.get("tts", ev["text"]), cache)
            if ev.get("cut"):
                a = a[: int(len(a) * ev["cut"])]; a[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
            d = len(a) / SR
            voice.append((start, a))
            who = ev["say"].replace("_WHISPER", "").replace("_SCARED", "").replace("_HI", "")
            lines.append({"start": round(start, 3), "end": round(start + d, 3), "who": who, "text": ev["text"], "en": ev.get("en"),
                          "env": envelope(a, int(d * FPS) + 1)})
            cur += d + ev.get("gap", 0.22)
            evdur = d
        else:
            evdur = ev["dur"]; cur += evdur
        for ac in ev.get("act", []):
            ac = dict(ac); ac["start"] = round(start + ac.pop("off", 0), 3); ac["dur"] = ac.get("dur", evdur)
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

    # music: a mode per sample ("off" or a MUSIC key), switched by "music" acts, crossfaded
    mode0 = spec.get("music", series.get("music", "marimba"))
    modes = np.full(n, mode0, dtype=object)
    for ac in acts:
        if ac["a"] == "music":
            m = ac.get("mode", mode0 if ac.get("on", True) else "off")
            modes[int(ac["start"] * SR):] = m
    k = int(0.2 * SR)
    speech = np.convolve((np.abs(dia) > 0.02).astype(float), np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
    duck = 1 - 0.5 * np.clip(speech * 3, 0, 1)
    mus = np.zeros(n)
    for name in set(modes) - {"off"}:
        gate = np.convolve((modes == name).astype(float), np.ones(k) / k, mode="same")
        mus += MUSIC[name](n / SR + 0.1)[:n] * gate
    mus *= duck
    amb = np.zeros((n, 2))
    for a in series.get("ambience", ["crickets"]):
        if a == "crickets": amb += crickets(n / SR + 0.1)[:n]
        if a == "wind": amb += wind(n / SR + 0.1)[:n] * 0.05
    mix = np.stack([dia + fx + mus, dia + fx + mus], axis=1) + amb
    mix[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))[:, None]
    mix = mix[: int(total * SR)]
    mix *= 0.89 / max(1e-6, np.abs(mix).max())
    sf.write(os.path.join(out, "audio.wav"), mix.astype(np.float32), SR)

    tl = {"id": sid, "title": spec["title"], "fps": FPS, "duration": round(total, 3), "hook": spec.get("hook"),
          "initial": spec.get("initial", {}), "acts": acts, "lines": lines,
          "aspect": spec.get("aspect", "9:16"), "chapters": chapters}
    with open(os.path.join(out, "timeline.json"), "w") as f: json.dump(tl, f, ensure_ascii=False)
    write_srt(os.path.join(out, "captions.hi.srt"), lines, "text")
    if any(l.get("en") for l in lines): write_srt(os.path.join(out, "captions.en.srt"), lines, "en")
    print(f"{sid}: {total:.1f}s, {len(lines)} lines, {len(acts)} acts")


def write_srt(path, lines, key):
    ts = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round((x % 1) * 1000)):03d}"
    with open(path, "w", encoding="utf-8") as f:
        ls = [l for l in lines if l.get(key)]
        for i, l in enumerate(ls, 1):
            end = min(l["end"] + 0.25, ls[i]["start"] - 0.02) if i < len(ls) else l["end"] + 0.25
            f.write(f"{i}\n{ts(l['start'])} --> {ts(end)}\n{l[key]}\n\n")


if __name__ == "__main__":
    series_dir, which, outdir = sys.argv[1], sys.argv[2], sys.argv[3]
    shorts, series = load_series(series_dir)
    for sid in (list(shorts) if which == "all" else which.split(",")):
        build(sid, shorts[sid], series, outdir)
