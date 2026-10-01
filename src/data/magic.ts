/* ============================================================
   NOURA — Magic Codes

   Die Kachel auf Home zeigt eine Wolke aus Codes, das Sheet
   erklaert sie — und ab hier loesen sie auch etwas ein: vier
   Zeichen, ein Platz, ein Zugang, der danach auf Home liegt.

   Drop und Zugang bleiben getrennt, weil ein Zugang seinen Drop
   ueberlebt. Der Code ist eine Stunde spaeter weg, der Platz auf
   der Liste nicht. Alles statisch, aber so geschnitten, dass ein
   echter Endpunkt dieselbe Form liefern koennte.

   Seit dem 2026-09-25 gibt es drei Quellen, und alle laufen durch
   dasselbe Feld mit demselben Alphabet (Konzept "Every code is a
   Magic Code", aus dem Pitch-Deck "Customer Hooks"):

     Creator-Drop    oeffentlich, 60 Minuten, feste Stueckzahl
     Partner-Vorteil oeffentlich, dauerhaft, nur im passenden Tarif
     Freundes-Code   privat, von einem Mitglied weitergegeben

   Das Ergebnis ist immer dasselbe: ein Zugang, der auf Home liegt.
   ============================================================ */
import { planTitle, PLANS, type Plan } from './plans'

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
export type DropKind = 'Festival' | 'Konzert' | 'Meet-up' | 'Vorteil' | 'Einladung'

/** Woher ein Code kommt. Die Quelle entscheidet, wie lange er lebt und
    fuer wen er gilt — nicht, wie er eingeloest wird. */
export type CodeSource = 'creator' | 'partner' | 'friend'

