/* ============================================================
   NOURA — Code-Walzen

   Ein Magic Code wechselt nicht, er rastet ein: jede Stelle ist eine
   Walze, die auslaeuft und auf dem neuen Zeichen stehen bleibt. Das
   Bauteil gilt fuer beide Stellen, an denen der Code laeuft — die
   grosse Kachelreihe im Onboarding und die Zeile auf der Home-Karte.

   Bis zum 2026-09-24 flackerten beide Stellen alle 55ms zufaellig
   durchs Alphabet. Das war hektisch, und es war teuer: 16 React-
   Renders je Durchgang, jeder mit Layout. Die Walze ist ein einziger
   Render je Code; die Bewegung laeuft als transform im Compositor.

   Die Staffel entsteht ohne Timer: rechte Stellen haben eine laengere
   Walze und eine laengere Laufzeit (`--land` im CSS des Verwenders),
   also landen sie spaeter. Wer die Laufzeit aendert, aendert sie dort.
   ============================================================ */
import { useCallback, useState } from 'react'
import { randomCode } from '../data/magic'

/* Walzenlaenge je Stelle: rechts laeuft laenger. */
const reelSteps = (i: number) => 6 + i * 2

/* Das alte Zeichen oben, ein paar zufaellige dazwischen, das neue
   unten. Die Walze faehrt nach oben, bis das neue im Fenster steht. */
const buildReel = (from: string, to: string, i: number) => [
  from,
  ...randomCode(reelSteps(i)).split(''),
  to,
]

/* `cycle` ist der Schluessel der bewegten Teile: jeder neue Wert
   montiert die Walzen neu und startet damit ihre Animation. Bei
   reduzierter Bewegung wechselt der Code ohne Walze. */
export function useCodeReels(reduced: boolean) {
  const [state, setState] = useState(() => ({
    cycle: 0,
    reels: randomCode().split('').map((c) => [c]),
  }))

  const advance = useCallback(() => {
    setState((prev) => {
      const target = randomCode().split('')
      return {
        cycle: prev.cycle + 1,
        reels: target.map((c, i) =>
          reduced ? [c] : buildReel(prev.reels[i][prev.reels[i].length - 1], c, i),
        ),
      }
    })
  }, [reduced])

  return { ...state, advance }
}

/* Eine Walze. Der Aufrufer setzt `key={cycle}`, damit sie je Code neu
   montiert wird, und liefert das Fenster drumherum. */
export function Reel({ reel }: { reel: string[] }) {
  return (
    <span
      className={`reel${reel.length > 1 ? ' spin' : ''}`}
      style={{ '--steps': reel.length - 1 } as React.CSSProperties}
    >
      {reel.map((c, j) => (
        <span key={j} className="reel-glyph">
          {c}
        </span>
      ))}
    </span>
  )
}

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
