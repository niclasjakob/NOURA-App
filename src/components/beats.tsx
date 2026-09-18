/* ============================================================
   NOURA — Takt-Text und Taktmesser

   Die Bausteine, die jeder mehrteilige Wartevorgang teilt: ein Titel
   mit Erklaerung und ein Messer, der nicht nur zeigt WIE WEIT es ist,
   sondern AUS WIE VIELEN Schritten es besteht.

   Sie lagen bis zum 2026-09-17 in components/esim-forge.tsx. Seit die
   Identitaetspruefung dieselbe Darstellung benutzt, gehoeren sie
   keinem der beiden Ablaeufe mehr.
   ============================================================ */

/* ---------- Takt-Text ----------
   Titel und Erklaerung wechseln als Block. Der key sorgt dafuer, dass
   React das Element austauscht statt es zu beschriften — nur dann laeuft
   die Eintrittsanimation beim Taktwechsel erneut. Die Live-Region liegt
   auf dem Rahmen, der bleibt, sonst meldet VoiceOver nichts. */
export function BeatCaption({ title, text }: { title: string; text: string }) {
  return (
    <div className="beat-status" aria-live="polite">
      <div className="beat-caption" key={title}>
        <b>{title}</b>
        <p>{text}</p>
      </div>
    </div>
  )
}

/* ---------- Taktmesser ----------
   Ein Balken pro Takt statt eines durchgehenden: der Kunde sieht, wie
   viele Schritte es sind, nicht nur wie weit es ist.

   groupAfter setzt eine breitere Luecke — die Stelle, an der der Kunde
   selbst dran ist. Waehrend er dort wartet, fuellt sich der naechste
   Balken nicht, er pocht (paused). Ein laufender Balken ohne laufende
   Arbeit waere eine Luege.

   Jeder Balken kennt seine eigene Dauer: die Takte sind verschieden
   lang, weil in ihnen verschieden viel passiert. Eine Durchschnitts-
   dauer wuerde den Balken sichtbar gegen das Bild laufen lassen. */
export function BeatMeter({
  step,
  msList,
  run,
  label,
  groupAfter,
  paused = false,
}: {
  step: number
  /** Dauer jedes Takts in Millisekunden — Laenge bestimmt die Balkenzahl. */
  msList: number[]
  run: boolean
  label: string
  /** Nach diesem Balken steht die groessere Luecke. */
  groupAfter?: number
  /** Der naechste Balken wartet auf eine Handlung statt zu laufen. */
  paused?: boolean
}) {
  return (
    <div
      className="beat-meter"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={msList.length}
      aria-valuenow={step}
      aria-label={label}
    >
      {msList.map((ms, i) => (
        <span
          key={i}
          className={[
            !run ? '' : i < step ? 'done' : i === step ? (paused ? 'wait' : 'now') : '',
            i + 1 === groupAfter ? 'gap' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <i style={{ '--ms': `${ms}ms` } as React.CSSProperties} />
        </span>
      ))}
    </div>
  )
}
