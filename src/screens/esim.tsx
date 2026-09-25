/* ============================================================
   NOURA — Die eSIM: Anmeldung und Einrichtung in einem Ablauf

   Bis zum 2026-09-17 waren das zwei Screens mit zwei Wartebildern
   hintereinander: erst baute der Anbieter die eSIM, dann verschwand
   sie, dann kam ein Textscreen, dann baute sie sich auf dem Geraet
   noch einmal auf. Zweimal Fortschritt, zweimal von vorn — und der
   Kunde konnte nicht sehen, dass es dieselbe Sache war.

   Jetzt ist es EIN Ablauf mit sieben Takten und einer Pause:

     entworfen · gelasert · versiegelt          — wir bauen sie
     [ Uebergabe: der Kunde tippt ]
     geladen · eingerichtet · gesucht · aktiv   — sein iPhone holt sie

   Die Karte bleibt dabei die ganze Zeit auf der Buehne, auch waehrend
   der Pause. Genau das war vorher das Problem: der Gegenstand, um den
   es geht, verschwand ausgerechnet in dem Moment, in dem der Kunde
   eine Entscheidung treffen sollte.

   Die Unterscheidung, die die Trennung urspruenglich begruendet hat,
   bleibt trotzdem sichtbar — sie ist jetzt die Luecke im Taktmesser:
   links arbeiten wir, rechts arbeitet sein Geraet, und dazwischen
   muss er etwas tun.
   ============================================================ */
import { useEffect, useRef, useState } from 'react'
import { Button, FlowSteps, Screen } from '../components/ui'
import type { Plan } from '../data/plans'
import { AuroraFlow } from '../components/onboarding-visuals'
import { BEAT_TONE, EsimStage } from '../components/esim-forge'
import { BeatCaption, BeatMeter } from '../components/beats'
import { hapticLand, hapticPress, hapticSuccess } from '../lib/haptics'
import {
  ESIM_INSTALL_ACTS,
  ESIM_MANUAL,
  ESIM_REQUIREMENTS,
  FIRST_STEPS,
  HOLDER,
  FORGE_ACTS,
  FORGE_FINALE,
} from '../data/account'

/* Jeder Takt bringt seine eigene Dauer mit (data/account.ts) — sie
   haengt daran, wie viel in ihm zu sehen ist. Hier wird daraus die
   Kette der Zeitpunkte gerechnet, statt eine feste Schrittweite zu
   multiplizieren. */
const MS_LIST = [...FORGE_ACTS, ...ESIM_INSTALL_ACTS].map((a) => a.ms)
const TOTAL_BEATS = MS_LIST.length

/** Startet eine Gruppe von Takten und meldet sich am Ende. Gibt die
    Zeitgeber zurueck, damit der Aufrufer sie wieder abraeumen kann. */
function runActs(acts: { ms: number }[], onStep: (i: number) => void, onEnd: () => void, tail: number) {
  let t = 0
  const ids = acts.map((a, i) => {
    t += a.ms
    return window.setTimeout(() => onStep(i + 1), t)
  })
  ids.push(window.setTimeout(onEnd, t + tail))
  return ids
}

type Phase = 'forge' | 'handover' | 'install' | 'done'

