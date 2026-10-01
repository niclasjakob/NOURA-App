import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { BackgroundGradient, LiveRegion, StatusBar } from './components/ui'
import { PasskeyPrompt } from './components/passkey'
import { Home, Intro, Onboarding, SelectPlan } from './screens/screens'
import { Checkout, Ident, type NumberMode } from './screens/checkout'
import { EsimJourney } from './screens/esim'
import { MagicSheet, PlanSheet, ProfileSheet, SupportSheet, type SheetId } from './sheets/sheets'
import { ConfirmSheet, type ConfirmReq, type Confirmed } from './sheets/confirm-sheet'
import { UsageSheet } from './sheets/usage-sheet'
import { PLANS } from './data/plans'
import {
  CYCLE,
  HOLDER,
  demoNow,
  fmtDate,
  fmtEuro,
  payLabel,
  type Payment,
  type Receipt,
} from './data/account'
import { CODE_LEN, failText, normalizeCode, redeem, type MagicPass, type RedeemResult } from './data/magic'
import { useAnchoredScroll, useInert } from './hooks/a11y'

type ScreenId =
  | 'intro'
  | 'onboarding'
  | 'selectPlan'
  | 'checkout'
  | 'ident'
  | 'esim'
  | 'home'

/* Die Reihenfolge des Ablaufs, und nur dafuer da: aus ihr faellt die
   Richtung, in die ein Screenwechsel laeuft. Vorher blendete jeder
   Wechsel gleich ueber — vorwaerts wie rueckwaerts, Kauf wie Abbruch.
   Der Ladebildschirm des Logins (`activation`) ist am 2026-09-25
   entfallen: angemeldet wird per Passkey, danach geht es direkt nach
   Home. */
const FLOW_ORDER: ScreenId[] = [
  'intro', 'onboarding', 'selectPlan', 'checkout', 'ident', 'esim', 'home',
]

/* Ein Magic Code aus dem Link, mit dem jemand die App geoeffnet hat
   (?code=T4JQ) — so kommt der Code eines Creators aus dem Stream bis in
   die Tarifwahl. Im Echtbetrieb ein Universal Link. */
