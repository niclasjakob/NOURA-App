import { useEffect, useReducer, useRef, useState } from 'react'
import avatarMarcel from '../assets/img/avatar-marcel.webp'
import { PLANS } from '../data/plans'
import {
  HOLDER,
  ROAMING_ADDONS,
  fmtGb,
  type RoamZone,
  type RoamingState,
} from '../data/account'
import {
  CODE_LEN,
  DROPS,
  FAIL_TEXT,
  FEATURED,
  dropState,
  minutesLeft,
  normalizeCode,
  spotsLeft,
  type Drop,
  type MagicPass,
  type RedeemFail,
  type RedeemResult,
} from '../data/magic'
import { Button, Close, FeatureList, SimCard } from '../components/ui'
import { MagicTicket } from '../components/magic-pass'
import { AllowanceRing } from '../components/roaming'
import { useDialog, useDragToDismiss, useInert } from '../hooks/a11y'

export type SheetId = 'support' | 'profile' | 'plan' | 'roaming' | 'magic' | null

/* ---------- Sheet-Huelle ----------
   Vorher liess sich ein Sheet nur ueber den Hintergrund schliessen,
   der Fokus blieb dahinter stehen, und die Knoepfe geschlossener
   Sheets waren weiter mit der Tabulatortaste erreichbar. Hier jetzt:
   Fokusfalle, Escape, sichtbarer Schliessen-Knopf, Ziehgeste am
   Griff — und `inert`, solange das Sheet unten liegt. */
