// Contact sheet of a rendered video with FFmpeg (no Python needed).
//   node tools/sheet.mjs out/bun-flower.mp4            -> out/sheet.png, one frame every 12
//   node tools/sheet.mjs out/bun-flower.mp4 6 5        -> every 6th frame, 5 columns
//   node tools/sheet.mjs out/x.mp4 2 4 180 210         -> frames 180..210 only (motion detail)
import { execFileSync } from 'node:child_process';
const [video, every = '12', cols = '4', from, to] = process.argv.slice(2);
if (!video) { console.error('usage: node tools/sheet.mjs <video> [every] [cols] [from] [to]'); process.exit(1); }
const probe = execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', video]).toString().trim();
const total = parseInt(probe, 10);
const a = from ? +from : 0, z = to ? +to : total - 1;
const count = Math.floor((z - a) / +every) + 1;
const rows = Math.ceil(count / +cols);
const sel = `between(n\\,${a}\\,${z})*not(mod(n-${a}\\,${every}))`;
const out = video.replace(/[^/]+$/, 'sheet.png');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf',
  `select='${sel}',scale=480:-1,drawtext=text='%{eif\\:n*${every}+${a}\\:d}':x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=${cols}x${rows}`,
  '-frames:v', '1', out]);
console.log(`wrote ${out} (${count} frames, ${cols} columns)`);
