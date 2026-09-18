/* ============================================================
   NOURA — Die Entstehung der eSIM

   Bisher war die Aktivierung eine Textliste vor einer schwebenden
   Karte: vier Zeilen haken sich ab, fertig. Was dabei entsteht, blieb
   unsichtbar — dabei ist das der Moment, in dem der Kunde zum ersten
   Mal sieht, was er gerade gekauft hat.

   Stattdessen laeuft hier eine durchgehende Fertigung ueber beide
   Haelften des Ablaufs. EIN Objekt, acht Takte:

     entworfen · gelasert · versiegelt · bereit      (wir bauen sie)
     geladen · eingerichtet · gesucht · im Netz      (sein iPhone holt sie)

   ---------------------------------------------------------------
   Gezeichnet wird die Karte, die es im Produkt wirklich gibt.

   Hier standen bis zum 2026-09-17 ein rotes ISO-Kontaktfeld,
   Leiterbahnen mit Durchkontaktierungen und ein Hologrammsiegel. Das
   sah nach Chipfertigung aus, aber nichts davon kommt in NOURA vor —
   es war eine zweite Bildsprache neben der eigenen. Die Vorlage warnt
   genau davor: "Der Code erfindet Elemente, die Figma nicht hat."

   Jetzt traegt die Karte, was .sim-card traegt: Tarifname, Chip,
   Preis, Unterzeile und das eSIM-Zeichen aus components/ui.tsx — auf
   denselben Koordinaten, weil der viewBox 345x173 ist, also exakt das
   Figma-Mass. Die Karte auf der Buehne und die Karte auf Home sind
   dadurch dasselbe Objekt und nicht zwei Interpretationen davon.

   Neu ist genau eine Sache, und die ist gewollt: der Name des
   Inhabers, vom Laser in die freie Mitte graviert. Eine SIM traegt
   dort sonst ihre ICCID — eine Nummer, die niemandem etwas sagt. Der
   Name sagt, wem sie gehoert.
   ---------------------------------------------------------------

   Zwei Regeln aus dem uebrigen Onboarding gelten unveraendert:
   animiert wird nur transform und opacity, und Weichheit entsteht aus
   Radial-Verlaeufen statt aus filter:blur — Safari auf dem iPhone
   rendert grossflaechige Filter traege (siehe onboarding.css).

   Der Grundzustand jedes Elements ist die FERTIGE Karte. Die frueheren
   Takte nehmen weg, sie bauen nicht auf. Sonst muesste jeder neue Takt
   den Endzustand aller Elemente erneut behaupten — und genau so
   entstehen Zustaende, die nach einem Durchlauf haengen bleiben.
   ============================================================ */
import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { Plan } from '../data/plans'

/** Silhouette der SIM-Karte, exakt aus Figma (345x173) — dieselbe Kontur
    wie --sim-shape in global.css. Die abgeschnittene obere rechte Ecke
    ist das Erkennungszeichen; ein Rechteck waere eine Kreditkarte. */
export const SIM_PATH =
  'M0 16C0 7.16344 7.16344 0 16 0H289.102C292.799 0 296.381 1.27972 299.24 3.62172L320.497 21.0314L339.793 38.6615C343.11 41.6928 345 45.9796 345 50.4735V157C345 165.837 337.837 173 329 173H16C7.16345 173 0 165.837 0 157V16Z'

export type Beat =
  | 'design'    /* Entwurf — Raster, Masse, Platzhalter */
  | 'laser'     /* Fertigung — eSIM-Zeichen und Name */
  | 'seal'      /* Signatur — der Tarif kommt auf die Karte */
  | 'ready'     /* fertig, dreht sich zum Betrachter */
  | 'load'      /* das Profil zieht aufs Geraet */
  | 'install'   /* es wird geschrieben */
  | 'search'    /* das Netz wird gesucht */
  | 'live'      /* verbunden */

/* Stimmung je Takt. Die Aurora im Hintergrund traegt die Erzaehlung
   ueber den ganzen Screen statt nur ueber die 320px der Buehne: kuehl
   beim Entwurf, heiss beim Lasern, kuehl bei der Netzsuche, warm in
   den beiden Momenten, in denen etwas fertig ist. */
