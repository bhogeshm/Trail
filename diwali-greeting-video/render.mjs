// Renders the story frame-by-frame in headless Chrome (Puppeteer) and encodes it with
// FFmpeg, then synthesizes the soundtrack (audio/score.mjs) and muxes it in.
//
//   node render.mjs                     -> out/<slug>.mp4 (with sound) + out/<slug>_silent.mp4
//   node render.mjs --stills 0.5,3,7.4  -> out/stills/t_<sec>.png only (fast look at key moments)
//   node render.mjs --samples 6         -> also save every 6th frame to out/samples/
//   node render.mjs --audio-only        -> redo the soundtrack and remux, keep the picture
//
// Size, fps, duration and slug come from G.config() in story/story.js.
import puppeteer from 'puppeteer';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'out');
const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const stills = opt('--stills', null);
const sampleEvery = parseInt(opt('--samples', '0'), 10);
const audioOnly = argv.includes('--audio-only');
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
function addSound(cfg) {
  const silent = path.join(OUT, `${cfg.slug}_silent.mp4`), out = path.join(OUT, `${cfg.slug}.mp4`);
  const score = path.join(ROOT, 'audio', 'score.mjs');
  if (!fs.existsSync(score)) { fs.copyFileSync(silent, out); console.log('no audio/score.mjs — wrote silent', path.relative(ROOT, out)); return; }
  execFileSync('node', [score], { stdio: 'inherit' });
  const wav = path.join(OUT, 'audio.wav');
  // two-pass loudnorm in linear mode: one gain for the whole clip, so hits keep their punch
  const target = 'I=-16:TP=-1.5:LRA=11';
  const probe = spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = JSON.parse(probe.stderr.slice(probe.stderr.lastIndexOf('{'), probe.stderr.lastIndexOf('}') + 1));
  const af = `loudnorm=${target}:linear=true:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}`;
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', silent, '-i', wav,
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
    '-af', af, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
    '-t', String(cfg.DURATION), '-movflags', '+faststart', out,
  ], { stdio: 'inherit' });
  console.log('wrote', path.relative(ROOT, out));
}

if (audioOnly) {
  const cfg = JSON.parse(fs.readFileSync(path.join(OUT, 'cues.json'), 'utf8'));
  addSound(cfg);
  process.exit(0);
}

// ---------------------------------------------------------------------------
const browser = await puppeteer.launch({
  headless: true,
  // Metal ANGLE is fast on macOS; elsewhere Chrome picks a working GL backend
  args: process.platform === 'darwin' ? ['--use-angle=metal', '--ignore-gpu-blocklist'] : ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-setuid-sandbox'],
  defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('pageerror:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto('file://' + path.join(ROOT, 'index.html') + '?render');
await page.waitForFunction('window.__ready === true || window.__error', { timeout: 180000 });
const err = await page.evaluate(() => window.__error);
if (err) { console.error(err); await browser.close(); process.exit(1); }

const cfg = await page.evaluate(() => ({ W: G.W, H: G.H, FPS: G.FPS, DURATION: G.DURATION, TOTAL: G.TOTAL, slug: G.slug }));
fs.writeFileSync(path.join(OUT, 'cues.json'), JSON.stringify({ ...cfg, ...(await page.evaluate(() => G.cues || {})) }, null, 1));

const grab = async (i) => {
  const url = await page.evaluate((k) => window.scene.renderFrame(k), i);
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
};

if (stills) {
  const dir = path.join(OUT, 'stills');
  fs.mkdirSync(dir, { recursive: true });
  for (const s of stills.split(',').map(Number)) {
    const f = path.join(dir, `t_${s.toFixed(2)}.png`);
    fs.writeFileSync(f, await grab(Math.min(cfg.TOTAL - 1, Math.round(s * cfg.FPS))));
    console.log('wrote', path.relative(ROOT, f));
  }
  await browser.close();
  process.exit(0);
}

const silent = path.join(OUT, `${cfg.slug}_silent.mp4`);
const sampleDir = path.join(OUT, 'samples');
if (sampleEvery) { fs.rmSync(sampleDir, { recursive: true, force: true }); fs.mkdirSync(sampleDir, { recursive: true }); }

const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(cfg.FPS), '-c:v', 'png', '-i', '-',
  '-frames:v', String(cfg.TOTAL),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'animation',
  '-pix_fmt', 'yuv420p', '-r', String(cfg.FPS), '-movflags', '+faststart',
  silent,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));

const t0 = Date.now();
for (let i = 0; i < cfg.TOTAL; i++) {
  const png = await grab(i);
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  if (sampleEvery && i % sampleEvery === 0) fs.writeFileSync(path.join(sampleDir, `f_${String(i).padStart(4, '0')}.png`), png);
  if (i % cfg.FPS === 0) process.stdout.write(`\rframe ${i}/${cfg.TOTAL}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
ff.stdin.end();
await done;
await browser.close();
console.log(`\nwrote ${path.relative(ROOT, silent)} (${cfg.TOTAL} frames, ${cfg.W}x${cfg.H} @ ${cfg.FPS} fps) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
addSound(cfg);
