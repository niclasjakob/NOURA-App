/* ============================================================
   NOURA — Die Seiten hinter dem Konto-Sheet

   Sicherheit, Benachrichtigungen, Darstellung, Hilfe, Dokumente.
   Sie oeffnen sich IM Sheet, nicht als zweites Sheet darueber:

   > sheets.md › Best practices: "Display only one sheet at a time
   > from the main interface."
   > sheets.md › Anatomy: "The Back button lets people navigate … to
   > a parent view in a hierarchy. It isn't intended to dismiss a
   > sheet."

   Also Zurueck oben links, Schliessen bleibt oben rechts — und die
   Navigation selbst steht in ProfileSheet (sheets.tsx). Hier liegen
   nur die Inhalte.

   Flaechen nach den drei Stufen: die Gruppen sind Inhalt (Glas 10 %,
   Radius 16), der Schalter ist ein Bedienelement in der Zeile.
   ============================================================ */
import { useId, useState } from 'react'
import { Button, Disclosure } from '../components/ui'
import { planTitle, type Plan } from '../data/plans'
import { CYCLE, contractSummary } from '../data/account'
import {
  APPEARANCE,
  FAQ,
  NOTIFY_MARKETING,
  NOTIFY_SERVICE,
  SECURITY_DATA,
  SECURITY_SIGNIN,
  SECURITY_SIM,
  type Setting,
} from '../data/settings'
import { hapticSelection } from '../lib/haptics'

export type Settings = Record<string, boolean>
type SetSetting = (key: string, on: boolean) => void

/* ---------- Bausteine ---------- */

/** Ein Abschnitt: kleine Ueberschrift, darunter eine Glasgruppe, darunter
    optional eine Fussnote — der Aufbau einer iOS-Einstellungsliste. */
function Group({ title, foot, children }: { title?: string; foot?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="set-sec">
      {title && <h3>{title}</h3>}
      <div className="set-group">{children}</div>
      {foot && <p className="set-foot">{foot}</p>}
    </section>
  )
}

/* Der Schalter. Nur in einer Listenzeile, wie die HIG es verlangen:

   > toggles.md › Mobile: "Use the switch toggle style only in a list
   > row."

   Die Flaeche folgt der Tarifleiste (Entscheidung vom 2026-09-24):
   aus ist eine Mulde (--noura-well), an ist Glas (--noura-glass-active).
   Nicht Akzentrot — Akzent fuellt im System nur den Chip. Den Zustand
   traegt nicht die Farbe allein, sondern die Lage des Knopfs:

   > toggles.md › Best practices: "Avoid relying solely on different
   > colors to communicate state."

   Die ganze Zeile ist das Tippziel, nicht nur die 51x31 des Schalters.
   Vorgelesen wird der Titel als Name und die Notiz als Beschreibung —
   sonst hiesse der Schalter so lang wie sein Erklaersatz. */
function SwitchRow({ setting, on, onChange }: { setting: Setting; on: boolean; onChange: (on: boolean) => void }) {
  const id = useId()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={`${id}-l`}
      aria-describedby={`${id}-n`}
      className="set-row"
      onClick={() => {
        hapticSelection()
        onChange(!on)
      }}
    >
      <span className="set-tx">
        <span className="set-label" id={`${id}-l`}>{setting.label}</span>
        <span className="set-note" id={`${id}-n`}>{setting.note}</span>
      </span>
      <span className={`switch${on ? ' on' : ''}`} aria-hidden="true">
        <i />
      </span>
    </button>
  )
}

function Switches({ list, settings, set }: { list: Setting[]; settings: Settings; set: SetSetting }) {
  return (
    <>
      {list.map((s) => (
        <SwitchRow key={s.key} setting={s} on={settings[s.key]} onChange={(v) => set(s.key, v)} />
      ))}
    </>
  )
}

