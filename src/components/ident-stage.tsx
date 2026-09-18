/* ============================================================
   NOURA — Die Identitaetspruefung

   Der Screen zeigte waehrend der Pruefung drei Textzeilen, die sich
   abhaken, und einen Balken. Das ist ausgerechnet der Schritt, der
   sich am meisten nach Buerokratie anfuehlt — gesetzlich
   vorgeschrieben (§ 172 TKG), mitten im Kauf, und ohne jedes Bild.

   Hier wird stattdessen gezeigt, was tatsaechlich passiert: ein
   Dokument wird gelesen, seine Felder werden geprueft, das Ergebnis
   steht fest. Drei Takte, ein Gegenstand — dieselbe Bildsprache wie
   beim eSIM-Ablauf, damit der Kauf nicht in der Mitte die Erzaehlung
   wechselt.

   Der Ausweis ist BEWUSST schematisch: Portraitfeld, vier Datenzeilen,
   Chip, Maschinenzone. Keine Hoheitszeichen, keine Behoerdentypo,
   keine echten Feldnamen. Ein Piktogramm eines Dokuments, keine
   Nachbildung eines Ausweises — das gehoert sich nicht und waere
   ausserdem schlechter lesbar.

   Unterschiedlich ist nur, WIE gelesen wird, und genau das ist die
   Entscheidung, die der Kunde vorher getroffen hat:
     eid   — der Chip wird funkend ausgelesen
     photo — der Ausweis wird abfotografiert
     video — ein Mensch schaut ihn sich an

   Leistungsregel wie ueberall im Onboarding: nur transform und
   opacity, Weichheit aus Radial-Verlaeufen statt aus filter:blur.
   ============================================================ */
import { useId } from 'react'
import { SuccessBurst } from './onboarding-visuals'
import type { IdentMethod } from '../data/account'

export type IdentBeat = 'read' | 'check' | 'confirm'

/* Vier Datenzeilen unterschiedlicher Laenge — so sieht ein ausgefuelltes
   Formular aus, gleich lange Balken saehen aus wie ein Platzhalter. */
const LINES: [number, number][] = [
  [44, 96],
  [62, 140],
  [80, 112],
  [98, 132],
]

const PORTRAIT = { x: 22, y: 34, w: 68, h: 86 }
const CHIP = { x: 240, y: 118, w: 40, h: 32 }

/* Maschinenlesbare Zone, angedeutet als Bloecke wechselnder Breite.
   Deterministisch erzeugt, damit die Vorfuehrung reproduzierbar ist. */
const MRZ = (() => {
  const widths = [7, 4, 6, 5, 8, 3, 6, 5, 4, 7]
  const out: [number, number][] = []
  let x = 22
  for (let i = 0; x + widths[i % widths.length] <= 278; i++) {
    out.push([x, widths[i % widths.length]])
    x += widths[i % widths.length] + 2.5
  }
  return out
})()

