// STORY: "Diwali Terrace" — a 15-second vertical (1080x1920) Diwali greeting.
// Everything is a pure function of time t in seconds. One painted establishing
// background (bg) covers the whole terrace top-to-bottom; a virtual camera
// (translate + scale) pushes, tilts and pulls back across it. Hero props (diya,
// rangoli, lantern, plate, ladoos) are separate sprites composited on top so
// close-ups stay crisp. A single travelling spark links beats 1->2->3.
//
//   0.0–4.0   extreme close-up on a diya beside rangoli; flame settles, an ember
//             lifts off the wick, camera tilts up and the diya slips out of frame
//   4.0–8.0   the ember becomes a golden firework; two smaller ones stagger behind;
//             camera follows a falling spark down-right past a swaying lantern,
//             revealing the terrace
//   8.0–12.0  medium close-up: a woman in red-and-gold takes one bite of a ladoo
//             from a separate ladoo in her right hand, pauses, smiles, lowers it
//   12.0–15.0 camera pulls back, she settles lower-right; "Happy Diwali" + wish
//             reveal in the open space; diyas flicker, lantern sways, hold
(function () {
  G.config({ W: 1080, H: 1920, FPS: 24, DURATION: 15, slug: 'diwali-greeting', paper: '#1B1330' });
  const { TAU, clamp, lerp, seg, smooth, easeInOut, easeOut, easeIn, easeOutBack, spring, pulse, blink, rng } = G;

  const INK = '#3A2214';
  const COL = {
    skyTop: '#11123A', skyMid: '#2A2560', skyLow: '#4A3160',
    moon: '#F6E7B0', skyline: '#241C3E',
    stone: '#E7D8BE', stoneShade: '#C7AE86', stoneDeep: '#8C7050', railing: '#B79C82',
    clay: '#B5622C', clayDeep: '#7C4020', oil: '#F4B942',
    flameCore: '#FFE9A0', flameMid: '#FFA23C', flameOut: '#E85A2B',
    gold: '#F3B93C', goldDeep: '#C98A1E',
    saffron: '#E2733D', terracotta: '#B5502B',
    lanternPaper: '#F0863C', lanternPaper2: '#FBB03B',
    marigold: '#F5A427', marigoldDeep: '#D9861B',
    skin: '#CE9868', skinShade: '#A96F45',
    outfitRed: '#A21F35', outfitRedDeep: '#7A1526', outfitGold: '#E8B23D',
    hair: '#241812',
  };

  // ---- world marks (1080x1920 painted background)
  const DIYA_POS = { x: 500, y: 1520 };
  const RANGOLI_POS = { x: 235, y: 1560 };
  const FLAME_POS = { x: DIYA_POS.x + 95, y: DIYA_POS.y - 65 };
  const WOMAN_FEET0 = { x: 700, y: 1650 };
  const LANTERN_ANCHOR = { x: 780, y: 640 }; // cord attaches here, hangs down
  const FW1 = { x: 560, y: 560 }; // main firework ignition point
  const FW2 = { x: 260, y: 700 };
  const FW3 = { x: 860, y: 440 };

  // ---- camera: keyframes of (cx, cy, z), clamped so the view never runs off `bg`
  const CAM = [
    [0.0, 490, 1420, 2.40],
    [3.3, 495, 1400, 2.65],
    [4.15, 520, 760, 1.35],
    [5.6, 540, 960, 1.05],
    [6.3, 620, 850, 1.20],
    [8.0, 700, 1150, 1.55],
    [12.0, 700, 1150, 1.55],
    [15.0, 560, 1000, 1.05],
  ];
  function cameraAt(t) {
    let cx = CAM[0][1], cy = CAM[0][2], z = CAM[0][3];
    for (let i = 0; i < CAM.length - 1; i++) {
      const [t0, cx0, cy0, z0] = CAM[i], [t1, cx1, cy1, z1] = CAM[i + 1];
      if (t <= t1 || i === CAM.length - 2) {
        const s = easeInOut(seg(t, t0, t1));
        cx = lerp(cx0, cx1, s); cy = lerp(cy0, cy1, s); z = lerp(z0, z1, s);
        break;
      }
    }
    const halfW = G.W / (2 * z), halfH = G.H / (2 * z);
    cx = clamp(cx, halfW, G.W - halfW);
    cy = clamp(cy, halfH, G.H - halfH);
    return { cx, cy, z };
  }
  function applyCam(ctx, t) {
    const { cx, cy, z } = cameraAt(t);
    ctx.translate(G.W / 2, G.H / 2);
    ctx.scale(z, z);
    ctx.translate(-cx, -cy);
    return { cx, cy, z };
  }

  // ---- ember + falling spark: one travelling light links the three beats
  const bez = (s, p0, p1, p2) => (1 - s) * (1 - s) * p0 + 2 * (1 - s) * s * p1 + s * s * p2;
  function emberPos(t) { // 3.5 -> 4.75, wick to firework 1
    const s = easeInOut(seg(t, 3.5, 4.75));
    return { x: bez(s, FLAME_POS.x, FLAME_POS.x + 40, FW1.x), y: bez(s, FLAME_POS.y - 10, FLAME_POS.y - 420, FW1.y) };
  }
  function fallingSparkPos(t) { // 6.15 -> 7.7, firework 1 down toward the lantern
    const s = easeInOut(seg(t, 6.15, 7.7));
    return { x: bez(s, FW1.x, 900, LANTERN_ANCHOR.x + 30), y: bez(s, FW1.y, 640, LANTERN_ANCHOR.y + 260) };
  }

  // ---- fireworks: deterministic particle sets, drawn additively
  function makeFirework(seed, t0, x, y, scale, rgb, n) {
    const R = G.rng(seed), parts = [];
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + R() * 0.22;
      parts.push({ ang, speed: (230 + R() * 170) * scale, ph: R() * TAU });
    }
    const life = 1.5;
    return {
      t0, x, y, rgb, life,
      draw(ctx, t) {
        const a = t - this.t0;
        if (a < 0 || a > this.life) return;
        const g = 560, k = 2.25, ek = 1 - Math.exp(-k * a);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const p of parts) {
          const vx = Math.cos(p.ang) * p.speed, vy = Math.sin(p.ang) * p.speed - 30;
          const px = this.x + (vx / k) * ek, py = this.y + (g / k) * a + ((vy - g / k) * ek) / k;
          const a2 = Math.max(0, a - 0.045), ek2 = 1 - Math.exp(-k * a2);
          const px2 = this.x + (vx / k) * ek2, py2 = this.y + (g / k) * a2 + ((vy - g / k) * ek2) / k;
          const fade = 1 - clamp(a / this.life);
          ctx.strokeStyle = `rgba(${this.rgb},${0.85 * fade})`;
          ctx.lineWidth = 3 * scale; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(px2, py2); ctx.lineTo(px, py); ctx.stroke();
          ctx.fillStyle = `rgba(255,244,214,${0.9 * fade})`;
          ctx.beginPath(); ctx.arc(px, py, 1.6 * scale, 0, TAU); ctx.fill();
        }
        const flash = 1 - clamp(a / 0.22);
        if (flash > 0) K.glow(ctx, this.x, this.y, 150 * scale, '255,225,170', 0.5 * flash);
        ctx.restore();
      },
    };
  }
  const fireworks = [
    makeFirework(41, 4.75, FW1.x, FW1.y, 1.0, '247,196,90', 22),
    makeFirework(43, 5.05, FW2.x, FW2.y, 0.5, '247,210,150', 12),
    makeFirework(47, 5.4, FW3.x, FW3.y, 0.45, '247,196,90', 12),
  ];

  // ---- the woman: storybook rig with a two-bone right arm (shoulder + elbow)
  const ARM_SH = [66, -470], L1 = 128, L2 = 118; // shoulder pivot, upper-arm / forearm lengths
  const ELBOW_REST = [ARM_SH[0], ARM_SH[1] + L1];
  const WRIST_REST = [ELBOW_REST[0], ELBOW_REST[1] + L2];
  const REST1 = 0.12, REST2 = 0.22; // relaxed elbow-down angles (upper, cumulative)
  const MOUTH1 = 1.58, MOUTH2 = 2.22; // hand-to-mouth angles (numerically solved for the wrist to land near the mouth)

  const woman = {
    ink: { color: INK, width: 4.4 },
    fills: { fabric: COL.outfitRed, skin: COL.skin, gold: COL.outfitGold, saffron: COL.saffron, hair: COL.hair },
    faceKey: 'head',
    eyeColor: '#241812',
    parts: [
      { name: 'dupatta', shape: 'poly', pts: [[-70, -470], [-28, -458], [66, -300], [104, -258], [36, -248], [-98, -436]], pivot: [-70, -470], fill: 'saffron' },
      { name: 'skirt', shape: 'poly', pts: [[-190, 0], [190, 0], [163, -172], [98, -330], [-98, -330], [-163, -172]], pivot: [0, -330], fill: 'fabric' },
      { name: 'sash', shape: 'rrect', x: -96, y: -352, w: 192, h: 24, r: 12, pivot: [0, -330], fill: 'gold' },
      { name: 'bodice', shape: 'ellipse', x: 0, y: -430, w: 188, h: 226, pivot: [0, -330], fill: 'fabric' },
      { name: 'armL', shape: 'ellipse', x: -150, y: -418, w: 46, h: 150, pivot: [-108, -468], fill: 'fabric' },
      { name: 'handL', key: 'armL', shape: 'ellipse', x: -192, y: -336, w: 48, h: 44, pivot: [-108, -468], fill: 'skin', ink: false },
      { name: 'armR_upper', shape: 'ellipse', x: ARM_SH[0], y: ARM_SH[1] + L1 * 0.5, w: 44, h: L1 + 14, pivot: ARM_SH, fill: 'fabric' },
      { name: 'armR_lower', shape: 'ellipse', x: ELBOW_REST[0], y: ELBOW_REST[1] + L2 * 0.5, w: 38, h: L2 + 10, pivot: ELBOW_REST, fill: 'skin' },
      { name: 'handR', key: 'armR_lower', shape: 'ellipse', x: WRIST_REST[0] + 4, y: WRIST_REST[1] + 6, w: 46, h: 42, pivot: ELBOW_REST, fill: 'skin', ink: false },
      { name: 'neck', shape: 'ellipse', x: 0, y: -538, w: 50, h: 56, pivot: [0, -330], fill: 'skin' },
      { name: 'hairBun', shape: 'ellipse', x: 6, y: -712, w: 150, h: 122, pivot: [0, -560], fill: 'hair' },
      { name: 'head', shape: 'ellipse', x: 0, y: -622, w: 208, h: 228, pivot: [0, -560], fill: 'skin' },
      { name: 'hairFrontL', key: 'head', shape: 'ellipse', x: -98, y: -600, w: 44, h: 150, pivot: [0, -560], fill: 'hair', ink: false },
      { name: 'hairFrontR', key: 'head', shape: 'ellipse', x: 98, y: -600, w: 44, h: 150, pivot: [0, -560], fill: 'hair', ink: false },
      { name: 'earrings', key: 'head', shape: 'ellipse', x: 0, y: -510, w: 1, h: 1, pivot: [0, -560], fill: 'gold', ink: false }, // marker (drawn in face)
    ],
    eyes: [
      { x: -48, y: -636, w: 22, h: 28, shape: 'oval', glint: true },
      { x: 48, y: -636, w: 22, h: 28, shape: 'oval', glint: true },
    ],
    face(ctx, pose) {
      // brows
      ctx.strokeStyle = '#241812'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 30, -672); ctx.quadraticCurveTo(d * 50, -680, d * 66, -668); ctx.stroke(); }
      // bindi
      ctx.fillStyle = '#B5233C';
      ctx.beginPath(); ctx.arc(0, -680, 6, 0, TAU); ctx.fill();
      // earrings
      ctx.fillStyle = COL.outfitGold;
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * 100, -520, 9, 0, TAU); ctx.fill(); }
      // blush
      ctx.fillStyle = 'rgba(230,110,110,0.35)';
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * 66, -608, 16, 0, TAU); ctx.fill(); }
      // nose
      ctx.strokeStyle = '#8A5A3A'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(-4, -614); ctx.quadraticCurveTo(-6, -600, 0, -596); ctx.quadraticCurveTo(6, -600, 4, -614); ctx.stroke();
      // mouth: smile that opens for the bite (pose.mouthOpen 0..1)
      const mo = pose.mouthOpen || 0;
      ctx.fillStyle = '#8A3040'; ctx.strokeStyle = '#5C1E28'; ctx.lineWidth = 2;
      ctx.beginPath();
      if (mo < 0.05) {
        ctx.moveTo(-24, -578); ctx.quadraticCurveTo(0, -578 + 10, 24, -578); ctx.quadraticCurveTo(0, -566, -24, -578);
      } else {
        const h = 8 + 22 * mo;
        ctx.ellipse(0, -578 + h * 0.3, 17, h, 0, 0, TAU);
      }
      ctx.fill(); ctx.stroke();
    },
  };

  function armFK(th1, th2) {
    const eDx = -L1 * Math.sin(th1), eDy = L1 * Math.cos(th1) - L1;
    const totalA = th1 + th2;
    const wOffX = -L2 * Math.sin(totalA), wOffY = L2 * Math.cos(totalA) - L2;
    return { elbowDx: eDx, elbowDy: eDy, rot: totalA, lowerDx: eDx + wOffX, lowerDy: eDy + wOffY };
  }

  function womanPoseAt(t) {
    const P = Rig.pose({ x: 0, y: 0, parts: {}, eye: { open: 1, dx: 0, dy: 0, s: 1, mode: 'normal' }, mouthOpen: 0 });
    const part = (k) => (P.parts[k] = P.parts[k] || {});
    const drift = easeInOut(seg(t, 12.3, 14.6));
    P.x = lerp(WOMAN_FEET0.x, WOMAN_FEET0.x + 130, drift);
    P.y = WOMAN_FEET0.y;
    const breathe = Math.sin(t * TAU * 0.5);
    P.sy = 1 + 0.006 * breathe; P.sx = 1 - 0.004 * breathe;

    // left arm: gentle idle, holds the plate
    part('armL').rot = 0.05 * Math.sin(t * 1.3 + 1);

    // right arm: rest -> raise to mouth -> bite -> pause -> lower partway -> hold
    let th1 = REST1, th2 = REST2;
    if (t < 8.6) {
      th1 = REST1; th2 = REST2;
    } else if (t < 9.25) {
      const a = easeOutBack(seg(t, 8.6, 9.25), 1.3);
      th1 = lerp(REST1, MOUTH1, a); th2 = lerp(REST2, MOUTH2, a);
      P.eye.dx = -3 * a; P.eye.dy = 2 * a;
    } else if (t < 10.05) {
      th1 = MOUTH1; th2 = MOUTH2;
      P.mouthOpen = t < 9.42 ? easeOut(seg(t, 9.28, 9.42)) : (t < 9.55 ? lerp(1, 0.55, easeInOut(seg(t, 9.42, 9.55))) : lerp(0.55, 0.16, easeInOut(seg(t, 9.55, 9.9))));
      part('head').dy = -4 * pulse(t, 9.3, 9.5);
      P.eye.s = 1 + 0.12 * pulse(t, 9.35, 9.75);
    } else if (t < 10.6) {
      const a = easeInOut(seg(t, 10.05, 10.6));
      th1 = lerp(MOUTH1, lerp(MOUTH1, REST1, 0.55), a); th2 = lerp(MOUTH2, lerp(MOUTH2, REST2, 0.55), a);
      P.mouthOpen = lerp(0.16, 0.06, a);
    } else {
      th1 = lerp(MOUTH1, REST1, 0.55); th2 = lerp(MOUTH2, REST2, 0.55);
      P.mouthOpen = 0.06 + 0.02 * Math.sin(t * 2);
    }
    const fk = armFK(th1, th2);
    part('armR_upper').rot = th1;
    part('armR_lower').dx = fk.elbowDx; part('armR_lower').dy = fk.elbowDy; part('armR_lower').rot = fk.rot;
    part('handR').dx = fk.elbowDx; part('handR').dy = fk.elbowDy; part('handR').rot = fk.rot;

    // eyes: soften after the bite, gentle blink throughout
    P.eye.mode = t > 9.55 ? 'happy' : 'normal';
    if (P.eye.mode === 'normal') P.eye.open = Math.min(blink(t, 8.9, 0.13), blink(t, 11.1, 0.13));
    return P;
  }

  // world position of the held ladoo / plate
  function ladooWorld(P) { return Rig.point(woman, P, 'armR_lower', WRIST_REST[0] + 4, WRIST_REST[1] - 18); }
  function plateWorld(P) { return Rig.point(woman, P, 'armL', -192, -336); }

  // ---- lantern sway + tassels
  function lanternPose(t) {
    const rot = 0.075 * Math.sin(t * TAU * 0.32 + 0.6) + 0.02 * Math.sin(t * TAU * 0.7);
    return { rot };
  }

  // ---- clip paths, written in each sprite's OWN local coordinates; `clipAt`
  // below translates the clip the same way the sprite image itself is offset
  function diyaClip(ctx) { ctx.ellipse(280, 300, 233, 113, 0, 0, TAU); }
  function rangoliClip(ctx) { ctx.ellipse(230, 230, 220, 220, 0, 0, TAU); }
  function lanternClip(ctx) {
    ctx.rect(166, 6, 8, 70);
    ctx.ellipse(170, 235, 132, 135, 0, 0, TAU);
    ctx.ellipse(170, 378, 34, 18, 0, 0, TAU);
  }
  function plateClip(ctx) { ctx.ellipse(210, 140, 198, 92, 0, 0, TAU); ctx.ellipse(140, 120, 58, 58, 0, 0, TAU); ctx.ellipse(260, 118, 58, 58, 0, 0, TAU); }
  function ladooClip(ctx) { ctx.ellipse(70, 70, 62, 62, 0, 0, TAU); }

  // draw a sprite whose local-space clip path was built for `ox,oy` offset,
  // by translating the path-building context so local coords line up with drawImage
  function clipAt(ctx, img, ox, oy, localClipFn) {
    K.clipDraw(ctx, img, ox, oy, (c) => { c.save(); c.translate(ox, oy); localClipFn(c); c.restore(); });
  }

  // ---- particles: gentle floor rangoli sparkle + marigold confetti at the very end
  const finale = K.particles({
    seed: 21, palette: ['#F5A427', '#F3B93C', '#E2733D', '#FFFFFF'], shapes: ['dot', 'petal'],
    bursts: [{ t0: 13.4, x: 540, y: 800, w: 640, h: 40, n: 24, speed: 0.3 }], rest: [1850, 1920],
  });

  // ============================================================ STORY =====
  window.STORY = {
    finish: { grain: 0.14, vignette: 'rgb(30,20,40)' },

    paint: [
      { name: 'bg', draw: paintBg },
      { name: 'diya', w: 560, h: 460, paper: '#FFFFFF', draw: paintDiya },
      { name: 'rangoli', w: 460, h: 460, paper: '#FFFFFF', draw: paintRangoli },
      { name: 'lantern', w: 340, h: 420, paper: '#FFFFFF', draw: paintLanternFG },
      { name: 'plate', w: 420, h: 240, paper: '#FFFFFF', draw: paintPlate },
      { name: 'ladooWhole', w: 140, h: 140, paper: '#FFFFFF', draw: (k) => paintLadooShape(k, 70, 70, 54, false) },
      { name: 'ladooBit', w: 140, h: 140, paper: '#FFFFFF', draw: (k) => paintLadooShape(k, 70, 70, 54, true) },
      { name: 'skinPig', w: 260, h: 260, draw: (k) => k.pigment(0, 0, 260, COL.skin, [COL.skinShade, '#E0AE7E', COL.skin]) },
      { name: 'fabricPig', w: 320, h: 320, draw: (k) => k.pigment(0, 0, 320, COL.outfitRed, [COL.outfitRedDeep, COL.outfitGold, '#C43350']) },
    ],

    setup({ ctx, A }) {
      woman.fills.skin = ctx.createPattern(A.skinPig, 'repeat');
      woman.fills.fabric = ctx.createPattern(A.fabricPig, 'repeat');
    },

    frame({ ctx, t, A }) {
      ctx.save();
      applyCam(ctx, t);

      ctx.drawImage(A.bg, 0, 0);

      // fireworks (sky, behind foreground props)
      if (t > 4.0 && t < 7.3) for (const f of fireworks) f.draw(ctx, t);

      // rangoli + diya (close in beat 1; the tilt-up carries them out of frame by ~4.6s)
      if (t < 4.6) {
        clipAt(ctx, A.rangoli, RANGOLI_POS.x - 230, RANGOLI_POS.y - 230, rangoliClip);
        drawDiya(ctx, A, t);
      }

      // travelling spark: ember rising, then (after the firework) falling toward the lantern
      if (t >= 3.5 && t < 4.85) drawSpark(ctx, emberPos(t), 1);
      if (t >= 6.15 && t < 7.85) drawSpark(ctx, fallingSparkPos(t), 1);

      // foreground swaying lantern: swings into view as the spark falls past it (beat 2 only);
      // a separate small lantern is already painted into `bg` for beats 3-4
      if (t > 5.7 && t < 8.1) drawLantern(ctx, A, t);

      // the woman + her props (beats 3-4)
      if (t > 7.3) {
        const P = womanPoseAt(t);
        const enter = easeOut(seg(t, 7.3, 8.0));
        P.alpha = enter;
        K.shadow(ctx, P.x, WOMAN_FEET0.y, 150, 0, { rgb: '60,40,30', alpha: 0.3 });
        const plateP = plateWorld(P);
        ctx.save(); ctx.translate(plateP[0], plateP[1] - 6); ctx.rotate(-0.18); ctx.globalAlpha = enter;
        clipAt(ctx, A.plate, -210, -170, plateClip);
        ctx.restore();
        Rig.draw(ctx, woman, P);
        const ladooP = ladooWorld(P);
        const bitten = t >= 9.42;
        ctx.save(); ctx.translate(ladooP[0], ladooP[1]); ctx.rotate(0.25); ctx.globalAlpha = enter;
        clipAt(ctx, bitten ? A.ladooBit : A.ladooWhole, -70, -70, ladooClip);
        ctx.restore();
      }

      // text reveal happens in screen space (after camera restore, below)
      ctx.restore();

      if (t > 12.0) drawText(ctx, t);
      finale.draw(ctx, t, false);
    },

    track(t) {
      const cam = cameraAt(t);
      const P = t > 7.3 ? womanPoseAt(t) : null;
      return { cx: cam.cx, cy: cam.cy, z: cam.z * 400, armR: P ? P.parts.armR_upper?.rot || 0 : 0 };
    },

    cues() {
      return {
        blinks: [1.95, 2.32, 8.9, 11.1],
        hops: [],
        emberStart: 3.5, fireworkMain: 4.75, firework2: 5.05, firework3: 5.4,
        sparkFall: 6.15, sparkArrive: 7.7, bite: 9.42, lowered: 10.6, textIn: 12.0, textSub: 12.7,
      };
    },
  };

  // ---- compositor helpers -------------------------------------------------
  function drawDiya(ctx, A, t) {
    const flick = 1 + 0.07 * Math.sin(t * 9.1) + 0.045 * Math.sin(t * 15.3 + 1.4) + 0.03 * Math.sin(t * 5.7 + 2.1);
    const bend = 0.09 * Math.sin(t * 1.7 + 0.4) + 0.05 * Math.sin(t * 3.9);
    K.glow(ctx, FLAME_POS.x, FLAME_POS.y - 18, 210 * flick, '250,170,80', 0.16);
    clipAt(ctx, A.diya, DIYA_POS.x - 280, DIYA_POS.y - 300, diyaClip);
    // flame
    ctx.save();
    ctx.translate(FLAME_POS.x, FLAME_POS.y);
    ctx.rotate(bend * 0.6);
    const h = 96 * flick, w = 34 * flick;
    ctx.fillStyle = COL.flameOut;
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(w, -h * 0.35, 0, -h); ctx.quadraticCurveTo(-w, -h * 0.35, 0, 6); ctx.fill();
    ctx.fillStyle = COL.flameMid;
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(w * 0.62, -h * 0.4, 0, -h * 0.78); ctx.quadraticCurveTo(-w * 0.62, -h * 0.4, 0, 4); ctx.fill();
    ctx.fillStyle = COL.flameCore;
    ctx.beginPath(); ctx.ellipse(0, -h * 0.32, w * 0.28, h * 0.28, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawSpark(ctx, p, scale) {
    K.glow(ctx, p.x, p.y, 60 * scale, '255,220,150', 0.5);
    ctx.fillStyle = '#FFF3D0';
    ctx.beginPath(); ctx.arc(p.x, p.y, 5 * scale, 0, TAU); ctx.fill();
  }

  function drawLantern(ctx, A, t) {
    const { rot } = lanternPose(t);
    const enter = (t < 6.8 ? easeOut(seg(t, 5.7, 6.8)) : 1) * (t > 7.6 ? 1 - easeIn(seg(t, 7.6, 8.1)) : 1);
    ctx.save();
    ctx.translate(LANTERN_ANCHOR.x, LANTERN_ANCHOR.y);
    ctx.rotate(rot);
    ctx.globalAlpha = enter;
    clipAt(ctx, A.lantern, -170, -10, lanternClip);
    K.glow(ctx, 0, 225, 130, '255,190,110', 0.14);
    // tassels (anchored at the lantern's bottom cap, y=378 in sprite space -> 368 local to the cord anchor)
    ctx.strokeStyle = COL.goldDeep; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    for (const dx of [-40, 0, 40]) {
      const sway = rot * 1.6 + 0.06 * Math.sin(t * TAU * 0.32 + dx * 0.05 + 1);
      ctx.beginPath(); ctx.moveTo(dx, 368);
      const ex = dx + Math.sin(sway) * 26, ey = 368 + 46;
      ctx.quadraticCurveTo(dx + Math.sin(sway) * 14, 368 + 24, ex, ey);
      ctx.stroke();
      ctx.fillStyle = COL.gold; ctx.beginPath(); ctx.arc(ex, ey + 5, 5, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawText(ctx, t) {
    const a = easeOut(seg(t, 12.0, 12.7));
    const b = easeOut(seg(t, 12.7, 13.3));
    ctx.save();
    ctx.textAlign = 'center';
    if (a > 0) {
      ctx.globalAlpha = a;
      const rise = (1 - a) * 18;
      ctx.font = '400 128px "Great Vibes", "Playfair Display", serif';
      ctx.fillStyle = '#FFF6E4';
      ctx.shadowColor = 'rgba(240,140,60,0.55)'; ctx.shadowBlur = 26;
      ctx.fillText('Happy Diwali', 540, 560 + rise);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(120,60,20,0.35)'; ctx.lineWidth = 1.2;
      ctx.strokeText('Happy Diwali', 540, 560 + rise);
    }
    if (b > 0) {
      ctx.globalAlpha = b;
      ctx.font = '400 40px "Playfair Display", serif';
      ctx.fillStyle = '#FCEBD2';
      ctx.fillText('May your home glow with light,', 540, 656);
      ctx.fillText('love and happiness.', 540, 706);
    }
    ctx.restore();
  }

  // ---- paint jobs (p5.brush, run once) -------------------------------------
  function paintBg(k) {
    const { W, H } = G;
    const wavyTop = (y, amp, f, ph) => { const pts = []; for (let x = -40; x <= W + 40; x += 36) pts.push([x, y + Math.sin(x * f + ph) * amp]); return pts.concat([[W + 40, 800], [-40, 800]]); };
    k.water([[-40, -40], [W + 40, -40], [W + 40, 760], [-40, 760]], COL.skyTop, 235, 0.02, 0.5, 0.1);
    k.water(wavyTop(260, 60, 0.0032, 0.7), COL.skyMid, 150, 0.03, 0.6, 0.15);
    k.water(wavyTop(520, 70, 0.0028, 2.4), COL.skyLow, 120, 0.035, 0.6, 0.15);
    k.blob(W * 0.62, 700, 320, '#7A4A6E', 80, 0.4);
    k.blob(W * 0.62, 700, 150, COL.saffron, 55, 0.35);
    k.blob(860, 240, 110, '#F6E7B0', 65, 0.4);
    k.blob(860, 240, 60, COL.moon, 210, 0.1);
    for (let i = 0; i < 70; i++) k.blob(k.rand(0, W), k.rand(40, 640), k.rand(1.5, 3.2), '#FFF6D8', k.rand(110, 200), 0.05);
    for (let i = 0; i < 10; i++) k.blob(k.rand(0, W), k.rand(40, 500), k.rand(3, 5), '#FFF6D8', 85, 0.35);
    // skyline silhouette
    let x = -40; const skyl = [[-40, 760]];
    while (x < W + 40) { const w = k.rand(60, 140), h = k.rand(90, 260); skyl.push([x, 760 - h]); skyl.push([x + w, 760 - h]); x += w; }
    skyl.push([W + 40, 760]);
    k.water(skyl, COL.skyline, 230, 0.015, 0.4, 0.1);
    for (let i = 0; i < 26; i++) k.blob(k.rand(0, W), k.rand(560, 740), k.rand(2, 3.5), COL.gold, 130, 0.05);
    // soft out-of-focus lanterns, high (bokeh for the beat-1 close-up)
    for (const [x2, y2, r] of [[210, 300, 46], [880, 260, 38], [420, 180, 30]]) { k.blob(x2, y2, r, COL.lanternPaper, 50, 0.5); k.blob(x2, y2, r * 0.5, COL.lanternPaper2, 55, 0.45); }
    // marigold garland near the top edge
    for (let gx = -20; gx <= W + 20; gx += 26) { const gy = 70 + Math.sin(gx * 0.02) * 26; k.blob(gx, gy, 7, k.R() < 0.5 ? COL.marigold : COL.marigoldDeep, 180, 0.06); }
    // terrace railing
    k.water([[-20, 1480], [W + 20, 1480], [W + 20, 1560], [-20, 1560]], COL.railing, 205, 0.02, 0.4, 0.12);
    for (let bx = 10; bx < W; bx += 54) k.wash([[bx, 1480], [bx + 16, 1480], [bx + 16, 1560], [bx, 1560]], COL.stoneShade, 160);
    // terrace floor
    k.band(1560, H + 40, COL.stone, 250, 8);
    k.band(1760, H + 40, COL.stoneShade, 90, 8);
    for (let tx = -20; tx < W + 40; tx += 90) k.ink([[tx, 1580], [tx - 30, H + 20]], false, COL.stoneDeep, 0.6, 'HB', 0.15);
    // ambient warm glow where the diya sits
    k.blob(DIYA_POS.x, DIYA_POS.y - 20, 260, COL.saffron, 50, 0.5);
    // a few glowing ledge diyas near the woman
    for (const [dx, dy] of [[760, 1640], [860, 1662], [960, 1636], [840, 1602]]) {
      k.blob(dx, dy, 24, COL.saffron, 55, 0.4);
      k.wash(G.ellipsePts(dx, dy, 20, 10, 16), COL.clay, 255);
      k.ink(G.ellipsePts(dx, dy, 20, 10, 16), true, INK, 0.8);
    }
    // one static background lantern near the woman
    k.blob(280, 1180, 60, COL.lanternPaper, 55, 0.45);
    k.wash(G.ellipsePts(280, 1180, 46, 58, 20), COL.lanternPaper, 255);
    k.water(G.ellipsePts(280, 1180, 46, 58, 20), COL.lanternPaper2, 105, 0.03, 0.5, 0.3);
    k.ink(G.ellipsePts(280, 1180, 46, 58, 20), true, '#8A3A12', 1);
  }

  function paintDiya(k) {
    const rim = G.ellipsePts(280, 300, 230, 110, 48);
    k.wash(rim, COL.clay, 255);
    k.water(rim, COL.clayDeep, 110, 0.03, 0.55, 0.4);
    const well = G.ellipsePts(280, 280, 150, 62, 40);
    k.wash(well, COL.clayDeep, 255);
    const oil = G.ellipsePts(280, 272, 118, 42, 36);
    k.wash(oil, COL.oil, 255);
    k.water(oil, '#FFD87A', 110, 0.05, 0.5, 0.3);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI; k.ink([[280 - 210 * Math.cos(a), 300 - 54 * Math.sin(a)], [280 - 190 * Math.cos(a), 300 - 48 * Math.sin(a)]], false, COL.clayDeep, 0.6, 'HB', 0.3); }
    k.ink(rim, true, INK, 1.4);
    k.ink(well, true, INK, 1);
  }

  function paintRangoli(k) {
    const cx = 230, cy = 230;
    k.wash(G.ellipsePts(cx, cy, 216, 216, 44), '#F6E4C2', 255);
    for (const [r, col, op] of [[210, '#B5502B', 140], [170, '#F3B93C', 170], [130, '#E2733D', 190], [90, '#F6D36B', 210]]) k.blob(cx, cy, r, col, op, 0.3);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, px = cx + Math.cos(a) * 150, py = cy + Math.sin(a) * 150;
      const pet = G.ellipsePts(px, py, 34, 20, 16).map(([x, y]) => { const dx = x - px, dy = y - py; return [px + dx * Math.cos(a) - dy * Math.sin(a), py + dx * Math.sin(a) + dy * Math.cos(a)]; });
      k.shape(pet, i % 2 ? '#E2733D' : '#F3B93C', '#8A3A12', { shade: '#C1512F', inkW: 0.8 });
    }
    k.shape(G.ellipsePts(cx, cy, 58, 58, 28), '#F6D36B', '#8A6420', { shade: '#E8B53E' });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.2; k.blob(cx + Math.cos(a) * 95, cy + Math.sin(a) * 95, 10, '#FFFFFF', 190, 0.1); }
  }

  function paintLanternFG(k) {
    const cx = 170, top = 110, bot = 360, rx = 118;
    k.ink([[cx, 10], [cx, 70]], false, '#5A3A20', 3, 'pen');
    k.wash(G.ellipsePts(cx, 75, 34, 14, 20), COL.goldDeep, 255);
    k.ink(G.ellipsePts(cx, 75, 34, 14, 20), true, INK, 1);
    const body = [[cx - rx, 150], [cx - rx * 0.9, top + 10], [cx, top], [cx + rx * 0.9, top + 10], [cx + rx, 150], [cx + rx, 320], [cx + rx * 0.9, bot - 10], [cx, bot], [cx - rx * 0.9, bot - 10], [cx - rx, 320]];
    k.wash(body, COL.lanternPaper, 255);
    k.water(body, COL.lanternPaper2, 115, 0.03, 0.55, 0.35);
    k.blob(cx, 235, 90, '#FFD87A', 65, 0.4);
    for (let i = -2; i <= 2; i++) { const x2 = cx + i * 40; k.ink([[x2, 140], [x2, bot - 15]], false, COL.goldDeep, 1, 'HB', 0.15); }
    k.ink(body, true, INK, 1.3);
    k.wash(G.ellipsePts(cx, bot + 18, 30, 13, 20), COL.goldDeep, 255);
    k.ink(G.ellipsePts(cx, bot + 18, 30, 13, 20), true, INK, 1);
  }

  function paintPlate(k) {
    const cx = 210, cy = 140;
    k.wash(G.ellipsePts(cx, cy, 190, 80, 40), COL.goldDeep, 255);
    k.water(G.ellipsePts(cx, cy, 190, 80, 40), COL.gold, 140, 0.03, 0.5, 0.3);
    k.blob(cx - 40, cy - 20, 70, '#FFE9A8', 75, 0.4);
    k.ink(G.ellipsePts(cx, cy, 190, 80, 40), true, '#7A5416', 1.3);
    k.ink(G.ellipsePts(cx, cy, 150, 58, 36), true, '#7A5416', 0.8);
    for (const [lx, ly] of [[140, 120], [260, 118]]) paintLadooShape(k, lx, ly, 46, false);
  }

  function paintLadooShape(k, cx, cy, r, bitten) {
    let pts;
    if (bitten) {
      pts = [];
      for (let a = 0; a < TAU; a += TAU / 28) { let rr = r; if (a > -0.5 && a < 0.7) rr = r * 0.45; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    } else pts = G.ellipsePts(cx, cy, r, r, 30);
    k.wash(pts, COL.gold, 255);
    k.water(pts, COL.goldDeep, 105, 0.04, 0.55, 0.4);
    for (let i = 0; i < 8; i++) k.blob(cx + k.rand(-r * 0.6, r * 0.6), cy + k.rand(-r * 0.6, r * 0.6), k.rand(4, 8), '#C98A1E', 65, 0.4);
    if (bitten) k.blob(cx + r * 0.35, cy - r * 0.1, r * 0.35, '#F6E3B0', 170, 0.3);
    k.blob(cx - r * 0.3, cy - r * 0.35, r * 0.3, '#FFE9A8', 85, 0.4);
    k.ink(pts, true, '#7A5416', 1);
  }
})();
