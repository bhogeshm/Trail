// Builds incred/index.html — InCred Global "The First Five Years" (60s, 1920x1080).
// All visuals are procedural (SVG/CSS); run: node build/build.mjs
import fs from 'node:fs';

const MAP = JSON.parse(fs.readFileSync(new URL('./map.json', import.meta.url)));
const W = 1920, H = 1080;

// ---------- seeded PRNG ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f1 = (n) => +n.toFixed(1);

// ---------- skyline ----------
const HZ = 800; // horizon

function towers(r, { n, x0, x1, hMin, hMax, wMin, wMax, fill, win, winP = 0.1 }) {
  let s = '', w = '';
  for (let i = 0; i < n; i++) {
    const tw = wMin + r() * (wMax - wMin);
    const x = x0 + r() * (x1 - x0) - tw / 2;
    const h = hMin + Math.pow(r(), 1.6) * (hMax - hMin);
    const top = HZ - h;
    const kind = r();
    if (kind < 0.55) s += `<rect x="${f1(x)}" y="${f1(top)}" width="${f1(tw)}" height="${f1(h + 2)}"/>`;
    else if (kind < 0.75) {
      const inset = tw * 0.18;
      s += `<rect x="${f1(x)}" y="${f1(top + h * 0.12)}" width="${f1(tw)}" height="${f1(h * 0.88 + 2)}"/>`;
      s += `<rect x="${f1(x + inset)}" y="${f1(top)}" width="${f1(tw - inset * 2)}" height="${f1(h * 0.13)}"/>`;
    } else if (kind < 0.9) {
      s += `<polygon points="${f1(x)},${f1(HZ + 2)} ${f1(x)},${f1(top + tw * 0.5)} ${f1(x + tw)},${f1(top)} ${f1(x + tw)},${f1(HZ + 2)}"/>`;
    } else {
      s += `<rect x="${f1(x)}" y="${f1(top)}" width="${f1(tw)}" height="${f1(h + 2)}"/>`;
      s += `<rect x="${f1(x + tw / 2 - 1)}" y="${f1(top - h * 0.18)}" width="2" height="${f1(h * 0.18)}"/>`;
    }
    if (win) {
      for (let yy = top + 10; yy < HZ - 8; yy += 11) for (let xx = x + 4; xx < x + tw - 5; xx += 8)
        if (r() < winP) w += `<rect x="${f1(xx)}" y="${f1(yy)}" width="3" height="4"/>`;
    }
  }
  return { s: `<g fill="${fill}">${s}</g>`, w };
}

function landmark(city) {
  const c = '#0a1320';
  if (city === 'singapore') {
    let s = '';
    for (const cx of [860, 975, 1090]) s += `<polygon points="${cx - 44},${HZ + 2} ${cx - 32},470 ${cx + 32},470 ${cx + 44},${HZ + 2}"/>`;
    s += `<path d="M770 452 L1160 446 L1196 452 L1196 460 L1150 466 L780 468 Z"/>`;
    // Singapore Flyer
    let fl = `<g fill="none" stroke="${c}" stroke-width="5"><circle cx="1500" cy="640" r="118"/></g><g stroke="${c}" stroke-width="1.6" opacity=".9">`;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; fl += `<line x1="1500" y1="640" x2="${f1(1500 + 118 * Math.cos(a))}" y2="${f1(640 + 118 * Math.sin(a))}"/>`; }
    fl += `</g><polygon fill="${c}" points="1470,${HZ + 2} 1500,640 1530,${HZ + 2} 1522,${HZ + 2} 1500,670 1478,${HZ + 2}"/>`;
    // ArtScience lotus
    let lo = '';
    for (let i = -3; i <= 3; i++) lo += `<path d="M${600 + i * 18} ${HZ - 20} Q ${600 + i * 26} ${HZ - 95 + Math.abs(i) * 12} ${600 + i * 34} ${HZ - 104 + Math.abs(i) * 14} Q ${600 + i * 30} ${HZ - 50} ${600 + i * 18 + 6} ${HZ - 20} Z"/>`;
    return `<g fill="${c}">${s}${lo}<rect x="560" y="${HZ - 24}" width="90" height="26"/></g>${fl}`;
  }
  if (city === 'dubai') {
    const tiers = [[150, 800], [128, 690], [108, 590], [90, 500], [74, 420], [60, 350], [46, 290], [34, 240], [24, 200], [16, 168], [9, 142], [5, 120]];
    let s = '';
    tiers.forEach(([w, y], i) => { const top = tiers[i + 1] ? tiers[i + 1][1] : 100; s += `<rect x="${960 - w / 2 + (i % 2 ? 6 : -6) * (i < 8 ? 1 : 0)}" y="${top}" width="${w}" height="${y - top + 2}"/>`; });
    s += `<rect x="958.8" y="40" width="2.4" height="80"/>`;
    // Burj Al Arab sail
    s += `<path d="M1520 ${HZ + 2} L1520 520 Q1610 600 1626 ${HZ + 2} Z"/><rect x="1514" y="500" width="4" height="${HZ - 498}"/>`;
    // Emirates-like twin
    s += `<polygon points="640,${HZ + 2} 650,430 672,400 690,${HZ + 2}"/><polygon points="700,${HZ + 2} 708,470 726,445 742,${HZ + 2}"/>`;
    return `<g fill="${c}">${s}</g>`;
  }
  if (city === 'london') {
    let s = '';
    s += `<path d="M1105 ${HZ + 2} L1150 230 L1196 ${HZ + 2} Z"/><path d="M1146 250 L1150 205 L1156 250 Z"/>`; // Shard
    s += `<path d="M845 ${HZ + 2} C 830 640, 850 520, 900 455 C 950 520, 970 640, 955 ${HZ + 2} Z"/>`; // Gherkin
    s += `<rect x="495" y="430" width="52" height="${HZ - 428}"/><rect x="489" y="420" width="64" height="16"/><polygon points="491,420 521,318 551,420"/><rect x="519.5" y="290" width="3" height="30"/>`; // Big Ben
    s += `<polygon points="1290,${HZ + 2} 1300,560 1360,540 1372,${HZ + 2}"/>`; // Walkie-talkie-ish
    let eye = `<g fill="none" stroke="${c}" stroke-width="4.5"><circle cx="300" cy="660" r="128"/></g><g stroke="${c}" stroke-width="1.4">`;
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; eye += `<line x1="300" y1="660" x2="${f1(300 + 128 * Math.cos(a))}" y2="${f1(660 + 128 * Math.sin(a))}"/>`; }
    eye += `</g><polygon fill="${c}" points="270,${HZ + 2} 300,660 330,${HZ + 2}"/>`;
    return `<g fill="${c}">${s}</g>${eye}`;
  }
  // new york
  let s = '';
  s += `<polygon points="1200,${HZ + 2} 1226,262 1274,262 1300,${HZ + 2}"/><rect x="1248.5" y="150" width="3" height="114"/>`; // One WTC
  s += `<rect x="760" y="470" width="120" height="${HZ - 468}"/><rect x="780" y="400" width="80" height="72"/><rect x="800" y="350" width="40" height="52"/><rect x="812" y="318" width="16" height="34"/><rect x="818.5" y="230" width="3" height="90"/>`; // Empire State
  s += `<rect x="590" y="430" width="60" height="${HZ - 428}"/><path d="M590 432 Q620 340 650 432 Z"/><polygon points="604,400 620,300 636,400"/><rect x="619" y="270" width="2" height="32"/>`; // Chrysler
  s += `<rect x="1010" y="380" width="70" height="${HZ - 378}"/><rect x="1440" y="430" width="44" height="${HZ - 428}"/>`; // 432 Park etc.
  return `<g fill="${c}">${s}</g>`;
}