function Sheet({
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

  return (
    <div
      ref={ref}
      className={`sheet${open ? ' on' : ''}`}
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

/* ================= Support (chat) ================= */
interface ChatMsg {
  text: string
  me: boolean
}

export function SupportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { text: `Hey ${HOLDER.first}!\nWie möchtest Du Hilfe erhalten?`, me: false },
  ])
  const [showQuick, setShowQuick] = useState(true)
  const [input, setInput] = useState('')

  const reply = (text: string, delay = 850) =>
    window.setTimeout(() => setMessages((m) => [...m, { text, me: false }]), delay)

  const pick = (label: string) => {
    setShowQuick(false)
    setMessages((m) => [...m, { text: label, me: true }])
    reply(
      label.includes('Anruf')
        ? 'Alles klar! Wir rufen Dich heute zwischen 16–18 Uhr zurück. Passt das für Dich?'
        : 'Super! Ich bin für Dich da. Worum geht es denn?',
    )
  }

  const send = () => {
    const v = input.trim()
    if (!v) return
    setShowQuick(false)
    setMessages((m) => [...m, { text: v, me: true }])
    setInput('')
    reply('Danke für Deine Nachricht! Ein Mitarbeiter meldet sich in wenigen Minuten bei Dir. 💬')
  }

  return (
    <Sheet id="supportSheet" open={open} label="Support" onClose={onClose}>
      <div className="sheet-body">
        <div className="chat-area" role="log" aria-label="Chatverlauf" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={`bubble${m.me ? ' me' : ''}`}>
              {m.text}
            </div>
          ))}
          {showQuick && (
            /* Figma: rechtsbuendig untereinander, wie eigene Nachrichten */
            <div className="quick-replies">
              <Button onClick={() => pick('Einen Anruf anfordern')}>
                Einen Anruf anfordern
              </Button>
              <Button onClick={() => pick('Chatte mit uns')}>
                Chatte mit uns
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="chat-input">
        <input
          type="text"
          aria-label="Nachricht schreiben"
          placeholder="Nachricht schreiben..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="send" aria-label="Senden" onClick={send}>
          {/* Figma: Papierflieger-Symbol, 18x18 */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" />
            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </Sheet>
  )
}

/* ================= Profile ================= */
function ListRow({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  danger?: boolean
  onClick?: () => void
}) {
  return (
    <button className={`list-row${danger ? ' danger' : ''}`} onClick={onClick}>
      <span className="ic">{icon}</span>
      {label}
    </button>
  )
}

/* Figma: schlichter leerer Kreis vor jedem Listeneintrag */
const ic = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export function ProfileSheet({
  open,
  onClose,
  onLogout,
  roamZone,
  onRoamZone,
}: {
  open: boolean
  onClose: () => void
  onLogout: () => void
  roamZone: RoamZone
  onRoamZone: (z: RoamZone) => void
}) {
  return (
    <Sheet id="profileSheet" open={open} label="Dein Account" onClose={onClose}>
      <div className="sheet-body">
        <div className="acct-head">
          <div className="tx">
            <h2>Dein Account</h2>
            <p>Nächste Zahlung am 08.08.2026</p>
          </div>
          <img src={avatarMarcel} className="avatar" alt="" />
        </div>
        {/* Figma: zwei Karten mit Karten-Symbol, Label oben klein, Wert darunter */}
        <div className="quick-cards">
          <button className="qc">
            <span className="qc-icon">
              <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
                <rect x="0.5" y="0.5" width="27" height="19" rx="3" fill="rgba(255,255,255,.35)" />
                <rect x="3" y="4" width="12" height="3" rx="1.5" fill="rgba(255,255,255,.8)" />
                <rect x="3" y="13" width="8" height="2" rx="1" fill="rgba(255,255,255,.5)" />
              </svg>
            </span>
            <span className="qc-label">Dein Plan</span>
            <span className="qc-value">Create</span>
          </button>
          <button className="qc">
            <span className="qc-icon">
              <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
                <rect x="0.5" y="0.5" width="27" height="19" rx="3" fill="rgba(255,255,255,.35)" />
                <rect x="3" y="4" width="7" height="5" rx="1" fill="#f5c542" />
                <rect x="3" y="13" width="8" height="2" rx="1" fill="rgba(255,255,255,.5)" />
              </svg>
            </span>
            <span className="qc-label">Deine Karte</span>
            <span className="qc-value">*9876</span>
          </button>
        </div>
        <div className="list-section">
          <h3>Sonstiges</h3>
          <ListRow icon={ic()} label="Sicherheit und Datenschutz" />
          <ListRow icon={ic()} label="Benachrichtigungen" />
          <ListRow icon={ic()} label="Ansichtsmodus" />
        </div>
        <div className="list-section">
          <h3>Service</h3>
          <ListRow icon={ic()} label="Hilfe" />
          <ListRow icon={ic()} label="Dokumente" />
          <ListRow icon={ic()} label="Abmelden" danger onClick={onLogout} />
        </div>

        {/* ---- Vorfuehr-Schalter ----
            Im Echtbetrieb kommt die Zone vom Netz. Damit sich die
            Reiseansicht ohne Flugticket zeigen laesst, steht hier ein
            klar als Prototyp gekennzeichneter Umschalter. */}
        <div className="list-section demo-sec">
          <h3>Prototyp</h3>
          <p className="demo-note">Standort simulieren — im Echtbetrieb erkennt die App das Netz selbst.</p>
          <div className="demo-switch" role="radiogroup" aria-label="Standort simulieren">
            {(
              [
                ['home', 'Zuhause'],
                ['eu', 'EU'],
                ['world', 'Welt'],
              ] as [RoamZone, string][]
            ).map(([z, label]) => (
              <button
                key={z}
                role="radio"
                aria-checked={roamZone === z}
                className={roamZone === z ? 'on' : ''}
                onClick={() => onRoamZone(z)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 40 }} />
      </div>
    </Sheet>
  )
}

/* ================= Roaming ================= */
export function RoamingSheet({
  open,
  onClose,
  roaming,
  onBuyAddon,
}: {
  open: boolean
  onClose: () => void
  roaming: RoamingState
  onBuyAddon: (gb: number) => void
}) {
  const world = roaming.zone === 'world'
  const total = roaming.allowanceGb ?? 0
  /* Ohne Kontingent im Tarif und ohne zugebuchtes Paket gibt es
     nichts anzuzeigen — dann ist die Frage nicht "wie viel ist noch
     da", sondern "wie komme ich hier ins Netz". */
  const worldEmpty = world && total === 0

  return (
    <Sheet id="roamingSheet" open={open} label="Reisen" onClose={onClose}>
      <div className="sheet-body">
        <div className="plan-sheet-head">
          <h2>Reisen</h2>
          <p>
            {roaming.flag} {roaming.country} · {roaming.network}
          </p>
        </div>

        {roaming.zone === 'home' && (
          <div className="card roam-info">
            <p className="roam-lead">Du bist im Heimatnetz — es gelten Deine normalen Tarifleistungen.</p>
            {/* Die Zahlen kommen aus dem Tarif, nicht aus einem festen
                Text: fuer CONNECT stand hier vorher ein Weltkontingent,
                das es in dem Tarif nicht gibt. */}
            <ul className="roam-rules">
              <li>
                <b>In der EU</b> surfst Du zum Inlandspreis. Bei unbegrenzten Tarifen gilt eine
                Fair-Use-Grenze von {fmtGb(roaming.euFupGb, 0)} pro Monat — danach 0,25 € je GB.
              </li>
              <li>
                <b>Weltweit</b>{' '}
                {roaming.includedGb > 0
                  ? `sind ${fmtGb(roaming.includedGb, 0)} pro Monat enthalten, danach 4,99 € je GB.`
                  : 'ist in Deinem Tarif nichts enthalten. Du buchst vor der Reise ein Paket ab 4,99 € dazu.'}
              </li>
            </ul>
          </div>
        )}

        {roaming.zone === 'eu' && (
          <div className="card roam-info">
            {/* "Unbegrenzt in der EU" waere die bequeme Formulierung
                und schlicht falsch: die Verordnung (EU) 2022/612 laesst
                bei unbegrenzten Inlandstarifen eine Fair-Use-Grenze zu.
                Sie hier zu nennen kostet einen Satz — sie zu verschweigen
                kostet den Kunden. */}
            <p className="roam-lead">
              EU-Roaming ist aktiv. Du surfst zum Inlandspreis, ohne Aufschlag.
            </p>
            <AllowanceRing used={roaming.euUsedGb} total={roaming.euFupGb} run={open} />
            <div className="roam-stat">
              <span className="label">Diesen Monat genutzt</span>
              <span className="val">
                {fmtGb(roaming.euUsedGb)} / {fmtGb(roaming.euFupGb, 0)}
              </span>
            </div>
            <p className="roam-fine">
              Die Grenze ergibt sich aus Deinem Tarifpreis und ist gesetzlich vorgegeben.
              Darüber hinaus kostet ein GB 0,25 € — abgeschaltet wird nichts. Anrufe und SMS
              in EU-Netze deckt Deine Allnet-Flat ab.
            </p>
          </div>
        )}

        {worldEmpty && (
          <div className="card roam-info">
            <p className="roam-lead">
              In Deinem Tarif ist außerhalb der EU kein Datenvolumen enthalten.
            </p>
            <p className="roam-fine">
              Wir schalten nichts automatisch zu und stellen Dir nichts in Rechnung. Buch ein
              Paket, wenn Du es brauchst — es ist sofort aktiv.
            </p>
          </div>
        )}

        {world && !worldEmpty && (
          <div className="card roam-info center">
            <AllowanceRing used={roaming.usedGb} total={total} run={open} />
            <p className="roam-lead">
              {fmtGb(roaming.usedGb)} von {fmtGb(total, 0)} Weltdaten genutzt
            </p>
            <p className="roam-fine">
              Danach {roaming.extraPerGb} je GB. Wir schalten nichts automatisch zu — Du entscheidest.
            </p>
          </div>
        )}

        {/* Steht auch dann da, wenn der Tarif kein Weltvolumen hat —
            genau dann braucht der Reisende es naemlich. */}
        {world && (
          <div className="list-section">
            <h3>Datenpaket zubuchen</h3>
            <div className="addons">
              {ROAMING_ADDONS.map((a) => (
                <button key={a.key} className="addon" onClick={() => onBuyAddon(a.gb)}>
                  <span className="addon-gb">{a.gb} GB</span>
                  <span className="addon-price">{a.price}</span>
                  <span className="addon-note">{a.note}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </Sheet>
  )
}

/* ================= Magic Code — Konzeptseite und Einloesung =================
   Die Kachel auf Home zeigt eine Wolke aus Codes, die sich staendig
   neu formiert. Was sie behauptet, muss diese Seite einloesen: Woher
   kommen die Codes, warum halten sie nur kurz, und was bringt einer.

   Seit dem 2026-09-04 bringt einer tatsaechlich etwas. Vorher quittierte
   die Eingabe jede Zeichenfolge mit demselben Toast — vier Zeichen rein,
   eine freundliche Luege raus. Jetzt laeuft der Code gegen die Drops in
   `data/magic.ts` und endet in einem Zugang, den man vorzeigen kann.

   Das Sheet hat deshalb zwei Ansichten: die Eingabe mit der Erklaerung,
   und den Zugang. Kein zweites Sheet dafuer — ein Zugang ist das
   Ergebnis dieses Ablaufs und nicht sein eigenes Thema.

   Achtung: Die Seite bleibt ein Konzeptvorschlag, kein abgestimmtes
   Produkt. Laufzeit (60 Minuten), Stueckzahl und die drei Vorteile sind
   gesetzt, damit der Prototyp etwas Konkretes zeigt — sie sind das
   erste, was im Review zur Diskussion steht. */

/* Symbole in Akzentrot, wie ueberall in der App. */
const IcFestival = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v3" />
    <path d="M12 6 3 20h18z" />
    <path d="M12 6v14" />
  </svg>
)
const IcConcert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18V5l11-2v13" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </svg>
)
const IcMeetup = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.8 19a6.2 6.2 0 0 1 12.4 0" />
    <path d="M16 5.4a3.2 3.2 0 0 1 0 5.2M17.5 13.4A6.2 6.2 0 0 1 21.2 19" />
  </svg>
)

/* Kurz halten: drei Kacheln nebeneinander sind je rund 100px breit,
   jedes zweite Wort bricht dort um.

   Kein Datenvolumen und kein Roaming mehr (entfernt am 2026-09-04, von
   Niclas beauftragt): Gigabyte kann jeder Anbieter draufpacken, ein Platz
   im Raum nicht. Ein Code oeffnet ab hier ausschliesslich Tueren. */
const PERKS = [
  { icon: <IcFestival />, title: 'Festivals', note: 'Slots und Backstage' },
  { icon: <IcConcert />, title: 'Konzerte', note: 'Gästeliste statt VVK' },
  { icon: <IcMeetup />, title: 'Meet-ups', note: 'Plätze bei Creators' },
]

const STEPS = [
  {
    title: 'Code entdecken',
    text: 'Creator geben sie im Stream aus, Freunde schicken sie weiter, auf Events hängen sie an der Wand. Auf Deiner Startseite siehst Du, was gerade kursiert.',
  },
  {
    title: 'Vier Zeichen eintippen',
    text: 'Kein Formular, keine Verknüpfung. Der Code prüft sich in dem Moment, in dem Du ihn eingibst.',
  },
  {
    title: 'Zugang liegt sofort bereit',
    text: 'Du bekommst Deinen Einlass-Code auf der Stelle — ohne Vorverkauf, ohne Bestätigungsmail. Er liegt danach auf Deiner Startseite.',
  },
]

/* Wie lange ein Code noch gilt, in einem Wort. Die Restzahl ist die
   eigentliche Nachricht jeder Zeile — mehr als eine Zeile bekommt sie
   nicht. */
function dropNote(d: Drop, passes: MagicPass[]): string {
  if (passes.some((p) => p.id === d.id)) return 'schon eingelöst'
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

export function MagicSheet({
  open,
  onClose,
  onRedeem,
  onNotice,
  passes,
  focusPassId,
}: {
  open: boolean
  onClose: () => void
  /** Prueft und legt bei Erfolg den Zugang an — die Zugaenge liegen in App. */
  onRedeem: (code: string) => RedeemResult
  onNotice: (text: string) => void
  passes: MagicPass[]
  /** Von Home aus: dieser Zugang wird direkt gezeigt. */
  focusPassId: string | null
}) {
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [fail, setFail] = useState<RedeemFail | null>(null)
  const [shown, setShown] = useState<string | null>(null)
  const [reminded, setReminded] = useState(false)
  const checkRef = useRef<number>(0)

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
    setCode('')
    setFail(null)
    setChecking(false)
    return () => window.clearTimeout(checkRef.current)
  }, [open, focusPassId])

  const ready = code.length === CODE_LEN

  const submit = () => {
    if (!ready || checking) return
    setFail(null)
    setChecking(true)
    checkRef.current = window.setTimeout(() => {
      const res = onRedeem(code)
      setChecking(false)
      if (res.ok) {
        setShown(res.pass.id)
        setCode('')
      } else {
        setFail(res.reason)
      }
    }, CHECK_MS)
  }

  const pass = shown ? passes.find((p) => p.id === shown) ?? null : null

  /* ---- Ansicht 2: der Zugang ---- */
  if (pass) {
    return (
      <Sheet id="magicSheet" open={open} label="Dein Zugang" onClose={onClose}>
        <div className="sheet-body">
          <div className="plan-sheet-head">
            <h2>Du stehst auf der Liste</h2>
            {/* Der Wechsel der Ansicht ist visuell offensichtlich und fuer
                VoiceOver sonst gar nichts — deshalb hier als Meldung. */}
            <p role="status">
              {pass.drop.title} · {pass.drop.when}
            </p>
          </div>

          <MagicTicket pass={pass} />

          <div className="pass-actions">
            <Button
              onClick={() => onNotice('Im Kalender vorgemerkt — wir erinnern Dich am Vortag.')}
            >
              Im Kalender merken
            </Button>
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

  /* ---- Ansicht 1: Eingabe und Erklaerung ---- */
  return (
    <Sheet id="magicSheet" open={open} label="Magic Code" onClose={onClose}>
      <div className="sheet-body">
        <div className="plan-sheet-head">
          <h2>Magic Code</h2>
          <p>Zutritt statt Gigabyte: Festivals, Konzerte und Meet-ups — kurz gültig, streng
            begrenzt, ständig neu im Umlauf.</p>
        </div>

        <div className="card magic-redeem">
          <span className="label">Code einlösen</span>
          <div className="magic-entry">
            <input
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
              {FAIL_TEXT[fail]}
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
        </div>

        {/* ---- Vorfuehr-Hilfe ----
            Ein Code, den man raten muesste, macht den Ablauf unvorfuehrbar:
            32^4 sind ueber eine Million Moeglichkeiten. Die Liste steht
            deshalb sichtbar als Prototyp-Block da — wie der Standort-
            Umschalter im Profil — und zeigt bewusst auch die Codes, die
            scheitern. Ein Ablauf, den man nur im Gutfall sieht, ist im
            Review nur die halbe Wahrheit. */}
        <div className="list-section demo-sec">
          <h3>Prototyp</h3>
          <p className="demo-note">
            Im Echtbetrieb kursieren Codes im Stream, unter Freunden oder auf dem Gelände. Hier
            stehen sie zum Antippen — samt der Fälle, in denen es nicht klappt.
          </p>
          <ul className="code-list">
            {DROPS.map((d) => (
              <li key={d.id}>
                <button
                  className="code-chip"
                  onClick={() => {
                    setCode(d.code)
                    setFail(null)
                  }}
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

        <div className="list-section">
          <h3>Was ein Code bringt</h3>
          <div className="magic-perks">
            {PERKS.map((p) => (
              <div key={p.title} className="card magic-perk">
                <span className="ic">{p.icon}</span>
                <b>{p.title}</b>
                <span className="note">{p.note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="list-section">
          <h3>Ein Drop in freier Wildbahn</h3>
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
              <i style={{ transform: `scaleX(${open ? FEATURED.taken / FEATURED.spots : 0})` }} />
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
        </div>

        <div className="list-section">
          <h3>Auch gerade im Umlauf</h3>
          <ul className="drop-list">
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

        <div className="list-section">
          <h3>Warum sie sich ständig ändern</h3>
          <div className="card magic-why">
            <p className="roam-lead">
              Jeder Magic Code lebt 60 Minuten und existiert in fester Stückzahl. Ist sie
              aufgebraucht, ist er weg — und der nächste sieht schon wieder anders aus.
            </p>
            <ul className="roam-rules">
              <li>
                <b>Fälschungssicher:</b> Ein abfotografierter Code ist eine Stunde später wertlos.
              </li>
              <li>
                <b>Kein Gutschein-Portal:</b> Was sich nicht sammeln lässt, lässt sich auch nicht
                weiterverkaufen.
              </li>
              <li>
                <b>Wieder persönlich:</b> Wer teilt, teilt mit Menschen, die gerade zuhören.
              </li>
            </ul>
            <p className="magic-fine">
              Der Zugang, den Du damit holst, bleibt — er hängt nicht an der Laufzeit des Codes.
            </p>
          </div>
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

/* ================= Current plan ================= */
export function PlanSheet({
  open,
  onClose,
  planIdx,
  onSwitchPlan,
  onCancelPlan,
}: {
  open: boolean
  onClose: () => void
  planIdx: number
  onSwitchPlan: () => void
  onCancelPlan: () => void
}) {
  const plan = PLANS[planIdx]
  return (
    <Sheet id="planSheet" open={open} label="Dein aktueller Plan" onClose={onClose}>
      <div className="sheet-body">
        <div className="plan-sheet-head">
          <h2>Dein aktueller Plan</h2>
          <p>Wechsel oder kündige Deinen Plan</p>
        </div>
        <SimCard plan={plan} chipText="Aktiv" />
        <div className="features-block" style={{ marginTop: 32, paddingBottom: 0 }}>
          <h3>Deine Features</h3>
          <p className="desc">{plan.desc}</p>
          <FeatureList plan={plan} />
        </div>
        <div className="plan-sheet-actions">
          {/* Figma: Glas-Button, nicht rot gefuellt */}
          <Button onClick={onSwitchPlan}>
            Plan wechseln
          </Button>
          <button className="link-danger" onClick={onCancelPlan}>
            Plan kündigen
          </button>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </Sheet>
  )
}
