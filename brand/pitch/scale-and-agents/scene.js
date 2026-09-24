/* NOURA — "Scalable platform / Agentic organisation" als Bewegtbild.
 *
 * Die Szene ist eine reine Funktion der Zeit: render(ctx, t) zeichnet t,
 * sonst nichts. Kein Zustand zwischen den Bildern, kein requestAnimationFrame
 * im Inneren. Nur so liefert der Einzelbild-Export exakt dasselbe Bild wie
 * die Vorschau — und nur so laesst sich eine Stelle gezielt ansehen.
 *
 * Die Schleife beginnt und endet mit dem stehenden Zeichen. Das ist keine
 * Bequemlichkeit, sondern die Regel des Intro-Screens: "Das Icon animiert
 * nicht ein. Es steht schon da." Ein Einblenden am Nahtpunkt waere ein
 * sichtbarer Schnitt bei jedem Durchlauf.
 */
(function (global) {
  'use strict';

  var W = 1920, H = 1080, CX = 960, CY = 540;
  var DUR = 16.5;

  // --- Zeitachse ---------------------------------------------------------
  // Abschnitte statt Bildnummern: wer eine Stelle verschieben will, aendert
  // eine Zahl und nicht dreissig.
  var T = {
    rest:      [0.0,  1.1],   // das Zeichen steht
    toProduct: [1.1,  2.3],   // die Silhouette schliesst sich darum
    product:   [2.3,  3.3],
    toStack:   [3.3,  4.7],   // eine Flaeche wird zu dreien
    fanOut:    [4.7,  7.6],   // drei werden zu achtundzwanzig
    field:     [7.6,  8.8],
    toNet:     [8.8, 10.6],   // das Raster wird zum Netz
    net:      [10.6, 14.3],   // Agenten arbeiten
    condense: [14.3, 15.5],
    toMark:   [15.0, 16.5]    // zurueck zum Zeichen — Nahtstelle
  };

  // --- Masse -------------------------------------------------------------
  var MARK_SOLO = 900;   // das 1024er Feld des Zeichens, freistehend
  var ICON      = 560;   // dasselbe Feld, wenn es ein Pillar-Icon ist
  var GRID_R    = 54;    // halbe Kachelbreite im Feld
  var GRID_W    = 15;    // deren Strichstaerke
  var COLS = 7, ROWS = 4, GAP_X = 200, GAP_Y = 200;
  var N = COLS * ROWS;   // 28
  var SPAWN = 6;         // Knoten, die sich spaeter selbst dazuschalten

  // Marken-Geometrie im 1024er Feld (identisch mit build-icon.py)
  var STEM = 118, X_L = 282, X_R = 742, Y_T = 287, Y_B = 737;

  // --- Werkzeug ----------------------------------------------------------
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return clamp01((t - a) / (b - a)); }
  function eio(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function eo(x) { return 1 - Math.pow(1 - x, 3); }
  function lerp(a, b, x) { return a + (b - a) * x; }
  // Deterministischer Zufall: der Export muss dieselben Streuungen treffen
  // wie die Vorschau, also kein Math.random irgendwo in dieser Datei.
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  function squircle(ctx, cx, cy, r, steps) {
    var n = 5, k = 2 / n, i, a, c, s;
    steps = steps || 88;
    ctx.beginPath();
    for (i = 0; i <= steps; i++) {
      a = 2 * Math.PI * i / steps;
      c = Math.cos(a); s = Math.sin(a);
      ctx.lineTo(cx + r * Math.sign(c) * Math.pow(Math.abs(c), k),
                 cy + r * Math.sign(s) * Math.pow(Math.abs(s), k));
    }
    ctx.closePath();
  }

  function beam(ctx, x0, y0, x1, y1, a) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0,   'rgba(255,255,255,' + a + ')');
    g.addColorStop(.38, 'rgba(255,243,234,' + a + ')');
    g.addColorStop(.8,  'rgba(255,255,255,' + (.88 * a) + ')');
    return g;
  }

  // --- Feste Anordnungen -------------------------------------------------
  // Einmal gerechnet, nicht je Bild: Raster, Netz und Kanten aendern sich
  // nicht mit der Zeit — nur, wie weit die Bewegung dazwischen ist.
  var grid = [], net = [], edges = [], spawns = [];
  (function layout() {
    var i, r, c, x, y, list = [];
    for (i = 0; i < N; i++) {
      c = i % COLS; r = (i / COLS) | 0;
      x = CX + (c - (COLS - 1) / 2) * GAP_X;
      y = CY + (r - (ROWS - 1) / 2) * GAP_Y;
      list.push({ x: x, y: y, d: Math.hypot(x - CX, (y - CY) * 1.3) });
    }
    // Nach Abstand zur Mitte sortiert: das Feld waechst von innen nach
    // aussen, und die drei Kacheln des Stapels sind die ersten drei.
    list.sort(function (a, b) { return a.d - b.d; });
    grid = list;

    // Netz: Nabe, dann drei Ringe. Leichte Streuung, damit es lebt und
    // nicht wie ein Zifferblatt aussteht.
    var rings = [[0, 0], [6, 200], [11, 370], [10, 490]], idx = 0;
    for (var g = 0; g < rings.length; g++) {
      var cnt = rings[g][0] || 1, rad = rings[g][1];
      for (var j = 0; j < cnt && idx < N; j++, idx++) {
        var ang = (j / cnt) * Math.PI * 2 + g * 0.6 + (rnd(idx) - .5) * 0.34;
        var rr = rad * (1 + (rnd(idx + 99) - .5) * 0.13);
        net.push({ x: CX + Math.cos(ang) * rr, y: CY + Math.sin(ang) * rr * .80, ring: g });
      }
    }
    // Kanten: jeder Knoten haengt am naechstgelegenen des inneren Rings.
    // Dazu ein paar Querverbindungen im ersten Ring — eine Organisation
    // ist kein Baum.
    for (i = 1; i < net.length; i++) {
      var best = 0, bd = 1e9;
      for (var q = 0; q < net.length; q++) {
        if (net[q].ring !== net[i].ring - 1) continue;
        var d = Math.hypot(net[q].x - net[i].x, net[q].y - net[i].y);
        if (d < bd) { bd = d; best = q; }
      }
      edges.push({ a: best, b: i, ph: rnd(i * 7) });
    }
    for (i = 1; i <= 6; i++) edges.push({ a: i, b: 1 + (i % 6), ph: rnd(i * 31) });

    // Knoten, die sich waehrend der Netzphase selbst dazuschalten.
    for (i = 0; i < SPAWN; i++) {
      var a2 = (i / SPAWN) * Math.PI * 2 + .35;
      spawns.push({
        x: CX + Math.cos(a2) * 600, y: CY + Math.sin(a2) * 600 * .62,
        at: 11.5 + i * 0.42, host: 1 + ((i * 3) % 6)
      });
    }
  })();

  // --- Bildaufbau --------------------------------------------------------
  // buildFrame beschreibt, WAS zum Zeitpunkt t zu sehen ist; paint zeichnet
  // es. Die Trennung kostet ein Objekt je Bild und spart jede Menge
  // ineinander verschachtelter if-Zweige beim Zeichnen.
  function buildFull(t) {
    var S = { mark: null, frame: null, tiles: [], nodes: [], links: [], caption: null };
    var i, p;

    // --- Zeichen und Silhouette
    if (t < T.toStack[1]) {
      p = eio(seg(t, T.toProduct[0], T.toProduct[1]));
      S.mark = {
        box: lerp(MARK_SOLO, ICON, p),
        inner: lerp(1, 0.66, p),
        alpha: 1 - clamp01(seg(t, T.toStack[0] + .15, T.toStack[0] + .75))
      };
      if (p > 0) {
        // Sie blendet ab, sobald die vorderste Kachel sie uebernimmt.
        var handoff = 1 - clamp01(seg(t, T.toStack[0], T.toStack[0] + .5));
        S.frame = { w: 60 * ICON / 1024, alpha: .50 * p * handoff,
                    box: lerp(MARK_SOLO, ICON, p) };
      }
    }
    if (t >= T.toMark[0]) {
      p = eo(seg(t, T.toMark[0], T.toMark[1]));
      S.mark = { box: MARK_SOLO, inner: 1, alpha: p, pop: lerp(.88, 1, p) };
    }

    // --- Kacheln: Stapel, dann Feld
    if (t >= T.toStack[0] && t < T.toNet[1]) {
      var toStack = eio(seg(t, T.toStack[0], T.toStack[1]));
      var k = ICON / 1024;
      var stackR = 205 * k, stackOff = 150 * Math.SQRT1_2 * k;
      for (i = 0; i < N; i++) {
        var tile = { x: 0, y: 0, r: 0, alpha: 0, lead: false };
        var cross = clamp01(seg(t, T.toStack[0], T.toStack[0] + .5));
        var baseA = (i === 0) ? 1 : .82;
        if (i < 3) {
          // Die drei des Stapels — sie entstehen aus der Produkt-Kachel.
          var kk = i - 1;                       // i=0 vorne oben links, i=2 hinten
          var sx = CX + kk * stackOff * toStack, sy = CY + kk * stackOff * toStack;
          var sr = lerp(512 * .70 * k, stackR, toStack);
          var sw = lerp(60 * k, 56 * k, toStack);
          var fo = eio(seg(t, T.fanOut[0] + i * .08, T.fanOut[0] + .9 + i * .08));
          tile.x = lerp(sx, grid[i].x, fo);
          tile.y = lerp(sy, grid[i].y, fo);
          tile.r = lerp(sr, GRID_R, fo);
          tile.w = lerp(sw, GRID_W, fo);
          tile.alpha = (i === 0) ? cross : lerp(0, 1, clamp01(toStack * 1.6 - .2));
          tile.alpha = lerp(tile.alpha, baseA, fo);
          tile.lead = i === 0;
          tile.stacked = fo < 1;
        } else {
          // Der Rest blendet gestaffelt von innen nach aussen auf.
          var at = T.fanOut[0] + .35 + (i - 3) * .082;
          var ap = eo(seg(t, at, at + .55));
          if (ap <= 0) continue;
          tile.x = lerp(CX, grid[i].x, ap);
          tile.y = lerp(CY, grid[i].y, ap);
          tile.r = lerp(GRID_R * .4, GRID_R, ap);
          tile.w = GRID_W;
          tile.alpha = ap * baseA;
        }
        // Uebergang ins Netz: Kachel schrumpft, Knoten uebernimmt.
        var toNet = eio(seg(t, T.toNet[0] + rnd(i) * .3, T.toNet[0] + .9 + rnd(i) * .3));
        if (toNet > 0) {
          tile.x = lerp(tile.x, net[i].x, toNet);
          tile.y = lerp(tile.y, net[i].y, toNet);
          tile.alpha *= (1 - toNet);
        }
        if (tile.alpha > .002) S.tiles.push(tile);
      }
    }

    // --- Netz
    if (t >= T.toNet[0] && t < T.toMark[1]) {
      var cond = eio(seg(t, T.condense[0], T.condense[1]));
      for (i = 0; i < N; i++) {
        var np = eio(seg(t, T.toNet[0] + rnd(i) * .3, T.toNet[0] + .9 + rnd(i) * .3));
        if (np <= 0) continue;
        var gx = grid[i] ? grid[i].x : CX, gy = grid[i] ? grid[i].y : CY;
        var nx = lerp(gx, net[i].x, np), ny = lerp(gy, net[i].y, np);
        S.nodes.push({
          x: lerp(nx, CX, cond), y: lerp(ny, CY, cond),
          r: (net[i].ring === 0 ? 34 : lerp(21, 14, net[i].ring / 3)) * lerp(1, .3, cond),
          alpha: np * (1 - cond), hub: net[i].ring === 0
        });
      }
      for (i = 0; i < spawns.length; i++) {
        var sp = eo(seg(t, spawns[i].at, spawns[i].at + .5));
        if (sp <= 0) continue;
        S.nodes.push({
          x: lerp(net[spawns[i].host].x, spawns[i].x, sp) * (1 - cond) + CX * cond,
          y: lerp(net[spawns[i].host].y, spawns[i].y, sp) * (1 - cond) + CY * cond,
          r: 13 * sp * (1 - cond), alpha: sp * (1 - cond), hub: false, fresh: true
        });
        var hx = net[spawns[i].host].x, hy = net[spawns[i].host].y;
        S.links.push({ ax: lerp(hx, CX, cond), ay: lerp(hy, CY, cond),
                       bx: lerp(lerp(hx, spawns[i].x, sp), CX, cond),
                       by: lerp(lerp(hy, spawns[i].y, sp), CY, cond),
                       p: 1, alpha: sp * (1 - cond) * .5, ph: rnd(i * 17), fresh: true });
      }
      for (i = 0; i < edges.length; i++) {
        var ed = edges[i];
        var ep = eo(seg(t, T.toNet[0] + .5 + rnd(i * 3) * .9, T.toNet[0] + 1.5 + rnd(i * 3) * .9));
        if (ep <= 0) continue;
        var a = net[ed.a], b = net[ed.b];
        S.links.push({
          ax: lerp(a.x, CX, cond), ay: lerp(a.y, CY, cond),
          bx: lerp(a.x, b.x, ep) * (1 - cond) + CX * cond,
          by: lerp(a.y, b.y, ep) * (1 - cond) + CY * cond,
          p: ep, alpha: ep * (1 - cond) * .42, ph: ed.ph
        });
      }
    }

    // --- Beschriftung
    var caps = [
      [1.5,  3.2,  'Product',              'One app. One surface.'],
      [3.9,  8.6,  'Scalable platform',    'One core \u2014 every market, every partner.'],
      [9.3, 15.2,  'Agentic organisation', 'Agents that run the company.']
    ];
    for (i = 0; i < caps.length; i++) {
      var c = caps[i];
      if (t >= c[0] && t <= c[1]) {
        S.caption = { label: c[2], sub: c[3],
                      alpha: Math.min(seg(t, c[0], c[0] + .45), 1 - seg(t, c[1] - .45, c[1])) };
      }
    }
    return S;
  }

  // --- Einzelne Schleifen ------------------------------------------------
  // Nicht aus der langen herausgeschnitten: ein Schnitt haette an beiden
  // Enden einen anderen Zustand und damit bei jedem Durchlauf einen
  // sichtbaren Sprung. Jede Szene faengt und endet hier auf demselben Bild.

  var PLAT_DUR = 9.0;
  var PT = { stack: [0.7, 2.0], fan: [2.0, 5.0], sweep: [4.6, 7.1], coll: [6.9, 8.4] };

  function buildPlatform(t) {
    var S = { mark: null, frame: null, tiles: [], nodes: [], links: [], caption: null };
    var k = ICON / 1024;
    var R1 = 512 * .70 * k, W1 = 60 * k;          // die einzelne Flaeche
    var stackR = 205 * k, stackOff = 150 * Math.SQRT1_2 * k;
    var toStack = eio(seg(t, PT.stack[0], PT.stack[1]));
    var coll = eio(seg(t, PT.coll[0], PT.coll[1]));
    var sweep = seg(t, PT.sweep[0], PT.sweep[1]);

    for (var i = 0; i < N; i++) {
      var x, y, r, w, alpha, lead = false, stacked = false;
      if (i < 3) {
        var kk = i - 1;
        var fo = eio(seg(t, PT.fan[0] + i * .08, PT.fan[0] + 1.0 + i * .08));
        x = lerp(CX + kk * stackOff * toStack, grid[i].x, fo);
        y = lerp(CY + kk * stackOff * toStack, grid[i].y, fo);
        r = lerp(lerp(R1, stackR, toStack), GRID_R, fo);
        w = lerp(lerp(W1, 56 * k, toStack), GRID_W, fo);
        alpha = (i === 0) ? 1 : clamp01(toStack * 1.6 - .2);
        alpha = lerp(alpha, (i === 0) ? 1 : .82, fo);
        lead = (i === 0);
        stacked = fo < 1 && coll === 0;
      } else {
        var at = PT.fan[0] + .35 + (i - 3) * .085;
        var ap = eo(seg(t, at, at + .55));
        if (ap <= 0) continue;
        x = lerp(CX, grid[i].x, ap); y = lerp(CY, grid[i].y, ap);
        r = lerp(GRID_R * .4, GRID_R, ap); w = GRID_W;
        alpha = ap * .82;
      }
      // Eine Lichtwelle laeuft die Diagonale entlang durch das Feld — der
      // Strahl der Marke, diesmal quer ueber alles, was auf ihr laeuft.
      var hot = 0;
      if (sweep > 0 && sweep < 1) {
        var u = ((x - CX) + (y - CY) + 900) / 1800;
        hot = Math.max(0, 1 - Math.abs(sweep - u) / .18);
      }
      if (coll > 0) {
        x = lerp(x, CX, coll); y = lerp(y, CY, coll);
        if (i === 0) {
          r = lerp(r, R1, coll); w = lerp(w, W1, coll); alpha = lerp(alpha, 1, coll);
        } else {
          // Aussen zuerst ausblenden: faellt alles gleichzeitig nach innen,
          // entsteht auf halbem Weg ein Haufen statt einer Bewegung.
          alpha *= (1 - clamp01((coll - .05) / .65 + (i / N) * .35));
        }
        hot *= (1 - coll);
      }
      if (alpha > .002) S.tiles.push({ x: x, y: y, r: r, w: w, alpha: alpha,
                                       lead: lead, stacked: stacked, hot: hot });
    }
    S.caption = { label: 'Scalable platform',
                  sub: 'One core \u2014 every market, every partner.', alpha: 1 };
    return S;
  }

  var AG_DUR = 10.0;
  var AG_TURNS = 4;    // Impulsumlaeufe je Schleife — muss ganzzahlig sein
  var AG_WAVES = 3;    // Aktivierungswellen je Schleife, ebenso

  function buildAgentic(t) {
    var S = { mark: null, frame: null, tiles: [], nodes: [], links: [], caption: null,
              pulse: AG_TURNS / AG_DUR };
    var i, ph;
    // Das Netz steht die ganze Zeit. Bewegt wird, was Agenten tun:
    // Impulse auf den Kanten, eine Welle vom Kern nach aussen, und
    // Knoten, die sich selbst dazuschalten. Alles periodisch — deshalb
    // braucht diese Schleife keinen Ruecksprung.
    for (i = 0; i < N; i++) {
      var d = Math.hypot(net[i].x - CX, (net[i].y - CY) / .80) / 490;
      var wave = .5 + .5 * Math.sin(2 * Math.PI * (AG_WAVES * t / AG_DUR - d * .85));
      var base = net[i].ring === 0 ? 34 : lerp(21, 14, net[i].ring / 3);
      S.nodes.push({ x: net[i].x, y: net[i].y, r: base * (1 + .10 * wave),
                     alpha: .70 + .30 * wave, hub: net[i].ring === 0 });
    }
    for (i = 0; i < edges.length; i++) {
      S.links.push({ ax: net[edges[i].a].x, ay: net[edges[i].a].y,
                     bx: net[edges[i].b].x, by: net[edges[i].b].y,
                     p: 1, alpha: .42, ph: edges[i].ph });
    }
    for (i = 0; i < spawns.length; i++) {
      // Ein voller Lebenslauf je Knoten, gegeneinander versetzt: einer
      // schaltet sich zu, waehrend ein anderer sich schon zurueckzieht.
      ph = ((t / AG_DUR) + i / spawns.length) % 1;
      var life = ph < .18 ? eo(ph / .18) : (ph < .78 ? 1 : 1 - eio((ph - .78) / .22));
      if (life <= .002) continue;
      var out = eo(Math.min(1, ph / .18));
      var hx = net[spawns[i].host].x, hy = net[spawns[i].host].y;
      var sx = lerp(hx, spawns[i].x, out), sy = lerp(hy, spawns[i].y, out);
      S.links.push({ ax: hx, ay: hy, bx: sx, by: sy, p: 1,
                     alpha: life * .5, ph: rnd(i * 17), fresh: true });
      S.nodes.push({ x: sx, y: sy, r: 13 * life, alpha: life, hub: false, fresh: true });
    }
    S.caption = { label: 'Agentic organisation',
                  sub: 'Agents that run the company.', alpha: 1 };
    return S;
  }

  // --- Zeichnen ----------------------------------------------------------
  var bgCache = null, off = null;

  function background(ctx, w, h) {
    if (!bgCache || bgCache.width !== w || bgCache.height !== h) {
      bgCache = document.createElement('canvas');
      bgCache.width = w; bgCache.height = h;
      var c = bgCache.getContext('2d'), g;
      c.fillStyle = '#0f0f26'; c.fillRect(0, 0, w, h);
      // Dieselben drei Ebenen wie das App-Icon, nur weit zurueckgenommen:
      // das hier ist Grund, nicht Marke.
      g = c.createRadialGradient(w * .86, -h * .06, 0, w * .86, -h * .06, w * .95);
      g.addColorStop(0, 'rgba(255,122,77,.26)'); g.addColorStop(1, 'rgba(255,122,77,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      g = c.createRadialGradient(w * .04, h * 1.04, 0, w * .04, h * 1.04, w * .9);
      g.addColorStop(0, 'rgba(47,107,255,.30)'); g.addColorStop(1, 'rgba(47,107,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      g = c.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(240,69,92,.13)'); g.addColorStop(.5, 'rgba(179,45,125,.10)');
      g.addColorStop(1, 'rgba(91,43,176,.16)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      g = c.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, h * .85);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(6,6,20,.55)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    ctx.drawImage(bgCache, 0, 0);
  }

  function drawMark(ctx, m) {
    var k = m.box / 1024 * (m.pop || 1), s = m.inner;
    function X(u) { return CX + (u - 512) * s * k; }
    function Y(u) { return CY + (u - 512) * s * k; }
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = STEM * s * k;
    ctx.globalAlpha = m.alpha;
    ctx.strokeStyle = 'rgba(255,255,255,.88)';
    ctx.beginPath(); ctx.moveTo(X(X_L), Y(Y_B)); ctx.lineTo(X(X_L), Y(Y_T));
    ctx.moveTo(X(X_R), Y(Y_B)); ctx.lineTo(X(X_R), Y(Y_T)); ctx.stroke();
    ctx.strokeStyle = beam(ctx, X(X_L), Y(Y_T), X(X_R), Y(Y_B), 1);
    ctx.shadowColor = 'rgba(255,200,170,.5)'; ctx.shadowBlur = 26 * k;
    ctx.beginPath(); ctx.moveTo(X(X_L), Y(Y_T)); ctx.lineTo(X(X_R), Y(Y_B)); ctx.stroke();
    ctx.restore();
  }

  function strokeTile(c, t) {
    c.save();
    c.globalAlpha = t.alpha;
    c.lineWidth = t.w || Math.max(3, t.r * 0.27);
    c.lineJoin = 'round';
    squircle(c, t.x, t.y, t.r);
    if (t.lead) {
      c.strokeStyle = beam(c, t.x - t.r, t.y - t.r, t.x + t.r, t.y + t.r, 1);
      c.shadowColor = 'rgba(255,190,160,.35)'; c.shadowBlur = 11;
    } else {
      c.strokeStyle = 'rgba(255,255,255,.72)';
    }
    c.stroke();
    if (t.hot > .01) {
      c.globalAlpha = t.alpha * t.hot;
      c.strokeStyle = beam(c, t.x - t.r, t.y - t.r, t.x + t.r, t.y + t.r, 1);
      c.shadowColor = 'rgba(255,190,150,.6)'; c.shadowBlur = 16 * t.hot;
      c.stroke();
    }
    c.restore();
  }

  function paintTiles(ctx, tiles) {
    // Nur der Stapel spart sich gegenseitig aus. Das Feld tut es
    // ausdruecklich nicht: dort liegt nichts uebereinander, und eine
    // Aussparung ueber alle Kacheln hat beim Auffaechern genau die
    // Kacheln weggefressen, die gerade durch die Mitte flogen.
    var stack = [], rest = [], i;
    for (i = 0; i < tiles.length; i++) (tiles[i].stacked ? stack : rest).push(tiles[i]);
    for (i = rest.length - 1; i >= 0; i--) strokeTile(ctx, rest[i]);
    if (!stack.length) return;
    if (stack.length === 1) { strokeTile(ctx, stack[0]); return; }

    // Vorne schneidet hinten frei — dieselbe Regel wie im Platform-Icon.
    // Auf einer eigenen Ebene, sonst raeumt destination-out den Grund mit ab.
    var w = ctx.canvas.width, h = ctx.canvas.height;
    if (!off || off.width !== w || off.height !== h) {
      off = document.createElement('canvas'); off.width = w; off.height = h;
    }
    var oc = off.getContext('2d');
    oc.setTransform(1, 0, 0, 1, 0, 0);
    oc.clearRect(0, 0, w, h);
    oc.setTransform(ctx.getTransform());
    for (i = stack.length - 1; i >= 0; i--) {     // hinten zuerst
      if (i < stack.length - 1) {
        oc.save();
        oc.globalCompositeOperation = 'destination-out';
        squircle(oc, stack[i].x, stack[i].y, stack[i].r);
        oc.fillStyle = '#000'; oc.fill();
        oc.lineWidth = (stack[i].w || 30) * 1.857;   // Strich + 2x Luft, wie im Icon
        oc.strokeStyle = '#000'; oc.stroke();
        oc.restore();
      }
      strokeTile(oc, stack[i]);
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(off, 0, 0); ctx.restore();
  }

  function paint(ctx, S, t) {
    var i;
    // Kanten und die Impulse darauf
    for (i = 0; i < S.links.length; i++) {
      var L = S.links[i];
      ctx.save();
      ctx.globalAlpha = L.alpha;
      ctx.lineWidth = L.fresh ? 2 : 2.4;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.moveTo(L.ax, L.ay); ctx.lineTo(L.bx, L.by); ctx.stroke();
      // Ein Impuls je Kante, eigene Phase: die Agenten arbeiten nicht im
      // Gleichschritt.
      if (L.p > .98) {
        var u = (t * (S.pulse || .38) + L.ph) % 1;
        var px = lerp(L.ax, L.bx, u), py = lerp(L.ay, L.by, u);
        var fade = Math.sin(u * Math.PI);
        ctx.globalAlpha = L.alpha * 2.1 * fade;
        ctx.fillStyle = 'rgba(255,238,226,1)';
        ctx.shadowColor = 'rgba(255,170,130,.9)'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(px, py, 4.2, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
    }
    // Knoten
    for (i = 0; i < S.nodes.length; i++) {
      var nd = S.nodes[i];
      ctx.save();
      ctx.globalAlpha = nd.alpha;
      if (nd.hub) {
        ctx.fillStyle = beam(ctx, nd.x - nd.r, nd.y - nd.r, nd.x + nd.r, nd.y + nd.r, 1);
        ctx.shadowColor = 'rgba(255,190,150,.75)'; ctx.shadowBlur = 34;
      } else {
        ctx.fillStyle = nd.fresh ? 'rgba(255,240,230,.95)' : 'rgba(255,255,255,.88)';
        ctx.shadowColor = 'rgba(255,255,255,.25)'; ctx.shadowBlur = 12;
      }
      ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.r, 0, 6.2832); ctx.fill();
      ctx.restore();
    }
    if (S.tiles.length) paintTiles(ctx, S.tiles);
    if (S.frame) {
      ctx.save();
      ctx.globalAlpha = S.frame.alpha;
      ctx.lineWidth = S.frame.w; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      squircle(ctx, CX, CY, S.frame.box / 1024 * 512 * .70);
      ctx.stroke(); ctx.restore();
    }
    if (S.mark && S.mark.alpha > .002) drawMark(ctx, S.mark);
  }

  function chrome(ctx, S, opts) {
    // Beiwerk, einzeln abschaltbar: die Beschriftung, weil die Folie oft
    // schon eine Ueberschrift traegt, und die Wortmarke, weil sie auf einer
    // fremden Folie der Marke ein zweites Mal widerspricht. bare schaltet
    // beides ab und laesst nur die Zeichnung stehen.
    var o = opts || {};
    var caps = o.bare ? false : o.captions !== false;
    var wm   = o.bare ? false : o.wordmark !== false;

    if (caps && S.caption) {
      var c = S.caption;
      ctx.save();
      ctx.globalAlpha = c.alpha;
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#fff';
      ctx.font = '700 44px "Plus Jakarta Sans", -apple-system, Helvetica, sans-serif';
      ctx.fillText(c.label, 132, 148);
      ctx.globalAlpha = c.alpha * .62;
      ctx.font = '500 25px "Plus Jakarta Sans", -apple-system, Helvetica, sans-serif';
      ctx.fillText(c.sub, 132, 190);
      ctx.globalAlpha = c.alpha * .5;
      ctx.fillRect(132, 76, 52, 3);
      ctx.restore();
    }
    if (wm) {
      // Wortmarke: Poppins Bold, wie im Design-System festgelegt.
      ctx.save();
      ctx.globalAlpha = .34;
      ctx.fillStyle = '#fff';
      ctx.font = '700 25px Poppins, "Plus Jakarta Sans", sans-serif';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '7px';
      ctx.textAlign = 'right';
      ctx.fillText('NOURA', W - 128, H - 108);
      ctx.restore();
    }
  }

  function makeScene(build, dur) {
    return {
      DUR: dur, W: W, H: H,
      render: function (ctx, t, cw, ch, opts) {
        t = ((t % dur) + dur) % dur;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // Ohne Grund bleibt der Alphakanal frei — fuer die Fassungen, die
        // auf einer fremden Folie liegen. Die Aurora ist dann Sache der
        // Folie, nicht des Clips.
        if (opts && opts.transparent) ctx.clearRect(0, 0, cw, ch);
        else background(ctx, cw, ch);
        var s = Math.min(cw / W, ch / H);
        ctx.setTransform(s, 0, 0, s, (cw - W * s) / 2, (ch - H * s) / 2);
        var S = build(t);
        paint(ctx, S, t);
        chrome(ctx, S, opts);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    };
  }

  var SCENES = {
    full:     makeScene(buildFull, DUR),
    platform: makeScene(buildPlatform, PLAT_DUR),
    agentic:  makeScene(buildAgentic, AG_DUR)
  };
  global.NOURA_SCENES = SCENES;
  global.NOURA_SCENE = SCENES.full;   // die lange Schleife bleibt der Standard
})(window);