function skyline(uid, city, { seed = 1, mood = 'dusk' } = {}) {
  const r = rng(seed);
  const skies = {
    dusk: ['#0a1426', '#1b2c48', '#4a5675', '#c98a62', '#f0b47a'],
    gold: ['#0d1a2e', '#26395a', '#6b6f86', '#d99a66', '#f6c58c'],
    dawn: ['#13233d', '#33507a', '#7f8eaa', '#e3b78f', '#fbe0b4'],
  }[mood];
  const far = towers(r, { n: 70, x0: -40, x1: 1960, hMin: 60, hMax: 300, wMin: 30, wMax: 80, fill: '#3a4762', win: false });
  const mid = towers(r, { n: 46, x0: -40, x1: 1960, hMin: 90, hMax: 380, wMin: 40, wMax: 96, fill: '#1a2537', win: true, winP: 0.07 });
  const near = towers(r, { n: 22, x0: -40, x1: 1960, hMin: 30, hMax: 170, wMin: 60, wMax: 140, fill: '#0b1421', win: true, winP: 0.12 });
  const city_ = `<g id="${uid}-city">${far.s}${mid.s}<g fill="#ffd8a3" opacity=".55">${mid.w}</g>${landmark(city)}${near.s}<g fill="#ffcf8f" opacity=".7">${near.w}</g></g>`;
  let shimmer = '';
  for (let i = 0; i < 46; i++) {
    const y = HZ + 12 + Math.pow(r(), 1.3) * 270, x = r() * 1920, w = 40 + r() * 260;
    shimmer += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="1.6" opacity="${f1(0.15 + r() * 0.35)}"/>`;
  }
  return `<svg class="sky-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${uid}-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${skies[0]}"/><stop offset=".35" stop-color="${skies[1]}"/><stop offset=".58" stop-color="${skies[2]}"/><stop offset=".7" stop-color="${skies[3]}"/><stop offset=".745" stop-color="${skies[4]}"/>
    </linearGradient>
    <radialGradient id="${uid}-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe2b0" stop-opacity=".85"/><stop offset=".3" stop-color="#ffc78a" stop-opacity=".35"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>
    <linearGradient id="${uid}-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3d4f"/><stop offset=".25" stop-color="#151f30"/><stop offset="1" stop-color="#050b14"/></linearGradient>
    <linearGradient id="${uid}-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3b884" stop-opacity="0"/><stop offset="1" stop-color="#f3b884" stop-opacity=".28"/></linearGradient>
    <filter id="${uid}-blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.5 7"/></filter>
  </defs>
  <rect width="${W}" height="${HZ}" fill="url(#${uid}-sky)"/>
  <ellipse cx="1340" cy="${HZ - 30}" rx="720" ry="300" fill="url(#${uid}-sun)"/>
  ${city_}
  <rect y="${HZ - 120}" width="${W}" height="120" fill="url(#${uid}-haze)"/>
  <rect y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#${uid}-water)"/>
  <g opacity=".32" filter="url(#${uid}-blur)" transform="translate(0 ${2 * HZ}) scale(1 -1)"><use href="#${uid}-city"/></g>
  <ellipse cx="1340" cy="${HZ + 30}" rx="520" ry="60" fill="url(#${uid}-sun)" opacity=".55"/>
  <g fill="#ffd9a8">${shimmer}</g>
</svg>`;
}

// ---------- glass architecture (looking up) ----------
function mix(pal, t) {
  const x = t * (pal.length - 1), i = Math.min(pal.length - 2, Math.floor(x)), f = x - i;
  const a = pal[i].match(/\w\w/g).map((h) => parseInt(h, 16)), b = pal[i + 1].match(/\w\w/g).map((h) => parseInt(h, 16));
  return '#' + a.map((v, j) => Math.round(v + (b[j] - v) * f).toString(16).padStart(2, '0')).join('');
}
function glass(uid, { seed = 3, vp = [1250, -1500], faces = [[-300, 900, 0.0], [900, 2300, 1]], tint = 'cool' } = {}) {
  const r = rng(seed);
  const pal = tint === 'cool'
    ? ['#1b2c44', '#2b4462', '#4a6a8e', '#7d9bbb', '#c4d5e6']
    : ['#121b29', '#1d2a3d', '#2c3e56', '#465d7b', '#8fa6c0'];
  let polys = '', lines = '';
  const yb = H + 260;
  const lerp = (a, b, t) => a + (b - a) * t;
  faces.forEach(([xa, xb, side], fi) => {
    const cols = 18;
    const rows = 40;
    const P = (u, s) => { // u across bottom edge, s along toward vp (0..1)
      const bx = lerp(xa, xb, u);
      return [lerp(bx, vp[0], s), lerp(yb, vp[1], s)];
    };
    const sAt = (k) => 1 - Math.pow(0.93, k);
    for (let i = 0; i < cols; i++) for (let k = 0; k < rows; k++) {
      const u0 = i / cols, u1 = (i + 1) / cols, s0 = sAt(k), s1 = sAt(k + 1);
      const p = [P(u0, s0), P(u1, s0), P(u1, s1), P(u0, s1)];
      // smooth sky reflection: diagonal gradient across the face, a soft highlight band, tiny per-pane variance
      const uc = (u0 + u1) / 2, sc = (s0 + s1) / 2;
      let tv = 0.25 + 0.45 * uc * (side ? 0.6 : 1) + 0.35 * sc + (side ? 0.12 : 0);
      tv += 0.28 * Math.exp(-Math.pow((uc - sc * 0.9 - 0.25 - fi * 0.2) / 0.12, 2));
      tv += (r() - 0.5) * 0.07 + (k % 7 === 0 ? 0.04 : 0);
      const fill = mix(pal, Math.max(0, Math.min(1, tv)));
      polys += `<polygon points="${p.map((q) => q.map(f1).join(',')).join(' ')}" fill="${fill}"/>`;
    }
    for (let i = 0; i <= cols; i++) { const a = P(i / cols, 0), b = P(i / cols, sAt(rows)); lines += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke-width="${i === 0 || i === cols ? 3 : 1.4}"/>`; }
    for (let k = 0; k <= rows; k++) { const a = P(0, sAt(k)), b = P(1, sAt(k)); lines += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}"/>`; }
  });
  return `<svg class="glass-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="${uid}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dfe8f1"/><stop offset=".5" stop-color="#9fb6cc"/><stop offset="1" stop-color="#5e7896"/></linearGradient>
  <linearGradient id="${uid}-flare" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff6e8" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#${uid}-bg)"/>
  ${polys}
  <g stroke="#e8eff6" stroke-opacity=".22" fill="none">${lines}</g>
</svg>`;
}

