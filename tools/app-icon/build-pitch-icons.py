#!/usr/bin/env python3
"""NOURA — die drei Saeulen als Icons: Produkt, Plattform, Agentische Organisation.

Fuer die Pitch-Folie. Alle drei sind aus derselben Geometrie gebaut wie die
Marke: 1024er Feld, Strahl auf 45 Grad von oben links nach unten rechts,
runde Enden, Staemme knapp unter Weiss und nur die Diagonale ganz auf.

Das System ist der Strahl in drei Zustaenden — so erzaehlt die Folie die
Gliederung schon, bevor jemand die Beschriftung liest:

    Produkt      ein Strahl, gefasst      — das Zeichen in der Icon-Silhouette
    Plattform    drei Strahlen, gestapelt — dieselbe Diagonale als Schichten
    Agentisch    der Strahl verzweigt     — Knoten auf den beiden Diagonalen

Grund und Silhouette kommen aus build-icon.py, damit die Kachel-Fassungen
nicht neben dem App-Icon auseinanderlaufen.

    python3 tools/app-icon/build-pitch-icons.py           # nur die Zeichen
    python3 tools/app-icon/build-pitch-icons.py --kachel   # zusaetzlich auf Aurora

Anders als brand/*.svg schreiben diese Dateien Deckkraft als stop-opacity
statt als rgba() im Farbwert: die Icons landen in Figma, Keynote und
Illustrator, und die kennen rgba() im Verlaufsstopp nicht.
"""
import argparse, importlib.util, math, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT  = ROOT / "brand/pitch"

# build-icon.py traegt einen Bindestrich im Namen, also von Hand laden.
_spec = importlib.util.spec_from_file_location("build_icon", HERE / "build-icon.py")
icon = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(icon)

PX = 1024
C  = PX / 2

# --- Bausteine -----------------------------------------------------------
# Die Stopps der Marke: der Strahl laeuft von reinem Weiss ueber einen Hauch
# Waerme nach knapp unter Weiss. Ein Verlauf pro Datei, in Nutzerkoordinaten
# ueber die ganze Diagonale — so liegt das Licht in allen drei Icons gleich.
def beam_grad(x1, y1, x2, y2, ident="beam"):
    return ("<linearGradient id='" + ident + "' gradientUnits='userSpaceOnUse' "
            "x1='%.1f' y1='%.1f' x2='%.1f' y2='%.1f'>" % (x1, y1, x2, y2) +
            "<stop offset='0' stop-color='#ffffff'/>"
            "<stop offset='.38' stop-color='#fff3ea'/>"
            "<stop offset='.8' stop-color='#ffffff' stop-opacity='.88'/>"
            "</linearGradient>")

def svg_file(body, label, px=PX):
    """Wie icon.svg_file, aber mit xlink-Namensraum: die Silhouette liegt
    einmal in <defs> und wird referenziert, sonst stuende der 400-Punkte-
    Pfad sechsmal in der Plattform-Datei."""
    return ("<svg xmlns='http://www.w3.org/2000/svg' "
            "xmlns:xlink='http://www.w3.org/1999/xlink' "
            "viewBox='0 0 %d %d' width='%d' height='%d' role='img' aria-label='%s'>"
            % (px, px, px, px, label) + "<title>" + label + "</title>" + body + "</svg>\n")

def sq_def(ident="sq"):
    return "<path id='%s' d='%s'/>" % (ident, icon.squircle_path(PX))

def use_sq(paint, width, opacity=None, ident="sq"):
    op = " stroke-opacity='%s'" % opacity if opacity is not None else ""
    return ("<use href='#%s' xlink:href='#%s' fill='none' stroke='%s'%s "
            "stroke-width='%.1f' stroke-linejoin='round'/>" % (ident, ident, paint, op, width))

def stroke(d, paint, width, opacity=None):
    op = " stroke-opacity='%s'" % opacity if opacity is not None else ""
    return ("<path d='%s' fill='none' stroke='%s'%s stroke-width='%.1f' "
            "stroke-linecap='round'/>" % (d, paint, op, width))

def circle(cx, cy, r, fill, opacity=None):
    op = " fill-opacity='%s'" % opacity if opacity is not None else ""
    return "<circle cx='%.1f' cy='%.1f' r='%.1f' fill='%s'%s/>" % (cx, cy, r, fill, op)

STEM = "#ffffff"   # plus stroke-opacity .88 — siehe WHITE_STEM in build-icon.py

