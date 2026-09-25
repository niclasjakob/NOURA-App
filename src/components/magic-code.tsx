/* ============================================================
   NOURA — Magic Code

   Die alte Karte erzaehlte fuenf Dinge gleichzeitig: Community,
   Avatare, Vorteils-Chips, einen Zugriffsbalken und zwei Knoepfe.
   Geblieben ist eine einzige Aussage — "NOURA Magic Code
   einloesen" — und darueber der Code selbst.

   Der Code ist nie derselbe. Statt das hinzuschreiben, zeigt die
   Karte es: Im Hintergrund treibt eine Wolke aus Codefragmenten,
   die sich alle paar Sekunden zur Mitte zusammenzieht und neu
   formiert, waehrend der grosse Code Stelle fuer Stelle
   einrastet. Antippen loest denselben Vorgang sofort aus — das
   ist die Belohnung, die zum Antippen einlaedt.

   Die Wolke rechnet in Figma-Punkten (345x112 = die Kartenflaeche)
   und setzt jedes Fragment per `transform: translate()` in
   Containereinheiten (cqw/cqh) — sie skaliert also mit der echten
   Kartengroesse mit, ohne Layout je Bild.

   Bis zum 2026-09-24 war sie ein SVG mit <text>-Fragmenten. Das sah
   gleich aus, lief aber komplett auf dem Hauptthread: SVG-Elemente
   bewegt weder Chrome noch WebKit im Compositor, also kostete jedes
   Bild der Drift und jeder Uebergang ein Layout. Als HTML laufen
   beide im Compositor.
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
/* Alphabet und Laenge kommen aus der Datenschicht: die Wolke, das
   Eingabefeld und die Pruefung muessen sich zwangslaeufig einig sein,
   welche Zeichen es ueberhaupt gibt. */
import { randomCode } from '../data/magic'
import { Reel, prefersReducedMotion, useCodeReels } from './code-reel'

/* Koordinatensystem der Wolke (Figma-Punkte) */
const BOX_W = 345
const BOX_H = 112
const CX = BOX_W / 2
const CY = BOX_H / 2

/* Ankerpunkte als Ring um die Mitte: dort stehen Code und Zeile, und
   ein Fragment hinter dem Wort "einloesen" kostet nur Lesbarkeit.
   Bei jeder Neuformierung wird jeder Anker leicht verwuerfelt —
   dadurch wirkt die Wolke nie zweimal gleich. */
const ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [32, 16], [94, 11], [156, 19], [220, 10], [284, 17],
  [26, 48], [30, 78], [316, 44], [318, 80],
  [50, 100], [112, 105], [178, 98], [244, 104], [298, 96],
]

/* Innerhalb der Flaeche halten: am Rand abgeschnittene Fragmente
   lesen als Fehler, nicht als Tiefe. */
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/* Zeitmass. Zusammenziehen ist schneller als das Auseinanderfliegen —
   ein Einatmen, dann ein langes Ausatmen. */
const GATHER_MS = 480
const CYCLE_MS = 5200

const jitter = (v: number, r: number) => v + (Math.random() * 2 - 1) * r

type Mote = { id: number; code: string; x: number; y: number; o: number; s: number }

const spreadMotes = (): Mote[] =>
  ANCHORS.map(([x, y], id) => ({
    id,
    code: randomCode(),
    x: clamp(jitter(x, 13), 30, 315),
    y: clamp(jitter(y, 6), 14, 100),
    /* Nach aussen hin blasser: das gibt der Wolke Tiefe, statt sie
       als gleichmaessiges Raster zu zeigen. */
    o: 0.1 + Math.random() * 0.16,
    s: 0.72 + Math.random() * 0.5,
  }))

/* Zusammenziehen: dieselben Fragmente wandern auf ein Fuenftel ihres
   Abstands zur Mitte und verblassen. Weil nur x/y/o wechseln und die
   Schluessel gleich bleiben, uebernimmt der CSS-Uebergang die Bewegung. */
const gatherMotes = (motes: Mote[]): Mote[] =>
  motes.map((m) => ({
    ...m,
    x: CX + (m.x - CX) * 0.2,
    y: CY + (m.y - CY) * 0.2,
    o: 0.05,
    s: 0.55,
  }))

export function MagicCodeCard({ run, onOpen }: { run: boolean; onOpen?: () => void }) {
  const reduced = useMemo(prefersReducedMotion, [])

  const [motes, setMotes] = useState<Mote[]>(spreadMotes)
  const [phase, setPhase] = useState<'spread' | 'gather'>('spread')
  /* Der Code laeuft auf Walzen, wie im Onboarding (code-reel.tsx).
     Vorher flackerte er alle 55ms durchs Alphabet — 16 Renders je
     Durchgang, jetzt einer. */
  const { cycle, reels, advance: roll } = useCodeReels(reduced)

  const gatherRef = useRef<number>(0)

  /* Ein Durchgang: Wolke einatmen, dann mit neuen Fragmenten und neuem
     Code wieder ausatmen. */
  const reform = useCallback(() => {
    window.clearTimeout(gatherRef.current)
    if (reduced) {
      setMotes(spreadMotes())
      roll()
      return
    }
    setPhase('gather')
    setMotes(gatherMotes)
    gatherRef.current = window.setTimeout(() => {
      setPhase('spread')
      setMotes(spreadMotes())
      roll()
    }, GATHER_MS)
  }, [reduced, roll])

  /* Nur laufen, solange Home sichtbar ist — im Hintergrund waere das
     verschenkte Akkulaufzeit. */
  useEffect(() => {
    if (!run) return
    const iv = window.setInterval(reform, CYCLE_MS)
    return () => {
      window.clearInterval(iv)
      window.clearTimeout(gatherRef.current)
    }
  }, [run, reform])

  return (
    <button
      type="button"
      className="card magic"
      /* Der Code wandert staendig — vorgelesen waere er nur Laerm.
         VoiceOver hoert deshalb genau den Satz, um den es geht. */
      aria-label="NOURA Magic Code einlösen"
      onClick={() => {
        reform()
        onOpen?.()
      }}
    >
      <span className={`magic-cloud${phase === 'gather' ? ' gathering' : ''}`} aria-hidden="true">
        {motes.map((m) => (
          <span
            key={m.id}
            className="mote"
            style={
              {
                '--x': m.x / BOX_W,
                '--y': m.y / BOX_H,
                '--s': m.s,
                opacity: m.o,
              } as React.CSSProperties
            }
          >
            {m.code}
          </span>
        ))}
      </span>

      <span className="magic-body">
        <span className="magic-code" aria-hidden="true">
          {reels.map((reel, i) => (
            <i key={i} style={{ '--i': i } as React.CSSProperties}>
              <Reel key={cycle} reel={reel} />
            </i>
          ))}
        </span>
        <span className="magic-label">
          NOURA Magic Code einlösen
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </span>
      </span>
    </button>
  )
}
