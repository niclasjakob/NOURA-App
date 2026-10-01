/* ============================================================
   NOURA — Support-Chat: Themen, Erkennung, Antworten

   Bis zum 2026-09-24 kannte der Chat zwei Antworten: "Wir rufen Dich
   heute zwischen 16–18 Uhr zurueck" und, auf jede getippte Zeile,
   "Ein Mitarbeiter meldet sich in wenigen Minuten". Ein Chat, der nur
   vertroestet, ist ein Kontaktformular mit Blasen.

   Jetzt antwortet ein Assistent mit den Zahlen dieses Kunden — aus
   denselben Quellen wie Home und die Verbrauchsseite, nicht aus eigenem
   Text. Was er nicht sicher weiss, gibt er an einen Menschen ab.

   Drei Regeln aus generative-ai.md, obwohl hier nichts generiert
   wird — sie gelten fuer jeden automatischen Gespraechspartner:

   · Transparency: "Never trick someone into thinking they're
     interacting with … a human if they're actually interacting with
     AI." Der Kopf sagt, wer antwortet, und jede Blase nennt ihren
     Absender, sobald er wechselt.
   · Inputs: "Avoid requesting factual information unless you're
     confident the model has access to verified … information." Keine
     Antwort ohne Datenquelle. Unbekanntes endet beim Rueckruf, nicht
     in einer geratenen Antwort.
   · Outputs: "Messages that describe what's actually happening can be
     more helpful than a vague status message." Beim Warten steht, was
     gerade nachgesehen wird — nicht "Schreibt …".
   ============================================================ */

import { CYCLE, fmtDate, fmtEuro, type UsageSummary } from './account'
import { planTitle, type Plan } from './plans'

/* Das Thema "Roaming" samt Karte und Sprung ins Reise-Sheet ist am
   2026-09-25 mit der Reiseansicht entfallen. Fragen dazu landen jetzt
   beim Rueckruf (UNSURE) — der Assistent hat keine Datenquelle mehr
   dafuer, und ohne Datenquelle antwortet er nicht.

   "Mit dem Team chatten" ist am selben Tag entfallen (Niclas): zwei
   Wege zum Menschen, die sich nur im Kanal unterschieden, waren einer
   zu viel. Der Weg zum Team ist der Rueckruf, und der steht fest ueber
   dem Eingabefeld statt zwischen den Vorschlaegen (support-chat.tsx). */
export type Topic = 'usage' | 'bill' | 'esim' | 'plan' | 'magic' | 'callback'

/** Die Karte unter einer Antwort. Sie traegt Daten, der Text davor
    nur den Satz, der sie einordnet — beides dieselbe Zahl zu nennen
    waere doppelt. */
export type ChatCard = 'usage' | 'bill' | 'esim' | 'booking'

/** Wohin ein Sprung fuehrt. Er schliesst den Chat und oeffnet das
    Sheet: eines zur Zeit (sheets.md › Best practices). */
export type ChatJump = 'plan' | 'magic'

export interface SupportCtx {
  first: string
  phone: string
  plan: Plan
  usage: UsageSummary
}

export interface Answer {
  /** Was waehrend des Wartens nachgesehen wird. */
  status: string
  text: string
  card?: ChatCard
  jump?: { to: ChatJump; label: string }
  /** Anschlussfragen. Der Weg zum Team steht nie darunter — der
      Rueckruf ist immer sichtbar, ein zweiter Knopf dafuer waere
      doppelt. */
  next: Topic[]
}

/* ---------- Beschriftungen ----------
   Zugleich der Text der Antwortknoepfe und der eigenen Blase, die
   beim Tippen entsteht. Figma (1330:2679) sagt "Einen Anruf
   anfordern" — auf dem festen Knopf heisst es "Rückruf anfordern":
   angerufen wird man, nicht man selbst, und das Wort steht so auch in
   der Buchungskarte. */
export const topicLabel = (t: Topic): string => {
  switch (t) {
    case 'usage':
      return 'Mein Verbrauch'
    case 'bill':
      return 'Meine Rechnung'
    case 'esim':
      return 'eSIM aufs neue iPhone'
    case 'plan':
      return 'Tarif wechseln'
    case 'magic':
      return 'Magic Codes'
    case 'callback':
      return 'Rückruf anfordern'
  }
}

/** Die ersten Themen — genau die drei, die die Begruessung nennt. Der
    Rueckruf steht nicht darunter, er steht fest (siehe oben). */
export const START_TOPICS: Topic[] = ['usage', 'bill', 'plan']

export const greeting = (c: SupportCtx) =>
  `Hey ${c.first}!\nIch beantworte Fragen zu Tarif, Verbrauch und Rechnung — mit Deinen echten Zahlen. Wobei kann ich helfen?`

/* ---------- Erkennung ----------
   Schlagworte statt Sprachmodell: der Prototyp soll vorfuehrbar und
   vorhersagbar sein. Die Reihenfolge entscheidet — "neues Telefon"
   ist ein Geraetewechsel, kein Rueckruf, und "Tarif wechseln" kein
   Geraetewechsel.

   Reisefragen fuehren zu null, also zum Rueckruf. Ohne diese Zeile
   landete "Was kostet Roaming?" bei der Rechnung und "Datenvolumen im
   Ausland?" bei "unbegrenzt" — im Ausland stimmt das nicht.

   Wer nach einem Menschen fragt, bekommt den Rueckruf: das ist seit
   dem 2026-09-25 der einzige Weg zum Team. */
