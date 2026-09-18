/* ============================================================
   NOURA — Magic Codes

   Die Kachel auf Home zeigt eine Wolke aus Codes, das Sheet
   erklaert sie — und ab hier loesen sie auch etwas ein: vier
   Zeichen, ein Platz, ein Zugang, der danach auf Home liegt.

   Drop und Zugang bleiben getrennt, weil ein Zugang seinen Drop
   ueberlebt. Der Code ist eine Stunde spaeter weg, der Platz auf
   der Liste nicht. Alles statisch, aber so geschnitten, dass ein
   echter Endpunkt dieselbe Form liefern koennte.
   ============================================================ */

/* Ohne I, O, 0, 1 — auf dem Display sind sie nicht zu unterscheiden,
   und ein Code, den man abtippen soll, darf nicht raten lassen.
   Steht hier und nicht in der Kachel: Wolke, Eingabefeld und Pruefung
   muessen sich zwangslaeufig ueber dasselbe Alphabet einig sein. */
export const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODE_LEN = 4

const pick = () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
export const randomCode = (len = CODE_LEN) => Array.from({ length: len }, pick).join('')

/** Eingetipptes auf die Form bringen, die ein Code ueberhaupt haben kann. */
export const normalizeCode = (raw: string) =>
  raw.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, CODE_LEN)

/* ---------- Drops ---------- */
export type DropKind = 'Festival' | 'Konzert' | 'Meet-up'

export interface Drop {
  id: string
  kind: DropKind
  title: string
  /** Wer einlaedt — Veranstalter oder Creator */
  host: string
  /** Einzeiler unter dem Titel, in der Uebersicht */
  detail: string
  when: string
  place: string
  /** Was der Code konkret oeffnet. Steht spaeter auf dem Zugang und ist
      der einzige Grund, warum jemand vier Zeichen abtippt. */
  grants: string
  spots: number
  taken: number
  code: string
  /** Restlaufzeit in Minuten ab Sitzungsbeginn. 0 heisst abgelaufen. */
  ttlMin: number
}

/* Alle Namen, Orte und Codes erfunden — der Prototyp soll niemandem in
   den Mund legen, dass er mitmacht.

   Die vier Eintraege sind bewusst so gesetzt, dass jeder Ausgang der
   Pruefung vorfuehrbar ist: zwei gelten, einer ist vergriffen, einer ist
   abgelaufen. Ein Ablauf, den man nur im Gutfall sieht, ist im Review
   nur die halbe Wahrheit. */
export const DROPS: Drop[] = [
  {
    id: 'nordlicht',
    kind: 'Festival',
    title: 'Nordlicht Open Air',
    host: 'Nordlicht Kollektiv',
    detail: 'Tagesslot Hauptbühne + Backstage-Rundgang',
    when: 'Fr, 18. September · Einlass ab 16:00',
    place: 'Elbpark Hamburg',
    grants: 'Tagesticket Hauptbühne, Backstage-Rundgang um 18:30',
    spots: 60,
    taken: 48,
    code: 'T4JQ',
    ttlMin: 47,
  },
  {
    id: 'kira',
    kind: 'Konzert',
    title: 'KIRA — Astra Kulturhaus',
    host: 'KIRA',
    detail: 'Gästeliste statt Vorverkauf, inkl. Soundcheck',
    when: 'Do, 24. September · 20:00',
    place: 'Astra Kulturhaus, Berlin',
    grants: 'Platz auf der Gästeliste, Zutritt zum Soundcheck ab 18:00',
    spots: 30,
    taken: 24,
    code: '9BXM',
    ttlMin: 12,
  },
  {
    id: 'fotowalk',
    kind: 'Meet-up',
    title: 'Frame & Focus Fotowalk',
    host: '@leo.baumann',
    detail: 'Drei Stunden durch die Speicherstadt',
    when: 'So, 27. September · 11:00',
    place: 'Speicherstadt, Hamburg',
    grants: 'Ein Platz in der Gruppe, Leihobjektiv vor Ort',
    spots: 18,
    taken: 18,
    code: 'HK52',
    ttlMin: 33,
  },
  {
    id: 'hafenklang',
    kind: 'Konzert',
    title: 'Hafenklang Nachtsession',
    host: 'Hafenklang',
    detail: 'Late Slot, drei Acts, kein Vorverkauf',
    when: 'Sa, 30. August · 23:00',
    place: 'Hafenklang, Hamburg',
    grants: 'Später Einlass ohne Anstehen',
    spots: 25,
    taken: 11,
    code: 'RM86',
    ttlMin: 0,
  },
]

