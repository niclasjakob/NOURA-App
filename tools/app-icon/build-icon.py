#!/usr/bin/env python3
"""NOURA — App-Icon erzeugen.

Die Marke ist ein N, dessen Diagonale Licht ist — auf dem lauten Grund kehrt
sich das um: das weisse N *ist* das Licht, der Grund traegt die Farbe. Er ist
die Aurora bei voller Sattheit, von Orange-Koralle oben rechts ueber Magenta
in Violett und Elektroblau unten links.

Warum nicht der ruhige Verlauf des Intro-Screens: korallenes N auf gedaempftem
Violett hat auf 60px zu wenig Abstand, das Zeichen saeuft ab. Weiss auf
gesaettigt traegt jede Groesse. Und warum kein volles Korallenfeld, das noch
lauter waere: NOURA ist "Connected by Vodafone" — eine rote Kachel liest sich
als Vodafone-App. Ein Spektrum steht neben Vodafone-Rot, Telekom-Magenta und
O2-Blau fuer sich.

    python3 tools/app-icon/build-icon.py                  # bold (Standard)
    python3 tools/app-icon/build-icon.py --tone quiet     # Intro-Aurora, korallenes N
    python3 tools/app-icon/build-icon.py --tone feld      # Korallenfeld, weisses N
    python3 tools/app-icon/build-icon.py --tone kontrast  # tiefe Nacht, heisse Koralle
    python3 tools/app-icon/build-icon.py --mark sharp     # Versalform statt Rundung
    python3 tools/app-icon/build-icon.py --mark wordmark  # gesetztes N (Stand 17.09.)

Erzeugt drei iOS-Varianten (hell, dunkel, getoent — iOS 18) in
ios/App/App/Assets.xcassets/AppIcon.appiconset/, den Startbildschirm, die
Web-Icons in public/ und die SVG-Exporte in brand/. Gerendert wird mit Chrome im Headless-Modus; Assets stecken als
data-URI in der Seite, damit keine file://-Zugriffsregeln greifen.
"""
import argparse, base64, json, math, pathlib, subprocess, sys, tempfile

ROOT    = pathlib.Path(__file__).resolve().parents[2]
ICONSET = ROOT / "ios/App/App/Assets.xcassets/AppIcon.appiconset"
PUBLIC  = ROOT / "public"
SPLASH  = ROOT / "ios/App/App/Assets.xcassets/Splash.imageset"
BRAND   = ROOT / "brand"
APPIMG  = ROOT / "src/assets/img"
CHROME  = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

CORAL      = "#e15055"   # --noura-accent, die Wortmarken-Farbe
CORAL_DARK = "#ef6166"   # auf dunklerem Grund einen Hauch heller

def data_uri(rel, mime):
    return "data:" + mime + ";base64," + base64.b64encode((ROOT / rel).read_bytes()).decode()

AURORA = data_uri("src/assets/img/aurora-bg.webp", "image/webp")
FONT   = data_uri("src/assets/fonts/GeneralSans-700.woff2", "font/woff2")

# --- Die Marke -----------------------------------------------------------
# Ein 1024er Feld, das Zeichen sitzt in einem 578x568-Kasten mittig darin.
# Die Punkte sind Strichmitten, die runden Enden tragen je 59px darueber
# hinaus — deshalb 282/742 und 287/737 und nicht die Kastenkanten.
STROKE = 118
PATH_STEM_L = "M282 737 V287"
PATH_STEM_R = "M742 737 V287"
PATH_DIAG   = "M282 287 L742 737"

# Kante-Variante: dasselbe N mit Versalgeometrie statt Strich, 520x560 auf
# (252,232), Stamm 140, Diagonalversatz 230.
SHARP_N    = "M0 0 H140 L380 330 V0 H520 V560 H380 L140 230 V560 H0 Z"
SHARP_DIAG = "M140 0 L380 330 L380 560 L140 230 Z"