const INTENTS: [Topic | null, RegExp][] = [
  ['callback', /mensch|mitarbeiter|person|berater|agent|jemand(em)? (echt|reden|sprechen)/],
  ['esim', /e-?sim|iphone|neue[sn]? (handy|gerät|telefon)|übertrag|umzieh/],
  ['callback', /rückruf|zurückruf|anruf|ruf(t)? mich|callback|telefonier/],
  [null, /roaming|ausland|reise|urlaub|\beu\b|weltweit/],
  ['bill', /rechnung|abbuch|abgebucht|zahl|kostet|kosten|preis|lastschrift|geld|€/],
  ['usage', /verbrauch|volumen|\bgb\b|gigabyte|daten(?!schutz)|surf|wie ?viel/],
  ['magic', /magic|\bcode|festival|konzert|zugang|drop/],
  ['plan', /tarif|plan|kündig|vertrag|wechsel|upgrade|create|connect/],
]

const THANKS = /^(danke|dankeschön|thx|merci|super|perfekt|top|ok(ay)?|passt|alles klar|cool)\b/

export type Intent = Topic | 'thanks' | null

export function detect(input: string): Intent {
  const s = input.toLowerCase()
  if (THANKS.test(s.trim())) return 'thanks'
  for (const [topic, re] of INTENTS) if (re.test(s)) return topic
  return null
}

/* ---------- Antworten ----------
   Jede Zahl kommt aus data/account.ts oder data/plans.ts. Steht hier
   eine Zahl als Text, ist das ein Fehler: sie widerspricht beim
   naechsten Tarifwechsel der Karte daneben. */
export function answer(t: Exclude<Topic, 'callback'>, c: SupportCtx): Answer {
  const { plan } = c
  switch (t) {
    case 'usage':
      return {
        status: 'Schaut in Deinen Verbrauch …',
        text: 'Dein Datenvolumen ist unbegrenzt — knapp wird hier nichts. So sieht Dein Monat bisher aus:',
        card: 'usage',
        next: ['bill', 'plan'],
      }
    case 'bill':
      return {
        status: 'Holt Deine Rechnungsdaten …',
        text: `Deine nächste Rechnung kommt am ${fmtDate(CYCLE.invoiceDate)}.`,
        card: 'bill',
        next: ['usage', 'plan'],
      }
    case 'esim':
      return {
        status: 'Sucht die Schritte für Dein iPhone …',
        text: 'Deine eSIM zieht mit um — so geht’s:',
        card: 'esim',
        /* Keine Vorschlaege: wenn es hakt, ist der Rueckruf darunter
           der naechste Schritt, und der steht schon da. */
        next: [],
      }
    case 'plan':
      return {
        status: 'Öffnet Deinen Vertrag …',
        text: `Du bist im Tarif ${planTitle(plan)} für ${fmtEuro(plan.monthly)} im Monat. Wechseln oder kündigen kannst Du jeden Monat — gekündigt läuft er bis zum ${fmtDate(CYCLE.end)}.`,
        jump: { to: 'plan', label: 'Tarif ansehen' },
        next: ['usage', 'bill'],
      }
    case 'magic':
      return {
        status: 'Schreibt …',
        text: `Vier Zeichen von Creators, Partnern oder Freunden. Mit ${planTitle(plan)} öffnen Partner-Codes ${plan.magicScope} — eingelöst liegt der Zugang auf Home.`,
        jump: { to: 'magic', label: 'Code einlösen' },
        next: ['usage', 'bill'],
      }
  }
}

/** Die ehrliche Grenze. Lieber abgeben als raten — es geht um einen
    Vertrag, nicht um eine Plauderei. Der Satz davor, die Frage danach
    stellt der Chat selbst: nach einer Zeit, oder — steht der Rueckruf
    schon — der Hinweis auf den Termin. */
export const UNSURE = 'Da bin ich mir nicht sicher — und bei Deinem Vertrag rate ich nicht.'

/* ---------- Die Karte zum Geraetewechsel ----------
   iOS bietet die Uebertragung beim Einrichten selbst an; die Schritte
   nennen deshalb den Weg in iOS, nicht einen eigenen. */
export const ESIM_STEPS = [
  { title: 'Neues iPhone einrichten', text: 'Bei „Mobilfunk“ bietet iOS an, die eSIM zu übertragen. Später geht es unter Einstellungen → Mobilfunk → eSIM hinzufügen.' },
  { title: 'Altes iPhone daneben legen', text: 'Entsperrt lassen und die Übertragung dort bestätigen. Das dauert rund eine Minute.' },
  { title: 'Klappt es nicht?', text: 'Dann schicken wir Dir hier im Chat einen neuen Aktivierungscode.' },
]

/* ---------- Rueckruf ----------
   Die Zeitfenster sind die Antwortknoepfe selbst: ein Tipp bucht.
   Keine zweite Bestaetigung — die Wahl IST die Bestaetigung, und
   absagen geht in der Karte, die danach steht. */
export const CALLBACK_SLOTS = ['Heute, 12–14 Uhr', 'Heute, 16–18 Uhr', 'Morgen, 10–12 Uhr']

/** Wann das Team anruft. Steht im Kopf des Chats. */
export const TEAM_HOURS = '8–22 Uhr'
