---
name: noura-design
description: NOURA Design System — pixelgenaue Umsetzung der Figma-Vorlage "NOURA Concept · Hi-Fi V7" für den iOS-Klick-Prototyp. MUSS ausgelöst werden, wenn an NOURA-Screens, -Komponenten oder -Styling gearbeitet wird: "NOURA Screen bauen", "Intro-Screen", "Home-Screen", "Plan-Auswahl", "Design umsetzen", "pixelgenau nach Figma", "Aurora-Hintergrund", "SIM-Karte", "Glass-Card", "Design-Token", "noura-design". Enthält verbindliche Tokens, Komponenten-Rezepte, Asset-Register und die Abweichungsliste Code↔Figma. Ebenso bei "Design-Review", "UI-Audit", "Kontrast prüfen", "Barrierefreiheit", "HIG", "wirkt generisch" — dann zusammen mit dem Skill apple-design. NICHT für Backend-Arbeit, Capacitor-Konfiguration oder Repo-Organisation.
---

# NOURA Design System

Verbindliche Referenz für die pixelgenaue Umsetzung des Figma-Designs
**NOURA Concept · 📱 Hi-Fi: V7**. Alle Werte sind am 2026-07-27 direkt aus
der Figma-Datei ausgelesen (REST-API, Knoten `1330:1774`), nicht geschätzt.

- **Datei:** `6DK1NP0pdeuesOy14tl4YE`
- **Seite:** `1330:1774` ("📱Hi-Fi: V7", intern betitelt "VIDEO CLICK-DUMMY V6")
- **Alle Screens:** 393 × 852 px (iPhone 15), Sheets 393 × 782 px

---

## Qualitätsmaßstab: Apple HIG (Skill `apple-design`)

Diese Datei sagt, **was** gebaut wird — verbindliche Werte aus Figma. Sie sagt
nicht, **ob es gut ist**. Dafür gilt der Skill `apple-design`
(`.claude/skills/apple-design/`): 122 HIG-Seiten von developer.apple.com plus
eine Handwerks-Linse. Beide gelten zusammen, bei jeder Screen- und
Komponentenarbeit an NOURA.

**Pflicht bei jedem Screen-Umbau:** zusätzlich zu dieser Datei
`.claude/skills/apple-design/SKILL.md` lesen und die Referenzseiten laden, die
zum Screen gehören. Für NOURA dauerhaft relevant — weil dunkel, glasig und
ohne Umschalter:

| Datei unter `apple-design/references/hig/` | Warum bei NOURA immer |
|---|---|
| `accessibility.md` | Kontrast-Mindestwerte, Tippziele, Textskalierung |
| `color.md`, `typography.md`, `layout.md` | Grundlagen, gelten für jeden Screen |
| `designing-for-ios.md` | Plattform-Konventionen, einhändige Reichweite |
| `liquid-glass.md`, `materials.md` | Die prägende Oberfläche ist Glas — Kernthema |
| `dark-mode.md` | NOURA ist dauerhaft dunkel, ohne App-Umschalter |

Dazu 3 bis 6 Dateien nach Screen-Inhalt (Tabelle „Load by what is on screen“ in
`apple-design/SKILL.md`). Nie das ganze Verzeichnis laden. **Lesen vor dem
Zitieren** — Apple ändert die Seiten laufend, aus dem Gedächtnis zitieren gilt
nicht.

### Rangfolge bei Konflikt

Figma und HIG widersprechen sich an echten Stellen. Die Reihenfolge:

**1. Barrierefreiheit schlägt die Vorlage.** Kontrast, Tippziel (Token `--tap`,
44 px), Textskalierung. Nicht verhandelbar — aber die Lösung sucht den
Marken-Ton, nicht den Grauton: Deckkraft, Fläche und Größe anpassen, nicht die
Farbwelt aufgeben.

> `accessibility.md › Vision`: „Up to 17 pts | All | 4.5:1“ — und 3:1 ab 18 pt
> oder bei Fettschnitt.

**2. Plattform-Mechanik schlägt die Vorlage.** Safe-Area, Sheet-Verhalten,
Zurück-Geste, wo Glas liegen darf. Figma zeichnet Standbilder und kennt diese
Regeln nicht. Die „Drei Flächenstufen“ weiter unten sind genau diese Regel —
und sie decken sich mit Apple:

> `liquid-glass.md › The two layers`: „Content layer. … When this layer needs
> depth it uses standard materials, never Liquid Glass.“ / „Functional layer.
> … This is the only place Liquid Glass belongs.“

**3. Marke und Ästhetik: die Vorlage schlägt HIG.** Aurora, Koralle, Radius 24,
General Sans, die SIM-Silhouette. HIG schreibt keine Marke vor, und die
Handwerks-Linse in `apple-design` verlangt ausdrücklich einen eigenen
Standpunkt („Is it a template?“). Wer NOURA HIG-konform grau macht, hat den
Skill falsch gelesen — dessen letzte Arbeitsregel lautet wörtlich „Don’t
flatten the personality“.

**4. „Entschieden:“-Einträge stehen über allem.** Was Niclas mit Datum
festgelegt hat (Preis, Icon-Lautstärke, 24-px-Datenwerte, Liquid Glass auf
Buttons), gilt. Ein HIG-Widerspruch wird **gemeldet, nicht still überschrieben**
— mit Zahlen, dann entscheidet Niclas. Nur Regel 1 darf eine Revision
erzwingen, und auch die kommt als Vorschlag.

**Bewusst akzeptierte Lücken werden eingetragen.** Der Prototyp dient der
Vorführung, nicht dem Produktivbetrieb; eine Abweichung darf stehen bleiben.
Dann aber als „Entschieden:“-Eintrag mit Datum und Grund — nicht als
stillschweigende Schuld.

### Offene Spannungen (gerechnet am 2026-09-17)

WCAG-Werte gegen die tatsächlichen Token, gerechnet und nicht geschätzt. Weiß
trägt überall (7,7:1 auf dem Button-Glas bis 16,4:1 auf der SIM-Karte). Eng
wird es bei gedämpftem Text und bei der Akzentfarbe:

> **Behoben am 2026-09-17.** `--noura-text-muted` steht jetzt auf `.65`
> statt `.50`: 5,59:1 auf der Glaskarte, 6,97:1 auf dem Canvas, 4,35:1 auf
> dem Bedienelement. Die Zeilen bleiben als Beleg stehen, warum.

| Vordergrund | Fläche | Ist | Soll | Status |
|---|---|---|---|---|
| `--noura-text-muted` `.50` (→ `#9c9cb1`) | Glaskarte `.10` (→ `#393a63`) | 4,00:1 | 4,5:1 | ~~reichte nicht~~ → `.65` = 5,59:1 |
| `--noura-text-muted` `.50` (→ `#9192a8`) | Canvas `#232452` | 4,74:1 | 4,5:1 | → `.65` = 6,97:1 |
| `--noura-accent` `#e15055` | Glaskarte `.10` | **2,80:1** | 3:1 (Icon) | **reicht nicht** |
| `--noura-accent` `#e15055` | Canvas `#232452` | 3,79:1 | 4,5:1 Text / 3:1 Icon | nur als Icon tragfähig |
| `#ffffff` | Aurora-Koralle `#d9686c` | **3,42:1** | 4,5:1 | **reicht nicht** für Text direkt auf dem Verlauf |

Drei Konsequenzen für den nächsten Screen:

- ~~Gedämpfter Text auf Glaskarten braucht mehr als 50 % Deckkraft.~~
  Erledigt: `.65` gilt seit dem 2026-09-17, die Stufe zum weißen Text
  (10,72:1 gegen 5,59:1) trägt weiter.
- `#e15055` ist auf Glas **keine** Textfarbe und trägt dort auch als Icon
  nicht. Auf dem dunklen Canvas und auf der SIM-Karte (4,27:1) trägt es.
