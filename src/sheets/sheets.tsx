import { useEffect, useReducer, useRef, useState } from 'react'
import { PLANS, planTitle, type Plan } from '../data/plans'
import { CYCLE, HOLDER, fmtDate, payLabel, type Payment, type Receipt } from '../data/account'
import {
  CODE_LEN,
  DROPS,
  FEATURED,
  FRIEND_CODES,
  MY_INVITE,
  dropState,
  failText,
  minutesLeft,
  normalizeCode,
  perksFor,
  spotsLeft,
  type Drop,
  type MagicPass,
  type RedeemMiss,
  type RedeemResult,
} from '../data/magic'
import { Button, Close, FeatureList, SimCard } from '../components/ui'
import { MagicTicket } from '../components/magic-pass'
import { useDialog, useDragToDismiss, useInert } from '../hooks/a11y'
import { hapticError, hapticSelection, hapticSuccess, setHapticsOn } from '../lib/haptics'
import { ACCT_PAGE_TITLE, DEFAULT_SETTINGS, type AcctPage } from '../data/settings'
import {
  AppearancePage,
  DocsPage,
  HelpPage,
  NotificationsPage,
  PaymentPage,
  SecurityPage,
  type DocKey,
  type Settings,
} from './account-pages'
import { SupportChat } from './support-chat'
import type { ChatJump } from '../data/support'

export type SheetId = 'support' | 'profile' | 'plan' | 'magic' | 'confirm' | 'usage' | null

/* ---------- Sheet-Huelle ----------
   Vorher liess sich ein Sheet nur ueber den Hintergrund schliessen,
   der Fokus blieb dahinter stehen, und die Knoepfe geschlossener
   Sheets waren weiter mit der Tabulatortaste erreichbar. Hier jetzt:
   Fokusfalle, Escape, sichtbarer Schliessen-Knopf, Ziehgeste am
   Griff — und `inert`, solange das Sheet unten liegt.

   Exportiert fuer das Bestaetigungs-Sheet (confirm-sheet.tsx). */
export function Sheet({
  id,
  open,
  label,
  onClose,
  children,
}: {
  id: string
  open: boolean
  label: string
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useDialog<HTMLDivElement>(open, onClose)
  useInert(ref, !open)
  const drag = useDragToDismiss(ref, onClose)

  /* Geparkt, sobald das Sheet unten angekommen ist. Fuenf Sheets liegen
     dauerhaft im DOM, nur aus dem Bild geschoben — und damit auch ihre
     34 Glasflaechen samt Weichzeichner und die Schleifen darin (der
     Puls im Magic-Sheet lief ohne Unterbrechung). Beim Oeffnen faellt
     die Markierung im selben Render, das Sheet faehrt also ungeparkt
     herein; beim Schliessen erst nach dem Abgang (--dur-move, 320ms). */
  const [parked, setParked] = useState(!open)
  if (open && parked) setParked(false)
  useEffect(() => {
    if (open) return
    const t = window.setTimeout(() => setParked(true), 360)
    return () => window.clearTimeout(t)
  }, [open])

  return (
    <div
      ref={ref}
      className={`sheet${open ? ' on' : ''}${parked ? ' parked' : ''}`}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
    >
      {/* Der Griff war bisher reine Dekoration — ein Griff, den man
          nicht ziehen kann, ist ein gebrochenes Versprechen. */}
      <div className="sheet-grip" {...drag}>
        <div className="handle" />
      </div>
      <button className="sheet-close" aria-label={`${label} schließen`} onClick={onClose}>
        <Close />
      </button>
      {children}
    </div>
  )
}

/* ================= Support (chat) =================
   Die Huelle hier, das Gespraech in support-chat.tsx — wie bei den
   Kontoseiten. */
export function SupportSheet({
  open,
  onClose,
  plan,
  onJump,
}: {
  open: boolean
  onClose: () => void
  plan: Plan
  onJump: (to: ChatJump) => void
}) {
  return (
    <Sheet id="supportSheet" open={open} label="Support" onClose={onClose}>
      <SupportChat open={open} plan={plan} onJump={onJump} />
    </Sheet>
  )
}

/* ================= Profile ================= */
function ListRow({
  icon,
  label,
  danger,
  nav,
  page,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  danger?: boolean
  /** Fuehrt auf eine Seite: dann steht rechts der Pfeil. Bis zum
      2026-09-24 fuehrte keine Zeile irgendwohin, und keine sagte es. */
  nav?: boolean
  /** Die Seite, die sie oeffnet — daran findet Zurueck die Zeile wieder. */
  page?: AcctPage
  onClick?: () => void
}) {
  return (
    <button className={`list-row${danger ? ' danger' : ''}`} data-page={page} onClick={onClick}>
      <span className="ic">{icon}</span>
      {label}
      {nav && (
        <span className="chev" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      )}
    </button>
  )
}

/* Figma: schlichter leerer Kreis vor jedem Listeneintrag */
/* Zeichen der Kontozeilen. Figma setzt hier leere Kreise als Platzhalter —
   im Code lasen die sich als nicht gewaehlte Optionsfelder. Gezeichnet in
   derselben Sprache wie die Verbrauchskarten auf Home: 24er Raster,
   Kontur 1.8, runde Enden. */
const ROW_ICONS = {
  security: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  appearance: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.5c-.6.2-.9.7-.9 1.3v.6" />
      <path d="M12 17h.01" strokeWidth="2.4" />
    </>
  ),
  docs: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3" />
      <path d="M14 8l4 4-4 4M18 12H9" />
    </>
  ),
}

