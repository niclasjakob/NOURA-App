/* ============================================================
   NOURA — Support-Chat: Themen, Erkennung, Antworten

   Bis zum 2026-09-24 kannte der Chat zwei Antworten: "Wir rufen Dich
   heute zwischen 16–18 Uhr zurueck" und, auf jede getippte Zeile,
   "Ein Mitarbeiter meldet sich in wenigen Minuten". Ein Chat, der nur
   vertroestet, ist ein Kontaktformular mit Blasen.

   Jetzt antwortet ein Assistent mit den Zahlen dieses Kunden — aus
   denselben Quellen wie Home und das Reise-Sheet, nicht aus eigenem
   Text. Was er nicht sicher weiss, gibt er an einen Menschen ab.

   Drei Regeln aus generative-ai.md, obwohl hier nichts generiert
   wird — sie gelten fuer jeden automatischen Gespraechspartner:

   · Transparency: "Never trick someone into thinking they're
     interacting with … a human if they're actually interacting with
     AI." Der Kopf sagt, wer antwortet, und jede Blase nennt ihren
     Absender, sobald er wechselt.
   · Inputs: "Avoid requesting factual information unless you're
     confident the model has access to verified … information." Keine
     Antwort ohne Datenquelle. Unbekanntes endet beim Team, nicht in
     einer geratenen Antwort.
   · Outputs: "Messages that describe what's actually happening can be
     more helpful than a vague status message." Beim Warten steht, was
     gerade nachgesehen wird — nicht "Schreibt …".
   ============================================================ */

import { CYCLE, fmtDate, fmtEuro, fmtGb, type RoamingState, type UsageSummary } from './account'
import { planTitle, type Plan } from './plans'

export type Topic = 'usage' | 'bill' | 'roaming' | 'esim' | 'plan' | 'magic' | 'callback' | 'human'

/** Die Karte unter einer Antwort. Sie traegt Daten, der Text davor
    nur den Satz, der sie einordnet — beides dieselbe Zahl zu nennen
    waere doppelt. */
export type ChatCard = 'usage' | 'bill' | 'roaming' | 'esim' | 'booking'

/** Wohin ein Sprung fuehrt. Er schliesst den Chat und oeffnet das
    Sheet: eines zur Zeit (sheets.md › Best practices). */
export type ChatJump = 'roaming' | 'plan' | 'magic'

export interface SupportCtx {
  first: string
  phone: string
  plan: Plan
  roaming: RoamingState
  usage: UsageSummary
}

export interface Answer {
  /** Was waehrend des Wartens nachgesehen wird. */
  status: string
  text: string
  card?: ChatCard
  jump?: { to: ChatJump; label: string }
  /** Anschlussfragen. Die letzte ist fast immer der Weg zum Team —
      wer steckenbleibt, soll nicht tippen muessen, um rauszukommen. */
  next: Topic[]
}

/* ---------- Beschriftungen ----------
   Zugleich der Text der Antwortknoepfe und der eigenen Blase, die
   beim Tippen entsteht. "Einen Anruf anfordern" ist der Wortlaut aus
   Figma (1330:2679). "Chatte mit uns" ist entfallen: im Chat selbst
   sagt es nichts — gemeint war immer der Mensch statt des Anrufs. */
const inCountry = (country: string) =>
  /* Weibliche Laendernamen tragen den Artikel: "in der Tuerkei",
     aber "in Spanien". */
  ['Türkei', 'Schweiz'].includes(country) ? `in der ${country}` : `in ${country}`

export const topicLabel = (t: Topic, c: SupportCtx): string => {
  switch (t) {
    case 'usage':
      return 'Mein Verbrauch'
    case 'bill':
      return 'Meine Rechnung'
    case 'roaming':
      return c.roaming.zone === 'home' ? 'Roaming auf Reisen' : `Daten ${inCountry(c.roaming.country)}`
    case 'esim':
      return 'eSIM aufs neue iPhone'
    case 'plan':
      return 'Tarif wechseln'
    case 'magic':
      return 'Magic Codes'
    case 'callback':
      return 'Einen Anruf anfordern'
    case 'human':
      return 'Mit dem Team chatten'
  }
}

/** Die ersten Themen. Wer im Ausland eingebucht ist, sieht das Reisen
    zuerst — die wahrscheinlichste Frage in dem Moment
    (offering-help.md › Best practices: "directly relate the help you
    provide to the precise action or task people are doing right
    now"). Vier, nicht mehr: jeder Knopf ist 61px hoch. */
export const startTopics = (c: SupportCtx): Topic[] =>
  c.roaming.zone === 'home' ? ['usage', 'bill', 'callback', 'human'] : ['roaming', 'usage', 'callback', 'human']

export const greeting = (c: SupportCtx) =>
  `Hey ${c.first}!\nIch beantworte Fragen zu Tarif, Verbrauch und Reisen — mit Deinen echten Zahlen. Wobei kann ich helfen?`

/* ---------- Erkennung ----------
   Schlagworte statt Sprachmodell: der Prototyp soll vorfuehrbar und
   vorhersagbar sein. Die Reihenfolge entscheidet — "neues Telefon"
   ist ein Geraetewechsel, kein Rueckruf, und "Tarif wechseln" kein
   Geraetewechsel. */