- Wo Text direkt auf dem Aurora-Bild steht, entscheidet die Region: über
  Marine 16,6:1, über Koralle 3,4:1. Prüfen, wo der Text tatsächlich sitzt —
  nicht der Durchschnitt des Bildes zählt.

Nachrechnen statt schätzen; JPEG-Augenmaß ist nach `apple-design` kein Befund.

**Bereits gelöst — nicht erneut als Fund melden:** Textskalierung (`--fs-*` in
rem auf `font: -apple-system-body`), Tippziele (Token `--tap: 44px`),
Safe-Area-Verrechnung (`--bar-bottom`), Glas nur auf Bedienelementen.

### Neue Screens ohne Figma-Vorlage

Der Code ist über die Vorlage hinausgewachsen: `beats`, `esim-forge`,
`ident-stage`, `magic-code`, `magic-pass`, `roaming`, `usage` und die Screens
`checkout`, `esim` stehen in keinem Screen-Register. Dort gibt es nichts
abzumessen — also führt `apple-design`, und diese Datei liefert nur das
Material: Token, die drei Flächenstufen, die Schriftrollen.

Vorgehen nach `apple-design/SKILL.md › Design improvement mode`: Token-Plan vor
dem Layout, ein Signature-Element je Screen, und die Selbstkritik davor —
„wäre derselbe Entwurf auch für ein anderes Produkt herausgekommen?“ Wenn ja,
ist er Vorgabe und kein Entwurf.

---

## Zugang zur Figma-Datei

**Der Figma-MCP-Server läuft** (geprüft 2026-09-17, Konto
`niclas.jakob1@vodafone.com`, Full-Seat in der Vodafone-Organisation).
`get_metadata`, `get_screenshot` und `get_design_context` liefern die Datei
direkt — das ist der erste Weg. Die frühere Notiz „schlägt fehl (no edit
access)" galt für das Konto `robert.heine2@vodafone.com` und ist überholt.

Die REST-API bleibt der Rückweg, wenn ein `$FIGMA_ACCESS_TOKEN` gesetzt ist
(in dieser Umgebung war am 2026-09-17 keins gesetzt):

```bash
# Knotendaten
curl -s -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" \
  "https://api.figma.com/v1/files/6DK1NP0pdeuesOy14tl4YE/nodes?ids=1330:1779"

# Screen als Bild
curl -s -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" \
  "https://api.figma.com/v1/images/6DK1NP0pdeuesOy14tl4YE?ids=1330:1779&format=png&scale=2"
```

## Screen-Register

| Screen | Node-ID | Referenzbild |
|---|---|---|
| Intro | `1700:3984` | ab 2026-09-21 massgeblich — schlanke Fassung |
| Intro (alt) | `1330:1947` | `reference/01-intro.webp` — Wortmarke + Lockup |
| Attributes (Onboarding) | `1330:1956` | `reference/02-attributes.webp` |
| Select Plan / Creator | `1330:1960` | `reference/03-plan-creator.webp` |
| Select Plan / Consumer | `1330:1984` | `reference/04-plan-consumer.webp` |
| Select Plan / Consumer 2 | `1330:2008` | `reference/05-plan-consumer2.webp` |
| Animation | `1330:1775` | `reference/06-animation.webp` |
| Home | `1330:1779` | `reference/07-home.webp` |
| Home (Variante) | `1330:1863` | `reference/08-home2.webp` |
| Support | `1330:2679` | `reference/09-support.webp` |
| Profile / Create | `1330:2692` | `reference/10-profile-create.webp` |
| Profile | `1330:2696` | `reference/11-profile.webp` |

**Komponenten-Sets:** Feature Card `1330:2033`, Plan Card `1330:2178`,
Animation v2 `1330:2404`, Navbar `1330:2662`.

**Vor jedem Screen-Umbau das Referenzbild ansehen.** Die Vorlage weicht an
mehreren Stellen deutlich vom bestehenden Code ab (siehe Abweichungsliste).

---

## Farben

Häufigkeiten aus der Figma-Datei — sie zeigen, was tragend ist und was
Ausnahme.

| Token | Wert | Vorkommen | Rolle |
|---|---|---|---|
| `--noura-text` | `#ffffff` | 456× | Alle Texte, Icons |
| `--noura-glass` | `rgba(255,255,255,.10)` | 414× | Glasflächen — die prägende Oberfläche |
| `--noura-accent` | `#e15055` | 129× | CTA, aktive Zustände, Icons, Highlights |
| `--noura-border` | `rgba(255,255,255,1)` | 104× | Kartenrand, 1.5px |
| `--noura-text-muted` | `rgba(255,255,255,.50)` | 77× | Sekundärtext |
| `--noura-scrim` | `rgba(0,0,0,.50)` | 65× | Modal-Hintergrund |
| `--noura-glass-strong` | `rgba(255,255,255,.20)` | 42× | Betonte Glasfläche |
| `--noura-card-dark` | `#1a1a1a` | 30× | SIM-Karte (Grundton) |
| `--noura-vodafone` | `#e60000` | 27× | **Nur** Vodafone-Logo-Kontext |
| `--noura-canvas` | `#232452` | 18× | Grundfarbe hinter dem Verlauf |
| `--noura-card-fill` | `rgba(29,29,29,.75)` | 7× | SIM-Karte tatsächliche Füllung |

**Aurora-Palette** (je 9×, nur im Hintergrund-Verlauf):
`#d9686c` Koralle · `#4d7dac` Blau · `#6d459a` Violett · `#1a1a40` Marine

> `#e15055` (NOURA-Koralle) und `#e60000` (Vodafone-Rot) nie verwechseln.
> Vodafone-Rot erscheint ausschließlich im Logo-Zusammenhang.

---

## Typografie

**General Sans**, lokal eingebettet unter `src/assets/fonts/`. Drei
Schnitte: 500 (Medium), 600 (Semibold), 700 (Bold).

| Rolle | Schnitt | Größe | Zeilenhöhe | Vorkommen |
|---|---|---|---|---|
| **Label** | 600 | 14px | 19px | **123×** — Buttons, Listen, Navigation |
| Card-Titel | 700 | 20px | 27px | 41× |
| Caption | 500 | 12px | 16px | 34× |
| Body | 600 | 16px | 21px | 22× |
| Body strong | 700 | 16px | 22px | 17× |
| Screen-Titel | 700 | 24px | 34px | 5× |
| Section | 600 | 20px | 27px | 8× |

> **`--fs-hero` (40px) ist am 2026-09-21 entfallen.** Die Stufe gab es fuer
> genau einen Zweck — die korallene Wortmarke auf dem Intro — und der ist
> weg. Die Wortmarke lebt weiter auf Home, dort in 16px.

**Poppins Bold** ausschließlich für die Wortmarke "NOURA" (13.3px im
Logo-Lockup). **SF Pro** nur in der iOS-Statusleiste — im nativen Build
zeichnet iOS die echte Leiste, dort entfällt sie.

---

## Maße

**Radien:** `24px` ist die Signatur (57×) — Karten, Sheets, Buttons.
Daneben `16px` (23×, verschachtelte Karten), `5px` (19×, Chips),
`1000px` (17×, Pillen und Avatare).

> Das ist die Auszählung aus Figma. Im Code verteilt sie sich seit dem
> 2026-09-04 nach Stufe: Inhalt trägt 16, Bedienelemente tragen 24.
> Siehe „Drei Flächenstufen".

**Abstände** (4px-Raster): `8px` (177×) und `4px` (153×) dominieren,
`24px` (63×) trennt Blöcke, `40px`/`64px` für großzügige Abschnitte.

**Innenabstand:** `24px` (113×) Standard, `20px` (88×) kompakt,
`48px` (19×) bei vollflächigen Screens.

**Weichzeichner:** `backdrop-filter: blur(24px)` auf Glaskarten (12×),
`blur(7px)` leicht (12×), `blur(40px)` auf Navigationsleisten und Sheets (3×).