const ic = (name: keyof typeof ROW_ICONS) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {ROW_ICONS[name]}
  </svg>
)

/* ---------- Navigation im Konto-Sheet ----------
   Die Unterseiten schieben sich von rechts herein, die Liste weicht
   nach links — der iOS-Stapel, im Sheet statt als zweites Sheet
   (Begruendung in account-pages.tsx). Zurueck geht per Knopf oder
   per Wischen vom linken Rand.

   `page` ist, was gerade zu sehen ist; `shown` ist, was im rechten
   Fach gezeichnet wird. Die beiden trennen sich beim Zurueckgehen:
   die Seite muss noch zu sehen sein, waehrend sie hinausgleitet. */
const EDGE = 28 /* Breite der Randzone, in der Wischen zurueck beginnt */
const SWIPE_BACK = 90

export function ProfileSheet({
  open,
  onClose,
  onLogout,
  onOpenSupport,
  onOpenPlan,
  planIdx,
  payment,
  receipts,
}: {
  open: boolean
  onClose: () => void
  onLogout: () => void
  /** Schliesst dieses Sheet und oeffnet den Chat — ein Sheet zur Zeit. */
  onOpenSupport: () => void
  onOpenPlan: () => void
  planIdx: number
  /** Die Zahlart aus dem Checkout — nicht mehr eine erfundene Karte. */
  payment: Payment
  /** Bestaetigungen fuer Wechsel und Kuendigung. */
  receipts: Receipt[]
}) {
  const [page, setPage] = useState<AcctPage | null>(null)
  const [shown, setShown] = useState<AcctPage | null>(null)
  const [doc, setDoc] = useState<DocKey | null>(null)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  const rootRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLDivElement>(null)
  const subBody = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  /* Die Zeile, ueber die der Stapel betreten wurde. Nicht aus
     document.activeElement: Safari fokussiert Knoepfe beim Tippen
     nicht, dort stuende sonst das Sheet selbst. */
  const entry = useRef<AcctPage | null>(null)
  useInert(rootRef, page !== null)
  useInert(subRef, page === null)

  const set = (key: string, on: boolean) => {
    setSettings((s) => ({ ...s, [key]: on }))
    if (key === 'haptics') {
      setHapticsOn(on)
      /* Beim Einschalten einmal tippen: so fuehlt man, was man gerade
         eingeschaltet hat. Beim Ausschalten nicht — das waere das
         Gegenteil dessen, was gewuenscht ist. */
      if (on) hapticSelection()
    }
  }

  /* Wer eine Seite oeffnet, landet auf ihrem Titel — der Screenreader
     sagt, wo er ist. preventScroll aus demselben Grund wie in
     useDialog: die Seite gleitet noch herein. */
  const go = (p: AcctPage, openDoc: DocKey | null = null) => {
    if (page === null) entry.current = p
    setShown(p)
    setPage(p)
    setDoc(openDoc)
    if (subBody.current) subBody.current.scrollTop = 0
    window.setTimeout(() => titleRef.current?.focus({ preventScroll: true }), 60)
  }
  const back = () => {
    setPage(null)
    window.setTimeout(
      () =>
        rootRef.current
          ?.querySelector<HTMLElement>(`[data-page="${entry.current}"]`)
          ?.focus({ preventScroll: true }),
      60,
    )
  }

  /* Geschlossen beginnt das Sheet wieder bei der Liste — aber erst,
     wenn es unten ist. Sonst springt es waehrend des Abgangs um. */
  useEffect(() => {
    if (open) return
    const t = window.setTimeout(() => {
      setPage(null)
      setDoc(null)
    }, 340)
    return () => window.clearTimeout(t)
  }, [open])

  /* ---- Wischen zurueck ----
     Nur vom linken Rand aus und nur, wenn die Bewegung eher waagerecht
     ist: senkrecht gehoert der Finger der Liste, die scrollt. */
  const swipe = useRef<{ x: number; y: number; dx: number; live: boolean } | null>(null)
  const drag = (dx: number | null) => {
    const el = subRef.current
    if (!el) return
    el.style.transition = dx === null ? '' : 'none'
    el.style.transform = dx === null ? '' : `translateX(${dx}px)`
  }
  const onSwipeDown = (e: React.PointerEvent) => {
    const left = subRef.current?.getBoundingClientRect().left ?? 0
    if (page && e.clientX - left < EDGE) swipe.current = { x: e.clientX, y: e.clientY, dx: 0, live: false }
  }
  const onSwipeMove = (e: React.PointerEvent) => {
    const g = swipe.current
    if (!g) return
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (!g.live) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) swipe.current = null
      else if (dx > 10) {
        g.live = true
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      }
      return
    }
    g.dx = Math.max(0, dx)
    drag(g.dx)
  }
  const onSwipeUp = () => {
    const g = swipe.current
    swipe.current = null
    if (!g?.live) return
    drag(null)
    if (g.dx > SWIPE_BACK) back()
  }

  const plan = PLANS[planIdx]
  const content =
    shown === 'security' ? (
      <SecurityPage
        settings={settings}
        set={set}
        onOpenSupport={onOpenSupport}
        onOpenPrivacy={() => go('docs', 'privacy')}
      />
    ) : shown === 'notifications' ? (
      <NotificationsPage settings={settings} set={set} />
    ) : shown === 'appearance' ? (
      <AppearancePage settings={settings} set={set} />
    ) : shown === 'help' ? (
      <HelpPage onOpenSupport={onOpenSupport} />
    ) : shown === 'docs' ? (
      <DocsPage
        plan={plan}
        receipts={receipts}
        open={doc}
        onOpen={setDoc}
        onOpenSecurity={() => go('security')}
      />
    ) : shown === 'payment' ? (
      <PaymentPage plan={plan} payment={payment} onOpenSupport={onOpenSupport} />
    ) : null

  return (
    <Sheet id="profileSheet" open={open} label="Dein Account" onClose={onClose}>
      <div className={`acct-nav${page ? ' deep' : ''}`}>
      <div className="acct-pane root" ref={rootRef}>
      <div className="sheet-body">
        <div className="acct-head">
          <div className="tx">
            <h2>Dein Account</h2>
            <p>Nächste Zahlung am {fmtDate(CYCLE.invoiceDate)}</p>
          </div>
        </div>
        {/* Figma: zwei Karten mit Karten-Symbol, Label oben klein, Wert darunter */}
        <div className="quick-cards">
          <button className="qc" onClick={onOpenPlan}>
            <span className="qc-icon">
              <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
                <rect x="0.5" y="0.5" width="27" height="19" rx="3" fill="rgba(255,255,255,.35)" />
                <rect x="3" y="4" width="12" height="3" rx="1.5" fill="rgba(255,255,255,.8)" />
                <rect x="3" y="13" width="8" height="2" rx="1" fill="rgba(255,255,255,.5)" />
              </svg>
            </span>
            <span className="qc-label">Dein Tarif</span>
            <span className="qc-value">{planTitle(PLANS[planIdx])}</span>
          </button>
          {/* Zeigt die Zahlart, die im Checkout gewaehlt wurde, und fuehrt
              zu ihr. Bis zum 2026-09-25 stand hier "Deine Karte *9876" —
              auch nach einer Bestellung per Lastschrift — und der Tipp
              ging ins Leere. */}
          <button className="qc" data-page="payment" onClick={() => go('payment')}>
            <span className="qc-icon">
              <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
                <rect x="0.5" y="0.5" width="27" height="19" rx="3" fill="rgba(255,255,255,.35)" />
                <rect x="3" y="4" width="7" height="5" rx="1" fill="#f5c542" />
                <rect x="3" y="13" width="8" height="2" rx="1" fill="rgba(255,255,255,.5)" />
              </svg>
            </span>
            <span className="qc-label">Zahlung</span>
            <span className="qc-value">{payLabel(payment)}</span>
          </button>
        </div>
        <div className="list-section">
          <h3>Einstellungen</h3>
          <ListRow icon={ic('security')} label={ACCT_PAGE_TITLE.security} nav page="security" onClick={() => go('security')} />
          <ListRow icon={ic('bell')} label={ACCT_PAGE_TITLE.notifications} nav page="notifications" onClick={() => go('notifications')} />
          <ListRow icon={ic('appearance')} label={ACCT_PAGE_TITLE.appearance} nav page="appearance" onClick={() => go('appearance')} />
        </div>
        <div className="list-section">
          <h3>Hilfe und Vertrag</h3>
          <ListRow icon={ic('help')} label={ACCT_PAGE_TITLE.help} nav page="help" onClick={() => go('help')} />
          <ListRow icon={ic('docs')} label={ACCT_PAGE_TITLE.docs} nav page="docs" onClick={() => go('docs')} />
          <ListRow icon={ic('logout')} label="Abmelden" danger onClick={onLogout} />
        </div>
        <div style={{ height: 40 }} />
      </div>
      </div>

      <div
        className="acct-pane sub"
        ref={subRef}
        onPointerDown={onSwipeDown}
        onPointerMove={onSwipeMove}
        onPointerUp={onSwipeUp}
        onPointerCancel={onSwipeUp}
      >
        <div className="sheet-body" ref={subBody}>
          <button type="button" className="acct-back" onClick={back}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            Account
          </button>
          <h2 className="acct-title" ref={titleRef} tabIndex={-1}>
            {shown && ACCT_PAGE_TITLE[shown]}
          </h2>
          {content}
          <div style={{ height: 40 }} />
        </div>
      </div>
      </div>
    </Sheet>
  )
}

