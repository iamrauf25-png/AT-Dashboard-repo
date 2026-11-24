// Channel art for दादी vs भूत: profile picture (800x800) and banner (2560x1440).
//   node art.cjs <outdir>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ART = `
function bg(ctx, w, h, moon) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#070a17'); g.addColorStop(1, '#1b2a36'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  let s = 3; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < w * h / 9000; i++) { ctx.fillStyle = 'rgba(230,255,240,' + (0.2 + r() * 0.5) + ')'; Scene.ell(ctx, r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); ctx.fill(); }
  const [mx, my, mr] = moon; const mg = ctx.createRadialGradient(mx, my, mr * 0.9, mx, my, mr * 2.6); mg.addColorStop(0, 'rgba(200,255,220,0.3)'); mg.addColorStop(1, 'rgba(200,255,220,0)');
  ctx.fillStyle = mg; ctx.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6); ctx.fillStyle = '#e9efd9'; Scene.ell(ctx, mx, my, mr, mr); ctx.fill();
}
const dadi = (x, y, k, extra) => { const c = document.createElement('canvas'); return Object.assign({ x, y, pose: 'sit', expr: 'smug', prop: 'chai', look: [-1, -0.3], facepack: false, glint: 0.4 }, extra || {}); };
const ghost = (x, y, k, extra) => Object.assign({ x, y, scale: k, alpha: 1, pose: 'scare', expr: 'evil', look: [0.6, 0.3], tremble: 0, feet: false, eyesOnly: false }, extra || {});
function profile(ctx) {
  bg(ctx, 800, 800, [620, 170, 90]);
  Scene.drawGhost(ctx, ghost(250, 330, 1.25, { look: [0.8, 0.5] }), 0.4, 0);
  ctx.save(); ctx.translate(470, 560); ctx.scale(1.9, 1.9); ctx.translate(-470, -560);
  Scene.drawDadi(ctx, { x: 470, y: 640, pose: 'sit', expr: 'smug', prop: 'chai', look: [-1, -0.4], facepack: false, glint: 0.5 }, 0.3, 0);
  ctx.restore();
}
function banner(ctx) {
  const W = 2560, H = 1440; bg(ctx, W, H, [2200, 360, 150]);
  ctx.fillStyle = '#231e19'; ctx.fillRect(0, 1060, W, 380);
  Scene.drawGhost(ctx, ghost(720, 650, 1.2), 0.4, 0);
  Scene.drawDadi(ctx, { x: 1000, y: 800, pose: 'sit', expr: 'smug', prop: 'chai', look: [-1, -0.4], facepack: false, glint: 0.5 }, 0.3, 0);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const text = (t, x, y, size, col) => { ctx.font = '800 ' + size + 'px "Baloo 2"'; ctx.lineWidth = size * 0.18; ctx.strokeStyle = '#05050a'; ctx.strokeText(t, x, y); ctx.fillStyle = col; ctx.fillText(t, x, y); };
  text('दादी vs भूत', 1220, 620, 170, '#ff5a4f');
  text('हर रात भूत डराने आता है…', 1230, 770, 64, '#a8f0ff');
  text('दादी डरती नहीं।', 1230, 860, 64, '#ffd27a');
}
function thumb(ctx, big, small, ghostExtra, dadiExtra) {
  const W = 1280, H = 720; bg(ctx, W, H, [1120, 120, 90]);
  ctx.fillStyle = '#231e19'; ctx.fillRect(0, 610, W, 110);
  ctx.save(); ctx.translate(330, 420); ctx.scale(1.55, 1.55); Scene.drawGhost(ctx, ghost(0, 0, 1, ghostExtra), 0.4, 0); ctx.restore();
  ctx.save(); ctx.translate(1000, 470); ctx.scale(1.35, 1.35); ctx.translate(-1000, -470);
  Scene.drawDadi(ctx, Object.assign({ x: 1000, y: 470, pose: 'sit', expr: 'smug', prop: 'chai', look: [-1, -0.4], facepack: false, glint: 0.5 }, dadiExtra || {}), 0.3, 0); ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const text = (t, x, y, size, col, rot) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.font = '800 ' + size + 'px "Baloo 2"'; ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#05050a'; ctx.strokeText(t, 0, 0); ctx.fillStyle = col; ctx.fillText(t, 0, 0); ctx.restore(); };
  text(big, 690, 150, 128, '#ff3b30', -0.04);
  text(small, 690, 640, 54, '#ffd27a');
}
function thumb_e01(ctx) { thumb(ctx, 'लाइसेंस रद्द?!', 'दादी vs भूत · एपिसोड 1'); }
function thumb_e02(ctx) {
  const W = 1280, H = 720; bg(ctx, W, H, [1120, 120, 90]);
  ctx.fillStyle = '#231e19'; ctx.fillRect(0, 610, W, 110);
  ctx.save(); ctx.translate(250, 430); ctx.scale(1.4, 1.4); Scene.drawGhost(ctx, ghost(0, 0, 1, { kind: 'chudail', wig: true, pose: 'scare', expr: 'evil', look: [1, 0.2] }), 0.4, 0); ctx.restore();
  ctx.save(); ctx.translate(560, 450); ctx.scale(1.3, 1.3); Scene.drawGhost(ctx, ghost(0, 0, 1, { pose: 'scared', expr: 'scared', look: [-1, 0] }), 0.4, 0); ctx.restore();
  ctx.save(); ctx.translate(1010, 470); ctx.scale(1.3, 1.3); ctx.translate(-1010, -470);
  Scene.drawDadi(ctx, { x: 1010, y: 470, pose: 'sit', expr: 'smug', prop: 'chai', look: [-1, -0.4], facepack: false, glint: 0.5 }, 0.3, 0); ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const text = (t, x, y, size, col, rot) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.font = '800 ' + size + 'px "Baloo 2"'; ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#05050a'; ctx.strokeText(t, 0, 0); ctx.fillStyle = col; ctx.fillText(t, 0, 0); ctx.restore(); };
  text('भूत का रिश्ता… चुड़ैल से?!', 640, 110, 100, '#ff3b30', -0.03);
  text('दादी vs भूत · एपिसोड 2', 640, 650, 50, '#ffd27a');
}
function thumb_e03(ctx) {
  const W = 1280, H = 720; bg(ctx, W, H, [1120, 120, 90]);
  ctx.fillStyle = '#231e19'; ctx.fillRect(0, 610, W, 110);
  ctx.save(); ctx.translate(230, 440); ctx.scale(1.35, 1.35); Scene.drawGhost(ctx, ghost(0, 0, 1, { kind: 'chudail', wig: true, pose: 'float', expr: 'neutral', look: [1, 0.1], garland: true }), 0.4, 0); ctx.restore();
  ctx.save(); ctx.translate(500, 430); ctx.scale(1.35, 1.35); Scene.drawGhost(ctx, ghost(0, 0, 1, { pose: 'scare', expr: 'neutral', look: [-0.6, 0.1], garland: true }), 0.4, 0); ctx.restore();
  ctx.save(); ctx.translate(1010, 470); ctx.scale(1.3, 1.3); ctx.translate(-1010, -470);
  Scene.drawDadi(ctx, { x: 1010, y: 470, pose: 'sit', expr: 'smug', prop: 'chai', look: [-1, -0.4], facepack: false, glint: 0.5 }, 0.3, 0); ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const text = (t, x, y, size, col, rot) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.font = '800 ' + size + 'px "Baloo 2"'; ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#05050a'; ctx.strokeText(t, 0, 0); ctx.fillStyle = col; ctx.fillText(t, 0, 0); ctx.restore(); };
  text('भूत की शादी! 💍', 640, 105, 112, '#ff3b30', -0.03);
  text('दादी vs भूत · एपिसोड 3', 640, 650, 50, '#ffd27a');
}
function thumb_comp(ctx) { thumb(ctx, 'भूत vs दादी', 'सारे किस्से · Episode 1 + 5 Shorts', { pose: 'scared', expr: 'scared' }, { facepack: true, glint: 1, expr: 'flat' }); }
`;
async function main() {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch(); const pg = await browser.newPage();
  const sceneJs = fs.readFileSync(path.join(__dirname, 'scene.js'), 'utf8');
  await pg.setContent(`<!doctype html><body><div style="font-family:'Baloo 2';font-weight:800">aभू</div><script>${sceneJs}\n${ART}</script></body>`);
  await pg.evaluate(() => document.fonts.ready);
  for (const [name, w, h] of [['profile', 800, 800], ['banner', 2560, 1440], ['thumb_e01', 1280, 720], ['thumb_e02', 1280, 720], ['thumb_e03', 1280, 720], ['thumb_comp', 1280, 720]]) {
    const d = await pg.evaluate(([name, w, h]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; window[name](c.getContext('2d')); return c.toDataURL('image/png'); }, [name, w, h]);
    fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(d.split(',')[1], 'base64'));
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