> Hier stand, die 24 px seien „seit dem 2026-09-04 nirgends mehr im
> Einsatz". Das stimmte nicht: `--noura-blur-glass` (24 px) lag am
> 2026-09-17 noch auf vier Bedienelementen — `.opt-btn`, `.bubble`,
> `.chat-input input`, `.chat-input .send`. Daneben standen freistehende
> 6, 10, 12 und 16 px. **Jetzt gibt es drei Token und sonst nichts:**
> `--noura-blur-card` 7 px (Inhalt), `--noura-blur-control` 12 px
> (Bedienelement), `--noura-blur-bar` 40 px (Leiste und Sheet).
> `--noura-blur-glass` ist entfallen.
Der Aurora-Verlauf nutzt in Figma 300px Ebenen-Weichzeichner — **im Code als
Bild, nicht als CSS-Filter** (siehe Assets).

---

## Assets

Aus Figma exportiert, liegen unter `src/assets/`. Insgesamt 112 KB.

| Datei | Größe | Herkunft (Node) | Zweck |
|---|---|---|---|
| `img/aurora-bg.png` | 238 KB | `1330:1780` | Hintergrundverlauf, 393×852 (@1x, verlustfrei — der 150px-Weichzeichner traegt kein Detail, das @3x braeuchte; das alte 16-KB-WebP zeigte Blockartefakte und Streifen) |
| `img/avatar-marcel.webp` | 6 KB | `1330:1860` | Profilbild Home |
| `img/connected-by-vodafone.png` | 9 KB | `1330:1951` | Logo-Lockup auf dem Intro, 61px breit |
| `img/noura-app-icon.svg` | 6,3 KB | erzeugt | App-Icon auf dem Intro, aus `build-icon.py` |
| `fonts/GeneralSans-{500,600,700}.woff2` | 67 KB | Fontshare | Schrift |

**Warum Bilder statt CSS:** Der Aurora-Verlauf besteht in Figma aus vier
weichgezeichneten Vektorformen mit 300px Blur. Als CSS nachgebaut kostet das
auf dem iPhone spürbar Leistung (Safari rendert große Weichzeichner träge)
und wird trotzdem nie exakt. Als WebP sind es 16 KB und es ist pixelgleich.

**Neue Assets exportieren:**

```bash
curl -s -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" \
  "https://api.figma.com/v1/images/6DK1NP0pdeuesOy14tl4YE?ids=<NODE>&format=png&scale=3"
# danach: cwebp -q 88 datei.png -o datei.webp
```

### App-Icon (Stand 2026-09-17)

Die Marke ist ein **N, dessen Diagonale Licht ist**. Auf dem lauten Grund
kehrt sich das um: das **weisse N ist das Licht**, die Farbe liegt dahinter.
Gezeichnet als ein Zug mit runden Enden (Strichstaerke 118 auf 1024), nicht
als Versalform der Wortmarke. Figma zeichnet kein Icon; gerendert statt
gepflegt:

```bash
python3 tools/app-icon/build-icon.py                  # bold (Standard)
python3 tools/app-icon/build-icon.py --tone quiet     # Intro-Aurora, korallenes N
python3 tools/app-icon/build-icon.py --tone feld      # Korallenfeld, weisses N
python3 tools/app-icon/build-icon.py --tone kontrast  # tiefe Nacht, heisse Koralle
python3 tools/app-icon/build-icon.py --mark sharp     # Versalform statt Rundung
python3 tools/app-icon/build-icon.py --mark wordmark  # gesetztes N
```

| Datei | Zweck |
|---|---|
| `ios/.../AppIcon.appiconset/AppIcon-1024.png` | hell — gesaettigte Aurora, weisses N |
| `…-dark.png` | dunkel (iOS 18) — derselbe Grund, 34 % abgedunkelt |
| `…-tinted.png` | getoent (iOS 18) — Graustufen auf **transparentem** Grund, iOS faerbt selbst |
| `public/apple-touch-icon.png`, `public/favicon.png` | Web, aus der hellen Variante skaliert |

**Die Silhouette ist eine Superellipse, kein `border-radius`.** Die iOS-Kachel
hat keine Kreisboegen in den Ecken, sondern eine durchgehende Kruemmung;
`|x|^n + |y|^n = 1` mit n=5 trifft sie so genau, dass der Unterschied zum
22,37-%-Radius bei 90 % der halben Kantenlaenge unter einem Zehntelpixel auf
1024 liegt (nachgerechnet, nicht geschaetzt). `squircle_path()` in
`build-icon.py` tastet sie mit 400 Punkten ab — bei der Punktzahl bleibt die
Sehnenabweichung ebenfalls unter 0,1px, und der Pfad bleibt lesbar.

Gebraucht wird sie erst, seit der Intro-Screen das ganze Icon zeigt: in den
PNGs fuer iOS schneidet das System selbst zu, im SVG fuer die App nicht.

### Startbildschirm (Stand 2026-09-21)

Er zeigt **den Intro-Screen in seinem Anfangszustand** — den Aurora-Hintergrund
und darauf das App-Icon, sonst nichts. Das ist der ganze Trick an der nahtlosen
Uebergabe: das System zoomt beim Tippen das Icon auf, der Startbildschirm
faengt es an einer bestimmten Stelle auf, und der Screen, der ihn abloest,
zeigt es an genau derselben. Es bewegt sich nichts, weil es nichts zu bewegen
gibt.

Bis zum 2026-09-18 stand hier ein eigener, gesaettigter Verlauf mit grossem
weissen Zeichen — schoen fuer sich, aber er hatte mit dem Screen dahinter
nichts zu tun, und der Schnitt war entsprechend hart.

| Bildsatz | Datei | Inhalt |
|---|---|---|
| `Splash.imageset` | `splash.jpg` | Hintergrund, 1179x2556 (@3x des 393x852-Rahmens) |
| `SplashIcon.imageset` | `splash-icon.png` | das App-Icon mit Alphakanal, 512px |

**Der Hintergrund kommt aus den App-Stilen selbst.** `build-icon.py` laedt
`global.css` und `onboarding.css`, baut die Markup-Zeilen des Screens nach
(`.bg-grad`, `.bg-noise`, `.aurora-flow.tone-coral`) und laesst Chrome den
393x852-Rahmen bei dreifacher Aufloesung fotografieren. Ein nachgebauter
Verlauf waere ein zweiter Stand, und der Unterschied faellt genau dann auf,
wenn der Startbildschirm in den Screen uebergeht. Die driftenden Farbwolken
stehen beim Rendern still (`animation-play-state: paused`), damit ihr
0%-Zustand im Bild landet — derselbe, mit dem der Screen beginnt.

**Das Icon liegt bewusst nicht im Bild**, sondern als eigene Ebene im
Storyboard. Nur so laesst sich seine Groesse an die Bildschirmhoehe binden:

```
Hoehe   = 0.176 * Bildschirmhoehe    (150px auf dem 852er Rahmen)
Mitte y = 0.472 * Bildschirmhoehe    (y = 402)
```

Dieselben zwei Zahlen stehen an **drei** Stellen und muessen zusammen
geaendert werden, sonst springt das Icon beim Start:

| Stelle | Form |
|---|---|
| `src/styles/global.css` | `--intro-icon`, `--intro-cy` (gerechnet aus `--screen-h`) |
| `tools/app-icon/build-icon.py` | `ICON_FRAC`, `ICON_CY` |
| `ios/.../LaunchScreen.storyboard` | Constraint-Multiplikatoren `0.176` und `0.472` |

`build-icon.py` sieht beim Bauen in den beiden anderen Dateien nach und
meldet eine Abweichung (`check_geometry`). Das kostet zehn Zeilen und faengt
genau den Fehler, den man sonst erst im Mitschnitt sieht — im Screenshot
sieht ein um 10pt verschobenes Icon voellig in Ordnung aus.

