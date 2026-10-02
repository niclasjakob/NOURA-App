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

/* Was beim Beruehren nicht zum Ziehen des Sheets fuehren darf. */
const NO_SHEET_DRAG = 'input, textarea, select, [contenteditable], [data-no-sheet-drag]'

/* Nachgeben mit wachsendem Widerstand, wie UIScrollView am Rand: nahe
   null folgt es dem Finger fast eins zu eins, nach oben hin naehert es
   sich `max`, ohne es je zu erreichen. */
const rubber = (x: number, max: number) => (1 - 1 / ((x * 0.55) / max + 1)) * max

type SheetDrag = {
  y0: number
  /** Sichtbare Hoehe des Sheets — ohne den Ueberstand unter der Kante. */
  h: number
  overhang: number
  phone: HTMLElement | null
  dy: number
  samples: { t: number; y: number }[]
}

/**
 * Ziehen zum Schliessen, wie bei einem iOS-Sheet.
 *
 * Bis zum 2026-10-01 ging das nur am Griff — einem 16px hohen Streifen —,
 * hart ab 110px, und beim Loslassen fuhr das Sheet aus dem Stand mit
 * ease-in los, egal wie schnell der Finger war. Jetzt:
 *
 * - **Ueberall ziehbar per Touch**, solange der Inhalt oben steht. Steht
 *   er tiefer, scrollt er erst — wie unter iOS. Waagerechte Gesten
 *   (Zurueck-Wischen der Kontoseiten) und Eingabefelder bleiben frei.
 *   Mit der Maus weiter am Griff.
 * - **Der Screen dahinter folgt dem Finger**: --sheet-drag am Rahmen
 *   (0 oben, 1 unten), daraus rechnen Kartenstapel und Schleier.
 * - **Nach oben gibt es nach** (rubber), bis hoechstens zum Ueberstand.
 * - **Loslassen nach Tempo**: ein Wurf schliesst auch auf kurzer
 *   Strecke, und das Sheet faehrt mit dem Tempo des Fingers weiter statt
 *   neu anzufahren. Sonst federt es zurueck.
 *
 * Der Versatz geht direkt aufs Element — ueber den State wuerde bei
 * jedem Pixel neu gerendert. Liefert die Handler fuer den Griff.
 */