/* ================= Magic Codes — einloesen, halten, entdecken =================
   Die Kachel auf Home zeigt eine Wolke aus Codes. Was sie behauptet,
   loest diese Seite ein: Woher kommen die Codes, was bringt einer, und
   wo liegt, was man schon hat.

   Seit dem 2026-09-04 bringt ein Code tatsaechlich etwas (vorher
   quittierte jede Zeichenfolge mit demselben Toast). Seit dem
   2026-09-25 kommen Codes aus drei Quellen — Creators, Partner,
   Freunde —, und die Seite ist danach geordnet, was man hier tut:
   einloesen, ansehen, was man hat, entdecken, weitergeben. Die
   Erklaerkacheln ("Was ein Code bringt", "Warum sie sich aendern")
   sind in einen Satz unter "So funktioniert's" gewandert; neun
   Abschnitte in einem Scroll waren zu viele.

   Zwei Ansichten, kein zweites Sheet: die Eingabe mit allem darum,
   und der Zugang. Ein Zugang ist das Ergebnis dieses Ablaufs, nicht
   sein eigenes Thema.

   Achtung: Konzeptvorschlag, kein abgestimmtes Produkt. Laufzeiten,
   Stueckzahlen, Partner und Vorteile sind gesetzt, damit der Prototyp
   etwas Konkretes zeigt. */