const INTENTS: [Topic, RegExp][] = [
  ['human', /mensch|mitarbeiter|person|berater|agent|jemand(em)? (echt|reden|sprechen)/],
  ['esim', /e-?sim|iphone|neue[sn]? (handy|gerät|telefon)|übertrag|umzieh/],
  ['callback', /rückruf|zurückruf|anruf|ruf(t)? mich|callback|telefonier/],
  ['roaming', /roaming|ausland|reise|urlaub|spanien|türkei|\beu\b|weltweit/],
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
export function answer(t: Exclude<Topic, 'callback' | 'human'>, c: SupportCtx): Answer {
  const { plan, roaming: r } = c
  switch (t) {
    case 'usage':
      return {
        status: 'Schaut in Deinen Verbrauch …',
        text: 'Dein Datenvolumen ist unbegrenzt — knapp wird hier nichts. So sieht Dein Monat bisher aus:',
        card: 'usage',
        next: ['bill', 'plan', 'human'],
      }
    case 'bill':
      return {
        status: 'Holt Deine Rechnungsdaten …',
        text: `Deine nächste Rechnung kommt am ${fmtDate(CYCLE.invoiceDate)}.`,
        card: 'bill',
        next: ['usage', 'plan', 'human'],
      }
    case 'roaming': {
      const text =
        r.zone === 'home'
          ? `Du bist im Heimatnetz. In der EU surfst Du zum Inlandspreis, bis ${fmtGb(r.euFupGb, 0)} im Monat. Außerhalb der EU buchst Du vor der Reise ein Paket dazu, ab 4,99 €.`
          : r.zone === 'eu'
            ? `Du bist ${inCountry(r.country)} bei ${r.network} eingebucht. EU-Roaming läuft zum Inlandspreis — so viel ist von Deiner Fair-Use-Grenze genutzt:`
            : (r.allowanceGb ?? 0) === 0
              ? `Du bist ${inCountry(r.country)} bei ${r.network} eingebucht. Dort ist in Deinem Tarif kein Volumen enthalten, und wir schalten nichts automatisch zu. Pakete gibt es ab 4,99 €.`
              : `Du bist ${inCountry(r.country)} bei ${r.network} eingebucht. So viel von Deinem Reisevolumen ist genutzt:`
      return {
        status: 'Prüft, wo Du eingebucht bist …',
        text,
        /* Eine Karte nur, wenn es etwas zu messen gibt. Im Heimatnetz
           und ohne Reisevolumen haette sie nur den Satz wiederholt. */
        card: r.zone === 'eu' || (r.allowanceGb ?? 0) > 0 ? 'roaming' : undefined,
        jump: {
          to: 'roaming',
          label: r.zone === 'world' && (r.allowanceGb ?? 0) === 0 ? 'Datenpaket buchen' : 'Reisen öffnen',
        },
        next: ['usage', 'callback', 'human'],
      }
    }
    case 'esim':
      return {
        status: 'Sucht die Schritte für Dein iPhone …',
        text: 'Deine eSIM zieht mit um — so geht’s:',
        card: 'esim',
        next: ['callback', 'human'],
      }
    case 'plan':
      return {
        status: 'Öffnet Deinen Vertrag …',
        text: `Du bist im Tarif ${planTitle(plan)} für ${fmtEuro(plan.monthly)} im Monat. Wechseln oder kündigen kannst Du jeden Monat — gekündigt läuft er bis zum ${fmtDate(CYCLE.end)}.`,
        jump: { to: 'plan', label: 'Plan ansehen' },
        next: ['usage', 'bill', 'human'],
      }
    case 'magic':
      return {
        status: 'Schreibt …',
        text: `Vier Zeichen aus einem Stream, von Creators oder von Freunden. Mit ${planTitle(plan)} öffnen sie ${plan.magicScope} — eingelöst stehst Du auf der Liste.`,
        jump: { to: 'magic', label: 'Code einlösen' },
        next: ['usage', 'human'],
      }
  }
}

/** Die ehrliche Grenze. Lieber abgeben als raten — es geht um einen
    Vertrag, nicht um eine Plauderei. */
export const FALLBACK: Answer = {
  status: 'Schreibt …',
  text: 'Da bin ich mir nicht sicher — und bei Deinem Vertrag rate ich nicht. Soll Dich jemand aus dem Team übernehmen?',
  next: ['human', 'callback'],
}

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

/* ---------- Uebergabe an einen Menschen ----------
   Im Prototyp steht die Warteschlange fest: zwei Plaetze, dann ist
   Lea da. Die Zeiten sind kurz genug fuer eine Vorfuehrung und lang
   genug, dass die Warteschlange als Warteschlange lesbar ist. */
export const AGENT = { name: 'Lea', initial: 'L', team: 'Serviceteam' }
export const TEAM_HOURS = '8–22 Uhr'
export const QUEUE_MS = [1400, 1400]

export const agentHello = (c: SupportCtx) =>
  `Hi ${c.first}, ich bin ${AGENT.name}. Ich sehe Deinen Verlauf mit dem Assistenten — was kann ich für Dich tun?`

/** Was Lea auf freie Nachrichten sagt. Mehr als zwei Saetze kann ein
    Prototyp einem Menschen nicht glaubhaft in den Mund legen. */
export const AGENT_REPLIES = [
  'Danke, ich schau mir das in Deinem Konto an und melde mich hier gleich. Du kannst den Chat solange schließen — die Antwort kommt als Mitteilung.',
  'Ist notiert. Ich bin noch dran.',
]
