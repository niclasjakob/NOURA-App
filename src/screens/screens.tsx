import { useEffect, useRef, useState } from 'react'
import mark from '../assets/img/noura-mark.svg'
import avatarMarcel from '../assets/img/avatar-marcel.webp'
import { ONBOARDING, PLANS } from '../data/plans'
import {
  ArrowLeft,
  ArrowRight,
  BackgroundGradient,
  ChevronDown,
  DemoSkip,
  FeatureList,
  Plus,
  Screen,
  SimCard,
  StatusBar,
  Button,
} from '../components/ui'
import { useInert } from '../hooks/a11y'
import { CycleCard, ForecastCard } from '../components/usage'
import { MagicCodeCard } from '../components/magic-code'
import { PassCard } from '../components/magic-pass'
import type { MagicPass } from '../data/magic'
import { CALLS_MIN, HOLDER, MESSAGES, fmtGb, usageSummary } from '../data/account'
import {
  AuroraFlow,
  Card3D,
  SuccessBurst,
  VisualDigital,
  VisualFlexible,
  VisualSpeed,
} from '../components/onboarding-visuals'

interface ScreenProps {
  active: boolean
}

/* ================= Intro =================
   Auftritt in vier Stufen: Karte schwebt ein, Wortmarke baut sich Buchstabe
   fuer Buchstabe auf, Lockup und Buttons folgen versetzt. Die Stufen haengen
   an .on — sie laufen erst, wenn der Screen wirklich sichtbar ist. */
export function Intro({
  active,
  onStart,
  onLogin,
  onSkipToHome,
}: ScreenProps & { onStart: () => void; onLogin: () => void; onSkipToHome: () => void }) {
  return (
    <Screen active={active}>
      <AuroraFlow tone="coral" />
      <div className={`intro-stage${active ? ' on' : ''}`}>
        <div className="intro-center">
          {/* Das Zeichen aus dem App-Icon, darunter die Wortmarke. Ersetzt
              seit 2026-09-17 den reinen Schriftzug und das Vodafone-Lockup —
              siehe Abweichungsliste im Design-System. Das Bild traegt alt="",
              den Namen spricht die Wortmarke daneben ohnehin aus. */}
          <img src={mark} className="intro-mark" alt="" />
          <span className="intro-logo" aria-label="NOURA">
            {['N', 'O', 'U', 'R', 'A'].map((c, i) => (
              <span key={i} style={{ '--i': i } as React.CSSProperties} aria-hidden="true">
                {c}
              </span>
            ))}
          </span>
        </div>
        <div className="intro-nav">
          {/* In Figma ist dieser Button Glas, nicht rot gefuellt */}
          <Button onClick={onStart}>Jetzt loslegen</Button>
          <Button variant="ghost" onClick={onLogin}>Einloggen</Button>
        </div>
        {/* Oben rechts statt unter den Buttons: die beiden Knoepfe sitzen auf
            den Figma-Hoehen (y=666/743), ein dritter Eintrag in .intro-nav
            wuerde sie nach oben schieben. */}
        <div className="top-nav">
          <DemoSkip onSkip={onSkipToHome} className="in-nav" />
        </div>
      </div>
    </Screen>
  )
}

/* ================= Onboarding (Feature v3) =================
   Drei Schritte mit eigener Bildwelt. Der Wechsel laeuft gerichtet: der
   alte Schritt zieht zur Seite ab, der neue kommt aus der Gegenrichtung
   heran. Waehrend der Wischgeste folgt der Inhalt dem Finger — das Visual
   staerker als der Text, das erzeugt Tiefe. */
