import { useEffect, useRef, useState } from 'react'
import lockup from '../assets/img/connected-by-vodafone.png'
import avatarMarcel from '../assets/img/avatar-marcel.webp'
import onboardCard from '../assets/img/onboard-simcard.webp'
import { ONBOARDING, PLANS } from '../data/plans'
import {
  ArrowLeft,
  ArrowRight,
  BackgroundGradient,
  ChevronDown,
  FeatureList,
  Plus,
  SimCard,
  StatusBar,
} from '../components/ui'

interface ScreenProps {
  active: boolean
}

function Screen({ active, children }: ScreenProps & { children: React.ReactNode }) {
  return <section className={`screen${active ? ' active' : ''}`}>{children}</section>
}

/* ================= Intro ================= */
export function Intro({ active, onStart, onLogin }: ScreenProps & { onStart: () => void; onLogin: () => void }) {
  return (
    <Screen active={active}>
      <div className="intro-center">
        <span className="intro-logo">NOURA</span>
        <img src={lockup} className="intro-lockup" alt="Connected by Vodafone" />
      </div>
      <div className="intro-nav">
        {/* In Figma ist dieser Button Glas, nicht rot gefuellt */}
        <button className="btn" onClick={onStart}>Jetzt loslegen</button>
        <button className="btn ghost" onClick={onLogin}>Einloggen</button>
      </div>
    </Screen>
  )
}

/* ================= Onboarding (Feature v3) ================= */
export function Onboarding({ active, onBack, onDone }: ScreenProps & { onBack: () => void; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [fading, setFading] = useState(false)
  const swipeX = useRef<number | null>(null)

  const change = (next: number) => {
    if (next === step || fading) return
    setFading(true)
    window.setTimeout(() => {
      setStep(next)
      setFading(false)
    }, 300)
  }
  const nextStep = () => (step < 2 ? change(step + 1) : onDone())
  const prevStep = () => (step > 0 ? change(step - 1) : onBack())
  const lastStep = step === 2
  const ob = ONBOARDING[step]

  const onPointerDown = (e: React.PointerEvent) => {
    swipeX.current = e.clientX
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (swipeX.current == null) return
    const dx = e.clientX - swipeX.current
    swipeX.current = null
    if (dx < -60) nextStep()
    else if (dx > 60 && step > 0) change(step - 1)
  }

  return (
    <Screen active={active}>
      <div className="ob-swipe" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <div className={`feature-visual fade-step${fading ? ' out' : ''}`}>
          {step === 0 && (
            /* 3D-SIM-Karte als Bild aus Figma — perspektivische Ansicht,
               in CSS nicht exakt nachbaubar. */
            <img src={onboardCard} className="iso-visual" alt="NOURA eSIM-Karte" />
          )}
          {step === 1 && (
            <div className="iso-card iso-cal">
              <div className="cal-head"><i /><i /></div>
              <div className="cal-body">10</div>
            </div>
          )}
          {step === 2 && (
            <div className="iso-card iso-5g"><span>5G</span></div>
          )}
        </div>

        <div className={`feature-text fade-step${fading ? ' out' : ''}`} aria-live="polite">
          <h2>
            <span className="hl">{ob.tag}</span>
            {ob.title}
          </h2>
          <p>{ob.body}</p>
        </div>
      </div>

      {/* Figma hat hier kein "Ueberspringen" — nur den Zurueck-Pfeil. */}
      <div className="top-nav">
        <button className="icon-plain" aria-label="Zurück" onClick={prevStep}>
          <ArrowLeft />
        </button>
      </div>

      <div className="ob-bottom">
        <div className="pagination">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              className={i === step ? 'on' : ''}
              aria-label={`Schritt ${i + 1} von 3`}
              aria-current={i === step}
              onClick={() => change(i)}
            >
              <i />
            </button>
          ))}
        </div>
        {/* Figma: auf allen drei Schritten derselbe runde 64x64-Glas-Button */}
        <button className="btn icon-btn" aria-label={lastStep ? 'Los geht\'s' : 'Weiter'} onClick={nextStep}>
          <ArrowRight />
        </button>
      </div>
    </Screen>
  )
}

