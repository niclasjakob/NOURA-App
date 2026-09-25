/* ============================================================
   NOURA — Bestellung und Identifizierung

   Zwischen "Plan auswählen" und der eSIM-Aktivierung lag im
   Prototyp bisher nichts. In Wirklichkeit liegen dort die beiden
   Schritte, an denen Mobilfunk-Anmeldungen tatsaechlich abbrechen:
   der Checkout und die gesetzlich vorgeschriebene Identitaets-
   pruefung (§ 172 TKG).

   Beide sind hier so gebaut, dass sie die Abbruchgruende adressieren:
   – das Geraet wird geprueft, bevor Geld fliesst, nicht danach
   – jede Angabe hat einen sichtbaren Grund
   – Kosten stehen vollstaendig vor dem Bestellknopf
   – die Vertragszusammenfassung liegt im Ablauf, nicht im PDF-Anhang
   – bei der Identifizierung waehlt der Nutzer das Verfahren selbst
     und sieht vorher, wie lange es dauert und ob es gerade laeuft

   Bewusst *nicht* abgefragt: Name, Geburtsdatum und Anschrift. Die
   verlangt § 172 TKG zwar, aber sie stehen im Ausweis — und den liest
   der naechste Schritt ohnehin aus. Ein Formular, das dieselben Daten
   vorher abtippen laesst, ist reine Abbruchflaeche.
   ============================================================ */
import { useEffect, useRef, useState } from 'react'
import { Button, ArrowLeft, Consent, Disclosure, Field, FlowSteps, OptionRow, Screen } from '../components/ui'
import { AuroraFlow } from '../components/onboarding-visuals'
import { IdentStage } from '../components/ident-stage'
import { BeatCaption, BeatMeter } from '../components/beats'
import type { Plan } from '../data/plans'
import {
  DEVICE,
  IDENT_ACTS,
  IDENT_METHODS,
  PAY_METHODS,
  PORT_DATES,
  VIDEO_IDENT_HOURS,
  contractSummary,
  fmtEuro,
  identAvailable,
  type IdentMethod,
} from '../data/account'
import { hapticSuccess } from '../lib/haptics'

/* ================= Checkout ================= */
export type NumberMode = 'new' | 'port'
export type PortDateKey = (typeof PORT_DATES)[number]['key']

/** Absichtlich locker: eine Adresse formal zu zerlegen ist ein
    geloestes Problem mit vielen falschen Negativen. Geprueft wird nur,
    ob ueberhaupt eine Adresse dasteht. */
const EMAIL_OK = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

/* Fuer die Demo ist das Feld optional: ein leeres Feld haelt den
   Durchklick nicht auf, ein ausgefuelltes wird weiter geprueft. */