export function Onboarding({
  active,
  onBack,
  onDone,
  onSkipToHome,
}: ScreenProps & { onBack: () => void; onDone: () => void; onSkipToHome: () => void }) {
  const [step, setStep] = useState(0)
  const [leaving, setLeaving] = useState<0 | 1 | -1>(0)
  const [enterDir, setEnterDir] = useState<1 | -1>(1)
  const stageRef = useRef<HTMLDivElement>(null)
  const dragFrom = useRef<number | null>(null)
  const busy = useRef(false)

  /* Einheitenlos, damit daraus im CSS sowohl px (Versatz) als auch deg
     (Neigung) gerechnet werden koennen. */
  const setDrag = (px: number) => stageRef.current?.style.setProperty('--dragN', String(Math.round(px)))

  const change = (next: number) => {
    if (next === step || busy.current || next < 0 || next > 2) return
    const dir: 1 | -1 = next > step ? 1 : -1
    busy.current = true
    setEnterDir(dir)
    setLeaving(dir)
    window.setTimeout(() => {
      setStep(next)
      setLeaving(0)
      window.setTimeout(() => {
        busy.current = false
      }, 260)
    }, 240)
  }
  const nextStep = () => (step < 2 ? change(step + 1) : onDone())
  const prevStep = () => (step > 0 ? change(step - 1) : onBack())
  const lastStep = step === 2
  const ob = ONBOARDING[step]

  /* Der Fortschrittsbalken am Weiter-Button laeuft mit — er zeigt, wie viel
     vom Onboarding noch kommt, ohne einen zweiten Indikator zu brauchen. */
  const RING = 2 * Math.PI * 29
  const filled = ((step + 1) / 3) * RING

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy.current) return
    dragFrom.current = e.clientX
    stageRef.current?.classList.add('dragging')
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragFrom.current == null) return
    let dx = e.clientX - dragFrom.current
    /* Gummiband an den Enden: die Geste bleibt spuerbar, laeuft aber ins Leere */
    if ((step === 0 && dx > 0) || (step === 2 && dx < 0)) dx *= 0.3
    setDrag(dx)
  }
  const endDrag = (e: React.PointerEvent) => {
    if (dragFrom.current == null) return
    const dx = e.clientX - dragFrom.current
    dragFrom.current = null
    stageRef.current?.classList.remove('dragging')
    setDrag(0)
    if (dx < -56) nextStep()
    else if (dx > 56 && step > 0) change(step - 1)
  }

  return (
    <Screen active={active}>
      <AuroraFlow tone={step === 0 ? 'coral' : step === 1 ? 'violet' : 'blue'} />

      <div
        className="ob-swipe"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          ref={stageRef}
          className={`ob-stage${leaving ? ' leaving' : ''}`}
          data-dir={leaving || enterDir}
        >
          {/* key erzwingt den Neuaufbau — dadurch laeuft die Eintritts-
              animation bei jedem Schritt erneut */}
          <div className="ob-visual" key={`v${step}`}>
            {step === 0 && <VisualDigital />}
            {step === 1 && <VisualFlexible run={active} />}
            {step === 2 && <VisualSpeed run={active} />}
          </div>

          <div className="ob-text" key={`t${step}`} aria-live="polite">
            <span className="ob-tag" style={{ '--i': 0 } as React.CSSProperties}>
              {ob.tag}
            </span>
            <h1 style={{ '--i': 1 } as React.CSSProperties}>{ob.title}</h1>
            <p style={{ '--i': 2 } as React.CSSProperties}>{ob.body}</p>
          </div>
        </div>
      </div>

      {/* Figma hat hier kein "Ueberspringen" — nur den Zurueck-Pfeil. Die
          Abkuerzung rechts ist deshalb kein Design-Element, sondern die
          Vorfuehr-Hilfe: sie springt nicht einen Schritt weiter, sondern
          ueber den ganzen Abschluss hinweg nach Home. */}
      <div className="top-nav">
        <button
          className="icon-plain"
          aria-label={step > 0 ? 'Zurück zum vorherigen Schritt' : 'Zurück zum Start'}
          onClick={prevStep}
        >
          <ArrowLeft />
        </button>
        <DemoSkip onSkip={onSkipToHome} className="in-nav" />
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

        <div className="ob-next">
          <svg className="next-ring" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="29" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="2.5" />
            <circle
              cx="32"
              cy="32"
              r="29"
              fill="none"
              stroke="var(--noura-accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={RING}
              strokeDashoffset={RING - filled}
              transform="rotate(-90 32 32)"
            />
          </svg>
          {/* Figma: auf allen drei Schritten derselbe runde 64x64-Glas-Button */}
          <Button
            variant="icon"
            className={lastStep ? 'final' : ''}
            aria-label={lastStep ? 'Los geht\'s' : 'Weiter'}
            onClick={nextStep}
          >
            <ArrowRight />
          </Button>
        </div>
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
      if (dx < -60 && planIdx < PLANS.length - 1) onPlanChange(planIdx + 1)
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
        <button className="icon-plain" aria-label="Zurück zu den Funktionen" onClick={onBack}>
          <ArrowLeft />
        </button>
      </div>
      <div className="plan-flow">
      <div className="plan-header">
        <h1>Wähle Deinen Tarif</h1>
        {/* Der Unterschied benannt statt die Ueberschrift wiederholt:
            beide Tarife sind unbegrenzt und monatlich kuendbar,
            verschieden sind Tempo und Magic Codes. Wer das vorne
            liest, muss nicht zwei Feature-Listen vergleichen. */}
        <p>Beide unbegrenzt mit 5G und monatlich kündbar. Der Unterschied ist das Tempo — und was Deine Magic Codes öffnen.</p>
        <div className="tabs" ref={tabsRef}>
          <span className="pill" style={{ left: pill.left, width: pill.width }} />
          {PLANS.map((p, i) => (
            <button key={p.key} className={i === planIdx ? 'on' : ''} onClick={() => onPlanChange(i)}>
              {/* Der Preis gehoert an den Reiter. Sonst muss man
                  zwischen den Karten wischen, um zwei Zahlen zu
                  vergleichen. */}
              <span className="t-name">{p.name.charAt(0) + p.name.slice(1).toLowerCase()}</span>
              <span className="t-price">{p.monthly} €</span>
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
              {/* "Bis zu 300 Mbit/s" ist eine Zahl, die niemand
                  einordnen kann — und sie ist der greifbarste
                  Unterschied zwischen den Tarifen. Also steht daneben,
                  was sie im Alltag bedeutet. */}
              <div className="plan-speed">
                <b>{p.downMbit} Mbit/s</b>
                <span>{p.speedNote}</span>
              </div>
              <div className="features-block">
                <h2>Deine Features</h2>
                <p className="desc">{p.desc}</p>
                <FeatureList plan={p} />
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
      <div className="plan-cta">
        {/* Figma: Glas-Button, nicht rot gefuellt. Der Tarifname steht
            dabei — im Wisch-Karussell ist sonst nicht zweifelsfrei,
            welche Karte gerade gilt. */}
        <Button onClick={onChoose}>{PLANS[planIdx].name} auswählen</Button>
        {/* Preisangabenverordnung: bei Endkundenpreisen muss dabei
            stehen, dass die Umsatzsteuer enthalten ist. */}
        <p className="cta-fine">Preis inkl. MwSt. · keine Mindestlaufzeit · keine Anschlussgebühr</p>
      </div>
    </Screen>
  )
}

/* ================= Activation =================
   Nur noch der Login: das Konto wird geladen, der Kunde wartet. Hier
   entsteht nichts, deshalb steht hier auch keine Fertigung — die
   schwebende Karte aus Figma 1330:1775 mit abhakender Schrittliste
   ist fuer diesen Fall genau richtig.

   Der Neukunde ist seit dem 2026-09-17 nicht mehr hier: seine eSIM
   entsteht in screens/esim.tsx, zusammen mit ihrer Einrichtung. Es
   waren zwei Wartebilder hintereinander, jetzt ist es eines. */
const STEP_MS = 1500
const FINALE_MS = 3050

export function Activation({ active, messages, onDone }: ScreenProps & { messages: string[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0)

  /* Der Ruecksprung auf den ersten Schritt wartet, bis der Screen
     wirklich weg ist. Waehrend der Ueberblendung ist er noch zu sehen,
     und ein Haken, der dabei zurueck auf die Schrittliste springt, ist
     ein Ruck ohne Anlass — dieselbe Falle wie im eSIM-Ablauf. */
  useEffect(() => {
    if (!active) {
      const t = window.setTimeout(() => setIdx(0), 700)
      return () => window.clearTimeout(t)
    }
    if (messages.length === 0) {
      setIdx(0)
      return
    }
    setIdx(0)
    const count = messages.length - 1
    const timers = Array.from({ length: count }, (_, i) =>
      window.setTimeout(() => setIdx(i + 1), STEP_MS * (i + 1)),
    )
    timers.push(window.setTimeout(onDone, STEP_MS * count + FINALE_MS))
    return () => timers.forEach(window.clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, messages])

  const tasks = messages.slice(0, -1)
  const finale = messages[messages.length - 1] ?? ''
  const done = tasks.length > 0 && idx >= tasks.length

  return (
    <Screen active={active}>
      <AuroraFlow tone={done ? 'coral' : 'violet'} />
      {/* Figma 1330:1775: dieselbe 3D-SIM-Karte wie im Onboarding, der
          Statustext steht mittig darunter. */}
      <div className="act-stage">
        <div className="act-visual">
          {/* Die Karte raeumt zum Schluss den Platz fuer den Haken — beides
              uebereinander kollidiert mit dem Kartenaufdruck. */}
          <div className={`act-card${done ? ' gone' : ''}`}>
            <Card3D scanning={!done} />
          </div>
          {done && <SuccessBurst />}
        </div>

        <div className="act-status">
          <ul className={`act-steps${done ? ' out' : ''}`}>
            {tasks.map((t, i) => (
              <li key={t} className={i < idx ? 'ok' : i === idx ? 'now' : ''}>
                <span className="mark">
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3.5 8.5 6.5 11.5 12.5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="tx">{t}</span>
              </li>
            ))}
          </ul>
          <p className={`act-finale${done ? ' on' : ''}`} aria-live="polite">
            {finale}
          </p>
        </div>

        <div className={`act-bar${done ? ' done' : ''}`} role="progressbar" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={idx}>
          <i style={{ transform: `scaleX(${tasks.length ? idx / tasks.length : 1})` }} />
        </div>
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
  onOpenRoaming,
  onOpenMagic,
  passes,
  onOpenPass,
}: ScreenProps & {
  planIdx: number
  onOpenProfile: () => void
  onOpenSupport: () => void
  onOpenPlan: () => void
  onOpenRoaming: () => void
  onOpenMagic: () => void
  passes: MagicPass[]
  onOpenPass: (id: string) => void
}) {
  const [usageOpen, setUsageOpen] = useState(true)
  const [fabsOpen, setFabsOpen] = useState(false)
  /* Das eingeklappte Menue ist nur durchsichtig, nicht weg — ohne
     `inert` laeuft der Tabulator durch drei unsichtbare Knoepfe. */
  const fabsRef = useRef<HTMLDivElement>(null)
  useInert(fabsRef, !fabsOpen)
  const plan = PLANS[planIdx]
  const usage = usageSummary()

  /* ---------- Ankunft ----------
     Home war bisher einfach da: der Screen blendete auf und alles stand
     fertig. Nach sieben Takten eSIM-Einrichtung ist das ein Bruch —
     der Kunde kommt gerade von einem Bild, das sich vor seinen Augen
     aufgebaut hat, und landet auf einem Stillleben.

     Die Klasse haengt nur fuer die Dauer des Auftritts am Screen, nicht
     dauerhaft: die Eintrittsanimationen tragen `backwards`, und ein
     eingefrorener Endzustand nimmt den Karten spaeter ihre
     Druckreaktion (dieselbe Falle wie in onboarding.css).

     Home wird in diesem Prototyp nur aus einem Ablauf heraus betreten —
     Sheets wechseln den Screen nicht. Der Auftritt laeuft also genau
     dann, wenn er hingehoert, ohne dass jemand "erstes Mal" mitzaehlen
     muesste. */
  const [arriving, setArriving] = useState(false)
  useEffect(() => {
    if (!active) return
    setArriving(true)
    /* Sechs Versaetze zu 80ms plus die 460ms des letzten Eintritts —
       danach steht alles. 2600ms hielt die Klasse doppelt so lange am
       Screen wie der Auftritt dauerte. */
    const t = window.setTimeout(() => setArriving(false), 1200)
    return () => window.clearTimeout(t)
  }, [active])

  return (
    <Screen active={active}>
      <div className={`home${arriving ? ' arriving' : ''}`}>
      <div className="home-header">
        {/* Wortmarke ohne das Vodafone-Lockup: auf Home steht die Marke fuer
            sich, das Lockup traegt der Intro-Screen. Figma zeichnet hier
            keinen Kopf — siehe Abweichungsliste im Design-System. */}
        <span className="home-brand">NOURA</span>
        <div className="home-head-row">
          <h1>Hey {HOLDER.first} 👋🏼</h1>
          <button className="avatar-btn" aria-label="Profil öffnen" onClick={onOpenProfile}>
            <img src={avatarMarcel} className="avatar" alt="" />
          </button>
        </div>
      </div>
      <div className="home-scroll">
        {/* Die Karte kommt zuerst und kommt anders als der Rest: sie ist
            dasselbe Objekt, das gerade ins Netz gegangen ist, und landet
            hier. Ein Glanzstreifen laeuft einmal darueber — quittiert die
            Ankunft, ohne einen zweiten Haken zu brauchen. */}
        <SimCard plan={plan} chipText="Aktiv" onClick={onOpenPlan} />

        <MagicCodeCard run={active} onOpen={onOpenMagic} />

        {/* Direkt unter der Wolke: was sie verspricht, liegt darunter als
            das, was davon schon eingeloest ist. Ohne diese Zeile bliebe
            der Zugang im Sheet gefangen und der Ablauf endete dort, wo
            er anfing. */}
        {passes.map((p) => (
          <PassCard key={p.id} pass={p} onOpen={() => onOpenPass(p.id)} />
        ))}

        <button
          className={`section-toggle${usageOpen ? '' : ' closed'}`}
          aria-expanded={usageOpen}
          aria-controls="usage-panel"
          onClick={() => setUsageOpen(!usageOpen)}
        >
          Dein Verbrauch
          <ChevronDown />
        </button>
        <div id="usage-panel" className={`usage-panel${usageOpen ? '' : ' hidden'}`}>
          <div className="usage-panel-in">
          {/* Zeitbezug zuerst: ohne "Tag 12 von 31" ist jede Zahl
              darunter nicht einzuordnen. */}
          <CycleCard usage={usage} plan={plan} run={active} />

          <div className="usage">
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
              <div className="val">{fmtGb(usage.usedGb)}</div>
            </div>
          </div>
          <div className="col-r">
            <div className="card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div>
                <div className="label">Nachrichten</div>
                <div className="val">{MESSAGES}</div>
              </div>
            </div>
            <div className="card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
              </svg>
              <div>
                <div className="label">Anrufe</div>
                <div className="val">{CALLS_MIN} min</div>
              </div>
            </div>
          </div>
          </div>

          {/* Die eigentliche Aussage: wo der Monat hinlaeuft und was
              das kostet — naemlich nichts. */}
          <ForecastCard usage={usage} plan={plan} run={active} />
          </div>
        </div>
      </div>

      <div id="more-menu" ref={fabsRef} className={`fab-stack${fabsOpen ? ' open' : ''}`}>
        <Button onClick={() => { setFabsOpen(false); onOpenSupport() }}>Support</Button>
        <Button onClick={() => { setFabsOpen(false); onOpenRoaming() }}>Reisen</Button>
        <Button onClick={() => { setFabsOpen(false); onOpenPlan() }}>Plan anpassen</Button>
      </div>
      <div className="navbar">
        <button
          className={`btn mehr-btn${fabsOpen ? ' open' : ''}`}
          aria-expanded={fabsOpen}
          aria-controls="more-menu"
          onClick={() => setFabsOpen(!fabsOpen)}
        >
          <Plus />
          Mehr
        </button>
      </div>
      </div>
    </Screen>
  )
}

export { BackgroundGradient, StatusBar }