def mark_beam(stem, lit, mid):
    """N als ein Zug, Diagonale als Lichtstrahl."""
    return ("<defs><linearGradient id='beam' x1='282' y1='287' x2='742' y2='737' "
            "gradientUnits='userSpaceOnUse'>"
            "<stop offset='0' stop-color='" + lit + "'/>"
            "<stop offset='.38' stop-color='" + mid + "'/>"
            "<stop offset='.8' stop-color='" + stem + "'/></linearGradient></defs>"
            "<g fill='none' stroke-linecap='round' stroke-width='" + str(STROKE) + "'>"
            "<path d='" + PATH_STEM_L + "' stroke='" + stem + "'/>"
            "<path d='" + PATH_STEM_R + "' stroke='" + stem + "'/>"
            "<path d='" + PATH_DIAG + "' stroke='url(#beam)'/></g>")

def mark_sharp(stem, lit, mid):
    """Dieselbe Idee auf der Versalform der Wortmarke.
    Achtung: die Verlaufskoordinaten liegen im lokalen Raum des Pfades — der
    traegt das translate, also zaehlen die Bandenden 140,0 -> 380,560."""
    return ("<defs><linearGradient id='beam' x1='140' y1='0' x2='380' y2='560' "
            "gradientUnits='userSpaceOnUse'>"
            "<stop offset='0' stop-color='" + lit + "'/>"
            "<stop offset='.42' stop-color='" + mid + "'/>"
            "<stop offset='.78' stop-color='" + stem + "'/></linearGradient>"
            "<clipPath id='n'><path d='" + SHARP_N + "' transform='translate(252,232)'/></clipPath></defs>"
            "<g transform='translate(252,232)'><path d='" + SHARP_N + "' fill='" + stem + "'/></g>"
            "<g clip-path='url(#n)'><path d='" + SHARP_DIAG + "' transform='translate(252,232)' "
            "fill='url(#beam)'/></g>")

def mark_wordmark(stem, lit, mid):
    """Das gesetzte N der Wortmarke — der Stand vor dem 2026-09-17.
    x/y stehen nicht auf 512: dominant-baseline='central' richtet an der
    Schriftmitte aus, nicht an der Versalhoehe."""
    return ("<text x='506' y='500' text-anchor='middle' dominant-baseline='central' "
            "font-family='General Sans' font-weight='700' font-size='560' "
            "style='letter-spacing:-8px' fill='" + stem + "'>N</text>")

MARKS = {"beam": mark_beam, "sharp": mark_sharp, "wordmark": mark_wordmark}

# --- Die drei iOS-Varianten ---------------------------------------------
BASE = ("*{margin:0;padding:0;box-sizing:border-box}"
        "@font-face{font-family:'General Sans';src:url(" + FONT + ") format('woff2');font-weight:700}"
        "html,body{width:1024px;height:1024px;overflow:hidden}"
        ".icon{position:relative;width:1024px;height:1024px;overflow:hidden;"
        "font-family:'General Sans',system-ui,sans-serif}"
        ".icon>svg{position:relative;width:100%;height:100%;display:block}")

def aurora_quiet(dim, overlay=""):
    """Der ruhige Zuschnitt des Intro-Screens — der Stand vor der Farbentscheidung."""
    return (".icon{background:#232452 url(" + AURORA + ") no-repeat;"
            "background-size:1024px 2220px;background-position:0 -1120px}"
            ".icon::before{content:'';position:absolute;inset:0;background:"
            "radial-gradient(115% 85% at 80% 14%,rgba(217,104,108,.60),transparent 60%),"
            "radial-gradient(95% 85% at 8% 98%,rgba(77,125,172,.50),transparent 58%),"
            "radial-gradient(62% 62% at 50% 52%,rgba(26,26,64," + dim + "),transparent 72%)"
            + overlay + "}")

