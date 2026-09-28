// Compositor helpers shared by stories: shadows, clipped sprites, pose blending,
// motion ghosts, dust puffs, confetti/petal particles, sticker text, cartoon FX lines.
(function () {
  const { TAU, clamp, lerp, seg, easeOut, easeOutBack } = G;
  const K = {};

  K.line = (ctx, x1, y1, x2, y2, w, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };

  // soft contact shadow that shrinks and fades as the thing rises (h = height above ground)
  K.shadow = (ctx, x, groundY, rx, h = 0, o = {}) => {
    const f = clamp(h / (o.fade ?? 320));
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(${o.rgb ?? '150,105,70'},${(o.alpha ?? 0.42) * (1 - 0.7 * f)})`;
    ctx.beginPath();
    ctx.ellipse(x, groundY + 2, rx * (1 - 0.45 * f), (o.ry ?? 15) * (1 - 0.45 * f), 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  // draw a painted image clipped to a path built by pathFn(ctx) — same coordinate space
  K.clipDraw = (ctx, img, x, y, pathFn, rule = 'nonzero') => {
    ctx.save();
    ctx.beginPath(); pathFn(ctx); ctx.clip(rule);
    ctx.drawImage(img, x, y);
    ctx.restore();
  };

  // redraw part of the background over a character: cheap occlusion for "hide behind X"
  K.occlude = (ctx, bgImage, pathFn) => K.clipDraw(ctx, bgImage, 0, 0, pathFn);

  // numeric blend of two nested pose objects (ease out of one action into another)
  K.blendPose = (A, B, k) => {
    if (typeof A === 'number' && typeof B === 'number') return lerp(A, B, k);
    if (Array.isArray(B)) return B.map((v, i) => K.blendPose(A?.[i] ?? v, v, k));
    if (B && typeof B === 'object') {
      const o = {};
      for (const key of Object.keys(B)) o[key] = K.blendPose(A?.[key] ?? B[key], B[key], k);
      return o;
    }
    return B;
  };

  // translucent copies of recent poses when something moves fast (cartoon smear)
  K.ghosts = (poseAt, t, o = {}) => {
    const out = [];
    const P = poseAt(t);
    for (const [dt, a] of o.steps ?? [[2 / 48, 0.13], [1 / 48, 0.24]]) {
      const Q = poseAt(t - dt);
      if ((o.skip && (o.skip(Q) || o.skip(P))) || Math.hypot(Q.x - P.x, Q.y - P.y) < (o.minDist ?? 28)) continue;
      out.push([Q, a]);
    }
    return out; // [[pose, alpha], ...] — draw these before the real pose
  };

  // dust puffs: collect bursts, then draw(ctx, t)
  K.puffs = (seed = 77) => {
    const R = G.rng(seed), list = [];
    return {
      burst(t0, x, y, n = 4, spread = 260, size = 1) {
        for (let i = 0; i < n; i++) {
          const dir = n === 1 ? 1 : (i / (n - 1)) * 2 - 1;
          list.push({ t0: t0 + R() * 0.04, x: x + dir * spread * 0.5, y: y - R() * 8, vx: dir * (110 + R() * 90), vy: -(25 + R() * 35), r: (13 + R() * 9) * size });
        }
      },
      trail(t0, x, y, dir = 1, size = 1) { list.push({ t0, x, y, vx: 70 * dir, vy: -30, r: (14 + R() * 8) * size }); },
      draw(ctx, t, o = {}) {
        for (const f of list) {
          const a = t - f.t0;
          if (a < 0 || a > 0.45) continue;
          const s = a / 0.45, r = f.r * (0.6 + 1.1 * easeOut(s));
          const x = f.x + f.vx * a, y = f.y + f.vy * a - 10;
          ctx.fillStyle = `rgba(${o.fill ?? '253,245,230'},${0.8 * (1 - s)})`;
          ctx.strokeStyle = `rgba(${o.edge ?? '200,165,120'},${0.35 * (1 - s)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.moveTo(x - r * 0.55 + r * 0.6, y + r * 0.25); ctx.arc(x - r * 0.55, y + r * 0.25, r * 0.6, 0, TAU);
          ctx.moveTo(x + r * 0.6 + r * 0.55, y + r * 0.3); ctx.arc(x + r * 0.6, y + r * 0.3, r * 0.55, 0, TAU);
          ctx.fill(); ctx.stroke();
        }
      },
    };
  };

  // confetti / petals / leaves. Pieces fly (burst) or fall (rain), then rest on the ground.
  // spec: { seed, palette, bursts:[{t0,x,y,w,h,n,speed}], rain:{t0,t1,n,speed:[a,b],sway:[a,b]},
  //         rest:[yMin,yMax], shapes:['rect','square','dot','strip','petal'] }
  K.particles = (spec) => {
    const R = G.rng(spec.seed ?? 99), pieces = [];
    const pal = spec.palette ?? ['#E8654A', '#2FA7A0', '#F2B233', '#7C6BE0', '#3F9BE8', '#E0559B', '#4CB861'];
    const shapes = spec.shapes ?? ['rect', 'square', 'dot', 'strip'];
    const dims = { rect: [18, 10], square: [13, 13], dot: [12, 12], strip: [26, 6], petal: [20, 12] };
    const [r0, r1] = spec.rest ?? [850, 1000];
    const mk = (o) => {
      o.color = pal[Math.floor(R() * pal.length)];
      o.shape = shapes[Math.floor(R() * shapes.length)];
      [o.w, o.h] = dims[o.shape];
      o.rot0 = R() * TAU; o.spin = (R() - 0.5) * 12; o.flip = 4 + R() * 8; o.ph = R() * TAU;
      o.restY = r0 + R() * (r1 - r0); o.restRot = R() * TAU;
      pieces.push(o);
    };
    for (const b of spec.bursts ?? []) {
      for (let i = 0; i < (b.n ?? 60); i++) {
        const sp = b.speed ?? 1;
        mk({ kind: 'burst', t0: b.t0 + R() * 0.12, x0: b.x + (R() - 0.5) * (b.w ?? 200), y0: b.y + (R() - 0.5) * (b.h ?? 40),
          vx: (R() - 0.5) * 1300 * sp, vy: -(900 + R() * 900) * sp });
      }
    }
    if (spec.rain) {
      const r = spec.rain, [s0, s1] = r.speed ?? [300, 470], [w0, w1] = r.sway ?? [18, 58];
      for (let i = 0; i < (r.n ?? 120); i++) {
        mk({ kind: 'rain', t0: r.t0 + R() * (r.t1 - r.t0), x0: (r.x0 ?? 0) + R() * ((r.x1 ?? G.W) - (r.x0 ?? 0)), y0: -40 - R() * 60,
          speed: s0 + R() * (s1 - s0), sway: w0 + R() * (w1 - w0), freq: 0.9 + R() * 1.6 });
      }
    }
    const pos = (c, t) => {
      const a = t - c.t0;
      if (a < 0) return null;
      if (c.kind === 'burst') { // drag + gravity, y grows downward: v' = g - k v
        const k = 3.2, g = 950, ek = 1 - Math.exp(-k * a);
        const x = c.x0 + (c.vx / k) * ek + 20 * Math.sin(a * 5 + c.ph) * seg(a, 0.5, 1.2);
        const y = c.y0 + (g / k) * a + ((c.vy - g / k) * ek) / k;
        const falling = g / k + (c.vy - g / k) * Math.exp(-k * a) > 0;
        if (falling && y >= c.restY) return { x, y: c.restY, rest: true };
        return { x, y, rest: false, a };
      }
      const y = c.y0 + c.speed * a;
      const x = c.x0 + c.sway * Math.sin(a * TAU * c.freq + c.ph);
      if (y >= c.restY) {
        const ar = (c.restY - c.y0) / c.speed;
        return { x: c.x0 + c.sway * Math.sin(ar * TAU * c.freq + c.ph), y: c.restY, rest: true };
      }
      return { x, y, rest: false, a };
    };
    return {
      // resting=true: pieces lying on the ground (draw before characters)
      // resting=false: pieces in the air (draw after characters)
      draw(ctx, t, resting) {
        for (const c of pieces) {
          const q = pos(c, t);
          if (!q || q.rest !== resting || q.x < -40 || q.x > G.W + 40 || q.y < -60) continue;
          ctx.save();
          ctx.translate(q.x, q.y);
          ctx.fillStyle = c.color;
          if (resting) { ctx.rotate(c.restRot); ctx.scale(1, 0.55); }
          else { ctx.rotate(c.rot0 + c.spin * q.a); ctx.scale(1, Math.cos(c.flip * q.a + c.ph)); }
          if (c.shape === 'dot') { ctx.beginPath(); ctx.arc(0, 0, c.w / 2, 0, TAU); ctx.fill(); }
          else if (c.shape === 'petal') { ctx.beginPath(); ctx.ellipse(0, 0, c.w / 2, c.h / 2, 0, 0, TAU); ctx.fill(); }
          else ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
          ctx.restore();
        }
      },
    };
  };

  // text with a thick paper-coloured outline (floating code glyphs, "!", notes...)
  K.sticker = (ctx, text, x, y, o = {}) => {
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.translate(x, y);
    ctx.rotate(o.rot ?? 0);
    ctx.scale(o.scale ?? 1, o.scale ?? 1);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.font = `700 ${Math.round(o.size ?? 44)}px ${o.font ?? 'Menlo, "DejaVu Sans Mono", monospace'}`;
    ctx.lineWidth = o.outline ?? 10;
    ctx.strokeStyle = o.paper ?? '#FFF8EC';
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = o.color ?? '#E8654A';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };

  // a sticker that pops in, floats up and fades: p = {t0, x0, y0, vx, vy, life, text, color, size, rot0, spin, ph}
  K.floater = (ctx, f, t) => {
    const a = t - f.t0;
    if (a < 0 || a > f.life) return;
    const x = f.x0 + f.vx * a + 14 * Math.sin(a * 4 + (f.ph ?? 0));
    const y = f.y0 + f.vy * (a - 0.28 * a * a);
    K.sticker(ctx, f.text, x, y, {
      size: f.size, color: f.color, rot: (f.rot0 ?? 0) + (f.spin ?? 0) * a,
      scale: easeOutBack(seg(a, 0, 0.25), 2.2), alpha: seg(a, 0, 0.06) * (1 - seg(a, f.life - 0.4, f.life)), font: f.font,
    });
  };

  // "!" emanata: short strokes radiating above a head at (x, y); k = 0..1 strength
  K.surprise = (ctx, x, y, k, col = '51,36,30') => {
    if (k <= 0) return;
    const s = easeOutBack(clamp(k * 1.6), 2);
    for (const a of [-2.2, -1.57, -0.94]) {
      const r0 = 34 * s, r1 = 78 * s;
      K.line(ctx, x + Math.cos(a) * r0, y + Math.sin(a) * r0 - 6, x + Math.cos(a) * r1, y + Math.sin(a) * r1 - 6, 7, `rgba(${col},${Math.min(1, k * 2)})`);
    }
  };

  // impact burst lines around a point on the ground; s = 0..1 progress
  K.impact = (ctx, cx, cy, s, n = 9, r = 70, col = '51,36,30') => {
    if (s <= 0 || s >= 1) return;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI + 0.15 + (i / (n - 1)) * (Math.PI - 0.3);
      const r0 = r + r * easeOut(s), r1 = r0 + 36 * (1 - s) + 8;
      K.line(ctx, cx + Math.cos(a) * r0 * 1.15, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1 * 1.15, cy + Math.sin(a) * r1, 7, `rgba(${col},${1 - s})`);
    }
  };

  // camera kick for impacts: call at the start of frame(); returns true while active
  K.kick = (ctx, t, t0, amp = 1) => {
    if (t < t0 || t - t0 > 0.5) return false;
    const k = G.spring(t - t0, 5, 10) * amp;
    const z = 1 + 0.012 * Math.abs(k);
    ctx.translate(G.W / 2 + 6 * k, G.H / 2 + 5 * k);
    ctx.scale(z, z);
    ctx.translate(-G.W / 2, -G.H / 2);
    return true;
  };

  // additive light (screens, lanterns, magic): radial glow + optional rays
  K.glow = (ctx, x, y, r, rgb, a, o = {}) => {
    if (a <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(x, y);
    if (o.rays) {
      for (let i = 0; i < o.rays; i++) {
        const ang = (i / o.rays) * TAU + (o.spin ?? 0);
        const rg = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.5);
        rg.addColorStop(0, `rgba(${rgb},${0.25 * a})`); rg.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 1.5, ang - 0.07, ang + 0.07); ctx.closePath(); ctx.fill();
      }
    }
    const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, 2 * r, 2 * r);
    ctx.restore();
  };

  window.K = K;
})();
