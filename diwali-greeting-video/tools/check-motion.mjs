// Lists frames where the tracked pose jumps more than a limit between two frames.
// Big jumps are fine on purpose (impacts, snaps); anything else is a "pop" to smooth.
// Uses STORY.track(t) -> { name: number }. Limits: STORY.trackLimits or defaults.
//   node tools/check-motion.mjs
import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const b = await puppeteer.launch({ headless: true, args: process.platform === 'darwin' ? ['--use-angle=metal'] : ['--no-sandbox', '--disable-setuid-sandbox'] });
const pg = await b.newPage();
pg.on('pageerror', (e) => console.error('pageerror', e.message));
await pg.goto('file://' + path.join(ROOT, 'index.html') + '?render');
await pg.waitForFunction('window.__ready === true');
const rows = await pg.evaluate(() => {
  if (!STORY.track) return null;
  const out = [];
  for (let i = 0; i < G.TOTAL; i++) out.push(STORY.track(i / G.FPS));
  return { rows: out, limits: STORY.trackLimits || {}, fps: G.FPS };
});
await b.close();
if (!rows) { console.log('STORY.track is not defined — nothing to check'); process.exit(0); }
// defaults: positions 60 px/frame, squash/scale 0.25/frame, angles and anything else 0.7/frame
const def = (k) => (/^(x|y)$/i.test(k) ? 60 : /^(s[xy]?|scale.*)$/i.test(k) ? 0.25 : 0.7);
let n = 0;
for (let i = 1; i < rows.rows.length; i++) {
  const d = [];
  for (const k of Object.keys(rows.rows[i])) {
    const v = Math.abs(rows.rows[i][k] - rows.rows[i - 1][k]);
    if (v > (rows.limits[k] ?? def(k))) d.push(`${k}:${v.toFixed(2)}`);
  }
  if (d.length) { n++; console.log(`frame ${i} t=${(i / rows.fps).toFixed(3)}`, d.join(' ')); }
}
console.log(n ? `${n} frame(s) over the limits` : 'no pops found');
