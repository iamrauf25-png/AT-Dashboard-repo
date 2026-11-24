// दादी vs भूत — scene renderer. Plain script: defines window.Scene (same contract as Mo & Pebble's).
// World is 1080x1920 (vertical). Everything is drawn with canvas paths.
(function () {
  const W = 1080, H = 1920;
  const L = {
    moon: { x: 810, y: 330, r: 140 },
    tree: { x: 170, top: 520 },
    ghostHome: { x: 330, y: 640 },
    wallX: 560, wallTop: 830, groundY: 1430,
    lamp: { x: 690, y: 1010 },
    door: { x: 840, y: 960, w: 190, h: 470 },
    cot: { x: 720, y: 1370, w: 400 },
    dadi: { x: 720, y: 1215 },
  };
  const C = {
    skyTop: '#070a17', skyBot: '#1b2a36', moon: '#e9efd9', tree: '#0c1412', leaf: '#132420', root: '#0f1a17',
    wall: '#5a4a3a', wallDark: '#463a2e', ground: '#231e19', cot: '#6b4a2b', rope: '#b99b6b',
    ink: '#120b08', skin: '#9a6444', skinDark: '#7c4e33', saree: '#f2eee6', border: '#8e1f2a', hair: '#e8e8e8',
    ghost: '#d7f3ff', ghostEdge: '#7fd3ea', ghostInk: '#1d3b48',
    caption: { DADI: '#ffd27a', CHAMAN: '#a8f0ff', CHANDNI: '#e3c4ff', AMMA: '#f2a8ff', CHOR: '#ffb38a', NARRATOR: '#ffffff' },
  };
  const FONT = '"Baloo 2"';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const EASE = {
    linear: p => p, in: p => p * p * p, out: p => 1 - Math.pow(1 - p, 3),
    inout: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    back: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  };
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  const STARS = (() => { const r = rng(11); const a = []; for (let i = 0; i < 150; i++) a.push({ x: -800 + r() * 2700, y: r() * 900, s: 0.8 + r() * 2, ph: r() * 6.28 }); return a; })();
  const LEAVES = (() => { const r = rng(4); const a = []; for (let i = 0; i < 160; i++) { const ang = r() * 6.28, rad = Math.sqrt(r()); a.push({ x: 260 + Math.cos(ang) * rad * 330, y: 420 + Math.sin(ang) * rad * 250, s: 14 + r() * 12, rot: r() * 6.28, c: r() }); } return a; })();

  function initialState(over) {
    const s = {
      cam: { x: W / 2, y: H / 2, zoom: 1 },
      dark: 0, flash: 0, shake: 0, fog: 1, overlay: null,
      ghost: { x: L.ghostHome.x, y: L.ghostHome.y, scale: 1, alpha: 0, rot: 0, wig: false, pose: 'float', expr: 'evil', look: [0.6, 0.3], tremble: 0, feet: false, eyesOnly: false },
      dadi: { pose: 'sit', expr: 'flat', prop: 'chai', look: [0, 0], facepack: false, x: L.dadi.x, y: L.dadi.y, glint: 0 },
      ghost2: { kind: 'chudail', x: -280, y: 1200, scale: 1, alpha: 0, rot: 0, wig: true, pose: 'float', expr: 'evil', look: [1, 0.2], tremble: 0, feet: false, eyesOnly: false },
      props: { plates: false, bucket: false },
      lamp: true, dawn: 0, beam: 0, beamTo: [400, 900], letter: null,
      photo: 0,
    };
    return deepMerge(s, over || {});
  }
  function deepMerge(a, b) { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') deepMerge(a[k], b[k]); else a[k] = b[k]; } return a; }
  const clone = o => JSON.parse(JSON.stringify(o));

  function applyAct(s, act, p) {
    const e = (EASE[act.ease || 'inout'])(p);
    const lerpKeys = (obj, keys) => { for (const k of keys) if (act[k] !== undefined) obj[k] = lerp(obj[k], act[k], e); };
    const setKeys = (obj, keys) => { if (p > 0) for (const k of keys) if (act[k] !== undefined) obj[k] = act[k]; };
    switch (act.a) {
      case 'cam': lerpKeys(s.cam, ['x', 'y', 'zoom']); break;
      case 'ghost': lerpKeys(s.ghost, ['x', 'y', 'scale', 'alpha', 'tremble', 'rot']); setKeys(s.ghost, ['pose', 'expr', 'look', 'feet', 'eyesOnly', 'wig', 'garland']);
        if (act.wobble && p > 0 && p < 1) s.ghost.x += Math.sin(p * Math.PI * act.wobble) * 40; break;
      case 'ghost2': lerpKeys(s.ghost2, ['x', 'y', 'scale', 'alpha', 'tremble', 'rot']); setKeys(s.ghost2, ['pose', 'expr', 'look', 'eyesOnly', 'wig', 'garland']); break;
      case 'dadi': lerpKeys(s.dadi, ['x', 'y', 'glint']); setKeys(s.dadi, ['pose', 'expr', 'prop', 'look', 'facepack']); break;
      case 'props': setKeys(s.props, ['plates', 'bucket']); break;
      case 'dark': s.dark = lerp(s.dark, act.v, e); break;
      case 'fog': s.fog = lerp(s.fog, act.v, e); break;
      case 'photo': s.photo = lerp(s.photo, act.v, e); break;
      case 'flash': if (p > 0 && p < 1) s.flash = Math.max(s.flash, 1 - p); break;
      case 'shake': if (p > 0 && p < 1) s.shake = (act.v || 14) * (1 - p); break;
      case 'overlay': if (p > 0 && p < 1) s.overlay = { text: act.text, p, color: act.color }; break;
      case 'lamp': if (p > 0) s.lamp = act.on; break;
      case 'dawn': s.dawn = lerp(s.dawn, act.v, e); break;
      case 'beam': s.beam = lerp(s.beam, act.v, e); if (act.to) s.beamTo = act.to; break;
      case 'letter': if (act.text) s.letter = { text: act.text, title: act.title, v: s.letter ? s.letter.v : 0 }; if (s.letter) s.letter.v = lerp(s.letter.v, act.v, e); break;
      case 'music': break;
    }
  }
  function stateAt(tl, t) {
    const s = initialState(clone(tl.initial || {}));
    for (const act of tl.acts) { if (t < act.start) continue; applyAct(s, act, act.dur > 0 ? clamp((t - act.start) / act.dur, 0, 1) : 1); }
    return s;
  }

  // ---------- set ----------
  function drawSky(ctx, t, s) {
    const g = ctx.createLinearGradient(0, 0, 0, L.groundY); g.addColorStop(0, C.skyTop); g.addColorStop(1, C.skyBot);
    ctx.fillStyle = g; ctx.fillRect(-1000, -400, 3200, L.groundY + 400);
    if (s && s.dawn > 0) { const dg = ctx.createLinearGradient(0, 0, 0, L.groundY); dg.addColorStop(0, `rgba(70,90,150,${s.dawn})`); dg.addColorStop(1, `rgba(240,160,100,${s.dawn})`); ctx.fillStyle = dg; ctx.fillRect(-1000, -400, 3200, L.groundY + 400); }
    for (const st of STARS) { ctx.fillStyle = `rgba(230,255,240,${0.3 + 0.35 * Math.sin(t * 1.3 + st.ph)})`; ell(ctx, st.x, st.y, st.s, st.s); ctx.fill(); }
    const m = L.moon;
    const mg = ctx.createRadialGradient(m.x, m.y, m.r * 0.9, m.x, m.y, m.r * 2.8);
    mg.addColorStop(0, 'rgba(200,255,220,0.32)'); mg.addColorStop(1, 'rgba(200,255,220,0)');
    ctx.fillStyle = mg; ctx.fillRect(m.x - m.r * 3, m.y - m.r * 3, m.r * 6, m.r * 6);
    ctx.fillStyle = C.moon; ell(ctx, m.x, m.y, m.r, m.r); ctx.fill();
    ctx.fillStyle = 'rgba(160,175,150,0.45)'; [[-40, -30, 28], [45, 25, 20], [0, 60, 16], [55, -55, 12]].forEach(([dx, dy, r]) => { ell(ctx, m.x + dx, m.y + dy, r, r); ctx.fill(); });
    // thin cloud across the moon
    ctx.fillStyle = 'rgba(15,22,30,0.75)';
    const cx = m.x - 120 + ((t * 12) % 300);
    ell(ctx, cx, m.y + 40, 170, 18); ctx.fill(); ell(ctx, cx + 60, m.y + 20, 120, 14); ctx.fill();
    // bats
    for (let i = 0; i < 3; i++) {
      const bt = (t * 0.12 + i * 0.37) % 1, bx = lerp(-800, 1900, bt), by = 220 + i * 90 + Math.sin(bt * 20 + i) * 25;
      const f = Math.sin(t * 22 + i) * 12;
      ctx.fillStyle = '#05070c'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx - 18, by - 10 - f, bx - 34, by + 2); ctx.quadraticCurveTo(bx - 18, by - 2, bx, by + 6);
      ctx.quadraticCurveTo(bx + 18, by - 2, bx + 34, by + 2); ctx.quadraticCurveTo(bx + 18, by - 10 - f, bx, by); ctx.fill();
    }
  }
  function heart(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
    ctx.moveTo(0, s * 0.9); ctx.bezierCurveTo(-s, 0, -s * 0.7, -s * 0.9, 0, -s * 0.4); ctx.bezierCurveTo(s * 0.7, -s * 0.9, s, 0, 0, s * 0.9); ctx.lineTo(0, s * 1.4); ctx.fill(); ctx.restore();
  }
  function drawTree(ctx, t) {
    const sway = Math.sin(t * 0.8) * 6;
    // trunk
    ctx.fillStyle = C.tree; ctx.beginPath();
    ctx.moveTo(60, L.groundY + 20); ctx.bezierCurveTo(110, 1200, 70, 900, 150, 650); ctx.bezierCurveTo(170, 560, 210, 500, 260, 470);
    ctx.lineTo(300, 500); ctx.bezierCurveTo(250, 620, 260, 900, 300, 1150); ctx.bezierCurveTo(320, 1300, 360, 1400, 400, L.groundY + 20); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1b2723'; ctx.lineWidth = 6;
    [[140, 1300, 170, 900], [230, 1250, 220, 800]].forEach(([x0, y0, x1, y1]) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + 30, (y0 + y1) / 2, x1, y1); ctx.stroke(); });
    // branches
    ctx.strokeStyle = C.tree; ctx.lineCap = 'round';
    [[220, 560, 480 + sway, 380, 34], [200, 600, 0, 420, 30], [250, 520, 330 + sway, 260, 22]].forEach(([x0, y0, x1, y1, w]) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, y0 - 60, x1, y1); ctx.stroke(); });
    // canopy of peepal leaves
    for (const lf of LEAVES) { ctx.fillStyle = lf.c < 0.5 ? C.leaf : '#0f1d1a'; heart(ctx, lf.x + sway * (1 - lf.y / 700), lf.y, lf.s, lf.rot + Math.sin(t * 2 + lf.c * 9) * 0.15); }
    // hanging roots
    ctx.strokeStyle = C.root; ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) { const x = 330 + i * 26, len = 220 + (i * 53) % 160; ctx.beginPath(); ctx.moveTo(x, 520); ctx.quadraticCurveTo(x + Math.sin(t + i) * 12, 520 + len / 2, x + Math.sin(t * 0.7 + i) * 8, 520 + len); ctx.stroke(); }
  }
  function drawHouse(ctx, t, s) {
    ctx.fillStyle = C.wall; ctx.fillRect(L.wallX, L.wallTop, 1500, L.groundY - L.wallTop);
    // plaster stains + cracks
    ctx.fillStyle = C.wallDark; [[640, 1150, 60, 90], [960, 880, 80, 40], [600, 1350, 50, 60]].forEach(([x, y, rx, ry]) => { ell(ctx, x, y, rx, ry); ctx.fill(); });
    ctx.strokeStyle = '#2c241c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(620, 880); ctx.lineTo(650, 940); ctx.lineTo(635, 990); ctx.lineTo(660, 1040); ctx.stroke();
    // parapet
    ctx.fillStyle = '#3d3226'; ctx.fillRect(L.wallX - 20, L.wallTop - 40, 1500, 40);
    for (let x = L.wallX; x < 2000; x += 70) { ctx.fillRect(x, L.wallTop - 70, 36, 30); }
    // arched door
    const d = L.door; ctx.fillStyle = '#2a2017'; ctx.beginPath(); ctx.moveTo(d.x, d.y + d.h); ctx.lineTo(d.x, d.y + 90); ctx.arc(d.x + d.w / 2, d.y + 90, d.w / 2, Math.PI, 0); ctx.lineTo(d.x + d.w, d.y + d.h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#120d09'; ctx.beginPath(); ctx.moveTo(d.x + 18, d.y + d.h); ctx.lineTo(d.x + 18, d.y + 95); ctx.arc(d.x + d.w / 2, d.y + 95, d.w / 2 - 18, Math.PI, 0); ctx.lineTo(d.x + d.w - 18, d.y + d.h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#120d09'; rrect(ctx, 1260, 950, 200, 220, 10); ctx.fill(); ctx.strokeStyle = '#3d3226'; ctx.lineWidth = 10; ctx.stroke();
    ctx.lineWidth = 7; for (let x = 1290; x < 1460; x += 34) { ctx.beginPath(); ctx.moveTo(x, 955); ctx.lineTo(x, 1165); ctx.stroke(); }
    // niche with lantern
    const l = L.lamp; ctx.fillStyle = '#2d241b'; ctx.beginPath(); ctx.moveTo(l.x - 45, l.y + 60); ctx.lineTo(l.x - 45, l.y - 30); ctx.arc(l.x, l.y - 30, 45, Math.PI, 0); ctx.lineTo(l.x + 45, l.y + 60); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a4f2a'; ell(ctx, l.x, l.y + 45, 26, 10); ctx.fill();
    const fl = flicker(t);
    if (s.lamp === false) return;
    ctx.fillStyle = `rgba(255,${180 + fl * 40},80,1)`; ctx.beginPath(); ctx.moveTo(l.x, l.y + 2 - fl * 10); ctx.quadraticCurveTo(l.x + 12, l.y + 30, l.x, l.y + 40); ctx.quadraticCurveTo(l.x - 12, l.y + 30, l.x, l.y + 2 - fl * 10); ctx.fill();
  }
  const flicker = t => 0.6 + 0.25 * Math.sin(t * 13) + 0.15 * Math.sin(t * 31 + 1);
  function drawGround(ctx, s) {
    ctx.fillStyle = C.ground; ctx.fillRect(-1000, L.groundY, 3200, H);
    // the old well (kuan), far left — only seen in 16:9
    ctx.fillStyle = '#4a4036'; rrect(ctx, -430, 1290, 300, 170, 14); ctx.fill(); ctx.fillStyle = '#5b5045'; rrect(ctx, -450, 1270, 340, 40, 10); ctx.fill();
    ctx.strokeStyle = '#3a2c20'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-410, 1270); ctx.lineTo(-410, 1100); ctx.lineTo(-150, 1100); ctx.lineTo(-150, 1270); ctx.stroke();
    ctx.strokeStyle = '#8b7a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-280, 1100); ctx.lineTo(-280, 1210); ctx.stroke();
    ctx.fillStyle = '#1a1612'; [[150, 1560, 220, 40], [800, 1650, 300, 50], [450, 1800, 260, 50]].forEach(([x, y, rx, ry]) => { ell(ctx, x, y, rx, ry); ctx.fill(); });
    // charpai (string cot)
    const c = L.cot, x0 = c.x - c.w / 2, y0 = c.y;
    ctx.fillStyle = C.cot; [x0 + 8, x0 + c.w - 30].forEach(x => ctx.fillRect(x, y0, 22, 90));
    ctx.fillStyle = C.cot; rrect(ctx, x0, y0 - 10, c.w, 26, 6); ctx.fill();
    ctx.strokeStyle = C.rope; ctx.lineWidth = 3;
    for (let x = x0 + 16; x < x0 + c.w - 10; x += 18) { ctx.beginPath(); ctx.moveTo(x, y0 - 6); ctx.lineTo(x + 12, y0 + 12); ctx.stroke(); }
    if (s.props.bucket) { ctx.fillStyle = '#6f7a84'; ctx.beginPath(); ctx.moveTo(470, 1380); ctx.lineTo(560, 1380); ctx.lineTo(545, 1460); ctx.lineTo(485, 1460); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#3c444c'; ctx.lineWidth = 5; ctx.stroke(); }
  }
  function drawFog(ctx, t, amt) {
    if (amt <= 0) return;
    for (let i = 0; i < 4; i++) {
      const y = 1300 + i * 70, x = ((t * (14 + i * 6)) % 600) - 300;
      const g = ctx.createLinearGradient(0, y - 90, 0, y + 90);
      g.addColorStop(0, 'rgba(190,220,215,0)'); g.addColorStop(0.5, `rgba(190,220,215,${0.13 * amt})`); g.addColorStop(1, 'rgba(190,220,215,0)');
      ctx.fillStyle = g;
      for (let k = -3; k < 5; k++) { ell(ctx, x + k * 600, y, 420, 90); ctx.fill(); }
    }
  }

  // ---------- characters ----------
  function drawDadi(ctx, d, t, mouth) {
    ctx.save(); ctx.translate(d.x, d.y);
    const sit = d.pose === 'sit';
    // body: saree
    ctx.fillStyle = C.saree; ctx.strokeStyle = C.ink; ctx.lineWidth = 6;
    ctx.beginPath();
    if (sit) { ctx.moveTo(-70, -40); ctx.quadraticCurveTo(-120, 60, -150, 150); ctx.lineTo(150, 150); ctx.quadraticCurveTo(120, 60, 70, -40); }
    else { ctx.moveTo(-70, -40); ctx.quadraticCurveTo(-100, 120, -95, 260); ctx.lineTo(95, 260); ctx.quadraticCurveTo(100, 120, 70, -40); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // saree border diagonal + hem
    ctx.strokeStyle = C.border; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(-60, -30); ctx.quadraticCurveTo(10, 40, 90, 120); ctx.stroke();
    ctx.beginPath(); if (sit) { ctx.moveTo(-145, 140); ctx.lineTo(145, 140); } else { ctx.moveTo(-92, 250); ctx.lineTo(92, 250); } ctx.stroke();
    if (!sit) { ctx.fillStyle = '#3b2a1e'; ell(ctx, -40, 268, 30, 12); ctx.fill(); ell(ctx, 40, 268, 30, 12); ctx.fill(); }
    // arms + prop
    ctx.strokeStyle = C.skin; ctx.lineWidth = 20; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-62, 0); ctx.quadraticCurveTo(-95, 60, -40, 75); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(62, 0); ctx.quadraticCurveTo(100, 60, 50, 72); ctx.stroke();
    if (d.prop === 'chai') {
      ctx.fillStyle = 'rgba(230,240,245,0.75)'; ctx.beginPath(); ctx.moveTo(30, 40); ctx.lineTo(70, 40); ctx.lineTo(64, 88); ctx.lineTo(36, 88); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b6763d'; ctx.fillRect(34, 52, 32, 34);
      ctx.strokeStyle = 'rgba(230,230,230,0.5)'; ctx.lineWidth = 3; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(42 + i * 14, 34); ctx.quadraticCurveTo(48 + i * 14 + Math.sin(t * 3 + i) * 6, 14, 42 + i * 14, -4); ctx.stroke(); }
    } else if (d.prop === 'phone') {
      ctx.fillStyle = '#15181d'; rrect(ctx, 20, 10, 48, 84, 8); ctx.fill(); ctx.fillStyle = '#6fd3ff'; rrect(ctx, 25, 16, 38, 70, 4); ctx.fill();
    } else if (d.prop === 'chappal') {
      ctx.fillStyle = '#7b3b1d'; ell(ctx, 70, 20, 22, 46, -0.5); ctx.fill(); ctx.strokeStyle = '#3b1a0c'; ctx.lineWidth = 5; ctx.stroke();
    }
    // head
    ctx.save(); ctx.translate(0, -105);
    // pallu (saree over head)
    ctx.fillStyle = C.saree; ctx.strokeStyle = C.ink; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-82, 80); ctx.bezierCurveTo(-100, -20, -60, -95, 0, -95); ctx.bezierCurveTo(60, -95, 100, -20, 82, 80); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.border; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-70, 75); ctx.bezierCurveTo(-84, -10, -50, -80, 0, -80); ctx.bezierCurveTo(50, -80, 84, -10, 70, 75); ctx.stroke();
    // face
    ctx.fillStyle = d.facepack ? '#7fa36a' : C.skin; ctx.strokeStyle = C.ink; ctx.lineWidth = 5;
    ell(ctx, 0, 10, 56, 64); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.hair; ell(ctx, -38, -38, 22, 12, -0.4); ctx.fill(); ell(ctx, 38, -38, 22, 12, 0.4); ctx.fill();
    // wrinkles
    ctx.strokeStyle = 'rgba(40,20,10,0.5)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-20, -30); ctx.lineTo(20, -30); ctx.moveTo(-15, -22); ctx.lineTo(15, -22); ctx.stroke();
    // bindi
    ctx.fillStyle = '#c01828'; ell(ctx, 0, -12, 6, 6); ctx.fill();
    // eyes behind glasses
    const [lx, ly] = d.look || [0, 0];
    for (const side of [-1, 1]) {
      const ex = side * 22, ey = 8;
      ctx.fillStyle = '#fff'; ell(ctx, ex, ey, 11, d.expr === 'shock' ? 12 : 7); ctx.fill();
      ctx.fillStyle = '#1b0f0a'; ell(ctx, ex + lx * 3, ey + ly * 2, 5, 5); ctx.fill();
      if (d.expr === 'flat' || d.expr === 'smug') { ctx.fillStyle = d.facepack ? '#7fa36a' : C.skin; ctx.fillRect(ex - 13, ey - 10, 26, 8); ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ex - 11, ey - 2); ctx.lineTo(ex + 11, ey - 2); ctx.stroke(); }
      if (d.expr === 'angry') { ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ex - 14 * side, ey - 20); ctx.lineTo(ex + 12 * side, ey - 12); ctx.stroke(); }
      // round glasses
      ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 4; ell(ctx, ex, ey, 18, 16); ctx.stroke();
      const gl = d.glint || 0;
      ctx.fillStyle = `rgba(255,255,255,${0.25 + gl * 0.75})`; ell(ctx, ex - 6, ey - 6, 5 + gl * 10, 3 + gl * 8, -0.6); ctx.fill();
    }
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-4, 8); ctx.lineTo(4, 8); ctx.stroke();
    // nose
    ctx.strokeStyle = C.skinDark; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 14); ctx.quadraticCurveTo(7, 30, -2, 34); ctx.stroke();
    // mouth
    if (mouth > 0.08) { ctx.fillStyle = '#3a1612'; ell(ctx, 0, 48, 12 + mouth * 4, 3 + mouth * 9); ctx.fill(); }
    else if (d.expr === 'smug') { ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-14, 46); ctx.quadraticCurveTo(6, 52, 16, 40); ctx.stroke(); }
    else { ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-14, 48); ctx.lineTo(14, 48); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  }

  function drawGhost(ctx, g, t, mouth) {
    if (g.alpha <= 0.01) return;
    const CH = g.kind === 'chudail';
    const PAL = CH ? { ghost: '#efe0ff', edge: '#b98cf2', ink: '#3b2455', aura: '200,150,255' } : { ghost: C.ghost, edge: C.ghostEdge, ink: C.ghostInk, aura: '140,230,255' };
    ctx.save();
    const bob = Math.sin(t * 2.2) * 10, tr = g.tremble ? Math.sin(t * 70) * 6 * g.tremble : 0;
    ctx.translate(g.x + tr, g.y + bob); ctx.rotate(g.rot || 0); ctx.scale(g.scale, g.scale);
    if (g.eyesOnly) { ghostEyes(ctx, g, t, true); ctx.restore(); return; }
    ctx.globalAlpha = g.alpha * (0.88 + 0.08 * Math.sin(t * 5));
    // aura
    const a = ctx.createRadialGradient(0, 20, 30, 0, 20, 230); a.addColorStop(0, `rgba(${PAL.aura},0.35)`); a.addColorStop(1, `rgba(${PAL.aura},0)`);
    ctx.fillStyle = a; ctx.fillRect(-240, -220, 480, 480);
    // sheet body with wavy tail (or legs with backward feet)
    ctx.fillStyle = PAL.ghost; ctx.strokeStyle = PAL.edge; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-70, -40); ctx.bezierCurveTo(-75, -150, 75, -150, 70, -40);
    if (g.feet) { ctx.quadraticCurveTo(80, 80, 60, 140); ctx.lineTo(-60, 140); ctx.quadraticCurveTo(-80, 80, -70, -40); }
    else { ctx.quadraticCurveTo(90, 80, 70, 150); for (let i = 0; i <= 6; i++) { const x = 70 - i * (140 / 6), y = 150 + (i % 2 ? -22 : 8) + Math.sin(t * 6 + i) * 8; ctx.lineTo(x, y); } ctx.quadraticCurveTo(-90, 80, -70, -40); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // kurta buttons
    ctx.fillStyle = C.ghostEdge; [10, 40, 70].forEach(y => { ell(ctx, 0, y, 5, 5); ctx.fill(); });
    // backwards feet: toes point back (away from where he walks)
    if (g.feet) {
      ctx.fillStyle = '#bfe9f7'; ctx.strokeStyle = C.ghostEdge; ctx.lineWidth = 5;
      const step = Math.sin(t * 9) * 10;
      for (const side of [-1, 1]) { ctx.save(); ctx.translate(side * 32, 150 + (side > 0 ? step : -step) * 0.4); ell(ctx, -18, 0, 34, 14); ctx.fill(); ctx.stroke(); for (let k = 0; k < 4; k++) { ell(ctx, -46 - k * 2, -8 + k * 6, 6, 5); ctx.fill(); } ctx.restore(); }
    }
    // arms
    ctx.strokeStyle = PAL.ghost; ctx.lineWidth = 26; ctx.lineCap = 'round';
    const up = g.pose === 'scare' ? 1 : g.pose === 'scared' ? 0.6 : 0;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 62, -20); ctx.quadraticCurveTo(side * (110 + up * 10), lerp(30, -90, up), side * (100 + up * 20), lerp(70, -150, up)); ctx.stroke(); }
    ctx.strokeStyle = C.ghostEdge; ctx.lineWidth = 4; for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * (100 + up * 20), lerp(70, -150, up), 13, 0, Math.PI * 2); ctx.stroke(); }
    if (g.pose === 'plates') {
      ctx.fillStyle = '#c9ccd0'; ctx.strokeStyle = '#7e848b'; ctx.lineWidth = 4;
      for (let i = 0; i < 6; i++) { ell(ctx, 0, 70 - i * 13, 70, 12); ctx.fill(); ctx.stroke(); }
    }
    if (g.pose === 'chains') {
      ctx.strokeStyle = '#8d949c'; ctx.lineWidth = 7;
      for (const side of [-1, 1]) for (let i = 0; i < 9; i++) { const sw = Math.sin(t * 9 + i * 0.6) * 6; ell(ctx, side * (100 + sw) , -150 + i * 30 + 20, 9, 14, i % 2 ? 0 : Math.PI / 2); ctx.stroke(); }
    }
    if (g.pose === 'chai') { ctx.fillStyle = 'rgba(230,240,245,0.8)'; ctx.beginPath(); ctx.moveTo(-20, 50); ctx.lineTo(20, 50); ctx.lineTo(15, 96); ctx.lineTo(-15, 96); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#b6763d'; ctx.fillRect(-16, 62, 32, 32); }
    // topknot (choti)
    if (!CH) {
    ctx.strokeStyle = C.ghostInk; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -112); ctx.quadraticCurveTo(14 + Math.sin(t * 4) * 6, -150, 30, -140); ctx.stroke();
    }
    ghostEyes(ctx, g, t, false);
    if (g.wig) { ctx.fillStyle = '#0b0b10'; ctx.beginPath(); ctx.moveTo(-80, -60); ctx.bezierCurveTo(-90, -160, 90, -160, 80, -60); for (let i = 0; i <= 8; i++) { const x = 80 - i * 20, y = 150 + Math.sin(t * 3 + i) * 10 + (i % 2) * 20; ctx.lineTo(x * 1.15, y); } ctx.closePath(); ctx.save(); ctx.globalAlpha *= 0.92; ctx.fill(); ctx.restore(); ctx.save(); ctx.globalCompositeOperation = 'destination-over'; ctx.restore();
      ctx.fillStyle = PAL.ghost; ell(ctx, 0, -60, 58, 70); ctx.fill(); ghostEyes(ctx, g, t, false); }
    if (CH) { ctx.fillStyle = '#c0182c'; ell(ctx, 0, -112, 6, 6); ctx.fill(); ctx.strokeStyle = '#e0b552'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(14, -44, 7, 0, Math.PI * 2); ctx.stroke(); }
    // big handlebar moustache
    if (!CH) {
    ctx.fillStyle = '#4f6f7c'; ctx.beginPath();
    ctx.moveTo(0, -35); ctx.bezierCurveTo(-30, -48, -60, -40, -70, -58); ctx.bezierCurveTo(-72, -30, -40, -22, 0, -28);
    ctx.bezierCurveTo(40, -22, 72, -30, 70, -58); ctx.bezierCurveTo(60, -40, 30, -48, 0, -35); ctx.fill();
    }
    // marigold garland (wedding)
    if (g.garland) { for (let i = 0; i <= 16; i++) { const a = Math.PI * (0.05 + 0.9 * i / 16), x = Math.cos(a) * 66, y = -6 + Math.sin(a) * 70; ctx.fillStyle = i % 2 ? '#ff9f1a' : '#ffcf33'; ell(ctx, x, y, 11, 11); ctx.fill(); } }
    // mouth
    ctx.save(); ctx.translate(0, -12);
    const open = Math.max(mouth, g.pose === 'scare' ? 0.6 : 0, g.pose === 'scared' ? 0.8 : 0);
    if (open > 0.08) { ctx.fillStyle = '#16313c'; ell(ctx, 0, 6, 14 + open * 8, 4 + open * 18); ctx.fill(); }
    else if (g.expr === 'sad') { ctx.strokeStyle = C.ghostInk; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 18, 14, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
    else { ctx.strokeStyle = C.ghostInk; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -4, 16, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  }
  function ghostEyes(ctx, g, t, glowOnly) {
    const [lx, ly] = g.look || [0, 0];
    const big = g.expr === 'scared' ? 1.35 : 1;
    for (const side of [-1, 1]) {
      const ex = side * 26, ey = -78;
      ctx.save(); ctx.shadowColor = '#b8ff6a'; ctx.shadowBlur = glowOnly ? 30 : 18;
      ctx.fillStyle = g.expr === 'evil' || glowOnly ? '#d9ff7a' : '#ffffff'; ell(ctx, ex, ey, 17 * big, 21 * big); ctx.fill(); ctx.restore();
      if (!glowOnly) { ctx.strokeStyle = C.ghostInk; ctx.lineWidth = 4; ell(ctx, ex, ey, 17 * big, 21 * big); ctx.stroke(); }
      ctx.fillStyle = '#0c1a10'; ell(ctx, ex + lx * 6, ey + ly * 6, 7, glowOnly ? 12 : 9); ctx.fill();
      // eyebrows: evil = slanted, sad/scared = raised
      if (!glowOnly) {
        ctx.strokeStyle = C.ghostInk; ctx.lineWidth = 6; ctx.beginPath();
        if (g.expr === 'evil') { ctx.moveTo(ex - 18 * side, ey - 22); ctx.lineTo(ex + 18 * side, ey - 36); }
        else if (g.expr === 'sad' || g.expr === 'scared') { ctx.moveTo(ex - 18 * side, ey - 36); ctx.lineTo(ex + 18 * side, ey - 26); }
        else { ctx.moveTo(ex - 16, ey - 32); ctx.lineTo(ex + 16, ey - 32); }
        ctx.stroke();
      }
    }
  }

  // ---------- text ----------
  function wrap(ctx, text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const tr = cur ? cur + ' ' + w : w; if (ctx.measureText(tr).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tr; } if (cur) lines.push(cur); return lines; }
  function outlinedText(ctx, lines, x, y, size, fill, lh = 1.18) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const top = y - ((lines.length - 1) * size * lh) / 2;
    lines.forEach((ln, i) => { const yy = top + i * size * lh; ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#05050a'; ctx.strokeText(ln, x, yy); ctx.fillStyle = fill; ctx.fillText(ln, x, yy); });
  }
  // Screen size comes from the canvas: 1080x1920 for Shorts, 1920x1080 for long-form.
  function scr(ctx) { const SW = ctx.canvas.width, SH = ctx.canvas.height; return { SW, SH, land: SW > SH }; }
  function drawCaption(ctx, line, t, y) {
    const { SW, land } = scr(ctx);
    const pop = clamp((t - line.start) / 0.12, 0, 1), k = 0.85 + 0.15 * EASE.back(pop);
    ctx.save(); ctx.translate(SW / 2 - (land ? 0 : 40), y); ctx.scale(k, k);
    const size = land ? 54 : (line.text.length > 55 ? 60 : 70);
    ctx.font = `800 ${size}px ${FONT}`;
    const ls = wrap(ctx, line.text, land ? 1500 : 860);
    const bw = Math.max(...ls.map(l => ctx.measureText(l).width)) + 70, bh = ls.length * size * 1.18 + 36;
    ctx.fillStyle = 'rgba(5,6,14,0.62)'; rrect(ctx, -bw / 2, -bh / 2, bw, bh, 24); ctx.fill();
    outlinedText(ctx, ls, 0, 5, size, C.caption[line.who] || '#fff');
    ctx.restore();
  }
  function drawHook(ctx, hook, t) {
    if (!hook || t > hook.dur) return;
    const { SW, land } = scr(ctx);
    const p = clamp(t / 0.25, 0, 1), out = clamp((hook.dur - t) / 0.2, 0, 1), k = 0.92 + 0.08 * EASE.back(p);  // near full size on frame 1
    const size = land ? 110 : 104;
    ctx.save(); ctx.globalAlpha = out; ctx.translate(SW / 2 - (land ? 0 : 30), land ? 200 : 330); ctx.rotate(-0.03); ctx.scale(k, k);
    ctx.font = `800 ${size}px ${FONT}`; outlinedText(ctx, wrap(ctx, hook.text, land ? 1600 : 900), 0, 0, size, '#ff5a4f', 1.1);
    if (hook.sub) { ctx.font = `800 ${size * 0.45}px ${FONT}`; outlinedText(ctx, [hook.sub], 0, size * 0.95, size * 0.45, '#ffd27a'); }
    ctx.restore();
  }
  function drawLetter(ctx, s) {
    const lt = s.letter; if (!lt || lt.v <= 0.01) return;
    const { SW, SH, land } = scr(ctx), p = EASE.out(clamp(lt.v, 0, 1));
    ctx.save(); ctx.globalAlpha = Math.min(1, lt.v * 1.5);
    ctx.translate(SW / 2, lerp(SH * 1.2, SH / 2 - (land ? 20 : 120), p)); ctx.rotate(lerp(0.15, -0.02, p));
    const nl = lt.text.split('\n').length, w = land ? 980 : 900, h = land ? Math.min(760, 300 + nl * 80) : 1000;
    ctx.fillStyle = '#e9d9b0'; ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 8; rrect(ctx, -w / 2, -h / 2, w, h, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(122,90,48,0.15)'; for (let i = 0; i < 6; i++) { ell(ctx, -w / 2 + 80 + i * 150, -h / 2 + 60 + (i % 3) * 230, 60, 30); ctx.fill(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#7a1414';
    ctx.font = `800 ${land ? 64 : 70}px ${FONT}`; ctx.fillText(lt.title || '', 0, -h / 2 + 90);
    ctx.fillStyle = '#2a1a0c'; ctx.font = `700 ${land ? 48 : 54}px ${FONT}`;
    const ls = []; for (const para of lt.text.split('\n')) ls.push(...wrap(ctx, para, w - 140));
    ls.forEach((l, i) => ctx.fillText(l, 0, -h / 2 + 200 + i * (land ? 66 : 74)));
    ctx.restore();
  }

  function draw(ctx, tl, t) {
    const { SW, SH, land } = scr(ctx);
    const s = stateAt(tl, t);
    const lines = tl.lines || [];
    const speaking = who => { const l = lines.find(l => l.who === who && t >= l.start && t < l.end); if (!l) return 0; return l.env[Math.floor((t - l.start) * tl.fps)] || 0; };
    ctx.save(); ctx.clearRect(0, 0, SW, SH);
    const z = s.cam.zoom, hw = SW / 2 / z, hh = SH / 2 / z;
    const BX = land ? [-760, 1840] : [0, W];
    let cx = clamp(s.cam.x, BX[0] + hw, BX[1] - hw), cy = clamp(s.cam.y, hh, H - hh);
    if (s.shake) { cx += Math.sin(t * 90) * s.shake; cy += Math.cos(t * 77) * s.shake; }
    ctx.translate(SW / 2, SH / 2); ctx.scale(z, z); ctx.translate(-cx, -cy);
    drawSky(ctx, t, s); drawHouse(ctx, t, s); drawTree(ctx, t); drawGround(ctx, s);
    drawDadi(ctx, s.dadi, t, speaking('DADI'));
    drawFog(ctx, t, s.fog * 0.6);
    drawGhost(ctx, s.ghost, t, speaking('CHAMAN'));
    drawGhost(ctx, s.ghost2, t, speaking('CHANDNI'));
    drawFog(ctx, t + 40, s.fog * 0.5);
    // lantern glow (warm)
    const l = L.lamp, fl = flicker(t);
    if (s.lamp) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(l.x, l.y + 20, 5, l.x, l.y + 20, 420);
      g.addColorStop(0, `rgba(255,170,70,${0.35 * fl})`); g.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = g; ctx.fillRect(l.x - 450, l.y - 430, 900, 900); ctx.restore();
    }
    if (s.dark > 0) { ctx.fillStyle = `rgba(1,2,6,${s.dark})`; ctx.fillRect(-1200, -400, 3400, H + 800); if (s.dark > 0.6 && s.ghost.alpha > 0.05) { const gg = Object.assign({}, s.ghost, { eyesOnly: true }); drawGhost(ctx, gg, t, 0); } }
    // phone torch beam from Dadi's hand
    if (s.beam > 0.01) {
      const hx = s.dadi.x + 45, hy = s.dadi.y + 40, [tx, ty] = s.beamTo, a = Math.atan2(ty - hy, tx - hx), len = Math.hypot(tx - hx, ty - hy) + 200;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(hx, hy); ctx.rotate(a);
      const bg = ctx.createLinearGradient(0, 0, len, 0); bg.addColorStop(0, `rgba(255,255,235,${0.7 * s.beam})`); bg.addColorStop(1, 'rgba(255,255,235,0)');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(len, -180); ctx.lineTo(len, 180); ctx.lineTo(0, 8); ctx.closePath(); ctx.fill(); ctx.restore();
      if (s.dark > 0.3) { ctx.save(); ctx.globalAlpha = s.beam; drawGhost(ctx, Object.assign({}, s.ghost, { eyesOnly: false }), t, speaking('CHAMAN')); drawGhost(ctx, Object.assign({}, s.ghost2, { eyesOnly: false }), t, speaking('CHANDNI')); ctx.restore(); }
    }
    ctx.restore();
    // vignette
    const v = ctx.createRadialGradient(SW / 2, SH / 2, Math.min(SW, SH) * 0.46, SW / 2, SH / 2, Math.max(SW, SH) * 0.6); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, SW, SH);
    if (s.flash > 0) { ctx.fillStyle = `rgba(235,255,250,${s.flash * 0.85})`; ctx.fillRect(0, 0, SW, SH); }
    if (s.photo > 0) drawPhoto(ctx, s, t);
    drawLetter(ctx, s);
    if (s.overlay) { ctx.save(); ctx.font = `800 120px ${FONT}`; const fit = Math.min(1, (SW - 110) / (ctx.measureText(s.overlay.text).width + 30)); const k = (0.7 + 0.3 * EASE.back(clamp(s.overlay.p * 5, 0, 1))) * fit; ctx.translate(SW / 2 - (land ? 0 : 30), land ? 190 : 560); ctx.scale(k, k); ctx.rotate(-0.05); outlinedText(ctx, [s.overlay.text], 0, 0, 120, s.overlay.color || '#fff'); ctx.restore(); }
    drawHook(ctx, tl.hook, t);
    const cap = lines.filter(l => t >= l.start && t < l.end + 0.25).pop();
    if (cap) {
      // pick the caption height that stays furthest from both faces
      const toS = wy => (wy - cy) * z + SH / 2;
      const heads = [toS(s.dadi.y - 105)];
      if (s.ghost.alpha > 0.1) heads.push(toS(s.ghost.y - 80 * s.ghost.scale));
      if (s.ghost2.alpha > 0.1) heads.push(toS(s.ghost2.y - 80 * s.ghost2.scale));
      const cands = land ? [[SH - 120, 80], [130, 0]] : [[1120, 60], [1400, 20], [760, 0], [600, -10], [1480, -40]];
      let y = cands[0][0], best = -1e9;
      for (const [c, bias] of cands) { const d = Math.min(...heads.map(h => Math.abs(c - h))) + bias; if (d > best) { best = d; y = c; } }
      if (s.photo > 0.5) y = land ? SH - 120 : 1310;
      if (land && tl.hook && t < tl.hook.dur + 0.2) y = SH - 120;
      if (s.letter && s.letter.v > 0.5) y = SH - (land ? 70 : 250);
      drawCaption(ctx, cap, t, y);
    }
    ctx.save(); ctx.globalAlpha = 0.8; ctx.font = `800 40px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.lineWidth = 8; ctx.strokeStyle = '#05050a';
    const bxy = land ? [40, 30] : [48, 115];
    ctx.strokeText('दादी vs भूत', ...bxy); ctx.fillStyle = '#ffffff'; ctx.fillText('दादी vs भूत', ...bxy); ctx.restore();
  }
  // Phone "photo" overlay: the photo shows Dadi but no ghost (ghosts don't show up in photos).
  function drawPhoto(ctx, s, t) {
    const p = EASE.out(s.photo); ctx.save();
    const { SW, SH, land } = scr(ctx); ctx.translate(SW / 2 - (land ? 0 : 20), land ? lerp(SH + 500, SH / 2 - 20, p) : lerp(1500, 740, p)); ctx.rotate(lerp(0.2, -0.04, p)); ctx.scale(land ? 0.72 : 0.74, land ? 0.72 : 0.74); ctx.globalAlpha = Math.min(1, s.photo * 2);
    ctx.fillStyle = '#111317'; rrect(ctx, -300, -520, 600, 1040, 60); ctx.fill();
    ctx.save(); rrect(ctx, -270, -470, 540, 940, 26); ctx.clip();
    ctx.translate(-270, -470); ctx.scale(0.5, 0.5); ctx.translate(-(L.dadi.x - 540), -(L.dadi.y - 940));
    drawSky(ctx, t, s); drawHouse(ctx, t, s); drawTree(ctx, t); drawGround(ctx, s);
    drawDadi(ctx, Object.assign({}, s.dadi, { prop: 'phone', expr: 'smug', look: [0, 0.2] }), t, 0);
    ctx.restore();
    ctx.fillStyle = '#fff'; ell(ctx, 0, 440, 36, 36); ctx.fill();
    ctx.restore();
  }

  window.Scene = { W, H, L, C, draw, stateAt, initialState, drawDadi, drawGhost, drawSky, drawTree, drawHouse, drawGround, drawFog, outlinedText, wrap, ell, FONT };
})();