export const BEAT_TONE: Record<Beat, 'coral' | 'violet' | 'blue'> = {
  design: 'blue',
  laser: 'coral',
  seal: 'violet',
  ready: 'coral',
  load: 'violet',
  install: 'violet',
  search: 'blue',
  live: 'coral',
}

/* ---------- Kartenmasse ----------
   Alle Werte 1:1 aus .sim-card (global.css) auf dem Figma-Mass
   345x173: 24px Innenabstand, Kopf oben, Fuss unten, das eSIM-Zeichen
   38x38 rechts auf der Fusslinie. */
const PAD = 24
const FOOT = 173 - PAD /* Unterkante des Inhalts */
const ICON = { x: 345 - PAD - 38, y: FOOT - 38, s: 38 }

/* Das eSIM-Zeichen aus components/ui.tsx, in SVG nachgelegt: vier
   Punktreihen um eine Chipflaeche, innen das kleine "e". Prozentwerte
   von dort (16.6 / 33.3) auf 38px gerechnet. */
const ICON_SQ = ICON.s * 0.166
const ICON_IN = ICON.s * 0.333
const DOT_STEP = 6
const ICON_DOTS: [number, number][] = [
  ...[0, 1, 2, 3].map((i) => [ICON.x + 8 + i * DOT_STEP, ICON.y] as [number, number]),
  ...[0, 1, 2, 3].map((i) => [ICON.x + ICON.s - 3, ICON.y + 8 + i * DOT_STEP] as [number, number]),
  ...[3, 2, 1, 0].map((i) => [ICON.x + 8 + i * DOT_STEP, ICON.y + ICON.s - 3] as [number, number]),
  ...[3, 2, 1, 0].map((i) => [ICON.x, ICON.y + 8 + i * DOT_STEP] as [number, number]),
]

/* ---------- Gravur ----------
   Gleiche Zellenbreite je Zeichen, jedes mittig darin: das ergibt den
   gesperrten Satz einer Pragung und macht nebenbei die Verzoegerungen
   des Lasers berechenbar. Ein einzelner Textknoten koennte nicht
   Zeichen fuer Zeichen geschrieben werden. */
const ENGRAVE_CELL = 13.5
const ENGRAVE_Y = 95
const engraveX = (i: number) => PAD + i * ENGRAVE_CELL + ENGRAVE_CELL / 2

/* Netzknoten im Sechseck um die Karte. Radius 104 liegt ausserhalb der
   geschrumpften Karte, die Strahlen laufen bis 70 nach innen und
   verschwinden dort hinter ihr — sie enden nicht, sie gehen hinein. */
const NODE_ANGLES = [30, 90, 150, 210, 270, 330]
const NODE_R = 104
const RAY_R = 70

/* Radarkeil fuer die Netzsuche. Von oben im Uhrzeigersinn, 38 Grad —
   schmal genug, dass er als Strahl liest und nicht als Tortenstueck. */
const RADAR_R = 124
const rad = (d: number) => (d * Math.PI) / 180
const RADAR_PATH = (() => {
  const [ax, ay] = [160 + RADAR_R * Math.cos(rad(-90)), 130 + RADAR_R * Math.sin(rad(-90))]
  const [bx, by] = [160 + RADAR_R * Math.cos(rad(-52)), 130 + RADAR_R * Math.sin(rad(-52))]
  return `M160 130 L${ax.toFixed(1)} ${ay.toFixed(1)} A${RADAR_R} ${RADAR_R} 0 0 1 ${bx.toFixed(1)} ${by.toFixed(1)} Z`
})()

