/* ============================================================
   NOURA — Der Support-Chat

   Figma (1330:2679) zeichnet den Anfang: eine Begruessung, zwei
   Antwortknoepfe rechts, das Eingabefeld unten. Alles danach ist neu
   und steht in keiner Vorlage — also fuehrt apple-design, und
   data/support.ts erklaert, warum der Assistent sagt, was er sagt.

   Die Bauart in drei Saetzen:

   · Rechts steht, was Du sagst oder sagen kannst. Deine Blasen UND
     die Antwortknoepfe — ein Knopf ist eine Antwort, die schon
     formuliert ist. Deshalb stehen auch die Rueckruf-Zeiten dort.
   · Links steht, wer antwortet, und darunter seine Karte. Die Karte
     ist Inhalt im Sheet, also Mulde (--noura-well), nicht Glas:
     "Inhalt IM Sheet ist dunkler als das Sheet" (Konto-Seiten,
     2026-09-24).
   · Warten zeigt, was gerade passiert: ein Satz und die Haarlinie,
     die das System fuer jedes Warten hat. Keine huepfenden Punkte —
     die sagen nur, dass etwas passiert, nicht was.

   Bewegung (2026-09-24): jede Animation sagt, woher etwas kommt oder
   was sich geaendert hat — sonst gibt es sie nicht (motion.md › Best
   practices: "Add motion purposefully"). Der getippte Knopf wandert
   in den Verlauf, weil er zur eigenen Nachricht WIRD. Die Karte folgt
   der Blase, weil sie zu ihr gehoert. Die Vorschlaege kommen zuletzt,
   weil sie erst nach der Antwort Sinn ergeben. Nichts davon haelt die
   Eingabe auf — getippt werden kann jederzeit.
   ============================================================ */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '../components/ui'
import { hapticSuccess } from '../lib/haptics'
import {
  CYCLE,
  HOLDER,
  VAT,
  fmtDate,
  fmtDayMonth,
  fmtEuro,
  fmtGb,
  usageSummary,
  type RoamingState,
} from '../data/account'
import { planTitle, type Plan } from '../data/plans'
import {
  AGENT,
  AGENT_REPLIES,
  CALLBACK_SLOTS,
  ESIM_STEPS,
  FALLBACK,
  QUEUE_MS,
  TEAM_HOURS,
  agentHello,
  answer,
  detect,
  greeting,
  startTopics,
  topicLabel,
  type ChatCard,
  type ChatJump,
  type SupportCtx,
  type Topic,
} from '../data/support'

type From = 'me' | 'bot' | 'agent' | 'sys'

interface Msg {
  id: number
  from: From
  text: string
  card?: ChatCard
  jump?: { to: ChatJump; label: string }
}

/** Was rechts unten zur Wahl steht. 'start' wird beim Zeichnen
    aufgeloest, nicht beim Setzen — wechselt der Standort, waehrend der
    Chat offen liegt, stimmen die Vorschlaege trotzdem. */
type Offer = { k: 'topics'; topics: Topic[] | 'start' } | { k: 'slots' } | { k: 'agent' } | null

type Mode = 'bot' | 'queue' | 'agent'

interface Booking {
  slot: string
  cancelled: boolean
}

/* ---- Takt ----
   Die Pruefung dauert im Prototyp nichts. Gewartet wird trotzdem —
   dieselbe Begruendung wie CHECK_MS im Magic-Sheet: eine Antwort, die
   im selben Bild wie der Tipp steht, liest sich nicht als Antwort.

   Bis zum 2026-09-24 waren es feste 900ms, und das war zu knapp: der
   Statussatz stand kaum lesbar da, und eine Antwort mit Karte kam so
   schnell wie ein "Gern!". Jetzt drei Schritte:

   1. ANKOMMEN (SEND_BEAT) — die eigene Nachricht landet, erst dann
      beginnt die Gegenseite. Ohne die Pause antworten beide zugleich.
   2. NACHSEHEN (think / typing) — waechst mit dem, was geantwortet
      wird. Eine Karte heisst: es wurde etwas nachgeschlagen.
   3. ANBIETEN (OFFER_BEAT) — die Vorschlaege erst, wenn die Antwort
      steht. Vorher waeren sie Antworten auf eine Frage, die noch
      niemand gestellt hat. */
