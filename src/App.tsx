import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { BackgroundGradient, LiveRegion, StatusBar } from './components/ui'
import { Activation, Home, Intro, Onboarding, SelectPlan } from './screens/screens'
import { Checkout, Ident, type NumberMode } from './screens/checkout'
import { EsimJourney } from './screens/esim'
import { MagicSheet, PlanSheet, ProfileSheet, RoamingSheet, SupportSheet, type SheetId } from './sheets/sheets'
import { PLANS } from './data/plans'
import { HOLDER, fmtGb, roamingState, type RoamZone } from './data/account'
import { redeem, type MagicPass, type RedeemResult } from './data/magic'
import { useAnchoredScroll, useInert } from './hooks/a11y'

type ScreenId =
  | 'intro'
  | 'onboarding'
  | 'selectPlan'
  | 'checkout'
  | 'ident'
  | 'activation'
  | 'esim'
  | 'home'

/* Die Reihenfolge des Ablaufs, und nur dafuer da: aus ihr faellt die
   Richtung, in die ein Screenwechsel laeuft. Vorher blendete jeder
   Wechsel gleich ueber — vorwaerts wie rueckwaerts, Kauf wie Abbruch.
   `activation` liegt hier zwischen Ident und eSIM, obwohl sie nur im
   Login-Pfad vorkommt: von Intro aus geht es vorwaerts hinein und
   vorwaerts nach Home wieder heraus, und mehr muss die Liste
   leisten. */
