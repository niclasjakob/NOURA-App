/* ============================================================
   NOURA — Onboarding-Visuals
   Bewegte Bildwelt fuer Intro, Onboarding und Aktivierung.

   Leistungsregel: animiert wird ausschliesslich ueber transform und
   opacity. Weichzeichnung entsteht durch Radial-Verlaeufe, nicht durch
   filter:blur oder backdrop-filter — Safari auf dem iPhone rendert
   grossflaechige Filter traege (siehe Aurora-Entscheidung in global.css).
   ============================================================ */
import { useEffect, useMemo } from 'react'
import { SimCard } from './ui'
import type { Plan } from '../data/plans'
import { Reel, prefersReducedMotion, useCodeReels } from './code-reel'

/* ---------- Driftende Farbwolken ----------
   Liegt ueber dem statischen Aurora-Bild und haelt den Hintergrund in
   Bewegung. Drei Verlaeufe im Screen-Blendmodus, sehr langsam versetzt. */
export function AuroraFlow({ tone = 'coral' }: { tone?: 'coral' | 'violet' | 'blue' }) {
  return (
    <div className={`aurora-flow tone-${tone}`} aria-hidden="true">
      <span className="af af-1" />
      <span className="af af-2" />
      <span className="af af-3" />
    </div>
  )
}

/* ---------- Die 3D-Karte ----------
   Hier stand bis zum 2026-09-24 ein Figma-Bild: eine graue Karte mit
   NOURA- und Vodafone-Zeichen und dem Satz "Die Mobilfunk-App". Keines
   davon kam spaeter im Ablauf wieder vor — Tarifwahl, Fertigung und
   Home zeigen eine andere Karte, und das Vodafone-Zeichen gehoert nach
   dem Design-System auf keine.

   Jetzt ist es dieselbe SimCard, in der Lage, in der die Fertigung sie
   auf die Werkbank legt (esim-forge.css, Takte 1-3). Ohne Tarif ist es
   der Rohling; beim Login die Karte, die der Kunde schon hat.

   Glanz und Scanbalken liegen in der gekippten Ebene und sind auf die
   Silhouette maskiert (--sim-shape), laufen also genau ueber die Karte.
   Der Scan ist derselbe Schreibbalken wie im Takt "eingerichtet". */
export function Card3D({
  scanning = false,
  plan,
  holder,
  chipText,
}: {
  scanning?: boolean
  plan?: Plan
  holder?: string
  chipText?: string | null
}) {
  return (
    <div className={`card3d${scanning ? ' scanning' : ''}`} aria-hidden="true">
      <span className="card3d-glow" />
      <div className="card3d-body">
        <SimCard plan={plan} holder={holder} chipText={chipText} />
        <span className="card3d-sheen" />
        {scanning && <span className="card3d-scan" />}
      </div>
    </div>
  )
}

/* ================= Schritt 1 — Digital =================
   Die Karte liegt still, drei Glaspunkte kreisen als App-Metapher. */
export function VisualDigital() {
  return (
    <div className="viz">
      <span className="viz-glow glow-coral" />
      <div className="orbit">
        <span className="orb o1" />
        <span className="orb o2" />
        <span className="orb o3" />
      </div>
      <Card3D />
    </div>
  )
}

/* ================= Schritt 2 — Magic Codes =================
   Vier Zeichen, drei Tueren. Der Code wechselt alle paar Sekunden,
   weil genau das seine Aussage ist: er ist nie derselbe, ein
   abfotografierter Code ist eine Stunde spaeter wertlos.

   Erzaehlt wird in drei Schlaegen: die Walzen laufen aus und rasten
   von links nach rechts ein, ein Funke laeuft den Strich hinab, die
   Tueren gehen nacheinander auf. Der Code oeffnet etwas — das ist das
   Bild, nicht das Wuerfeln. Bis zum 2026-09-24 flackerten die Stellen
   zufaellig durchs Alphabet, unter einem roten Puls im 0,22s-Takt;
   das las sich als Stoerung, nicht als Schluessel.

   Hier stand bis zum 2026-09-21 ein Kalenderblatt fuer "monatlich
   kuendbar". Ein Kalender ist kein Bauteil dieser App; die Magic Codes
   sind eines, mit eigener Kachel, eigenem Sheet und eigenem
   Creator-Werkzeug — und kamen im Onboarding nirgends vor. */
