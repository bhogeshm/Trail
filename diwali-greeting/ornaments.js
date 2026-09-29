// Builds the fine line-art (mandalas, feather texture, diya pattern) procedurally.
// Deterministic: no randomness, so every rendered frame is identical run to run.
(function () {
  var NS = "http://www.w3.org/2000/svg";

  function el(parent, tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  }
  // drawable stroke (animated via stroke-dashoffset)
  function draw(parent, tag, attrs) {
    attrs.pathLength = "1";
    attrs["stroke-dasharray"] = "1";
    return el(parent, tag, attrs);
  }
  function petal(r0, r1, w) {
    var m = r0 + (r1 - r0) * 0.45;
    return "M0 " + -r0 +
      " C " + w + " " + -m + ", " + w * 0.55 + " " + -(r1 - (r1 - r0) * 0.12) + ", 0 " + -r1 +
      " C " + -w * 0.55 + " " + -(r1 - (r1 - r0) * 0.12) + ", " + -w + " " + -m + ", 0 " + -r0 + " Z";
  }
  function ring(g, n, fn) {
    for (var i = 0; i < n; i++) fn(i, (360 / n) * i);
  }

  function mandala(g, R) {
    draw(g, "circle", { r: R * 0.1 });
    draw(g, "circle", { r: R * 0.17 });
    ring(g, 12, function (i, a) {
      draw(g, "path", { d: petal(R * 0.17, R * 0.4, R * 0.07), transform: "rotate(" + a + ")" });
    });
    draw(g, "circle", { r: R * 0.44 });
    ring(g, 24, function (i, a) {
      el(g, "circle", { cx: 0, cy: -R * 0.49, r: R * 0.011, transform: "rotate(" + a + ")", fill: g.getAttribute("stroke"), stroke: "none" });
    });
    ring(g, 16, function (i, a) {
      draw(g, "path", { d: petal(R * 0.53, R * 0.86, R * 0.11), transform: "rotate(" + (a + 11.25) + ")" });
      draw(g, "path", { d: petal(R * 0.58, R * 0.76, R * 0.045), transform: "rotate(" + (a + 11.25) + ")" });
    });
    draw(g, "circle", { r: R * 0.53 });
    ring(g, 32, function (i, a) {
      draw(g, "path", { d: "M0 " + -R * 0.9 + " L0 " + -R * 0.97, transform: "rotate(" + a + ")" });
    });
  }

  function starburst(g, R) {
    draw(g, "circle", { r: R * 0.14 });
    ring(g, 10, function (i, a) {
      draw(g, "path", { d: petal(R * 0.16, R * 0.58, R * 0.1), transform: "rotate(" + a + ")" });
    });
    ring(g, 20, function (i, a) {
      draw(g, "path", { d: "M0 " + -R * 0.64 + " L0 " + -R * (i % 2 ? 0.8 : 0.96), transform: "rotate(" + a + ")" });
    });
  }

  mandala(document.getElementById("mandalaTR"), 250);
  mandala(document.getElementById("mandalaBL"), 250);
  starburst(document.getElementById("mandalaMid"), 88);
  
  // feather-like radiating hairlines on the taupe paper layer
  var feather = document.getElementById("feather");
  for (var i = 0; i < 70; i++) {
    var a = (-62 + i * 1.8) * Math.PI / 180;
    var r0 = 140, r1 = 560 + (i % 3) * 22;
    var cx = -180, cy = 760;
    el(feather, "path", {
      d: "M" + (cx + Math.cos(a) * r0).toFixed(1) + " " + (cy + Math.sin(a) * r0).toFixed(1) +
         " Q " + (cx + Math.cos(a + 0.05) * (r0 + r1) / 2).toFixed(1) + " " + (cy + Math.sin(a + 0.05) * (r0 + r1) / 2).toFixed(1) +
         " " + (cx + Math.cos(a) * r1).toFixed(1) + " " + (cy + Math.sin(a) * r1).toFixed(1)
    });
  }

  // ornamental pattern on the diya bowl
  var p = document.getElementById("pattern");
  var col = "#e2c3b0";
  // inner border following the rim and body
  el(p, "path", { d: "M34 318 C 110 306, 200 318, 280 318 C 360 318, 450 306, 526 318" });
  el(p, "path", { d: "M34 326 C 110 314, 200 326, 280 326 C 360 326, 450 314, 526 326", "stroke-width": 1 });
  el(p, "path", { d: "M40 332 C 70 430, 170 496, 280 498 C 390 496, 490 430, 520 332", "stroke-width": 1.2 });
  // zig-zag band under the rim
  var zz = "M46 340";
  for (var x = 46, up = true; x <= 514; x += 13, up = !up) zz += " L" + x + " " + (up ? 340 : 350);
  el(p, "path", { d: zz, "stroke-width": 1.1 });
  // dotted arcs
  function arcDots(rx, ry, cy, n, r) {
    for (var k = 0; k <= n; k++) {
      var t = Math.PI * (0.08 + 0.84 * k / n);
      el(p, "circle", { cx: (280 - Math.cos(t) * rx).toFixed(1), cy: (cy + Math.sin(t) * ry).toFixed(1), r: r, fill: col, stroke: "none", "fill-opacity": 0.85 });
    }
  }
  arcDots(200, 122, 340, 34, 2.2);
  arcDots(150, 84, 356, 12, 5.5);
  arcDots(236, 150, 330, 44, 1.6);
  // central medallion
  var m = el(p, "g", { transform: "translate(280 392)" });
  el(m, "circle", { r: 9, fill: col, stroke: "none" });
  el(m, "circle", { r: 16 });
  for (var j = 0; j < 12; j++) {
    el(m, "path", { d: petal(18, 34, 5), transform: "rotate(" + j * 30 + ")" });
  }
  el(m, "circle", { r: 38, "stroke-dasharray": "2 5" });
  // side motifs
  [180, 380].forEach(function (x) {
    var s = el(p, "g", { transform: "translate(" + x + " 380)" });
    el(s, "circle", { r: 7, fill: col, stroke: "none" });
    el(s, "circle", { r: 13 });
  });
  // scalloped lower band
  var sc = "M78 440";
  for (var q = 0; q < 12; q++) {
    var t0 = q / 12, t1 = (q + 1) / 12;
    function bx(t) { return 78 + t * 404; }
    function by(t) { return 440 + Math.sin(Math.PI * t) * 36; }
    sc += " Q " + ((bx(t0) + bx(t1)) / 2).toFixed(1) + " " + ((by(t0) + by(t1)) / 2 + 12).toFixed(1) + " " + bx(t1).toFixed(1) + " " + by(t1).toFixed(1);
  }
  el(p, "path", { d: sc, "stroke-width": 1.2 });
})();