/** Eine Zeile, die nur etwas sagt: Titel links, Wert rechts. */
function InfoRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="set-row static">
      <span className="set-tx">
        <span className="set-label">{label}</span>
        {note && <span className="set-note">{note}</span>}
      </span>
      <span className="set-value">{value}</span>
    </div>
  )
}

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
)

/** Eine Zeile, die woanders hinfuehrt. */
function LinkRow({ label, note, onClick }: { label: string; note?: string; onClick: () => void }) {
  return (
    <button type="button" className="set-row" onClick={onClick}>
      <span className="set-tx">
        <span className="set-label">{label}</span>
        {note && <span className="set-note">{note}</span>}
      </span>
      <span className="set-chev">
        <Chevron />
      </span>
    </button>
  )
}

/* ---------- Sicherheit und Datenschutz ---------- */
export function SecurityPage({
  settings,
  set,
  onOpenSupport,
  onOpenPrivacy,
}: {
  settings: Settings
  set: SetSetting
  onOpenSupport: () => void
  onOpenPrivacy: () => void
}) {
  return (
    <>
      <Group title="Anmelden">
        <Switches list={SECURITY_SIGNIN} settings={settings} set={set} />
        {/* Kein Passwort-Feld: die HIG raten zu Passkeys statt Passwoertern
            (privacy.md › Protecting data). Der Zugang ist schon einer. */}
        <InfoRow label="Passkey" value="Aktiv" note="Kein Passwort, das jemand abfangen kann." />
      </Group>
      <Group title="Deine eSIM">
        <Switches list={SECURITY_SIM} settings={settings} set={set} />
        {/* Sperren ist ein Schritt mit Folgen — Du bist danach nicht mehr
            erreichbar. Der gehoert in ein Gespraech, nicht hinter einen
            Schalter, den man versehentlich trifft. */}
        <LinkRow
          label="iPhone verloren?"
          note="Wir sperren Deine eSIM sofort und schicken Dir eine neue."
          onClick={onOpenSupport}
        />
      </Group>
      <Group title="Deine Daten" foot="Beides ist ab Werk aus. Dein Vertrag funktioniert ohne.">
        <Switches list={SECURITY_DATA} settings={settings} set={set} />
        <LinkRow label="Datenschutzhinweise" onClick={onOpenPrivacy} />
      </Group>
    </>
  )
}

/* ---------- Benachrichtigungen ---------- */
export function NotificationsPage({ settings, set }: { settings: Settings; set: SetSetting }) {
  return (
    <>
      <Group title="Zu Deinem Vertrag">
        <Switches list={NOTIFY_SERVICE} settings={settings} set={set} />
        {/* Kein ausgegrauter Schalter: ein Schalter, der nicht schaltet,
            ist eine Frage ohne Antwort. Hier steht der Zustand als Wert. */}
        <InfoRow label="Sicherheit" value="Immer an" note="Neue Anmeldungen und Änderungen an Deiner eSIM." />
      </Group>
      <Group
        title="Werbung"
        foot={
          <>
            Ton, Sperrbildschirm und Fokus stellst Du in iOS ein:
            Einstellungen → Mitteilungen → NOURA.
          </>
        }
      >
        <Switches list={NOTIFY_MARKETING} settings={settings} set={set} />
      </Group>
    </>
  )
}

/* ---------- Darstellung ---------- */
export function AppearancePage({ settings, set }: { settings: Settings; set: SetSetting }) {
  return (
    <>
      <p className="set-lead">
        NOURA bleibt dunkel, auch wenn Dein iPhone hell eingestellt ist — die Farben der
        Aurora brauchen den dunklen Grund. Textgröße und „Bewegung reduzieren“ übernimmt
        die App aus iOS.
      </p>
      <Group title="Rückmeldung" foot="Ist die Systemhaptik in iOS aus, bleibt NOURA ebenfalls still.">
        <Switches list={APPEARANCE} settings={settings} set={set} />
      </Group>
    </>
  )
}

