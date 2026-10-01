/* ============================================================
   NOURA — Anmelden mit Passkey

   Bis zum 2026-09-25 fuehrte "Einloggen" ohne jede Anmeldung auf einen
   Ladebildschirm ("Account wird geladen…", 4,6 s) und dann nach Home —
   waehrend das Konto unter Sicherheit "Passkey: Aktiv" behauptete.

   Jetzt kommt das Sheet, das iOS fuer Passkeys zeigt, und danach
   direkt Home mit seinem eigenen Ankunftsauftritt:

   > managing-accounts.md › Best practices: "If you don't use Sign in
   > with Apple … prefer using a passkey." — "Always identify the
   > authentication method you offer."

   Das hier ist eine NACHBILDUNG. Im nativen Build zeichnet iOS dieses
   Sheet selbst (ASAuthorizationController); deshalb steht es bewusst im
   Stil des Systems und nicht in NOURA-Glas — es gehoert nicht der App.
   ============================================================ */
import { useEffect, useRef, useState } from 'react'
import { HOLDER } from '../data/account'
import { useDialog, useInert } from '../hooks/a11y'
import { hapticSuccess } from '../lib/haptics'

type Step = 'ask' | 'scan' | 'ok'

export function PasskeyPrompt({
  open,
  onCancel,
  onDone,
}: {
  open: boolean
  onCancel: () => void
  onDone: () => void
}) {
  const [step, setStep] = useState<Step>('ask')
  const ref = useDialog<HTMLDivElement>(open, onCancel)
  useInert(ref, !open)
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (open) setStep('ask')
    return () => timers.current.forEach(window.clearTimeout)
  }, [open])

  /* Face ID braucht einen Moment, und der Haken steht kurz, bevor das
     Sheet geht — sonst verschwindet es im selben Bild wie der Tipp. */
  const go = () => {
    if (step !== 'ask') return
    setStep('scan')
    timers.current = [
      window.setTimeout(() => {
        setStep('ok')
        hapticSuccess()
      }, 900),
      window.setTimeout(onDone, 1550),
    ]
  }

  return (
    <>
      <div className={`pk-scrim${open ? ' on' : ''}`} onClick={step === 'ask' ? onCancel : undefined} />
      <div
        ref={ref}
        className={`pk-sheet${open ? ' on' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pk-title"
        tabIndex={-1}
      >
        <button type="button" className="pk-close" aria-label="Abbrechen" onClick={onCancel} disabled={step !== 'ask'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className={`pk-glyph ${step}`} aria-hidden="true">
          {step === 'ok' ? (
            <svg viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="3" />
              <path d="M14.5 24.5 21 31l12.5-13" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            /* Schluessel, wie ihn iOS fuer Passkeys zeigt; waehrend der
               Pruefung der Face-ID-Rahmen. */
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {step === 'scan' ? (
                <>
                  <path d="M6 16V10a4 4 0 0 1 4-4h6M32 6h6a4 4 0 0 1 4 4v6M42 32v6a4 4 0 0 1-4 4h-6M16 42h-6a4 4 0 0 1-4-4v-6" />
                  <path d="M17 18v3M31 18v3M24 18v9h-2M18 32c3.5 3 8.5 3 12 0" />
                </>
              ) : (
                <>
                  <circle cx="17" cy="24" r="8" />
                  <path d="M25 24h17M36 24v6M41 24v4" />
                </>
              )}
            </svg>
          )}
        </div>

        <h2 id="pk-title">Mit Passkey anmelden?</h2>
        <p className="pk-text">
          Du meldest Dich bei „noura.de“ mit dem Passkey aus Deinem iCloud-Schlüsselbund an.
        </p>

        <div className="pk-account">
          <span className="pk-av" aria-hidden="true">
            {HOLDER.first.charAt(0)}
          </span>
          <span className="pk-who">
            <b>{HOLDER.email}</b>
            <small>Passkey · iCloud-Schlüsselbund</small>
          </span>
        </div>

        <button type="button" className="pk-go" onClick={go} disabled={step !== 'ask'} aria-live="polite">
          {step === 'ask' ? 'Fortfahren' : step === 'scan' ? 'Face ID …' : 'Angemeldet'}
        </button>
      </div>
    </>
  )
}