export function EsimJourney({
  active,
  plan,
  numberLabel,
  onDone,
}: {
  active: boolean
  /** Es entsteht die Karte des gewaehlten Tarifs, nicht irgendeine. */
  plan: Plan
  /** Die Rufnummer, um die es geht — bei Mitnahme steht hier der
      Hinweis auf den laufenden Wechsel statt einer Nummer. */
  numberLabel: string
  onDone: () => void
}) {
  const [phase, setPhase] = useState<Phase>('forge')
  const [idx, setIdx] = useState(0)
  const [manual, setManual] = useState(false)

  /* ---------- Der Block unter der Buehne ----------
     Folgt der Phase mit 200ms Abstand: so lange blendet der alte aus
     (.jr-leave), erst dann kommt der neue. Die Buehne haengt direkt an
     `phase` und setzt sich im selben Moment in Bewegung — Text raeumt
     das Feld, waehrend die Karte schon faehrt.

     Vorher tauschte React den Block im Bild des Phasenwechsels aus: der
     alte war sofort weg, der neue kam erst nach seiner Verzoegerung, und
     dazwischen stand die Karte ueber einem leeren Screen. */
  const [shown, setShown] = useState<Phase>('forge')
  useEffect(() => {
    if (shown === phase) return
    const t = window.setTimeout(() => setShown(phase), 200)
    return () => window.clearTimeout(t)
  }, [phase, shown])
  const leave = shown !== phase ? ' jr-leave' : ''

  /* ---------- Abgang ----------
     Beim Verlassen muss zurueckgesetzt werden, sonst steht der Ablauf
     beim zweiten Durchgang mitten im Fortschritt. Aber NICHT sofort:
     der Screen ist waehrend seiner Ueberblendung noch zu sehen, und
     ein Ruecksprung auf den ersten Takt mitten im Abgang ist genau der
     Ruck, den man sieht und nicht erklaeren kann — die fertige Karte
     wird wieder zum Entwurf, waehrend sie ausblendet.

     Aus demselben Grund laeuft die Buehne waehrend des Abgangs weiter
     (warm). Haengt sie direkt an `active`, frieren ihre Animationen
     im Moment des Wechsels ein und der Schnitt wird sichtbar.

     700ms decken die 650ms der Screen-Ueberblendung ab. */
  const [warm, setWarm] = useState(false)
  useEffect(() => {
    if (active) {
      setWarm(true)
      return
    }
    const t = window.setTimeout(() => {
      setWarm(false)
      setPhase('forge')
      setShown('forge')
      setIdx(0)
      setManual(false)
    }, 700)
    return () => window.clearTimeout(t)
  }, [active])

  const timers = useRef<number[]>([])

  /* Die Fertigung laeuft los, sobald der Screen zu sehen ist — hier
     wartet niemand auf eine Eingabe, das macht der Anbieter. Der
     Nachlauf von 400ms gehoert dem Takt "bereit": die Karte richtet
     sich auf, bevor die Frage kommt. */
  useEffect(() => {
    if (!active || phase !== 'forge') return
    setIdx(0)
    timers.current = runActs(FORGE_ACTS, setIdx, () => setPhase('handover'), FORGE_FINALE.ms)
    return () => timers.current.forEach(window.clearTimeout)
  }, [active, phase])

  useEffect(() => {
    if (phase !== 'install') return
    setIdx(0)
    /* Beim letzten Takt stehenbleiben: in dieser Sekunde stehen die
       vollen Balken und "Aktiv", bevor der Screen umbaut. */
    timers.current = runActs(ESIM_INSTALL_ACTS, setIdx, () => setPhase('done'), 1000)
    return () => timers.current.forEach(window.clearTimeout)
  }, [phase])

  /* Welcher Takt gerade laeuft und wo er im Ganzen steht. Beides folgt
     aus Phase und Index — es gibt keinen zweiten Zaehler, der davon
     abweichen koennte. */
  const act =
    phase === 'forge'
      ? (FORGE_ACTS[idx] ?? FORGE_FINALE)
      : phase === 'install'
        ? ESIM_INSTALL_ACTS[Math.min(idx, ESIM_INSTALL_ACTS.length - 1)]
        : phase === 'done'
          ? ESIM_INSTALL_ACTS[ESIM_INSTALL_ACTS.length - 1]
          : FORGE_FINALE
  const step =
    phase === 'forge'
      ? Math.min(idx, FORGE_ACTS.length)
      : phase === 'handover'
        ? FORGE_ACTS.length
        : phase === 'install'
          ? FORGE_ACTS.length + idx
          : TOTAL_BEATS

  /* ---------- Die Signatur ----------
     Acht Takte, acht Schlaege. Der Kunde sieht nicht nur zu, wie seine
     eSIM entsteht — er spuert es. Sieben leichte Schlaege bauen auf
     einen schwereren hin: "im Netz" ist der letzte, und er ist der
     einzige, der anders landet.

         entworfen · gelasert · versiegelt · bereit
         geladen · eingerichtet · gesucht · IM NETZ
            ·          ·           ·         ●

     Der Schlag haengt am Taktwechsel, nicht am Rendern: derselbe Takt
     zweimal gerendert loest nichts aus (Regel 2). Gezaehlt wird dabei
     nach Phase UND Index, nicht nach `step` — `step` steht am Ende der
     Fertigung, waehrend der Uebergabe und zu Beginn der Einrichtung
     auf demselben Wert, und der erste Schlag des iPhones fiele
     stillschweigend aus.

     Der letzte Index der Einrichtung wird doppelt gestellt: der
     Nachlauf haelt das Bild eine Sekunde, damit das Netz zeigen kann,
     was es erreicht hat. Dieser Nachschlag traegt keinen eigenen
     Takt — sonst landete "im Netz" zweimal. */
  const beaten = useRef('')
  useEffect(() => {
    if (!active) return
    if (phase !== 'forge' && phase !== 'install') return
    const last = ESIM_INSTALL_ACTS.length - 1
    if (phase === 'install' && idx > last) return
    const key = `${phase}:${idx}`
    if (key === beaten.current) return
    beaten.current = key
    /* Der schwere Schlag faellt auf den vierten Empfangsbalken, nicht auf
       den Taktwechsel: 0,1s Anlauf + 3 x 0,08s Versatz + rund 0,22s, bis
       der Balken seine Spur gefuellt hat (esim-forge.css, fgBar). Auf dem
       Wechsel lag er vor dem Bild — man spuerte die Anmeldung, bevor man
       sie sah.
       Bewusst ohne Aufraeumen: StrictMode loescht im Entwicklungsbau den
       Zeitgeber des ersten Laufs, und die Sperre oben verhindert den
       zweiten — der Schlag fiele dort still aus. */
    if (phase === 'install' && idx === last) window.setTimeout(hapticLand, 560)
    else hapticPress()
  }, [active, phase, idx])

  /* Am Ende des Ablaufs steht die Karte im Netz. Das ist eine Sekunde
     nach dem letzten Takt (der Nachlauf von runActs) und damit ein
     eigener Moment, keine Doppelung. */
  useEffect(() => {
    if (phase === 'done') hapticSuccess()
  }, [phase])

  const meter = (paused = false) => (
    <BeatMeter
      step={step}
      msList={MS_LIST}
      run={warm}
      paused={paused}
      groupAfter={FORGE_ACTS.length}
      label={`Schritt ${Math.min(step + 1, TOTAL_BEATS)} von ${TOTAL_BEATS} der eSIM-Einrichtung`}
    />
  )

  return (
    <Screen active={active}>
      <AuroraFlow tone={BEAT_TONE[act.beat]} />

      {/* ---------- Die Buehne ----------
          EIN Element ueber alle vier Phasen. Vorher stand sie in jedem
          Phasenblock einzeln — und weil React beim Phasenwechsel den
          ganzen Block austauscht, wurde sie jedes Mal neu gebaut: rund
          sechzig SVG-Knoten und zwanzig Animationen auf einen Schlag,
          und die Karte sprang von ihrer alten Groesse in die neue,
          weil eine Uebergangsangabe auf einem frischen Element nicht
          laeuft. Genau das hat an den Uebergaengen gehakt.

          Jetzt bleibt sie stehen und faehrt ihre Lage an. Die Phase
          steht als data-Attribut am Rahmen, die Groesse und der Platz
          kommen aus dem CSS — der Inhalt darum wechselt, der
          Gegenstand nicht. */}
      <div className="jr" data-phase={phase}>
        <div className="jr-stage">
          <EsimStage beat={act.beat} run={warm} plan={plan} holder={HOLDER.full} />
        </div>

        {shown === 'forge' || shown === 'install' ? (
        <div className={`jr-run${leave}`}>
          <BeatCaption title={act.title} text={act.text} />
          {meter()}
        </div>
      ) : shown === 'handover' ? (
        /* Die Uebergabe. Die Karte bleibt stehen und dreht sich zum
           Kunden — sie ist das Argument, nicht die Ueberschrift. Der
           Rueckweg fuer den Fall, dass es klemmt, gehoert auf denselben
           Screen und nicht in ein Hilfe-Center: wer hier haengt, hat
           gerade kein Netz, um danach zu suchen. */
        <div className={`flow esim-hand${leave}`}>
          <div className="flow-head">
            <FlowSteps current={3} />
            {/* Haelt den Platz frei, ueber dem die Buehne schwebt. */}
            <div className="jr-gap" aria-hidden="true" />
            <h1>{FORGE_FINALE.title}</h1>
            <p className="flow-lead">
              Deine eSIM ist gebaut. Den Rest macht Dein iPhone — rund zwei Minuten.
            </p>
          </div>

          <div className="flow-scroll">
            <div className="card esim-card">
              <ul className="roam-rules esim-req">
                {ESIM_REQUIREMENTS.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>

            <section className="flow-sec">
              <button
                className="esim-toggle"
                aria-expanded={manual}
                onClick={() => setManual((v) => !v)}
              >
                Klappt es nicht? Manuell einrichten
              </button>
              {manual && (
                <div className="card esim-manual">
                  <p className="roam-lead">
                    Einstellungen → Mobilfunk → eSIM hinzufügen → Details manuell eingeben.
                  </p>
                  <div className="esim-kv">
                    <span>SM-DP+ Adresse</span>
                    <b>{ESIM_MANUAL.smdp}</b>
                  </div>
                  <div className="esim-kv">
                    <span>Aktivierungscode</span>
                    <b>{ESIM_MANUAL.code}</b>
                  </div>
                  <p className="magic-fine">
                    Denselben Code schicken wir Dir zusätzlich per E-Mail — falls Du das
                    iPhone gerade wechselst.
                  </p>
                </div>
              )}
            </section>
            <div style={{ height: 24 }} />
          </div>

          <div className="flow-cta">
            {meter(true)}
            <Button onClick={() => setPhase('install')}>
              eSIM installieren
            </Button>
          </div>
        </div>
      ) : (
        /* Der Schluss. Statt eines abstrakten Hakens steht hier die
           Karte, die gerade ins Netz gegangen ist — kleiner, mit den
           eingerasteten Ringen. Sie ist dieselbe, die gleich auf dem
           Dashboard liegt. */
        <div className={`flow esim-done${leave}`}>
          <div className="flow-head">
            <div className="jr-gap" aria-hidden="true" />
            <h1>Du bist im Netz.</h1>
            <p className="flow-lead">{numberLabel}</p>
          </div>

          <div className="flow-scroll">
            <section className="flow-sec">
              <h2>Drei Dinge noch</h2>
              <ol className="magic-steps">
                {FIRST_STEPS.map((s, i) => (
                  <li key={s.title}>
                    <span className="n" aria-hidden="true">{i + 1}</span>
                    <div>
                      <b>{s.title}</b>
                      <p>{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <div style={{ height: 24 }} />
          </div>

          <div className="flow-cta">
            <Button onClick={onDone}>Los geht's</Button>
          </div>
        </div>
      )}
      </div>
    </Screen>
  )
}
