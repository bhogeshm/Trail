// Engine core: global config, math, easing, seeded random, shape helpers.
// Loaded first. The story file calls G.config({...}) right after this.
(function () {
  const G = {};

  G.config = (c = {}) => {
    Object.assign(G, { W: 1920, H: 1080, FPS: 24, DURATION: 15, slug: 'video', paper: '#FBF3E6' }, c);
    G.TOTAL = Math.round(G.FPS * G.DURATION);
  };
  G.config();

  // ---- math
  G.TAU = Math.PI * 2;
  G.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.seg = (t, a, b) => G.clamp((t - a) / (b - a)); // 0..1 progress of t through [a,b]
  G.smooth = (t) => t * t * (3 - 2 * t);
  G.easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  G.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  G.easeIn = (t) => t * t * t;
  G.easeOutBack = (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  // damped spring: 1 at dt=0, wobbles toward 0 (use for landings: squash = 1 - k*spring)
  G.spring = (dt, freq = 2.4, damp = 7) => (dt <= 0 ? 1 : Math.exp(-damp * dt) * Math.cos(G.TAU * freq * dt));
  // 0 -> 1 -> 0 hump over [a,b]
  G.pulse = (t, a, b) => (t < a || t > b ? 0 : Math.sin(Math.PI * (t - a) / (b - a)));
  // eye openness for a blink starting at t0 (1 open, 0 shut)
  G.blink = (t, t0, d = 0.14) => (t < t0 || t > t0 + d ? 1 : Math.abs((2 * (t - t0)) / d - 1));
  // parabolic hop from (x0,y0) to (x1,y1) with apex height h; s in 0..1
  G.hop = (s, x0, y0, x1, y1, h) => [G.lerp(x0, x1, s), G.lerp(y0, y1, s) - h * 4 * s * (1 - s)];

  G.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // ---- shape point lists (used by the painter and for clip paths)
  G.rrect = (x, y, w, h, r, seg = 5) => {
    const pts = [];
    const corners = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
    for (const [cx, cy, a0] of corners) {
      for (let i = 0; i <= seg; i++) {
        const a = a0 + (i / seg) * (Math.PI / 2);
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    }
    return pts;
  };
  G.ellipsePts = (cx, cy, rx, ry, n = 36, a0 = 0, a1 = Math.PI * 2) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return pts;
  };
  // trace a point list into the current canvas path
  G.tracePts = (ctx, pts, close = true) => {
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (close) ctx.closePath();
  };

  window.G = G;
})();