# Der bold-Grund liegt als Daten vor, damit CSS (fuer die PNG-Renderei) und
# SVG (fuer den Export) aus derselben Quelle kommen. Zwei Definitionen waeren
# zwei Staende, die auseinanderlaufen — und genau das faellt erst auf, wenn
# jemand das SVG neben das Icon legt.
# Radiale Ebenen: rx/ry in Anteilen der Kantenlaenge, Mitte cx/cy ebenso,
# Farbe laeuft bis "fade" auf Deckkraft 0 aus. Reihenfolge: oberste zuerst.
BOLD_LAYERS = [
    {"kind": "radial", "rx": 1.20, "ry": .95, "cx": .88, "cy": .06,
     "color": "#ff7a4d", "rgb": "255,122,77", "fade": .55},
    {"kind": "radial", "rx": 1.10, "ry": .95, "cx": .04, "cy": 1.0,
     "color": "#2f6bff", "rgb": "47,107,255", "fade": .58},
    {"kind": "linear", "angle": 150,
     "stops": [(0.0, "#f0455c"), (.48, "#b32d7d"), (1.0, "#5b2bb0")]},
]

def _pct(v):
    return ("%g" % (v * 100)) + "%"

def bold_ground(overlay=""):
    """Die Aurora bei voller Sattheit, als CSS. Nachgebaut statt das Bild
    aufzudrehen: das gefilterte Aurora-Bild kippt ins Blau und bandet."""
    parts = []
    for l in BOLD_LAYERS:
        if l["kind"] == "radial":
            parts.append("radial-gradient(" + _pct(l["rx"]) + " " + _pct(l["ry"]) +
                         " at " + _pct(l["cx"]) + " " + _pct(l["cy"]) + "," +
                         l["color"] + " 0%,rgba(" + l["rgb"] + ",0) " + _pct(l["fade"]) + ")")
        else:
            parts.append("linear-gradient(" + str(l["angle"]) + "deg," +
                         ",".join(c + " " + _pct(o) for o, c in l["stops"]) + ")")
    return (".icon{background:" + ",".join(parts) + "}"
            + (".icon::before{content:'';position:absolute;inset:0;background:"
               + overlay + "}" if overlay else ""))

def _linear_endpoints(angle_deg, px):
    """CSS-Winkel: 0deg zeigt nach oben, im Uhrzeigersinn steigend."""
    a = math.radians(angle_deg)
    dx, dy = math.sin(a), -math.cos(a)
    length = abs(px * math.sin(a)) + abs(px * math.cos(a))
    c = px / 2
    return (c - dx * length / 2, c - dy * length / 2, c + dx * length / 2, c + dy * length / 2)

def bold_ground_svg(px=1024):
    """Dieselben Ebenen als SVG. Die elliptischen CSS-Radien werden zu einem
    Kreis mit r=rx plus y-Stauchung — SVG kennt nur runde Verlaeufe."""
    defs, rects = [], []
    for i, l in enumerate(reversed(BOLD_LAYERS)):   # SVG malt von unten nach oben
        ident = "bg%d" % i
        if l["kind"] == "linear":
            x1, y1, x2, y2 = _linear_endpoints(l["angle"], px)
            stops = "".join("<stop offset='%g' stop-color='%s'/>" % (o, c) for o, c in l["stops"])
            defs.append("<linearGradient id='%s' gradientUnits='userSpaceOnUse' "
                        "x1='%.2f' y1='%.2f' x2='%.2f' y2='%.2f'>%s</linearGradient>"
                        % (ident, x1, y1, x2, y2, stops))
        else:
            cx, cy, r = l["cx"] * px, l["cy"] * px, l["rx"] * px
            k = l["ry"] / l["rx"]
            defs.append("<radialGradient id='%s' gradientUnits='userSpaceOnUse' "
                        "cx='%.2f' cy='%.2f' r='%.2f' "
                        "gradientTransform='translate(0 %.4f) scale(1 %.5f)'>"
                        "<stop offset='0' stop-color='%s'/>"
                        "<stop offset='%g' stop-color='%s' stop-opacity='0'/></radialGradient>"
                        % (ident, cx, cy, r, cy * (1 - k), k, l["color"], l["fade"], l["color"]))
        rects.append("<rect width='%d' height='%d' fill='url(#%s)'/>" % (px, px, ident))
    return "<defs>" + "".join(defs) + "</defs>" + "".join(rects)

