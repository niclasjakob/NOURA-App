/* ============================================================
   NOURA — Die Entstehung der eSIM

   Bisher war die Aktivierung eine Textliste vor einer schwebenden
   Karte: vier Zeilen haken sich ab, fertig. Was dabei entsteht, blieb
   unsichtbar — dabei ist das der Moment, in dem der Kunde zum ersten
   Mal sieht, was er gerade gekauft hat.

   Stattdessen laeuft hier eine durchgehende Fertigung ueber beide
   Haelften des Ablaufs. EIN Objekt, acht Takte:

     angelegt · personalisiert · versiegelt · bereit      (wir bauen sie)
     geladen · eingerichtet · gesucht · im Netz           (sein iPhone holt sie)

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

   ---------------------------------------------------------------
   Die Einrichtung auf dem Geraet (seit dem 2026-09-24).

   Hier standen ein Radarkeil, drei Suchringe, sechs Netzknoten im
   Sechseck mit Strahlen und Datenpaketen, davor fallende Punkte und ein
   Schimmer im Schleifenlauf. Jeder Takt sprach eine andere Bildsprache,
   keine davon kam aus dem Produkt — das Stockbild "Konnektivitaet". Und
   im Hoehepunkt schrumpfte die Karte auf 46 %, ausgerechnet der
   Gegenstand, um den es geht.

   Jetzt bleibt die Karte gross, und jedes Kapitel hat genau EINE
   ehrliche Anzeige, beide aus dem Alltag eines iPhones:

     geladen · eingerichtet   der Fortschritt laeuft auf der Kontur der
                              Karte um — wie der Ring um ein App-Symbol,
                              das gerade geladen wird. Bestimmt, nicht
                              kreisend (progress-indicators.md).
     gesucht · im Netz        vier Empfangsbalken ueber der Karte: leer,
                              dann tastend, dann voll — der Moment, den
                              jeder kennt, der je eine SIM eingelegt hat.

   Koralle bleibt dem Chip und dem Etikett "Aktiv" vorbehalten. Die
   Balken sind weiss wie die Statusleiste, die sie zitieren.
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
const ENGRAVE_CELL = 13.5 /* = .sim-card .holder i in global.css */
const ENGRAVE_Y = 95

/* ---------- Das Etikett ----------
   Masse aus .chip in global.css: 8px Abstand zum Namen, 8px
   Innenabstand je Seite, 18px hoch, mittig auf der 27px-Zeile des
   Namens (24 + 27/2 = 37,5). */
