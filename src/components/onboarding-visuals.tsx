/* ============================================================
   NOURA — Onboarding-Visuals
   Bewegte Bildwelt fuer Intro, Onboarding und Aktivierung.

   Leistungsregel: animiert wird ausschliesslich ueber transform und
   opacity. Weichzeichnung entsteht durch Radial-Verlaeufe, nicht durch
   filter:blur oder backdrop-filter — Safari auf dem iPhone rendert
   grossflaechige Filter traege (siehe Aurora-Entscheidung in global.css).
   ============================================================ */
import { useEffect, useState } from 'react'
import onboardCard from '../assets/img/onboard-simcard.webp'

/* ---------- Driftende Farbwolken ----------
   Liegt ueber dem statischen Aurora-Bild und haelt den Hintergrund in
   Bewegung. Drei Verlaeufe im Screen-Blendmodus, sehr langsam versetzt. */
export function AuroraFlow({ tone = 'coral' }: { tone?: 'coral' | 'violet' | 'blue' }) {
  return (
    <div className={`aurora-flow tone-${tone}`} aria-hidden="true">
      <span className="af af-1" />
      <span className="af af-2" />
      <span className="af af-3" />
    </div>
  )
}

/* ---------- Zaehler ----------
   Zaehlt beim Einblenden auf den Zielwert hoch (ease-out cubic). */
function useCountUp(target: number, run: boolean, ms = 1400) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!run) {
      setValue(0)
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, run, ms])
  return value
}

/* ---------- Die 3D-Karte ----------
   Das Figma-Bild traegt einen Alphakanal. Der Glanzstreifen wird damit
   maskiert, laeuft also exakt ueber die Kartenflaeche statt ueber ein
   Rechteck. Gleiches gilt fuer den Scanbalken der Aktivierung. */
export function Card3D({ scanning = false }: { scanning?: boolean }) {
  return (
    <div className={`card3d${scanning ? ' scanning' : ''}`}>
      <span className="card3d-glow" />
      <img src={onboardCard} alt="" />
      <span className="card3d-sheen" />
      {scanning && <span className="card3d-scan" />}
    </div>
  )
}

/* ================= Schritt 1 — Digital =================
   Die Karte schwebt, drei Glaspunkte kreisen als App-Metapher. */
export function VisualDigital() {
  return (
    <div className="viz">
      <span className="viz-glow glow-coral" />
      <div className="orbit">
        <span className="orb o1" />
        <span className="orb o2" />
        <span className="orb o3" />
      </div>
      <Card3D />
    </div>
  )
}

/* ================= Schritt 2 — Flexibel =================
   Kalenderblatt mit hervorgehobenem Stichtag, darum ein rotierender
   gestrichelter Ring als Bild fuer den monatlichen Zyklus. */
export function VisualFlexible({ run }: { run: boolean }) {
  const days = Array.from({ length: 28 }, (_, i) => i + 1)
  return (
    <div className="viz">
      <span className="viz-glow glow-violet" />
      <svg className="cycle-ring" viewBox="0 0 240 240" aria-hidden="true">
        <circle cx="120" cy="120" r="112" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.5" strokeDasharray="4 12" strokeLinecap="round" />
      </svg>
      <div className={`cal-card${run ? ' run' : ''}`}>
        <div className="cal-top">
          <i />
          <i />
          <span>Monat 01</span>
        </div>
        <div className="cal-grid">
          {days.map((d) => (
            <span key={d} className={d === 10 ? 'day on' : 'day'}>
              {d}
            </span>
          ))}
        </div>
        <div className="cal-foot">jederzeit kündbar</div>
      </div>
    </div>
  )
}

/* ================= Schritt 3 — Highspeed =================
   Tacho: der Zeiger schwingt beim Einblenden auf die volle Bandbreite hoch,
   der Bogen faerbt sich mit. Angetrieben wird beides vom selben Zaehler wie
   die Zahl darunter — Nadel, Bogen und Ziffer koennen nicht auseinander
   laufen. */
