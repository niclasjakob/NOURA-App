import { useState } from 'react'
import avatarMarcel from '../assets/img/avatar-marcel.webp'
import { PLANS } from '../data/plans'
import { FeatureList, SimCard } from '../components/ui'

export type SheetId = 'support' | 'profile' | 'plan' | null

function Sheet({ id, open, label, children }: { id: string; open: boolean; label: string; children: React.ReactNode }) {
  return (
    <div className={`sheet${open ? ' on' : ''}`} id={id} role="dialog" aria-label={label} aria-hidden={!open}>
      <div className="handle" />
      {children}
    </div>
  )
}

/* ================= Support (chat) ================= */
interface ChatMsg {
  text: string
  me: boolean
}

export function SupportSheet({ open }: { open: boolean }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { text: 'Hey Marcel!\nWie möchtest Du Hilfe erhalten?', me: false },
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
    <Sheet id="supportSheet" open={open} label="Support">
      <div className="sheet-body">
        <div className="chat-area">
          {messages.map((m, i) => (
            <div key={i} className={`bubble${m.me ? ' me' : ''}`}>{m.text}</div>
          ))}
          {showQuick && (
            /* Figma: rechtsbuendig untereinander, wie eigene Nachrichten */
            <div className="quick-replies">
              <button className="btn" onClick={() => pick('Einen Anruf anfordern')}>Einen Anruf anfordern</button>
              <button className="btn" onClick={() => pick('Chatte mit uns')}>Chatte mit uns</button>
            </div>
          )}
        </div>
      </div>
      <div className="chat-input">
        <input
          type="text"
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
function ListRow({ icon, label, danger, onClick }: { icon: React.ReactNode; label: string; danger?: boolean; onClick?: () => void }) {
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

export function ProfileSheet({ open, onLogout }: { open: boolean; onLogout: () => void }) {
  return (
    <Sheet id="profileSheet" open={open} label="Dein Account">
      <div className="sheet-body">
        <div className="acct-head">
          <div className="tx">
            <h2>Dein Account</h2>
            <p>Nächste Zahlung am 08.07.2026</p>
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
        <div style={{ height: 40 }} />
      </div>
    </Sheet>
  )
}

/* ================= Current plan ================= */
export function PlanSheet({
  open,
  planIdx,
  onSwitchPlan,
  onCancelPlan,
}: {
  open: boolean
  planIdx: number
  onSwitchPlan: () => void
  onCancelPlan: () => void
}) {
  const plan = PLANS[planIdx]
  return (
    <Sheet id="planSheet" open={open} label="Dein aktueller Plan">
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
          <button className="btn" onClick={onSwitchPlan}>Plan wechseln</button>
          <button className="link-danger" onClick={onCancelPlan}>Plan kündigen</button>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </Sheet>
  )
}