/* ---------- Hilfe ---------- */
export function HelpPage({ onOpenSupport }: { onOpenSupport: () => void }) {
  /* Eine Antwort zur Zeit: wer die naechste Frage oeffnet, hat die
     vorige gelesen. So bleibt der Chat-Knopf in Reichweite. */
  const [open, setOpen] = useState<number | null>(null)
  return (
    <>
      <section className="set-sec">
        <h3>Häufige Fragen</h3>
        <div className="faq">
          {FAQ.map((f, i) => (
            <Disclosure key={f.q} label={f.q} open={open === i} onToggle={() => setOpen(open === i ? null : i)}>
              <p className="faq-a">{f.a}</p>
            </Disclosure>
          ))}
        </div>
      </section>
      <section className="set-sec">
        <h3>Noch Fragen?</h3>
        <p className="set-lead">Schreib uns oder lass Dich zurückrufen — direkt aus der App.</p>
        <Button onClick={onOpenSupport}>Mit dem Support chatten</Button>
      </section>
    </>
  )
}

/* ---------- Dokumente ---------- */
export type DocKey = 'summary' | 'service' | 'privacy' | 'withdrawal'

const fmtDate = (d: Date) =>
  d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function DocsPage({
  plan,
  open,
  onOpen,
  onOpenSecurity,
}: {
  plan: Plan
  open: DocKey | null
  onOpen: (k: DocKey | null) => void
  onOpenSecurity: () => void
}) {
  const toggle = (k: DocKey) => onOpen(open === k ? null : k)
  return (
    <>
      {/* Wer gerade erst bestellt hat, hat noch keine Rechnung. Das steht
          hier als Datum, nicht als leere Liste. */}
      <Group title="Rechnungen">
        <InfoRow
          label="Erste Rechnung"
          value={fmtDate(CYCLE.invoiceDate)}
          note="Kommt per E-Mail und liegt dann hier."
        />
      </Group>

      <section className="set-sec">
        <h3>Dein Vertrag</h3>
        <div className="faq">
          {/* Dieselben Zeilen wie im Checkout — was dort unterschrieben
              wurde, steht hier wortgleich. */}
          <Disclosure label="Vertragszusammenfassung" open={open === 'summary'} onToggle={() => toggle('summary')}>
            <dl className="contract-list">
              {contractSummary(plan).map((r) => (
                <div key={r.label}>
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
          </Disclosure>
          <Disclosure
            label={`Leistungen ${planTitle(plan)}`}
            open={open === 'service'}
            onToggle={() => toggle('service')}
          >
            <ul className="doc-list">
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Disclosure>
          <Disclosure label="Datenschutzhinweise" open={open === 'privacy'} onToggle={() => toggle('privacy')}>
            <p className="faq-a">
              Name, Anschrift und Ausweisdaten brauchen wir für den Vertrag und die gesetzlich
              vorgeschriebene Identitätsprüfung. Verbindungsdaten nutzen wir für Abrechnung und
              Störungen. Auswertungen und persönliche Angebote nur, wenn Du sie einschaltest.
            </p>
            <button type="button" className="doc-link" onClick={onOpenSecurity}>
              Zu Sicherheit und Datenschutz
            </button>
          </Disclosure>
          <Disclosure label="Widerrufsbelehrung" open={open === 'withdrawal'} onToggle={() => toggle('withdrawal')}>
            <p className="faq-a">
              Du kannst den Vertrag 14 Tage lang ohne Grund widerrufen — eine Nachricht im Chat
              reicht. Weil Deine eSIM sofort startet, zahlst Du dann nur die Tage, die Du genutzt
              hast.
            </p>
          </Disclosure>
        </div>
        <p className="set-foot">Die vollständigen Fassungen haben wir Dir bei der Bestellung per E-Mail geschickt.</p>
      </section>
    </>
  )
}