// ---------- world map ----------
function worldMap(uid, { partners = false } = {}) {
  const dots = MAP.dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2"/>`).join('');
  const C = MAP.cities;
  const arc = (a, b, bend = 0.28) => {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const cx = mx - dy * bend * Math.sign(dx || 1) * -1, cy = my - Math.abs(dx) * bend - 30;
    let len = 0, px = a[0], py = a[1];
    for (let i = 1; i <= 60; i++) { const t = i / 60; const x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * cx + t * t * b[0]; const y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * cy + t * t * b[1]; len += Math.hypot(x - px, y - py); px = x; py = y; }
    return { d: `M${a[0]} ${a[1]} Q${f1(cx)} ${f1(cy)} ${b[0]} ${b[1]}`, len: Math.ceil(len) + 2 };
  };
  const locs = ['singapore', 'dubai', 'london', 'newyork'];
  const arcs = locs.map((k) => ({ k, ...arc(C.mumbai, C[k], k === 'singapore' || k === 'dubai' ? 0.35 : 0.22) }));
  let partnerSvg = '';
  if (partners) {
    const lines = [];
    MAP.partners.forEach((p, i) => {
      // connect each partner to its nearest InCred location
      let best = locs[0], bd = 1e9;
      for (const k of locs) { const d = Math.hypot(C[k][0] - p[0], C[k][1] - p[1]); if (d < bd) { bd = d; best = k; } }
      const a = arc(C[best], p, 0.18);
      lines.push(`<path class="${uid}-pl" d="${a.d}" stroke-dasharray="${a.len}" stroke-dashoffset="${a.len}"/>`);
    });
    partnerSvg = `<g fill="none" stroke="#c8a46a" stroke-opacity=".45" stroke-width="1.1">${lines.join('')}</g>
    <g>${MAP.partners.map((p) => `<g class="${uid}-pd" transform="translate(${p[0]} ${p[1]})"><circle r="9" fill="#c8a46a" opacity=".16"/><circle r="3.6" fill="#e6cf9e"/></g>`).join('')}</g>`;
  }
  const marker = (k, cls) => `<g class="${cls}" transform="translate(${C[k][0]} ${C[k][1]})"><circle class="${uid}-ring" r="10" fill="none" stroke="#f37021" stroke-width="2"/><circle r="12" fill="#06101d" stroke="#f4efe6" stroke-width="2.5"/><circle r="5.5" fill="#f37021"/></g>`;
  return `<svg class="map-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><clipPath id="${uid}-reveal"><circle id="${uid}-rc" cx="${C.mumbai[0]}" cy="${C.mumbai[1]}" r="2400"/></clipPath>
  <radialGradient id="${uid}-glow"><stop offset="0" stop-color="#f37021" stop-opacity=".45"/><stop offset="1" stop-color="#f37021" stop-opacity="0"/></radialGradient></defs>
  <g clip-path="url(#${uid}-reveal)" fill="#9fb6d0" fill-opacity=".34">${dots}</g>
  ${partnerSvg}
  <g fill="none" stroke="#e6cf9e" stroke-width="2.2" stroke-linecap="round">${arcs.map((a) => `<path class="${uid}-arc" d="${a.d}" stroke-dasharray="${a.len}" stroke-dashoffset="${partners ? 0 : a.len}"/>`).join('')}</g>
  <circle cx="${C.mumbai[0]}" cy="${C.mumbai[1]}" r="90" fill="url(#${uid}-glow)" class="${uid}-home-glow"/>
  <g class="${uid}-home" transform="translate(${C.mumbai[0]} ${C.mumbai[1]})"><circle r="15" fill="#f37021"/><circle r="6" fill="#f4efe6"/></g>
  ${locs.map((k) => marker(k, `${uid}-mk`)).join('')}
</svg>`;
}

// ---------- icons ----------
const ICON = {
  fixed: `<svg viewBox="0 0 64 64" class="icon"><ellipse cx="26" cy="18" rx="16" ry="6"/><path d="M10 18v8c0 3.3 7.2 6 16 6s16-2.7 16-6v-8"/><path d="M10 26v8c0 3.3 7.2 6 16 6s16-2.7 16-6v-8"/><path d="M10 34v8c0 3.3 7.2 6 16 6s16-2.7 16-6v-8"/><ellipse cx="44" cy="40" rx="12" ry="4.5"/><path d="M32 40v7c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5v-7"/></svg>`,
  venture: `<svg viewBox="0 0 64 64" class="icon"><path d="M32 56V30"/><path d="M32 34c0-10 7-16 18-16 0 10-7 16-18 16z"/><path d="M32 40c0-9-6-14-16-14 0 9 6 14 16 14z"/><path d="M20 56h24"/></svg>`,
  equity: `<svg viewBox="0 0 64 64" class="icon"><path d="M10 54h46"/><path d="M16 54V40h8v14"/><path d="M28 54V30h8v24"/><path d="M40 54V18h8v36"/><path d="M14 30l12-10 8 6 16-14"/><path d="M44 12h6v6"/></svg>`,
};

// ---------- timing ----------
// scene starts (s) per storyboard
const S = { s1: 0, s2: 5, s3a: 9, s3b: 10, s3c: 11, s3d: 12, s4: 13, s5: 18, s6: 24, s7: 30, s8: 34, s9: 39, s10: 47, s11: 52, s12: 56 };
const order = Object.keys(S);
const XF = 0.8; // crossfade overlap
const dur = (k) => { const i = order.indexOf(k); const next = order[i + 1]; return next ? +(S[next] - S[k] + (k.startsWith('s3') && next.startsWith('s3') ? 0.35 : XF)).toFixed(2) : 60 - S[k]; };
const clip = (k, inner, z) => `<section id="${k}" class="clip scene" data-start="${S[k]}" data-duration="${dur(k)}" data-track-index="${z % 2}" style="z-index:${z}"><div class="fade">${inner}</div></section>`;
const chapter = (n, t) => `<div class="chapter"><span class="ch-n">${n}</span><span class="ch-rule"></span><span class="ch-t">${t}</span></div>`;

// ---------- scenes ----------
const scenes = [];
let z = 1;

scenes.push(clip('s1', `
  <div class="cam">${glass('g1', { seed: 7, vp: [1350, -1700], faces: [[-500, 1000, 0], [1000, 2600, 1]] })}</div>
  <div class="flare" id="s1-flare"></div>
  <div class="grade grade-left"></div>
  <div class="content s1-content">
    <div class="s1-left">
      <div class="dash" id="s1-dash"></div>
      <div class="eyebrow" id="s1-eye">InCred Global · Anniversary</div>
      <h1 class="display s1-title"><span class="line"><span class="li">Celebrating</span></span><span class="line"><span class="li">the First Five Years</span></span><span class="line"><span class="li">of <em>InCred Global</em></span></span></h1>
    </div>
    <div class="s1-rule" id="s1-rule"></div>
    <div class="s1-right"><div class="big5" id="s1-5">5</div><div class="years" id="s1-years">Years</div></div>
  </div>
  ${chapter('01', 'Five years of progress')}`, z++));

