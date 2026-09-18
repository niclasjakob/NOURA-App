/* ============================================================
   NOURA — Zugaenglichkeits-Hilfen

   Drei Dinge, die jeder modale Dialog braucht und die der
   Prototyp bisher nicht hatte: Fokus faengt sich im Dialog,
   Escape schliesst, und der Fokus kehrt dorthin zurueck, wo er
   herkam. Dazu `inert` fuer alles, was gerade verdeckt ist —
   sonst wandern Tabulator und VoiceOver in unsichtbaren Inhalt.
   ============================================================ */
import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const visibleFocusable = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  )

/**
 * Setzt `inert`, solange `on` gilt. Ein inertes Element ist weder
 * anklickbar noch fokussierbar noch fuer Screenreader sichtbar —
 * genau das, was verdeckte Screens und geschlossene Sheets brauchen.
 */
export function useInert(ref: React.RefObject<HTMLElement | null>, on: boolean) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.toggleAttribute('inert', on)
  }, [ref, on])
}

/**
 * Fokusfalle fuer Sheets und Dialoge. Gibt die Ref zurueck, die auf
 * den Dialog gehoert.
 *
 * Beim Oeffnen: merkt sich das ausloesende Element, zieht den Fokus
 * in den Dialog. Waehrend: Tab laeuft im Kreis, Escape schliesst.
 * Beim Schliessen: Fokus zurueck zum Ausloeser.
 */
export function useDialog<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null)
  const opener = useRef<HTMLElement | null>(null)
  /* onClose kommt haeufig als frische Closure herein — ueber eine Ref
     gelesen, damit der Effekt nicht bei jedem Rendern neu aufgesetzt
     wird und dabei den Fokus verreisst. */
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    if (!open) return
    const el = ref.current
    opener.current = document.activeElement as HTMLElement | null

    /* Bewusst verzoegert: das Sheet faehrt per transform herein, vorher
       ist offsetParent null und nichts gilt als sichtbar. */
    const focusTimer = window.setTimeout(() => {
      if (!el) return
      /* Ohne ausdruecklichen Wunsch bekommt der Dialog selbst den Fokus:
         dann liest der Screenreader erst den Titel vor, statt mitten im
         Inhalt auf dem Schliessen-Knopf zu landen. Der Container traegt
         dafuer tabindex="-1". */
      const target = el.querySelector<HTMLElement>('[data-autofocus]') ?? el
      /* preventScroll ist hier kein Feinschliff, sondern Pflicht: 60ms nach
         dem Oeffnen steht das Sheet noch fast vollstaendig unterhalb des
         Bildschirms. Ohne den Schalter scrollt Safari den Telefonrahmen
         (overflow:hidden, aber programmatisch scrollbar) nach unten, um das
         fokussierte Element zu zeigen — und scrollt nie zurueck. Der ganze
         Screen sitzt danach verschoben. */
      target.focus({ preventScroll: true })
    }, 60)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close.current()
        return
      }
      if (e.key !== 'Tab' || !el) return
      const items = visibleFocusable(el)
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey)
      /* Nur zurueckgeben, wenn der Fokus noch im Dialog steht — sonst
         reisst man ihn dem Nutzer unter den Fingern weg. */
      const active = document.activeElement as HTMLElement | null
      if (!active || active === document.body || ref.current?.contains(active)) {
        opener.current?.focus({ preventScroll: true })
      }
    }
  }, [open])

  return ref
}

/**
 * Haelt den Telefonrahmen bei Scrollposition 0.
 *
 * Der Rahmen ist `overflow:hidden` — von Hand laesst sich dort nichts
 * scrollen, programmatisch aber schon: `focus()`, `scrollIntoView()` und
 * die Bildschirmtastatur schieben den Rahmen weg, wenn ein Element
 * ausserhalb des sichtbaren Bereichs liegt. Zurueck scrollt niemand, und
 * der Nutzer hat keine Geste, um es zu beheben — der Prototyp wirkt
 * kaputt. Deshalb hier ein Riegel statt einer Einzelfallbehandlung.
 */
export function useAnchoredScroll(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reset = () => {
      if (el.scrollTop !== 0) el.scrollTop = 0
      if (el.scrollLeft !== 0) el.scrollLeft = 0
    }
    el.addEventListener('scroll', reset, { passive: true })
    return () => el.removeEventListener('scroll', reset)
  }, [ref])
}

/**
 * Ziehen zum Schliessen. Liefert die Handler fuer den Griffbereich
 * und schreibt den Versatz direkt auf das Element — ueber den State
 * zu gehen wuerde bei jedem Pixel neu rendern.
 */
export function useDragToDismiss(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  const from = useRef<number | null>(null)

  const set = (px: number) => {
    const el = ref.current
    if (!el) return
    el.style.transition = px === 0 ? '' : 'none'
    el.style.transform = px === 0 ? '' : `translateY(${px}px)`
  }

  const onPointerDown = (e: React.PointerEvent) => {
    from.current = e.clientY
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (from.current == null) return
    /* Nur nach unten — nach oben laeuft die Geste ins Leere. */
    set(Math.max(0, e.clientY - from.current))
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (from.current == null) return
    const dy = e.clientY - from.current
    from.current = null
    set(0)
    if (dy > 110) onClose()
  }

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp }
}