const codeFromLink = (): string | null => {
  try {
    const c = normalizeCode(new URLSearchParams(window.location.search).get('code') ?? '')
    return c.length === CODE_LEN ? c : null
  } catch {
    return null
  }
}

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('intro')
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [planIdx, setPlanIdx] = useState(0)
  const [sheet, setSheet] = useState<SheetId>(null)
  const [toast, setToast] = useState<string | null>(null)
  /* Die Entscheidung faellt im Checkout, gebraucht wird sie erst bei
     der eSIM-Einrichtung — also liegt sie hier und nicht dort. */
  const [numberMode, setNumberMode] = useState<NumberMode>('new')
  /* Eingeloeste Magic Codes. Sie liegen hier und nicht im Sheet, weil
     Home sie ebenfalls zeigt und das Sheet zwischendurch schliesst —
     im Sheet gehalten waere der Zugang beim Zuklappen weg. */
  const [passes, setPasses] = useState<MagicPass[]>([])
  /* Welcher Zugang beim Oeffnen zu sehen ist. null = Eingabe. */
  const [focusPass, setFocusPass] = useState<string | null>(null)
  /* Ein Code aus einem Link, den das Sheet schon ins Feld schreibt. */
  const [magicPrefill, setMagicPrefill] = useState<string | null>(null)

  /* Ein Code, der vor dem Kauf eingegeben wurde — auf der Tarifwahl
     oder per Link. Er wird erst eingeloest, wenn die eSIM im Netz ist;
     `unlocked` haelt fest, was daraus wurde, fuer den Abschluss-Screen. */
  const [reservedCode, setReservedCode] = useState<string | null>(codeFromLink)
  const [unlocked, setUnlocked] = useState<{ pass: MagicPass } | { miss: string } | null>(null)

  /* Die Zahlart aus dem Checkout. Voreinstellung fuer die Vorfuehr-
     Abkuerzung, die den Checkout ueberspringt: dieselbe, die er
     vorwaehlt. */
  const [payment, setPayment] = useState<Payment>({ method: 'applepay' })

  /* Aenderungen am laufenden Vertrag — seit dem 2026-09-25 ueber das
     Bestaetigungs-Sheet statt ueber den Neukunden-Ablauf bzw. einen
     Toast. Was bestaetigt ist, bleibt als Beleg unter Dokumente. */
  const [pendingIdx, setPendingIdx] = useState<number | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [confirm, setConfirm] = useState<ConfirmReq | null>(null)
  const [confirmFrom, setConfirmFrom] = useState<SheetId>(null)
  const receiptId = useRef(0)
  const addReceipt = (title: string, detail: string) =>
    setReceipts((list) => [...list, { id: `r${++receiptId.current}`, title, detail, at: demoNow() }])

  const [passkey, setPasskey] = useState(false)

  /* Die Vorschau aus index.html hat ihren Zweck erfuellt, sobald dieser
     Screen gezeichnet ist — ab da zeigte sie dasselbe Bild ein zweites
     Mal. useEffect und nicht useLayoutEffect: der Effekt laeuft nach dem
     Frame, der den Intro-Screen bringt, es gibt also keinen Moment, in
     dem weder Vorschau noch Screen zu sehen waeren. */
  useEffect(() => {
    document.getElementById('boot')?.remove()
  }, [])

  const screensRef = useRef<HTMLDivElement>(null)
  /* Solange ein Sheet (oder das Passkey-Sheet) offen ist, darf nichts
     dahinter fokussierbar oder fuer VoiceOver erreichbar sein. */
  useInert(screensRef, sheet !== null || passkey)

  /* Der Rahmen bleibt oben verankert — sonst schiebt ihn ein Fokus auf ein
     hereinfahrendes Sheet dauerhaft aus dem Bild. */
  const phoneRef = useRef<HTMLDivElement>(null)
  useAnchoredScroll(phoneRef)

  /* Die Pruefung liegt in data/magic.ts, das Anlegen hier: der Zugang
     ist Zustand der App, nicht des Sheets. Das Sheet bekommt das
     Ergebnis zurueck und entscheidet, was es zeigt. */
  const redeemMagic = (entered: string): RedeemResult => {
    const res = redeem(entered, passes, PLANS[planIdx].key)
    if (res.ok) setPasses((list) => [...list, res.pass])
    return res
  }

  /* Die eSIM ist im Netz: jetzt zahlt sich der reservierte Code aus.
     Scheitert er inzwischen (abgelaufen, vergriffen, falscher Tarif),
     sagt der Abschluss-Screen warum — statt still nichts zu zeigen. */
  const activateReserved = () => {
    if (!reservedCode) {
      setUnlocked(null)
      return
    }
    const res = redeem(reservedCode, passes, PLANS[planIdx].key)
    if (res.ok) {
      setPasses((list) => [...list, res.pass])
      setUnlocked({ pass: res.pass })
    } else {
      setUnlocked({ miss: failText(res) })
    }
    setReservedCode(null)
  }
  const held = reservedCode ? redeem(reservedCode, passes, PLANS[planIdx].key) : null

  /* ---- Bestaetigen ----
     Ein Sheet zur Zeit: das Bestaetigungs-Sheet ersetzt das Tarif-Sheet
     und kehrt mit "Abbrechen" oder "Fertig" dorthin zurueck. */
  const openConfirm = (req: ConfirmReq, from: SheetId) => {
    setConfirm(req)
    setConfirmFrom(from)
    setSheet('confirm')
  }

  const onConfirmed = (c: Confirmed) => {
    const plan = PLANS[planIdx]
    if (c.kind === 'switch') {
      const to = PLANS[c.to]
      if (c.when === 'now') {
        setPlanIdx(c.to)
        addReceipt(`Tarifwechsel zu ${to.name}`, `Sofort · heute ${fmtEuro(c.charged)} anteilig · ${payLabel(payment)}`)
      } else {
        setPendingIdx(c.to)
        addReceipt(`Tarifwechsel zu ${to.name} vorgemerkt`, `Ab ${fmtDate(CYCLE.invoiceDate)}, ${fmtEuro(to.monthly)} im Monat`)
      }
    } else {
      setCancelled(true)
      setPendingIdx(null)
      addReceipt(`Kündigung NOURA ${plan.name}`, `Zum ${fmtDate(CYCLE.end)} · Bestätigung an ${HOLDER.email}`)
    }
  }

  const openMagic = (passId: string | null = null, prefill: string | null = null) => {
    setFocusPass(passId)
    setMagicPrefill(prefill)
    setSheet('magic')
  }

  /* Wer schon Kunde ist und ueber einen Code-Link kommt, braucht keine
     Reservierung bis zur Aktivierung: nach der Ankunft auf Home steht der
     Code im Magic-Sheet bereit. Die Wartezeit laesst Home seinen
     Auftritt (1,2 s), statt ihm ein Sheet ueberzuziehen. */
  const arriveWithCode = () => {
    if (!reservedCode) return
    const c = reservedCode
    setReservedCode(null)
    window.setTimeout(() => openMagic(null, c), 1200)
  }

  /* Jeder Screenwechsel laeuft hierueber, damit keiner die Richtung
     vergisst. Ein Ziel weiter hinten im Ablauf kommt von rechts, eines
     weiter vorn von links — das Abmelden aus Home zurueck aufs Intro
     ist damit ebenfalls ein Rueckweg, und genau so soll es sich
     anfuehlen. */
  const go = (next: ScreenId) => {
    setDir(FLOW_ORDER.indexOf(next) < FLOW_ORDER.indexOf(screen) ? 'back' : 'fwd')
    setScreen(next)
  }

  /* Ein neuer Toast startet die Uhr neu. Vorher lief der Zeitgeber des
     vorigen weiter und nahm den neuen nach Restzeit mit weg — zwei
     Meldungen kurz hintereinander, und die zweite stand nur einen
     Augenblick. */
  const toastTimer = useRef<number>()
  const showToast = (text: string) => {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }

  /* Vorfuehr-Abkuerzung: ueberspringt Onboarding, Tarifwahl, Bestellung,
     Ident, Aktivierung und eSIM-Einrichtung. Die Voreinstellungen — erster
     Tarif, neue Nummer — bleiben stehen, Home zeigt damit
     denselben Zustand wie nach einem regulaeren Durchlauf ohne Umwege. */
  const skipToHome = () => {
    setSheet(null)
    go('home')
    arriveWithCode()
  }

  /* Anmelden: das Passkey-Sheet, danach direkt Home. Home bringt seinen
     eigenen Ankunftsauftritt mit — ein Ladebildschirm davor war ein
     zweites Warten ohne Anlass (bis zum 2026-09-25: 4,6 s). */
  const signedIn = () => {
    setPasskey(false)
    go('home')
    arriveWithCode()
  }

  return (
    <div className="stage">
      <div ref={phoneRef} className="phone">
        <BackgroundGradient />
        {/* On the native build iOS draws the real status bar, so skip the mock one */}
        {!Capacitor.isNativePlatform() && <StatusBar />}

        <div ref={screensRef} className={`screens${sheet ? ' behind-sheet' : ''}`} data-dir={dir}>
          <Intro
            active={screen === 'intro'}
            onStart={() => go('onboarding')}
            onLogin={() => setPasskey(true)}
            onSkipToHome={skipToHome}
          />
          <Onboarding
            active={screen === 'onboarding'}
            onBack={() => go('intro')}
            onDone={() => go('selectPlan')}
            onSkipToHome={skipToHome}
          />
          <SelectPlan
            active={screen === 'selectPlan'}
            planIdx={planIdx}
            onPlanChange={setPlanIdx}
            onBack={() => go('onboarding')}
            onChoose={() => go('checkout')}
            reservedCode={reservedCode}
            onReserve={setReservedCode}
          />
          {/* Bestellung und Identitaetspruefung — die beiden Schritte,
              die zwischen Tarifwahl und Aktivierung wirklich liegen. */}
          <Checkout
            active={screen === 'checkout'}
            plan={PLANS[planIdx]}
            numberMode={numberMode}
            onNumberMode={setNumberMode}
            onBack={() => go('selectPlan')}
            reserved={held?.ok && reservedCode ? { code: reservedCode, title: held.pass.drop.title } : null}
            onSubmit={(p) => {
              setPayment(p)
              setUnlocked(null)
              go('ident')
            }}
          />
          <Ident
            active={screen === 'ident'}
            onBack={() => go('checkout')}
            onDone={() => go('esim')}
          />
          {/* Anmeldung und Einrichtung in einem Ablauf: die Karte
              entsteht, wird uebergeben und geht ins Netz. */}
          <EsimJourney
            active={screen === 'esim'}
            plan={PLANS[planIdx]}
            numberLabel={
              numberMode === 'port'
                ? `Bis Deine alte Nummer umgezogen ist, erreichen wir Dich unter ${HOLDER.phone}.`
                : `Deine neue Nummer: ${HOLDER.phone}`
            }
            porting={numberMode === 'port'}
            unlocked={unlocked}
            onLive={activateReserved}
            onDone={() => go('home')}
          />
          <Home
            active={screen === 'home'}
            planIdx={planIdx}
            onOpenProfile={() => setSheet('profile')}
            onOpenSupport={() => setSheet('support')}
            onOpenPlan={() => setSheet('plan')}
            onOpenMagic={() => openMagic()}
            onOpenUsage={() => setSheet('usage')}
            passes={passes}
            onOpenPass={(id) => openMagic(id)}
          />
        </div>

        <div className={`sheet-backdrop${sheet ? ' on' : ''}`} onClick={() => setSheet(null)} />
        {/* Der Chat kennt den Tarif, damit er mit echten Zahlen
            antwortet — und springt in das Sheet, das eine Antwort
            weiterfuehrt. Ein Sheet zur Zeit: der Sprung schliesst ihn. */}
        <SupportSheet
          open={sheet === 'support'}
          onClose={() => setSheet(null)}
          plan={PLANS[planIdx]}
          onJump={(to) => (to === 'magic' ? openMagic() : setSheet(to))}
        />
        <ProfileSheet
          open={sheet === 'profile'}
          onClose={() => setSheet(null)}
          onOpenSupport={() => setSheet('support')}
          onOpenPlan={() => setSheet('plan')}
          planIdx={planIdx}
          payment={payment}
          receipts={receipts}
          onLogout={() => {
            setSheet(null)
            go('intro')
          }}
        />
        {/* Hinter der Statuskarte auf Home (seit 2026-09-25): Verlauf,
            Anrufe, SMS, Rechnung und Tempo — was Home nicht mehr zeigt. */}
        <UsageSheet open={sheet === 'usage'} onClose={() => setSheet(null)} plan={PLANS[planIdx]} />
        {/* Ein Code oeffnet keine Datenpakete mehr, sondern Tueren
            (geaendert am 2026-09-04): Roaming und Zusatzvolumen sind aus
            der Community-Seite raus, eingeloest wird ein Platz.

            Seit dem 2026-09-04 loest er ihn auch wirklich ein. Vorher
            quittierte jede Zeichenfolge mit demselben Toast — vier
            Zeichen rein, eine freundliche Luege raus. Jetzt laeuft der
            Code gegen die Drops und endet in einem Zugang, den Home
            danach zeigt. */}
        <MagicSheet
          open={sheet === 'magic'}
          onClose={() => setSheet(null)}
          onNotice={showToast}
          onRedeem={redeemMagic}
          passes={passes}
          focusPassId={focusPass}
          prefill={magicPrefill}
          plan={PLANS[planIdx]}
        />
        {/* Wechseln und Kuendigen laufen seit dem 2026-09-25 ueber das
            Bestaetigungs-Sheet. Vorher schickte "Plan wechseln" einen
            bestehenden Kunden zurueck in den Neukunden-Ablauf —
            Bestellung, Ausweis, neue eSIM, und zurueck nach Home kam er
            von dort nur ueber eine neue Anmeldung. */}
        <PlanSheet
          open={sheet === 'plan'}
          onClose={() => setSheet(null)}
          planIdx={planIdx}
          pendingIdx={pendingIdx}
          cancelled={cancelled}
          onSwitchPlan={() =>
            openConfirm({ kind: 'switch', to: PLANS.findIndex((_, i) => i !== planIdx) }, 'plan')
          }
          onCancelPlan={() => openConfirm({ kind: 'cancel' }, 'plan')}
          onUndoSwitch={() => {
            if (pendingIdx !== null) addReceipt(`Tarifwechsel zu ${PLANS[pendingIdx].name} zurückgenommen`, `Es bleibt bei ${PLANS[planIdx].name}`)
            setPendingIdx(null)
          }}
          onUndoCancel={() => {
            setCancelled(false)
            addReceipt('Kündigung zurückgenommen', `NOURA ${PLANS[planIdx].name} läuft weiter`)
          }}
        />
        <ConfirmSheet
          open={sheet === 'confirm'}
          req={confirm}
          planIdx={planIdx}
          payment={payment}
          onConfirm={onConfirmed}
          onBack={() => setSheet(confirmFrom)}
          onClose={() => setSheet(null)}
        />

        <div className={`toast${toast ? ' on' : ''}`} aria-hidden="true">
          {toast}
        </div>
        {/* Der Toast verschwindet nach zwei Sekunden — ohne live-Region
            bekommt ihn niemand mit, der den Screen nicht ansieht. */}
        <LiveRegion message={toast} />

        <PasskeyPrompt open={passkey} onCancel={() => setPasskey(false)} onDone={signedIn} />
      </div>
    </div>
  )
}