scenes.push(clip('s2', `
  <div class="bg-navy"></div>
  <div class="cam">${worldMap('m2')}</div>
  <div class="content s2-content">
    <div class="dash"></div>
    <div class="eyebrow">From India to the world</div>
    <h2 class="headline s2-h"><span class="line"><span class="li">The First Leap</span></span><span class="line"><span class="li">Beyond India</span></span></h2>
    <p class="sub s2-sub">Establishing our presence across key global financial centres.</p>
  </div>
  ${chapter('02', 'From India to the world')}`, z++));

const cities = [['s3a', 'singapore', 'Singapore', 11, 'dusk'], ['s3b', 'dubai', 'Dubai', 23, 'gold'], ['s3c', 'london', 'London', 37, 'dusk'], ['s3d', 'newyork', 'New York', 51, 'gold']];
cities.forEach(([k, c, label, seed, mood], i) => {
  scenes.push(clip(k, `
  <div class="cam">${skyline(k, c, { seed, mood })}</div>
  <div class="grade grade-bottom"></div>
  <div class="city-label"><span class="cl-n">0${i + 1} / 04</span><span class="cl-rule"></span><span class="cl-name">${label}</span></div>
  ${i === 0 ? '' : ''}${chapter('03', 'Our global presence')}`, z++));
});

scenes.push(clip('s4', `
  <div class="bg-paper"></div>
  <div class="cam cam-map4">${worldMap('m4', { partners: true })}</div>
  <div class="grade grade-paper"></div>
  <div class="content s4-content">
    <div class="dash"></div>
    <div class="stat-xl"><span id="s4-num">0</span><span class="plus">+</span></div>
    <h2 class="headline dark s4-h">Global Private Banking Partnerships</h2>
    <p class="sub dark s4-sub">Delivering seamless, multi-jurisdictional advisory.</p>
    <div class="legend"><span><i class="lg-o"></i>Our locations</span><span><i class="lg-g"></i>Partnership network</span></div>
  </div>
  ${chapter('04', 'Extending the network', 'dark')}`, z++));

scenes.push(clip('s5', `
  <div class="cam">${glass('g5', { seed: 19, vp: [1500, -1300], faces: [[700, 1500, 0], [1500, 2500, 1]], tint: 'cool' })}</div>
  <div class="grade grade-s5"></div>
  <div class="content s5-content">
    <div class="dash"></div>
    <div class="eyebrow">Broadening capabilities</div>
    <h2 class="headline s5-h"><span class="line"><span class="li">Expanding Proprietary</span></span><span class="line"><span class="li">Global Fund Capabilities</span></span></h2>
    <div class="caps">
      <div class="cap" id="cap1">${ICON.fixed}<div class="cap-t">Fixed Income</div></div>
      <div class="cap-div" id="capd1"></div>
      <div class="cap" id="cap2">${ICON.venture}<div class="cap-t">Venture Capital</div></div>
      <div class="cap-div" id="capd2"></div>
      <div class="cap" id="cap3">${ICON.equity}<div class="cap-t">Global Equities</div></div>
    </div>
  </div>
  ${chapter('05', 'Broadening capabilities')}`, z++));

scenes.push(clip('s6', `
  <div class="cam">${glass('g6', { seed: 29, vp: [700, -1500], faces: [[-800, 700, 1], [700, 2100, 0]], tint: 'night' })}</div>
  <div class="grade grade-s6"></div>
  <div class="content s6-content">
    <div class="dash"></div>
    <div class="eyebrow">A milestone in scale</div>
    <h2 class="headline s6-h">High-Impact Growth</h2>
    <p class="sub s6-sub">Rapidly scaling</p>
    <div class="aum"><span class="aum-pre">~USD</span><span class="aum-n" id="s6-num">0</span><span class="aum-u">BN+</span></div>
    <div class="aum-row"><span class="aum-label">AUM</span><span class="aum-line" id="s6-line"></span></div>
  </div>
  ${chapter('06', 'A milestone in scale')}`, z++));

scenes.push(clip('s7', `
  <div class="bg-ivory"></div>
  <div class="cam s7-cam">${glass('g7', { seed: 41, vp: [1700, -1400], faces: [[1250, 1700, 0], [1700, 2500, 1]], tint: 'cool' })}</div>
  <div class="grade grade-s7"></div>
  <div class="content s7-content">
    <div class="dash"></div>
    <h2 class="headline dark s7-h">The Year of Strategic Expansion</h2>
    <p class="sub dark s7-sub">Accelerating momentum through key acquisitions</p>
    <div class="year">${'2025'.split('').map((d, i) => `<span class="yd-wrap"><span class="yd" id="yd${i}">${d}</span></span>`).join('')}</div>
  </div>
  ${chapter('07', 'A defining chapter', 'dark')}`, z++));

scenes.push(clip('s8', `
  <div class="split">
    <div class="panel" id="s8-p1"><div class="cam">${skyline('s8a', 'dubai', { seed: 61, mood: 'dusk' })}</div><div class="grade grade-bottom"></div>
      <div class="acq" id="s8-l1"><span class="acq-dash"></span><span class="acq-name">Arrow Capital</span><span class="acq-sep">—</span><span class="acq-city">Dubai</span></div></div>
    <div class="panel" id="s8-p2"><div class="cam">${skyline('s8b', 'singapore', { seed: 67, mood: 'gold' })}</div><div class="grade grade-bottom"></div>
      <div class="acq" id="s8-l2"><span class="acq-dash"></span><span class="acq-name">S-Cube</span><span class="acq-sep">—</span><span class="acq-city">Singapore</span></div></div>
    <div class="split-rule" id="s8-rule"></div>
  </div>
  <div class="s8-top"><div class="eyebrow">Strategic acquisitions · 2025</div></div>
  ${chapter('08', 'Strategic acquisitions')}`, z++));

// 90 dots — one per team member
let team = '';
for (let i = 0; i < 90; i++) { const c = i % 15, r_ = Math.floor(i / 15); team += `<circle class="tm" cx="${c * 34 + 17}" cy="${r_ * 34 + 17}" r="6"/>`; }
scenes.push(clip('s9', `
  <div class="bg-navy s9-bg"></div>
  <div class="cam">${glass('g9', { seed: 53, vp: [960, -2200], faces: [[-600, 960, 1], [960, 2500, 0]], tint: 'night' })}</div>
  <div class="grade grade-s9"></div>
  <div class="content s9-content">
    <div class="s9-head">
      <div class="dash"></div>
      <div class="eyebrow">Our greatest asset</div>
      <h2 class="headline s9-h">Behind every milestone, our people.</h2>
    </div>
    <svg class="team" viewBox="0 0 510 204">${team}</svg>
    <div class="facts">
      <div class="fact" id="f1"><span class="fact-n"><span id="s9-n1">0</span></span><span class="fact-t"><b>Member</b>Global Team</span></div>
      <div class="fact-div" id="fd1"></div>
      <div class="fact" id="f2"><span class="fact-n"><span id="s9-n2">0</span></span><span class="fact-t"><b>Jurisdictions</b>Across the world</span></div>
      <div class="fact-div" id="fd2"></div>
      <div class="fact" id="f3"><span class="fact-n"><span id="s9-n3">0</span>+</span><span class="fact-t"><b>Years</b>Average Experience</span></div>
    </div>
  </div>
  ${chapter('09', 'The people behind the milestones')}`, z++));