const DOORS = ['Festival', 'Konzert', 'Meet-up'] as const

/* Takt: alle 4,6s ein neuer Code. Ein Durchgang braucht rund 2,8s —
   Walzen, Funke, Tueren — und laesst danach Ruhe zum Lesen. */
const CODE_CYCLE_MS = 4600

/* Der Beispiel-Code zum Ausprobieren. Aus dem Code-Alphabet, aber an
   keinen Drop gebunden — im Onboarding wird nichts eingeloest. */
export const DEMO_CODE = 'NURA'

export function VisualMagic({ run, tryKey = 0 }: { run: boolean; tryKey?: number }) {
  const reduced = useMemo(prefersReducedMotion, [])
  /* Die Kacheln selbst bleiben stehen, wenn der Code wechselt — nur
     Walzen, Funke und Tuerlicht haengen an `cycle`. Sonst liefe der
     Auftritt der Kacheln bei jedem Code von vorn. */
  const { cycle, reels, advance, advanceTo } = useCodeReels(reduced)
  const trying = tryKey > 0

  /* Nur laufen, solange der Screen sichtbar ist — und nicht, solange
     jemand gerade selbst einen Code ausprobiert: der soll stehen
     bleiben, bis er gelesen ist. */
  useEffect(() => {
    if (!run || trying) return
    const iv = window.setInterval(advance, CODE_CYCLE_MS)
    return () => window.clearInterval(iv)
  }, [run, advance, trying])

  /* "Teach through interactivity" (onboarding.md › Best practices):
     jeder Tipp laesst den Beispiel-Code einrasten und die Tueren
     aufgehen — dieselbe Abfolge, die ein echter Code ausloest. */
  useEffect(() => {
    if (trying) advanceTo(DEMO_CODE)
  }, [tryKey, trying, advanceTo])

  const moving = cycle > 0 && !reduced

  return (
    /* Der Text unter dem Bild nennt Festival, Konzert und Meet-up
       bereits — fuer VoiceOver waere die Grafik also eine Wiederholung. */
    <div className="viz" aria-hidden="true">
      <span className="viz-glow glow-violet" />
      <div className="mcode">
        <div className="mcode-row">
          {reels.map((reel, i) => (
            <span key={i} className="mcode-tile" style={{ '--i': i } as React.CSSProperties}>
              <span className="mcode-window">
                <Reel key={cycle} reel={reel} />
              </span>
              {moving && <span key={cycle} className="mcode-flare" />}
            </span>
          ))}
        </div>
        <span className="mcode-stem">
          {moving && <span key={cycle} className="mcode-spark" />}
        </span>
        <div className="mcode-doors">
          {DOORS.map((d, i) => (
            <span key={d} className="mcode-door" style={{ '--i': i } as React.CSSProperties}>
              {moving && <span key={cycle} className="mcode-door-lit" />}
              <span className="mcode-door-label">{d}</span>
            </span>
          ))}
        </div>
        {/* Erst wenn die Tueren leuchten — vorher waere es ein Ergebnis
            vor dem Vorgang. Der key startet den Auftritt je Versuch neu. */}
        {trying && (
          <span key={cycle} className="mcode-result">
            Beispiel eingelöst · Du stehst auf der Liste
          </span>
        )}
      </div>
    </div>
  )
}

/* ================= Schritt 3 — die zugesicherte Rate =================
   Hier standen bis zum 2026-09-22 zwei Spuren nebeneinander, eine
   verstopft, eine frei. Das Bild erzaehlte das falsche Produkt: zwei
   Spuren sind Vorfahrt — Du zuerst, die anderen warten. Das ist
   Priorisierung, und die verkauft NOURA nicht. Von Niclas korrigiert.

   Zugesichert wird eine Datenrate, kein Vortritt. Die Kurve darf
   fallen, nur nicht unter den Boden — und genau das ist jetzt das Bild:
   eine Rate, die mit der Netzlast absackt, auf dem garantierten Wert
   aufsetzt und dort weiterlaeuft. Eine einzige Partei, kein Vergleich,
   niemandem wird etwas weggenommen. Die Aussage ist nicht "schneller
   als die anderen", sondern "faellt nie aus".

   Der Tacho davor (bis 2026-09-21) war aus demselben Grund die falsche
   Form: ein Tacho zeigt die Spitze, eine Zusicherung ist ein Boden. */