const FLOW_ORDER: ScreenId[] = [
  'intro', 'onboarding', 'selectPlan', 'checkout', 'ident', 'activation', 'esim', 'home',
]

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('intro')
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [planIdx, setPlanIdx] = useState(0)
  const [sheet, setSheet] = useState<SheetId>(null)
  const [actMessages, setActMessages] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [roamZone, setRoamZone] = useState<RoamZone>('world')
  const [roamExtraGb, setRoamExtraGb] = useState(0)
  /* Die Entscheidung faellt im Checkout, gebraucht wird sie erst bei
     der eSIM-Einrichtung — also liegt sie hier und nicht dort. */
  const [numberMode, setNumberMode] = useState<NumberMode>('new')
  /* Eingeloeste Magic Codes. Sie liegen hier und nicht im Sheet, weil
     Home sie ebenfalls zeigt und das Sheet zwischendurch schliesst —
     im Sheet gehalten waere der Zugang beim Zuklappen weg. */
  const [passes, setPasses] = useState<MagicPass[]>([])
  /* Welcher Zugang beim Oeffnen zu sehen ist. null = Eingabe. */
  const [focusPass, setFocusPass] = useState<string | null>(null)

  /* Die Vorschau aus index.html hat ihren Zweck erfuellt, sobald dieser
     Screen gezeichnet ist — ab da zeigte sie dasselbe Bild ein zweites
     Mal. useEffect und nicht useLayoutEffect: der Effekt laeuft nach dem
     Frame, der den Intro-Screen bringt, es gibt also keinen Moment, in
     dem weder Vorschau noch Screen zu sehen waeren. */
  useEffect(() => {
    document.getElementById('boot')?.remove()
  }, [])

  const screensRef = useRef<HTMLDivElement>(null)
  /* Solange ein Sheet offen ist, darf nichts dahinter fokussierbar
     oder fuer VoiceOver erreichbar sein. */
  useInert(screensRef, sheet !== null)

  /* Der Rahmen bleibt oben verankert — sonst schiebt ihn ein Fokus auf ein
     hereinfahrendes Sheet dauerhaft aus dem Bild. */
  const phoneRef = useRef<HTMLDivElement>(null)
  useAnchoredScroll(phoneRef)

  /* Der Reisezustand haengt am gewaehlten Tarif: CONNECT traegt kein
     Weltkontingent, und die EU-Fair-Use-Grenze folgt dem Preis. Zugebuchte Pakete erhoehen das Kontingent, nicht den
     Verbrauch. */
  const roaming = roamingState(roamZone, PLANS[planIdx], roamExtraGb)

  /* Die Pruefung liegt in data/magic.ts, das Anlegen hier: der Zugang
     ist Zustand der App, nicht des Sheets. Das Sheet bekommt das
     Ergebnis zurueck und entscheidet, was es zeigt. */
  const redeemMagic = (entered: string): RedeemResult => {
    const res = redeem(entered, passes)
    if (res.ok) setPasses((list) => [...list, res.pass])
    return res
  }

  const openMagic = (passId: string | null = null) => {
    setFocusPass(passId)
    setSheet('magic')
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

  const showToast = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(null), 2600)
  }

  /* Vorfuehr-Abkuerzung: ueberspringt Onboarding, Tarifwahl, Bestellung,
     Ident, Aktivierung und eSIM-Einrichtung. Die Voreinstellungen — erster
     Tarif, neue Nummer, kein Zusatzpaket — bleiben stehen, Home zeigt damit
     denselben Zustand wie nach einem regulaeren Durchlauf ohne Umwege. */
  const skipToHome = () => {
    setSheet(null)
    go('home')
  }

  /* Nur noch der Login laeuft ueber die Aktivierungsanimation. Texte
     nach Figma (Komponente "Animation v2", 1330:2404).

     Der Neukunde geht seit dem 2026-09-17 direkt von der Identitaets-
     pruefung in den eSIM-Ablauf: dort entsteht seine Karte UND wird
     eingerichtet. Vorher waren das zwei Wartebilder hintereinander,
     mit einem Textscreen dazwischen — dreimal derselbe Vorgang in
     drei Darstellungen. */
  const startLogin = () => {
    setActMessages(['Account wird geladen...', `Willkommen zurück, ${HOLDER.first}! 👋🏼`])
    go('activation')
  }

  return (
    <div className="stage">
      <div ref={phoneRef} className="phone">
        <BackgroundGradient />
        {/* On the native build iOS draws the real status bar, so skip the mock one */}
        {!Capacitor.isNativePlatform() && <StatusBar />}

        <div ref={screensRef} className="screens" data-dir={dir}>
          <Intro
            active={screen === 'intro'}
            onStart={() => go('onboarding')}
            onLogin={startLogin}
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
          />
          {/* Bestellung und Identitaetspruefung — die beiden Schritte,
              die zwischen Tarifwahl und Aktivierung wirklich liegen. */}
          <Checkout
            active={screen === 'checkout'}
            plan={PLANS[planIdx]}
            numberMode={numberMode}
            onNumberMode={setNumberMode}
            onBack={() => go('selectPlan')}
            onSubmit={() => go('ident')}
          />
          <Ident
            active={screen === 'ident'}
            onBack={() => go('checkout')}
            onDone={() => go('esim')}
          />
          <Activation
            active={screen === 'activation'}
            messages={actMessages}
            onDone={() => go('home')}
          />
          {/* Anmeldung und Einrichtung in einem Ablauf: die Karte
              entsteht, wird uebergeben und geht ins Netz. */}
          <EsimJourney
            active={screen === 'esim'}
            plan={PLANS[planIdx]}
            numberLabel={
              numberMode === 'port'
                ? 'Bis Deine alte Nummer umgezogen ist, erreichen wir Dich unter +49 170 5550123.'
                : 'Deine neue Nummer: +49 170 5550123'
            }
            onDone={() => go('home')}
          />
          <Home
            active={screen === 'home'}
            planIdx={planIdx}
            onOpenProfile={() => setSheet('profile')}
            onOpenSupport={() => setSheet('support')}
            onOpenPlan={() => setSheet('plan')}
            onOpenRoaming={() => setSheet('roaming')}
            onOpenMagic={() => openMagic()}
            passes={passes}
            onOpenPass={(id) => openMagic(id)}
          />
        </div>

        <div className={`sheet-backdrop${sheet ? ' on' : ''}`} onClick={() => setSheet(null)} />
        <SupportSheet open={sheet === 'support'} onClose={() => setSheet(null)} />
        <ProfileSheet
          open={sheet === 'profile'}
          onClose={() => setSheet(null)}
          roamZone={roamZone}
          onRoamZone={setRoamZone}
          onLogout={() => {
            setSheet(null)
            go('intro')
          }}
        />
        <RoamingSheet
          open={sheet === 'roaming'}
          onClose={() => setSheet(null)}
          roaming={roaming}
          onBuyAddon={(gb) => {
            setRoamExtraGb((v) => v + gb)
            showToast(`${fmtGb(gb, 0)} zugebucht — sofort verfügbar.`)
          }}
        />
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
        />
        <PlanSheet
          open={sheet === 'plan'}
          onClose={() => setSheet(null)}
          planIdx={planIdx}
          onSwitchPlan={() => {
            setSheet(null)
            go('selectPlan')
          }}
          onCancelPlan={() => showToast('Schade! Dein Plan bleibt bis zum Monatsende aktiv.')}
        />

        <div className={`toast${toast ? ' on' : ''}`} aria-hidden="true">
          {toast}
        </div>
        {/* Der Toast verschwindet nach zwei Sekunden — ohne live-Region
            bekommt ihn niemand mit, der den Screen nicht ansieht. */}
        <LiveRegion message={toast} />
      </div>
    </div>
  )
}
