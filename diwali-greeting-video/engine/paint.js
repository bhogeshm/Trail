// Painter: a hidden WEBGL p5 sketch that runs p5.brush ONCE per asset ("paint job")
// and copies each result into a plain 2D canvas. The compositor reuses these every frame,
// so the watercolor texture stays still instead of flickering.
//
// A paint job: { name, draw(k), w?, h?, paper?, seed? }
//   - drawn at the top-left of a W x H canvas filled with `paper`, then the (w x h)
//     corner is copied out as assets[name].
//   - p5.brush pigment mixes with the paper, so there is no real transparency: paint
//     sprites on white (or any paper) and clip them to their outline when compositing.
(function () {
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  // The brush kit handed to every job's draw(k)
  function makeKit(p) {
    const k = { p, brush, R: Math.random };
    k.rand = (a = 1, b) => (b === undefined ? k.R() * a : a + k.R() * (b - a));
    // split long edges so watercolor bleed deforms smoothly (long bare edges -> sawtooth)
    k.dense = (pts, step = 36) => {
      const out = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
        for (let j = 0; j < n; j++) out.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]);
      }
      return out;
    };
    // flat opaque color (fast, no texture) — use as a base under water()
    k.wash = (pts, color, op = 255) => {
      brush.noStroke(); brush.noFill(); brush.noHatch();
      brush.wash(color, op);
      brush.polygon(pts);
      brush.noWash();
    };
    // watercolor fill: bleed 0.01–0.05 for big shapes, 0.1–0.3 for soft blobs
    k.water = (pts, color, op = 150, bleed = 0.15, tex = 0.5, border = 0.35) => {
      pts = k.dense(pts);
      brush.noStroke(); brush.noWash(); brush.noHatch();
      brush.fill(color, op);
      brush.fillBleed(bleed);
      brush.fillTexture(tex, border);
      brush.polygon(pts);
      brush.noFill();
    };
    // soft round bloom of pigment
    k.blob = (x, y, r, color, op = 110, bleed = 0.3) => {
      brush.noStroke(); brush.noWash(); brush.noHatch();
      brush.fill(color, op);
      brush.fillBleed(bleed);
      brush.fillTexture(0.55, 0.3);
      brush.circle(x, y, r, 0.6);
      brush.noFill();
    };
    // hand-inked line; brushes: 'pen', 'rotring', 'HB', '2B', '2H', 'cpencil', 'marker', 'charcoal'
    k.ink = (pts, closed = false, color = '#3A2A24', w = 1, name = 'pen', curv = 0) => {
      brush.noFill(); brush.noWash(); brush.noHatch();
      brush.set(name, color, w);
      brush.spline(closed ? pts.concat([pts[0]]) : pts, curv);
      brush.noStroke();
    };
    // painted + inked shape in one call
    k.shape = (pts, color, inkColor = '#3A2A24', opts = {}) => {
      k.wash(pts, color, 255);
      if (opts.shade) k.water(pts, opts.shade, opts.shadeOp ?? 100, 0.03, 0.55, 0.45);
      if (inkColor) k.ink(pts, true, inkColor, opts.inkW ?? 1.1, 'pen', opts.curv ?? 0);
    };
    // a square of textured pigment: fill characters with it via ctx.createPattern
    k.pigment = (x, y, s, base, tones, n = 14) => {
      k.wash([[x, y], [x + s, y], [x + s, y + s], [x, y + s]], base, 255);
      for (let i = 0; i < n; i++) k.blob(x + k.rand(0, s), y + k.rand(0, s), k.rand(s * 0.08, s * 0.22), tones[i % tones.length], k.rand(35, 60), 0.35);
    };
    // paper-edged horizontal band, e.g. a floor or distant hills
    k.band = (y0, y1, color, op = 230, wobble = 0) => {
      const top = [];
      for (let x = -60; x <= G.W + 60; x += 40) top.push([x, y0 + (wobble ? Math.sin(x * 0.004 + k.rand(0, 6)) * wobble : 0)]);
      k.water(top.concat([[G.W + 60, y1], [-60, y1]]), color, op, 0.015, 0.5, 0.08);
    };
    k.copyOut = (x, y, w, h) => {
      const c = makeCanvas(w, h);
      c.getContext('2d').drawImage(p.canvas, x, y, w, h, 0, 0, w, h);
      return c;
    };
    return k;
  }

  window.paintAssets = function (jobs = []) {
    const { W, H } = G;
    return new Promise((resolve) => {
      const assets = {};
      if (!jobs.length) { resolve(assets); return; }
      const holder = document.createElement('div');
      holder.style.cssText = 'position:absolute;left:-99999px;top:0;';
      document.body.appendChild(holder);

      new p5((p) => {
        brush.instance(p);
        let step = 0, k;

        p.setup = () => {
          const c = p.createCanvas(W, H, p.WEBGL);
          c.parent(holder);
          p.pixelDensity(1);
          p.setAttributes('preserveDrawingBuffer', true);
          brush.load();
          brush.scaleBrushes((G.brushScale ?? 3.2) * (W / 1920)); // 3.2 looks right at 1080p
          k = makeKit(p);
        };

        // one job per frame: p5.brush flushes at the end of draw(), so the copy
        // of job N happens at the start of frame N+1
        p.draw = () => {
          if (step > 0) {
            const j = jobs[step - 1];
            assets[j.name] = k.copyOut(0, 0, j.w || W, j.h || H);
          }
          if (step >= jobs.length) {
            p.noLoop(); p.remove(); holder.remove();
            resolve(assets);
            return;
          }
          const j = jobs[step];
          p.clear();
          p.background(j.paper || G.paper);
          const seed = j.seed ?? (step + 1) * 101;
          p.randomSeed(seed); p.noiseSeed(seed);
          k.R = G.rng(seed);
          p.push();
          p.translate(-W / 2, -H / 2); // WEBGL origin is the centre; jobs use top-left coords
          j.draw(k);
          p.pop();
          step++;
        };
      });
    });
  };
})();