/* Zeichenflaeche 300x112, Boden bei y=88 — darunter das zugesicherte
   Band. Die Kurve faellt in Wellen statt gleichmaessig, weil Netzlast
   schwankt, und setzt bei x=220 auf. Das letzte Drittel laeuft flach:
   erst diese Strecke sagt "hier ist Schluss nach unten". */
const PLOT_W = 300
const PLOT_H = 112
const FLOOR_Y = 88

/* Die Kurve setzt drei Einheiten ueber dem Boden auf, nicht genau
   darauf. Genau darauf gelegt deckt der 2,5 Einheiten breite weisse
   Strich die 2 Einheiten der Bodenlinie vollstaendig zu — im ersten
   Entwurf verschwand die Zusicherung ab dem Aufsetzpunkt aus dem Bild,
   also genau dort, wo sie die Aussage traegt. Drei Einheiten Abstand
   lesen sich weiter als Aufliegen und lassen beide Linien stehen. */
const SETTLE_Y = FLOOR_Y - 3
const RATE_POINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 18], [24, 26], [46, 14], [70, 40], [92, 30], [116, 56],
  [138, 48], [162, 70], [184, 62], [204, 79], [220, SETTLE_Y], [PLOT_W, SETTLE_Y],
]

/* Gerechnet, nicht geschaetzt: stroke-dasharray braucht die echte
   Laenge des Linienzugs, sonst beginnt die Linie sichtbar zu spaet oder
   ist vor dem Ende des Durchlaufs schon fertig. */
const RATE_LEN = RATE_POINTS.reduce(
  (sum, [x, y], i) =>
    i === 0 ? 0 : sum + Math.hypot(x - RATE_POINTS[i - 1][0], y - RATE_POINTS[i - 1][1]),
  0,
)

export function VisualNetwork() {
  return (
    <div className="viz" aria-hidden="true">
      <span className="viz-glow glow-blue" />
      <div className="rate">
        {/* Die Zeile erklaert die x-Achse. Ohne sie sieht man eine Linie
            fallen und erfaehrt den Grund erst im Absatz darunter. */}
        <span className="rate-cap">Deine Datenrate, wenn das Netz voll läuft</span>
        <div className="rate-plot">
          <svg viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}>
            {/* Das Band unter dem Boden ist der Bereich, den die Kurve
                nicht betreten kann — gezeigt als Flaeche, nicht als
                zweite Spur. */}
            <rect className="rate-band" x="0" y={FLOOR_Y} width={PLOT_W} height={PLOT_H - FLOOR_Y} />
            <line className="rate-floor" x1="0" y1={FLOOR_Y} x2={PLOT_W} y2={FLOOR_Y} />
            <polyline
              className="rate-line"
              points={RATE_POINTS.map(([x, y]) => `${x},${y}`).join(' ')}
              style={{ '--len': RATE_LEN } as React.CSSProperties}
            />
          </svg>
        </div>
        <div className="rate-legend">
          <i />
          garantiert 1 Mbit/s
        </div>
      </div>
    </div>
  )
}

/* ---------- Erfolgs-Haken ----------
   Der Pfad wird ueber stroke-dashoffset gezeichnet, die Ringe laufen als
   Welle nach aussen. */
export function SuccessBurst() {
  return (
    <div className="burst" aria-hidden="true">
      <span className="ripple r1" />
      <span className="ripple r2" />
      <svg viewBox="0 0 64 64" className="burst-check">
        {/* Der Haken steht frei vor dem Verlauf — die Traegerscheibe war nur
            noetig, solange er auf der Karte lag. */}
        <circle cx="32" cy="32" r="30" fill="none" stroke="var(--noura-accent)" strokeWidth="2" className="burst-circle" />
        <path d="M19 33.5 28 42 45 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="burst-path" />
      </svg>
    </div>
  )
}
