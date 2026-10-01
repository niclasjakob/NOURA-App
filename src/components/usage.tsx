/* ============================================================
   NOURA — Verbrauch

   Seit dem 2026-09-25 (Konzept "Home Usage Concept", Option A plus
   Detail-Sheet, von Niclas gewaehlt): Home zeigt eine Statuskarte,
   die Zahlen stehen im Sheet "Verbrauch & Rechnung"
   (sheets/usage-sheet.tsx).

   Beide Tarife sind unbegrenzt, mit Allnet-Flat. Vorher standen auf
   Home fuenf Karten mit zwoelf Zahlen — Zyklus, drei Figma-Kacheln mit
   ∞-Ring, Hochrechnung mit Kurve und rotem Trend-Chip. Keine davon
   hatte fuer den Kunden eine Folge, und die einzige, die Geld kostet,
   stand am kleinsten.
   ============================================================ */
import type { Plan } from '../data/plans'
import { CYCLE, fmtDayMonth, fmtEuro, fmtGb, type UsageSummary } from '../data/account'

/* ---------- Status (Home) ----------
   Beantwortet die zwei Fragen, die bei einem Flat-Tarif bleiben: bin
   ich irgendwo begrenzt, und was zahle ich wann. Der Verbrauch steht
   als eine Zeile da und oeffnet das Sheet.

   Der Rechnungsbetrag wird aus dem Tarif gerechnet, nicht notiert. Er
   stand bis zum 2026-09-17 als feste Zeichenkette in CYCLE und war
   damit fuer hoechstens einen der beiden Tarife richtig. */
export function StatusCard({ usage, plan, onOpen }: { usage: UsageSummary; plan: Plan; onOpen: () => void }) {
  return (
    <section className="card status-card" aria-labelledby="status-title">
      <div className="status-head">
        <span className="use-ic" aria-hidden="true">
          <span className="inf">∞</span>
        </span>
        <div>
          <h2 id="status-title">Alles unbegrenzt</h2>
          <p className="label">Volles Tempo, keine Drosselung.</p>
        </div>
      </div>
      <div className="status-row">
        <span className="label">Nächste Rechnung</span>
        <b>
          {fmtEuro(plan.monthly)} · {fmtDayMonth(CYCLE.invoiceDate)}
        </b>
      </div>
      <button type="button" className="status-row" aria-haspopup="dialog" onClick={onOpen}>
        <span className="label">Verbrauch diesen Monat</span>
        <b>{fmtGb(usage.usedGb)}</b>
        <span className="chev" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </button>
    </section>
  )
}

/* ---------- Tagesbalken ----------
   Ein Balken je abgeschlossenem Tag, danach ein Punkt je Tag, der im
   Zyklus noch kommt: der Monat als Strecke, ohne Achsen. Wo man steht,
   liest man an der Grenze zwischen Balken und Punkten ab — dafuer
   braucht es keinen eigenen Fortschrittsbalken mehr.

   HTML statt SVG, damit das einmalige Wachsen im Compositor laeuft
   (Design-System, "Leistung"). Die Hoehe ist relativ zum hoechsten Tag. */
export function DayBars({ values, days, run }: { values: number[]; days: number; run: boolean }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  return (
    <div
      className={`day-bars${run ? ' run' : ''}`}
      role="img"
      aria-label={`Verbrauch pro Tag an ${values.length} Tagen, zwischen ${fmtGb(min)} und ${fmtGb(max)}`}
    >
      {values.map((v, i) => (
        <i key={i} style={{ '--h': `${(v / max) * 100}%`, '--i': i } as React.CSSProperties} />
      ))}
      {Array.from({ length: Math.max(0, days - values.length) }, (_, i) => (
        <b key={`rest-${i}`} />
      ))}
    </div>
  )
}
