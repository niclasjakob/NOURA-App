import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Plan } from '../data/plans'
import { hapticPress } from '../lib/haptics'
import { useInert } from '../hooks/a11y'

/* ---------- Button ----------
   Massgeblich ist die Figma-Komponente 301:1461, laut eigener
   Beschreibung "der tatsaechlich in allen 12 Screens verwendete Button".
   Ihre Varianten: Type=Filled/Borderless, Size=Large/Small,
   LabelType=Text/Icon/Icon+Text, State=Enabled/Pressed.

   State ist hier keine Prop — den zeichnet CSS ueber :active. Type und
   LabelType fallen zusammen in `variant`; Size=Small gibt es im Code nur
   als Icon-Knopf (64x64), einen kleinen Textbutton hat die App nicht.
   Deshalb steht hier auch keine size-Prop: eine Prop ohne Umsetzung
   waere eine Behauptung.

   Vorher stand an 17 Stellen `<button className="btn">`. Genau diese
   Streuung laesst eine Vorlage auseinanderlaufen, und sie war der Grund,
   warum Code Connect nichts hatte, worauf es zeigen konnte. */
export type ButtonVariant = 'filled' | 'ghost' | 'icon'

export function Button({
  children,
  variant = 'filled',
  className = '',
  type = 'button',
  onPointerDown,
  ...rest
}: {
  variant?: ButtonVariant
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = ['btn',
    variant === 'ghost' ? 'ghost' : '',
    variant === 'icon' ? 'icon-btn' : '',
    className].filter(Boolean).join(' ')
  return (
    <button
      className={cls}
      type={type}
      /* Beruehrung beim DRUECKEN, nicht beim Loslassen: der Finger
         liegt noch auf, und die Rueckmeldung liest sich als Kontakt
         mit dem Knopf. Das Loslassen traegt schon die Feder — beides
         zu belegen macht aus einem Druck zwei Ereignisse.

         Nur der gefuellte Knopf. Der Geisterknopf ist die leise
         Zweitwahl und der Symbolknopf sitzt in der Navigation; beiden
         eine Haptik zu geben hiesse, sie an alles zu haengen, und dann
         bedeutet sie nichts mehr. */
      onPointerDown={(e) => {
        if (variant === 'filled' && !rest.disabled) hapticPress()
        onPointerDown?.(e)
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ---------- Screen-Huelle ----------
   Inaktive Screens liegen weiter im DOM (fuer die Ueberblendung),
   werden aber `inert` gesetzt: sonst laufen Tabulator und VoiceOver
   durch unsichtbare Buttons. */
export function Screen({ active, children }: { active: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  useInert(ref, !active)

  /* Wer gerade abtritt, geht in die Gegenrichtung. Ohne diese
     Unterscheidung traegt `.screen` nur einen Versatz, und der
     abtretende Screen zoege dorthin zurueck, woher der neue kommt —
     beide liefen aufeinander zu. Nach einem Screenwechsel (dur-screen)
     faellt die Markierung wieder weg, damit ein spaeter erneut
     geoeffneter Screen wieder von vorn einlaeuft.

     Die Markierung entsteht im Render, nicht in einem Effekt danach.
     Bis zum 2026-09-24 kam sie ein Bild zu spaet: fuer dieses Bild lief
     der abtretende Screen in die falsche Richtung los, und seit Screens
     ohne Markierung geparkt werden (siehe `.screen` in global.css),
     waere er in diesem Bild ganz verschwunden. Wer zurueckkommt, bevor
     die 460ms um sind, verliert sie sofort wieder. */
  const [wasActive, setWasActive] = useState(active)
  const [leaving, setLeaving] = useState(false)
  if (wasActive !== active) {
    setWasActive(active)
    setLeaving(!active)
  }
  useEffect(() => {
    if (!leaving) return
    const t = window.setTimeout(() => setLeaving(false), 460)
    return () => window.clearTimeout(t)
  }, [leaving])

  /* Beim Betreten oben anfangen. Alle Screens bleiben gemountet, damit
     die Ueberblendung laeuft — ohne diesen Griff zeigt ein Screen, der
     schon einmal offen war, noch die Scrollposition von damals.
     Layout-Effekt: sonst steht das erste Bild noch an der alten Stelle
     und springt dann. */
  useLayoutEffect(() => {
    if (!active || !ref.current) return
    ref.current
      .querySelectorAll<HTMLElement>('.home-scroll, .flow-scroll, .plan-slide')
      .forEach((el) => {
        el.scrollTop = 0
      })
  }, [active])

  return (
    <section
      ref={ref}
      className={`screen${active ? ' active' : ''}${leaving ? ' leaving' : ''}`}
    >
      {children}
    </section>
  )
}

/* ---------- Fortschritt im Abschluss-Ablauf ----------
   Vier Schritte von der Tarifwahl bis zur aktiven eSIM. Ohne diese
   Anzeige weiss niemand, wie viel nach der Identifizierung noch
   kommt — und genau dort brechen Anmeldungen ab. */
const FLOW_LABELS = ['Tarif', 'Bestellung', 'Identität', 'eSIM']

export function FlowSteps({ current }: { current: number }) {
  return (
    <ol className="flow-steps" aria-label={`Schritt ${current + 1} von ${FLOW_LABELS.length}: ${FLOW_LABELS[current]}`}>
      {FLOW_LABELS.map((label, i) => (
        <li
          key={label}
          className={i < current ? 'done' : i === current ? 'now' : ''}
          aria-current={i === current ? 'step' : undefined}
        >
          <i aria-hidden="true" />
          <span>{label}</span>
        </li>
      ))}
    </ol>
  )
}

/* ---------- Auswahlzeile ----------
   Glas-Kachel als Radio. Wird fuer Rufnummer, Zahlungsart und
   Ident-Verfahren benutzt, damit die drei Entscheidungen im
   Checkout gleich aussehen und gleich bedient werden. */
export function OptionRow({
  selected,
  onSelect,
  title,
  meta,
  badge,
  aside,
  disabled,
  children,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  meta?: string
  badge?: string
  aside?: string
  /** Eine Option, die gerade nicht geht — etwa Video-Ident nachts.
      Sie bleibt sichtbar und erklaert sich, statt zu verschwinden:
      sonst sucht der Nutzer sie beim naechsten Mal vergeblich. */
  disabled?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className={`opt${selected ? ' on' : ''}${disabled ? ' off' : ''}`}>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        aria-disabled={disabled || undefined}
        className="opt-btn"
        onClick={() => !disabled && onSelect()}
      >
        <span className="opt-mark" aria-hidden="true" />
        <span className="opt-tx">
          <span className="opt-title">
            {title}
            {badge && <span className="chip">{badge}</span>}
          </span>
          {meta && <span className="opt-meta">{meta}</span>}
        </span>
        {aside && <span className="opt-aside">{aside}</span>}
      </button>
      {/* Zusatzfelder erscheinen erst, wenn die Zeile gewaehlt ist —
          sonst steht der Checkout voller inaktiver Eingaben. */}
      {selected && children && <div className="opt-extra">{children}</div>}
    </div>
  )
}

/* ---------- Beschriftetes Eingabefeld ---------- */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  type = 'text',
  autoComplete,
  inputRef,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: 'text' | 'tel' | 'numeric' | 'email'
  type?: string
  autoComplete?: string
  inputRef?: React.Ref<HTMLInputElement>
  /** Wird erst nach einem Absendeversuch gesetzt — niemand soll
      angemeckert werden, bevor er ueberhaupt tippen konnte. */
  error?: string
}) {
  const id = useRef(`f${Math.random().toString(36).slice(2, 9)}`).current
  const errId = `${id}-err`
  return (
    <label className={`field${error ? ' invalid' : ''}`} htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        ref={inputRef}
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <em id={errId} className="field-err">
          {error}
        </em>
      )}
    </label>
  )
}

/* ---------- Zustimmungszeile ----------
   Genau eine im ganzen Ablauf. Wer drei Haken nebeneinander stellt,
   bekommt drei Haken ohne gelesenen Text — die Zustimmung ist dann
   formal da und inhaltlich nichts wert. */
export function Consent({
  checked,
  onChange,
  inputRef,
  error,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  inputRef?: React.Ref<HTMLInputElement>
  error?: string
  children: React.ReactNode
}) {
  const id = useRef(`c${Math.random().toString(36).slice(2, 9)}`).current
  const errId = `${id}-err`
  return (
    <div className={`consent${error ? ' invalid' : ''}`}>
      <label htmlFor={id}>
        <input
          id={id}
          ref={inputRef}
          type="checkbox"
          checked={checked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="consent-box" aria-hidden="true">
          <svg viewBox="0 0 16 16">
            <path d="M3.5 8.5 6.5 11.5 12.5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="consent-tx">{children}</span>
      </label>
      {error && (
        <em id={errId} className="field-err">
          {error}
        </em>
      )}
    </div>
  )
}

/* ---------- Aufklappbarer Abschnitt ----------
   Fuer Inhalte, die vorliegen muessen, aber nicht jeden interessieren
   — die Vertragszusammenfassung ist der Fall, fuer den es gebaut ist. */
export function Disclosure({
  label,
  open,
  onToggle,
  children,
}: {
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className={`disclosure${open ? ' on' : ''}`}>
      <button type="button" className="disclosure-btn" aria-expanded={open} onClick={onToggle}>
        <span>{label}</span>
        <ChevronDown />
      </button>
      {open && <div className="disclosure-body">{children}</div>}
    </div>
  )
}

/* ---------- Statusmeldung fuer Screenreader ----------
   Toasts verschwinden nach zwei Sekunden. Ohne live-Region
   bekommt sie niemand mit, der den Screen nicht ansieht. */
export function LiveRegion({ message }: { message: string | null }) {
  return (
    <div className="sr-only" role="status" aria-live="polite">
      {message ?? ''}
    </div>
  )
}

/* ---------- Vorfuehr-Abkuerzung ----------
   Springt ueber den kompletten Abschluss (Onboarding, Tarifwahl, Bestellung,
   Ident, Aktivierung, eSIM) direkt in den Home-Screen. Bewusst kein .btn und
   bewusst gedaempft: Figma kennt dieses Element nicht, es gehoert zur
   Vorfuehrung — wie der Standort-Schalter im Profil-Sheet. */
export function DemoSkip({ onSkip, className = '' }: { onSkip: () => void; className?: string }) {
  return (
    <button
      type="button"
      className={`demo-skip${className ? ` ${className}` : ''}`}
      onClick={onSkip}
      title="Vorfuehrmodus: Anmeldung ueberspringen"
    >
      Demo: direkt zu Home
      {/* eigener Pfeil statt <ArrowRight />: der ist 24px und fest weiss,
          hier braucht es 16px in der gedaempften Textfarbe */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="M12 5l7 7-7 7" />
      </svg>
    </button>
  )
}

/* ---------- Aurora-Hintergrund ----------
   Verlaufsbild aus Figma (siehe global.css). Die frueheren vier
   weichgezeichneten CSS-Flaechen entfallen — das Bild ist exakt und auf
   dem Geraet schneller. */
export function BackgroundGradient() {
  return (
    <>
      <div className="bg-grad" />
      <div className="bg-noise" />
    </>
  )
}

/* ---------- iOS status bar ---------- */
export function StatusBar() {
  return (
    <div className="statusbar">
      <span className="time">9:41</span>
      <div className="icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="white">
          <rect x="0" y="7" width="3" height="5" rx="1" />
          <rect x="5" y="5" width="3" height="7" rx="1" />
          <rect x="10" y="2.5" width="3" height="9.5" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
          <path d="M8 8.4a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4z" />
          <path d="M8 4.2c1.7 0 3.2.7 4.3 1.8l-1.5 1.5A4 4 0 0 0 8 6.3a4 4 0 0 0-2.8 1.2L3.7 6A6 6 0 0 1 8 4.2z" />
          <path d="M8 0c2.8 0 5.4 1.1 7.3 3l-1.5 1.5A8.2 8.2 0 0 0 8 2.1c-2.3 0-4.3.9-5.8 2.4L.7 3A10.2 10.2 0 0 1 8 0z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="4" stroke="white" opacity=".35" fill="none" />
          <rect x="2" y="2" width="20" height="9" rx="2.5" fill="white" />
          <path d="M25 4.5v4a2.2 2.2 0 0 0 0-4z" fill="white" opacity=".4" />
        </svg>
      </div>
    </div>
  )
}

/* ---------- eSIM-Chip-Symbol ----------
   Figma 1330:1790: 38x38, Chipflaeche in Akzentrot, umlaufend je vier
   Kontaktpunkte. Wird nur auf der SIM-Karte verwendet. */
export function EsimIcon() {
  const dots = (
    <>
      <i /> <i /> <i /> <i />
    </>
  )
  return (
    <div className="esim-icon">
      <div className="dots top">{dots}</div>
      <div className="dots bottom">{dots}</div>
      <div className="dots left">{dots}</div>
      <div className="dots right">{dots}</div>
      <div className="sq" />
      <div className="inner">e</div>
    </div>
  )
}

/* ---------- Monogramm ----------
   Der Anfangsbuchstabe statt eines Profilfotos (seit 2026-09-24, von
   Niclas beauftragt). Ein Mobilfunkvertrag braucht kein Gesicht — und
   ein Foto, das der Kunde nie hochgeladen hat, waere ein erfundenes
   Detail. Derselbe Buchstabe steht auf Home (als Knopf) und im Kopf
   des Konto-Sheets (als Zeichen): es ist dieselbe Person. */
export function Monogram({ name }: { name: string }) {
  return (
    <span className="monogram" aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

/* ---------- eSIM card (Figma "E-Sim Card") ----------
   Ohne Zeichen im Kopf. Hier stand bis zum 2026-07-27 ein Vodafone-
   Kreis (raus, weil Figma ihn nicht hat) und am 2026-09-17 kurz das
   NOURA-Zeichen — das aber aus zwei Gruenden auch nicht taugt:

   · Ein nacktes N neben einem Versalwort liest sich als weiterer
     Buchstabe. "CONNECT N" ist kein Tarif mit Logo, sondern ein Wort
     mit Schreibfehler.
   · Auf der SVG-Karte des eSIM-Ablaufs gibt es keinen Textfluss. Die
     Position musste aus der Zeichenzahl geschaetzt werden, und die
     Schaetzung war bei CONNECT zu kurz — das Zeichen lag auf dem T.

   Die Marke steht auf diesem Screen ohnehin schon: als Wortmarke im
   Kopf von Home und als Zeichen auf dem Intro. Eine dritte Stelle
   braucht sie nicht.

   ---------------------------------------------------------------
   EINE Karte durch den ganzen Ablauf (2026-09-24). Vorher gab es
   vier: ein graues Figma-Bild mit NOURA- und Vodafone-Zeichen im
   Onboarding und beim Login, diese Karte bei Tarifwahl und auf Home,
   und dazwischen die SVG-Karte der Fertigung mit eigenem Material,
   heller Kontur und dem Namen des Inhabers — den sie auf Home dann
   wieder verlor. Der Kunde sah vier Gegenstaende statt einem.

   Jetzt ist es ein Objekt in vier Zustaenden:

     Rohling      Onboarding           nur Koerper und eSIM-Zeichen
     Tarif        Tarifwahl            + Name, Preis, Etikett
     seine        Fertigung            + graviertes Namensfeld
     aktiv        Home, Plan, Login    + "Aktiv" statt Etikett

   Die SVG-Karte in esim-forge.tsx zeichnet dieselben Masse nach —
   wer hier etwas aendert, zieht sie mit. */
export function SimCard({
  plan,
  chipText,
  holder,
  onClick,
}: {
  /** Ohne Tarif: der Rohling — die Karte, bevor sie jemandem gehoert. */
  plan?: Plan
  chipText?: string | null
  /** Der Inhaber. Graviert, wie ihn die Fertigung eingebrannt hat. */
  holder?: string
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className={`sim-card ${plan?.key ?? 'blank'}`} onClick={onClick}>
      {plan && (
        <div className="head">
          <span className="name">{plan.name}</span>
          {chipText && <span className="chip">{chipText}</span>}
        </div>
      )}
      {holder && (
        /* Gleiche Zellenbreite je Zeichen wie die Gravur der Fertigung
           (ENGRAVE_CELL) — sonst saesse der Name nach der Landung auf
           Home anders als dort, wo er eingebrannt wurde. Vorgelesen
           wird er einmal am Stueck, nicht Buchstabe fuer Buchstabe. */
        <span className="holder">
          <span className="sr-only">{holder}</span>
          {holder.toUpperCase().split('').map((c, i) => (
            <i key={i} aria-hidden="true">{c === ' ' ? '\u00a0' : c}</i>
          ))}
        </span>
      )}
      <div className="foot">
        {plan && (
          <div>
            <div className="price">{plan.price}</div>
            <div className="sub">Deine 5G eSIM, jeden Monat kündbar</div>
          </div>
        )}
        <EsimIcon />
      </div>
    </Tag>
  )
}

/* ---------- Feature list ---------- */
export function FeatureList({ plan }: { plan: Plan }) {
  return (
    <div className="feat-list">
      {plan.features.map((f) => (
        <div className="feat" key={f}>
          {/* Figma: gefuellter weisser Punkt in einem 24x24-Feld, kein Haekchen */}
          <span className="ic">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="5" fill="currentColor" />
            </svg>
          </span>
          <span>{f}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- Common icons ---------- */
/* Alle Symbole zeichnen in currentColor, nicht in festem Weiss: sonst
   laesst sich die Farbe nicht vom Kontext setzen — die Verbrauchs-Icons
   koennen ueber .usage .card svg akzentrot werden, diese vier konnten
   es nicht. Jeder Verwender setzt eine Farbe (.icon-plain, .btn,
   .section-toggle, .disclosure-btn). */
export const ArrowLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
)
export const ArrowRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
)
export const Plus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const Close = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)
export const ChevronDown = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
)