export function IdentStage({
  beat,
  method,
  run,
}: {
  beat: IdentBeat
  method: IdentMethod['key']
  run: boolean
}) {
  /* Feste IDs wuerden sich ueberschreiben, sobald zwei Buehnen
     gleichzeitig im Dokument stehen. */
  const uid = useId().replace(/:/g, '')
  const clip = `ic-${uid}`
  const sweep = `is-${uid}`

  return (
    <div className={`ident${run ? ' run' : ''}`} data-ibeat={beat} data-method={method} aria-hidden="true">
      <span className="id-glow" />

      <div className="id-plate">
        {/* Der viewBox reicht ueber den Ausweis hinaus: das Funkfeld und
            das Fenster des Gegenuebers liegen ausserhalb des Dokuments
            und wuerden sonst abgeschnitten. */}
        <svg viewBox="-30 -62 360 281">
          <defs>
            <clipPath id={clip}>
              <rect x="0" y="0" width="300" height="189" rx="12" />
            </clipPath>
            {/* Der Prueflauf ist Licht, kein Band: als Volltonflaeche
                liest er sich wie ein Aufdruck auf dem Dokument. */}
            <linearGradient id={sweep} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--noura-accent)" stopOpacity="0" />
              <stop offset="78%" stopColor="var(--noura-accent)" stopOpacity=".30" />
              <stop offset="100%" stopColor="#fff" stopOpacity=".55" />
            </linearGradient>
          </defs>

          {/* ---- Das Dokument ---- */}
          <rect className="id-body" x="0" y="0" width="300" height="189" rx="12" />
          <rect className="id-edge" x="1.5" y="1.5" width="297" height="186" rx="10.5" />

          <g className="id-portrait">
            <rect x={PORTRAIT.x} y={PORTRAIT.y} width={PORTRAIT.w} height={PORTRAIT.h} rx="6" />
            <circle className="id-head" cx="56" cy="66" r="13" />
            <path className="id-body-glyph" d="M36 114c0-12 9-21 20-21s20 9 20 21Z" />
          </g>

          <g className="id-lines">
            {LINES.map(([y, w], i) => (
              <rect key={i} className="id-line" x="106" y={y} width={w} height="7" rx="3.5" style={{ '--i': i } as React.CSSProperties} />
            ))}
          </g>

          <g className="id-chip">
            <rect x={CHIP.x} y={CHIP.y} width={CHIP.w} height={CHIP.h} rx="5" />
            <line x1={CHIP.x + 13} y1={CHIP.y} x2={CHIP.x + 13} y2={CHIP.y + CHIP.h} />
            <line x1={CHIP.x} y1={CHIP.y + 16} x2={CHIP.x + CHIP.w} y2={CHIP.y + 16} />
          </g>

          <g className="id-mrz">
            {MRZ.map(([x, w], i) => (
              <rect key={i} x={x} y="164" width={w} height="8" rx="1.5" />
            ))}
          </g>

          {/* ---- Prueflauf: ein Balken faehrt ueber das Dokument ---- */}
          <g clipPath={`url(#${clip})`}>
            <rect className="id-scan" x="-4" y="-64" width="308" height="64" fill={`url(#${sweep})`} />
          </g>

          {/* ---- Lesen per Funk (Online-Ausweis) ----
                  Drei Felder laufen vom Chip nach aussen. Sie enden nicht
                  am Kartenrand, weil ein Funkfeld das auch nicht tut. */}
          <g className="id-nfc">
            {[30, 48, 66].map((r, i) => (
              <circle key={r} cx={CHIP.x + CHIP.w / 2} cy={CHIP.y + CHIP.h / 2} r={r} style={{ '--i': i } as React.CSSProperties} />
            ))}
          </g>

          {/* ---- Lesen per Kamera (Foto-Ident) ----
                  Sucherwinkel ziehen sich auf das Dokument zusammen, dann
                  loest es aus. */}
          <g className="id-frame">
            {[
              'M-14 16V-2a12 12 0 0 1 12-12h18',
              'M286 -14h18a12 12 0 0 1 12 12v18',
              'M314 173v18a12 12 0 0 1-12 12h-18',
              'M14 203H-2a12 12 0 0 1-12-12v-18',
            ].map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g clipPath={`url(#${clip})`}>
            <rect className="id-flash" x="0" y="0" width="300" height="189" />
          </g>

          {/* ---- Lesen durch einen Menschen (Video-Chat) ----
                  Ein Fenster ueber dem Dokument, eine Leitung dorthin und
                  ein Punkt, der darauf laeuft. */}
          <g className="id-call">
            <rect className="id-call-win" x="126" y="-56" width="48" height="44" rx="12" />
            <circle className="id-call-head" cx="150" cy="-40" r="6.5" />
            <path className="id-call-body" d="M138 -19c0-6.6 5.4-12 12-12s12 5.4 12 12Z" />
            <path className="id-call-wire" d="M150 -8C150 26 104 30 60 54" />
            <circle className="id-call-dot" cx="150" cy="-8" r="3.5" />
          </g>
        </svg>
      </div>

      {/* Der Schlussmoment benutzt denselben Haken wie der Login — ein
          zweites Erfolgszeichen daneben waere eine zweite Sprache. */}
      {beat === 'confirm' && (
        <div className="id-burst">
          <SuccessBurst />
        </div>
      )}
    </div>
  )
}