# --- 1. Produkt ----------------------------------------------------------
# Das Zeichen in der Icon-Silhouette: das, was der Kunde in der Hand haelt.
# Der Rahmen ist dieselbe Superellipse wie das App-Icon, nur als Kontur und
# zurueckgenommen — er fasst, er konkurriert nicht.
FRAME_S = 0.70    # Rahmen-Mittellinie bei 512 +- 358
FRAME_W = 60
MARK_S  = 0.66    # Zeichen darin; Enden bleiben 138px vom Rahmen entfernt

def product_body():
    ms = MARK_S
    # Die Punkte der Marke, um die Mitte skaliert. Der Verlauf steckt in
    # derselben Gruppe und skaliert mit — er bleibt auf der Diagonale.
    return ("<defs>" + sq_def() + beam_grad(282, 287, 742, 737) + "</defs>"
            "<g transform='translate(%.1f %.1f) scale(%.4f) translate(%.1f %.1f)'>"
            % (C, C, FRAME_S, -C, -C) +
            use_sq(STEM, FRAME_W / FRAME_S, ".50") +
            "</g>"
            "<g transform='translate(%.1f %.1f) scale(%.4f) translate(%.1f %.1f)'>"
            % (C, C, ms, -C, -C) +
            stroke(icon.PATH_STEM_L, STEM, icon.STROKE, ".88") +
            stroke(icon.PATH_STEM_R, STEM, icon.STROKE, ".88") +
            stroke(icon.PATH_DIAG, "url(#beam)", icon.STROKE) +
            "</g>")

# --- 2. Plattform --------------------------------------------------------
# Dieselbe Silhouette wie beim Produkt, aber dreimal, versetzt entlang des
# Strahls: eine Flaeche gegenueber vielen. Das ist die Aussage der Folie an
# dieser Stelle, und sie steht schon in der Geometrie.
#
# Die hinteren Kacheln sind dort aufgetrennt, wo die vordere liegt — sonst
# kreuzen sich drei Konturen in der Mitte und der Stapel liest sich als
# Geflecht statt als Tiefe. Die Luecken sind ausgerechnet und stehen als
# offene Teilpfade in der Datei; eine Maske waere kuerzer, aber CoreSVG
# (Quick Look, Keynote, Pages) setzt sie falsch um und frisst die halbe
# Form. Ein Pitch-Asset wandert durch fremde Programme — hier zaehlt, dass
# nichts ausser "Pfad mit Kontur" noetig ist.
PLAT_TILE  = 0.400   # halbe Kachelbreite 205 auf dem 1024er Feld
PLAT_STEP  = 150     # Versatz entlang der Diagonale
PLAT_W     = 56
PLAT_GAP   = 24      # sichtbare Luft zwischen den Konturen
PLAT_DIM   = (".40", ".62", None)   # None = der volle Verlauf, vorne

def _sq_points():
    """Die Silhouette als Punktliste — aus demselben Pfad, der gezeichnet
    wird, damit Aussparung und Kontur nicht auseinanderlaufen."""
    d = icon.squircle_path(PX).rstrip("Z").replace("M", "").split("L")
    return [tuple(float(v) for v in q.split()) for q in d]

def _place(pts, k):
    s = PLAT_TILE
    return [((x - C) * s + C + k, (y - C) * s + C + k) for x, y in pts]

def _near_or_inside(px, py, poly, thresh):
    """Abstand zum Kantenzug, plus Punkt-in-Polygon. Die Silhouette ist
    konvex, also bleibt pro Kachel genau ein sichtbarer Bogen uebrig."""
    inside = False
    best = float("inf")
    n = len(poly)
    for i in range(n):
        ax, ay = poly[i]
        bx, by = poly[(i + 1) % n]
        dx, dy = bx - ax, by - ay
        t = 0.0 if (dx == 0 and dy == 0) else ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
        t = 0.0 if t < 0 else (1.0 if t > 1 else t)
        best = min(best, math.hypot(px - (ax + t * dx), py - (ay + t * dy)))
        if (ay > py) != (by > py) and px < ax + (py - ay) / (by - ay) * dx:
            inside = not inside
    return inside or best < thresh

def _runs(poly, blockers, thresh):
    """Zusammenhaengende sichtbare Stuecke des geschlossenen Zuges."""
    keep = [not any(_near_or_inside(x, y, b, thresh) for b in blockers) for x, y in poly]
    if all(keep):
        return [poly + [poly[0]]]
    n = len(poly)
    start = next((i for i in range(n) if keep[i] and not keep[i - 1]), None)
    if start is None:
        return []
    out, cur = [], []
    for j in range(n + 1):
        i = (start + j) % n
        if keep[i] and j < n:
            cur.append(poly[i])
        elif cur:
            out.append(cur); cur = []
    return out