export function useDragToDismiss(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useRef(onClose)
  close.current = onClose
  const drag = useRef<SheetDrag | null>(null)
  const settleTimer = useRef<number>()

  /* begin/move/end lesen nur Refs — deshalb darf der Effekt unten sie
     aus dem ersten Rendern festhalten. */
  const begin = (y: number) => {
    const el = ref.current
    if (!el) return
    window.clearTimeout(settleTimer.current)
    const phone = el.closest<HTMLElement>('.phone')
    const overhang = parseFloat(getComputedStyle(el).paddingBottom) || 0
    drag.current = { y0: y, h: el.offsetHeight - overhang, overhang, phone, dy: 0, samples: [{ t: performance.now(), y }] }
    el.style.transition = 'none'
    phone?.setAttribute('data-sheet-motion', 'drag')
  }

  const move = (y: number) => {
    const d = drag.current
    const el = ref.current
    if (!d || !el) return
    const raw = y - d.y0
    d.dy = raw >= 0 ? raw : -rubber(-raw, d.overhang)
    const now = performance.now()
    d.samples.push({ t: now, y })
    while (d.samples.length > 2 && now - d.samples[0].t > 100) d.samples.shift()
    el.style.transform = `translateY(${d.dy}px)`
    d.phone?.style.setProperty('--sheet-drag', String(Math.min(1, Math.max(0, d.dy / d.h))))
  }

  const settle = (el: HTMLElement, phone: HTMLElement | null) => {
    el.style.transition = ''
    el.style.transform = ''
    phone?.removeAttribute('data-sheet-motion')
    phone?.style.removeProperty('--sheet-drag')
    phone?.style.removeProperty('--fling-dur')
    phone?.style.removeProperty('--fling-ease')
  }

  /** Gibt zurueck, ob sich das Sheet bewegt hat. */
  const end = (): boolean => {
    const d = drag.current
    const el = ref.current
    drag.current = null
    if (!d || !el) return false
    const now = performance.now()
    const first = d.samples[0]
    const last = d.samples[d.samples.length - 1]
    /* Tempo in px/ms, positiv nach unten. Hat der Finger vor dem
       Loslassen innegehalten, zaehlt das als Stillstand. */
    const v = now - last.t > 80 || last.t === first.t ? 0 : (last.y - first.y) / (last.t - first.t)
    const phone = d.phone

    const dismiss = d.dy > 0 && v > -0.2 && (v > 0.5 || d.dy + v * 200 > Math.min(160, d.h * 0.25))
    if (dismiss) {
      /* Die Kurve beginnt mit dem Tempo des Fingers: ihre Anfangssteigung
         ist v, umgerechnet auf Restweg und Dauer. Endet abbremsend. */
      const T = 320 // --dur-move
      const rest = Math.max(1, el.offsetHeight * 1.05 - d.dy)
      const k = Math.min(3, (Math.max(0, v) * T) / rest)
      const ease = `cubic-bezier(0.33, ${(0.33 * k).toFixed(3)}, 0.6, 1)`
      el.style.transition = `transform ${T}ms ${ease}`
      el.style.transform = 'translateY(105%)'
      phone?.style.setProperty('--fling-dur', `${T}ms`)
      phone?.style.setProperty('--fling-ease', ease)
      phone?.setAttribute('data-sheet-motion', 'fling')
      close.current()
      settleTimer.current = window.setTimeout(() => settle(el, phone), T)
    } else {
      el.style.transition = 'transform var(--dur-screen) var(--spring)'
      el.style.transform = ''
      phone?.style.removeProperty('--sheet-drag')
      phone?.setAttribute('data-sheet-motion', 'settle')
      settleTimer.current = window.setTimeout(() => settle(el, phone), 460) // --dur-screen
    }
    return d.dy !== 0
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let start: { x: number; y: number; scroller: HTMLElement | null } | null = null
    let live = false

    /* Wer gezogen hat, hat nicht getippt: der Klick, den Safari danach
       eventuell noch schickt, landet sonst auf der Zeile unter dem Finger. */
    const swallow = (e: Event) => {
      e.stopPropagation()
      e.preventDefault()
    }

    const onStart = (e: TouchEvent) => {
      start = null
      live = false
      if (e.touches.length !== 1 || !el.classList.contains('on')) return
      const target = e.target as Element
      if (target.closest(NO_SHEET_DRAG)) return
      const t = e.touches[0]
      start = { x: t.clientX, y: t.clientY, scroller: target.closest<HTMLElement>('.sheet-body') }
    }
    const onMove = (e: TouchEvent) => {
      if (!start) return
      const t = e.touches[0]
      if (!live) {
        const dx = t.clientX - start.x
        const dy = t.clientY - start.y
        /* Entschieden wird nach 4px — vor der Schwelle, ab der iOS selbst
           zu scrollen beginnt; danach liesse sich das nicht mehr abfangen. */
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || (start.scroller && start.scroller.scrollTop > 0)) {
          start = null
          return
        }
        live = true
        begin(t.clientY)
      }
      if (e.cancelable) e.preventDefault()
      move(t.clientY)
    }
    const onEnd = () => {
      if (live && end()) {
        el.addEventListener('click', swallow, { capture: true, once: true })
        window.setTimeout(() => el.removeEventListener('click', swallow, { capture: true }), 400)
      }
      start = null
      live = false
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
      window.clearTimeout(settleTimer.current)
    }
  }, [ref])

  /* Maus und Stift am Griff. Beruehrung laeuft ueber die Touch-Ereignisse
     oben — sie decken den Griff mit ab, und doppelt gezaehlt waere jeder
     Zug zweimal so lang. */
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    begin(e.clientY)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' || !drag.current) return
    move(e.clientY)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    end()
  }

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp }
}