scenes.push(clip('s10', `
  <div class="cam">${skyline('s10', 'singapore', { seed: 83, mood: 'dusk' })}</div>
  <div class="grade grade-s10"></div>
  <div class="content s10-content">
    <div class="dash"></div>
    <h2 class="serif-h s10-h"><span class="line"><span class="li">To our clients, partners</span></span><span class="line"><span class="li">and exceptional team.</span></span></h2>
    <p class="sub s10-sub">Thank you for being part of our first five years.</p>
  </div>
  ${chapter('10', 'Gratitude')}`, z++));

scenes.push(clip('s11', `
  <div class="cam cam-wide">${skyline('s11', 'singapore', { seed: 97, mood: 'dawn' })}</div>
  <div class="grade grade-s11"></div>
  <div class="content s11-content">
    <div class="eyebrow center">Looking ahead</div>
    <h2 class="display s11-h">The Journey Ahead Awaits</h2>
  </div>
  ${chapter('11', 'Looking ahead')}`, z++));

scenes.push(clip('s12', `
  <div class="cam">${skyline('s12', 'singapore', { seed: 97, mood: 'dawn' })}</div>
  <div class="grade grade-s12"></div>
  <div class="content s12-content">
    <div class="lockup">
      <div class="wordmark" id="s12-wm"><span class="wm-a">InCred</span><span class="wm-b">Global</span></div>
      <div class="lk-rule" id="s12-rule"></div>
      <div class="lk-5" id="s12-5"><span class="lk-num">5</span><span class="lk-y">Years</span></div>
    </div>
    <div class="tagline" id="s12-tag">Five years of progress · The journey continues</div>
  </div>
  <div class="disclaimer" id="s12-disc">Approved disclaimer to be inserted here.</div>`, z++));