def coral_ground(overlay=""):
    return (".icon{background:linear-gradient(158deg,#ff6a5e 0%,#ee4257 46%,#c9294f 100%)}"
            + (".icon::before{content:'';position:absolute;inset:0;background:"
               + overlay + "}" if overlay else ""))

def night_ground(overlay=""):
    return (".icon{background:"
            "radial-gradient(105% 80% at 82% 10%,rgba(255,74,92,.72),transparent 58%),"
            "radial-gradient(95% 85% at 6% 100%,rgba(58,96,220,.55),transparent 60%),"
            "linear-gradient(160deg,#1a1a4a 0%,#0e0e28 100%)}"
            + (".icon::before{content:'';position:absolute;inset:0;background:"
               + overlay + "}" if overlay else ""))

# Auf farbigem Grund stehen die Staemme knapp unter Weiss und nur die Diagonale
# macht ganz auf — sonst faellt der Strahl in der weissen Flaeche nicht auf.
WHITE_STEM = "rgba(255,255,255,.88)"
DIM = ",linear-gradient(rgba(12,10,34,.30),rgba(12,10,34,.30))"

# Ein Ton legt fuer jede der drei iOS-Fassungen Grund und Zeichenfarben fest.
TONES = {
    "bold": {
        "light":  (bold_ground(), WHITE_STEM, "#ffffff", "#fff3ea"),
        "dark":   (bold_ground("linear-gradient(rgba(12,10,34,.34),rgba(12,10,34,.34))"),
                   WHITE_STEM, "#ffffff", "#fff3ea"),
        "tinted": (".icon{background:transparent}", "#d8d8d8", "#ffffff", "#f0f0f0"),
    },
    "quiet": {
        "light":  (aurora_quiet(".30"), CORAL, "#fff1e4", "#f5836f"),
        "dark":   (aurora_quiet(".46", DIM), CORAL_DARK, "#ffeadb", "#f78f7c"),
        "tinted": (".icon{background:transparent}", "#c4c4c4", "#ffffff", "#e4e4e4"),
    },
    "feld": {
        "light":  (coral_ground(), WHITE_STEM, "#ffffff", "#fff3ea"),
        "dark":   (coral_ground("linear-gradient(rgba(12,10,34,.30),rgba(12,10,34,.30))"),
                   WHITE_STEM, "#ffffff", "#fff3ea"),
        "tinted": (".icon{background:transparent}", "#d8d8d8", "#ffffff", "#f0f0f0"),
    },
    "kontrast": {
        "light":  (night_ground(), "#ff4d5a", "#ffffff", "#ff9a7d"),
        "dark":   (night_ground("linear-gradient(rgba(0,0,0,.22),rgba(0,0,0,.22))"),
                   "#ff4d5a", "#ffffff", "#ff9a7d"),
        "tinted": (".icon{background:transparent}", "#c4c4c4", "#ffffff", "#e4e4e4"),
    },
}

def page(css, svg):
    return ("<!doctype html><html><head><meta charset='utf-8'><style>" + BASE + css +
            "</style></head><body><div class='icon'><svg viewBox='0 0 1024 1024'>"
            + svg + "</svg></div></body></html>")

def variants(mark, tone):
    draw, t = MARKS[mark], TONES[tone]
    out = {}
    for key, name in (("light", "AppIcon-1024"), ("dark", "AppIcon-1024-dark"),
                      ("tinted", "AppIcon-1024-tinted")):
        css, stem, lit, mid = t[key]
        out[name] = (page(css, draw(stem, lit, mid)), key == "tinted")
    return out

