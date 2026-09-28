// Character rig: a character is a list of simple parts drawn in order, in local
// coordinates with the origin at the FEET (y is negative going up). A pose moves the
// whole body (x, y, squash/stretch, tilt, turn) and each part (rotate around its pivot,
// offset, scale). Works for pixel characters (rects, no ink) and storybook characters
// (ellipses with ink outlines and a painted pigment fill).
//
// rig = {
//   ink: { color: '#4A3428', width: 5 } | null,
//   fills: { body: '#F4E9DA' | CanvasPattern, ... },         // set patterns in STORY.setup
//   parts: [ { name, key?, shape: 'ellipse'|'rect'|'rrect'|'poly',
//              x, y, w, h, r?, pts?, pivot: [px, py], fill: 'body', ink?: true, face?: false } ],
//   eyes:  [ { x, y, w, h, shape: 'oval'|'rect', glint?: true } ],
//   eyeColor: '#1A1412',
//   faceKey: 'head',                        // eyes + face extras follow this part's transform
//   face: (ctx, pose) => {},               // nose, mouth, cheeks... in local coords
// }
//   ellipse: x,y = centre, w,h = full size.   rect / rrect: x,y = top-left.
//   key: pose key to read (default = name); give an ear and its inner-ear the same key.
//
// pose = { x, y, sx, sy, rot, turn, alpha,
//          parts: { [key]: { rot, dx, dy, s } },
//          eye: { open, dx, dy, s, mode: 'normal'|'happy'|'closed' } }
//   turn = cos(spin angle): scales x; below 0 is the back view (no eyes / face).
(function () {
  const Rig = {};

  Rig.pose = (o = {}) => Object.assign({
    x: 0, y: 0, sx: 1, sy: 1, rot: 0, turn: 1, alpha: 1, parts: {},
    eye: { open: 1, dx: 0, dy: 0, s: 1, mode: 'normal' },
  }, o);

  const partPose = (pose, key) => pose.parts[key] || {};

  function bodyMatrix(pose) {
    return new DOMMatrix().translate(pose.x, pose.y).rotate(pose.rot * 180 / Math.PI).scale(pose.sx * pose.turn, pose.sy);
  }
  function partMatrix(part, pp) {
    const [px, py] = part.pivot || [0, 0];
    return new DOMMatrix().translate(px + (pp.dx || 0), py + (pp.dy || 0)).rotate((pp.rot || 0) * 180 / Math.PI)
      .scale(pp.s ?? 1, pp.s ?? 1).translate(-px, -py);
  }

  function pathOf(ctx, part) {
    ctx.beginPath();
    if (part.shape === 'ellipse') ctx.ellipse(part.x, part.y, part.w / 2, part.h / 2, part.a || 0, 0, Math.PI * 2);
    else if (part.shape === 'rect') ctx.rect(part.x, part.y, part.w, part.h);
    else if (part.shape === 'rrect') ctx.roundRect(part.x, part.y, part.w, part.h, part.r ?? 12);
    else if (part.shape === 'poly') G.tracePts(ctx, part.pts, true);
  }

  // world position of a local point attached to a part (e.g. a paw holding a flower)
  Rig.point = (rig, pose, key, lx, ly) => {
    const part = rig.parts.find((p) => (p.key || p.name) === key);
    let m = bodyMatrix(pose);
    if (part) m = m.multiply(partMatrix(part, partPose(pose, key)));
    const q = m.transformPoint(new DOMPoint(lx, ly));
    return [q.x, q.y];
  };

  Rig.draw = (ctx, rig, pose, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= pose.alpha ?? 1;
    const bm = bodyMatrix(pose);
    const ink = o.noInk ? null : rig.ink;
    for (const part of rig.parts) {
      const key = part.key || part.name;
      const pp = partPose(pose, key);
      if (pp.hide) continue;
      if (part.face && pose.turn < 0) continue;
      ctx.save();
      ctx.setTransform(ctx.getTransform().multiply(bm).multiply(partMatrix(part, pp)));
      pathOf(ctx, part);
      ctx.fillStyle = o.fill ?? rig.fills[part.fill] ?? part.fill ?? '#999';
      ctx.fill();
      if (ink && part.ink !== false && !o.fill) {
        ctx.lineWidth = ink.width; ctx.strokeStyle = ink.color; ctx.lineJoin = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }
    if (!o.noFace && pose.turn >= 0.05) {
      const fp = rig.faceKey ? rig.parts.find((p) => (p.key || p.name) === rig.faceKey) : null;
      ctx.setTransform(ctx.getTransform().multiply(bm).multiply(fp ? partMatrix(fp, partPose(pose, rig.faceKey)) : new DOMMatrix()));
      drawEyes(ctx, rig, pose.eye || {});
      if (rig.face) rig.face(ctx, pose);
    }
    ctx.restore();
  };

  function drawEyes(ctx, rig, e) {
    const col = rig.eyeColor || '#1A1412';
    for (const eye of rig.eyes || []) {
      const s = e.s ?? 1, x = eye.x + (e.dx || 0), y = eye.y + (e.dy || 0);
      const w = eye.w * s, h = eye.h * s;
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
      if (e.mode === 'happy') {
        if (eye.shape === 'rect') { // pixel chevron
          const b = w * 0.6;
          ctx.fillRect(x - 1.5 * b, y - 0.3 * b, b, b); ctx.fillRect(x - 0.5 * b, y - 1.3 * b, b, b); ctx.fillRect(x + 0.5 * b, y - 0.3 * b, b, b);
        } else {
          ctx.lineWidth = Math.max(4, w * 0.35);
          ctx.beginPath(); ctx.arc(x, y + h * 0.2, w * 0.7, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        }
      } else if (e.mode === 'closed') {
        if (eye.shape === 'rect') ctx.fillRect(x - w * 0.7, y - 4, w * 1.4, 8);
        else { ctx.lineWidth = Math.max(4, w * 0.3); ctx.beginPath(); ctx.arc(x, y - h * 0.1, w * 0.7, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
      } else {
        const hh = Math.max(eye.shape === 'rect' ? 6 : 3, h * (e.open ?? 1));
        ctx.beginPath();
        if (eye.shape === 'rect') ctx.rect(x - w / 2, y - hh / 2, w, hh);
        else ctx.ellipse(x, y, w / 2, hh / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        if (eye.glint && (e.open ?? 1) > 0.5) {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(x - w * 0.18, y - hh * 0.22, Math.max(2, w * 0.2), 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }

  // rim light / tint over the whole silhouette (e.g. a glowing screen beside the character)
  Rig.tint = (ctx, rig, pose, fill, alpha, mode = 'screen') => {
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.globalAlpha = alpha;
    Rig.draw(ctx, rig, pose, { fill, noFace: true, noInk: true });
    ctx.restore();
  };

  window.Rig = Rig;
})();