// ---------- CSS ----------
const css = `
@font-face{font-family:"InterDisplay";src:url(assets/fonts/InterDisplay-ExtraLight.otf);font-weight:200}
@font-face{font-family:"InterDisplay";src:url(assets/fonts/InterDisplay-Light.otf);font-weight:300}
@font-face{font-family:"InterDisplay";src:url(assets/fonts/InterDisplay-Regular.otf);font-weight:400}
@font-face{font-family:"InterDisplay";src:url(assets/fonts/InterDisplay-Medium.otf);font-weight:500}
@font-face{font-family:"InterDisplay";src:url(assets/fonts/InterDisplay-SemiBold.otf);font-weight:600}
@font-face{font-family:"InterDisplay";src:url(assets/fonts/InterDisplay-Bold.otf);font-weight:700}
@font-face{font-family:"InterText";src:url(assets/fonts/Inter-Regular.otf);font-weight:400}
@font-face{font-family:"InterText";src:url(assets/fonts/Inter-Medium.otf);font-weight:500}
@font-face{font-family:"InterText";src:url(assets/fonts/Inter-SemiBold.otf);font-weight:600}
@font-face{font-family:"Cormorant";src:url(assets/fonts/cormorant-garamond-latin-400-normal.woff2);font-weight:400}
@font-face{font-family:"Cormorant";src:url(assets/fonts/cormorant-garamond-latin-500-normal.woff2);font-weight:500}
@font-face{font-family:"Cormorant";src:url(assets/fonts/cormorant-garamond-latin-400-italic.woff2);font-weight:400;font-style:italic}
@font-face{font-family:"Cormorant";src:url(assets/fonts/cormorant-garamond-latin-500-italic.woff2);font-weight:500;font-style:italic}
:root{--navy:#06101d;--ink:#0b1828;--gold:#c8a46a;--gold2:#e6cf9e;--orange:#f37021;--ivory:#f4efe6;--mist:rgba(244,239,230,.74);--slate:#1d2b3e}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:#000}
#root{position:relative;width:100%;height:100%;overflow:hidden;background:#000;font-family:"InterText",sans-serif;color:var(--ivory)}
.clip{position:absolute;inset:0;overflow:hidden}
.fade{position:absolute;inset:0;overflow:hidden}
.cam{position:absolute;inset:0}
.cam svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.bg-navy{position:absolute;inset:0;background:radial-gradient(120% 90% at 70% 45%,#10233b 0%,#081525 45%,#040b15 100%)}
.bg-paper{position:absolute;inset:0;background:radial-gradient(120% 100% at 70% 40%,#f7f4ee 0%,#e9e6df 60%,#d9d6cf 100%)}
.bg-ivory{position:absolute;inset:0;background:#efece6}
.grade{position:absolute;inset:0;pointer-events:none}
.grade-left{background:linear-gradient(90deg,rgba(4,10,20,.88) 0%,rgba(4,10,20,.62) 42%,rgba(4,10,20,.15) 70%,rgba(4,10,20,.35) 100%)}
.grade-bottom{background:linear-gradient(0deg,rgba(3,8,16,.75) 0%,rgba(3,8,16,0) 30%),linear-gradient(180deg,rgba(3,8,16,.45) 0%,rgba(3,8,16,0) 22%)}
.grade-paper{background:linear-gradient(90deg,rgba(247,244,238,.96) 0%,rgba(247,244,238,.8) 28%,rgba(247,244,238,0) 46%)}
.grade-s5{background:linear-gradient(90deg,rgba(5,12,22,.9) 0%,rgba(5,12,22,.78) 45%,rgba(5,12,22,.2) 75%,rgba(5,12,22,.3) 100%)}
.grade-s6{background:linear-gradient(90deg,rgba(3,8,16,.94) 0%,rgba(3,8,16,.82) 50%,rgba(3,8,16,.35) 100%)}
.grade-s7{background:linear-gradient(90deg,rgba(239,236,230,1) 0%,rgba(239,236,230,.96) 52%,rgba(239,236,230,.2) 72%,rgba(239,236,230,0) 100%)}
.grade-s9{background:linear-gradient(180deg,rgba(4,10,20,.85) 0%,rgba(4,10,20,.93) 50%,rgba(4,10,20,.97) 100%)}
.grade-s10{background:linear-gradient(90deg,rgba(4,10,20,.82) 0%,rgba(4,10,20,.5) 40%,rgba(4,10,20,0) 65%),linear-gradient(0deg,rgba(3,8,16,.6) 0%,rgba(3,8,16,0) 30%)}
.grade-s11{background:linear-gradient(180deg,rgba(6,14,28,.72) 0%,rgba(6,14,28,.35) 40%,rgba(6,14,28,.2) 60%,rgba(3,8,16,.7) 100%)}
.grade-s12{background:radial-gradient(70% 60% at 50% 45%,rgba(6,14,28,.68) 0%,rgba(6,14,28,.8) 60%,rgba(3,8,16,.92) 100%)}
.content{position:absolute;inset:0;padding:0 150px}
.dash{width:56px;height:3px;background:var(--orange);margin-bottom:30px}
.eyebrow{font-family:"InterText";font-weight:500;font-size:19px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold2)}
.eyebrow.center{text-align:center}
.display{font-family:"InterDisplay";font-weight:300;letter-spacing:-.02em;line-height:1.04}
.display em,.headline em{font-family:"Cormorant";font-style:italic;font-weight:500;color:var(--gold2);letter-spacing:0}
.headline{font-family:"InterDisplay";font-weight:400;font-size:76px;letter-spacing:-.02em;line-height:1.06;color:var(--ivory)}
.headline.dark,.sub.dark{color:var(--ink)}
.sub{font-family:"InterText";font-weight:400;font-size:28px;line-height:1.45;color:var(--mist);margin-top:26px;max-width:760px}
.sub.dark{color:#3b4656}
.line{display:block;overflow:hidden;padding-bottom:.08em}
.li{display:block}
.chapter{position:absolute;left:150px;bottom:64px;display:flex;align-items:center;gap:18px;font-family:"InterText";font-size:15px;font-weight:500;letter-spacing:.28em;text-transform:uppercase;color:rgba(244,239,230,.66)}
.ch-n{color:var(--gold2)}
.ch-rule{display:block;width:44px;height:1px;background:rgba(230,207,158,.7)}
#s4 .chapter,#s7 .chapter{color:#4a5566}
#s4 .ch-n,#s7 .ch-n{color:#8a6a37}
#s4 .ch-rule,#s7 .ch-rule{background:#8a6a37}
.flare{position:absolute;top:-30%;left:0;width:520px;height:160%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,247,232,.32),rgba(255,255,255,0));transform:rotate(18deg);mix-blend-mode:screen}
/* s1 */
.s1-content{display:flex;align-items:center;gap:80px}
.s1-left{width:980px}
.s1-title{font-size:104px;margin-top:6px}
.s1-title .li{padding-top:6px}
.s1-rule{width:1px;height:340px;background:linear-gradient(180deg,rgba(230,207,158,0),rgba(230,207,158,.9),rgba(230,207,158,0))}
.s1-right{display:flex;flex-direction:column;align-items:flex-start}
.big5{font-family:"InterDisplay";font-weight:200;font-size:400px;line-height:.8;color:var(--ivory);letter-spacing:-.04em}
.years{font-family:"InterText";font-weight:500;font-size:34px;letter-spacing:.5em;text-transform:uppercase;color:var(--gold2);margin-top:22px;padding-left:14px}
/* s2 */
.s2-content{display:flex;flex-direction:column;justify-content:center;width:860px;padding-right:0}
.s2-h{margin-top:22px;font-size:84px}
.map-svg{position:absolute;inset:0}
#s2 .cam{left:200px}
/* city */
.city-label{position:absolute;left:150px;bottom:130px;display:flex;align-items:center;gap:26px}
.cl-n{font-family:"InterText";font-weight:500;font-size:17px;letter-spacing:.3em;color:var(--gold2)}
.cl-rule{display:block;width:70px;height:1px;background:var(--gold2)}
.cl-name{font-family:"InterDisplay";font-weight:300;font-size:96px;letter-spacing:-.01em;color:var(--ivory)}
/* s4 */
.cam-map4{left:330px;top:10px}
.s4-content{display:flex;flex-direction:column;justify-content:center;width:880px}
.stat-xl{font-family:"InterDisplay";font-weight:300;font-size:260px;line-height:.86;color:#1b3554;letter-spacing:-.045em;display:flex;align-items:flex-start}
.stat-xl .plus{font-size:150px;color:var(--orange);margin-left:8px;margin-top:10px}
.s4-h{font-size:60px;margin-top:26px;max-width:640px}
.s4-sub{font-size:26px}
.legend{display:flex;gap:40px;margin-top:44px;font-family:"InterText";font-size:18px;letter-spacing:.06em;color:#4a5566}
.legend span{display:flex;align-items:center;gap:12px}
.legend i{display:block;width:12px;height:12px;border-radius:50%}
.lg-o{background:var(--orange)}.lg-g{background:var(--gold)}
#s4 .map-svg circle[r="2.2"]{fill:#6c84a0}
/* s5 */
.s5-content{display:flex;flex-direction:column;justify-content:center}
.s5-h{margin-top:22px;font-size:82px}
.caps{display:flex;align-items:stretch;margin-top:84px;gap:0}
.cap{width:300px;display:flex;flex-direction:column;gap:26px}
.cap-div{width:1px;background:rgba(230,207,158,.55);margin:0 56px 0 0}
.icon{width:76px;height:76px;fill:none;stroke:var(--gold2);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.cap-t{font-family:"InterDisplay";font-weight:400;font-size:36px;color:var(--ivory)}
/* s6 */
.s6-content{display:flex;flex-direction:column;justify-content:center}
.s6-h{margin-top:22px;font-size:72px}
.s6-sub{margin-top:14px}
.aum{display:flex;align-items:baseline;gap:26px;margin-top:40px;font-family:"InterDisplay";color:var(--ivory)}
.aum-pre{font-size:120px;font-weight:300;color:var(--gold2);letter-spacing:-.02em}
.aum-n{font-size:250px;font-weight:600;line-height:.9;letter-spacing:-.04em;min-width:300px;text-align:center}
.aum-u{font-size:150px;font-weight:600;letter-spacing:-.03em}
.aum-row{display:flex;align-items:center;gap:30px;margin-top:10px}
.aum-label{font-family:"InterText";font-weight:600;font-size:48px;letter-spacing:.3em;color:var(--ivory)}
.aum-line{display:block;width:720px;height:3px;background:linear-gradient(90deg,var(--gold2),rgba(200,164,106,0));transform-origin:left center}
/* s7 */
.s7-cam{left:0}
.s7-content{display:flex;flex-direction:column;justify-content:center}
.s7-h{font-size:66px}
.s7-sub{margin-top:18px}
.year{display:flex;margin-top:24px;margin-left:-14px}
.yd-wrap{display:block;overflow:hidden;height:330px}
.yd{display:block;font-family:"InterDisplay";font-weight:600;font-size:380px;line-height:.86;letter-spacing:-.05em;color:#2f5d80}
/* s8 */
.split{position:absolute;inset:0;display:flex}
.panel{position:relative;width:50%;height:100%;overflow:hidden}
.acq{position:absolute;left:80px;bottom:150px;display:flex;align-items:center;gap:20px;font-family:"InterDisplay";color:var(--ivory)}
.acq-dash{display:block;width:44px;height:3px;background:var(--orange)}
.acq-name{font-size:56px;font-weight:500;letter-spacing:-.01em}
.acq-sep{font-size:44px;color:var(--gold2);font-weight:200}
.acq-city{font-size:44px;font-weight:300;color:var(--mist)}
.split-rule{position:absolute;left:50%;top:0;width:2px;height:100%;margin-left:-1px;background:var(--gold2);transform-origin:center top}
.s8-top{position:absolute;left:0;right:0;top:80px;text-align:center}
#s8 .chapter{left:80px}
/* s9 */
.s9-content{display:flex;flex-direction:column;justify-content:center}
.s9-h{margin-top:22px;font-size:72px}
.team{position:absolute;right:150px;top:150px;width:510px;height:204px}
.tm{fill:#e6cf9e}
.facts{display:flex;align-items:center;margin-top:96px}
.fact{display:flex;align-items:center;gap:22px;width:460px}
.fact-n{font-family:"InterDisplay";font-weight:300;font-size:150px;line-height:.9;letter-spacing:-.04em;color:var(--ivory)}
.fact-t{display:flex;flex-direction:column;font-family:"InterText";font-size:22px;color:var(--mist);line-height:1.3}
.fact-t b{font-family:"InterDisplay";font-weight:500;font-size:34px;color:var(--gold2)}
.fact-div{width:1px;height:130px;background:rgba(230,207,158,.5);margin-right:60px}
/* s10 */
.s10-content{display:flex;flex-direction:column;justify-content:center;padding-bottom:120px}
.serif-h{font-family:"Cormorant";font-style:italic;font-weight:500;font-size:100px;line-height:1.04;color:var(--ivory)}
.s10-sub{font-size:32px;margin-top:30px}
/* s11 */
.s11-content{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:200px;text-align:center}
.s11-h{font-size:118px;margin-top:28px;color:var(--ivory)}
/* s12 */
.s12-content{display:flex;flex-direction:column;align-items:center;justify-content:center}
.lockup{display:flex;align-items:center;gap:60px}
.wordmark{font-family:"InterDisplay";font-weight:600;font-size:120px;letter-spacing:-.03em;display:flex;gap:26px}
.wm-a{color:var(--orange)}
.wm-b{color:#c9d6e4;font-weight:400}
.lk-rule{width:1px;height:190px;background:linear-gradient(180deg,rgba(230,207,158,0),rgba(230,207,158,.95),rgba(230,207,158,0))}
.lk-5{display:flex;flex-direction:column;align-items:center}
.lk-num{font-family:"InterDisplay";font-weight:200;font-size:190px;line-height:.82;color:var(--ivory)}
.lk-y{text-transform:uppercase;font-family:"InterText";font-weight:500;font-size:24px;letter-spacing:.5em;padding-left:.5em;color:var(--gold2);margin-top:12px}
.tagline{margin-top:70px;font-family:"InterText";font-weight:500;font-size:19px;letter-spacing:.36em;text-transform:uppercase;color:rgba(244,239,230,.8)}
.disclaimer{position:absolute;left:0;right:0;bottom:44px;text-align:center;font-family:"InterText";font-size:15px;letter-spacing:.04em;color:rgba(244,239,230,.6)}
/* global finishing */
.vignette{position:absolute;inset:0;z-index:90;pointer-events:none;background:radial-gradient(120% 95% at 50% 50%,rgba(0,0,0,0) 58%,rgba(0,0,0,.42) 100%)}
.grain{position:absolute;inset:-40px;z-index:91;pointer-events:none;opacity:.07;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
`;