const STEPS = [
  {
    title: 'Code bekommen',
    text: 'Creators geben sie im Stream aus, Partner in ihren Kanälen, Freunde schicken Dir ihren eigenen.',
  },
  {
    title: 'Vier Zeichen eintippen',
    text: 'Kein Formular, keine Verknüpfung. Der Code prüft sich in dem Moment, in dem Du ihn eingibst.',
  },
  {
    title: 'Zugang liegt sofort bereit',
    text: 'Ohne Vorverkauf, ohne Bestätigungsmail. Er liegt danach auf Deiner Startseite.',
  },
]

/* Wie lange ein Code noch gilt, in einem Wort. Die Restzahl ist die
   eigentliche Nachricht jeder Zeile — mehr als eine Zeile bekommt sie
   nicht. */
function dropNote(d: Drop, passes: MagicPass[]): string {
  if (passes.some((p) => p.id === d.id)) return 'schon eingelöst'
  if (d.source === 'friend') return 'Einladung · läuft nicht ab'
  if (d.source === 'partner') return 'dauerhaft'
  const state = dropState(d, passes)
  if (state === 'expired') return 'abgelaufen'
  if (state === 'full') return 'vergriffen'
  return `noch ${minutesLeft(d)} min · ${spotsLeft(d, passes)} frei`
}

/* Die Pruefung dauert im Prototyp nichts. Ein halbe Sekunde Wartezeit
   ist trotzdem richtig: ohne sie erscheint die Antwort im selben Bild
   wie der Tastendruck, und ein Ergebnis, das schon da war, bevor man
   gedrueckt hat, liest sich nicht als Pruefung. */