export interface Drop {
  id: string
  kind: DropKind
  source: CodeSource
  /** Nur in diesem Tarif einloesbar. Fehlt bei allem, was fuer alle gilt. */
  plan?: Plan['key']
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
  /** null = ohne Stueckzahl (Partner-Vorteile, Einladungen). */
  spots: number | null
  taken: number
  code: string
  /** Restlaufzeit in Minuten ab Sitzungsbeginn. 0 heisst abgelaufen,
      null heisst: laeuft nicht ab. */
  ttlMin: number | null
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
    source: 'creator',
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
    source: 'creator',
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
    source: 'creator',
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
    source: 'creator',
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

/* ---------- Partner-Vorteile ----------
   Oeffentlich ausgegeben, dauerhaft gueltig, aber an den Tarif
   gebunden. Die Auswahl folgt `magicScope` in plans.ts, damit die
   Vergleichszeile der Tarifwahl und diese Liste dasselbe sagen:
   CONNECT oeffnet Kino, Sport und Reisen (Konzerte kommen ueber die
   Creator-Drops, die fuer alle gelten), CREATE Tools, Lernvorteile
   und Co-Creations.

   Partner und Angebote sind erfunden, wie alles in dieser Datei. Was
   ein echter Partner beisteuert, steht zur Entscheidung (Konzept,
   Decision 3). */
const perk = (
  id: string,
  plan: Plan['key'],
  code: string,
  title: string,
  host: string,
  detail: string,
  when: string,
  place: string,
  grants: string,
): Drop => ({
  id, plan, code, title, host, detail, when, place, grants,
  kind: 'Vorteil', source: 'partner', spots: null, taken: 0, ttlMin: null,
})

export const PARTNER_PERKS: Drop[] = [
  perk('p-kino', 'connect', 'K2N4', 'Kino zu zweit', 'Lichtspiel Kinos',
    'Zwei Tickets zum Preis von einem', 'Jeden Dienstag, bis 31. Dezember',
    'Alle Lichtspiel-Häuser', 'Zweites Ticket gratis, Code an der Kasse zeigen'),
  perk('p-heimspiel', 'connect', 'SP7T', 'Heimspiel-Tickets', 'Stadionpass',
    'Stehplatz zum halben Preis', 'Heimspiele der Saison 2026/27',
    'Teilnehmende Stadien', 'Ein Stehplatz zum halben Preis je Spieltag'),
  perk('p-hostel', 'connect', 'TRV8', 'Hostel-Nacht zu zweit', 'Bunkbed Hostels',
    'Zweite Nacht gratis', 'Buchbar bis 31. März',
    'Hostels in 14 Städten', 'Bei zwei Nächten ist die zweite gratis'),
  perk('p-tools', 'create', 'TL9X', 'Kreativ-Tools Pro', 'Studio Stack',
    'Sechs Monate Pro für Foto, Video und Design', 'Einlösbar bis 31. Dezember',
    'Online', 'Sechs Monate Pro-Zugang, endet automatisch'),
  perk('p-lernen', 'create', 'LRN5', 'Sprach-App Premium', 'Lingo Lab',
    'Drei Monate Premium', 'Einlösbar bis 31. Dezember',
    'In der Lingo-Lab-App', 'Drei Monate Premium, endet automatisch'),
  perk('p-merch', 'create', 'WK3M', 'Merch mitgestalten', 'Mara Nova',
    'Über das nächste Design abstimmen', 'Abstimmung bis 15. Oktober',
    'In der App', 'Eine Stimme und ein Teil aus der ersten Auflage'),
]

/* ---------- Freundes-Codes ----------
   Privat weitergegeben. Einer steht hier, damit sich die Einladung
   vorfuehren laesst — der Wert fuer beide Seiten ist im Pitch-Deck
   offen ("unlocking rewards together") und hier bewusst eine Tuer,
   kein Rabatt: dieselbe Waehrung wie die Drops. */
export const FRIEND_CODES: Drop[] = [
  {
    id: 'f-jana',
    kind: 'Einladung',
    source: 'friend',
    title: 'Einladung von Jana',
    host: 'Jana · NOURA-Mitglied',
    detail: 'Community-Abend für Euch beide',
    when: 'Do, 8. Oktober · 19:00',
    place: 'NOURA Space, Berlin',
    grants: 'Ihr beide auf der Gästeliste des Community-Abends',
    spots: null,
    taken: 0,
    code: 'JANA',
    ttlMin: null,
  },
]

/** Der eigene Einladungscode des Vorfuehrkunden. Wer ihn selbst
    eintippt, bekommt keinen Zugang, sondern den Hinweis, ihn zu teilen. */
export const MY_INVITE = 'MRCL'

const ALL_CODES: Drop[] = [...DROPS, ...PARTNER_PERKS, ...FRIEND_CODES]

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
  d.ttlMin === null ? Infinity : Math.max(0, d.ttlMin - Math.floor((now - SESSION_START) / 60_000))

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
  d.spots === null
    ? Infinity
    : Math.max(0, d.spots - d.taken - (passes.some((p) => p.id === d.id) ? 1 : 0))

export type DropState = 'live' | 'full' | 'expired'

export const dropState = (d: Drop, passes: MagicPass[], now: number = Date.now()): DropState =>
  minutesLeft(d, now) === 0 ? 'expired' : spotsLeft(d, passes) === 0 ? 'full' : 'live'

export type RedeemFail = 'unknown' | 'already' | 'expired' | 'full' | 'plan' | 'own'
/** Bei 'plan' reist der Drop mit — die Meldung nennt den Tarif, der ihn oeffnet. */
export type RedeemMiss = { ok: false; reason: RedeemFail; drop?: Drop }
export type RedeemResult = { ok: true; pass: MagicPass } | RedeemMiss

/**
 * Vier Zeichen gegen die Drops pruefen.
 *
 * Die Reihenfolge der Pruefungen ist die Reihenfolge der Nuetzlichkeit:
 * "hast Du schon" hilft weiter, "ist abgelaufen" auch dann noch, wenn
 * beides zutrifft — und wer schon drin ist, will nicht hoeren, dass es
 * ausgebucht sei.
 *
 * `plan` ist der Tarif, in dem eingeloest wird. Vor dem Kauf ist das der
 * gerade gewaehlte — so sagt die Tarifwahl schon, ob ein Partner-Code
 * mit diesem Tarif etwas oeffnet.
 */
export function redeem(
  raw: string,
  passes: MagicPass[],
  plan: Plan['key'],
  now: number = Date.now(),
): RedeemResult {
  const code = normalizeCode(raw)
  if (code === MY_INVITE) return { ok: false, reason: 'own' }
  const drop = ALL_CODES.find((d) => d.code === code)
  if (!drop) return { ok: false, reason: 'unknown' }
  if (passes.some((p) => p.id === drop.id)) return { ok: false, reason: 'already' }
  if (drop.plan && drop.plan !== plan) return { ok: false, reason: 'plan', drop }
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
  plan: 'Dieser Vorteil gehört zu einem anderen Tarif.',
  own: 'Das ist Dein eigener Einladungscode. Teil ihn mit Freunden — einlösen können ihn nur sie.',
}

/** Die Meldung zu einem Fehlschlag. Beim Tarif-Fehlschlag nennt sie den
    Tarif, der den Vorteil oeffnet, statt nur "geht nicht" zu sagen. */
export function failText(miss: RedeemMiss): string {
  if (miss.reason === 'plan' && miss.drop?.plan) {
    const owner = PLANS.find((p) => p.key === miss.drop!.plan)
    if (owner) return `„${miss.drop.title}“ gehört zu ${planTitle(owner)}. Mit Deinem Tarif öffnet dieser Code nichts.`
  }
  return FAIL_TEXT[miss.reason]
}

/** Vorteile, die ein Tarif oeffnet — fuer die Liste im Magic-Sheet. */
export const perksFor = (plan: Plan['key']) => PARTNER_PERKS.filter((p) => p.plan === plan)
