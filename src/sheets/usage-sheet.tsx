/* ============================================================
   NOURA — Verbrauch & Rechnung

   Das Detail-Sheet hinter der Statuskarte auf Home, nach dem Konzept
   "Home Usage Concept" (Artboard "Details sheet", von Niclas am
   2026-09-25 gewaehlt). Hier steht alles, was Home nicht mehr zeigt:
   Tagesverlauf, Hochrechnung, Anrufe, SMS, Rechnung und Tempo.

   Die Hochrechnung bleibt, aber als Satz ohne roten Trend-Chip — bei
   einem unbegrenzten Tarif ist mehr Verbrauch keine Warnung.

   Gruppen sind Mulden, nicht Glas: Inhalt IM Sheet ist dunkler als das
   Sheet (siehe Kontoseiten und Support-Chat).
   ============================================================ */
import type { Plan } from '../data/plans'
import {
  CALLS_MIN,
  CYCLE,
  DAILY_GB,
  LAST_CYCLE_GB,
  MESSAGES,
  fmtDayMonth,
  fmtEuro,
  fmtGb,
  usageSummary,
} from '../data/account'
import { DayBars } from '../components/usage'
import { Sheet } from './sheets'

export function UsageSheet({ open, onClose, plan }: { open: boolean; onClose: () => void; plan: Plan }) {
  const usage = usageSummary()
  return (
    <Sheet id="usageSheet" open={open} label="Verbrauch & Rechnung" onClose={onClose}>
      <div className="sheet-body">
        <div className="plan-sheet-head">
          <h2>Verbrauch &amp; Rechnung</h2>
          <p>
            {fmtDayMonth(CYCLE.start)} – {fmtDayMonth(CYCLE.end)} · Tag {usage.day} von {usage.days}
          </p>
        </div>

        <div className="use-list">
          <section className="use-well" aria-labelledby="use-net">
            <div className="use-top">
              <span className="label" id="use-net">Internet</span>
              <span className="label">unbegrenzt</span>
            </div>
            <div className="use-val">{fmtGb(usage.usedGb)}</div>
            {/* `run` haengt am Sheet: die Balken wachsen beim Oeffnen. */}
            <DayBars values={DAILY_GB} days={usage.days} run={open} />
            <p className="use-note">
              Ø {fmtGb(usage.perDayGb)} pro Tag · hochgerechnet rund {fmtGb(usage.forecastGb, 0)} · Vormonat{' '}
              {fmtGb(LAST_CYCLE_GB)}
            </p>
          </section>

          <div className="use-pair">
            <div className="use-well">
              <span className="label">Anrufe</span>
              <div className="use-val">{CALLS_MIN} min</div>
              <span className="use-note">in Deiner Flat</span>
            </div>
            <div className="use-well">
              <span className="label">SMS</span>
              <div className="use-val">{MESSAGES}</div>
              <span className="use-note">in Deiner Flat</span>
            </div>
          </div>

          <div className="use-well rows">
            <div className="status-row">
              <span className="label">Nächste Rechnung</span>
              <b>
                {fmtEuro(plan.monthly)} · {fmtDayMonth(CYCLE.invoiceDate)}
              </b>
            </div>
            <div className="status-row">
              <span className="label">Tempo</span>
              <b>bis {plan.downMbit} Mbit/s</b>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  )
}