# --- Startbildschirm ------------------------------------------------------
# Das Bild ist quadratisch (2732), die Storyboard-Ansicht zieht es mit
# scaleAspectFill auf. Auf einem 1206x2622-Schirm bleiben davon die mittleren
# 46 % Breite stehen — alles, was zaehlt, muss in diesem Streifen liegen.
# Deshalb ein eigener, fast senkrechter Verlauf statt des diagonalen aus dem
# Icon: der wuerde seine Ecken genau dort verlieren, wo die Farbe herkommt.
SPLASH_PX   = 2732
SPLASH_MARK = 668          # SVG-Kasten; das Zeichen darin misst 578/1024 davon
SPLASH_GROUND = ("radial-gradient(90% 46% at 72% 4%,#ff7a4d 0%,rgba(255,122,77,0) 60%),"
                 "radial-gradient(85% 44% at 26% 98%,#2f6bff 0%,rgba(47,107,255,0) 62%),"
                 "linear-gradient(170deg,#f0455c 0%,#b32d7d 46%,#5b2bb0 100%)")

def splash_page(dark):
    # Die erste Background-Ebene liegt oben: der Abdunkler gehoert nach vorn,
    # angehaengt waere er unsichtbar hinter den Farbebenen.
    overlay = ("linear-gradient(rgba(12,10,34,.34),rgba(12,10,34,.34))," if dark else "")
    svg = MARKS["beam"](WHITE_STEM, "#ffffff", "#fff3ea")
    return ("<!doctype html><html><head><meta charset='utf-8'><style>"
            "*{margin:0;padding:0;box-sizing:border-box}"
            "html,body{width:" + str(SPLASH_PX) + "px;height:" + str(SPLASH_PX) + "px;overflow:hidden}"
            ".splash{position:relative;width:" + str(SPLASH_PX) + "px;height:" + str(SPLASH_PX) + "px;"
            "display:grid;place-items:center;background:" + overlay + SPLASH_GROUND + "}"
            "svg{width:" + str(SPLASH_MARK) + "px;height:" + str(SPLASH_MARK) + "px;display:block}"
            "</style></head><body><div class='splash'><svg viewBox='0 0 1024 1024'>"
            + svg + "</svg></div></body></html>")

# --- SVG-Export ----------------------------------------------------------
# Fuer Figma, Folien und alles, was Vektor braucht. Kein zweiter Stand: Grund
# und Zeichen kommen aus denselben Funktionen wie die PNGs.
def svg_file(body, label, px=1024):
    return ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + str(px) + " " + str(px) + "' "
            "width='" + str(px) + "' height='" + str(px) + "' role='img' aria-label='" + label + "'>"
            "<title>" + label + "</title>" + body + "</svg>\n")

SVG_EXPORTS = {
    "noura-icon-light.svg": (
        "NOURA App-Icon, hell",
        lambda: bold_ground_svg() + MARKS["beam"](WHITE_STEM, "#ffffff", "#fff3ea")),
    "noura-icon-dark.svg": (
        "NOURA App-Icon, dunkel",
        # Der Abdunkler ist eine flache Flaeche — in CSS ein Verlauf ohne
        # Gefaelle, hier schlicht ein Rechteck.
        lambda: bold_ground_svg() + "<rect width='1024' height='1024' fill='#0c0a22' fill-opacity='.34'/>"
                + MARKS["beam"](WHITE_STEM, "#ffffff", "#fff3ea")),
    "noura-icon-tinted.svg": (
        "NOURA App-Icon, getoent",
        lambda: MARKS["beam"]("#d8d8d8", "#ffffff", "#f0f0f0")),
    "noura-mark.svg": (
        "NOURA Zeichen",
        lambda: MARKS["beam"](WHITE_STEM, "#ffffff", "#fff3ea")),
}

