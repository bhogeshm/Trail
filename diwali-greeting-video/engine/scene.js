// Compositor: a 2D p5 sketch that calls STORY.frame() for a time t and then adds the
// paper finish (vignette + grain). Every frame is a pure function of t, so frames can be
// rendered in any order and the renderer can step exactly 1/FPS at a time.
(function () {
  window.startScene = function (opts = {}) {
    const S = window.STORY;
    return paintAssets(S.paint || []).then((A) => new Promise((resolve) => {
      new p5((p) => {
        let ctx, grain, vignette, started = 0;
        const fin = Object.assign({ grain: 0.28, vignette: 'rgb(214,176,140)' }, S.finish || {});

        p.setup = () => {
          const c = p.createCanvas(G.W, G.H);
          if (opts.parent) c.parent(opts.parent);
          p.pixelDensity(1);
          ctx = p.drawingContext;
          if (fin.grain) grain = makeGrain();
          if (fin.vignette) vignette = makeVignette(fin.vignette);
          if (S.setup) S.setup({ p, ctx, A });
          G.cues = S.cues ? S.cues() : {};
          if (opts.render) p.noLoop();
          started = p.millis();
          resolve({
            canvas: c.elt,
            drawFrame,
            renderFrame: (i) => { drawFrame(i / G.FPS); return c.elt.toDataURL('image/png'); },
          });
        };

        p.draw = () => {
          if (opts.render) return;
          const t = opts.still != null ? opts.still : ((p.millis() - started) / 1000) % G.DURATION;
          drawFrame(t);
        };

        function drawFrame(t) {
          t = G.clamp(t, 0, G.DURATION - 1e-6);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          p.background(G.paper);
          ctx.save();
          S.frame({ p, ctx, A, t });
          ctx.restore();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.save();
          if (vignette) { ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(vignette, 0, 0); }
          if (grain) { ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = fin.grain; ctx.drawImage(grain, 0, 0); }
          ctx.restore();
        }

        // paper tooth: low-frequency mottling + fine noise, blended with 'overlay'
        function makeGrain() {
          const g = p.createGraphics(G.W, G.H);
          g.pixelDensity(1);
          const R = G.rng(3), lw = 96, lh = 54;
          const low = document.createElement('canvas'); low.width = lw; low.height = lh;
          const lctx = low.getContext('2d'), lid = lctx.createImageData(lw, lh);
          for (let i = 0; i < lw * lh; i++) {
            const v = 128 + (R() - 0.5) * 26;
            lid.data[i * 4] = lid.data[i * 4 + 1] = lid.data[i * 4 + 2] = v; lid.data[i * 4 + 3] = 255;
          }
          lctx.putImageData(lid, 0, 0);
          const gc = g.drawingContext;
          gc.imageSmoothingEnabled = true;
          gc.drawImage(low, 0, 0, G.W, G.H);
          const id = gc.getImageData(0, 0, G.W, G.H);
          for (let i = 0; i < G.W * G.H; i++) {
            const n = (R() + R() - 1) * 30;
            id.data[i * 4] += n; id.data[i * 4 + 1] += n; id.data[i * 4 + 2] += n;
          }
          gc.putImageData(id, 0, 0);
          return g.elt;
        }
        function makeVignette(edge) {
          const g = p.createGraphics(G.W, G.H);
          g.pixelDensity(1);
          const gc = g.drawingContext;
          const rg = gc.createRadialGradient(G.W / 2, G.H * 0.48, G.H * 0.35, G.W / 2, G.H * 0.5, G.H * 1.05);
          rg.addColorStop(0, '#FFFFFF');
          rg.addColorStop(1, edge);
          gc.fillStyle = rg; gc.fillRect(0, 0, G.W, G.H);
          return g.elt;
        }
      }, opts.parent);
    }));
  };
})();