/* Der ausfuehrliche Drop auf der Konzeptseite. Er hat bewusst keinen
   Code: sein Code faellt erst heute Abend im Stream — das ist der
   Zustand, den die Seite erklaert, und nicht einzuloesen. */
export const FEATURED = {
  creator: 'Mara Nova',
  handle: '@mara.nova',
  initials: 'MN',
  title: 'Studio-Session in Berlin',
  when: 'Sa, 12. September · 19:00',
  place: 'Kreuzberg — die Adresse kommt mit dem Code',
  spots: 40,
  taken: 28,
  text: 'Kein Vorverkauf, keine Warteliste, keine Gästeliste. Mara wirft den Magic Code heute Abend live in den Stream — wer ihn zuerst einlöst, steht auf der Liste.',
}

/* ---------- Laufzeit ----------
   Verankert am Sitzungsbeginn, nicht am DEMO_TODAY aus account.ts: der
   Stichtag dort liegt im Juli 2026, gegen ihn gerechnet waere jeder Code
   seit Wochen tot. So laeuft die Stunde in der Vorfuehrung tatsaechlich
   ab — der Konzert-Code stirbt nach zwoelf Minuten vor Publikum. */
const SESSION_START = Date.now()

export const minutesLeft = (d: Drop, now: number = Date.now()) =>
  Math.max(0, d.ttlMin - Math.floor((now - SESSION_START) / 60_000))

/* ---------- Zugaenge ---------- */
export interface MagicPass {
  /** Gleich der Drop-Id: pro Drop gibt es genau einen Zugang. */
  id: string
  drop: Drop
  /** Einlass-Code am Eingang. Laenger als der Magic Code, weil er
      gescannt und nicht abgetippt wird. */
  entry: string
  redeemedAt: number
}

/** Freie Plaetze. Der eigene Zugang zaehlt mit — sonst behauptet die
    Liste nach dem Einloesen unveraendert dieselbe Zahl. */
export const spotsLeft = (d: Drop, passes: MagicPass[]) =>
  Math.max(0, d.spots - d.taken - (passes.some((p) => p.id === d.id) ? 1 : 0))

export type DropState = 'live' | 'full' | 'expired'

export const dropState = (d: Drop, passes: MagicPass[], now: number = Date.now()): DropState =>
  minutesLeft(d, now) === 0 ? 'expired' : spotsLeft(d, passes) === 0 ? 'full' : 'live'

export type RedeemFail = 'unknown' | 'already' | 'expired' | 'full'
export type RedeemResult = { ok: true; pass: MagicPass } | { ok: false; reason: RedeemFail }

/**
 * Vier Zeichen gegen die Drops pruefen.
 *
 * Die Reihenfolge der Pruefungen ist die Reihenfolge der Nuetzlichkeit:
 * "hast Du schon" hilft weiter, "ist abgelaufen" auch dann noch, wenn
 * beides zutrifft — und wer schon drin ist, will nicht hoeren, dass es
 * ausgebucht sei.
 */
export function redeem(raw: string, passes: MagicPass[], now: number = Date.now()): RedeemResult {
  const code = normalizeCode(raw)
  const drop = DROPS.find((d) => d.code === code)
  if (!drop) return { ok: false, reason: 'unknown' }
  if (passes.some((p) => p.id === drop.id)) return { ok: false, reason: 'already' }
  if (minutesLeft(drop, now) === 0) return { ok: false, reason: 'expired' }
  if (spotsLeft(drop, passes) === 0) return { ok: false, reason: 'full' }
  return {
    ok: true,
    pass: { id: drop.id, drop, entry: `${randomCode()}-${randomCode()}`, redeemedAt: now },
  }
}

/** Klartext zum Fehlschlag. Steht hier, damit Sheet und Toast dieselbe
    Auskunft geben und nicht zwei Wahrheiten entstehen. */
export const FAIL_TEXT: Record<RedeemFail, string> = {
  unknown: 'Diesen Code kennen wir nicht. Prüf die vier Zeichen — I, O, 0 und 1 kommen nie vor.',
  already: 'Diesen Zugang hast Du schon. Er liegt unter „Deine Zugänge“.',
  expired: 'Dieser Code ist abgelaufen. Jeder Magic Code lebt 60 Minuten, dann ist er weg.',
  full: 'Zu spät — für diesen Drop ist kein Platz mehr frei.',
}