SPLASH_CONTENTS = {
    "images": [
        {"filename": "splash-light.jpg", "idiom": "universal"},
        {"appearances": [{"appearance": "luminosity", "value": "dark"}],
         "filename": "splash-dark.jpg", "idiom": "universal"},
    ],
    "info": {"author": "xcode", "version": 1},
}

CONTENTS = {
    "images": [
        {"filename": "AppIcon-1024.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"},
        {"appearances": [{"appearance": "luminosity", "value": "dark"}],
         "filename": "AppIcon-1024-dark.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"},
        {"appearances": [{"appearance": "luminosity", "value": "tinted"}],
         "filename": "AppIcon-1024-tinted.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"},
    ],
    "info": {"author": "xcode", "version": 1},
}

def render(html, out, transparent, px=1024):
    if not pathlib.Path(CHROME).exists():
        sys.exit("Chrome nicht gefunden: " + CHROME)
    with tempfile.TemporaryDirectory() as tmp:
        src = pathlib.Path(tmp) / "icon.html"
        src.write_text(html)
        cmd = [CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
               "--force-device-scale-factor=1", "--window-size=" + str(px) + "," + str(px)]
        if transparent:
            cmd.append("--default-background-color=00000000")
        cmd += ["--screenshot=" + str(out), src.as_uri()]
        subprocess.run(cmd, check=True, capture_output=True)

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--mark", choices=sorted(MARKS), default="beam")
    ap.add_argument("--tone", choices=sorted(TONES), default="bold")
    args = ap.parse_args()

    ICONSET.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(exist_ok=True)
    for name, (html, transparent) in variants(args.mark, args.tone).items():
        out = ICONSET / (name + ".png")
        render(html, out, transparent)
        print("gerendert:", out.relative_to(ROOT))
    (ICONSET / "Contents.json").write_text(json.dumps(CONTENTS, indent=2) + "\n")

    # Startbildschirm: dieselbe Marke, eigener Verlauf fuer den Beschnitt.
    SPLASH.mkdir(parents=True, exist_ok=True)
    for dark, name in ((False, "splash-light"), (True, "splash-dark")):
        png = SPLASH / (name + ".png")
        render(splash_page(dark), png, False, SPLASH_PX)
        # Als JPEG: 2732x2732 Verlauf kostet als PNG 2,4 MB, als JPEG 200 KB,
        # und der Startbildschirm braucht keine Transparenz.
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "92",
                        str(png), "--out", str(SPLASH / (name + ".jpg"))],
                       check=True, capture_output=True)
        png.unlink()
        print("gerendert:", (SPLASH / (name + ".jpg")).relative_to(ROOT))
    (SPLASH / "Contents.json").write_text(json.dumps(SPLASH_CONTENTS, indent=2) + "\n")

    # SVG: dieselbe Marke als Vektor, unabhaengig vom gewaehlten Ton.
    BRAND.mkdir(exist_ok=True)
    for name, (label, build) in SVG_EXPORTS.items():
        (BRAND / name).write_text(svg_file(build(), label))
        print("geschrieben:", (BRAND / name).relative_to(ROOT))

    # Die App zeigt dasselbe Zeichen auf dem Intro — aus derselben Quelle,
    # damit brand/ und src/assets/ nicht auseinanderlaufen.
    (APPIMG / "noura-mark.svg").write_text(svg_file(SVG_EXPORTS["noura-mark.svg"][1](),
                                                    SVG_EXPORTS["noura-mark.svg"][0]))
    print("geschrieben:", (APPIMG / "noura-mark.svg").relative_to(ROOT))

    # Web: Favicon und Home-Screen-Icon aus derselben hellen Variante.
    light = ICONSET / "AppIcon-1024.png"
    for size, target in ((180, "apple-touch-icon.png"), (256, "favicon.png")):
        subprocess.run(["sips", "-Z", str(size), str(light), "--out", str(PUBLIC / target)],
                       check=True, capture_output=True)
        print("gerendert:", (PUBLIC / target).relative_to(ROOT))

if __name__ == "__main__":
    main()
