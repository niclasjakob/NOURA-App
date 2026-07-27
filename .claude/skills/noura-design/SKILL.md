---
name: noura-design
description: NOURA Design System — pixelgenaue Umsetzung der Figma-Vorlage "NOURA Concept · Hi-Fi V7" für den iOS-Klick-Prototyp. MUSS ausgelöst werden, wenn an NOURA-Screens, -Komponenten oder -Styling gearbeitet wird: "NOURA Screen bauen", "Intro-Screen", "Home-Screen", "Plan-Auswahl", "Design umsetzen", "pixelgenau nach Figma", "Aurora-Hintergrund", "SIM-Karte", "Glass-Card", "Design-Token", "noura-design". Enthält verbindliche Tokens, Komponenten-Rezepte, Asset-Register und die Abweichungsliste Code↔Figma. NICHT für Backend-Arbeit, Capacitor-Konfiguration oder Repo-Organisation.
---

# NOURA Design System

Verbindliche Referenz für die pixelgenaue Umsetzung des Figma-Designs
**NOURA Concept · 📱 Hi-Fi: V7**. Alle Werte sind am 2026-07-27 direkt aus
der Figma-Datei ausgelesen (REST-API, Knoten `1330:1774`), nicht geschätzt.

- **Datei:** `6DK1NP0pdeuesOy14tl4YE`
- **Seite:** `1330:1774` ("📱Hi-Fi: V7", intern betitelt "VIDEO CLICK-DUMMY V6")
- **Alle Screens:** 393 × 852 px (iPhone 15), Sheets 393 × 782 px

## Zugang zur Figma-Datei

Der Figma-MCP-Server schlägt fehl ("no edit access"). **Stattdessen die
REST-API mit `$FIGMA_ACCESS_TOKEN` verwenden** (Account
`robert.heine2@vodafone.com`, hat Lesezugriff):

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
| Intro | `1330:1947` | `reference/01-intro.webp` |
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

**Poppins Bold** ausschließlich für die Wortmarke "NOURA" (13.3px im
Logo-Lockup). **SF Pro** nur in der iOS-Statusleiste — im nativen Build
zeichnet iOS die echte Leiste, dort entfällt sie.

---

## Maße

**Radien:** `24px` ist die Signatur (57×) — Karten, Sheets, Buttons.
Daneben `16px` (23×, verschachtelte Karten), `5px` (19×, Chips),
`1000px` (17×, Pillen und Avatare).

**Abstände** (4px-Raster): `8px` (177×) und `4px` (153×) dominieren,
`24px` (63×) trennt Blöcke, `40px`/`64px` für großzügige Abschnitte.

**Innenabstand:** `24px` (113×) Standard, `20px` (88×) kompakt,
`48px` (19×) bei vollflächigen Screens.

**Weichzeichner:** `backdrop-filter: blur(24px)` auf Glaskarten (12×),
`blur(7px)` leicht (12×), `blur(40px)` auf Navigationsleisten und Sheets (3×).
Der Aurora-Verlauf nutzt in Figma 300px Ebenen-Weichzeichner — **im Code als
Bild, nicht als CSS-Filter** (siehe Assets).

---

## Assets

Aus Figma exportiert, liegen unter `src/assets/`. Insgesamt 112 KB.

| Datei | Größe | Herkunft (Node) | Zweck |
|---|---|---|---|
| `img/aurora-bg.webp` | 16 KB | `1330:1780` | Hintergrundverlauf, 1179×2556 (@3x) |
| `img/avatar-marcel.webp` | 6 KB | `1330:1860` | Profilbild Home |
| `img/connected-by-vodafone.png` | 9 KB | `1330:1951` | Logo-Lockup Intro |
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

---

## Komponenten-Rezepte

### Glaskarte

```css
background: rgba(255, 255, 255, 0.10);
border: 1.5px solid rgba(255, 255, 255, 0.5);
border-radius: 24px;
backdrop-filter: blur(24px);
padding: 24px;
color: #fff;
```

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

### Primär-Button

```css
background: #e15055;
color: #fff;
font: 600 14px/19px 'General Sans';
border-radius: 1000px;
padding: 8px 16px;
```

### Glas-Button

Wie Primär-Button, aber Glasfüllung + 1.5px Rand + `blur(24px)`.

### Aurora-Hintergrund

```css
background: #232452 url('/src/assets/img/aurora-bg.webp') center/cover no-repeat;
```

---

## Abweichungen Code ↔ Figma

Der bestehende Code (Stand `main`, Commit `22d9a78`) weicht an diesen
Stellen ab. **Beim Umbau eines Screens gegen diese Liste prüfen.**

| # | Stelle | Code aktuell | Figma | Schwere |
|---|---|---|---|---|
| 1 | Schriftart | Plus Jakarta Sans | **General Sans** | hoch — größter sichtbarer Unterschied |
| 2 | SIM-Karte | Glaskarte, Standardradius | **Dunkel, abgeschnittene Ecke** | hoch |
| 3 | Verbrauchs-Icons | weiß | **Akzentrot `#e15055`** | mittel |
| 4 | Profilbild | CSS-Kreis, leer | **Echtes Foto** | mittel |
| 5 | Intro-Logo | Text "NOURA" in Poppins | **Wortmarke + "Connected by Vodafone"-Lockup** | mittel |
| 6 | Onboarding-Karte | flache CSS-Karte | **3D-perspektivische SIM-Karte** | mittel |
| 7 | Hintergrund | 4 CSS-Blobs | **Verlaufsbild** | mittel (Leistung) |
| 8 | Verbrauchsring | roter Fortschrittsbogen | **heller Ring, ∞ in Akzentfarbe** | niedrig |
| 9 | Token-System | zwei konkurrierende Sätze | ein Satz | niedrig (Wartbarkeit) |

### Geklärt: CREATE-Preis ist 40 €

Figma zeigt an einer Stelle 35 €, sonst überall 40 €. Auszählung über alle
Screens (2026-07-27):

| Screen | CREATE-Preis |
|---|---|
| Select Plan / Creator | 35 € ← Ausreißer |
| Select Plan / Consumer | 40 € |
| Select Plan / Consumer 2 | 40 € |
| Home | 40 € |
| Home (Variante) | 40 € |

**40 € gilt** (4 von 5 Vorkommen, und beide Home-Screens). Die 35 € auf
`Select Plan / Creator` sind ein nicht nachgezogenes Überbleibsel. Der Code
war bereits korrekt. Falls Niclas widerspricht: hier und in
`src/data/plans.ts` ändern.

---

## Arbeitsweise beim Screen-Umbau

1. **Referenzbild ansehen** (`reference/<screen>.webp`) — nicht aus dem
   Gedächtnis arbeiten.
2. **Knotendaten holen**, wenn exakte Maße nötig sind (REST-API oben).
3. **Tokens verwenden**, keine Zahlenwerte direkt ins CSS schreiben.
4. **Gegen die Abweichungsliste prüfen** — die dort genannten Punkte sind
   die häufigsten Fehlerquellen.
5. **Auf dem Gerät prüfen:** `npm run ios` baut, synchronisiert und öffnet
   Xcode. Der Simulator zeigt Layout-Fehler, die im Browser unsichtbar sind
   (Safe-Area, Weichzeichner-Leistung, Scroll-Verhalten).

## Grenzen

- **Kein Backend.** Alle Daten statisch in `src/data/plans.ts`.
- **Kein Zustandsspeicher.** Nach dem Neuladen beginnt der Ablauf von vorn.
- Der Prototyp dient der Vorführung, nicht dem Produktivbetrieb.
