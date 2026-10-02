import { useEffect, useRef, useState } from 'react'
import appIcon from '../assets/img/noura-app-icon.svg'
import lockup from '../assets/img/connected-by-vodafone.png'
import { ONBOARDING, PLAN_DIFF, PLAN_SHARED, PLANS, planTitle } from '../data/plans'
import {
  ArrowLeft,
  ArrowRight,
  BackgroundGradient,
  DemoSkip,
  FlowSteps,
  Monogram,
  Plus,
  Screen,
  SimCard,
  StatusBar,
  Button,
} from '../components/ui'
import { useInert } from '../hooks/a11y'
import { hapticError, hapticSelection, hapticSuccess } from '../lib/haptics'
import { StatusCard } from '../components/usage'
import { MagicCodeCard } from '../components/magic-code'
import { PassCard } from '../components/magic-pass'
import { CODE_LEN, failText, normalizeCode, redeem, type MagicPass } from '../data/magic'
import { HOLDER, usageSummary } from '../data/account'
import {
  AuroraFlow,
  VisualDigital,
  VisualMagic,
  VisualNetwork,
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
          {/* Das App-Icon traegt die Marke allein — dasselbe Bild, das der
              Startbildschirm des Systems an derselben Stelle zeigt, und
              damit laeuft der Start in diesen Screen hinein.

              Als <h1>, weil es die Ueberschrift dieses Screens ist: die
              korallene Wortmarke darunter ist am 2026-09-21 entfallen
              (Figma 1700:3984), und damit waere der Name sonst nirgends
              mehr ausgesprochen. Der alt-Text ist jetzt dieser Name. */}
          <h1 className="intro-brand">
            <img src={appIcon} className="intro-icon" alt="NOURA" />
          </h1>
          <img src={lockup} className="intro-lockup" alt="Connected by Vodafone" />
        </div>
        <div className="intro-nav">
          {/* In Figma ist dieser Button Glas, nicht rot gefuellt */}
          <Button onClick={onStart}>Jetzt loslegen</Button>
          {/* Die Methode steht im Knopf (managing-accounts.md › Best
              practices: "Always identify the authentication method you
              offer"). Bis zum 2026-09-25 hiess er "Einloggen" und fuehrte
              ohne jede Anmeldung auf einen Ladebildschirm. */}
          <Button variant="ghost" onClick={onLogin}>Mit Passkey anmelden</Button>
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
  /* Wie oft der Beispiel-Code auf Schritt 2 ausprobiert wurde. 0 = noch
     nicht; jeder Tipp laesst ihn neu einrasten. */
  const [tries, setTries] = useState(0)
  useEffect(() => {
    if (!active) setTries(0)
  }, [active])
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
      setTries(0)
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
            {step === 1 && <VisualMagic run={active} tryKey={tries} />}
            {step === 2 && <VisualNetwork />}
          </div>

          <div className="ob-text" key={`t${step}`} aria-live="polite">
            <span className="ob-tag" style={{ '--i': 0 } as React.CSSProperties}>
              {ob.tag}
            </span>
            <h1 style={{ '--i': 1 } as React.CSSProperties}>{ob.title}</h1>
            <p style={{ '--i': 2 } as React.CSSProperties}>{ob.body}</p>
            {/* Ausprobieren statt nur lesen (onboarding.md: "Teach through
                interactivity"). Das Bild darueber reagiert — derselbe
                Ablauf wie bei einem echten Code, nur ohne Einloesung. */}
            {step === 1 && (
              <button
                type="button"
                className="ob-try"
                style={{ '--i': 3 } as React.CSSProperties}
                onClick={() => setTries((n) => n + 1)}
              >
                {tries ? 'Noch einmal' : 'Beispiel-Code ausprobieren'}
              </button>
            )}
            {step === 1 && tries > 0 && (
              <span className="sr-only">Beispiel-Code eingelöst: Du stehst auf der Liste.</span>
            )}
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

        <div className={`ob-next${lastStep ? ' final' : ''}`}>
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
  reservedCode,
  onReserve,
}: ScreenProps & {
  planIdx: number
  onPlanChange: (i: number) => void
  onBack: () => void
  onChoose: () => void
  /** Ein Magic Code, der vor dem Kauf eingegeben wurde (hier oder per Link). */
  reservedCode: string | null
  onReserve: (code: string | null) => void
}) {
  /* Das Karussell rastet auf einer Karte ein — das iOS-Idiom fuer
     "eine Wahl schrubbt vorbei". Beide Wege dorthin (Reiter tippen,
     Karte wischen) laufen ueber diese eine Stelle, sonst haengt
     dieselbe Geste an zwei Orten und driftet auseinander. */
  const choosePlan = (i: number) => {
    if (i !== planIdx) hapticSelection()
    onPlanChange(i)
  }

  /* ---- Magic Code vor dem Kauf ----
     Der Code eines Creators ist oft der Grund, ueberhaupt hier zu sein
     (Pitch-Deck "Customer Hooks": Creator-Communities bringen neue
     Mitglieder). Er wird gegen den GEWAEHLTEN Tarif geprueft und
     reserviert; eingeloest wird er, wenn die eSIM im Netz ist. */
  const plan = PLANS[planIdx]
  const [codeIn, setCodeIn] = useState('')
  const [codeMiss, setCodeMiss] = useState<string | null>(null)
  const held = reservedCode ? redeem(reservedCode, [], plan.key) : null
  const heldDrop = held ? (held.ok ? held.pass.drop : held.drop) : undefined
  const reserve = () => {
    if (codeIn.length !== CODE_LEN) return
    const res = redeem(codeIn, [], plan.key)
    /* Ein Partner-Code des anderen Tarifs wird trotzdem gehalten: wer
       den Reiter wechselt, hat ihn dann dabei. Die Karte sagt, woran es
       haengt. */
    if (res.ok || res.reason === 'plan') {
      hapticSuccess()
      onReserve(normalizeCode(codeIn))
      setCodeIn('')
      setCodeMiss(null)
    } else {
      hapticError()
      setCodeMiss(failText(res))
    }
  }

  const trackRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState({ left: 0, width: 79 })
  /* `axis` haelt fest, wofuer die Geste sich entschieden hat: null =
     noch offen, 'x' = Karussell, 'y' = die Seite scrollt. */
  const drag = useRef<{ startX: number; startY: number; base: number; axis: 'x' | 'y' | null } | null>(null)
  const [dragging, setDragging] = useState(false)

  const slideWidth = () => trackRef.current?.querySelector<HTMLElement>('.plan-slide')?.offsetWidth ?? 393

  useEffect(() => {
    const btn = tabsRef.current?.querySelectorAll('button')[planIdx]
    if (btn) setPill({ left: btn.offsetLeft, width: btn.offsetWidth })
    if (trackRef.current) trackRef.current.style.transform = `translateX(${-planIdx * slideWidth()}px)`
  }, [planIdx, active])

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { startX: e.clientX, startY: e.clientY, base: -planIdx * slideWidth(), axis: null }
    setDragging(true)
  }
  useEffect(() => {
    /* ---- Achsensperre ----
       Die Geste entscheidet sich nach 8px fuer eine Richtung und
       bleibt dabei. Ohne das schob jede senkrechte Bewegung auf der
       Karte sie zugleich seitwaerts: `touch-action: pan-y` laesst die
       Seite scrollen, der Zeiger-Handler zog die Bahn trotzdem mit.
       Solange die Bahn den ganzen Screen fuellte, fiel das kaum auf —
       seit der Vergleich darunter scrollt (2026-09-22), faehrt der
       Finger staendig senkrecht ueber die Karte. */
    const LOCK = 8
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (!d || !trackRef.current) return
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      if (!d.axis) {
        if (Math.abs(dx) < LOCK && Math.abs(dy) < LOCK) return
        d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        if (d.axis === 'y') {
          /* Die Seite scrollt — die Bahn geht auf ihren Platz zurueck
             und ruehrt sich bis zum naechsten Aufsetzen nicht mehr. */
          drag.current = null
          setDragging(false)
          trackRef.current.style.transform = `translateX(${-planIdx * slideWidth()}px)`
          return
        }
      }
      trackRef.current.style.transform = `translateX(${d.base + dx}px)`
    }
    const up = (e: PointerEvent) => {
      if (!drag.current) return
      const dx = drag.current.axis === 'x' ? e.clientX - drag.current.startX : 0
      drag.current = null
      setDragging(false)
      if (dx < -60 && planIdx < PLANS.length - 1) choosePlan(planIdx + 1)
      else if (dx > 60 && planIdx > 0) choosePlan(planIdx - 1)
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
        {/* Schritt 1 von 4 — bis zum 2026-09-25 stand die Anzeige erst ab
            der Bestellung, und Schritt 1 war dort schon erledigt. */}
        <FlowSteps current={0} />
        <h1>Wähle Deinen Tarif</h1>
        {/* Nur noch das Gemeinsame, eine Zeile. Hier stand bis zum
            2026-09-22 zusaetzlich, WORIN sich die Tarife unterscheiden
            — drei Zeilen, die den Vergleich ankuendigten, der jetzt
            eine Bildschirmhoehe darunter tatsaechlich steht. Ein Screen,
            der den Unterschied zeigt, muss ihn nicht vorher erzaehlen. */}
        <p>Beide unbegrenzt, beide monatlich kündbar.</p>
        {held?.ok && heldDrop && (
          <p className="plan-code-flag">
            Magic Code {reservedCode} reserviert: {heldDrop.title}
          </p>
        )}
        <div className="tabs" ref={tabsRef}>
          <span className="pill" style={{ left: pill.left, width: pill.width }} />
          {PLANS.map((p, i) => (
            <button key={p.key} className={i === planIdx ? 'on' : ''} onClick={() => choosePlan(i)}>
              {/* Der Preis gehoert an den Reiter. Sonst muss man
                  zwischen den Karten wischen, um zwei Zahlen zu
                  vergleichen. */}
              <span className="t-name">{planTitle(p)}</span>
              <span className="t-price">{p.monthly} €</span>
            </button>
          ))}
        </div>
      </div>
      {/* ---- Der scrollende Teil ----
          Bis zum 2026-09-22 scrollte jede Tarifkarte fuer sich, und der
          ganze Screen lag im Karussell. Wer vergleichen wollte, musste
          wischen, sich die Zahl der einen Karte merken und auf der
          anderen nachsehen — bei zwei Tarifen, die sich in vier Punkten
          unterscheiden und in vier Punkten gleich sind.

          Jetzt wischt nur noch die Karte: sie ist der Gegenstand, den
          man waehlt. Der Vergleich darunter steht fest und zeigt beide
          Spalten gleichzeitig. */}
      <div className="plan-scroll">
        <div className="plan-track-wrap">
          <div
            className={`plan-track${dragging ? ' dragging' : ''}`}
            ref={trackRef}
            onPointerDown={onPointerDown}
          >
            {PLANS.map((p) => (
              <div className="plan-slide" key={p.key}>
                <SimCard plan={p} chipText={p.chip} />
                {/* Eine Zeile, nicht drei: sie beantwortet "ist der
                    fuer mich?" — die restliche Antwort steht in der
                    Tabelle darunter, und die muss ins Bild passen. */}
                <p className="plan-desc">{p.tagline}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Der Unterschied ----
            Vier Zeilen, beide Spalten sichtbar. Die gewaehlte Spalte
            ist hell, die andere gedaempft — so haengt die Tabelle am
            Reiter oben und am Knopf unten, statt danebenzustehen. */}
        <section className="plan-diff-sec">
          <h2>Der Unterschied</h2>
          <div className="plan-diff card">
            <div className="diff-heads" aria-hidden="true">
              {PLANS.map((p, i) => (
                <span key={p.key} className={i === planIdx ? 'on' : ''}>
                  {p.name}
                </span>
              ))}
            </div>
            {/* Eine Definitionsliste: Merkmal, dann die beiden Werte.
                <dl> statt <table>, weil es keine zwei Achsen gibt —
                VoiceOver liest damit "Tempo, bis 100 Mbit/s, bis 300
                Mbit/s" statt Zellkoordinaten. */}
            <dl>
              {PLAN_DIFF.map((row) => (
                <div className="diff-row" key={row.label}>
                  <dt>{row.label}</dt>
                  {PLANS.map((p, i) => (
                    <dd key={p.key} className={i === planIdx ? 'on' : ''}>
                      {/* Der Tarifname steht nur fuer VoiceOver dabei —
                          sichtbar traegt ihn die Spaltenueberschrift. */}
                      <span className="sr-only">{p.name}: </span>
                      {row.value(p)}
                    </dd>
                  ))}
                </div>
              ))}
            </dl>
          </div>
          {/* Was die Datenrate im Alltag heisst — die Zahl in der
              Tabelle allein sagt es nicht. Steht beim gewaehlten Tarif,
              weil es ein Satz ist und keine Vergleichszeile. */}
          <p className="plan-speed-note">
            <b>{PLANS[planIdx].downMbit} Mbit/s:</b> {PLANS[planIdx].speedNote}
          </p>
        </section>

        {/* ---- Das Gemeinsame ----
            Leise und einmal. Vorher stand es zweimal ausgeschrieben und
            fuellte die Haelfte beider Listen. */}
        <section className="plan-shared-sec">
          <h2>In beiden Tarifen</h2>
          <ul className="plan-shared">
            {PLAN_SHARED.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>

        <section className="plan-code-sec" aria-labelledby="plan-code-h">
          <h2 id="plan-code-h">Hast Du einen Magic Code?</h2>
          {reservedCode ? (
            <div className="card drop-row code-held">
              <div className="drop-top">
                <span className="drop-kind">{heldDrop?.kind ?? 'Code'}</span>
                <span className="drop-left">{held?.ok ? 'reserviert' : 'nicht einlösbar'}</span>
              </div>
              <b>{heldDrop?.title ?? reservedCode}</b>
              <span className="drop-detail" role="status">
                {held?.ok
                  ? `Code ${reservedCode} · wird eingelöst, sobald Deine eSIM läuft`
                  : held
                    ? failText(held)
                    : ''}
              </span>
              <button type="button" className="link-plain" onClick={() => onReserve(null)}>
                Code entfernen
              </button>
            </div>
          ) : (
            <div className="card magic-redeem">
              <div className="magic-entry">
                <input
                  className={`magic-input${codeMiss ? ' bad' : ''}`}
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={CODE_LEN}
                  placeholder="XXXX"
                  aria-label="Vierstelligen Magic Code eingeben"
                  aria-invalid={codeMiss !== null}
                  aria-describedby={codeMiss ? 'plan-code-err' : 'plan-code-note'}
                  value={codeIn}
                  onChange={(e) => {
                    setCodeIn(normalizeCode(e.target.value))
                    setCodeMiss(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && reserve()}
                />
                <Button disabled={codeIn.length !== CODE_LEN} onClick={reserve}>
                  Reservieren
                </Button>
              </div>
              {codeMiss ? (
                <p className="magic-error" id="plan-code-err" role="alert">{codeMiss}</p>
              ) : (
                <p className="magic-fine" id="plan-code-note">
                  Von einem Creator, einem Partner oder von Freunden. Dein Platz wartet, bis
                  Deine eSIM läuft.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
      </div>
      <div className="plan-cta">
        {/* Figma: Glas-Button, nicht rot gefuellt. Der Tarifname steht
            dabei — im Wisch-Karussell ist sonst nicht zweifelsfrei,
            welche Karte gerade gilt. */}
        <Button onClick={onChoose}>{PLANS[planIdx].name} auswählen</Button>
        {/* Preisangabenverordnung: bei Endkundenpreisen muss dabei
            stehen, dass die Umsatzsteuer enthalten ist. */}
        {/* &nbsp; vor dem Punkt: umbrochen wird nach dem Trenner, nie davor. */}
        <p className="cta-fine">Preis inkl. MwSt.&nbsp;· keine Mindestlaufzeit&nbsp;· keine Anschlussgebühr</p>
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
  onOpenMagic,
  onOpenUsage,
  passes,
  onOpenPass,
}: ScreenProps & {
  planIdx: number
  onOpenProfile: () => void
  onOpenSupport: () => void
  onOpenPlan: () => void
  onOpenMagic: () => void
  onOpenUsage: () => void
  passes: MagicPass[]
  onOpenPass: (id: string) => void
}) {
  const [fabsOpen, setFabsOpen] = useState(false)
  /* Das eingeklappte Menue ist nur durchsichtig, nicht weg — ohne
     `inert` laeuft der Tabulator durch zwei unsichtbare Knoepfe. */
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
    /* Fuenf Versaetze zu 50ms plus die 460ms des letzten Eintritts —
       danach steht alles (app.css › Ankunft auf Home). */
    const t = window.setTimeout(() => setArriving(false), 800)
    return () => window.clearTimeout(t)
  }, [active])

  /* Ein offenes Menue schliesst wie unter iOS: Tipp daneben oder
     Escape. Vorher blieb es stehen, bis man "Mehr" ein zweites Mal
     traf. */
  useEffect(() => {
    if (!fabsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFabsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [fabsOpen])
  /* Wer Home verlaesst und wiederkommt, findet das Menue geschlossen. */
  useEffect(() => {
    if (!active) setFabsOpen(false)
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
          {/* Der Name des Knopfs ist der des Sheets, das er oeffnet. */}
          <button className="avatar-btn" aria-label="Account öffnen" onClick={onOpenProfile}>
            <Monogram name={HOLDER.first} />
          </button>
        </div>
      </div>
      <div className="home-scroll">
        {/* Die Karte kommt zuerst und kommt anders als der Rest: sie ist
            dasselbe Objekt, das gerade ins Netz gegangen ist, und landet
            hier. Ein Glanzstreifen laeuft einmal darueber — quittiert die
            Ankunft, ohne einen zweiten Haken zu brauchen. */}
        <SimCard plan={plan} chipText="Aktiv" holder={HOLDER.full} onClick={onOpenPlan} />

        <MagicCodeCard run={active} onOpen={onOpenMagic} />

        {/* Direkt unter der Wolke: was sie verspricht, liegt darunter als
            das, was davon schon eingeloest ist. Ohne diese Zeile bliebe
            der Zugang im Sheet gefangen und der Ablauf endete dort, wo
            er anfing. */}
        {passes.map((p) => (
          <PassCard key={p.id} pass={p} onOpen={() => onOpenPass(p.id)} />
        ))}

        {/* Statt der Klappe "Dein Verbrauch" mit fuenf Karten (bis zum
            2026-09-25): beide Tarife sind unbegrenzt, also zaehlt nur, ob
            etwas begrenzt ist und was die naechste Rechnung kostet. Die
            Zahlen stehen im Sheet "Verbrauch & Rechnung" (usage-sheet.tsx). */}
        <StatusCard usage={usage} plan={plan} onOpen={onOpenUsage} />
      </div>

      {fabsOpen && <div className="fab-catch" aria-hidden="true" onClick={() => setFabsOpen(false)} />}
      <div id="more-menu" ref={fabsRef} className={`fab-stack${fabsOpen ? ' open' : ''}`}>
        <Button onClick={() => { setFabsOpen(false); onOpenSupport() }}>Support</Button>
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
