/* ============================================================
   NOURA — Verbrauch mit Zeitbezug

   Der Home-Screen zeigte bisher drei Zahlen ohne Rahmen: "32.1 GB",
   "123", "64 min". Bei einem Flat-Tarif ist die interessante Frage
   aber nicht "wie viel habe ich verbraucht", sondern "wo stehe ich
   im Monat" und "kostet mich das gleich etwas". Genau diese beiden
   Aussagen ergaenzen die Karten hier — die drei Figma-Kacheln
   bleiben unveraendert daneben stehen.
   ============================================================ */
import type { Plan } from '../data/plans'
import {
  CYCLE,
  DAILY_GB,
  LAST_CYCLE_GB,
  fmtDate,
  fmtDayMonth,
  fmtEuro,
  fmtGb,
  type UsageSummary,
} from '../data/account'

/* ---------- Tagesverlauf ----------
   Bewusst ohne Achsen und Beschriftung: die Kurve soll die Form des
   Monats zeigen, nicht einzelne Werte ablesbar machen. Die Zahlen
   stehen darunter im Klartext. */
function Sparkline({ values, run }: { values: number[]; run: boolean }) {
  const W = 100
  const H = 32
  /* Kopfraum, damit die Spitze nicht am oberen Rand klebt */
  const max = Math.max(...values) * 1.15
  const step = values.length > 1 ? W / (values.length - 1) : W
  const pts = values.map((v, i) => [i * step, H - (v / max) * H] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')

  return (
    <svg
      className={`spark${run ? ' run' : ''}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--noura-accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--noura-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="spark-area" d={`${line} L${W} ${H} L0 ${H} Z`} fill="url(#sparkFill)" />
      {/* pathLength="1" normiert die Pfadlaenge — dadurch laesst sich die
          Linie ueber stroke-dashoffset zeichnen, ohne sie auszumessen.
          Kein runder Abschluss und kein Endpunkt: preserveAspectRatio="none"
          streckt die x-Achse um gut das Dreifache, runde Formen wuerden
          dabei zu Ellipsen — und am rechten Rand abgeschnitten. */}
      <path
        className="spark-line"
        d={line}
        pathLength="1"
        fill="none"
        stroke="var(--noura-accent)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ---------- Abrechnungszeitraum ----------
   Beantwortet "wo im Monat stehe ich" und nennt Termin und Betrag
   der naechsten Rechnung — die zwei Angaben, wegen derer Kunden
   sonst in der Rechnungsuebersicht suchen. */
/* Der Rechnungsbetrag wird aus dem Tarif gerechnet, nicht notiert.
   Er stand bis zum 2026-09-17 als feste Zeichenkette in CYCLE und war
   damit fuer hoechstens einen der beiden Tarife richtig — zuletzt fuer
   keinen: 30,00 EUR gegen 25 EUR CONNECT und 40 EUR CREATE. Eine Zahl,
   die vom Tarif abhaengt, gehoert nicht neben die Zeitraumdaten. */
export function CycleCard({ usage, plan, run }: { usage: UsageSummary; plan: Plan; run: boolean }) {
  const pct = Math.min(100, Math.round((usage.day / usage.days) * 100))
  return (
    <div className="card cycle-card">
      <div className="cycle-top">
        <span className="label">Abrechnungszeitraum</span>
        <span className="cycle-day">
          Tag {usage.day} von {usage.days}
        </span>
      </div>
      <div
        className="cycle-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={usage.days}
        aria-valuenow={usage.day}
        aria-label={`Tag ${usage.day} von ${usage.days} im Abrechnungszeitraum`}
      >
        <i style={{ transform: `scaleX(${run ? pct / 100 : 0})` }} />
      </div>
      <div className="cycle-foot">
        <span>
          {fmtDayMonth(CYCLE.start)} – {fmtDayMonth(CYCLE.end)}
        </span>
        <span>
          Rechnung am {fmtDate(CYCLE.invoiceDate)} · {fmtEuro(plan.monthly)}
        </span>
      </div>
    </div>
  )
}

/* ---------- Prognose ----------
   Der Ring auf der Internet-Kachel bleibt nach Figma ein leeres ∞ —
   bei unbegrenztem Volumen gibt es keinen Fuellstand, den man
   ehrlich zeigen koennte. Die Aussage steckt stattdessen hier:
   Hochrechnung, Vergleich zum Vormonat, und die Zusage, dass auch
   dann nicht gedrosselt wird. */
export function ForecastCard({ usage, plan, run }: { usage: UsageSummary; plan: Plan; run: boolean }) {
  const up = usage.trendPct > 0
  const flat = Math.abs(usage.trendPct) < 3

  return (
    <div className="card forecast-card">
      <div className="fc-head">
        <div>
          <span className="label">Hochgerechnet bis {fmtDayMonth(CYCLE.end)}</span>
          <div className="fc-val">
            {fmtGb(usage.forecastGb)}
            {!flat && (
              <span className={`trend${up ? ' up' : ' down'}`}>
                {up ? '+' : ''}
                {usage.trendPct} %
              </span>
            )}
          </div>
        </div>
      </div>

      <Sparkline values={DAILY_GB} run={run} />

      <p className="fc-note">
        Ø {fmtGb(usage.perDayGb)} pro Tag · Vormonat {fmtGb(LAST_CYCLE_GB)}
      </p>

      {/* Die eigentliche Entwarnung — bei Flat-Tarifen ist Drosselung
          die Sorge, nicht das Volumen. */}
      <div className="fc-assure">
        <span className="dot" aria-hidden="true" />
        Keine Drosselung — volle {plan.downMbit} Mbit/s bis zum Monatsende
      </div>
    </div>
  )
}