export function EsimStage({
  beat,
  run,
  plan,
  holder,
}: {
  beat: Beat
  run: boolean
  /** Der gewaehlte Tarif — es entsteht seine Karte, nicht irgendeine. */
  plan: Plan
  /** Name des Inhabers, wird in die Mitte graviert. */
  holder: string
}) {
  /* Beide Buehnen koennen gleichzeitig im Dokument stehen. Feste IDs
     fuer Verlauf und Maske wuerden sich gegenseitig ueberschreiben. */
  const uid = useId().replace(/:/g, '')
  const clip = `c-${uid}`
  const heat = `h-${uid}`
  const wipe = `w-${uid}`
  const radar = `r-${uid}`
  const gloss = `g-${uid}`
  const corner = `k-${uid}`

  const chars = holder.toUpperCase().split('')

  /* ---------- Wo der Chip steht ----------
     In .sim-card sitzt er hinter dem Tarifnamen, in einer Flex-Zeile mit
     8px Abstand. SVG hat keinen Textfluss, die Stelle muss also gerechnet
     werden — und zwar GEMESSEN, nicht geschaetzt.

     Hier stand bis zum 2026-09-17 `plan.name.length * 13`. Das kann fuer
     beide Tarife nicht stimmen, weil Buchstaben verschieden breit sind:
     CONNECT misst in General Sans Bold 20px 13,83px je Zeichen, CREATE
     12,64px. Mit einem gemeinsamen Faktor klebt der Chip einmal am Wort
     und steht einmal zu weit weg.

     Zweimal gemessen: einmal nach dem Einbau, einmal wenn die Schrift
     geladen ist — davor misst der Browser die Ersatzschrift. Bis zur
     ersten Messung traegt die alte Schaetzung, damit das erste Bild
     nicht bei x=0 steht. */
  const titleRef = useRef<SVGTextElement>(null)
  const [titleW, setTitleW] = useState(0)
  useLayoutEffect(() => {
    let alive = true
    const measure = () => {
      if (alive) setTitleW(titleRef.current?.getComputedTextLength() ?? 0)
    }
    measure()
    document.fonts?.ready.then(measure)
    return () => {
      alive = false
    }
  }, [plan.name])

  const chipX = PAD + (titleW || plan.name.length * 13) + 10

  return (
    <div className={`forge${run ? ' run' : ''}`} data-beat={beat} data-plan={plan.key} aria-hidden="true">
      <span className="fg-glow" />

      {/* ---- Netzschicht: liegt HINTER der Karte, damit die Strahlen
              unter ihr verschwinden statt auf ihr zu enden. ---- */}
      <svg className="fg-net" viewBox="0 0 320 260">
        <defs>
          <radialGradient id={radar} gradientUnits="userSpaceOnUse" cx="160" cy="130" r={RADAR_R}>
            <stop offset="0%" stopColor="#fff" stopOpacity=".20" />
            <stop offset="70%" stopColor="#fff" stopOpacity=".06" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Der Suchstrahl dreht sich nur waehrend der Netzsuche — er ist
            die Handlung, nicht die Verzierung. */}
        <g className="fg-radar">
          <path d={RADAR_PATH} fill={`url(#${radar})`} />
          <line className="fg-radar-edge" x1="160" y1="130" x2="160" y2={130 - RADAR_R} />
        </g>

        {[72, 98, 124].map((r, i) => (
          <circle key={r} className={`fg-ring r${i + 1}`} cx="160" cy="130" r={r} />
        ))}

        {NODE_ANGLES.map((deg, i) => {
          const [cos, sin] = [Math.cos(rad(deg)), Math.sin(rad(deg))]
          const [nx, ny] = [160 + cos * NODE_R, 130 + sin * NODE_R]
          return (
            <g key={deg} className="fg-node" style={{ '--i': i } as React.CSSProperties}>
              <line className="fg-ray" x1={nx} y1={ny} x2={160 + cos * RAY_R} y2={130 + sin * RAY_R} />
              <circle className="fg-dot" cx={nx} cy={ny} r="3.5" />
              {/* Datenpakete laufen vom Knoten nach innen: das Netz kommt
                  zur Karte, nicht umgekehrt. Richtung und Weg stehen als
                  Variablen am Element — im CSS waeren es sechs Regeln. */}
              <circle
                className="fg-packet" cx={nx} cy={ny} r="2.4"
                style={{
                  '--i': i,
                  '--px': `${(cos * (RAY_R - NODE_R)).toFixed(1)}px`,
                  '--py': `${(sin * (RAY_R - NODE_R)).toFixed(1)}px`,
                } as React.CSSProperties}
              />
            </g>
          )
        })}

        {/* Das Profil faellt von oben auf die Karte — nur im Takt "geladen". */}
        <g className="fg-stream">
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx="160" cy="0" r="2.6" style={{ '--i': i } as React.CSSProperties} />
          ))}
        </g>
      </svg>

      {/* ---- Die Karte. Der viewBox ist bewusst groesser als 345x173:
              die Masszeichen des Entwurfs liegen ausserhalb der
              Kartenflaeche und wuerden sonst abgeschnitten. ---- */}
      <div className="fg-plate">
        <svg viewBox="-16 -16 377 205">
          <defs>
            <clipPath id={clip}>
              <path d={SIM_PATH} />
            </clipPath>
            <radialGradient id={heat}>
              <stop offset="0%" stopColor="#fff" stopOpacity=".95" />
              <stop offset="35%" stopColor="var(--noura-accent)" stopOpacity=".55" />
              <stop offset="100%" stopColor="var(--noura-accent)" stopOpacity="0" />
            </radialGradient>
            {/* Die Spiegelung der polierten Flaeche — derselbe Streifen
                wie in global.css, hier ueber den Vektor gelegt statt
                ueber einen Winkel. */}
            <linearGradient id={gloss} gradientUnits="userSpaceOnUse" x1="36" y1="-46" x2="248" y2="196">
              <stop offset=".14" stopColor="#fff" stopOpacity="0" />
              <stop offset=".30" stopColor="#fff" stopOpacity=".085" />
              <stop offset=".42" stopColor="#fff" stopOpacity=".02" />
              <stop offset=".56" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id={corner} gradientUnits="userSpaceOnUse" cx="304" cy="4" r="200">
              <stop offset="0%" stopColor="var(--noura-accent)" stopOpacity=".18" />
              <stop offset="58%" stopColor="var(--noura-accent)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={wipe} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff" stopOpacity="0" />
              <stop offset="50%" stopColor="#fff" stopOpacity=".38" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* ---------- Blaupause ----------
              Raster, Masszeichen, Passkreuze und gestrichelte Platzhalter
              dort, wo spaeter Tarifname, Chip, Gravur, Preis und
              eSIM-Zeichen sitzen. Der Entwurf zeigt damit nicht nur eine
              Kontur, sondern einen Plan — man sieht, WAS entstehen wird. */}
          <g className="fg-draft">
            <g clipPath={`url(#${clip})`}>
              {Array.from({ length: 14 }, (_, i) => (
                <line key={`v${i}`} className="fg-grid" x1={(i + 1) * 23} y1="0" x2={(i + 1) * 23} y2="173" />
              ))}
              {Array.from({ length: 6 }, (_, i) => (
                <line key={`h${i}`} className="fg-grid" x1="0" y1={(i + 1) * 24.7} x2="345" y2={(i + 1) * 24.7} />
              ))}
            </g>

            <g className="fg-guides">
              <rect x={PAD} y="26" width={plan.name.length * 13} height="26" rx="3" />
              <rect x={chipX} y="30" width="50" height="18" rx="9" />
              <rect x={PAD} y={ENGRAVE_Y - 13} width={chars.length * ENGRAVE_CELL} height="17" rx="3" />
              <rect x={PAD} y={FOOT - 36} width="152" height="36" rx="3" />
              <rect x={ICON.x} y={ICON.y} width={ICON.s} height={ICON.s} rx="3" />
            </g>

            {/* Passkreuze an den drei rechtwinkligen Ecken. Die vierte
                ist abgeschnitten — dort steht stattdessen das Mass. */}
            <g className="fg-cross">
              {[[16, 16], [16, 157], [329, 157]].map(([x, y]) => (
                <path key={`${x}-${y}`} d={`M${x - 6} ${y}H${x + 6}M${x} ${y - 6}V${y + 6}`} />
              ))}
            </g>

            <g className="fg-dim">
              <line x1="0" y1="185" x2="345" y2="185" />
              <line x1="0" y1="180" x2="0" y2="190" />
              <line x1="345" y1="180" x2="345" y2="190" />
              <line x1="357" y1="0" x2="357" y2="173" />
              <line x1="352" y1="0" x2="362" y2="0" />
              <line x1="352" y1="173" x2="362" y2="173" />
            </g>
          </g>

          {/* Flaeche, Kontur und eine zweite Kontur knapp darin: die
              innere Linie gibt der Karte Dicke, ohne einen Schatten zu
              brauchen. */}
          <path className="fg-fill" d={SIM_PATH} />

          {/* ---------- Das Gesicht des Tarifs ----------
              Dieselben zwei Materialien wie .sim-card auf Home: CONNECT
              bleibt die ruhige Flaeche, CREATE bekommt die Spiegelung
              der polierten und das Akzentlicht in der abgeschnittenen
              Ecke. Ohne das entstuende in der Fertigung eine Karte, die
              der Kunde danach nirgends wiedersieht. */}
          {plan.key === 'create' && (
            <g className="fg-face" clipPath={`url(#${clip})`}>
              <rect x="0" y="0" width="345" height="173" fill={`url(#${gloss})`} />
              <rect x="0" y="0" width="345" height="173" fill={`url(#${corner})`} />
            </g>
          )}

          <path className="fg-outline" d={SIM_PATH} />
          <path className="fg-edge" d={SIM_PATH} />

          <g clipPath={`url(#${clip})`}>
            <rect className="fg-wipe" x="-140" y="0" width="140" height="173" fill={`url(#${wipe})`} />
          </g>

          {/* ---------- eSIM-Zeichen ----------
              Der Laser faehrt die vier Punktreihen im Uhrzeigersinn ab und
              setzt zuletzt die Chipflaeche. Die Reihenfolge der Punkte im
              Markup ist seine Fahrtrichtung. */}
          <g className="fg-esim">
            {ICON_DOTS.map(([x, y], i) => (
              <rect
                key={i} className="fg-esim-dot" x={x} y={y} width="3" height="3" rx="1"
                style={{ '--i': i } as React.CSSProperties}
              />
            ))}
            <rect
              className="fg-esim-sq"
              x={ICON.x + ICON_SQ} y={ICON.y + ICON_SQ}
              width={ICON.s - ICON_SQ * 2} height={ICON.s - ICON_SQ * 2} rx="2"
            />
            <rect
              className="fg-esim-in"
              x={ICON.x + ICON_IN} y={ICON.y + ICON_IN}
              width={ICON.s - ICON_IN * 2} height={ICON.s - ICON_IN * 2} rx="2"
            />
            <text className="fg-esim-e" x={ICON.x + ICON.s / 2} y={ICON.y + ICON.s / 2} textAnchor="middle" dominantBaseline="central">
              e
            </text>
          </g>

          {/* ---------- Gravur ----------
              Der Name des Inhabers, Zeichen fuer Zeichen geschrieben. */}
          <g className="fg-engrave">
            {chars.map((c, i) => (
              <text key={i} x={engraveX(i)} y={ENGRAVE_Y} textAnchor="middle" style={{ '--i': i } as React.CSSProperties}>
                {c}
              </text>
            ))}
          </g>

          {/* ---------- Aufdruck ----------
              Was .sim-card zeigt: Tarifname oben, Preis und Unterzeile
              unten. Kommt mit der Signatur — vorher war es ein Rohling,
              jetzt ist es eine bestimmte Karte fuer einen bestimmten
              Tarif. */}
          <g className="fg-print">
            <text ref={titleRef} className="fg-title" x={PAD} y="45">{plan.name}</text>
            <text className="fg-price" x={PAD} y="128">{plan.price}</text>
            <text className="fg-sub" x={PAD} y="145">Deine 5G eSIM, jeden Monat kündbar</text>
          </g>

          {/* Der Chip sagt "Aktiv" — und erscheint deshalb erst, wenn sie
              es ist: im letzten Takt, nicht vorher. */}
          <g className="fg-active">
            <rect x={chipX} y="30" width="50" height="18" rx="9" />
            <text x={chipX + 25} y="39" textAnchor="middle" dominantBaseline="central">Aktiv</text>
          </g>

          {/* ---------- Laserkopf ----------
              Zwei Aufgaben nacheinander: einmal um das eSIM-Zeichen
              herum, dann die Gravur. Die schnellen Ruecklaeufe dazwischen
              sind kein Fehler — so bewegt sich eine Maschine, und der
              Rhythmus macht den Vorgang als Arbeit lesbar. */}
          <g className="fg-laser">
            {/* Kein Strahl von oben: die Karte liegt gekippt auf der Bank,
                eine senkrechte Linie im Kartenraum laege flach darauf und
                saehe aus wie ein Kratzer. Was Lasern lesbar macht, ist der
                wandernde Gluthof. */}
            <circle className="fg-heat" r="20" fill={`url(#${heat})`} />
            <circle className="fg-tip" r="3.4" />
            <g className="fg-sparks">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <circle key={i} r="2.1" style={{ '--i': i } as React.CSSProperties} />
              ))}
            </g>
          </g>
        </svg>
      </div>
    </div>
  )
}


