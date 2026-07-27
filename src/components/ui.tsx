import type { Plan } from '../data/plans'

/* ---------- Aurora-Hintergrund ----------
   Verlaufsbild aus Figma (siehe global.css). Die frueheren vier
   weichgezeichneten CSS-Flaechen entfallen — das Bild ist exakt und auf
   dem Geraet schneller. */
export function BackgroundGradient() {
  return (
    <>
      <div className="bg-grad" />
      <div className="bg-noise" />
    </>
  )
}

/* ---------- iOS status bar ---------- */
export function StatusBar() {
  return (
    <div className="statusbar">
      <span className="time">9:41</span>
      <div className="icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="white">
          <rect x="0" y="7" width="3" height="5" rx="1" />
          <rect x="5" y="5" width="3" height="7" rx="1" />
          <rect x="10" y="2.5" width="3" height="9.5" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
          <path d="M8 8.4a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4z" />
          <path d="M8 4.2c1.7 0 3.2.7 4.3 1.8l-1.5 1.5A4 4 0 0 0 8 6.3a4 4 0 0 0-2.8 1.2L3.7 6A6 6 0 0 1 8 4.2z" />
          <path d="M8 0c2.8 0 5.4 1.1 7.3 3l-1.5 1.5A8.2 8.2 0 0 0 8 2.1c-2.3 0-4.3.9-5.8 2.4L.7 3A10.2 10.2 0 0 1 8 0z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="4" stroke="white" opacity=".35" fill="none" />
          <rect x="2" y="2" width="20" height="9" rx="2.5" fill="white" />
          <path d="M25 4.5v4a2.2 2.2 0 0 0 0-4z" fill="white" opacity=".4" />
        </svg>
      </div>
    </div>
  )
}

/* ---------- Vodafone-Zeichen ----------
   Echter Pfad aus Figma (Plan-Karte, 20x20) statt CSS-Nachbau. */
export function VodaMark({ size = '' }: { size?: '' | 'sm' | 'md' }) {
  return (
    <svg className={`voda-mark ${size}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 20C15.5228 20 20 15.5229 20 10C20 5.95726 17.601 2.47486 14.149 0.898657C12.4152 1.36083 11.0661 3.01019 11.0722 4.87175C11.0725 4.93574 11.0782 5.00414 11.0845 5.03599C14.1529 5.7833 15.5458 7.63468 15.5543 10.1964C15.5628 12.758 13.5404 15.5648 10.1223 15.5761C7.35364 15.5853 4.4732 13.2223 4.46062 9.42798C4.45223 6.91873 5.80599 4.5034 7.53643 3.07042C9.22429 1.67278 11.5366 0.775887 13.6337 0.768919C13.7106 0.768656 13.7885 0.770298 13.8647 0.774133C12.6757 0.275504 11.37 0 10 0C4.47717 0 0 4.47711 0 10C0 15.5229 4.47717 20 10 20Z"
        fill="currentColor"
      />
    </svg>
  )
}

/* ---------- eSIM chip icon ---------- */
export function EsimIcon({ large = false }: { large?: boolean }) {
  const dots = (
    <>
      <i /> <i /> <i /> <i />
    </>
  )
  return (
    <div className={`esim-icon${large ? ' lg' : ''}`}>
      <div className="dots top">{dots}</div>
      <div className="dots bottom">{dots}</div>
      <div className="dots left">{dots}</div>
      <div className="dots right">{dots}</div>
      <div className="sq" />
      <div className="inner">e</div>
    </div>
  )
}

/* ---------- eSIM card (Figma "E-Sim Card") ---------- */
export function SimCard({
  plan,
  chipText,
  onClick,
  showMark = true,
}: {
  plan: Plan
  chipText?: string | null
  onClick?: () => void
  /* Home zeigt in Figma nur Plan-Name + Chip, kein Vodafone-Zeichen. */
  showMark?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className={`sim-card ${plan.key}`} onClick={onClick}>
      <div className="head">
        <span className="name">{plan.name}</span>
        {showMark && <VodaMark size="md" />}
        {chipText && <span className="chip">{chipText}</span>}
      </div>
      <div className="foot">
        <div>
          <div className="price">{plan.price}</div>
          <div className="sub">Deine 5G eSim, jeden Monat kündbar</div>
        </div>
        <EsimIcon />
      </div>
    </Tag>
  )
}

/* ---------- Feature list ---------- */
export function FeatureList({ plan }: { plan: Plan }) {
  return (
    <div className="feat-list">
      {plan.features.map((f) => (
        <div className="feat" key={f}>
          {/* Figma: gefuellter weisser Punkt in einem 24x24-Feld, kein Haekchen */}
          <span className="ic">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="5" fill="currentColor" />
            </svg>
          </span>
          <span>{f}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- Common icons ---------- */
export const ArrowLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
)
export const ArrowRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
)
export const Plus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const ChevronDown = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
)
