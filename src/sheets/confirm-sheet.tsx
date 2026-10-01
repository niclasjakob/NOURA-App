/* ============================================================
   NOURA — Bestaetigen: ein Sheet fuer jeden verbindlichen Tipp

   Bis zum 2026-09-25 hatten die Aenderungen an einem laufenden
   Vertrag verschiedene Gewichte:

     Tarif wechseln   der ganze Neukunden-Ablauf: Bestellung, Ausweis,
                      neue eSIM — 9 Taps, IBAN, rund 26 s Warten
     Kuendigen        ein Tipp auf einen grauen Link, dann ein Toast

   Jetzt laufen beide durch dasselbe Sheet mit demselben Aufbau:
   was sich aendert, ab wann, was es kostet, womit bezahlt wird, EIN
   Knopf mit dem Wortlaut, den das Gesetz verlangt — und danach ein
   Ergebnis im Sheet, kein Toast, der nach 2,6 s weg ist.

   Die Knopftexte folgen dem Gesetz, nicht der Markenstimme:
   § 312j Abs. 3 BGB fuer alles, was Geld kostet ("zahlungspflichtig"),
   § 312k BGB fuer die Kuendigung (Bestaetigungsseite, Knopf
   "jetzt kündigen").

   Ein Sheet zur Zeit (sheets.md › Best practices): wer hier landet,
   kommt aus dem Tarif-Sheet, das dafuer geschlossen wurde. "Abbrechen"
   und "Fertig" fuehren dorthin zurueck; das X schliesst ganz.

   Das Datenpaket fuer weltweites Roaming lief ebenfalls hier durch. Es
   ist am 2026-09-25 mit der Reiseansicht entfallen.
   ============================================================ */
import { useEffect, useRef, useState } from 'react'
import { Button, OptionRow } from '../components/ui'
import { Sheet } from './sheets'
import { PLANS, PLAN_DIFF } from '../data/plans'
import {
  CYCLE,
  HOLDER,
  fmtDate,
  fmtEuro,
  payLabel,
  switchQuote,
  type Payment,
} from '../data/account'
import { hapticSuccess } from '../lib/haptics'

export type ConfirmReq = { kind: 'switch'; to: number } | { kind: 'cancel' }

/** Was bestaetigt wurde — App setzt es um und legt den Beleg ab. */
export type Confirmed =
  | { kind: 'switch'; to: number; when: 'now' | 'cycle'; charged: number }
  | { kind: 'cancel' }

const TITLE: Record<ConfirmReq['kind'], string> = {
  switch: 'Tarif wechseln',
  cancel: 'Vertrag kündigen',
}

/* Wie CHECK_MS im Magic-Sheet: eine Antwort im selben Bild wie der
   Tipp liest sich nicht als Bestaetigung. */
const BUSY_MS = 520