// ---------- timeline ----------
const js = `
const tl = gsap.timeline({ paused: true });
const E = "power3.out", EI = "power2.inOut";
const S = ${JSON.stringify(S)};
const counter = (sel, to, at, d, fmt) => { const o = { v: 0 }; const el = document.querySelector(sel); tl.to(o, { v: to, duration: d, ease: "power2.out", onUpdate: () => { el.textContent = fmt ? fmt(o.v) : Math.round(o.v); } }, at); };
const lines = (sel, at) => tl.fromTo(sel + " .li", { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.12 }, at);

// crossfades + slow camera on every scene
Object.keys(S).forEach((k, i) => {
  const at = S[k];
  const quick = k.startsWith("s3") && k !== "s3a";
  if (i === 0) tl.fromTo("#" + k + " .fade", { opacity: 0 }, { opacity: 1, duration: 1.4, ease: "power1.inOut" }, 0);
  else tl.fromTo("#" + k + " .fade", { opacity: 0 }, { opacity: 1, duration: quick ? 0.35 : 0.8, ease: EI }, at);
});
const cam = (sel, at, d, from, to, extra) => tl.fromTo(sel, Object.assign({ scale: from }, extra && extra[0]), Object.assign({ scale: to, duration: d, ease: "none" }, extra && extra[1]), at);

// 01 — anniversary identity
cam("#s1 .cam", 0, 5.8, 1.12, 1.0, [{ yPercent: 2 }, { yPercent: -1 }]);
tl.fromTo("#s1-flare", { x: -700 }, { x: 2300, duration: 3.6, ease: "power1.inOut" }, 0.6);
tl.fromTo("#s1-dash", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.8, ease: E }, 0.6);
tl.fromTo("#s1-eye", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: E }, 0.7);
lines("#s1 .s1-title", 0.9);
tl.fromTo("#s1-rule", { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: "expo.out" }, 1.5);
tl.fromTo("#s1-5", { opacity: 0, y: 60, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 1.6, ease: "expo.out" }, 1.8);
tl.fromTo("#s1-years", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 1.6, ease: E }, 2.2);

// 02 — from India to the world
cam("#s2 .cam", 5, 4.8, 1.08, 1.0);
tl.fromTo("#m2-rc", { attr: { r: 0 } }, { attr: { r: 2300 }, duration: 3.2, ease: "power2.inOut" }, 5.1);
tl.fromTo(".m2-home", { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.7, ease: "back.out(2)" }, 5.3);
tl.fromTo(".m2-home-glow", { opacity: 0 }, { opacity: 1, duration: 1 }, 5.3);
tl.to(".m2-arc", { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", stagger: 0.28 }, 5.9);
tl.fromTo(".m2-mk", { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.6, ease: "back.out(2.2)", stagger: 0.28 }, 6.9);
tl.fromTo(".m2-ring", { attr: { r: 10 }, opacity: 1 }, { attr: { r: 34 }, opacity: 0, duration: 1.4, ease: "power2.out", stagger: 0.28 }, 7.1);
tl.fromTo("#s2 .dash", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.8, ease: E }, 5.4);
tl.fromTo("#s2 .eyebrow", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, ease: E }, 5.5);
lines("#s2 .s2-h", 5.7);
tl.fromTo("#s2 .s2-sub", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, ease: E }, 6.3);

// 03 — city match-cuts (continuous push across cuts)
["s3a", "s3b", "s3c", "s3d"].forEach((k, i) => {
  const at = S[k];
  cam("#" + k + " .cam", at, 1.4, 1.1 - i * 0.0, 1.04, [{ xPercent: i % 2 ? 1.5 : -1.5 }, { xPercent: 0 }]);
  tl.fromTo("#" + k + " .cl-name", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" }, at + 0.12);
  tl.fromTo("#" + k + " .cl-rule", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.6, ease: E }, at + 0.08);
  tl.fromTo("#" + k + " .cl-n", { opacity: 0 }, { opacity: 1, duration: 0.5 }, at + 0.05);
});

// 04 — partnership network
cam("#s4 .cam", 13, 5.8, 1.0, 1.06);
tl.fromTo(".m4-pd", { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.6, ease: "back.out(2)", stagger: { each: 0.05, from: "random" } }, 13.8);
tl.to(".m4-pl", { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut", stagger: { each: 0.045, from: "random" } }, 13.9);
tl.fromTo(".m4-mk, .m4-home", { scale: 0.6, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.8, ease: "back.out(2)" }, 13.2);
tl.fromTo(".m4-ring", { attr: { r: 10 }, opacity: 1 }, { attr: { r: 34 }, opacity: 0, duration: 1.6, ease: "power2.out", repeat: 2 }, 13.4);
tl.fromTo("#s4 .dash", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.8, ease: E }, 13.4);
tl.fromTo("#s4 .stat-xl", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out" }, 13.5);
counter("#s4-num", 35, 13.6, 2.6);
tl.fromTo("#s4 .s4-h", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: E }, 14.4);
tl.fromTo("#s4 .s4-sub", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, ease: E }, 14.9);
tl.fromTo("#s4 .legend", { opacity: 0 }, { opacity: 1, duration: 1 }, 15.6);

// 05 — capabilities
cam("#s5 .cam", 18, 6.8, 1.1, 1.0, [{ xPercent: 2 }, { xPercent: 0 }]);
tl.fromTo("#s5 .dash", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.8, ease: E }, 18.4);
tl.fromTo("#s5 .eyebrow", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, ease: E }, 18.5);
lines("#s5 .s5-h", 18.7);
[["#cap1", 19.9], ["#cap2", 21.0], ["#cap3", 22.1]].forEach(([sel, at]) => {
  tl.fromTo(sel, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out" }, at);
  tl.fromTo(sel + " .icon *", { strokeDasharray: 240, strokeDashoffset: 240 }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", stagger: 0.08 }, at);
});
tl.fromTo("#capd1, #capd2", { scaleY: 0, transformOrigin: "center top" }, { scaleY: 1, duration: 0.9, ease: E, stagger: 1.1 }, 20.5);

// 06 — AUM
cam("#s6 .cam", 24, 6.8, 1.0, 1.1, [{ yPercent: 0 }, { yPercent: 2 }]);
tl.fromTo("#s6 .dash", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.8, ease: E }, 24.4);
tl.fromTo("#s6 .eyebrow", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, ease: E }, 24.5);
tl.fromTo("#s6 .s6-h", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: E }, 24.6);
tl.fromTo("#s6 .s6-sub", { opacity: 0 }, { opacity: 1, duration: 1 }, 25.0);
tl.fromTo("#s6 .aum", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out" }, 25.4);
counter("#s6-num", 3, 25.5, 2.4, (v) => (v < 2.995 ? v.toFixed(1) : "3"));
tl.fromTo("#s6 .aum-label", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.9, ease: E }, 26.6);
tl.fromTo("#s6-line", { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: "expo.out" }, 26.8);

// 07 — 2025
cam("#s7 .cam", 30, 4.8, 1.06, 1.0);
tl.fromTo("#s7 .dash", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.8, ease: E }, 30.4);
tl.fromTo("#s7 .s7-h", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: E }, 30.5);
tl.fromTo("#s7 .s7-sub", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, ease: E }, 30.9);
tl.fromTo(".yd", { yPercent: 105 }, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.13 }, 31.0);

// 08 — acquisitions
tl.fromTo("#s8-p1", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.2, ease: "expo.inOut" }, 34.0);
tl.fromTo("#s8-p2", { clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)", duration: 1.2, ease: "expo.inOut" }, 35.8);
cam("#s8-p1 .cam", 34, 5.8, 1.12, 1.02);
cam("#s8-p2 .cam", 35.8, 4.0, 1.12, 1.04);
tl.fromTo("#s8-l1", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out" }, 34.9);
tl.fromTo("#s8-l2", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out" }, 36.7);
tl.fromTo("#s8-rule", { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: "expo.inOut" }, 35.8);
tl.fromTo("#s8 .s8-top", { opacity: 0 }, { opacity: 1, duration: 1 }, 34.6);

// 09 — people
cam("#s9 .cam", 39, 8.8, 1.08, 1.0);
tl.fromTo("#s9 .dash", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.8, ease: E }, 39.4);
tl.fromTo("#s9 .eyebrow", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, ease: E }, 39.5);
tl.fromTo("#s9 .s9-h", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, ease: E }, 39.7);
tl.fromTo(".tm", { opacity: 0.08, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 0.9, scale: 1, duration: 0.5, ease: "power2.out", stagger: 0.022 }, 40.8);
tl.fromTo("#f1", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out" }, 40.8);
counter("#s9-n1", 90, 40.9, 2.0);
tl.fromTo("#fd1", { scaleY: 0 }, { scaleY: 1, duration: 0.8, ease: E }, 42.4);
tl.fromTo("#f2", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out" }, 42.6);
counter("#s9-n2", 4, 42.7, 1.2);
tl.fromTo("#fd2", { scaleY: 0 }, { scaleY: 1, duration: 0.8, ease: E }, 44.2);
tl.fromTo("#f3", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out" }, 44.4);
counter("#s9-n3", 20, 44.5, 1.6);

// 10 — gratitude
cam("#s10 .cam", 47, 5.8, 1.12, 1.03, [{ xPercent: -2 }, { xPercent: 0 }]);
tl.fromTo("#s10 .dash", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.8, ease: E }, 47.5);
lines("#s10 .s10-h", 47.6);
tl.fromTo("#s10 .s10-sub", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.2, ease: E }, 48.8);

// 11 — looking ahead: the camera widens
cam("#s11 .cam", 52, 4.8, 1.35, 1.0, [{ yPercent: 6 }, { yPercent: 0 }]);
tl.fromTo("#s11 .eyebrow", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, ease: E }, 52.5);
tl.fromTo("#s11 .s11-h", { opacity: 0, y: 30, scale: 1.04 }, { opacity: 1, y: 0, scale: 1, duration: 2, ease: E }, 52.7);

// 12 — anniversary identity
cam("#s12 .cam", 56, 4, 1.0, 1.04);
tl.fromTo("#s12-wm", { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 1.4, ease: "expo.out" }, 56.4);
tl.fromTo("#s12-rule", { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: "expo.out" }, 56.8);
tl.fromTo("#s12-5", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 1.4, ease: "expo.out" }, 57.0);
tl.fromTo("#s12-tag", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.2, ease: E }, 57.6);
tl.fromTo("#s12-disc", { opacity: 0 }, { opacity: 1, duration: 1 }, 58.0);
tl.to("#s12 .fade", { opacity: 0, duration: 0.6, ease: "power1.in" }, 59.4);

window.__timelines["main"] = tl;
`;

const html = `<!doctype html>
<html lang="en" data-resolution="landscape">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<title>InCred Global — The First Five Years</title>
<script src="assets/vendor/gsap.min.js"></script>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="60" data-width="1920" data-height="1080">
${scenes.join('\n')}
<div class="vignette"></div>
<div class="grain"></div>
<audio id="score" src="assets/score.m4a" data-start="0" data-duration="60" data-track-index="5" data-volume="0.9"></audio>
</div>
<script>${js}</script>
</body>
</html>`;

fs.writeFileSync(new URL('../index.html', import.meta.url), html);
console.log('index.html', (html.length / 1024).toFixed(0) + 'KB');