Warum Anteile und nicht Pixel: `scaleAspectFill` skaliert das
Hintergrundbild mit der **Bildschirmhoehe**. Ein ins Bild gebackenes Icon
saesse nur auf 393x852 richtig und waere auf einem iPhone 16 Pro (874pt)
rund 10pt zu hoch — sichtbar als Ruck im Moment der Uebergabe. Auch das CSS
rechnet deshalb in Anteilen: `--screen-h` ist auf dem Geraet `100dvh` und im
Browser die 852px des Rahmens.

**Ein Bild, kein Hell/Dunkel-Paar.** Die App ist dauerhaft dunkel; ihr erster
Screen sieht in beiden Systemeinstellungen gleich aus, also waere die zweite
Datei eine Kopie. (Das App-Icon behaelt seine drei Varianten — das ist der
Home-Screen, nicht die App.)

**JPEG fuer den Hintergrund, PNG fuer das Icon.** Der Verlauf kostet als JPEG
220 KB statt Megabytes, und harte Kanten, an denen JPEG klingeln wuerde, hat
er keine — die hat nur das Icon, und das liegt daneben.

### Die Luecke zwischen Startbildschirm und Screen

Hier stand frueher, das Ergebnis lasse sich nicht per Screenshot pruefen, der
Startbildschirm stehe zu kurz. Das stimmt fuer Screenshots — und hat verdeckt,
dass er **gar nicht vorkam**. Am 2026-09-18 gemessen (iPhone 17, Mitschnitt
mit `simctl recordVideo`, Einzelbilder alle 16ms): zwischen Systemanimation
und erstem Frame des Webviews lagen **rund 500ms flache Hintergrundfarbe**.

Der Grund ist Bauart, kein Fehler: iOS nimmt den Startbildschirm weg, sobald
das Fenster steht — der Webview laedt danach noch. Drei Schichten schliessen
das jetzt, von aussen nach innen:

1. **Deckschicht (`SceneDelegate` in `AppDelegate.swift`).** Die App legt den
   Startbildschirm selbst noch einmal ueber das Fenster. Kein Nachbau: sie
   instanziiert `LaunchScreen.storyboard`, also dieselben Bilder und
   Constraints.
2. **Vorschau (`index.html`).** Derselbe Anfangszustand als Markup, mit den
   Klassen des Screens — gezeichnet, bevor das erste Skript laeuft. Im Build
   haengt das Stylesheet als `<link>` im Kopf und blockiert das Zeichnen, die
   Vorschau ist also ab dem ersten Frame da. `App.tsx` nimmt sie weg, sobald
   der echte Screen steht.
3. **Hintergrundfarbe (`capacitor.config.ts`).** `#513f6e`, der Mittelwert des
   Startbildschirms — der Rest, der uebrig bleibt, wenn die ersten beiden
   ausfallen. Voreingestellt waere Weiss.

**Das Signal ist `window.nouraPainted`, nicht `isLoading`.** Der Unterschied
ist gemessen und betraegt rund 350ms: `isLoading` faellt, waehrend der Webview
noch nichts im Bild hat. Der erste Versuch blendete darauf ab und zeigte damit
exakt die Luecke, die er schliessen sollte — im Mitschnitt fuer drei
Einzelbilder ein vollstaendig leerer Schirm. Jetzt setzt ein Inline-Skript in
`index.html` die Marke nach zwei `requestAnimationFrame` (der zweite laeuft
erst nach dem Zeichnen), und Swift fragt sie alle 40ms ab. Nach spaetestens
zwei Sekunden faellt die Deckschicht in jedem Fall — eine haengende
Deckschicht wuerde die App unbedienbar machen.

**Der Intro-Screen animiert sein Icon nicht.** Es steht schon da. Bewegung
tragen die Stufen darunter: Wortmarke Buchstabe fuer Buchstabe, dann die
Knoepfe, zuletzt die Vorfuehr-Abkuerzung.

### Pruefen

Im gebauten Katalog stehen die Bilder:

```bash
xcrun assetutil --info <DerivedData>/App.app/Assets.car | grep -E "Splash"
# erwartet: Splash 1179x2556 und SplashIcon 512x512, je ein "(default)"
```

Der Start selbst braucht einen Mitschnitt. `simctl recordVideo` schreibt nur
bei Bildaenderung, jedes Bild darin ist also ein echter Wechsel:

```bash
xcrun simctl io <SIM> recordVideo --codec=h264 --force start.mov &
xcrun simctl launch <SIM> com.niclasjakob.noura
# ... kurz warten, dann: pkill -INT -f recordVideo
```

Danach die Bilder abtasten statt sie zu zaehlen: fuenf Punkte je Bild (vier
Ecken, Icon-Mitte) und die **Spanne** zwischen ihnen. Eine Spanne nahe null
heisst flache Flaeche — also Hintergrundfarbe statt Bild, und genau das ist
der Fehler, nach dem man sucht. Ein Mitschnitt-Abtaster in Swift
(`AVAssetReader`) steht in der Sitzung vom 2026-09-21; `ffmpeg` ist auf dieser
Maschine nicht installiert, `AVFoundation` ueber `xcrun swift` schon.

### Behoben: UIScene-Adoption (2026-09-17)

Unter Xcode 27 / iOS 27 brach die App beim Start mit `EXC_BREAKPOINT` in
`__UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption` ab — das neue
SDK erzwingt die UIScene-Adoption, und das Capacitor-Projekt stammt von davor.
Wer den Simulator startet und eine App sieht, die sofort auf den Home-Screen
zurueckfaellt, hat genau das.

Behoben mit zwei Eingriffen:

- `ios/App/App/Info.plist`: `UIApplicationSceneManifest` mit einer einzelnen
  Konfiguration, `UISceneStoryboardFile = Main`. Damit baut UIKit das Fenster
  weiter aus dem Storyboard — der `CAPBridgeViewController` bleibt unberuehrt.
- `ios/App/App/AppDelegate.swift`: eine `SceneDelegate`-Klasse **in derselben
  Datei**. Absichtlich keine neue Datei: die muesste in die `project.pbxproj`
  eingetragen werden, und dieser Eingriff ist fehleranfaelliger als der Nutzen.
  Sie reicht `openURLContexts` und `continue userActivity` an den
  `ApplicationDelegateProxy` durch — unter Scenes kommen beide nicht mehr am
  AppDelegate an, und ohne diese Weiterleitung verlieren Plugins spaeter ihre
  URL-Callbacks. `willConnectTo` bleibt leer, das Fenster kommt aus dem
  Storyboard.

Geprueft: Build ohne Fehler, App laeuft im Simulator (iPhone 18 Pro, iOS 27)
und zeigt den Intro-Screen.

### Entschieden: der Intro traegt ein Markenelement, nicht drei