/* ================= Select Plan ================= */
export function SelectPlan({
  active,
  planIdx,
  onPlanChange,
  onBack,
  onChoose,
}: ScreenProps & {
  planIdx: number
  onPlanChange: (i: number) => void
  onBack: () => void
  onChoose: () => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState({ left: 0, width: 79 })
  const drag = useRef<{ startX: number; base: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const slideWidth = () => trackRef.current?.querySelector<HTMLElement>('.plan-slide')?.offsetWidth ?? 393

  useEffect(() => {
    const btn = tabsRef.current?.querySelectorAll('button')[planIdx]
    if (btn) setPill({ left: btn.offsetLeft, width: btn.offsetWidth })
    if (trackRef.current) trackRef.current.style.transform = `translateX(${-planIdx * slideWidth()}px)`
  }, [planIdx, active])

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { startX: e.clientX, base: -planIdx * slideWidth() }
    setDragging(true)
  }
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!drag.current || !trackRef.current) return
      trackRef.current.style.transform = `translateX(${drag.current.base + (e.clientX - drag.current.startX)}px)`
    }
    const up = (e: PointerEvent) => {
      if (!drag.current) return
      const dx = e.clientX - drag.current.startX
      drag.current = null
      setDragging(false)
      if (dx < -60 && planIdx < 2) onPlanChange(planIdx + 1)
      else if (dx > 60 && planIdx > 0) onPlanChange(planIdx - 1)
      else if (trackRef.current) trackRef.current.style.transform = `translateX(${-planIdx * slideWidth()}px)`
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [planIdx, onPlanChange])

  return (
    <Screen active={active}>
      <div className="top-nav">
        <button className="icon-plain" aria-label="Zurück" onClick={onBack}>
          <ArrowLeft />
        </button>
      </div>
      <div className="plan-header">
        <h2>Wähle einen Plan aus</h2>
        <p>Wähle einen Plan, der Deinen Anforderungen am Besten entspricht</p>
        <div className="tabs" ref={tabsRef}>
          <span className="pill" style={{ left: pill.left, width: pill.width }} />
          {['Create', 'Consume', 'Message'].map((label, i) => (
            <button key={label} className={i === planIdx ? 'on' : ''} onClick={() => onPlanChange(i)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="plan-track-wrap">
        <div
          className={`plan-track${dragging ? ' dragging' : ''}`}
          ref={trackRef}
          onPointerDown={onPointerDown}
        >
          {PLANS.map((p) => (
            <div className="plan-slide" key={p.key}>
              <SimCard plan={p} chipText={p.chip} />
              <div className="features-block">
                <h3>Deine Features</h3>
                <p className="desc">{p.desc}</p>
                <FeatureList plan={p} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="plan-cta">
        {/* Figma: Glas-Button, nicht rot gefuellt */}
        <button className="btn" onClick={onChoose}>Plan auswählen</button>
      </div>
    </Screen>
  )
}

/* ================= Activation ================= */
export function Activation({ active, messages, onDone }: ScreenProps & { messages: string[]; onDone: () => void }) {
  const [msgIdx, setMsgIdx] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!active) return
    setMsgIdx(0)
    let i = 0
    const iv = window.setInterval(() => {
      i++
      if (i < messages.length) {
        setFading(true)
        window.setTimeout(() => {
          setMsgIdx(i)
          setFading(false)
        }, 250)
      } else {
        window.clearInterval(iv)
        onDone()
      }
    }, 1100)
    return () => window.clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, messages])

  return (
    <Screen active={active}>
      {/* Figma 1330:1775: dieselbe 3D-SIM-Karte wie im Onboarding, der
          Statustext steht mittig darunter. Kein pulsierender Kreis. */}
      <div className="act-center">
        <img src={onboardCard} className="act-card" alt="" />
        <p className={`act-msg${fading ? ' fading' : ''}`}>{messages[msgIdx]}</p>
      </div>
    </Screen>
  )
}

/* ================= Home ================= */
export function Home({
  active,
  planIdx,
  onOpenProfile,
  onOpenSupport,
  onOpenPlan,
}: ScreenProps & {
  planIdx: number
  onOpenProfile: () => void
  onOpenSupport: () => void
  onOpenPlan: () => void
}) {
  const [usageOpen, setUsageOpen] = useState(true)
  const [fabsOpen, setFabsOpen] = useState(false)
  const plan = PLANS[planIdx]

  return (
    <Screen active={active}>
      <div className="home-header">
        <h1>Hey Marcel 👋🏼</h1>
        <button className="avatar-btn" aria-label="Profil öffnen" onClick={onOpenProfile}>
          <img src={avatarMarcel} className="avatar" alt="" />
        </button>
      </div>
      <div className="home-scroll">
        <SimCard plan={plan} chipText="Aktiv" onClick={onOpenPlan} showMark={false} />
        <button className={`section-toggle${usageOpen ? '' : ' closed'}`} onClick={() => setUsageOpen(!usageOpen)}>
          Dein Verbrauch
          <ChevronDown />
        </button>
        <div className={`usage${usageOpen ? '' : ' hidden'}`}>
          <div className="card col-l">
            {/* Icons in Akzentrot (Figma), nicht weiss */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21M12 3c-2.5 2.6-3.8 5.7-3.8 9s1.3 6.4 3.8 9" />
            </svg>
            <div className="ring-wrap">
              {/* Figma: nur ein heller Kreisumriss, kein Fortschrittsbogen */}
              <svg width="126" height="126" viewBox="0 0 126 126">
                <circle cx="63" cy="63" r="62" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1.5" />
              </svg>
              <span className="inf">∞</span>
            </div>
            <div>
              <div className="label">Internet</div>
              <div className="val">32.1 GB</div>
            </div>
          </div>
          <div className="col-r">
            <div className="card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div>
                <div className="label">Nachrichten</div>
                <div className="val">123</div>
              </div>
            </div>
            <div className="card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
              </svg>
              <div>
                <div className="label">Anrufe</div>
                <div className="val">64 min</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: 200 }} />
      </div>

      <div className={`fab-stack${fabsOpen ? ' open' : ''}`}>
        <button className="btn" onClick={() => { setFabsOpen(false); onOpenSupport() }}>Support</button>
        <button className="btn" onClick={() => { setFabsOpen(false); onOpenPlan() }}>Plan anpassen</button>
      </div>
      <div className="navbar">
        <button className={`btn mehr-btn${fabsOpen ? ' open' : ''}`} onClick={() => setFabsOpen(!fabsOpen)}>
          <Plus />
          Mehr
        </button>
      </div>
    </Screen>
  )
}

export { BackgroundGradient, StatusBar }