const SEND_BEAT = 350
const OFFER_BEAT = 450
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const think = (text: string, looksUp: boolean) => clamp(1100 + text.length * 6 + (looksUp ? 350 : 0), 1200, 2200)
/** Ein Mensch tippt, er schlaegt nicht nach — also nach Laenge. */
const typing = (text: string) => clamp(1200 + text.length * 14, 1600, 3000)
/** Die anderen Vorschlaege gehen, bevor der gewaehlte losfliegt. */
const LEAVE_MS = 140

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export function SupportChat({
  open,
  plan,
  roaming,
  onJump,
}: {
  open: boolean
  plan: Plan
  roaming: RoamingState
  /** Schliesst den Chat und oeffnet das Ziel — ein Sheet zur Zeit. */
  onJump: (to: ChatJump) => void
}) {
  const ctx: SupportCtx = { first: HOLDER.first, phone: HOLDER.phone, plan, roaming, usage: usageSummary() }

  const nextId = useRef(1)
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ id: 0, from: 'bot', text: greeting(ctx) }])
  const [offer, setOffer] = useState<Offer>({ k: 'topics', topics: 'start' })
  const [pending, setPending] = useState<{ text: string; sys?: boolean } | null>(null)
  const [mode, setMode] = useState<Mode>('bot')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [input, setInput] = useState('')

  const bodyRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const lastRef = useRef<HTMLDivElement>(null)
  const agentTurn = useRef(0)
  /* Jede Antwort bekommt eine Marke. Nur die juengste raeumt das Warten
     weg und setzt die Vorschlaege — tippt jemand zweimal schnell, gilt
     das, was zur zweiten Nachricht gehoert. */
  const turn = useRef(0)
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  /* Die Nummer wird ausserhalb des Updaters vergeben: StrictMode ruft
     Updater doppelt auf, und der Flug unten sucht die Blase ueber
     genau diese Nummer. */
  const push = (m: Omit<Msg, 'id'>) => {
    const id = nextId.current++
    setMsgs((list) => [...list, { ...m, id }])
    return id
  }

  const respond = (
    a: { status: string; text: string; card?: ChatCard; jump?: Msg['jump'] },
    from: 'bot' | 'agent',
    then: Offer,
    after?: () => void,
  ) => {
    const mine = ++turn.current
    const wait = from === 'agent' ? typing(a.text) : think(a.text, Boolean(a.card || a.jump))
    setOffer(null)
    later(() => mine === turn.current && setPending({ text: a.status }), SEND_BEAT)
    later(() => {
      push({ from, text: a.text, card: a.card, jump: a.jump })
      after?.()
      if (mine !== turn.current) return
      setPending(null)
      later(() => mine === turn.current && setOffer(then), OFFER_BEAT)
    }, SEND_BEAT + wait)
  }

  /* ---- Themen ---- */
  const ask = (topic: Topic) => {
    if (topic === 'human') return handOff()
    if (topic === 'callback') {
      if (booking && !booking.cancelled)
        return respond(
          { status: 'Sieht nach Deinem Termin …', text: 'Du hast schon einen Rückruf:', card: 'booking' },
          'bot',
          { k: 'topics', topics: ['human'] },
        )
      return respond(
        { status: 'Sucht freie Zeiten …', text: `Gern. Wir rufen Dich unter ${ctx.phone} an — wann passt es Dir?` },
        'bot',
        { k: 'slots' },
      )
    }
    const a = answer(topic, ctx)
    respond(a, 'bot', { k: 'topics', topics: a.next })
  }

  /* ---- Rueckruf ----
     Die Buchung ist der eine folgenreiche Moment in diesem Chat, also
     traegt sie die Erfolgs-Haptik — im selben Augenblick, in dem die
     Karte erscheint (Regel 1: nie das einzige Signal). */
  const book = (slot: string) => {
    setBooking({ slot, cancelled: false })
    respond(
      { status: 'Trägt den Termin ein …', text: 'Steht. Zehn Minuten vorher bekommst Du eine Mitteilung.', card: 'booking' },
      'bot',
      { k: 'topics', topics: ['usage', 'bill'] },
      hapticSuccess,
    )
  }

  /* Absagen geht aus der Karte heraus, auch mitten im Gespraech mit
     Lea. Dann meldet es das System in einer Zeile — der Assistent
     spricht nicht mehr, und Lea hat es nicht getan. */
  const cancelBooking = () => {
    setBooking((b) => b && { ...b, cancelled: true })
    if (mode !== 'bot') return push({ from: 'sys', text: 'Rückruf abgesagt' })
    respond(
      { status: 'Sagt den Termin ab …', text: 'Abgesagt. Wenn Du doch reden willst, sag einfach Bescheid.' },
      'bot',
      { k: 'topics', topics: ['callback', 'human'] },
    )
  }

  /* ---- Uebergabe ----
     Die Warteschlange steht als Zeile in der Mitte, nicht als Blase:
     sie ist Zustand, kein Gespraechsbeitrag. Wer waehrenddessen
     schreibt, schreibt schon an den Menschen — der Assistent schweigt
     ab hier. */
  const handOff = () => {
    const mine = ++turn.current
    setOffer(null)
    setMode('queue')
    later(() => setPending({ text: 'Du bist in der Warteschlange — Platz 2', sys: true }), SEND_BEAT)
    later(
      () => mine === turn.current && setPending({ text: 'Platz 1 — gleich geht’s los', sys: true }),
      SEND_BEAT + QUEUE_MS[0],
    )
    later(() => {
      setPending(null)
      push({ from: 'sys', text: `${AGENT.name} aus dem ${AGENT.team} ist jetzt im Chat` })
      setMode('agent')
      respond({ status: `${AGENT.name} schreibt …`, text: agentHello(ctx) }, 'agent', { k: 'agent' })
    }, SEND_BEAT + QUEUE_MS[0] + QUEUE_MS[1])
  }

  const endAgent = () => {
    push({ from: 'sys', text: `Chat mit ${AGENT.name} beendet` })
    agentTurn.current = 0
    setMode('bot')
    respond({ status: 'Schreibt …', text: 'Ich bin wieder da. Sonst noch etwas?' }, 'bot', { k: 'topics', topics: 'start' })
  }

  /* ---- Eingaben ---- */
  /** `act`: eine Handlung, keine Nachricht — sie erscheint nicht als
      eigene Blase. */
  type Reply = { label: string; ghost?: boolean; act?: boolean; run: () => void }
  const replies: Reply[] =
    offer?.k === 'topics'
      ? (offer.topics === 'start' ? startTopics(ctx) : offer.topics).map((t) => ({
          label: topicLabel(t, ctx),
          run: () => ask(t),
        }))
      : offer?.k === 'slots'
        ? [
            ...CALLBACK_SLOTS.map((s) => ({ label: s, run: () => book(s) })),
            {
              label: 'Doch nicht',
              ghost: true,
              run: () =>
                respond({ status: 'Schreibt …', text: 'Kein Problem. Sonst noch etwas?' }, 'bot', {
                  k: 'topics',
                  topics: 'start',
                }),
            },
          ]
        : offer?.k === 'agent'
          ? [{ label: 'Chat beenden', ghost: true, act: true, run: endAgent }]
          : []

  /* Der gedrueckte Knopf verschwindet mit seiner Gruppe. Ohne neues Ziel
     faellt der Fokus auf das Dokument, und VoiceOver faengt oben an. */
  const keepFocus = () => logRef.current?.focus({ preventScroll: true })

  /* ---- Der Flug ----
     Der gewaehlte Knopf wird zur eigenen Nachricht, also fliegt er an
     ihre Stelle: dieselbe Glasflaeche, derselbe Text, nur woanders.
     Die uebrigen Knoepfe blenden vorher aus (LEAVE_MS), damit sichtbar
     ist, welcher gewaehlt wurde. Gemessen wird der Knopf beim Tippen,
     die Blase nach dem Einfuegen; dazwischen laeuft nur transform. */
  const [leaving, setLeaving] = useState<string | null>(null)
  const flights = useRef(new Map<number, DOMRect>())

  const pick = (r: Reply, el: HTMLElement) => {
    if (leaving) return
    const from = el.getBoundingClientRect()
    setLeaving(r.label)
    keepFocus()
    later(
      () => {
        setLeaving(null)
        /* "Chat beenden" ist keine Nachricht an Lea, sondern eine
           Handlung — sie steht als Systemzeile im Verlauf, nicht als
           eigene Blase. */
        if (!r.act) flights.current.set(push({ from: 'me', text: r.label }), from)
        r.run()
      },
      reduceMotion() ? 0 : LEAVE_MS,
    )
  }

  useLayoutEffect(() => {
    if (flights.current.size === 0) return
    const spring = getComputedStyle(document.documentElement).getPropertyValue('--spring').trim() || 'ease-out'
    flights.current.forEach((from, id) => {
      const el = logRef.current?.querySelector<HTMLElement>(`[data-mid="${id}"] .bubble`)
      if (!el) return
      if (reduceMotion()) return
      const to = el.getBoundingClientRect()
      /* Rechte Kante an rechte Kante: Knopf und Blase stehen beide
         rechtsbuendig, und so bleibt der Text beim Flug an seinem
         Ende verankert. Die eigene Einflug-Animation der Blase entfaellt
         hier — sie kommt ja nicht von unten, sondern vom Knopf. */
      el.style.animation = 'none'
      el.animate(
        [{ transform: `translate(${from.right - to.right}px, ${from.top - to.top}px)` }, { transform: 'none' }],
        { duration: 460, easing: spring },
      )
    })
    flights.current.clear()
  }, [msgs])

  const send = () => {
    const v = input.trim()
    if (!v || leaving) return
    setInput('')
    push({ from: 'me', text: v })
    if (mode === 'queue') return
    if (mode === 'agent') {
      const text = AGENT_REPLIES[Math.min(agentTurn.current++, AGENT_REPLIES.length - 1)]
      return respond({ status: `${AGENT.name} schreibt …`, text }, 'agent', { k: 'agent' })
    }
    const intent = detect(v)
    if (intent === 'thanks')
      return respond({ status: 'Schreibt …', text: 'Gern! Sonst noch etwas?' }, 'bot', { k: 'topics', topics: 'start' })
    if (intent === null) return respond(FALLBACK, 'bot', { k: 'topics', topics: FALLBACK.next })
    ask(intent)
  }

  /* ---- Mitlaufen ----
     Nach unten, aber nie ueber den Anfang der neuesten Nachricht hinaus:
     eine lange Antwort mit Karte soll oben anfangen, nicht mitten im
     Satz. Die Vorschlaege darunter erreicht man mit dem Daumen. */
  useLayoutEffect(() => {
    const body = bodyRef.current
    const last = lastRef.current
    if (!body) return
    const max = body.scrollHeight - body.clientHeight
    const top = last
      ? last.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 8
      : max
    body.scrollTo({ top: Math.min(max, top), behavior: reduceMotion() ? 'auto' : 'smooth' })
  }, [msgs.length, pending, offer])

  /* Beim Oeffnen dort, wo das Gespraech steht. */
  useEffect(() => {
    const body = bodyRef.current
    if (open && body) body.scrollTop = body.scrollHeight
  }, [open])

  /* Der Absender steht ueber der ersten Blase eines Sprechers, nicht
     ueber jeder: sonst stuende "Assistent" nach jeder eigenen Frage. */
  let speaker: From | null = null

  return (
    <>
      {/* Der Schluessel wechselt mit dem Gegenueber: die Zeile wird neu
          gesetzt und kommt herein — wer antwortet, hat gewechselt. Die
          Warteschlange ist noch der Assistent, nur mit anderer Zeile. */}
      <div className="chat-head" key={mode === 'agent' ? 'agent' : 'bot'}>
        <span className={`chat-ava${mode === 'agent' ? ' person' : ''}`} aria-hidden="true">
          {mode === 'agent' ? AGENT.initial : <AssistantGlyph />}
        </span>
        <div className="tx">
          <h2>{mode === 'agent' ? `${AGENT.name} · ${AGENT.team}` : 'Assistent'}</h2>
          <p>
            {mode === 'agent'
              ? 'Ein Mensch aus unserem Team'
              : mode === 'queue'
                ? 'Verbindet Dich mit dem Team …'
                : /* Kurz genug fuer eine Zeile neben dem Schliessen-Knopf
                     (241px bei 14px). Die Zeiten brechen nie in sich um. */
                  <>
                    Automatisch · <span className="nowrap">Team {TEAM_HOURS}</span>
                  </>}
          </p>
        </div>
      </div>

      <div className="sheet-body chat-body" ref={bodyRef}>
        <div className="chat-area" role="log" aria-label="Chatverlauf" tabIndex={-1} ref={logRef}>
          {msgs.map((m, i) => {
            const isLast = i === msgs.length - 1 && !pending
            const ref = isLast ? lastRef : undefined
            if (m.from === 'sys')
              return (
                <div key={m.id} className="chat-sys" ref={ref}>
                  {m.text}
                </div>
              )
            const showFrom = m.from !== 'me' && m.from !== speaker
            if (m.from !== 'me') speaker = m.from
            return (
              <div key={m.id} data-mid={m.id} className={`chat-msg${m.from === 'me' ? ' me' : ''}`} ref={ref}>
                {showFrom && <span className="bubble-from">{m.from === 'agent' ? AGENT.name : 'Assistent'}</span>}
                <div className={`bubble${m.from === 'me' ? ' me' : ''}`}>{m.text}</div>
                {(m.card || m.jump) && (
                  <div className={`chat-card${m.card === 'booking' ? ' booking' : ''}`}>
                    {m.card && (
                      <CardBody card={m.card} ctx={ctx} booking={booking} onCancel={cancelBooking} />
                    )}
                    {m.jump && (
                      <button type="button" className="cc-row" onClick={() => onJump(m.jump!.to)}>
                        {m.jump.label}
                        <Chevron />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {pending && (
            <div
              /* Neuer Text, neues Element: "Platz 2" → "Platz 1" kommt
                 herein, statt still ausgetauscht zu werden. */
              key={pending.text}
              ref={lastRef}
              className={pending.sys ? 'chat-sys pending' : 'bubble pending'}
            >
              {pending.text}
            </div>
          )}

          {replies.length > 0 && (
            /* Figma: rechtsbuendig, wie eigene Nachrichten */
            <div className="quick-replies" role="group" aria-label="Antwortvorschläge">
              {replies.map((r, i) => (
                <Button
                  key={r.label}
                  variant={r.ghost ? 'ghost' : 'filled'}
                  className={leaving ? (leaving === r.label ? 'picked' : 'out') : ''}
                  /* Nacheinander, 60ms Abstand: die Reihe liest sich als
                     Liste von Moeglichkeiten, nicht als ein Block. */
                  style={{ '--i': i } as React.CSSProperties}
                  onClick={(e) => pick(r, e.currentTarget)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="chat-input">
        <input
          type="text"
          aria-label={mode === 'agent' ? `Nachricht an ${AGENT.name}` : 'Nachricht schreiben'}
          placeholder={mode === 'agent' ? `Nachricht an ${AGENT.name} …` : 'Frag etwas …'}
          /* virtual-keyboards.md › Best practices: die Eingabetaste sagt,
             was sie tut. */
          enterKeyHint="send"
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && send()}
        />
        <button className="send" aria-label="Senden" onClick={send} disabled={!input.trim()}>
          {/* Figma: Papierflieger-Symbol, 18x18 */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 2L11 13" />
            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </>
  )
}

/* ---------- Karten ----------
   Jede Karte zeigt, was der Satz davor nicht sagt. Die Zahlen folgen
   der Entscheidung vom 2026-09-04: Datenwerte auf 24px, sie sind das
   Lauteste auf ihrer Flaeche. */
function CardBody({
  card,
  ctx,
  booking,
  onCancel,
}: {
  card: ChatCard
  ctx: SupportCtx
  booking: Booking | null
  onCancel: () => void
}) {
  const { usage: u, plan, roaming: r } = ctx

  if (card === 'usage') {
    const up = u.trendPct >= 0
    return (
      <div className="cc-body">
        <span className="cc-k">Genutzt seit {fmtDayMonth(CYCLE.start)}</span>
        <b className="cc-v">{fmtGb(u.usedGb)}</b>
        <Bar value={u.day} max={u.days} label={`Tag ${u.day} von ${u.days}`} />
        <span className="cc-note">
          Tag {u.day} von {u.days}. Hochgerechnet {fmtGb(u.forecastGb, 0)} bis {fmtDayMonth(CYCLE.end)},{' '}
          {Math.abs(u.trendPct)} % {up ? 'mehr' : 'weniger'} als im Vormonat.
        </span>
      </div>
    )
  }

  if (card === 'bill') {
    return (
      <div className="cc-body">
        <span className="cc-k">Grundpreis {planTitle(plan)}</span>
        <b className="cc-v">{fmtEuro(plan.monthly)}</b>
        <span className="cc-note">
          Zeitraum {fmtDayMonth(CYCLE.start)}–{fmtDate(CYCLE.end)}, inkl.{'\u00a0'}{Math.round(VAT * 100)}{'\u00a0'}%{'\u00a0'}MwSt.
          {/* Der Betrag ist der Grundpreis, nicht die Summe: was unter
              "Reisen" zugebucht wurde, kommt dazu. Das zu verschweigen
              hiesse, eine zu niedrige Zahl als Rechnung auszugeben. */}
          {r.extraGb > 0 && ' Dazu kommen Deine zugebuchten Reisepakete.'}
        </span>
      </div>
    )
  }

  if (card === 'roaming') {
    const eu = r.zone === 'eu'
    const used = eu ? r.euUsedGb : r.usedGb
    const total = eu ? r.euFupGb : r.allowanceGb ?? 0
    return (
      <div className="cc-body">
        <span className="cc-k">
          {r.flag} {r.country} · {r.network}
        </span>
        <b className="cc-v">{fmtGb(used)}</b>
        <Bar value={used} max={total} label={`${fmtGb(used)} von ${fmtGb(total, 0)} genutzt`} />
        <span className="cc-note">
          von {fmtGb(total, 0)} {eu ? 'Fair Use in diesem Monat' : 'Reisevolumen'}
        </span>
      </div>
    )
  }

  if (card === 'esim') {
    return (
      <div className="cc-body">
        <ol className="magic-steps">
          {ESIM_STEPS.map((s, i) => (
            <li key={s.title} style={{ '--i': i } as React.CSSProperties}>
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
    )
  }

  /* card === 'booking' — liest den laufenden Zustand, nicht den zum
     Zeitpunkt der Nachricht: eine abgesagte Buchung ist auch weiter
     oben im Verlauf abgesagt. */
  if (!booking) return null
  return (
    <>
      <div className="cc-body">
        <span className="cc-k">
          {!booking.cancelled && <Check />}
          {booking.cancelled ? 'Rückruf abgesagt' : 'Rückruf gebucht'}
        </span>
        <b className={`cc-t${booking.cancelled ? ' off' : ''}`}>{booking.slot}</b>
        <span className="cc-note">an {ctx.phone}</span>
      </div>
      {!booking.cancelled && (
        <button type="button" className="cc-row danger" onClick={onCancel}>
          Rückruf absagen
        </button>
      )}
    </>
  )
}

/* Derselbe Balken wie im Abrechnungszeitraum auf Home. */
function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const f = max > 0 ? Math.min(1, value / max) : 0
  return (
    <div className="cycle-bar" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <i style={{ transform: `scaleX(${f})` }} />
    </div>
  )
}

/* Zeichnet sich einmal, wenn die Buchung steht — im selben Moment wie
   die Erfolgs-Haptik. Eine einmalige Strichzeichnung, keine Schleife. */
const Check = () => (
  <svg className="cc-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
  </svg>
)

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
)

/* Eine Sprechblase, gezeichnet wie die Kontozeilen: 24er Raster,
   Kontur 1.8, runde Enden. Bewusst kein Funkeln und kein Roboter —
   beides sagt "KI" und nichts ueber diesen Assistenten, der
   nachschaut, statt zu erfinden. */
const AssistantGlyph = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-7.5L7 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5z" />
    <path d="M8 9.5h8M8 12.5h5" />
  </svg>
)