export function ConfirmSheet({
  open,
  req,
  planIdx,
  payment,
  onConfirm,
  onBack,
  onClose,
}: {
  open: boolean
  req: ConfirmReq | null
  planIdx: number
  payment: Payment
  onConfirm: (c: Confirmed) => void
  /** Zurueck in das Sheet, aus dem die Anfrage kam. */
  onBack: () => void
  onClose: () => void
}) {
  const [phase, setPhase] = useState<'ask' | 'busy' | 'done'>('ask')
  const [when, setWhen] = useState<'now' | 'cycle'>('now')
  /* Das Ergebnis wird im Moment der Bestaetigung festgehalten. Nach einem
     sofortigen Wechsel zeigt `planIdx` schon den neuen Tarif — daraus
     gerechnet, stuende im Ergebnis "von CREATE zu CREATE". */
  const [result, setResult] = useState<{ title: string; text: string } | null>(null)
  const timer = useRef(0)

  /* Jede Anfrage beginnt vorn — aber erst, wenn das Sheet wieder
     aufgeht, nicht waehrend es abtritt. */
  useEffect(() => {
    if (!open) return
    setPhase('ask')
    setResult(null)
    if (req?.kind === 'switch') {
      setWhen(switchQuote(PLANS[planIdx], PLANS[req.to]).upgrade ? 'now' : 'cycle')
    }
    return () => window.clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, req])

  if (!req) return <Sheet id="confirmSheet" open={open} label="Bestätigen" onClose={onClose}>{null}</Sheet>

  const from = PLANS[planIdx]
  const email = HOLDER.email

  const commit = (c: Confirmed, done: { title: string; text: string }) => {
    if (phase !== 'ask') return
    setPhase('busy')
    timer.current = window.setTimeout(() => {
      onConfirm(c)
      setResult(done)
      setPhase('done')
      /* Der folgenreiche Moment. Die Kuendigung bekommt keinen
         Erfolgsschlag — sie ist erledigt, aber kein Erfolg. */
      if (c.kind !== 'cancel') hapticSuccess()
    }, BUSY_MS)
  }

  let body: React.ReactNode = null
  let action: React.ReactNode = null
  let lead = ''

  if (req.kind === 'switch') {
    const to = PLANS[req.to]
    const q = switchQuote(from, to)
    const now = q.upgrade && when === 'now'
    const today = now ? q.proratedToday : 0
    lead = 'Deine eSIM und Deine Nummer bleiben, wie sie sind.'
    body = (
      <>
        <div className="cf-swap">
          <div className="cf-plan">
            <span>Jetzt</span>
            <b>{from.name}</b>
            <small>{fmtEuro(from.monthly)} / Monat</small>
          </div>
          <span className="cf-arrow" aria-hidden="true">→</span>
          <div className="cf-plan to">
            <span>Neu</span>
            <b>{to.name}</b>
            <small>{fmtEuro(to.monthly)} / Monat</small>
          </div>
        </div>

        <section className="set-sec">
          <h3>Was sich ändert</h3>
          <dl className="set-group cf-list">
            {PLAN_DIFF.map((r) => (
              <div key={r.label} className="set-row static">
                <dt className="set-note">{r.label}</dt>
                <dd>
                  <span className="cf-old">{r.value(from)}</span>
                  <span className="sr-only"> wird zu </span>
                  <span aria-hidden="true"> → </span>
                  <b>{r.value(to)}</b>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="set-sec" role={q.upgrade ? 'radiogroup' : undefined} aria-labelledby="cf-when">
          <h3 id="cf-when">Ab wann</h3>
          {q.upgrade ? (
            <>
              <OptionRow
                selected={when === 'now'}
                onSelect={() => setWhen('now')}
                title="Sofort"
                meta={`Heute anteilig ${fmtEuro(q.proratedToday)} für die restlichen ${q.daysLeft} Tage`}
              />
              <OptionRow
                selected={when === 'cycle'}
                onSelect={() => setWhen('cycle')}
                title={`Zum ${fmtDate(q.nextCycle)}`}
                meta={`Bis dahin bleibt ${from.name}, heute kostet es nichts`}
              />
            </>
          ) : (
            <p className="set-lead">
              Ein günstigerer Tarif gilt ab dem nächsten Abrechnungszeitraum, also ab dem{' '}
              {fmtDate(q.nextCycle)}. Bis dahin bleibt {from.name}.
            </p>
          )}
        </section>

        <div className="set-group cf-cost">
          <div className="cost-row">
            <span>Heute fällig</span>
            <span>{fmtEuro(today)}</span>
          </div>
          <div className="cost-row">
            <span>Ab {fmtDate(q.nextCycle)} monatlich</span>
            <span>{fmtEuro(to.monthly)}</span>
          </div>
          <div className="cost-row">
            <span>Zahlart</span>
            <span>{payLabel(payment)}</span>
          </div>
        </div>
        <p className="set-foot">
          Preise inkl. MwSt. Keine neue Mindestlaufzeit, weiter monatlich kündbar. Kein neuer
          Ausweis-Check.
        </p>
      </>
    )
    action = (
      <Button
        aria-busy={phase === 'busy' || undefined}
        onClick={() =>
          commit(
            { kind: 'switch', to: req.to, when: now ? 'now' : 'cycle', charged: today },
            now
              ? {
                  title: `Du bist jetzt bei ${to.name}.`,
                  text: `Heute ${fmtEuro(today)} anteilig, ab ${fmtDate(q.nextCycle)} ${fmtEuro(to.monthly)} im Monat.`,
                }
              : {
                  title: 'Wechsel vorgemerkt',
                  text: `Ab ${fmtDate(q.nextCycle)} gilt ${to.name} für ${fmtEuro(to.monthly)} im Monat. Bis dahin bleibt ${from.name}.`,
                },
          )
        }
      >
        {phase === 'busy' ? 'Wird bestätigt …' : 'Zahlungspflichtig wechseln'}
      </Button>
    )
  } else {
    /* Die Bestaetigungsseite nach § 312k Abs. 2 BGB. Sie nennt, was
       gekuendigt wird und wann es endet, und traegt den einen Knopf
       mit dem Wortlaut "jetzt kündigen". */
    lead = 'Prüf die Angaben. Mit dem Knopf unten ist die Kündigung abgeschickt.'
    body = (
      <>
        <dl className="set-group cf-list">
          <div className="set-row static">
            <dt className="set-note">Vertrag</dt>
            <dd>NOURA {from.name} · {HOLDER.phone}</dd>
          </div>
          <div className="set-row static">
            <dt className="set-note">Art</dt>
            <dd>Ordentlich, zum nächstmöglichen Termin</dd>
          </div>
          <div className="set-row static">
            <dt className="set-note">Endet am</dt>
            <dd>{fmtDate(CYCLE.end)}</dd>
          </div>
          <div className="set-row static">
            <dt className="set-note">Bestätigung an</dt>
            <dd>{email}</dd>
          </div>
        </dl>
        <section className="set-sec">
          <h3>Was danach passiert</h3>
          <ul className="dot-list cf-rules">
            <li>Bis zum {fmtDate(CYCLE.end)} läuft alles weiter wie bisher.</li>
            <li>Deine Nummer kannst Du bis einen Monat nach Vertragsende zu einem anderen Anbieter mitnehmen.</li>
            <li>Deine Magic-Code-Zugänge bleiben gültig.</li>
          </ul>
        </section>
      </>
    )
    action = (
      <Button
        aria-busy={phase === 'busy' || undefined}
        onClick={() =>
          commit(
            { kind: 'cancel' },
            {
              title: `Gekündigt zum ${fmtDate(CYCLE.end)}`,
              text: `Die Bestätigung mit Datum und Uhrzeit geht an ${email} und liegt unter Account → Dokumente. Bis dahin läuft alles weiter.`,
            },
          )
        }
      >
        {phase === 'busy' ? 'Wird gekündigt …' : 'jetzt kündigen'}
      </Button>
    )
  }

  return (
    <Sheet id="confirmSheet" open={open} label={TITLE[req.kind]} onClose={onClose}>
      <div className="sheet-body cf">
        {phase === 'done' && result ? (
          <div className="cf-done" role="status">
            <span className="cf-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M6 12.5 10.2 16.5 18 8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2>{result.title}</h2>
            <p>{result.text}</p>
            {req.kind !== 'cancel' && (
              <p className="set-foot">Die Bestätigung liegt unter Account → Dokumente.</p>
            )}
            <div className="cf-actions">
              <Button onClick={onBack}>Fertig</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="plan-sheet-head">
              <h2>{TITLE[req.kind]}</h2>
              <p>{lead}</p>
            </div>
            {body}
            <div className="cf-actions">
              {action}
              {/* Eine Alternative zum bestaetigenden Knopf (sheets.md ›
                  Best practices: "Provide an alternative to the Done
                  button"). Sie fuehrt zurueck, nicht hinaus. */}
              <Button variant="ghost" disabled={phase === 'busy'} onClick={onBack}>
                Abbrechen
              </Button>
            </div>
          </>
        )}
        <div style={{ height: 24 }} />
      </div>
    </Sheet>
  )
}