const CHIP_GAP = 8
const CHIP_PAD = 8
const CHIP_H = 18
const CHIP_CY = PAD + 27 / 2
const engraveX = (i: number) => PAD + i * ENGRAVE_CELL + ENGRAVE_CELL / 2

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
  const gloss = `g-${uid}`
  const corner = `k-${uid}`
  const body = `b-${uid}`
  const sheen = `s-${uid}`

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
  const tagRef = useRef<SVGTextElement>(null)
  const activeRef = useRef<SVGTextElement>(null)
  const [w, setW] = useState({ title: 0, tag: 0, active: 0 })
  useLayoutEffect(() => {
    let alive = true
    const measure = () => {
      if (alive)
        setW({
          title: titleRef.current?.getComputedTextLength() ?? 0,
          tag: tagRef.current?.getComputedTextLength() ?? 0,
          active: activeRef.current?.getComputedTextLength() ?? 0,
        })
    }
    measure()
    document.fonts?.ready.then(measure)
    return () => {
      alive = false
    }
  }, [plan.name, plan.chip])

  const chipX = PAD + (w.title || plan.name.length * 13) + CHIP_GAP
  const chipW = (textW: number, label: string) => (textW || label.length * 6.5) + CHIP_PAD * 2
  /* Etikett des Tarifs bis zur Aktivierung, danach der Zustand — wie
     auf der Tarifwahl und auf Home. */
  const chip = (cls: string, label: string, textW: number, ref: React.Ref<SVGTextElement>) => (
    <g className={cls}>
      <rect x={chipX} y={CHIP_CY - CHIP_H / 2} width={chipW(textW, label)} height={CHIP_H} rx={CHIP_H / 2} />
      <text ref={ref} x={chipX + chipW(textW, label) / 2} y={CHIP_CY} textAnchor="middle" dominantBaseline="central">
        {label}
      </text>
    </g>
  )

  return (
    <div
      className={`forge${run ? ' run' : ''}`}
      data-beat={beat}
      data-plan={plan.key}
      aria-hidden="true"
      style={
        {
          /* Wo der Laser die Gravur beendet und wie schnell er dabei von
             Zelle zu Zelle faehrt. Stand bis zum 2026-09-24 als feste
             179.25px im CSS — die Mitte des zwoelften Zeichens, also
             genau "MARCEL WEBER". Bei jedem anderen Namen hoerte der
             Kopf mitten im Wort auf oder fuhr ins Leere. Die Fahrt
             dauert 26 % von 3,05s, geteilt durch die Zellen dazwischen. */
          '--engrave-end': `${engraveX(chars.length - 1)}px`,
          '--etch-step': `${(0.793 / Math.max(1, chars.length - 1)).toFixed(4)}s`,
        } as React.CSSProperties
      }
    >
      <span className="fg-glow" />

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
            {/* ---------- Material ----------
                Die vier Verlaeufe von .sim-card in global.css, als Vektor
                nachgerechnet. CSS-Winkel laufen ueber die ganze Box, Ecke
                zu Ecke: bei 135deg auf 345x173 ist die Verlaufslinie
                (345+173)/sqrt2 = 366 lang und steht auf der Mitte. Vorher
                lagen hier eine flache Fuellung, ein um 20 Grad verdrehter
                Glanz und ein runder statt elliptischer Eckschein — die
                Karte der Fertigung war eine andere als die auf Home. */}
            <linearGradient id={body} gradientUnits="userSpaceOnUse" x1="43" y1="-43" x2="302" y2="216">
              <stop offset="0" stopColor="var(--sim-body)" />
              <stop offset="1" stopColor="var(--sim-body-deep)" />
            </linearGradient>
            <linearGradient id={sheen} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="72">
              <stop offset="0" stopColor="#fff" stopOpacity={plan.key === 'create' ? 0.11 : 0.09} />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            {/* 118deg: Richtung (0.883, 0.469), Laenge 386. */}
            <linearGradient id={gloss} gradientUnits="userSpaceOnUse" x1="2.2" y1="-4" x2="342.8" y2="177">
              <stop offset=".14" stopColor="#fff" stopOpacity="0" />
              <stop offset=".30" stopColor="#fff" stopOpacity=".085" />
              <stop offset=".42" stopColor="#fff" stopOpacity=".02" />
              <stop offset=".56" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            {/* 120% 90% at 88% 2%: Ellipse 414 x 155,7 um (303,6 | 3,5) —
                SVG kennt nur Kreise, also Kreis plus y-Stauchung. */}
            <radialGradient
              id={corner} gradientUnits="userSpaceOnUse" cx="303.6" cy="3.5" r="414"
              gradientTransform="translate(0 3.5) scale(1 0.376) translate(0 -3.5)"
            >
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
              <rect x={PAD} y="26" width={w.title || plan.name.length * 13} height="26" rx="3" />
              <rect x={chipX} y={CHIP_CY - CHIP_H / 2} width={chipW(w.tag || w.active, plan.chip ?? 'Aktiv')} height={CHIP_H} rx={CHIP_H / 2} />
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

          {/* Koerper und Lichtsaum, wie .sim-card. */}
          <g className="fg-fill">
            <path d={SIM_PATH} fill={`url(#${body})`} />
            <path d={SIM_PATH} fill={`url(#${sheen})`} />
          </g>

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

          {/* Die Kante von .sim-card::before: 2px gestrichen, von der
              Silhouette auf 1px innen beschnitten. Im Entwurf zeichnet
              dieselbe Linie die Kontur in Akzentfarbe. Die zweite,
              innere Kontur, die hier bis zum 2026-09-24 lag, hatte die
              Karte auf Home nie. */}
          <g clipPath={`url(#${clip})`}>
            <path className="fg-outline" d={SIM_PATH} />
          </g>

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

          {/* Das Etikett des Tarifs kommt mit dem Aufdruck — so, wie der
              Kunde die Karte gewaehlt hat. "Aktiv" loest es ab, und zwar
              erst, wenn sie es ist: im letzten Takt, nicht vorher. */}
          {plan.chip && chip('fg-tag', plan.chip, w.tag, tagRef)}
          {chip('fg-active', 'Aktiv', w.active, activeRef)}

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

        {/* ---------- Fortschritt ----------
            Laeuft beim Laden und Einrichten einmal im Uhrzeigersinn um die
            Silhouette, oben links beginnend — die Form der Karte ist die
            Spur. pathLength 100 macht aus der Kontur eine Prozentskala.

            Eigenes SVG, deckungsgleich ueber der Karte: der Strich wird
            ueber stroke-dashoffset gezeichnet, und das malt sein SVG in
            jedem Bild neu. Laege er im Karten-SVG, waere das die ganze
            Karte mit Verlaeufen, Text und Chip — 3,8 Sekunden lang. */}
        <svg className="fg-progress-layer" viewBox="-16 -16 377 205">
          {/* Die Abdunklung waehrend der Netzsuche liegt hier und nicht als
              Deckkraft auf der Karte: eine durchscheinende Karte laesst die
              Aurora durch und wirkt verwaschen statt gedimmt. Und im
              eigenen SVG malt ihr Uebergang nur diese Ebene neu. */}
          <path className="fg-shade" d={SIM_PATH} />
          <path className="fg-progress" d={SIM_PATH} pathLength={100} />
        </svg>
      </div>

      {/* ---------- Empfang ----------
          Ueber der Karte, wo auf dem iPhone die Statusleiste sitzt. Wie
          die Karte steht sie still (bis zum 2026-09-25 schwebten beide).
          Aussen die Lage, innen die Sichtbarkeit je Takt.

          "5G" rueckt erst im letzten Takt dazu, die Balken machen ihm
          Platz — vorher stehen sie allein auf der Mitte. */}
      <div className="fg-signal">
        <div className="fg-sig">
          <span className="fg-bars">
            {[0, 1, 2, 3].map((i) => (
              <i key={i}>
                <b style={{ '--i': i } as React.CSSProperties} />
              </i>
            ))}
          </span>
          <span className="fg-5g">5G</span>
        </div>
      </div>
    </div>
  )
}


