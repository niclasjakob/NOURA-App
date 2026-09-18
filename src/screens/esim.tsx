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
    /* Beim letzten Takt stehenbleiben: in diesen 700ms soll das Netz
       sichtbar halten, was es gerade erreicht hat. */
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

        {phase === 'forge' || phase === 'install' ? (
        <div className="jr-run">
          <BeatCaption title={act.title} text={act.text} />
          {meter()}
        </div>
      ) : phase === 'handover' ? (
        /* Die Uebergabe. Die Karte bleibt stehen und dreht sich zum
           Kunden — sie ist das Argument, nicht die Ueberschrift. Der
           Rueckweg fuer den Fall, dass es klemmt, gehoert auf denselben
           Screen und nicht in ein Hilfe-Center: wer hier haengt, hat
           gerade kein Netz, um danach zu suchen. */
        <div className="flow esim-hand">
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
        <div className="flow">
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
