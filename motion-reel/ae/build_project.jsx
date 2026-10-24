/*
 * BM_ThinkBeyondTheFrame: After Effects project skeleton.
 *
 * Builds the folder tree, the six chapter comps and MASTER_20SEC (1920x1080, 25 fps),
 * every text layer with its font, size and position, the slit rig, the hero keyframes,
 * the background shake, a grain layer and one comp marker per sound cue.
 *
 * Run: File > Scripts > Run Script File... (AE 2023 or later, JavaScript expression engine).
 * Optional: put paper.jpg, grain.png and the sfx files next to this script under
 * ../assets so they are imported and placed.
 *
 * Not executed when it was written (no After Effects available). Expect to adjust
 * the text baselines by a few pixels for your Inter install.
 * Timings mirror ../PRODUCTION_BIBLE.md, part B.
 */
(function () {
    var FPS = 25;
    var W = 1920;
    var H = 1080;
    var INK = [0.067, 0.067, 0.063];
    var GRAPHITE = [0.369, 0.357, 0.333];
    var PAPER = [0.929, 0.918, 0.89];
    var PAPER_CLEAN = [0.949, 0.941, 0.918];
    var F_BLACK = "Inter-Black";
    var F_BOLD = "Inter-Bold";
    var F_REG = "Inter-Regular";

    var proj = app.project || app.newProject();
    app.beginUndoGroup("Build BM reel skeleton");

    // ------------------------------------------------------------------ helpers
    function folder(name, parent) {
        var f = proj.items.addFolder(name);
        if (parent) f.parentFolder = parent;
        return f;
    }

    function comp(name, dur, parent) {
        var c = proj.items.addComp(name, W, H, 1, dur, FPS);
        c.bgColor = PAPER;
        if (parent) c.parentFolder = parent;
        return c;
    }

    function nEase(prop) {
        var t = prop.propertyValueType;
        if (t === PropertyValueType.TwoD) return 2;
        if (t === PropertyValueType.ThreeD) return 3;
        return 1;
    }

    // keys: [[time, value, influenceIn, influenceOut], ...]; influence 0 => linear, 100 => long tail
    function keys(prop, list) {
        for (var i = 0; i < list.length; i++) {
            var k = prop.addKey(list[i][0]);
            prop.setValueAtKey(k, list[i][1]);
        }
        for (var j = 0; j < list.length; j++) {
            var n = nEase(prop);
            var inf = list[j].length > 2 ? list[j][2] : 33;
            var outf = list[j].length > 3 ? list[j][3] : inf;
            var eIn = [];
            var eOut = [];
            for (var d = 0; d < n; d++) {
                eIn.push(new KeyframeEase(0, Math.max(0.1, inf)));
                eOut.push(new KeyframeEase(0, Math.max(0.1, outf)));
            }
            prop.setTemporalEaseAtKey(j + 1, eIn, eOut);
        }
    }

    function holdKeys(prop, list) {
        for (var i = 0; i < list.length; i++) {
            var k = prop.addKey(list[i][0]);
            prop.setValueAtKey(k, list[i][1]);
            prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
        }
    }

    function text(c, name, str, font, size, tracking, color, pos, just) {
        var l = c.layers.addText(str);
        l.name = name;
        var p = l.property("ADBE Text Properties").property("ADBE Text Document");
        var d = p.value;
        d.resetCharStyle();
        d.font = font;
        d.fontSize = size;
        d.tracking = tracking;
        d.applyFill = true;
        d.fillColor = color;
        d.applyStroke = false;
        d.justification = just || ParagraphJustification.LEFT_JUSTIFY;
        p.setValue(d);
        l.property("ADBE Transform Group").property("ADBE Position").setValue(pos);
        return l;
    }

    function rectLayer(c, name, w, h, color, pos, anchorMode) {
        var l = c.layers.addShape();
        l.name = name;
        var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        g.name = "rect";
        var r = g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
        r.property("ADBE Vector Rect Size").setValue([w, h]);
        var f = g.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
        f.property("ADBE Vector Fill Color").setValue(color);
        // anchorMode "left" puts the anchor on the left edge (for scale-X draws), "foot" on the bottom edge
        if (anchorMode === "left") r.property("ADBE Vector Rect Position").setValue([w / 2, 0]);
        if (anchorMode === "foot") r.property("ADBE Vector Rect Position").setValue([0, -h / 2]);
        l.property("ADBE Transform Group").property("ADBE Position").setValue(pos);
        return l;
    }

    function nullLayer(c, name, pos) {
        var l = c.layers.addNull();
        l.name = name;
        l.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([50, 50]);
        l.property("ADBE Transform Group").property("ADBE Position").setValue(pos);
        return l;
    }

    function slider(layer, name, val) {
        var s = layer.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
        s.name = name;
        s.property(1).setValue(val);
        return s.property(1);
    }

    function marker(c, t, label) {
        c.markerProperty.setValueAtTime(t, new MarkerValue(label));
    }

    function scriptDir() {
        return File($.fileName).parent;
    }

    function importIf(path, parent) {
        var f = new File(scriptDir().fsName + "/" + path);
        if (!f.exists) return null;
        var item = proj.importFile(new ImportOptions(f));
        item.parentFolder = parent;
        return item;
    }

    // ------------------------------------------------------------------ folders
    var fComps = folder("00_COMPS");
    var fPre = folder("10_PRECOMPS");
    var fAssets = folder("20_ASSETS");
    var fImg = folder("IMG", fAssets);
    var fSfx = folder("SFX", fAssets);
    folder("VEC", fAssets);
    folder("90_REF");

    var paperImg = importIf("../assets/paper.jpg", fImg);

    // ------------------------------------------------------------------ shared precomps
    var pcPaper = comp("PC_PAPER_PLATE", 20, fPre);
    pcPaper.width = 2304;
    pcPaper.height = 1296;
    if (paperImg) {
        pcPaper.layers.add(paperImg);
    } else {
        pcPaper.layers.addSolid(PAPER, "SOLID_PAPER (replace with paper.jpg)", 2304, 1296, 1);
    }

    var pcGrain = comp("PC_GRAIN", 20, fPre);
    var grain = pcGrain.layers.addSolid([0.5, 0.5, 0.5], "FX_GRAIN", W, H, 1);
    var fn = grain.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
    // display names (English UI); set the noise Scale to about 4 by hand for fine grain
    fn.property("Contrast").setValue(160);
    // a new random seed every frame (stepped), see EXPRESSIONS.md, "Grain"
    fn.property("Random Seed").expression = "timeToFrames(time) * 37 % 9973";

    // ------------------------------------------------------------------ 01_SURFACE_HOOK (0:00-4:00)
    var c1 = comp("01_SURFACE_HOOK", 4, fComps);
    var cam1 = nullLayer(c1, "CAM_HOOK", [560, 540]);
    keys(cam1.property("ADBE Transform Group").property("ADBE Scale"), [[3.38, [100, 100, 100], 33, 80], [4.0, [135, 135, 100], 80, 33]]);
    keys(cam1.property("ADBE Transform Group").property("ADBE Position"), [[3.38, [560, 540], 33, 80], [4.0, [960, 540], 80, 33]]);

    var ctrl = nullLayer(c1, "CTRL_SLIT", [560, 540]);
    var sh = slider(ctrl, "h", 0);
    var sw = slider(ctrl, "w", 0);
    var seL = slider(ctrl, "emerge L", 150);
    var seR = slider(ctrl, "emerge R", -150);
    keys(sh, [[0.7, 0, 0.1, 0.1], [0.82, 560, 90, 33]]);
    keys(sw, [
        [0.7, 0, 0.1, 0.1], [0.82, 2, 90, 33], [1.14, 12, 75, 33], [1.2, 12, 33, 33],
        [1.44, 46, 70, 0.1], [1.56, 49, 0.1, 50], [1.96, 172, 75, 50], [2.08, 166, 70, 33],
        [3.46, 166, 33, 50], [3.82, 2, 75, 33]
    ]);
    keys(seL, [[0.86, 150, 33, 0.1], [1.22, 0, 85, 33], [3.34, 0, 33, 60], [3.58, 150, 60, 33]]);
    keys(seR, [[0.9, -150, 33, 0.1], [1.26, 0, 85, 33], [3.34, 0, 33, 60], [3.58, -150, 60, 33]]);

    var dimple = c1.layers.addShape();
    dimple.name = "SHP_DIMPLE";
    var dg = dimple.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    dg.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([520, 740]);
    var dgf = dg.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - G-Fill");
    dgf.property("ADBE Vector Grad Type").setValue(2); // radial
    dimple.property("ADBE Transform Group").property("ADBE Position").setValue([560, 540]);
    dimple.property("ADBE Transform Group").property("ADBE Opacity").setValue(30);
    keys(dimple.property("ADBE Transform Group").property("ADBE Scale"), [[0.2, [55, 55, 100], 33, 50], [0.75, [100, 100, 100], 50, 33], [1.2, [100, 100, 100], 33, 50], [2.0, [122, 100, 100], 50, 33]]);

    var slit = c1.layers.addShape();
    slit.name = "SHP_SLIT";
    var sg = slit.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    sg.name = "lens";
    var sp = sg.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Group");
    sp.property("ADBE Vector Shape").expression = [
        "var c = thisComp.layer(\"CTRL_SLIT\");",
        "var h = c.effect(\"h\")(1), w = c.effect(\"w\")(1);",
        "var k = h * 0.3, m = w * 0.75;",
        "createPath([[0, -h / 2], [m, 0], [0, h / 2], [-m, 0]],",
        "  [[0, 0], [0, -k], [0, 0], [0, k]],",
        "  [[0, 0], [0, k], [0, 0], [0, -k]], true);"
    ].join("\n");
    var sf = sg.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
    sf.property("ADBE Vector Fill Color").setValue([0.039, 0.039, 0.035]);
    var lipLight = sg.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
    lipLight.property("ADBE Vector Stroke Color").setValue([1, 1, 1]);
    lipLight.property("ADBE Vector Stroke Width").setValue(3);
    lipLight.property("ADBE Vector Stroke Opacity").setValue(85);
    slit.property("ADBE Transform Group").property("ADBE Position").setValue([560, 540]);
    slit.parent = cam1;
    dimple.parent = cam1;

    // hands: placeholders until hand-left/right.svg are converted to shapes (Create Shapes from Vector Layer)
    var handL = rectLayer(c1, "PC_HAND_L (replace with hand-left.svg)", 100, 180, [0.9, 0.88, 0.85], [560, 500]);
    handL.property("ADBE Transform Group").property("ADBE Position").expression =
        "var c = thisComp.layer(\"CTRL_SLIT\"); [560 - c.effect(\"w\")(1) * 0.75 - 40 + c.effect(\"emerge L\")(1), value[1]];";
    var handR = rectLayer(c1, "PC_HAND_R (replace with hand-right.svg)", 100, 180, [0.9, 0.88, 0.85], [560, 514]);
    handR.property("ADBE Transform Group").property("ADBE Position").expression =
        "var c = thisComp.layer(\"CTRL_SLIT\"); [560 + c.effect(\"w\")(1) * 0.75 + 40 + c.effect(\"emerge R\")(1), value[1]];";
    handL.parent = cam1;
    handR.parent = cam1;

    var t1 = text(c1, "TYPE_WHATIS", "WHAT IS.", F_BLACK, 184, -45, INK, [840, 600]);
    t1.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, -66]);
    keys(t1.property("ADBE Transform Group").property("ADBE Scale"), [
        [2.0, [112, 112, 100], 0.1, 90], [2.12, [98.5, 98.5, 100], 90, 40], [2.28, [100, 100, 100], 70, 33]
    ]);
    keys(t1.property("ADBE Transform Group").property("ADBE Opacity"), [[1.99, 0, 0.1, 0.1], [2.0, 100, 0.1, 0.1], [3.38, 100, 33, 60], [3.56, 0, 60, 33]]);
    var k1 = text(c1, "TYPE_KICKER_01", "Most people see", F_REG, 40, -10, GRAPHITE, [840, 412]);
    keys(k1.property("ADBE Transform Group").property("ADBE Opacity"), [[2.36, 0], [2.64, 100], [3.3, 100], [3.48, 0]]);
    t1.parent = cam1;
    k1.parent = cam1;

    // ------------------------------------------------------------------ 02_TYPE_TRANSFORM (4:00-8:00)
    var c2 = comp("02_TYPE_TRANSFORM", 4, fComps);
    var segTop = rectLayer(c2, "SHP_SEG_TOP", 4, 378, INK, [960, 540], "foot");
    keys(segTop.property("ADBE Transform Group").property("ADBE Rotate Z"), [[1.0, 0, 33, 0.1], [1.28, 90, 90, 33]]);
    var segBot = rectLayer(c2, "SHP_SEG_BOT", 4, 378, INK, [960, 729]);
    keys(segBot.property("ADBE Transform Group").property("ADBE Position"), [[1.0, [960, 729], 33, 0.1], [1.28, [840, 729], 90, 33]]);
    var obs = text(c2, "TYPE_OBSERVE", "OBSERVE.", F_BLACK, 132, -45, INK, [1000, 588]);
    keys(obs.property("ADBE Transform Group").property("ADBE Opacity"), [[0.1, 100], [0.88, 100], [1.02, 0]]);
    var ques = text(c2, "TYPE_QUES", "QUES", F_BLACK, 132, -45, INK, [984, 500]);
    keys(ques.property("ADBE Transform Group").property("ADBE Position"), [[1.08, [984, 390], 0.1, 90], [1.32, [984, 500], 90, 33]]);
    var tion = text(c2, "TYPE_TION", "TION.", F_BLACK, 132, -45, INK, [1330, 500]);
    keys(tion.property("ADBE Transform Group").property("ADBE Position"), [[1.2, [1490, 500], 0.1, 90], [1.44, [1330, 500], 90, 33]]);
    var k2 = text(c2, "TYPE_KICKER_02", "I see what it\rcould become.", F_REG, 40, 0, GRAPHITE, [880, 340], ParagraphJustification.RIGHT_JUSTIFY);
    var frame = c2.layers.addShape();
    frame.name = "SHP_FRAME";
    var fg = frame.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var fr = fg.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
    var fs = fg.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
    fs.property("ADBE Vector Stroke Color").setValue(INK);
    fs.property("ADBE Vector Stroke Width").setValue(4);
    frame.property("ADBE Transform Group").property("ADBE Position").setValue([960, 540]);
    keys(fr.property("ADBE Vector Rect Size"), [[2.78, [360, 360], 0.1, 90], [3.08, [1560, 296], 90, 33], [3.56, [1560, 296], 33, 75], [3.92, [1400, 0], 75, 33]]);
    var rei = text(c2, "TYPE_REIMAGINE", "REIMAGINE.", F_BLACK, 196, -45, INK, [960, 610], ParagraphJustification.CENTER_JUSTIFY);
    keys(rei.property("ADBE Transform Group").property("ADBE Scale"), [[2.8, [120, 120, 100], 0.1, 90], [3.1, [100, 100, 100], 90, 33]]);
    keys(rei.property("ADBE Transform Group").property("ADBE Opacity"), [[2.8, 0], [2.88, 100], [3.6, 100], [3.8, 0]]);
    marker(c2, 2.3, "GEO: back square, diagonals, circle on Trim Paths (see bible C/02)");
    k2.name = "TYPE_KICKER_02";

    // ------------------------------------------------------------------ 03_NAME_INTRO (8:00-12:00)
    var c3 = comp("03_NAME_INTRO", 4, fComps);
    var ruleB = rectLayer(c3, "SHP_RULE_B", 1400, 4, INK, [960, 540]);
    keys(ruleB.property("ADBE Transform Group").property("ADBE Position"), [[0.02, [960, 540], 33, 0.1], [0.22, [960, 762], 80, 33], [1.8, [960, 762], 33, 70], [2.02, [960, 540], 70, 33]]);
    keys(ruleB.property("ADBE Transform Group").property("ADBE Rotate Z"), [[0.02, 0], [0.22, 1.4], [0.8, 1.4, 33, 0.1], [0.88, 0, 95, 33]]);
    var ruleA = rectLayer(c3, "SHP_RULE_A", 1400, 4, INK, [960, 540]);
    keys(ruleA.property("ADBE Transform Group").property("ADBE Scale"), [
        [0.3, [100, 100, 100], 0.1, 0.1], [0.34, [100, 300, 100], 0.1, 0.1], [0.46, [100, 100, 100], 70, 33],
        [1.92, [100, 100, 100], 33, 75], [2.22, [18.6, 100, 100], 75, 33], [3.62, [18.6, 100, 100], 33, 75], [3.94, [1.29, 450, 100], 75, 33]
    ]);
    keys(ruleA.property("ADBE Transform Group").property("ADBE Rotate Z"), [[1.92, 0, 33, 75], [2.22, 90, 75, 33]]);
    var first = text(c3, "TYPE_BHOGESH", "BHOGESH", F_BLACK, 190, -50, INK, [252, 534]);
    keys(first.property("ADBE Transform Group").property("ADBE Position"), [[0.1, [252, 64], 0.1, 0.1], [0.3, [252, 544], 0.1, 60], [0.42, [252, 534], 60, 33]]);
    var last = text(c3, "TYPE_MOLAGAVALLI", "MOLAGAVALLI", F_BLACK, 190, -50, INK, [252, 744]);
    var anim = last.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
    anim.name = "assemble";
    anim.property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D").setValue([0, -70, 0]);
    anim.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(0);
    var sel = anim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    keys(sel.property("ADBE Text Percent Offset"), [[0.34, 0, 33, 33], [0.78, 100, 33, 33]]);
    marker(c3, 0.34, "Duplicate TYPE_MOLAGAVALLI: top half matte from -70 px, bottom half matte from +70 px, 2 f later");
    var artist = text(c3, "TYPE_ARTIST", "ARTIST.", F_BOLD, 104, -40, INK, [920, 572], ParagraphJustification.RIGHT_JUSTIFY);
    keys(artist.property("ADBE Transform Group").property("ADBE Position"), [[2.1, [830, 572], 0.1, 90], [2.5, [920, 572], 90, 33], [2.7, [920, 572], 33, 60], [3.0, [906, 572], 60, 33]]);
    var strat = text(c3, "TYPE_STRATEGIST", "STRATEGIST.", F_BLACK, 112, -40, INK, [1000, 572]);
    holdKeys(strat.property("ADBE Transform Group").property("ADBE Opacity"), [[0, 0], [2.71, 100], [3.6, 0]]);
    var wipe = rectLayer(c3, "SHP_WIPE", 860, 196, INK, [980, 550], "left");
    keys(wipe.property("ADBE Transform Group").property("ADBE Scale"), [[2.55, [0, 100, 100], 33, 0.1], [2.71, [100, 100, 100], 90, 0.1], [2.89, [0, 100, 100], 0.1, 90]]);
    marker(c3, 2.71, "SHP_WIPE: move anchor to the right edge at this key (or use a second layer) so it exits rightward");
    text(c3, "TYPE_CRAFT", "by craft,", F_REG, 40, 0, GRAPHITE, [916, 636], ParagraphJustification.RIGHT_JUSTIFY);
    text(c3, "TYPE_INSTINCT", "by instinct.", F_REG, 40, 0, GRAPHITE, [1004, 636]);
    text(c3, "TYPE_IM", "I’m", F_REG, 40, 0, GRAPHITE, [262, 340]);

    // ------------------------------------------------------------------ 04_PIXEL_JOKE (12:00-14:00)
    var c4 = comp("04_PIXEL_JOKE", 2, fComps);
    var gridCam = nullLayer(c4, "CAM_GRID", [1152, 476]);
    keys(gridCam.property("ADBE Transform Group").property("ADBE Scale"), [[0.16, [100, 100, 100], 33, 60], [0.56, [260, 260, 100], 60, 33]]);
    keys(gridCam.property("ADBE Transform Group").property("ADBE Position"), [[0.16, [1152, 476], 33, 60], [0.56, [960, 540], 60, 33]]);
    var grid = c4.layers.addShape();
    grid.name = "SHP_GRID";
    var gg = grid.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    gg.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([18, 18]);
    gg.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(INK);
    var rep1 = gg.property("ADBE Vectors Group").addProperty("ADBE Vector Filter - Repeater");
    rep1.property("ADBE Vector Repeater Copies").setValue(11);
    rep1.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([64, 0]);
    var rep2 = gg.property("ADBE Vectors Group").addProperty("ADBE Vector Filter - Repeater");
    rep2.property("ADBE Vector Repeater Copies").setValue(5);
    rep2.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 64]);
    grid.property("ADBE Transform Group").property("ADBE Position").setValue([640, 412]);
    grid.parent = gridCam;
    marker(c4, 0, "Mask out col 8 / row 1 in SHP_GRID: the offender is its own layer");
    var off = rectLayer(c4, "SHP_OFFENDER", 18, 18, INK, [1157, 479]);
    keys(off.property("ADBE Transform Group").property("ADBE Position"), [[0.72, [1157, 479], 33, 0.1], [0.8, [1152, 476], 95, 33]]);
    off.parent = gridCam;
    var punch = text(c4, "TYPE_PUNCH", "YES. EVEN THAT PIXEL.", F_BLACK, 96, -40, INK, [960, 880], ParagraphJustification.CENTER_JUSTIFY);
    keys(punch.property("ADBE Transform Group").property("ADBE Opacity"), [[0.8, 0], [1.06, 100], [1.86, 100], [1.98, 0]]);
    text(c4, "TYPE_KICKER_04", "And professionally… I overthink the details.", F_REG, 40, 0, GRAPHITE, [160, 190]);
    marker(c4, 0.64, "SOUND: 2 frames of silence");
    marker(c4, 0.72, "CLICK + BOOM: square nudges 5 px; MASTER paper shakes 1 frame");

    // ------------------------------------------------------------------ 05_SKILL_METAPHORS (14:00-17:00)
    var c5 = comp("05_SKILL_METAPHORS", 3, fComps);
    text(c5, "TYPE_KICKER_05", "I turn ideas into images that move people.", F_REG, 40, 0, GRAPHITE, [160, 268]);
    var say1 = text(c5, "TYPE_SAY_1", "AI FILMS.", F_BLACK, 112, -45, INK, [160, 400]);
    var say2 = text(c5, "TYPE_SAY_2", "3D + MOTION.", F_BLACK, 112, -45, INK, [160, 400]);
    var say3 = text(c5, "TYPE_SAY_3", "STORIES\rWITH PURPOSE.", F_BLACK, 112, -45, INK, [160, 400]);
    keys(say1.property("ADBE Transform Group").property("ADBE Position"), [[0.08, [160, 650], 60, 60], [0.32, [160, 400], 60, 60], [0.9, [160, 400], 60, 60], [1.14, [160, 150], 60, 60]]);
    keys(say2.property("ADBE Transform Group").property("ADBE Position"), [[0.9, [160, 650], 60, 60], [1.14, [160, 400], 60, 60], [1.8, [160, 400], 60, 60], [2.04, [160, 150], 60, 60]]);
    keys(say3.property("ADBE Transform Group").property("ADBE Position"), [[1.8, [160, 650], 60, 60], [2.04, [160, 400], 60, 60]]);
    var sayMatte = rectLayer(c5, "MATTE_SAY", 960, 240, [1, 1, 1], [640, 416]);
    sayMatte.enabled = false;
    marker(c5, 0.3, "AI: 6 variants on a 210 px ring; select 0.54 / 0.60 / 0.66; collapse 0.74");
    marker(c5, 0.92, "3D: PC_CUBE net -> fold 1.02-1.41 -> turn X-24 Y-36 by 1.61 -> sheen 1.38");
    marker(c5, 1.95, "EDIT: strip 0 -> -1036 px, power4.in, hard stop 2.35");
    marker(c5, 2.44, "ART DIRECTION: frames to hierarchy layout (bible C/05)");
    var strip = nullLayer(c5, "CTRL_STRIP", [1220, 800]);
    keys(strip.property("ADBE Transform Group").property("ADBE Position"), [[1.95, [1220, 800], 0.1, 0.1], [2.35, [184, 800], 100, 0.1], [2.43, [188, 800], 60, 33]]);
    for (var fi = 0; fi < 7; fi++) {
        var fl = c5.layers.addShape();
        fl.name = "PC_FRAME_0" + fi + " (thumbnail / portfolio excerpt)";
        var flg = fl.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        flg.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([200, 120]);
        flg.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(PAPER_CLEAN);
        var fls = flg.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
        fls.property("ADBE Vector Stroke Color").setValue(INK);
        fls.property("ADBE Vector Stroke Width").setValue(3);
        fl.property("ADBE Transform Group").property("ADBE Position").setValue([1320 + fi * 224, 800]);
        fl.parent = strip;
    }

    // ------------------------------------------------------------------ 06_FINAL_LOCKUP (17:00-20:00)
    var c6 = comp("06_FINAL_LOCKUP", 3, fComps);
    c6.bgColor = PAPER_CLEAN;
    var n1 = text(c6, "TYPE_FIRST", "BHOGESH", F_BLACK, 150, -50, INK, [172, 330]);
    var n2 = text(c6, "TYPE_LAST", "MOLAGAVALLI", F_BLACK, 150, -50, INK, [172, 490]);
    keys(n1.property("ADBE Transform Group").property("ADBE Opacity"), [[0.55, 0], [0.6, 100]]);
    keys(n2.property("ADBE Transform Group").property("ADBE Opacity"), [[0.67, 0], [0.72, 100]]);
    marker(c6, 0.55, "Name: mask wipe L->R 0.28 s (power3.out); surname 3 f later");
    var rule6 = rectLayer(c6, "SHP_RULE", 1560, 2, INK, [180, 557], "left");
    keys(rule6.property("ADBE Transform Group").property("ADBE Scale"), [[0.74, [0, 100, 100], 33, 75], [1.06, [100, 100, 100], 75, 33]]);
    text(c6, "TYPE_SKILLS_1", "AI FILMMAKING · MOTION DESIGN", F_BOLD, 28, 160, GRAPHITE, [180, 610]);
    text(c6, "TYPE_SKILLS_2", "ART DIRECTION · CREATIVE STRATEGY", F_BOLD, 28, 160, GRAPHITE, [180, 654]);
    text(c6, "TYPE_ASK", "Got a good problem?", F_REG, 40, 0, GRAPHITE, [180, 782]);
    var inv = text(c6, "TYPE_INVITE", "LET’S CREATE SOMETHING UNEXPECTED", F_BLACK, 68, -35, INK, [176, 862]);
    keys(inv.property("ADBE Transform Group").property("ADBE Opacity"), [[0.88, 0], [1.14, 100]]);
    var period = rectLayer(c6, "SHP_PERIOD", 15, 15, INK, [960, 540]);
    marker(c6, 0.44, "SHP_PERIOD: appears at centre (160 %), travels to end of line 1.24-1.54, lands +3/-2 px, snaps 1.66");
    marker(c6, 0.42, "Doors: PC_PAPER_PLATE halves, 3D, rotate Y -100 / +100 about outer edges, 0.42-0.84");
    period.name = "SHP_PERIOD";

    // ------------------------------------------------------------------ MASTER_20SEC
    var master = comp("MASTER_20SEC", 20, fComps);
    var plate = master.layers.add(pcPaper);
    plate.name = "PC_PAPER_PLATE";
    keys(plate.property("ADBE Transform Group").property("ADBE Scale"), [[0, [100, 100, 100], 0.1, 0.1], [4, [102, 102, 100], 0.1, 50], [17, [100, 100, 100], 50, 33]]);
    holdKeys(plate.property("ADBE Transform Group").property("ADBE Position"), [[0, [960, 540]], [12.72, [974, 531]], [12.76, [954, 544]], [12.8, [960, 540]]]);

    var chapters = [[c1, 0], [c2, 4], [c3, 8], [c4, 12], [c5, 14], [c6, 17]];
    for (var ci = 0; ci < chapters.length; ci++) {
        var lay = master.layers.add(chapters[ci][0]);
        lay.startTime = chapters[ci][1];
        lay.moveBefore(master.layer(1));
    }
    var g = master.layers.add(pcGrain);
    g.name = "PC_GRAIN";
    g.blendingMode = BlendingMode.SOFT_LIGHT;
    g.property("ADBE Transform Group").property("ADBE Opacity").setValue(42);
    g.moveToBeginning();
    var black = master.layers.addSolid([0.039, 0.039, 0.035], "SOLID_BLACK", W, H, 1, 0.08);
    black.startTime = 19.92;
    black.moveToBeginning();

    // sound cues (start, file, label); files are placed when found in ../assets/sfx
    var cues = [
        [0.4, "paper-tension.wav", "paper tension"], [0.7, "paper-tear.wav", "tear"], [1.967, "impact-bass-1.mp3", "WHAT IS."],
        [3.66, "whoosh-short.mp3", "push"], [4.0, "sub-swell.wav", "sub bed"], [4.327, "click.mp3", "OBSERVE."],
        [5.0, "paper-cut-a.wav", "split"], [5.327, "click.mp3", "QUESTION."], [6.767, "impact-bass-1.mp3", "REIMAGINE."],
        [7.58, "paper-cut-b.wav", "collapse"], [8.287, "impact-bass-1.mp3", "BHOGESH slam"], [8.767, "click.mp3", "baseline"],
        [10.55, "paper-cut-b.wav", "wipe"], [12.64, null, "SILENCE 2 f"], [12.687, "click.mp3", "cursor click"],
        [12.728, "boom.wav", "BOOM"], [12.687, "impact-bass-1.mp3", "boom body"], [14.667, "click.mp3", "choose"],
        [15.02, "paper-fold.wav", "cube fold"], [16.15, "whoosh-short.mp3", "strip"], [16.317, "click.mp3", "strip stop"],
        [17.4, "paper-fold.wav", "doors"], [18.627, "click.mp3", "period"]
    ];
    var imported = {};
    for (var qi = 0; qi < cues.length; qi++) {
        marker(master, cues[qi][0], "SFX " + cues[qi][2]);
        var file = cues[qi][1];
        if (!file) continue;
        if (!imported.hasOwnProperty(file)) imported[file] = importIf("../assets/sfx/" + file, fSfx);
        if (imported[file]) {
            var al = master.layers.add(imported[file]);
            al.name = "SFX_" + cues[qi][2];
            al.startTime = cues[qi][0];
            al.moveToEnd();
        }
    }

    master.openInViewer();
    app.endUndoGroup();
    alert("BM reel skeleton built. Next: convert hand SVGs, build GEO / cube / frame details per PRODUCTION_BIBLE.md.");
})();