**Gilt seit 2026-09-21**, von Niclas beauftragt, Vorlage
[Figma 1700:3984](https://www.figma.com/design/6DK1NP0pdeuesOy14tl4YE/NOURA-Concept?node-id=1700-3984).
Der Screen zeigt jetzt **das App-Icon, darunter das Vodafone-Lockup** — und
sonst nichts.

Die Vorgeschichte in zwei Zeilen, weil sie erklaert, warum hier schon dreimal
etwas anderes stand:

| Stand | Was auf dem Intro stand |
|---|---|
| bis 2026-09-17 | Wortmarke "NOURA" 40px + Vodafone-Lockup nebeneinander |
| 2026-09-17 | das nackte weisse Zeichen ueber der Wortmarke, kein Lockup |
| **seit 2026-09-21** | **das App-Icon, darunter das Lockup, keine Wortmarke** |

Was den Ausschlag gab: eine korallene 40px-Wortmarke direkt unter einem Icon,
das dasselbe N schon zeigt, sagt den Namen zweimal — einmal laut und einmal
sehr laut. Das Icon traegt allein, das Lockup nennt den Absender, fertig. Die
Knoepfe sind geblieben, wo sie in Figma immer standen (y=666 und y=743).

**Damit ist Abweichung #5 der Liste unten wieder in Kraft**: das echte
Lockup-Bild ist der Sollzustand, `connected-by-vodafone.png` wird wieder
geladen. Die Zeile im Asset-Register, es sei „ungenutzt", galt vier Tage.

Die Maße, alle aus `1700:3984`:

| | Wert |
|---|---|
| Icon | 150 x 150, Mitte y = 402 |
| Abstand Icon zu Lockup | 30px |
| Lockup | 61 x 18 bei y = 507 |
| Knoepfe | unveraendert y = 666 / 743 |

- **Icon-Groesse und -Hoehe stehen als Anteil der Bildschirmhoehe**, nicht in
  Pixeln: `--intro-icon` = 17,6 %, `--intro-cy` = 47,2 %. Der Grund steht
  unter „Startbildschirm" — der native Startbildschirm skaliert mit der
  Hoehe, feste Pixel saessen nur auf 393x852 richtig. Verankert ist die
  **Icon-Mitte**, nicht der Block: was darunter steht, darf seine Hoehe
  aendern, ohne die Uebergabe zu verschieben.
- **Das Lockup wird ueber die Breite gesetzt (61px), nicht ueber die Hoehe.**
  Das Bild im Repo traegt 4px Rand je Seite; ueber die Breite gemessen deckt
  sich seine Zeichnung mit der aus Figma (58 x 17,5), ueber die Hoehe waere
  sie 8 % zu klein.
- **Das Icon ist die Ueberschrift.** `<h1>` mit `alt="NOURA"` — ohne die
  Wortmarke waere der Name sonst nirgends mehr ausgesprochen. Das Lockup
  traegt `alt="Connected by Vodafone"`.
- **Das Icon animiert nicht ein.** Es steht vom Startbildschirm her schon da.
  Bewegung tragen Lockup (0,24s), Knoepfe (0,40s / 0,52s) und die
  Vorfuehr-Abkuerzung (0,64s). Die Folge ist dabei von 1,66s auf 1,24s
  zusammengerueckt: mit der Wortmarke ist ihr Buchstabenaufbau entfallen, und
  der war es, der alles dahinter nach hinten geschoben hat.
- **Entfallen:** `--fs-hero`, die Klasse `.intro-logo`, die Keyframes
  `letterIn` und `src/assets/img/noura-mark.svg`. Alles hing allein an der
  Wortmarke. Der Vektor des nackten Zeichens liegt weiter in `brand/`.

**Was bewusst von der Vorlage abweicht:** das Icon selbst. Figma zeigt in
diesem Knoten einen aelteren, dunkleren Export mit gewoehnlichem
`border-radius`; im Code steht das echte App-Icon mit der
Superellipsen-Silhouette (siehe „Entschieden: das Icon ist lauter als die
App", 2026-09-17). Das ist kein Versehen, sondern die Bedingung dafuer, dass
der Startbildschirm nahtlos in den Screen laeuft — es muss dasselbe Bild sein,
das iOS beim Tippen aufzieht.

### Entschieden: Wortmarke auf Home, ohne Vodafone

**Gilt seit 2026-09-17**, von Niclas beauftragt. Figma zeichnet auf Home
keinen Marken-Kopf — das ist bewusst eine Abweichung, kein Versehen. Die
Wortmarke steht dort **ohne das Vodafone-Lockup**: das Lockup gehoert dem
Intro-Screen, wo es als Absender-Nachweis auftritt. Auf Home ist die Marke
Absender, nicht Auftritt, deshalb 16px statt der 40px des Intro.

Gepflegt an zwei Stellen: `.home-brand` in `global.css` und die Zeile in
`Home()` in `screens.tsx`.

**Die Kopfhoehe haengt jetzt an drei Werten**, nicht mehr an einem: 54px
Profilbild + 21px Wortmarkenzeile + 6px Abstand. Der Versatz der
Scrollflaeche (`.home-scroll`) steht deshalb auf **171px** statt 144px. Wer
die Zeile wieder entfernt, zieht dort 27px ab — sonst klafft ueber der
SIM-Karte eine Luecke.

### SVG-Export

`brand/` enthaelt die Marke als Vektor, erzeugt vom selben Skript wie die
PNGs — Grund und Zeichen kommen aus denselben Funktionen, damit kein zweiter
Stand entsteht:

| Datei | Inhalt |
|---|---|
| `brand/noura-icon-light.svg` | volle Kachel, heller Ton |
| `brand/noura-icon-dark.svg` | volle Kachel, dunkler Ton |
| `brand/noura-icon-tinted.svg` | Graustufen-Zeichen, transparent |
| `brand/noura-mark.svg` | nur das Zeichen, transparent |
| `brand/noura-app-icon.svg` | die volle Kachel mit Silhouette — die Fassung, die Intro und Startbildschirm zeigen |

Der bold-Grund liegt dafuer als Daten in `BOLD_LAYERS` vor (Ebenen mit
Mitte, Radien und Stops), aus denen sowohl das CSS fuer die Renderei als
auch die SVG-Verlaeufe entstehen. Zwei Stolpersteine beim Uebersetzen:
CSS-Radiale sind **elliptisch** (`120% 95%`), SVG kennt nur runde — daher
Kreis mit `r=rx` plus y-Stauchung per `gradientTransform`. Und die
CSS-Ebenenreihenfolge ist **umgekehrt** zu SVG: erste Ebene liegt in CSS
oben, in SVG unten.

### Entschieden: das Icon ist lauter als die App

**Der gesaettigte Verlauf gilt** — von Niclas am 2026-09-17 beauftragt, weil
NOURA im Telko-Markt eine deutliche Aussage treffen soll. Das Icon ist damit
**bewusst lauter als der Intro-Screen**: dort bleibt der ruhige Aurora-Verlauf
aus Figma, denn hinter Text muss er zurueckstehen. Ein Icon steht neben
fremden Icons und hat keine solche Pflicht.

Der Grund laeuft von Orange-Koralle oben rechts ueber Magenta in Violett und
Elektroblau unten links:

```css
radial-gradient(120% 95% at 88% 6%, #ff7a4d, transparent 55%),
radial-gradient(110% 95% at 4% 100%, #2f6bff, transparent 58%),
linear-gradient(150deg, #f0455c 0%, #b32d7d 48%, #5b2bb0 100%)
```

Drei Gruende gegen die naheliegenderen Wege:

- **Nicht das Aurora-Bild aufdrehen.** `filter: saturate(2.3)` auf
  `aurora-bg.png` kippt ins Blau und bandet in der Mitte. Der nachgebaute
  Verlauf ist kontrollierbar — hier ausnahmsweise CSS statt Bild, weil es
  ein 1024er Feld ist und keine Bildschirmflaeche.
- **Kein volles Korallenfeld**, obwohl es die lauteste Variante waere: NOURA
  ist "Connected by Vodafone". Eine rote Kachel liest sich als Vodafone-App.
  Ein Spektrum steht neben Vodafone-Rot, Telekom-Magenta und O2-Blau fuer
  sich — es ist der Ton `feld`, falls die Marke das spaeter doch will.
- **Kein korallenes N mehr.** Koralle auf gesaettigtem Magenta hat zu wenig
  Abstand; auf 60px saeuft das Zeichen ab. Weiss traegt jede Groesse. Die
  Staemme stehen auf `rgba(255,255,255,.88)` und nur die Diagonale macht ganz
  auf — sonst waere der Strahl in der weissen Flaeche nicht zu sehen.

**Warum rund und nicht die Versalform der Wortmarke.** Auf 60px verschwindet
der Lichtverlauf in der Versalform fast vollstaendig. Der runde Zug haelt den
Strahl bis 60px sichtbar und bleibt dabei eindeutig ein N. Die Wortmarke
selbst bleibt scharf; das Icon ist bewusst ihr weicher Bruder, kein Duplikat.

Drei Stolpersteine:

1. Die getoente Variante **muss** Transparenz tragen — ein deckender
   Hintergrund frisst die Systemfaerbung. Der Strahl ueberlebt die Toenung,
   weil iOS der Luminanz folgt, nicht der Farbe.
2. `gradientUnits='userSpaceOnUse'` rechnet im **lokalen** Raum des Pfades.
   Traegt der Pfad ein `translate`, verschiebt sich der Verlauf mit — in der
   Versalform zaehlen deshalb die Bandenden `140,0 → 380,560`, nicht die
   Icon-Mitte. Ein falsch gesetzter Verlauf kippt die Lichtrichtung um.
3. Beim gesetzten N sitzt der Buchstabe auf `x=506 y=500`, nicht auf 512 —
   `dominant-baseline='central'` richtet an der Schriftmitte aus, nicht an
   der Versalhoehe.

Verworfen: die Wortmarke als Ganzes (fuenf Buchstaben sind auf 60pt nicht mehr
lesbar), die SIM-Silhouette allein (liest sich als Plastik-SIM, das Produkt
ist eine eSIM), das N in der Silhouette, das N mit dem Kontaktfeld der eSIM
(das Raster zerlegt den Buchstaben in Karos) und der Weichzeichner-Schein
hinter der Diagonale (auf 60px ein Halo, das die Form aufweicht).

---

## Komponenten-Rezepte

### Drei Flächenstufen (Stand 2026-09-04)

Jede Fläche gehört zu genau einer von drei Stufen. Die Stufe folgt der
Rolle, nicht dem Ort: *was der Kunde besitzt*, *was ihm etwas zeigt*,
*was er bedient*.

**Stufe 1 — Objekt.** Die SIM-Karte, genau eine pro Screen. Dunkel und
undurchsichtig, keine Kante (Rezept unten).

**Stufe 2 — Fläche.** Jede Karte, die Daten zeigt. Basisklasse `.card`
in `app.css` — nicht abschreiben, erben:

```css
background: rgba(255, 255, 255, 0.10);
border: none;
border-radius: 16px;
backdrop-filter: blur(7px);
padding: 20px;
color: #fff;
```

**Stufe 3 — Bedienelement.** Buttons, FABs, Sheet-Schließer: Liquid
Glass @20 %, Radius 24, Kantenreflex (Rezept unten).

> Hier stand bis zum 2026-09-04 ein Rezept mit `border: 1.5px`,
> `border-radius: 24px` und `blur(24px)`. Das traf auf genau eine Karte
> im Code zu — den Magic Code — und machte sie damit zur stärksten
> Fläche auf Home, für den Werbeplatz, während das Produkt daneben flach
> lag. **Rand und Radius 24 gehören der Stufe 3**; sie sind das Zeichen
> für „bedienbar", nicht für „Karte".

**Die Regel lautet Inhalt 16, Bedienung 24** — nicht „außen 24, innen
16", wie es der Kopfkommentar in `app.css` bis dahin behauptete. Die
äußerste Karte auf Home ist die SIM-Karte, und deren Figma-Pfad beginnt
mit `M0 16C0 7.16…`: Radius 16.

### Die Leiter (Stand 2026-09-17)

Vor dem 2026-09-17 standen in der Chrome-Schicht **29 verschiedene
Weiss-Deckkraefte**, wo das System vier kennt — und zwei Token-Systeme
nebeneinander: `theme.css` fuehrte `--card` auf 8 % und `--secondary` auf
15 %, `global.css` fuehrte `--noura-glass` auf 10 % und
`--noura-glass-strong` auf 20 %. Zwei Karten derselben Rolle trugen damit
zwei verschiedene Flaechen. Die `--noura-*` Tokens sind die Figma-Werte und
fuehren; `theme.css` leitet seine Aliase jetzt davon ab.

| Token | Wert | Rolle |
|---|---|---|
| `--noura-glass` | `.10` | Stufe 2 — Inhaltskarte (Figma, 414×) |
| `--noura-glass-raised` | `.14` | verschachtelte Flaeche in einer Karte |
| `--noura-glass-strong` | `.20` | Stufe 3 — Bedienelement (Figma, 42×) |
| `--noura-glass-active` | `.28` | gewaehltes Bedienelement |
| `--noura-line` | `.16` | Trennlinien, Fortschrittsspuren |
| `--press-wash` | `.12` | Druckzustand — **einer**, nicht drei |
| `--noura-text` | `#fff` | Primaertext |
| `--noura-text-muted` | `.65` | Sekundaertext (war `.50`, 4,00:1) |
| `--noura-text-faint` | `.40` | **nur** nicht-textliche Zeichen |

**Illustrationen stehen nicht auf dieser Leiter.** `ident.css`,
`esim-forge.css` und die Bildwelten in `onboarding.css` zeichnen Grafik,
keine Bedienoberflaeche; ihre Werte kodieren Tiefe innerhalb einer
Zeichnung. Sie wurden bewusst nicht vereinheitlicht — wer sie anfasst,
sollte das auch nicht tun.

**Rot ist nie eine Buttonflaeche — auch nicht als tote Klasse.**
`.btn.primary` (Fuellung `--noura-accent`) ist am 2026-09-17 entfallen: kein
Verwender im Code, aber eine Falle fuer den naechsten, der sie setzt.

### Ueberschriften

Jeder aktive Screen traegt **genau eine `<h1>`** — seinen Titel. Vorher trug
nur Home eine; Onboarding, Tarifwahl, Bestellung, Ident und der eSIM-Ablauf
begannen bei `<h2>` ohne `<h1>` darueber, und VoiceOver bekam eine
Gliederung ohne Spitze. Da inaktive Screens `inert` sind, ist immer nur eine
sichtbar — die Stufen gelten je Screen, nicht je Dokument.

Die CSS-Selektoren haengen am Tag (`.flow-head h1`, `.flow-sec h2`,
`.plan-header h1`, `.features-block h2`, `.ob-text h1`, `.home-header h1`).
**Wer ein Tag aendert, aendert den Selektor mit** — sonst faellt die
Formatierung lautlos aus.

Sheets bleiben bei `<h2>`: sie tragen `role="dialog"` mit `aria-label`, der
Name kommt vom Dialog selbst.

### SIM-Karte (Plan-Karte)

**Nicht** als Glaskarte bauen. Die Karte ist dunkel (`rgba(29,29,29,.75)`)
mit einer **abgeschnittenen oberen rechten Ecke** — die Silhouette einer
SIM-Karte. Exakter Pfad aus Figma (345×173):

```
M0 16C0 7.16 7.16 0 16 0H289.10C292.80 0 296.38 1.28 299.24 3.62
L320.50 21.03L339.79 38.66C343.11 41.69 345 45.98 345 50.47
V157C345 165.84 337.84 173 329 173H16C7.16 173 0 165.84 0 157V16Z
```

Umsetzung per `clip-path: path(...)` oder SVG-Maske. Innen: Plan-Name
(Bold 20px), Vodafone-Logo, optional Chip ("Beliebt"/"Aktiv", Akzentfarbe,
Radius 1000px), unten Preis (Bold 20px) und eSIM-Chip-Icon rechts.

### Button

Maßgeblich ist die Komponente **`301:1461`** — laut ihrer Figma-Beschreibung
"der tatsächlich in allen 12 Screens verwendete Button". Varianten:
`Type=Filled/Borderless`, `Size=Large/Small`, `LabelType=Text/Icon/Icon+Text`,
`State=Enabled/Pressed`. Instanz zum Nachschlagen: `1330:1974`.

| Eigenschaft | Wert | Figma-Token |
|---|---|---|
| Füllung (Enabled) | `rgba(255,255,255,.20)` | `surface/translucent-strong` |
| Füllung (Pressed) | `rgba(255,255,255,.15)` | `surface/translucent-pressed` |
| Radius | `24px` (Icon-Variante `1000px`) | `radius/md` / `radius/pill` |
| Innenabstand | `20px` | — |
| Größe Large | `345 × 61` | — |
| Label | General Sans Semibold 16px/1.3, weiß | `content/primary` |
| Weichzeichner | `blur(12px)` | — |
| Borderless | keine Füllung, nur Label | — |

**Gedrückt wird die Fläche dunkler, nicht heller** (20 % → 15 %). Das ist die
Umkehrung des naheliegenden Reflexes und die häufigste Fehlerquelle beim
Nachbauen. In Figma tragen nur `Pressed` und die Small-Varianten den
Weichzeichner; im Code liegt er auf allen — ein Knopf, der erst beim Drücken
Glas wird, ist ersichtlich ein Lücke der Vorlage, keine Absicht.

### Liquid Glass (Entscheidung vom 2026-07-28)

Von Niclas beauftragt: Die Buttons tragen Apples Liquid-Glass-Material
(iOS 26). Das geht **bewusst über die Figma-Vorlage hinaus** — sie zeichnet
nur die Füllung. Zwei Schichten kommen dazu:

1. **Lensing** — `saturate(180%) brightness(1.06)` im `backdrop-filter`,
   damit der Hintergrund farbig durchschlägt statt zu vergrauen.
2. **Kantenreflex** — 1px Verlaufsrand über `::before` mit
   `mask-composite: exclude`, oben links hell, unten rechts schwächer.
   Dazu ein flacher Glanz im oberen Drittel (`::after`) und eine leichte
   Abhebung (`--lg-lift`).

Beide Pseudoelemente liegen auf `z-index: -1` unter dem Label, der Button
trägt `isolation: isolate`. Tokens: `--lg-tint`, `--lg-tint-pressed`,
`--lg-blur`, `--lg-refract`, `--lg-inner`, `--lg-lift` in `global.css`.

> Die Abweichungsliste unten sagt bei #9 "schlicht, ohne Glanzverläufe und
> Schlagschatten". Das galt bis zu dieser Entscheidung und ist für Buttons
> jetzt überholt — für Karten, Sheets und Chips gilt es weiter.

Getragen von `.btn` (alle Varianten), `.btn.icon-btn`, `.sheet-close` und —
seit dem 2026-09-22 — der **Pille der Tarifleiste** (`.tabs .pill`, siehe
"Entschieden: die Tarifleiste trägt eine Linse"). **Nicht** von Listenzeilen
und nicht von den übrigen Segment-Schaltern (`.demo-switch`, `.opt-btn`) —
Apple setzt das Material für schwebende Bedienelemente ein, nicht für Inhalt
in der Fläche.

> Hier stand bis zum 2026-09-22 "nicht … oder Tabs". Das war zu grob: es
> meinte Reiter **im Inhalt**. Die Tarifleiste steht im angehefteten Kopf
> über der scrollenden Fläche, also in der funktionalen Schicht.

### Entschieden: die Tarifleiste trägt eine Linse

**Gilt seit 2026-09-22**, von Niclas beauftragt. Die Wahl im Tarif-Segment
(`.tabs .pill`) trägt Liquid Glass; die Spur (`.tabs`) trägt es **nicht**.

Das ist die ganze Bauart, und sie ist nicht verhandelbar: eine Linse, die über
einer Mulde reist — genau das Bild, das iOS 26 im Segment zeichnet. Zwei
Glasflächen übereinander wären nur zweimal hell.

> `liquid-glass.md › Review checklist`: "Glass stacked on glass blurs the
> hierarchy the material exists to create."

Die Spur bekam dafür eine Kante nach innen (`inset 0 1px 2px rgba(0,0,0,.22)`)
— eine Vertiefung fängt oben Schatten, keine Reflexion.

**Neuer Token `--lg-refract-dim`** (`brightness(0.68)` statt `1.06`). Zwei
Beugungswerte sind hier das Modell, kein Versehen: Apples Material richtet
seine Luminanz nach dem, was darunter liegt. Der Knopf steht über dem fast
schwarzen Verlauf der CTA-Leiste, die Linse mitten auf der Aurora.

> `color.md › Liquid Glass color`: "adapt between a light and a dark
> appearance in response to the content beneath them".

0.68 ist dabei **keine neue Zahl** — es ist derselbe Wert wie in
`--glass-refract`, und aus demselben Grund: über der Aurora macht eine
Weißfüllung den Grund heller, als er ohne sie wäre.

Gemessen am 2026-09-22 (Chrome-Rendering des echten Kopfs auf `aurora-bg.png`,
Tab-Band y=201, Pixel abgetastet — nicht geschätzt), **Weiß auf der Linse**:

| Position | flach (vorher) | mit `1.06` | mit `0.68` |
|---|---|---|---|
| CONNECT (links) | 4,47:1 | 4,18:1 | **5,45:1** |
| CREATE (rechts) | **3,74:1** | 3,38:1 | **4,68:1** |

**Die rechte Pille stand schon vor dem Material unter der Schwelle** — der
Aurora-Verlauf ist dort heller. Das Material hat den Fund sichtbar gemacht,
nicht verursacht; mit `0.68` tragen jetzt beide Positionen.

Der Kantenreflex zahlt sich zusätzlich aus: die Grenze Linse↔Spur steht auf
5,2:1 (links) und 7,1:1 (rechts) gegen 1,9:1 vorher — weit über den 3:1, die
`accessibility.md` für nicht-textliche Ränder verlangt. Die reine
Flächendifferenz sinkt dabei (1,35:1 links), das ist bewusst: bei Glas trägt
die Kante die Form, nicht die Füllung.

**Offen:** das Etikett des *nicht* gewählten Reiters steht mit
`--noura-text-muted` auf der Spur bei **4,18:1** — unter 4,5:1 bei 14px/600.
Unberührt von dieser Änderung und älter als sie. Niclas entscheidet, ob die
Spur dunkler wird oder das Etikett heller.

### Aurora-Hintergrund

```css
background: #232452 url('/src/assets/img/aurora-bg.png') center/cover no-repeat;
```

---

## Erledigte Abweichungen (Stand 2026-07-27)

Alle ursprünglich gefundenen Abweichungen sind behoben. Die Liste bleibt als
Referenz, was jeweils die Fehlerquelle war:

| # | Stelle | Vorher | Jetzt (= Figma) |
|---|---|---|---|
| 1 | Schriftart | Plus Jakarta Sans | General Sans, lokal eingebettet |
| 2 | SIM-Karte | Glaskarte, drei Farbverläufe | einheitlich dunkel, abgeschnittene Ecke |
| 3 | Verbrauchs-Icons | weiß | Akzentrot `#e15055` |
| 4 | Profilbild | leerer CSS-Kreis | echtes Foto |
| 5 | Intro-Logo | Poppins-Text + CSS-Kreis | App-Icon + echtes Lockup-Bild (Stand 2026-09-21) |
| 6 | Onboarding-Karte | CSS-Perspektive | 3D-Karte als Bild |
| 7 | Hintergrund | 4 CSS-Flächen, 150px Blur | Verlaufsbild (16 KB) |
| 8 | Verbrauchsring | roter Fortschrittsbogen | heller Ring, ∞ in Akzentfarbe |
| 9 | Buttons | rot gefüllt, Glanzverläufe | Glas @20%, schlicht |
| 10 | Aktivierung | pulsierende Kreise | 3D-Karte + Statustext |
| 11 | Profil-Karten | "Mein Profil"/"Rechnungen" | "Dein Plan"/"Deine Karte" |
| 12 | Vodafone-Zeichen | CSS-Kreis mit Pseudoelement | echter Pfad (20×20) |

> **Die SIM-Karte trägt kein Zeichen im Kopf** — weder ein fremdes noch
> ein eigenes. Am 2026-09-17 stand dort kurz das NOURA-Zeichen; wieder
> entfernt, aus zwei Gründen, die beim nächsten Versuch dieselben wären:
>
> 1. Ein nacktes N neben einem Versalwort liest sich als weiterer
>    Buchstabe. „CONNECT N" ist kein Tarif mit Logo, sondern ein Wort mit
>    Schreibfehler.
> 2. Die SVG-Karte des eSIM-Ablaufs hat keinen Textfluss. Die Position
>    musste aus der Zeichenzahl geschätzt werden (`plan.name.length * 13`)
>    und war bei CONNECT zu kurz — das Zeichen lag auf dem T. Wer dort
>    etwas neben den Tarifnamen stellt, **misst** die Textbreite
>    (`getComputedTextLength`) statt sie zu raten.
>
> Die Marke steht im Ablauf ohnehin zweimal: als Zeichen auf dem Intro,
> als Wortmarke im Kopf von Home. Eine dritte Stelle braucht sie nicht.

### Zwei wiederkehrende Fallen

**Rot ist nie eine Buttonfläche.** In Figma erscheint `#e15055` nur als
Chip-Hintergrund, Icon-Farbe, aktiver Tab und Warnlink. Jeder Button —
auch der Haupt-CTA — ist Glas `#ffffff@20%`. Wer einen roten Button sieht,
hat eine Abweichung gefunden.

**Der Code erfindet Elemente, die Figma nicht hat.** Bereits entfernt:
"Überspringen" im Onboarding, "Los geht's" als Textbutton, das
Vodafone-Zeichen auf der Home-SIM-Karte. Im Zweifel per Textsuche über die
Knotendaten prüfen, bevor etwas gebaut wird.

## Geräte-Realität vs. Figma-Maße

Figma zeichnet für **393×852** (iPhone 15). Echte Geräte weichen ab — das
iPhone 16 Pro hat **402×874 Punkte**. Feste Pixelpositionen aus Figma
verrutschen dort.

**Regel:** Vertikale Abstände aus Figma direkt übernehmen, horizontale
Positionierung relativ lösen (`left: 50%` + `translateX(-50%)` oder
`left/right` gleichzeitig). Breiten als `max-width` absichern.

**Safe-Area: nicht addieren, sondern verrechnen.** Figmas 852px hohe Screens
enthalten die Zone der Home-Leiste bereits — die unteren Leisten sitzen 48px
über der Kante. Wer darauf die volle `env(safe-area-inset-bottom)` addiert,
zählt diese Zone doppelt und schiebt alles rund 34px zu hoch. Genau das ließ
den "Mehr"-Knopf zu weit oben stehen (behoben 2026-07-28).

Richtig ist der Token `--bar-bottom`:

```css
--bar-bottom: max(24px, calc(14px + env(safe-area-inset-bottom, 0px)));
```

Auf dem iPhone (34px Inset) ergibt das 48px — der Figma-Wert. Im Browser
ohne Inset greift der Mindestwert 24px. Verwendet von `.navbar`,
`.fab-stack` (`calc(var(--bar-bottom) + 73px)` — 61px Knopf + 12px Abstand),
`.plan-cta` und `.intro-nav`. `.ob-bottom` (Figma 34px) und `.chat-input`
folgen noch dem alten Muster.

### Entschieden: CREATE-Preis ist 40 €

**40 € gilt** — von Niclas am 2026-09-17 festgelegt, nach der Preisliste
"Proposition & pricing" (GigaMobil Young). CONNECT steht auf 25 €.

Gepflegt an **einer** Stelle: `src/data/plans.ts` (`price` und `monthly`).

> Hier stand bis dahin eine zweite Stelle — `CYCLE.amount` in
> `src/data/account.ts`, der Rechnungsbetrag auf Home. Eine Zahl, die vom
> gewählten Tarif abhängt, als feste Zeichenkette neben den Zeitraumdaten:
> das konnte höchstens für einen der beiden Tarife stimmen und stimmte
> zuletzt für keinen (30,00 € gegen 25 € und 40 €). `CycleCard` rechnet
> den Betrag jetzt aus `plan.monthly`. **Wer den Preis ändert, ändert nur
> noch plans.ts.**

Frühere Stände, nur noch als Historie: 30 € (Entscheidung 2026-07-28);
Figma-Auszählung 2026-07-27 — vier Screens zeigten 40 €,
`Select Plan / Creator` zeigte 35 €.

### Entschieden: Datenwerte stehen auf 24 px

**24 px gilt** — von Niclas am 2026-09-04 festgelegt. Figma zeichnet die
Verbrauchszahlen als Card-Titel 700/20; im Code sind sie 600/24. Die
Vorlage ist an dieser Stelle überholt, nicht der Code — dieselbe Lage wie
bei Liquid Glass.

Der Grund: auf 20 px teilten sich **vier Rollen** dieselbe Größe — die
Begrüßung, der Abschnittstitel, der Kartenname und jeder Datenwert.
Unterschieden hat sie nur der Schnitt (700 gegen 600), und das trägt
keine Hierarchie. Auf einem Screen, dessen Aufgabe das Anzeigen von
Verbrauch ist, gehört die Zahl zum Lautesten. **20 px trägt seitdem nur
noch Überschriften.**

Gepflegt an zwei Stellen: `.usage .val` in `global.css` und `.fc-val` in
`app.css`. Beide auf `--fs-screen`.

Zwei Nachbarn derselben Rolle stehen bewusst noch auf 20 px, weil ihr
Screen nicht mitentschieden wurde: `.roam-stat .val` und `.allow-mid b`
im Reisen-Sheet. Wer das Sheet anfasst, zieht sie nach.

**Ebenfalls am 2026-09-04:** die Begrüßung auf Home ist ein Screen-Titel
(700/24), nicht Card-Titel — das folgt Figma, es war vorher falsch. Und
`.label` steht jetzt global statt unter `.usage` gescoped; dort erreichte
die Regel fünf Stellen nicht, die dieselbe Klasse tragen, und ließ sie in
16 px Weiß rendern statt in 14 px gedämpft.

---

## Arbeitsweise beim Screen-Umbau

1. **Referenzbild ansehen** (`reference/<screen>.webp`) — nicht aus dem
   Gedächtnis arbeiten.
2. **Knotendaten holen**, wenn exakte Maße nötig sind (REST-API oben).
3. **Tokens verwenden**, keine Zahlenwerte direkt ins CSS schreiben.
4. **Gegen die Abweichungsliste prüfen** — die dort genannten Punkte sind
   die häufigsten Fehlerquellen.
5. **Auf dem Gerät prüfen** — der Simulator zeigt Fehler, die im Browser
   unsichtbar bleiben (Safe-Area, Weichzeichner-Leistung, echte Statusleiste):

```bash
npm run build && npx cap sync ios
cd ios/App && xcodebuild -scheme App -sdk iphonesimulator -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro' \
  -derivedDataPath /tmp/noura-build build

SIM=$(xcrun simctl list devices booted | grep -o '[0-9A-F-]\{36\}' | head -1)
xcrun simctl install $SIM /tmp/noura-build/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch $SIM com.niclasjakob.noura
xcrun simctl io $SIM screenshot /tmp/shot.png    # Sichtprüfung
```

`npm run ios` öffnet stattdessen Xcode für den Lauf auf echter Hardware.

6. **Gegen die fünf Linsen prüfen** (`apple-design/SKILL.md › Step 3`):
   Barrierefreiheit, Plattform-Konventionen, Gestaltung und Handwerk,
   Interaktion, Text — in dieser Reihenfolge. Jeder Fund nennt eine Zahl und
   eine Quelle (`datei.md › Überschrift`) oder ist ausdrücklich als eigenes
   Urteil markiert. Erfundene Richtlinien gibt es nicht.
7. **Kurz berichten** im Format aus `apple-design/SKILL.md › Step 4`:
   Zusammenfassung, Kritisch, Verbesserungen, Handwerk, Was trägt. Nur die
   Abschnitte, die Inhalt haben. **Kein Fund ist auch ein Ergebnis** — ein
   guter Screen bekommt eine kurze Rückmeldung, keine herbeigeschriebene
   Liste. Kritische Funde sind Barrierefreiheits-Verstöße; alles andere trägt
   High, Medium oder Low.

## Grenzen

- **Kein Backend.** Alle Daten statisch in `src/data/plans.ts`.
- **Kein Zustandsspeicher.** Nach dem Neuladen beginnt der Ablauf von vorn.
- Der Prototyp dient der Vorführung, nicht dem Produktivbetrieb.
