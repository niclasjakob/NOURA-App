/* ============================================================
   NOURA — Inhalte der Kontoseiten

   Was hinter den Zeilen im Konto-Sheet steht. Bis zum 2026-09-24
   fuehrten die fuenf Zeilen ins Leere: ein Tipp, keine Antwort.

   Zwei Regeln aus den HIG haben die Auswahl bestimmt:

   · Nichts doppeln, was iOS schon regelt (settings.md › Best
     practices: "Respect people's systemwide settings and avoid
     including redundant versions of them"). Deshalb gibt es hier
     keinen Hell/Dunkel-Schalter, keine Textgroesse und keinen
     Schalter fuer reduzierte Bewegung — und die Benachrichtigungen
     sagen, was in iOS eingestellt wird.
   · Werbung nur mit Zustimmung (managing-notifications.md › Sending
     marketing notifications). Deshalb steht "Neuigkeiten und
     Angebote" in einem eigenen Abschnitt und ist ab Werk aus —
     genau wie alles, was Daten auswertet.
   ============================================================ */

export type AcctPage = 'security' | 'notifications' | 'appearance' | 'help' | 'docs' | 'payment'

/** Titel der Seite = Beschriftung der Zeile, die sie oeffnet. Wer die
    Zeile umbenennt, benennt die Seite mit. */
export const ACCT_PAGE_TITLE: Record<AcctPage, string> = {
  security: 'Sicherheit und Datenschutz',
  notifications: 'Benachrichtigungen',
  appearance: 'Darstellung',
  help: 'Hilfe',
  docs: 'Dokumente',
  payment: 'Zahlung',
}

export interface Setting {
  key: string
  label: string
  note: string
  /** Voreinstellung. Alles, was auswertet oder wirbt, steht auf aus. */
  on: boolean
}

/* ---------- Sicherheit und Datenschutz ---------- */
export const SECURITY_SIGNIN: Setting[] = [
  { key: 'faceid', label: 'Mit Face ID öffnen', note: 'NOURA fragt beim Öffnen nach Deinem Gesicht.', on: true },
]
export const SECURITY_SIM: Setting[] = [
  { key: 'simpin', label: 'SIM-PIN', note: 'Nach jedem Neustart fragt Dein iPhone nach der PIN.', on: true },
]
export const SECURITY_DATA: Setting[] = [
  {
    key: 'analytics',
    label: 'Nutzung anonym auswerten',
    note: 'Welche Screens Du wie oft öffnest — ohne Verbindungsdaten, ohne Standort.',
    on: false,
  },
  {
    key: 'personal',
    label: 'Persönliche Angebote',
    note: 'Magic Codes und Aktionen, passend zu Deinem Verbrauch.',
    on: false,
  },
]

/* ---------- Benachrichtigungen ----------
   Zwei Gruppen, weil die HIG sie trennen: was zum Vertrag gehoert, und
   Werbung. Die Sicherheitsmeldungen stehen ausserhalb beider — sie
   lassen sich nicht abschalten, und das wird gesagt statt mit einem
   gesperrten Schalter angedeutet. */
export const NOTIFY_SERVICE: Setting[] = [
  {
    key: 'drops',
    label: 'Magic Code Drops',
    note: 'Wenn ein Drop öffnet — die Plätze sind oft in Minuten weg.',
    on: true,
  },
  { key: 'invoice', label: 'Rechnung', note: 'Wenn Deine Monatsrechnung bereitliegt.', on: true },
]
export const NOTIFY_MARKETING: Setting[] = [
  {
    key: 'news',
    label: 'Neuigkeiten und Angebote',
    note: 'Nur, wenn Du das hier einschaltest. Abschalten geht jederzeit.',
    on: false,
  },
]

/* ---------- Darstellung ----------
   Hiess bis zum 2026-09-24 "Ansichtsmodus" und liess einen
   Hell/Dunkel-Umschalter erwarten. NOURA ist dauerhaft dunkel (siehe
   Design-System), und einen App-eigenen Umschalter raten die HIG
   ausdruecklich ab (dark-mode.md › Best practices: "Avoid offering an
   app-specific appearance setting"). Was bleibt, ist das, was nur
   NOURA selbst entscheiden kann: ob die App tippt. */
export const APPEARANCE: Setting[] = [
  {
    key: 'haptics',
    label: 'Haptik',
    note: 'Ein kurzes Tippen bei Auswahl, Bestätigung und wenn Deine eSIM ins Netz geht.',
    on: true,
  },
]

export const DEFAULT_SETTINGS: Record<string, boolean> = Object.fromEntries(
  [...SECURITY_SIGNIN, ...SECURITY_SIM, ...SECURITY_DATA, ...NOTIFY_SERVICE, ...NOTIFY_MARKETING, ...APPEARANCE].map(
    (s) => [s.key, s.on],
  ),
)

/* ---------- Hilfe ----------
   Die vier Fragen, die der Ablauf selbst aufwirft: Geraetewechsel
   (eSIM statt Plastik), Nummer (Mitnahme in der Bestellung), Magic
   Codes (das eigene Bauteil) und Kuendigung (monatlich, im Plan-Sheet).
   Die Antworten nennen den Weg in DIESER App, nicht allgemeine
   Mobilfunk-Hilfe. Die Roaming-Frage zeigte ins Reise-Sheet und ist
   mit ihm am 2026-09-25 entfallen. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Neues iPhone — wie kommt meine eSIM mit?',
    a: 'Beim Einrichten des neuen iPhones bietet iOS an, die eSIM zu übertragen. Klappt das nicht, schreib uns im Chat — Du bekommst einen neuen Aktivierungscode.',
  },
  {
    q: 'Kann ich meine alte Nummer behalten?',
    a: 'Ja. Wähl bei der Bestellung „Nummer mitnehmen“. Bis der Wechsel durch ist, erreichen wir Dich unter einer Übergangsnummer.',
  },
  {
    q: 'Was sind Magic Codes?',
    a: 'Vier Zeichen von Creators, Partnern oder Freunden. Du löst sie über die Magic-Code-Karte auf Home ein — oder schon bei der Tarifwahl, dann wartet Dein Platz, bis die eSIM läuft.',
  },
  {
    q: 'Wie kündige ich?',
    a: 'Jeden Monat, direkt in der App: Tipp auf Home Deine Karte an, dann „Verträge hier kündigen“. Dein Tarif läuft bis zum Ende des Abrechnungszeitraums, die Bestätigung liegt danach unter Dokumente.',
  },
]