def platform_body():
    base = _sq_points()
    o = PLAT_STEP * math.sqrt(0.5)
    ks = [(1 - i) * o for i in range(3)]      # hinten unten rechts -> vorne oben links
    polys = [_place(base, k) for k in ks]
    # Mitte zu Mitte: halbe Kontur vorn + Luft + halbe Kontur hinten.
    thresh = PLAT_W + PLAT_GAP
    half = 512 * PLAT_TILE
    body = []
    for i in range(3):
        paint = STEM if PLAT_DIM[i] else "url(#beam)"
        if i == 2:                            # vorne, ungeschnitten
            body.append("<g transform='translate(%.1f %.1f) scale(%.4f) translate(%.1f %.1f)'>"
                        % (C + ks[i], C + ks[i], PLAT_TILE, -C, -C)
                        + use_sq(paint, PLAT_W / PLAT_TILE, PLAT_DIM[i]) + "</g>")
            continue
        for run in _runs(polys[i], polys[i + 1:], thresh):
            d = "M" + "L".join("%.1f %.1f" % q for q in run)
            body.append(stroke(d, paint, PLAT_W, PLAT_DIM[i]))
    return ("<defs>" + sq_def()
            + beam_grad(C - half, C - half, C + half, C + half) + "</defs>" + "".join(body))

# --- 3. Agentische Organisation -----------------------------------------
# Der Strahl laeuft weiter durch die Mitte — auf ihm und quer dazu sitzen
# die Knoten. Kern und Strahl teilen sich denselben Verlauf, deshalb schwillt
# der Strahl in der Mitte an, statt von einer Scheibe unterbrochen zu werden.
AG_REACH = 262    # Knotenmitte, je Achse ab Mitte
AG_NODE  = 70
AG_HUB   = 100
AG_BEAM  = 64
AG_CROSS = 46

def agentic_body():
    k = AG_REACH
    tl, br = (C - k, C - k), (C + k, C + k)      # auf dem Strahl
    tr, bl = (C + k, C - k), (C - k, C + k)      # quer dazu
    edge = AG_NODE * math.sqrt(0.5)              # Kante des Knotens auf der Diagonale
    cross = "M%.1f %.1f L%.1f %.1f" % (tr[0] - edge, tr[1] + edge,
                                       bl[0] + edge, bl[1] - edge)
    beam  = "M%.1f %.1f L%.1f %.1f" % (tl[0] + edge, tl[1] + edge,
                                       br[0] - edge, br[1] - edge)
    return ("<defs>" + beam_grad(C - k, C - k, C + k, C + k) + "</defs>"
            + stroke(cross, STEM, AG_CROSS, ".52")
            + stroke(beam, "url(#beam)", AG_BEAM)
            + "".join(circle(p[0], p[1], AG_NODE, STEM, ".88") for p in (tl, tr, bl, br))
            + circle(C, C, AG_HUB, "url(#beam)"))

# --- Ausgabe -------------------------------------------------------------
ICONS = {
    "noura-product":      ("NOURA Product",     product_body),
    "noura-platform":     ("NOURA Platform",    platform_body),
    "noura-agentic-org":  ("NOURA Agentic Organisation", agentic_body),
}

# Auf der Kachel sitzt das Zeichen etwas kleiner, damit es die Silhouette
# nicht beruehrt — dasselbe Verhaeltnis wie beim App-Icon.
TILE_S = 0.78

def tile(body):
    return ("<defs><clipPath id='tile'><path d='" + icon.squircle_path(PX) + "'/></clipPath></defs>"
            "<g clip-path='url(#tile)'>" + icon.bold_ground_svg(PX) + "</g>"
            "<g transform='translate(%.1f %.1f) scale(%.4f) translate(%.1f %.1f)'>"
            % (C, C, TILE_S, -C, -C) + body + "</g>")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kachel", action="store_true", help="zusaetzlich die Aurora-Fassungen")
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (label, body) in ICONS.items():
        files = [(name + ".svg", label, body())]
        if args.kachel:
            files.append((name + "-tile.svg", label + ", Kachel", tile(body())))
        for fname, lab, svg in files:
            (OUT / fname).write_text(svg_file(svg, lab))
            print("geschrieben:", (OUT / fname).relative_to(ROOT))

if __name__ == "__main__":
    main()
