import type { Plan } from '../data/plans'

/* ---------- Background (Figma "Gradient 2") ---------- */
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

/* ---------- Vodafone speechmark ---------- */
export function VodaMark({ size = '' }: { size?: '' | 'sm' | 'md' }) {
  return <span className={`voda-mark ${size}`} />
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
}: {
  plan: Plan
  chipText?: string | null
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className={`sim-card ${plan.key}`} onClick={onClick}>
      <div className="head">
        <span className="name">{plan.name}</span>
        <VodaMark size="md" />
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
          <span className="ic">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#e15055" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
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