const CHECK_MS = 520

const INVITE_TEXT = `Mein NOURA-Einladungscode: ${MY_INVITE}. Damit stehen wir beide auf der Gästeliste des nächsten Community-Abends.`

export function MagicSheet({
  open,
  onClose,
  onRedeem,
  onNotice,
  passes,
  focusPassId,
  plan,
  prefill = null,
}: {
  open: boolean
  onClose: () => void
  /** Ein Code, der schon im Feld stehen soll — aus einem Link. */
  prefill?: string | null
  /** Prueft und legt bei Erfolg den Zugang an — die Zugaenge liegen in App. */
  onRedeem: (code: string) => RedeemResult
  onNotice: (text: string) => void
  passes: MagicPass[]
  /** Von Home aus: dieser Zugang wird direkt gezeigt. */
  focusPassId: string | null
  /** Der Tarif entscheidet, welche Partner-Vorteile hier stehen. */
  plan: Plan
}) {
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [fail, setFail] = useState<RedeemMiss | null>(null)
  const [shown, setShown] = useState<string | null>(null)
  const [reminded, setReminded] = useState(false)
  const checkRef = useRef<number>(0)
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /* Die Restlaufzeit steht an jedem Code. Ohne Takt bliebe sie stehen,
     und die Behauptung "60 Minuten" waere im laufenden Sheet
     unbelegt. Halbminuetlich reicht fuer eine Anzeige in Minuten. */
  const [, tick] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    if (!open) return
    const iv = window.setInterval(tick, 30_000)
    return () => window.clearInterval(iv)
  }, [open])

  /* Jedes Oeffnen faengt sauber an: von Home aus beim gewaehlten Zugang,
     ueber die Kachel bei der Eingabe. Ein stehengebliebener Fehler aus
     der letzten Sitzung waere sonst das Erste, was man sieht. */
  useEffect(() => {
    if (!open) return
    setShown(focusPassId)
    setCode(prefill ?? '')
    setFail(null)
    setChecking(false)
    return () => window.clearTimeout(checkRef.current)
  }, [open, focusPassId, prefill])

  const ready = code.length === CODE_LEN

  const submit = () => {
    if (!ready || checking) return
    setFail(null)
    setChecking(true)
    checkRef.current = window.setTimeout(() => {
      const res = onRedeem(code)
      setChecking(false)
      if (res.ok) {
        /* Angenommen und abgelehnt sind die beiden Momente, an denen
           dieser Ablauf entscheidet. Die Ablehnung begleitet den
           Ruettler, den das Feld ohnehin zeigt — Regel 1: nie das
           einzige Signal. */
        hapticSuccess()
        setShown(res.pass.id)
        setCode('')
      } else {
        hapticError()
        setFail(res)
      }
    }, CHECK_MS)
  }

  /* Einen oeffentlichen Code aus der Liste uebernehmen: nach oben, ins
     Feld — eingeloest wird mit demselben Knopf wie jeder andere Code. */
  const take = (c: string) => {
    setCode(c)
    setFail(null)
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    bodyRef.current?.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), smooth ? 320 : 0)
  }

  /* Teilen ueber das System-Sheet, wo es eines gibt; sonst in die
     Zwischenablage. Ein abgebrochenes Teilen ist kein Fehler. */
  const share = () => {
    if (typeof navigator.share === 'function') {
      navigator.share({ text: INVITE_TEXT }).catch(() => {})
      return
    }
    const copied = () => onNotice('Einladungscode kopiert.')
    const fallback = () => onNotice(`Dein Einladungscode: ${MY_INVITE}`)
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(INVITE_TEXT).then(copied, fallback)
    else fallback()
  }

  const pass = shown ? passes.find((p) => p.id === shown) ?? null : null
  const other = PLANS.find((p) => p.key !== plan.key)

  /* ---- Ansicht 2: der Zugang ---- */
  if (pass) {
    const perk = pass.drop.source === 'partner'
    return (
      <Sheet id="magicSheet" open={open} label="Dein Zugang" onClose={onClose}>
        <div className="sheet-body">
          <div className="plan-sheet-head">
            <h2>{perk ? 'Dein Vorteil liegt bereit' : 'Du stehst auf der Liste'}</h2>
            {/* Der Wechsel der Ansicht ist visuell offensichtlich und fuer
                VoiceOver sonst gar nichts — deshalb hier als Meldung. */}
            <p role="status">
              {pass.drop.title} · {pass.drop.when}
            </p>
          </div>

          <MagicTicket pass={pass} />

          <div className="pass-actions">
            {/* Ein Kalendereintrag hat nur bei einem Termin Sinn — ein
                Vorteil, der dauerhaft gilt, braucht keinen. */}
            {!perk && (
              <Button
                onClick={() => onNotice('Im Kalender vorgemerkt — wir erinnern Dich am Vortag.')}
              >
                Im Kalender merken
              </Button>
            )}
            <Button
              onClick={() => {
                setShown(null)
                setFail(null)
              }}
            >
              Weiteren Code einlösen
            </Button>
          </div>

          <p className="magic-fine">
            Der Zugang bleibt bestehen, auch wenn der Code, mit dem Du ihn geholt hast, längst
            abgelaufen ist. Du findest ihn jederzeit auf Deiner Startseite.
          </p>

          <div style={{ height: 40 }} />
        </div>
      </Sheet>
    )
  }

  /* ---- Ansicht 1: Eingabe und alles darum ---- */
  return (
    <Sheet id="magicSheet" open={open} label="Magic Codes" onClose={onClose}>
      <div className="sheet-body" ref={bodyRef}>
        <div className="plan-sheet-head">
          <h2>Magic Codes</h2>
          {/* Derselbe Satz wie im Onboarding und in der Hilfe. */}
          <p>Vier Zeichen von Creators, Partnern oder Freunden. Eingelöst liegt der Zugang auf Home.</p>
        </div>

        <div className="card magic-redeem">
          <span className="label">Code einlösen</span>
          <div className="magic-entry">
            <input
              ref={inputRef}
              className={`magic-input${fail ? ' bad' : ''}`}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={CODE_LEN}
              placeholder="XXXX"
              aria-label="Vierstelligen Magic Code eingeben"
              aria-invalid={fail !== null}
              aria-describedby={fail ? 'magic-error' : undefined}
              value={code}
              /* Nur Zeichen, die es im Code ueberhaupt gibt — I, O, 0
                 und 1 sind auf dem Display nicht zu unterscheiden und
                 kommen deshalb gar nicht erst vor. */
              onChange={(e) => {
                setCode(normalizeCode(e.target.value))
                setFail(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <Button disabled={!ready || checking} aria-busy={checking || undefined} onClick={submit}>
              {checking ? 'Prüfe…' : 'Einlösen'}
            </Button>
          </div>

          {fail ? (
            /* role="alert" statt eines Toasts: die Meldung gehoert an das
               Feld, das sie ausgeloest hat, und muss stehenbleiben, bis
               der naechste Versuch laeuft. */
            <p className="magic-error" id="magic-error" role="alert">
              {failText(fail)}
            </p>
          ) : (
            <p className="magic-fine">
              Vier Zeichen, kein Antrag, keine Wartezeit — der Platz gehört Dir, sobald der Code
              sitzt.
            </p>
          )}
        </div>

        {passes.length > 0 && (
          <div className="list-section">
            <h3>Deine Zugänge</h3>
            <ul className="drop-list">
              {passes.map((p) => (
                <li key={p.id}>
                  <button className="card drop-row pass-row" onClick={() => setShown(p.id)}>
                    <div className="drop-top">
                      <span className="drop-kind">{p.drop.kind}</span>
                      <span className="drop-left">Zugang gültig</span>
                    </div>
                    <b>{p.drop.title}</b>
                    <span className="drop-when">{p.drop.when}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="list-section">
          <h3>Gerade live</h3>
          <div className="card magic-event">
            <div className="event-head">
              <span className="event-avatar" aria-hidden="true">{FEATURED.initials}</span>
              <div className="event-who">
                <b>{FEATURED.creator}</b>
                <span>{FEATURED.handle} · CREATE</span>
              </div>
              <span className="event-live">
                <i aria-hidden="true" />
                Heute 19:00
              </span>
            </div>

            <div className="event-title">{FEATURED.title}</div>
            <div className="event-meta">
              <span>{FEATURED.when}</span>
              <span>{FEATURED.place}</span>
            </div>
            <p className="event-text">{FEATURED.text}</p>

            <div className="event-spots">
              <span className="label">Plätze</span>
              <span className="event-left">
                {FEATURED.spots - FEATURED.taken} von {FEATURED.spots} frei
              </span>
            </div>
            {/* Derselbe Balken wie im Abrechnungszeitraum — hier zeigt er
                Knappheit statt Zeit, die Leseweise ist dieselbe. */}
            <div
              className="event-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={FEATURED.spots}
              aria-valuenow={FEATURED.taken}
              aria-label={`${FEATURED.taken} von ${FEATURED.spots} Plätzen vergeben`}
            >
              <i style={{ '--f': FEATURED.taken / FEATURED.spots } as React.CSSProperties} />
            </div>

            <Button
              disabled={reminded}
              onClick={() => {
                setReminded(true)
                onNotice('Wir melden uns 10 Minuten vor dem Code-Drop.')
              }}
            >
              {reminded ? 'Erinnerung steht' : 'Erinnere mich zum Drop'}
            </Button>
          </div>

          <ul className="drop-list magic-drops">
            {/* Abgelaufene Drops stehen nicht mehr im Umlauf — ihr Code
                funktioniert oben trotzdem noch als Vorfuehrung des
                Fehlerfalls. */}
            {DROPS.filter((d) => minutesLeft(d) > 0).map((d) => (
              <li key={d.id} className="card drop-row">
                <div className="drop-top">
                  <span className="drop-kind">{d.kind}</span>
                  {/* Die Restzahl ist die eigentliche Nachricht der Zeile —
                      deshalb steht sie oben rechts und nicht im Fliesstext. */}
                  <span className="drop-left">{dropNote(d, passes)}</span>
                </div>
                <b>{d.title}</b>
                <span className="drop-detail">{d.detail}</span>
                <span className="drop-when">{d.when}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- Partner-Vorteile ----
            Oeffentliche Codes, dauerhaft, an den Tarif gebunden — dieselbe
            Auswahl, die die Tarifwahl als "Magic Codes öffnen" nennt. Ein
            Tipp uebernimmt den Code ins Feld oben. */}
        <div className="list-section">
          <h3>Vorteile mit {planTitle(plan)}</h3>
          <p className="magic-fine magic-lead">
            Partner geben diese Codes öffentlich aus. Mit {planTitle(plan)} öffnen sie {plan.magicScope}.
          </p>
          <ul className="code-list">
            {perksFor(plan.key).map((d) => (
              <li key={d.id}>
                <button
                  className="code-chip"
                  onClick={() => take(d.code)}
                  aria-label={`Code ${d.code.split('').join(' ')} für ${d.title} übernehmen`}
                >
                  {d.code}
                </button>
                <span className="code-what">
                  <b>{d.title}</b>
                  <span>
                    {d.detail} · {dropNote(d, passes)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {other && (
            <p className="magic-fine">
              Mit {planTitle(other)}: {other.magicScope}.
            </p>
          )}
        </div>

        {/* ---- Freunde einladen ----
            Die dritte Quelle (Pitch-Deck, "Referral Codes"): privat
            weitergegeben, dasselbe Feld, dasselbe Alphabet. */}
        <div className="list-section">
          <h3>Freunde einladen</h3>
          <div className="card invite-card">
            <span className="label">Dein Einladungscode</span>
            <span className="invite-code" aria-label={`Einladungscode ${MY_INVITE.split('').join(' ')}`}>
              {MY_INVITE}
            </span>
            <p className="magic-fine">
              Wer mit Deinem Code zu NOURA kommt, steht mit Dir auf der Gästeliste des nächsten
              Community-Abends.
            </p>
            <Button onClick={share}>Code teilen</Button>
          </div>
        </div>

        <div className="list-section">
          <h3>So funktioniert's</h3>
          <ol className="magic-steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="n" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <b>{s.title}</b>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="magic-fine magic-after">
            Creator-Codes leben 60 Minuten und haben feste Stückzahlen — ein abfotografierter Code
            ist eine Stunde später wertlos. Partner-Codes gelten dauerhaft in ihrem Tarif. Dein
            Zugang bleibt, auch wenn der Code abläuft.
          </p>
        </div>

        {/* ---- Vorfuehr-Hilfe ----
            Ein Code, den man raten muesste, macht den Ablauf unvorfuehrbar:
            32^4 sind ueber eine Million Moeglichkeiten. Die Liste steht
            deshalb sichtbar als Prototyp-Block da und zeigt bewusst auch
            die Codes, die scheitern. Ein Ablauf, den man nur im Gutfall sieht, ist im
            Review nur die halbe Wahrheit. */}
        <div className="list-section demo-sec">
          <h3>Prototyp</h3>
          <p className="demo-note">
            Im Echtbetrieb kursieren Codes im Stream, unter Freunden oder auf dem Gelände. Hier
            stehen sie zum Antippen — samt der Fälle, in denen es nicht klappt.
          </p>
          <ul className="code-list">
            {[...DROPS, ...FRIEND_CODES].map((d) => (
              <li key={d.id}>
                <button
                  className="code-chip"
                  onClick={() => take(d.code)}
                  aria-label={`Code ${d.code.split('').join(' ')} übernehmen`}
                >
                  {d.code}
                </button>
                <span className="code-what">
                  <b>{d.title}</b>
                  <span>{dropNote(d, passes)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card magic-creator">
          <span className="chip">CREATE</span>
          <b>Eigene Codes ausgeben</b>
          <p>
            Mit CREATE erzeugst Du Magic Codes für Deine Community: Stückzahl und Laufzeit legst
            Du fest, und Du siehst live, wie viele eingelöst wurden.
          </p>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </Sheet>
  )
}

/* ================= Dein Tarif =================
   Hiess bis zum 2026-09-25 "Dein aktueller Plan" — ein Ding, vier
   Woerter (Plan, Tarif, Plan anpassen, Dein Plan). Jetzt: Tarif.

   Wechseln fuehrt nicht mehr in den Neukunden-Ablauf, sondern ins
   Bestaetigungs-Sheet; Kuendigen ebenso, mit dem Wortlaut nach
   § 312k BGB. Was vorgemerkt oder gekuendigt ist, steht hier oben —
   mit dem Weg zurueck. */
export function PlanSheet({
  open,
  onClose,
  planIdx,
  pendingIdx,
  cancelled,
  onSwitchPlan,
  onCancelPlan,
  onUndoSwitch,
  onUndoCancel,
}: {
  open: boolean
  onClose: () => void
  planIdx: number
  /** Zum naechsten Abrechnungstag vorgemerkter Tarif, sonst null. */
  pendingIdx: number | null
  cancelled: boolean
  onSwitchPlan: () => void
  onCancelPlan: () => void
  onUndoSwitch: () => void
  onUndoCancel: () => void
}) {
  const plan = PLANS[planIdx]
  /* Jedes Oeffnen beginnt oben — dort steht, was vorgemerkt oder
     gekuendigt ist. Wer vom Bestaetigungs-Sheet mit "Fertig" hierher
     zurueckkommt, hatte vorher zum Kuendigen-Link gescrollt und saehe
     den neuen Zustand sonst nicht. */
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open && bodyRef.current) bodyRef.current.scrollTop = 0
  }, [open])
  return (
    <Sheet id="planSheet" open={open} label="Dein Tarif" onClose={onClose}>
      <div className="sheet-body" ref={bodyRef}>
        <div className="plan-sheet-head">
          <h2>Dein Tarif</h2>
          <p>Wechseln oder kündigen, jeden Monat</p>
        </div>

        {cancelled ? (
          <div className="card plan-note" role="status">
            <b>Gekündigt zum {fmtDate(CYCLE.end)}</b>
            <p>Bis dahin läuft alles weiter. Die Bestätigung liegt unter Account → Dokumente.</p>
            <button type="button" className="link-plain" onClick={onUndoCancel}>
              Kündigung zurücknehmen
            </button>
          </div>
        ) : pendingIdx !== null ? (
          <div className="card plan-note" role="status">
            <b>
              Ab {fmtDate(CYCLE.invoiceDate)}: {PLANS[pendingIdx].name}
            </b>
            <p>Bis dahin bleibt {plan.name}.</p>
            <button type="button" className="link-plain" onClick={onUndoSwitch}>
              Wechsel zurücknehmen
            </button>
          </div>
        ) : null}

        <SimCard plan={plan} chipText={cancelled ? 'Gekündigt' : 'Aktiv'} holder={HOLDER.full} />
        <div className="features-block" style={{ marginTop: 32, paddingBottom: 0 }}>
          <h3>Deine Features</h3>
          <p className="desc">{plan.desc}</p>
          <FeatureList plan={plan} />
        </div>
        <div className="plan-sheet-actions">
          {/* Figma: Glas-Button, nicht rot gefuellt */}
          {!cancelled && pendingIdx === null && <Button onClick={onSwitchPlan}>Tarif wechseln</Button>}
          {/* § 312k BGB: gut lesbar, mit nichts anderem beschriftet als
              "Verträge hier kündigen", fuehrt unmittelbar zur
              Bestaetigungsseite — und ist staendig verfuegbar. */}
          {!cancelled && (
            <button className="link-danger" onClick={onCancelPlan}>
              Verträge hier kündigen
            </button>
          )}
        </div>
        <div style={{ height: 24 }} />
      </div>
    </Sheet>
  )
}