export function Checkout({
  active,
  plan,
  numberMode,
  onNumberMode,
  onBack,
  onSubmit,
}: {
  active: boolean
  plan: Plan
  numberMode: NumberMode
  onNumberMode: (m: NumberMode) => void
  onBack: () => void
  onSubmit: () => void
}) {
  const [provider, setProvider] = useState('')
  const [number, setNumber] = useState('')
  const [portDate, setPortDate] = useState<PortDateKey>('now')
  const [email, setEmail] = useState('')
  const [pay, setPay] = useState<(typeof PAY_METHODS)[number]['key']>('sepa')
  const [iban, setIban] = useState('')
  const [consent, setConsent] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [tried, setTried] = useState(false)

  const providerRef = useRef<HTMLInputElement>(null)
  const numberRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const ibanRef = useRef<HTMLInputElement>(null)
  const consentRef = useRef<HTMLInputElement>(null)

  const monthly = plan.monthly
  /* Rufnummernmitnahme ist bei NOURA kostenlos — das gehoert
     ausgeschrieben, weil Kunden hier Gebuehren erwarten. */
  const dueToday = monthly
  const deviceOk = DEVICE.esim && DEVICE.unlocked

  /* Der Knopf bleibt bedienbar. Ein von vornherein ausgegrauter CTA
     sagt nicht, was fehlt — und was fehlt, steht hier meist weit
     unterhalb des sichtbaren Bereichs. Stattdessen fuehrt der Tipp
     zur ersten Luecke, in der Reihenfolge, in der sie auf dem Screen
     stehen. */
  const missing = (): React.RefObject<HTMLElement> | null => {
    if (numberMode === 'port' && provider.trim() === '') return providerRef
    if (numberMode === 'port' && number.trim() === '') return numberRef
    if (email.trim() !== '' && !EMAIL_OK(email)) return emailRef
    if (pay === 'sepa' && iban.trim() === '') return ibanRef
    if (!consent) return consentRef
    return null
  }

  const submit = () => {
    const gap = missing()
    if (!gap) {
      /* Der eine folgenreiche Tipp in der App: hier wird bestellt.
         Alles davor laesst sich zuruecknehmen, das hier nicht. */
      hapticSuccess()
      onSubmit()
      return
    }
    setTried(true)
    gap.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    gap.current?.focus({ preventScroll: true })
  }

  const err = (bad: boolean, text: string) => (tried && bad ? text : undefined)

  return (
    <Screen active={active}>
      <div className="top-nav">
        <button className="icon-plain" aria-label="Zurück zur Tarifauswahl" onClick={onBack}>
          <ArrowLeft />
        </button>
      </div>

      <div className="flow">
      <div className="flow-head">
        <FlowSteps current={1} />
        <h1>Deine Bestellung</h1>
        {/* Eine Zeitangabe kostet nichts und nimmt dem Schritt die
            gefuehlte Laenge. */}
        <p className="flow-lead">Noch rund 5 Minuten bis zur aktiven eSIM.</p>
      </div>

      <div className="flow-scroll">
        {/* Zusammenfassung — was gerade gekauft wird, ohne Zurueckblaettern */}
        <div className="card sum-card">
          <div className="sum-top">
            <span className="sum-name">NOURA {plan.name}</span>
            <span className="sum-price">{fmtEuro(monthly)}</span>
          </div>
          <p className="sum-sub">
            5G eSIM · monatlich kündbar · keine Anschlussgebühr · Preis inkl. MwSt.
          </p>
        </div>

        {/* ---- Geraetecheck ----
            Steht vor allem anderen. Ein Kunde, dessen iPhone keine eSIM
            kann, soll das hier erfahren und nicht nach der Abbuchung. */}
        <div className={`card device-card${deviceOk ? ' ok' : ' bad'}`}>
          <div className="device-top">
            <span className="device-mark" aria-hidden="true">
              <svg viewBox="0 0 16 16">
                {deviceOk ? (
                  <path d="M3.5 8.5 6.5 11.5 12.5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M8 4v5M8 11.5v.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                )}
              </svg>
            </span>
            <div>
              <b>
                {deviceOk ? `${DEVICE.model} ist bereit für eSIM` : `${DEVICE.model} kann keine eSIM`}
              </b>
              <p>
                {deviceOk
                  ? `${DEVICE.os} · kein SIM-Lock · geprüft auf diesem Gerät`
                  : 'Auf einem anderen Gerät fortfahren oder unseren Support fragen.'}
              </p>
            </div>
          </div>
        </div>

        <section className="flow-sec" role="radiogroup" aria-labelledby="sec-num">
          <h2 id="sec-num">Deine Rufnummer</h2>
          <OptionRow
            selected={numberMode === 'new'}
            onSelect={() => onNumberMode('new')}
            title="Neue Rufnummer"
            meta="Du bekommst sie sofort mit der Aktivierung"
          />
          <OptionRow
            selected={numberMode === 'port'}
            onSelect={() => onNumberMode('port')}
            title="Nummer mitnehmen"
            meta="Kostenlos · meist am nächsten Werktag umgestellt"
            badge="Gratis"
          >
            <Field
              label="Bisheriger Anbieter"
              value={provider}
              onChange={setProvider}
              placeholder="z. B. Telekom"
              inputRef={providerRef}
              error={err(provider.trim() === '', 'Bitte trag Deinen bisherigen Anbieter ein.')}
            />
            <Field
              label="Deine Rufnummer"
              value={number}
              onChange={setNumber}
              placeholder="0170 1234567"
              inputMode="tel"
              autoComplete="tel"
              inputRef={numberRef}
              error={err(number.trim() === '', 'Bitte trag die Nummer ein, die Du mitnehmen willst.')}
            />

            {/* Die eine Entscheidung, die bei der Mitnahme wirklich beim
                Kunden liegt — und die ihn Geld kostet, wenn sie ihm
                niemand stellt. */}
            <div className="port-when" role="radiogroup" aria-label="Wann soll die Nummer wechseln?">
              <span className="field-label">Wann soll gewechselt werden?</span>
              {PORT_DATES.map((d) => (
                <OptionRow
                  key={d.key}
                  selected={portDate === d.key}
                  onSelect={() => setPortDate(d.key)}
                  title={d.label}
                  meta={d.meta}
                />
              ))}
            </div>

            <p className="hint">
              Deine alte SIM bleibt aktiv, bis der Wechsel abgeschlossen ist. Du bist
              durchgehend erreichbar. Die Kündigung beim alten Anbieter übernehmen wir.
            </p>
          </OptionRow>
        </section>

        {/* ---- Kontakt ----
            Das einzige Feld, das wir wirklich brauchen: alles Weitere
            liefert der Ausweis im naechsten Schritt. */}
        <section className="flow-sec">
          <h2>Kontakt</h2>
          <div className="card contact-card">
            <Field
              label="E-Mail-Adresse"
              value={email}
              onChange={setEmail}
              placeholder="marcel@beispiel.de"
              type="email"
              inputMode="email"
              autoComplete="email"
              inputRef={emailRef}
              error={err(email.trim() !== '' && !EMAIL_OK(email), 'Diese Adresse sieht noch nicht vollständig aus.')}
            />
            <p className="hint">
              Hierhin gehen Vertrag, Rechnungen und der Aktivierungscode. Name, Geburtsdatum
              und Anschrift lesen wir im nächsten Schritt aus Deinem Ausweis — die musst Du
              nicht eintippen.
            </p>
          </div>
        </section>

        <section className="flow-sec" role="radiogroup" aria-labelledby="sec-pay">
          <h2 id="sec-pay">Zahlung</h2>
          {PAY_METHODS.map((m) => (
            <OptionRow
              key={m.key}
              selected={pay === m.key}
              onSelect={() => setPay(m.key)}
              title={m.label}
              meta={m.meta}
            >
              {m.key === 'sepa' && (
                <>
                  <Field
                    label="IBAN"
                    value={iban}
                    onChange={setIban}
                    placeholder="DE00 0000 0000 0000 0000 00"
                    inputRef={ibanRef}
                    error={err(iban.trim() === '', 'Für die Lastschrift brauchen wir Deine IBAN.')}
                  />
                  {/* Das SEPA-Mandat gehoert an die IBAN, nicht in die
                      AGB — dort liest es niemand, und die verkuerzte
                      Vorabankuendigung muss vereinbart sein. */}
                  <p className="hint">
                    Du erteilst uns ein SEPA-Lastschriftmandat. Wir kündigen jede Abbuchung
                    mindestens einen Tag vorher an und buchen frühestens am Rechnungsdatum ab.
                    Widerrufbar jederzeit in der App.
                  </p>
                </>
              )}
            </OptionRow>
          ))}
        </section>

        <section className="flow-sec">
          <h2>Übersicht</h2>
          <div className="card cost-card">
            <div className="cost-row">
              <span>NOURA {plan.name}, monatlich</span>
              <span>{fmtEuro(monthly)}</span>
            </div>
            <div className="cost-row">
              <span>Aktivierung & eSIM</span>
              <span className="free">0,00 €</span>
            </div>
            {numberMode === 'port' && (
              <div className="cost-row">
                <span>Rufnummernmitnahme</span>
                <span className="free">0,00 €</span>
              </div>
            )}
            <div className="cost-row total">
              <span>Heute fällig</span>
              <span>{fmtEuro(dueToday)}</span>
            </div>
            <p className="cost-note">
              Alle Preise inkl. MwSt. Danach {fmtEuro(monthly)} pro Monat, jederzeit zum
              Monatsende kündbar. Keine Mindestlaufzeit.
            </p>
          </div>
        </section>

        {/* ---- Vertragszusammenfassung ----
            § 54 TKG verlangt sie vor Vertragsschluss. Ueblich ist der
            PDF-Anhang der Bestellbestaetigung — also der Moment, in dem
            sie niemand mehr liest. Aufgeklappt hier, aus den Tarifdaten
            gerechnet, damit sie nicht veraltet. */}
        <section className="flow-sec">
          <Disclosure
            label="Vertragszusammenfassung"
            open={summaryOpen}
            onToggle={() => setSummaryOpen((v) => !v)}
          >
            <dl className="contract-list">
              {contractSummary(plan).map((r) => (
                <div key={r.label}>
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
          </Disclosure>
        </section>

        {/* ---- Zustimmung ----
            Genau ein Haken im ganzen Ablauf, und er hat einen echten
            Grund: die eSIM ist in fuenf Minuten aktiv, also beginnt die
            Leistung vor Ablauf der Widerrufsfrist. */}
        <section className="flow-sec">
          <Consent
            checked={consent}
            onChange={setConsent}
            inputRef={consentRef}
            error={err(!consent, 'Ohne diese Zustimmung können wir die eSIM nicht sofort freischalten.')}
          >
            Ja, startet sofort. Mir ist klar, dass mein 14-tägiges Widerrufsrecht bestehen
            bleibt und ich bei einem Widerruf nur die bis dahin genutzten Tage zahle.
          </Consent>
        </section>

        <p className="legal">
          Mit der Bestellung stimmst Du den <a href="#agb">AGB</a> und der{' '}
          <a href="#datenschutz">Datenschutzerklärung</a> zu.
        </p>

        <div style={{ height: 24 }} />
      </div>

      <div className="flow-cta">
        {/* Wortlaut nach § 312j Abs. 3 BGB — der Knopf muss die
            Zahlungspflicht ausdruecklich benennen. Der Betrag steht
            dabei, damit niemand ihn oben nachschlagen muss. */}
        <Button onClick={submit}>
          Zahlungspflichtig bestellen · {fmtEuro(dueToday)}
        </Button>
      </div>
      </div>
    </Screen>
  )
}

/* ================= Identifizierung =================
   Der Schritt, der sich am meisten nach Buerokratie anfuehlt: gesetzlich
   vorgeschrieben, mitten im Kauf, und bis zum 2026-09-17 ohne jedes Bild
   — drei Textzeilen und ein Balken.

   Jetzt laeuft er in derselben Darstellung wie der eSIM-Ablauf:
   Buehne, Takt-Text, Taktmesser. Zu sehen ist, was wirklich passiert —
   ein Dokument wird gelesen, seine Felder werden geprueft, das Ergebnis
   steht fest. Und WIE gelesen wird, haengt am Verfahren, das der Kunde
   eine Bildschirmseite vorher gewaehlt hat: seine Entscheidung soll
   eine sichtbare Folge haben. */
export function Ident({
  active,
  onBack,
  onDone,
}: {
  active: boolean
  onBack: () => void
  onDone: () => void
}) {
  const [method, setMethod] = useState<IdentMethod['key']>('eid')
  const [running, setRunning] = useState(false)
  const [idx, setIdx] = useState(0)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  const acts = IDENT_ACTS[method]
  /* Beim letzten Takt stehenbleiben: der Uebergang kommt 700ms spaeter,
     und in dieser Zeit soll der Haken sichtbar bleiben. */
  const act = acts[Math.min(idx, acts.length - 1)]

  /* Beim Verlassen zuruecksetzen, sonst laeuft der Ablauf beim zweiten
     Durchgang mitten im Fortschritt weiter — aber erst NACH der
     Ueberblendung. Sofort zurueckgesetzt springt der Screen waehrend
     seines Abgangs vom bestaetigten Haken zurueck auf die
     Verfahrensauswahl, und das sieht man.

     Aus demselben Grund laeuft die Buehne so lange weiter (warm):
     haengt sie direkt an `active`, frieren ihre Animationen im Moment
     des Wechsels ein und der Schnitt wird sichtbar. */
  const [warm, setWarm] = useState(false)
  useEffect(() => {
    if (active) {
      setWarm(true)
      return
    }
    const t = window.setTimeout(() => {
      setWarm(false)
      setRunning(false)
      setIdx(0)
    }, 700)
    return () => window.clearTimeout(t)
  }, [active])

  /* Jeder Takt bringt seine eigene Dauer mit — der Zeitpunkt ergibt
     sich aus der Summe davor, nicht aus einer festen Schrittweite. */
  useEffect(() => {
    if (!running) return
    setIdx(0)
    let t = 0
    const timers = acts.map((a, i) => {
      t += a.ms
      return window.setTimeout(() => setIdx(i + 1), t)
    })
    timers.push(window.setTimeout(() => doneRef.current(), t + 1000))
    return () => timers.forEach(window.clearTimeout)
  }, [running, acts])

  return (
    <Screen active={active}>
      <AuroraFlow tone="violet" />

      {!running && (
        <div className="top-nav">
          <button className="icon-plain" aria-label="Zurück zur Bestellung" onClick={onBack}>
            <ArrowLeft />
          </button>
        </div>
      )}

      {running ? (
        <div className="act-stage beat-stage">
          <IdentStage beat={act.beat} method={method} run={warm} />
          <BeatCaption title={act.title} text={act.text} />
          <BeatMeter
            step={idx}
            msList={acts.map((a) => a.ms)}
            run={warm}
            label={`Schritt ${Math.min(idx + 1, acts.length)} von ${acts.length} der Identitätsprüfung`}
          />
        </div>
      ) : (
        <div className="flow">
          <div className="flow-head">
            <FlowSteps current={2} />
            <h1>Kurz noch: Wer bist Du?</h1>
            {/* Der Grund steht vor der Aufgabe. Ohne ihn wirkt der
                Schritt wie eine Huerde, mit ihm wie eine Formalie. */}
            <p className="flow-lead">
              Für die Aktivierung einer SIM-Karte sind wir gesetzlich verpflichtet, Deine Identität zu prüfen
              (§&nbsp;172 TKG). Halte Deinen Ausweis bereit — Name und Anschrift übernehmen wir daraus.
            </p>
          </div>

          <div className="flow-scroll">
            <section className="flow-sec" role="radiogroup" aria-label="Verfahren zur Identitätsprüfung">
              {IDENT_METHODS.map((m) => {
                /* Video-Ident laeuft mit Menschen und hat Oeffnungs-
                   zeiten. Wer das erst im Wartebildschirm erfaehrt,
                   bricht ab — also steht es an der Auswahl. */
                const open = identAvailable(m.key)
                return (
                  <OptionRow
                    key={m.key}
                    selected={method === m.key}
                    onSelect={() => open && setMethod(m.key)}
                    disabled={!open}
                    title={m.label}
                    meta={
                      open
                        ? m.meta
                        : `Gerade geschlossen — wieder ab ${VIDEO_IDENT_HOURS.from} Uhr. Wähle so lange ein anderes Verfahren.`
                    }
                    badge={m.recommended ? 'Empfohlen' : undefined}
                    aside={open ? m.duration : `ab ${VIDEO_IDENT_HOURS.from} Uhr`}
                  />
                )
              })}
            </section>

            {method === 'eid' && (
              <p className="hint hint-loose">
                Du brauchst die sechsstellige PIN Deines Ausweises. Nie vergeben oder vergessen?
                Dann nimm Video-Chat oder Foto-Ident — dafür reicht der Ausweis allein.
              </p>
            )}

            <div style={{ height: 24 }} />
          </div>

          <div className="flow-cta">
            <Button onClick={() => setRunning(true)}>
              Identität bestätigen
            </Button>
          </div>
        </div>
      )}
    </Screen>
  )
}
