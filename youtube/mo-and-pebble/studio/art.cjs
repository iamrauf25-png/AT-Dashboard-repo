// Channel art: profile picture (800x800) and banner (2560x1440).
//   node art.cjs <outdir>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ART = `
function sky(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0a1230'); g.addColorStop(1, '#22336e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  let s = 5; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < w * h / 9000; i++) { ctx.fillStyle = 'rgba(255,250,225,' + (0.3 + r() * 0.6) + ')'; Scene.ell(ctx, r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); ctx.fill(); }
}
function glow(ctx, x, y, r, a) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 5, x, y, r); g.addColorStop(0, 'rgba(255,214,120,' + a + ')'); g.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
}
function bulb(ctx, x, y, k) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = '#151827'; ctx.beginPath(); ctx.roundRect(-30, -105, 60, 80, 10); ctx.fill();
  const g = ctx.createRadialGradient(-10, -10, 4, 0, 0, 40); g.addColorStop(0, '#fff'); g.addColorStop(.5, '#fff4b8'); g.addColorStop(1, '#ffd060');
  ctx.fillStyle = g; Scene.ell(ctx, 0, 0, 40, 42); ctx.fill(); ctx.restore();
}
function pebbleAt(ctx, x, y, k, look) {
  const L = Scene.L, s = Scene.initialState({});
  ctx.save(); ctx.translate(x - L.pebble.x, y - L.pebble.y); Scene.drawPebble(ctx, s, 0.9, 0, { scale: k, look }); ctx.restore();
}
function moAt(ctx, x, y, k, extra) {
  Scene.drawMo(ctx, Object.assign({ x, y, scale: k, rot: 0, pose: 'fly', face: 1, look: null, expr: 'happy', squash: 0, alpha: 1, trail: 0 }, extra || {}), 0.11, 0);
}
function profile(ctx) {
  const W = 800; sky(ctx, W, W);
  glow(ctx, 400, 300, 520, 0.28);
  pebbleAt(ctx, 400, 585, 2.3, [0, 0.15]);
  moAt(ctx, 410, 345, 1.2, { look: [-0.3, 0.5], expr: 'happy' });
}
function banner(ctx) {
  const W = 2560, H = 1440; sky(ctx, W, H);
  // moon, far right
  ctx.fillStyle = '#f5f1dc'; Scene.ell(ctx, 2150, 420, 150, 150); ctx.fill();
  Scene.drawCloud(ctx, 2320, 520, 1.2); Scene.drawCloud(ctx, 300, 300, 1.1);
  // ground strip
  ctx.fillStyle = '#0f2a26'; ctx.fillRect(0, 1000, W, 440);
  // safe area (all devices): 1546x423 centred -> x 507..2053, y 508..931
  bulb(ctx, 760, 640, 1.3); glow(ctx, 760, 640, 600, 0.38);
  pebbleAt(ctx, 900, 880, 1.25, [0.4, -0.6]);
  moAt(ctx, 930, 600, 1.15, { look: [-1, 0], expr: 'wonder', rot: -0.15 });
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const text = (t, x, y, size, col, weight) => { ctx.font = weight + ' ' + size + 'px Inter'; ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#0a0a12'; ctx.strokeText(t, x, y); ctx.fillStyle = col; ctx.fillText(t, x, y); };
  text('MO & PEBBLE', 1130, 620, 150, '#ffd84d', 900);
  text("A moth who's always wrong.", 1140, 750, 58, '#ffe39a', 800);
  text("A rock who's always right.", 1140, 828, 58, '#cfe0ff', 800);
}
`;

async function main() {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const pg = await browser.newPage();
  const sceneJs = fs.readFileSync(path.join(__dirname, 'scene.js'), 'utf8');
  await pg.setContent(`<!doctype html><body><div style="font-family:Inter;font-weight:900">a</div><div style="font-family:Inter;font-weight:800">a</div><script>${sceneJs}\n${ART}</script></body>`);
  await pg.evaluate(() => document.fonts.ready);
  for (const [name, w, h] of [['profile', 800, 800], ['banner', 2560, 1440]]) {
    const d = await pg.evaluate(([name, w, h]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); window[name](x); return c.toDataURL('image/png'); }, [name, w, h]);
    fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(d.split(',')[1], 'base64'));
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
