import { useState } from 'react'
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
    { text: 'Hey Marcel! Wie möchtest Du Hilfe erhalten?', me: false },
  ])
  const [showQuick, setShowQuick] = useState(true)
  const [input, setInput] = useState('')

  const reply = (text: string, delay = 850) =>
    window.setTimeout(() => setMessages((m) => [...m, { text, me: false }]), delay)

  const pick = (label: string) => {
    setShowQuick(false)
    setMessages((m) => [...m, { text: label, me: true }])
    reply(
      label.includes('Rückruf')
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
            <div className="quick-replies">
              <button className="btn" onClick={() => pick('Rückruf vereinbaren')}>📞&ensp;Rückruf vereinbaren</button>
              <button className="btn" onClick={() => pick('Chat starten')}>💬&ensp;Chat starten</button>
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
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

const ic = (path: string) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d={path} />
  </svg>
)

export function ProfileSheet({ open, onLogout }: { open: boolean; onLogout: () => void }) {
  return (
    <Sheet id="profileSheet" open={open} label="Dein Account">
      <div className="sheet-body">
        <div className="acct-head">
          <div className="tx">
            <h2>Dein Account</h2>
            <p>Nächste Zahlung am 08.08.2026</p>
          </div>
          <span className="avatar" style={{ cursor: 'default' }} />
        </div>
        <div className="quick-cards">
          <button className="qc">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
            </svg>
            Mein Profil
          </button>
          <button className="qc">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2h9l5 5v15H6z" />
              <path d="M15 2v5h5" />
              <path d="M9 13h6M9 17h6" />
            </svg>
            Rechnungen
          </button>
        </div>
        <div className="list-section">
          <h3>Sonstiges</h3>
          <ListRow icon={ic('M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z')} label="Sicherheit und Datenschutz" />
          <ListRow icon={ic('M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9')} label="Benachrichtigungen" />
          <ListRow icon={ic('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3')} label="Ansichtsmodus" />
        </div>
        <div className="list-section">
          <h3>Service</h3>
          <ListRow icon={<span>?</span>} label="Hilfe" />
          <ListRow icon={ic('M6 2h9l5 5v15H6z')} label="Dokumente" />
          <ListRow icon={ic('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9')} label="Abmelden" danger onClick={onLogout} />
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
          <button className="btn primary" onClick={onSwitchPlan}>Plan wechseln</button>
          <button className="link-danger" onClick={onCancelPlan}>Plan kündigen</button>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </Sheet>
  )
}
