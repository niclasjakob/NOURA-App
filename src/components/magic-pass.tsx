/* ============================================================
   NOURA — Zugang (Magic Pass)

   Was aus vier Zeichen wird. Die Konzeptseite verspricht "Platz ist
   sofort Deiner" — ohne etwas, das man danach in der Hand haelt,
   bleibt das eine Behauptung.

   Die Karte liest sich wie ein Ticket und ist bewusst zweigeteilt:
   oben, wozu der Zugang gilt, unten der Abriss mit dem Einlass-Code.
   Die gestrichelte Linie dazwischen macht das ohne ein Wort klar.

   Das Muster ist echt gerechnet, aber kein QR-Code — es ist die
   sichtbare Form des Einlass-Codes, damit zwei Zugaenge nie gleich
   aussehen. Was daran Prototyp ist, steht auf der Karte selbst.
   ============================================================ */
import type { MagicPass } from '../data/magic'
import { HOLDER } from '../data/account'

/* ---------- Muster ----------
   FNV-1a als Streuwert, danach ein linearer Kongruenzgenerator. Kein
   Sicherheitsanspruch — beides muss nur dafuer sorgen, dass derselbe
   Code immer dasselbe Bild ergibt und zwei Codes verschiedene. */
const hash = (s: string) => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

const rng = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return seed / 0x100000000
}

const N = 13
/* Drei Ecken tragen ein Suchmuster, die vierte bleibt frei — genau die
   Asymmetrie, an der das Auge "Scan-Code" erkennt. Sechs statt fuenf
   Felder, damit ein Feld Abstand zum Rauschen bleibt. */
const inFinder = (x: number, y: number) =>
  (x < 6 && y < 6) || (x >= N - 6 && y < 6) || (x < 6 && y >= N - 6)

function cells(seed: string): Array<[number, number]> {
  const next = rng(hash(seed))
  const out: Array<[number, number]> = []

  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const ring = x === 0 || y === 0 || x === 4 || y === 4
        if (ring || (x === 2 && y === 2)) out.push([ox + x, oy + y])
      }
    }
  }
  finder(0, 0)
  finder(N - 5, 0)
  finder(0, N - 5)

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!inFinder(x, y) && next() < 0.46) out.push([x, y])
    }
  }
  return out
}

export function ScanCode({ value, size = 96 }: { value: string; size?: number }) {
  return (
    <svg
      className="scan"
      width={size}
      height={size}
      viewBox={`-1 -1 ${N + 2} ${N + 2}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <rect x={-1} y={-1} width={N + 2} height={N + 2} rx="1.5" fill="#fff" />
      {cells(value).map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#1a1a1a" />
      ))}
    </svg>
  )
}

/* ---------- Ticket ---------- */
export function MagicTicket({ pass }: { pass: MagicPass }) {
  const d = pass.drop
  return (
    <div className="card ticket">
      <div className="ticket-top">
        <span className="drop-kind">{d.kind}</span>
        <span className="ticket-state">Zugang gültig</span>
      </div>

      <div className="ticket-title">{d.title}</div>
      <div className="ticket-host">{d.host}</div>

      <dl className="ticket-meta">
        <div>
          <dt>Wann</dt>
          <dd>{d.when}</dd>
        </div>
        <div>
          <dt>Wo</dt>
          <dd>{d.place}</dd>
        </div>
        <div>
          <dt>Enthalten</dt>
          <dd>{d.grants}</dd>
        </div>
        <div>
          <dt>Für</dt>
          <dd>{HOLDER.first} · nicht übertragbar</dd>
        </div>
      </dl>

      <div className="ticket-stub">
        <ScanCode value={pass.entry} />
        <div className="ticket-entry">
          <span className="label">Einlass-Code</span>
          <b>{pass.entry}</b>
          <span className="ticket-fine">
            Am Eingang vorzeigen — Muster nur zur Ansicht, im Echtbetrieb steht hier ein
            signierter Code.
          </span>
        </div>
      </div>
    </div>
  )
}

/* ---------- Kachel auf Home ----------
   Direkt unter der Code-Wolke: was die Wolke verspricht, liegt darunter
   als das, was man davon besitzt. Kompakt, weil Home schon dicht ist —
   die Einzelheiten stehen im Sheet.

   Ohne `onOpen` steht sie still (keine Taste, kein Pfeil) — so zeigt
   der Abschluss der eSIM-Einrichtung denselben Zugang, der gleich auf
   Home liegt, ohne ins Sheet zu fuehren. */
export function PassCard({ pass, onOpen }: { pass: MagicPass; onOpen?: () => void }) {
  const d = pass.drop
  const body = (
    <>
      <ScanCode value={pass.entry} size={48} />
      <span className="pass-tx">
        <span className="pass-kind">{d.kind} · Zugang</span>
        <b>{d.title}</b>
        <span className="pass-when">{d.when}</span>
      </span>
    </>
  )
  if (!onOpen) return <div className="card pass-card">{body}</div>
  return (
    <button
      type="button"
      className="card pass-card"
      onClick={onOpen}
      aria-label={`Zugang ${d.title} anzeigen`}
    >
      {body}
      <svg
        className="pass-go"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  )
}
