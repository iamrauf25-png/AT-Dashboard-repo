// Render a timeline to MP4 (or stills) with headless Chromium + ffmpeg.
//   node render.cjs <scene.js> build/<id>/timeline.json out.mp4
//   node render.cjs <scene.js> build/<id>/timeline.json --stills 0,3.5,10 outdir/
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function page(scenePath) {
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const sceneJs = fs.readFileSync(scenePath, 'utf8');
  await pg.setContent(`<!doctype html><html><body style="margin:0;background:#000">
    <canvas id="c" width="1080" height="1920"></canvas>
    <div style="font-family:Inter;font-weight:900;position:absolute;opacity:0">a<i>a</i></div>
    <div style="font-family:'Inter Display';font-weight:800;position:absolute;opacity:0">a</div>
    <div style="font-family:'Baloo 2';font-weight:800;position:absolute;opacity:0">aभू</div>
    <script>${sceneJs}</script></body></html>`);
  await pg.evaluate(() => document.fonts.ready);
  return { browser, pg };
}

async function main() {
  const [scenePath, tlPath, ...rest] = process.argv.slice(2);
  const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
  const { browser, pg } = await page(scenePath);
  await pg.evaluate(tl => { window.TL = tl; window.CTX = document.getElementById('c').getContext('2d'); }, tl);
  const grab = async (t, fmt) => pg.evaluate(([t, fmt]) => { Scene.draw(CTX, TL, t); return CTX.canvas.toDataURL(fmt, 0.92); }, [t, fmt]);

  if (rest[0] === '--stills') {
    const times = rest[1].split(',').map(Number), out = rest[2];
    fs.mkdirSync(out, { recursive: true });
    for (const t of times) {
      const d = await grab(t, 'image/png');
      fs.writeFileSync(path.join(out, `t${t.toFixed(2)}.png`), Buffer.from(d.split(',')[1], 'base64'));
    }
    await browser.close(); return;
  }

  const out = rest[0];
  const audio = path.join(path.dirname(tlPath), 'audio.wav');
  const fps = tl.fps, n = Math.ceil(tl.duration * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', audio, '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', String(fps),
    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-movflags', '+faststart', '-shortest', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const d = await grab(i / fps, 'image/jpeg');
    const buf = Buffer.from(d.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) process.stdout.write(`  frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
  await browser.close();
  console.log(`  wrote ${out} (${n} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
main().catch(e => { console.error(e); process.exit(1); });