const MAX_MBIT = 500

/* SVG misst im Uhrzeigersinn ab 3 Uhr. 200 Grad Sweep, unten offen und
   symmetrisch: Vollausschlag landet damit knapp unter der Waagerechten
   rechts. Bei den 240 Grad eines Auto-Tachos zeigt der Zeiger bei Vollgas
   nach unten und liest sich wie durchgehangen. */
const GAUGE_R = 96
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R
const GAUGE_SWEEP = 200
const GAUGE_ARC = (GAUGE_CIRC * GAUGE_SWEEP) / 360
const GAUGE_START = 270 - GAUGE_SWEEP / 2
const TICKS = 9

export function VisualSpeed({ run }: { run: boolean }) {
  const mbit = useCountUp(MAX_MBIT, run)
  const ratio = mbit / MAX_MBIT
  const needle = GAUGE_START + GAUGE_SWEEP * ratio

  return (
    <div className="viz">
      <span className="viz-glow glow-blue" />
      <div className="g5">
        <div className="gauge">
          <svg viewBox="0 0 240 158" aria-hidden="true">
            {/* Skalenstriche: die oberen beiden in Akzentfarbe, damit das
                Ende der Skala als Zielbereich lesbar ist */}
            {Array.from({ length: TICKS }, (_, i) => {
              const a = ((GAUGE_START + (GAUGE_SWEEP * i) / (TICKS - 1)) * Math.PI) / 180
              const [cos, sin] = [Math.cos(a), Math.sin(a)]
              return (
                <line
                  key={i}
                  x1={120 + cos * 106}
                  y1={120 + sin * 106}
                  x2={120 + cos * 114}
                  y2={120 + sin * 114}
                  stroke={i >= TICKS - 2 ? 'var(--noura-accent)' : 'rgba(255,255,255,.3)'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )
            })}

            <circle
              className="gauge-track"
              cx="120" cy="120" r={GAUGE_R}
              strokeDasharray={`${GAUGE_ARC} ${GAUGE_CIRC}`}
              transform={`rotate(${GAUGE_START} 120 120)`}
            />
            <circle
              className="gauge-fill"
              cx="120" cy="120" r={GAUGE_R}
              strokeDasharray={`${GAUGE_ARC * ratio} ${GAUGE_CIRC}`}
              transform={`rotate(${GAUGE_START} 120 120)`}
            />

            {/* Der Zeiger beginnt ausserhalb des Deckels (r=31). Liefe er
                darunter durch, schiene er durch dessen Glasfuellung hindurch. */}
            <g className="gauge-needle" transform={`rotate(${needle} 120 120)`}>
              <line x1="156" y1="120" x2="196" y2="120" strokeLinecap="round" />
            </g>
            {/* Nabendeckel traegt die Wortmarke, wie bei einem echten Tacho */}
            <circle className="gauge-cap" cx="120" cy="120" r="31" />
            <text className="gauge-mark" x="120" y="120" textAnchor="middle" dominantBaseline="central">
              5G
            </text>
          </svg>
        </div>

        <div className="g5-speed">
          <b>{mbit}</b>
          <em>Mbit/s</em>
        </div>
      </div>
    </div>
  )
}

/* ---------- Erfolgs-Haken ----------
   Der Pfad wird ueber stroke-dashoffset gezeichnet, die Ringe laufen als
   Welle nach aussen. */
export function SuccessBurst() {
  return (
    <div className="burst" aria-hidden="true">
      <span className="ripple r1" />
      <span className="ripple r2" />
      <svg viewBox="0 0 64 64" className="burst-check">
        {/* Der Haken steht frei vor dem Verlauf — die Traegerscheibe war nur
            noetig, solange er auf der Karte lag. */}
        <circle cx="32" cy="32" r="30" fill="none" stroke="var(--noura-accent)" strokeWidth="2" className="burst-circle" />
        <path d="M19 33.5 28 42 45 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="burst-path" />
      </svg>
    </div>
  )
}
