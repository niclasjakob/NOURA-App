/* ============================================================
   NOURA — Takt-Text

   Der Baustein, den jeder mehrteilige Wartevorgang teilt: ein Titel
   mit Erklaerung.

   Lag bis zum 2026-09-17 in components/esim-forge.tsx. Seit die
   Identitaetspruefung dieselbe Darstellung benutzt, gehoert er keinem
   der beiden Ablaeufe mehr.

   Der Taktmesser (BeatMeter), der hier bis zum 2026-09-25 stand, ist
   entfallen: die Takte fuellen jetzt das Segment ihres Schritts in der
   Schrittanzeige (FlowSteps in ui.tsx). Zwei Fortschrittsanzeigen auf
   einem Screen sagten dasselbe zweimal.
   ============================================================ */
import { useEffect, useState } from 'react'

/* ---------- Takt-Text ----------
   Titel und Erklaerung wechseln als Block. Der key sorgt dafuer, dass
   React das Element austauscht statt es zu beschriften — nur dann laeuft
   die Eintrittsanimation beim Taktwechsel erneut. Die Live-Region liegt
   auf dem Rahmen, der bleibt, sonst meldet VoiceOver nichts.

   Der abtretende Text bleibt fuer seinen Abgang (0,2s) im Rahmen stehen,
   darueber gelegt und fuer VoiceOver verborgen. Bis zum 2026-09-24 war
   er im Bild des Taktwechsels weg, und der neue kam erst danach — jeder
   Wechsel war ein Schnitt mit einem leeren Moment dazwischen.

   Der Abgang wird beim Rendern festgehalten, nicht in einem Effekt: ein
   Effekt laeuft erst nach dem Zeichnen, und fuer ein Bild stuende gar
   kein Text da. */
type Caption = { title: string; text: string }

export function BeatCaption({ title, text }: Caption) {
  const [shown, setShown] = useState<Caption>({ title, text })
  const [leaving, setLeaving] = useState<(Caption & { n: number }) | null>(null)
  if (shown.title !== title || shown.text !== text) {
    if (shown.title !== title) setLeaving({ ...shown, n: (leaving?.n ?? 0) + 1 })
    setShown({ title, text })
  }
  useEffect(() => {
    if (!leaving) return
    const t = window.setTimeout(() => setLeaving(null), 280)
    return () => window.clearTimeout(t)
  }, [leaving])

  return (
    <div className="beat-status" aria-live="polite">
      {leaving && (
        <div className="beat-caption leaving" key={`out-${leaving.n}`} aria-hidden="true">
          <b>{leaving.title}</b>
          <p>{leaving.text}</p>
        </div>
      )}
      <div className="beat-caption" key={title}>
        <b>{title}</b>
        <p>{text}</p>
      </div>
    </div>
  )
}
