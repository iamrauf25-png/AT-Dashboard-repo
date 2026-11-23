// Mo & Pebble — scene renderer. Plain script: defines window.Scene.
// World is 1080x1920 (vertical Shorts frame). Everything is drawn with canvas paths: no image assets.
(function () {
  const W = 1080, H = 1920;
  const L = {
    bulb: { x: 560, y: 700, r: 40 },
    sw: { x: 640, y: 980 },
    door: { x: 730, y: 850, w: 210, h: 480 },
    wallX: 470, wallTop: 430, deckY: 1330, stepY: 1385, groundY: 1445,
    pebble: { x: 250, y: 1330 },
    moon: { x: 270, y: 390, r: 150 },
  };
  const C = {
    skyTop: '#0a1230', skyBot: '#1e2d63', wall: '#2c355a', siding: '#232a49', eave: '#141932',
    door: '#4a3426', doorDark: '#36251b', trim: '#59658f', deck: '#5a4433', deckDark: '#3f2f23',
    ground: '#0f2a26', bush: '#0b201d', ink: '#24170f',
    moBody: '#b49c80', moWing: '#8a735b', moWing2: '#c5ad8c', moBelly: '#efe2c4',
    peb: '#9aa1ab', pebDark: '#6c727c', pebInk: '#23272e',
    caption: { MO: '#ffe39a', PEBBLE: '#cfe0ff', NARRATOR: '#ffffff' },
  };

  // ---------- helpers ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const EASE = {
    linear: p => p,
    in: p => p * p * p,
    out: p => 1 - Math.pow(1 - p, 3),
    inout: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    back: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  };
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const STARS = (() => { const r = rng(7); const a = []; for (let i = 0; i < 70; i++) a.push({ x: r() * W, y: r() * 1300, s: 1 + r() * 2.6, ph: r() * 6.28 }); return a; })();

  function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  // ---------- default state ----------
  function initialState(over) {
    const s = {
      cam: { x: W / 2, y: H / 2, zoom: 1 },
      light: true, clouds: 0, dark: 0, music: true,
      mo: { x: 300, y: 1000, scale: 1, rot: 0, pose: 'fly', face: 1, look: null, expr: 'happy', squash: 0, alpha: 1, trail: 0, back: false },
      pebble: { look: 'mo', expr: 'flat' },
      tally: 0, overlay: null, shake: 0, think: 0,
    };
    return deepMerge(s, over || {});
  }
  function deepMerge(a, b) {
    for (const k in b) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') deepMerge(a[k], b[k]);
      else a[k] = b[k];
    }
    return a;
  }
  const clone = o => JSON.parse(JSON.stringify(o));

  // ---------- actions ----------
  // Each action lerps from the state it finds to its target. Acts are applied in start order.
  function applyAct(s, act, p, t) {
    const e = (EASE[act.ease || 'inout'])(p);
    switch (act.a) {
      case 'cam':
        for (const k of ['x', 'y', 'zoom']) if (act[k] !== undefined) s.cam[k] = lerp(s.cam[k], act[k], e);
        break;
      case 'mo': {
        for (const k of ['x', 'y', 'scale', 'rot', 'squash', 'alpha']) if (act[k] !== undefined) s.mo[k] = lerp(s.mo[k], act[k], e);
        if (act.arc && p > 0 && p < 1) s.mo.y -= Math.sin(p * Math.PI) * act.arc;
        for (const k of ['pose', 'face', 'expr', 'look', 'back']) if (act[k] !== undefined && p > 0) s.mo[k] = act[k];
        if (act.trail !== undefined) s.mo.trail = p > 0 && p < 1 ? act.trail : 0;
        break;
      }
      case 'spiral': {
        const ang = (act.a0 || 0) + act.turns * Math.PI * 2 * e;
        const r = lerp(act.r0, act.r1, e);
        s.mo.x = act.cx + Math.cos(ang) * r; s.mo.y = act.cy + Math.sin(ang) * r * 0.55;
        s.mo.pose = 'fly'; s.mo.trail = p > 0 && p < 1 ? 1 : 0;
        break;
      }
      case 'pebble':
        if (p > 0) for (const k of ['look', 'expr']) if (act[k] !== undefined) s.pebble[k] = act[k];
        break;
      case 'light': if (p > 0) s.light = act.on; break;
      case 'clouds': s.clouds = lerp(s.clouds, act.open, e); break;
      case 'dark': s.dark = lerp(s.dark, act.v, e); break;
      case 'tally': s.tally = Math.round(lerp(s.tally, act.n, EASE.linear(p))); break;
      case 'overlay': if (p > 0 && p < 1) s.overlay = { text: act.text, p, color: act.color }; break;
      case 'shake': if (p > 0 && p < 1) s.shake = (act.v || 14) * (1 - p); break;
      case 'think': if (p > 0 && p < 1) s.think = 1; break;
      case 'music': break; // audio only
    }
  }

  function stateAt(tl, t) {
    const s = initialState(clone(tl.initial || {}));
    for (const act of tl.acts) {
      if (t < act.start) continue;
      const p = act.dur > 0 ? clamp((t - act.start) / act.dur, 0, 1) : 1;
      applyAct(s, act, p, t);
    }
    return s;
  }

  // ---------- world drawing ----------
  function drawSky(ctx, t, s) {
    const g = ctx.createLinearGradient(0, 0, 0, L.groundY);
    g.addColorStop(0, C.skyTop); g.addColorStop(1, C.skyBot);
    ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, L.groundY + 400);
    for (const st of STARS) {
      const a = 0.45 + 0.4 * Math.sin(t * 1.7 + st.ph);
      ctx.fillStyle = `rgba(255,250,225,${a})`;
      ell(ctx, st.x, st.y, st.s, st.s); ctx.fill();
    }
    // moon (always there, hidden by clouds until they part)
    const m = L.moon;
    const mg = ctx.createRadialGradient(m.x, m.y, m.r * 0.8, m.x, m.y, m.r * 2.4);
    mg.addColorStop(0, 'rgba(235,240,255,0.35)'); mg.addColorStop(1, 'rgba(235,240,255,0)');
    ctx.fillStyle = mg; ctx.fillRect(m.x - m.r * 3, m.y - m.r * 3, m.r * 6, m.r * 6);
    ctx.fillStyle = '#f5f1dc'; ell(ctx, m.x, m.y, m.r, m.r); ctx.fill();
    ctx.fillStyle = 'rgba(190,185,160,0.55)';
    [[-50, -30, 30], [40, 20, 22], [-10, 60, 18], [60, -60, 14], [-70, 50, 12]].forEach(([dx, dy, r]) => { ell(ctx, m.x + dx, m.y + dy, r, r); ctx.fill(); });
    // clouds
    const o = s.clouds;
    drawCloud(ctx, m.x - 40 - o * 520, m.y - 30, 1.25);
    drawCloud(ctx, m.x + 120 + o * 520, m.y + 60, 1.1);
    drawCloud(ctx, m.x - 130 - o * 400, m.y + 120, 0.9);
    drawCloud(ctx, 860 + o * 80, 230, 0.7);
  }
  function drawCloud(ctx, x, y, k) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#2b3a72';
    [[0, 0, 150, 70], [-110, 25, 95, 52], [110, 25, 105, 55], [-30, -45, 85, 60], [60, -35, 80, 55]].forEach(([cx, cy, rx, ry]) => { ell(ctx, cx, cy, rx, ry); ctx.fill(); });
    ctx.fillStyle = '#3a4c8c';
    [[-30, -55, 60, 26], [60, -45, 55, 22]].forEach(([cx, cy, rx, ry]) => { ell(ctx, cx, cy, rx, ry); ctx.fill(); });
    ctx.restore();
  }

  function drawHouse(ctx, s) {
    // wall + siding
    ctx.fillStyle = C.wall; ctx.fillRect(L.wallX, L.wallTop, W - L.wallX + 400, L.deckY - L.wallTop);
    ctx.strokeStyle = C.siding; ctx.lineWidth = 5;
    for (let y = L.wallTop + 50; y < L.deckY; y += 48) { ctx.beginPath(); ctx.moveTo(L.wallX, y); ctx.lineTo(W + 400, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(L.wallX, L.wallTop, 14, L.deckY - L.wallTop);
    // eave
    ctx.fillStyle = C.eave; ctx.beginPath();
    ctx.moveTo(L.wallX - 60, L.wallTop); ctx.lineTo(W + 400, L.wallTop); ctx.lineTo(W + 400, L.wallTop - 60); ctx.lineTo(L.wallX - 20, L.wallTop - 60); ctx.closePath(); ctx.fill();
    // door
    const d = L.door;
    ctx.fillStyle = C.trim; rrect(ctx, d.x - 18, d.y - 18, d.w + 36, d.h + 18, 6); ctx.fill();
    ctx.fillStyle = C.door; ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = C.doorDark; ctx.lineWidth = 8;
    rrect(ctx, d.x + 28, d.y + 30, d.w - 56, d.h * 0.38, 8); ctx.stroke();
    rrect(ctx, d.x + 28, d.y + d.h * 0.5, d.w - 56, d.h * 0.42, 8); ctx.stroke();
    ctx.fillStyle = '#e0b552'; ell(ctx, d.x + 30, d.y + d.h * 0.47, 11, 11); ctx.fill();
    // switch plate
    ctx.fillStyle = '#d9d2c1'; rrect(ctx, L.sw.x - 22, L.sw.y - 34, 44, 68, 7); ctx.fill();
    ctx.strokeStyle = '#8f887a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#f7f2e6'; rrect(ctx, L.sw.x - 8, s.light ? L.sw.y - 22 : L.sw.y + 2, 16, 20, 4); ctx.fill();
    ctx.strokeStyle = '#8f887a'; ctx.stroke();
    // tally marks
    drawTally(ctx, s.tally);
    // lamp fixture
    const b = L.bulb;
    ctx.fillStyle = '#151827'; rrect(ctx, b.x - 30, b.y - 105, 60, 80, 10); ctx.fill();
    ctx.fillStyle = '#2a2e44'; rrect(ctx, b.x - 22, b.y - 48, 44, 18, 4); ctx.fill();
    if (s.light) {
      const g = ctx.createRadialGradient(b.x - 10, b.y - 10, 4, b.x, b.y, b.r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#fff4b8'); g.addColorStop(1, '#ffd060');
      ctx.fillStyle = g;
    } else ctx.fillStyle = '#5d6070';
    ell(ctx, b.x, b.y, b.r, b.r * 1.05); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3; ctx.stroke();
  }
  function drawTally(ctx, n) {
    if (n <= 0) return;
    ctx.save(); ctx.strokeStyle = 'rgba(245,240,225,0.85)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    const shown = Math.min(n, 40), x0 = 500, y0 = 1080;
    for (let i = 0; i < shown; i++) {
      const g = Math.floor(i / 5), k = i % 5, gx = x0 + (g % 4) * 52, gy = y0 + Math.floor(g / 4) * 72;
      ctx.beginPath();
      if (k < 4) { ctx.moveTo(gx + k * 10, gy); ctx.lineTo(gx + k * 10 + 2, gy + 48); }
      else { ctx.moveTo(gx - 6, gy + 40); ctx.lineTo(gx + 40, gy + 8); }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(245,240,225,0.9)'; ctx.font = '800 46px "Inter Display"'; ctx.textAlign = 'left';
    ctx.fillText('#' + n, x0, y0 - 18);
    ctx.restore();
  }

  function drawDeck(ctx) {
    ctx.fillStyle = C.deck; ctx.fillRect(170, L.deckY, W + 400, 55);
    ctx.fillStyle = C.deckDark; ctx.fillRect(170, L.deckY + 55, W + 400, 20);
    ctx.strokeStyle = C.deckDark; ctx.lineWidth = 3;
    for (let x = 230; x < W + 400; x += 90) { ctx.beginPath(); ctx.moveTo(x, L.deckY + 4); ctx.lineTo(x, L.deckY + 52); ctx.stroke(); }
    // ground + step
    ctx.fillStyle = C.ground; ctx.fillRect(-400, L.groundY, W + 800, H - L.groundY + 400);
    ctx.fillStyle = C.ground; ctx.fillRect(-400, L.deckY + 40, 570, L.groundY);
    ctx.fillStyle = '#6b513d'; ctx.fillRect(60, L.stepY, 420, 40);
    ctx.fillStyle = C.deckDark; ctx.fillRect(60, L.stepY + 40, 420, 22);
    // bushes
    ctx.fillStyle = C.bush;
    [[30, 1470, 160, 90], [190, 1520, 130, 70], [900, 1500, 190, 100], [700, 1560, 150, 70], [-40, 1600, 200, 110]].forEach(([x, y, rx, ry]) => { ell(ctx, x, y, rx, ry); ctx.fill(); });
    ctx.fillStyle = '#0d2622';
    [[420, 1700, 300, 90], [980, 1760, 220, 110]].forEach(([x, y, rx, ry]) => { ell(ctx, x, y, rx, ry); ctx.fill(); });
  }

  // ---------- characters ----------
  function drawMo(ctx, mo, t, mouth, opts = {}) {
    if (mo.alpha <= 0.01) return;
    ctx.save();
    const bob = mo.pose === 'fly' ? Math.sin(t * 7) * 7 : 0;
    ctx.translate(mo.x, mo.y + bob);
    ctx.globalAlpha = mo.alpha;
    // motion trail
    if (mo.trail) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,240,200,0.35)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-90 * mo.face, -30 + i * 30); ctx.lineTo(-170 * mo.face, -30 + i * 30); ctx.stroke(); }
      ctx.restore();
    }
    ctx.rotate(mo.rot);
    const sq = mo.squash || 0;
    ctx.scale(mo.scale * (1 + sq * 0.35), mo.scale * (1 - sq * 0.3));
    if (opts.eyesOnly) { drawMoEyes(ctx, mo, t, true); ctx.restore(); return; }
    const flying = mo.pose === 'fly';
    const flap = flying ? Math.sin(t * 2 * Math.PI * 7) : 0.25;
    // wings
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side, 1);
      ctx.save(); ctx.translate(30, -10); ctx.rotate(-0.55 + flap * 0.45);
      ctx.scale(1, 0.7 + 0.3 * Math.abs(flap));
      ctx.fillStyle = C.moWing; ell(ctx, 62, -18, 72, 46, -0.25); ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = C.moWing2; ell(ctx, 78, -24, 24, 16, -0.25); ctx.fill();
      ctx.fillStyle = '#5d4a39'; ell(ctx, 78, -24, 9, 7); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.translate(26, 22); ctx.rotate(0.35 - flap * 0.3);
      ctx.fillStyle = C.moWing; ell(ctx, 42, 10, 46, 30, 0.35); ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.stroke();
      ctx.restore();
      ctx.restore();
    }
    // antennae
    ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      const wob = Math.sin(t * 3 + side) * 4;
      ctx.beginPath(); ctx.moveTo(side * 14, -50); ctx.quadraticCurveTo(side * 22, -95, side * 52 + wob, -112); ctx.stroke();
      for (let i = 1; i <= 4; i++) {
        const u = i / 5, ax = lerp(side * 14, side * 52 + wob, u), ay = lerp(-50, -112, u) - Math.sin(u * Math.PI) * 14;
        ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + side * 12, ay + 6); ctx.stroke();
      }
      ctx.lineWidth = 5;
    }
    // arms (hug pose wraps around the bulb below)
    if (mo.pose === 'hug') {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 7;
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 38, 20); ctx.quadraticCurveTo(side * 70, 55, side * 40, 85); ctx.stroke(); }
    }
    // fuzzy body
    ctx.fillStyle = C.moBody; ctx.strokeStyle = C.ink; ctx.lineWidth = 6;
    ctx.beginPath();
    const N = 22;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2, a2 = ((i + 0.5) / N) * Math.PI * 2;
      const x = Math.cos(a) * 50, y = Math.sin(a) * 58;
      const cx = Math.cos(a2) * 60, cy = Math.sin(a2) * 69;
      if (i === 0) ctx.moveTo(x, y); else ctx.quadraticCurveTo(cpx, cpy, x, y);
      var cpx = cx, cpy = cy; // eslint-disable-line no-var
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.moBelly; ell(ctx, 0, 30, 34, 18); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ell(ctx, -18, -30, 16, 10, -0.5); ctx.fill();
    // legs when sitting / upside down
    if (mo.pose === 'sit' || mo.pose === 'upside') {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 6;
      for (const sx of [-22, 0, 22]) { ctx.beginPath(); ctx.moveTo(sx, 52); ctx.lineTo(sx * 1.3, 76); ctx.stroke(); }
    }
    drawMoEyes(ctx, mo, t, false);
    // mouth
    ctx.save(); ctx.translate(0, 14);
    if (mouth > 0.08) {
      ctx.fillStyle = '#3b1a1a'; ell(ctx, 0, 4, 11 + mouth * 5, 4 + mouth * 13); ctx.fill();
      ctx.fillStyle = '#e07a7a'; ell(ctx, 0, 7 + mouth * 7, 7, 3 + mouth * 3); ctx.fill();
    } else if (mo.expr === 'dazed' || mo.expr === 'worry') {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-10, 6); ctx.quadraticCurveTo(0, 0, 10, 6); ctx.stroke();
    } else if (mo.expr === 'wonder') {
      ctx.fillStyle = '#3b1a1a'; ell(ctx, 0, 4, 6, 7); ctx.fill();
    } else {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -2, 11, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    }
    ctx.restore();
    // dizzy stars
    if (mo.expr === 'dazed') {
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + i * 2.1;
        drawStar(ctx, Math.cos(a) * 60, -78 + Math.sin(a) * 16, 12, '#ffe39a');
      }
    }
    ctx.restore();
  }
  function drawMoEyes(ctx, mo, t, glow) {
    const blink = ((t + 1.3) % 3.7) < 0.12;
    let lx = 0, ly = 0;
    if (mo.look) { lx = mo.look[0]; ly = mo.look[1]; }
    else { lx = mo.face * 0.6; ly = 0; }
    const big = mo.expr === 'wonder' ? 1.25 : 1;
    for (const side of [-1, 1]) {
      const ex = side * 19, ey = -16;
      if (glow) { ctx.fillStyle = 'rgba(255,255,255,0.95)'; }
      else ctx.fillStyle = '#ffffff';
      ell(ctx, ex, ey, 17, blink ? 2 : 21); ctx.fill();
      if (!glow) { ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.stroke(); }
      if (blink) continue;
      if (mo.expr === 'dazed') {
        ctx.strokeStyle = '#1a1010'; ctx.lineWidth = 3; ctx.beginPath();
        for (let a = 0; a < 12; a += 0.3) { const r = a * 1.2; const x = ex + Math.cos(a + t * 6) * r, y = ey + Math.sin(a + t * 6) * r; a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke(); continue;
      }
      ctx.fillStyle = '#140c0c'; ell(ctx, ex + lx * 6, ey + ly * 7 + 2, 9 * big, 10 * big); ctx.fill();
      ctx.fillStyle = '#ffffff'; ell(ctx, ex + lx * 6 - 3, ey + ly * 7 - 3, 3.2, 3.2); ctx.fill();
    }
  }
  function drawStar(ctx, x, y, r, col) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function pebbleLook(s) {
    const pb = L.pebble, l = s.pebble.look;
    if (l === 'cam') return [0, 0.15];
    if (l === 'up') return [0.5, -1];
    if (l === 'left') return [-1, 0];
    if (l === 'mo') { const dx = s.mo.x - pb.x, dy = s.mo.y - pb.y, d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; }
    return [0, 0];
  }
  function drawPebble(ctx, s, t, mouth, opts = {}) {
    const pb = L.pebble;
    ctx.save(); ctx.translate(pb.x, pb.y);
    if (opts.scale) ctx.scale(opts.scale, opts.scale);
    const [lx, ly] = opts.look || pebbleLook(s);
    if (opts.eyesOnly) { drawPebbleEyes(ctx, lx, ly, t, true, s); ctx.restore(); return; }
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, 0, 54, 100, 14); ctx.fill();
    const g = ctx.createLinearGradient(0, -60, 0, 60); g.addColorStop(0, C.peb); g.addColorStop(1, C.pebDark);
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(-98, 20); ctx.bezierCurveTo(-104, -40, -40, -62, 8, -60); ctx.bezierCurveTo(70, -58, 104, -28, 100, 18);
    ctx.bezierCurveTo(98, 50, 50, 58, 0, 58); ctx.bezierCurveTo(-60, 58, -96, 50, -98, 20); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = C.pebInk; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ell(ctx, -45, -32, 30, 12, -0.3); ctx.fill();
    ctx.fillStyle = 'rgba(40,44,52,0.35)';
    [[50, 25, 4], [64, 8, 3], [-60, 30, 3.5], [20, 38, 2.5], [-20, -45, 2.5]].forEach(([x, y, r]) => { ell(ctx, x, y, r, r); ctx.fill(); });
    drawPebbleEyes(ctx, lx, ly, t, false, s);
    // mouth
    ctx.save(); ctx.translate(0, 26);
    if (mouth > 0.08) { ctx.fillStyle = '#2a1d1d'; ell(ctx, 0, 0, 13 + mouth * 4, 3 + mouth * 10); ctx.fill(); }
    else { ctx.strokeStyle = C.pebInk; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  }
  function drawPebbleEyes(ctx, lx, ly, t, glow, s) {
    const blink = ((t + 0.4) % 4.3) < 0.13;
    for (const side of [-1, 1]) {
      const ex = side * 30, ey = -12;
      ctx.fillStyle = glow ? 'rgba(255,255,255,0.95)' : '#f4f6f8';
      ell(ctx, ex, ey, 15, blink ? 2 : 17); ctx.fill();
      if (!glow) { ctx.strokeStyle = C.pebInk; ctx.lineWidth = 4; ctx.stroke(); }
      if (blink) continue;
      ctx.fillStyle = '#101216'; ell(ctx, ex + lx * 5, ey + ly * 5 + 1, 7.5, 8.5); ctx.fill();
      ctx.fillStyle = '#ffffff'; ell(ctx, ex + lx * 5 - 2.5, ey + ly * 5 - 2.5, 2.4, 2.4); ctx.fill();
      // heavy deadpan lids
      if (!glow && (s ? s.pebble.expr === 'flat' : true)) {
        ctx.save(); ell(ctx, ex, ey, 17, 19); ctx.clip(); ctx.fillStyle = C.peb; ctx.fillRect(ex - 18, ey - 21, 36, 15); ctx.restore();
        ctx.strokeStyle = C.pebInk; ctx.lineWidth = 4; ell(ctx, ex, ey, 15, 17); ctx.stroke();
        ctx.strokeStyle = C.pebInk; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ex - 15, ey - 6); ctx.lineTo(ex + 15, ey - 6); ctx.stroke();
      }
    }
  }

  // ---------- text ----------
  function wrap(ctx, text, maxW) {
    const words = text.split(' '), lines = []; let cur = '';
    for (const w of words) { const tr = cur ? cur + ' ' + w : w; if (ctx.measureText(tr).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tr; }
    if (cur) lines.push(cur); return lines;
  }
  function outlinedText(ctx, lines, x, y, size, fill, lh = 1.12) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const top = y - ((lines.length - 1) * size * lh) / 2;
    lines.forEach((ln, i) => {
      const yy = top + i * size * lh;
      ctx.lineWidth = size * 0.22; ctx.strokeStyle = '#0a0a12'; ctx.strokeText(ln, x, yy);
      ctx.fillStyle = fill; ctx.fillText(ln, x, yy);
    });
  }
  function drawCaption(ctx, line, t, y) {
    const age = t - line.start;
    const pop = clamp(age / 0.12, 0, 1), k = 0.85 + 0.15 * EASE.back(pop);
    ctx.save(); ctx.translate(W / 2 - 40, y || 1130); ctx.scale(k, k);
    const italic = line.who === 'NARRATOR' ? 'italic ' : '';
    const size = line.text.length > 70 ? 54 : 62;
    ctx.font = `${italic}900 ${size}px "Inter"`;
    const ls = wrap(ctx, line.cap || line.text, 860);
    const bw = Math.max(...ls.map(l => ctx.measureText(l).width)) + 70, bh = ls.length * size * 1.12 + 44;
    ctx.fillStyle = 'rgba(8,10,24,0.62)'; rrect(ctx, -bw / 2, -bh / 2, bw, bh, 28); ctx.fill();
    outlinedText(ctx, ls, 0, 0, size, C.caption[line.who] || '#fff');
    ctx.restore();
  }
  function drawHook(ctx, hook, t) {
    if (!hook || t > hook.dur) return;
    const p = clamp(t / 0.25, 0, 1), out = clamp((hook.dur - t) / 0.2, 0, 1);
    ctx.save(); ctx.globalAlpha = out; ctx.translate(W / 2 - 30, 300); ctx.rotate(-0.04); ctx.scale(0.6 + 0.4 * EASE.back(p), 0.6 + 0.4 * EASE.back(p));
    ctx.font = '900 96px "Inter"';
    outlinedText(ctx, wrap(ctx, hook.text, 880), 0, 0, 96, '#ffd84d', 1.05);
    ctx.restore();
  }

  // ---------- frame ----------
  function draw(ctx, tl, t) {
    const s = stateAt(tl, t);
    const lines = tl.lines || [];
    const speaking = who => { const l = lines.find(l => l.who === who && t >= l.start && t < l.end); if (!l) return 0; const i = Math.floor((t - l.start) * tl.fps); return l.env[i] || 0; };
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    const z = s.cam.zoom, hw = W / 2 / z, hh = H / 2 / z;
    let cx = clamp(s.cam.x, hw, W - hw), cy = clamp(s.cam.y, hh, H - hh);
    if (s.shake) { cx += Math.sin(t * 90) * s.shake; cy += Math.cos(t * 77) * s.shake; }
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy);
    drawSky(ctx, t, s); drawHouse(ctx, s); drawDeck(ctx);
    drawPebble(ctx, s, t, speaking('PEBBLE'));
    drawMo(ctx, s.mo, t, speaking('MO') || speaking('MO_WHISPER'));
    // lighting
    const lightOn = s.light;
    const moonlit = s.clouds > 0.5;
    let dark = lightOn ? 0 : (moonlit ? 0.45 : 0.9);
    dark = Math.max(dark, s.dark);
    if (dark > 0) {
      ctx.fillStyle = `rgba(2,4,14,${dark})`; ctx.fillRect(-400, -400, W + 800, H + 800);
      if (moonlit && !lightOn) {
        // the moon keeps shining through the dark
        const m = L.moon; ctx.fillStyle = '#f5f1dc'; ell(ctx, m.x, m.y, m.r, m.r); ctx.fill();
        const mg = ctx.createRadialGradient(m.x, m.y, m.r, m.x, m.y, m.r * 2.2);
        mg.addColorStop(0, 'rgba(230,236,255,0.3)'); mg.addColorStop(1, 'rgba(230,236,255,0)'); ctx.fillStyle = mg;
        ctx.fillRect(m.x - m.r * 3, m.y - m.r * 3, m.r * 6, m.r * 6);
        // Mo in silhouette against the moon
        if (Math.hypot(s.mo.x - m.x, s.mo.y - m.y) < m.r + 60) {
          ctx.save(); ctx.filter = 'brightness(0)'; drawMo(ctx, s.mo, t, 0); ctx.restore();
        }
      }
      if (dark > 0.6) { drawMo(ctx, s.mo, t, 0, { eyesOnly: true }); drawPebble(ctx, s, t, 0, { eyesOnly: true }); }
    }
    if (lightOn) {
      const b = L.bulb; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, 560);
      const fl = 0.95 + 0.05 * Math.sin(t * 40);
      g.addColorStop(0, `rgba(255,214,120,${0.42 * fl})`); g.addColorStop(0.35, 'rgba(255,190,90,0.12)'); g.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = g; ctx.fillRect(b.x - 600, b.y - 600, 1200, 1200); ctx.restore();
    }
    // thought bubble (Mo thinking hard)
    if (s.think) {
      ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.92)';
      const mx = s.mo.x + 70, my = s.mo.y - 120;
      [[0, 0, 10], [26, -28, 16], [62, -70, 46]].forEach(([dx, dy, r]) => { ell(ctx, mx + dx, my + dy, r, r); ctx.fill(); });
      ctx.fillStyle = '#24170f'; ctx.font = '900 44px "Inter"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', mx + 62, my - 70);
      ctx.restore();
    }
    ctx.restore();
    // screen-space overlays
    if (s.overlay) {
      ctx.save(); ctx.font = '900 110px "Inter"';
      const p = s.overlay.p, k = 0.7 + 0.3 * EASE.back(clamp(p * 5, 0, 1));
      ctx.translate(W / 2 - 30, 560); ctx.scale(k, k); ctx.rotate(-0.05);
      outlinedText(ctx, [s.overlay.text], 0, 0, 110, s.overlay.color || '#ffffff');
      ctx.restore();
    }
    drawHook(ctx, tl.hook, t);
    const cap = lines.filter(l => t >= l.start && t < l.end + 0.25 && !l.nocap).pop();
    if (cap) {
      // keep the caption off the speaker's face: if they sit near caption height, lift it above them
      let y = 1130;
      const who = cap.who.startsWith('MO') ? 'MO' : cap.who;
      const wp = who === 'MO' ? [s.mo.x, s.mo.y] : who === 'PEBBLE' ? [L.pebble.x, L.pebble.y] : null;
      if (wp) {
        const sy = (wp[1] - cy) * z + H / 2;
        if (Math.abs(sy - 1130) < 260 * Math.max(1, z * 0.8)) y = Math.max(560, sy - 230 * z);
      }
      drawCaption(ctx, cap, t, y);
    }
    // tiny brand bug, top-left inside the safe zone
    ctx.save(); ctx.globalAlpha = 0.75; ctx.font = '800 34px "Inter"'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.lineWidth = 7; ctx.strokeStyle = '#0a0a12'; ctx.strokeText('MO & PEBBLE', 48, 120); ctx.fillStyle = '#ffffff'; ctx.fillText('MO & PEBBLE', 48, 120);
    ctx.restore();
  }

  window.Scene = { W, H, L, C, draw, stateAt, drawMo, drawPebble, drawSky, drawHouse, drawDeck, drawCloud, drawStar, initialState, outlinedText, wrap, ell };
})();
