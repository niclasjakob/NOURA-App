/* ============================================================
   NOURA — Konto-, Verbrauchs- und Reisedaten

   Prototyp: alles statisch, aber so geschnitten, dass ein echter
   Endpunkt dieselbe Form liefern koennte. Abgeleitete Werte
   (Prognose, Zyklustag) werden gerechnet, nicht hart notiert —
   sonst widersprechen sie sich beim ersten Datenwechsel.
   ============================================================ */

import type { Plan } from './plans'
import type { Beat } from '../components/esim-forge'

/** Fester Stichtag, damit die Vorfuehrung reproduzierbar bleibt.
    Im Echtbetrieb hier `new Date()` einsetzen. */
export const DEMO_TODAY = new Date(2026, 6, 19, 10, 0, 0)

/* ---------- Abrechnungszeitraum ---------- */
export const CYCLE = {
  start: new Date(2026, 6, 8),
  end: new Date(2026, 7, 7),
  invoiceDate: new Date(2026, 7, 8),
  /* Kein Betrag mehr: er haengt am gewaehlten Tarif und wird dort
     gerechnet (CycleCard in components/usage.tsx). Als feste Zahl hier
     widersprach er dem Tarifpreis, sobald einer von beiden sich
     bewegte — und genau das war zuletzt der Fall. */
}

const DAY_MS = 86_400_000
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
/** Differenz in ganzen Tagen. Math.round faengt die Sommerzeitstunde ab. */
const daysBetween = (a: Date, b: Date) => Math.round((midnight(b).getTime() - midnight(a).getTime()) / DAY_MS)

/* ---------- Verbrauch ----------
   Ein Wert je abgeschlossenem Tag. Die Summe ist der angezeigte
   Verbrauch — so bleiben Verlauf und Zahl zwangslaeufig konsistent. */
export const DAILY_GB = [2.4, 3.1, 1.8, 4.2, 2.9, 3.6, 2.2, 1.9, 3.8, 2.7, 3.5]
export const LAST_CYCLE_GB = 84.2
export const CALLS_MIN = 64
export const MESSAGES = 123

export interface UsageSummary {
  /** Laufender Tag im Zyklus, 1-basiert */
  day: number
  /** Laenge des Zyklus in Tagen */
  days: number
  /** Verbleibende Tage inklusive heute */
  left: number
  usedGb: number
  perDayGb: number
  /** Hochrechnung auf das Zyklusende */
  forecastGb: number
  /** Abweichung der Prognose zum Vormonat in Prozent */
  trendPct: number
}

export function usageSummary(today: Date = DEMO_TODAY): UsageSummary {
  const day = daysBetween(CYCLE.start, today) + 1
  const days = daysBetween(CYCLE.start, CYCLE.end) + 1
  const usedGb = DAILY_GB.reduce((a, b) => a + b, 0)
  /* Gerechnet wird auf abgeschlossenen Tagen — der laufende Tag ist
     unvollstaendig und wuerde die Prognose nach unten ziehen. */
  const completed = Math.max(1, DAILY_GB.length)
  const perDayGb = usedGb / completed
  const forecastGb = perDayGb * days
  return {
    day,
    days,
    left: Math.max(0, days - day + 1),
    usedGb,
    perDayGb,
    forecastGb,
    trendPct: Math.round(((forecastGb - LAST_CYCLE_GB) / LAST_CYCLE_GB) * 100),
  }
}

/* ---------- Roaming ----------
   Zwei Produktregeln, die der Nutzer verstehen muss:

     EU   → der Inlandstarif gilt weiter ("Roam like at home"). Bei einem
            unbegrenzten Inlandstarif ist das EU-Volumen aber *nicht*
            unbegrenzt: die Verordnung (EU) 2022/612 laesst eine
            Fair-Use-Grenze zu und schreibt zugleich ihren Mindestwert
            vor. Wer "unbegrenzt in der EU" sagt, sagt die Unwahrheit —
            und faellt beim ersten Drosselungs-Beschwerdefall darauf
            zurueck.
     Welt → begrenztes Kontingent aus dem Tarif, danach Preis je GB.

   Die EU-Grenze wird gerechnet, nicht geschaetzt. Eine hart notierte
   Zahl waere beim naechsten Preiswechsel still falsch. */

/** Umsatzsteuersatz. Alle Preise in der App sind Brutto-Endpreise (PAngV). */
export const VAT = 0.19

/** Grosshandels-Hoechstentgelt je GB nach Verordnung (EU) 2022/612,
    Anhang — Wert fuer 2026. Der Satz sinkt jaehrlich; beim Jahres-
    wechsel hier nachziehen, dann stimmen alle abgeleiteten Angaben
    wieder. */
export const EU_WHOLESALE_CAP_PER_GB = 1.3

/** Mindest-Datenvolumen im EU-Roaming bei unbegrenztem Inlandstarif:
    zweimal der Netto-Monatspreis, geteilt durch das Hoechstentgelt.
    Abgerundet — im Zweifel lieber weniger versprechen. */
export const euFupGb = (monthlyGross: number) =>
  Math.floor((2 * (monthlyGross / (1 + VAT))) / EU_WHOLESALE_CAP_PER_GB)

export type RoamZone = 'home' | 'eu' | 'world'

export interface RoamingState {
  zone: RoamZone
  country: string
  flag: string
  network: string
  /** Weltweites Kontingent aus Tarif + zugebuchten Paketen.
      null ausserhalb der Welt-Zone — dort gibt es nichts, was leer wird. */
  allowanceGb: number | null
  /** Anteil, der im Tarif steckt. 0, wenn der Tarif keinen enthaelt. */
  includedGb: number
  /** In dieser Sitzung zugebucht. */
  extraGb: number
  usedGb: number
  /** Preis je GB nach Aufbrauchen des Kontingents */
  extraPerGb: string | null
  /** Fair-Use-Grenze im EU-Roaming, aus dem Tarifpreis gerechnet. */
  euFupGb: number
  /** Bereits im EU-Roaming verbraucht — bezogen auf die Fair-Use-Grenze. */
  euUsedGb: number
}

const ZONES: Record<RoamZone, { country: string; flag: string; network: string; usedGb: number }> = {
  home: { country: 'Deutschland', flag: '\u{1F1E9}\u{1F1EA}', network: 'Vodafone DE', usedGb: 0 },
  eu: { country: 'Spanien', flag: '\u{1F1EA}\u{1F1F8}', network: 'Vodafone ES', usedGb: 4.6 },
  world: { country: 'T\u00FCrkei', flag: '\u{1F1F9}\u{1F1F7}', network: 'Vodafone TR', usedGb: 2.1 },
}

/** Der Reisezustand haengt am Tarif, nicht an einer festen Tabelle:
    CONNECT traegt kein Weltkontingent, und die EU-Fair-Use-Grenze
    folgt dem Preis. Frueher stand hier fuer jeden Tarif "3 GB
    weltweit" — fuer den Einstiegstarif schlicht falsch. */
export function roamingState(zone: RoamZone, plan: Plan, extraGb = 0): RoamingState {
  const z = ZONES[zone]
  const includedGb = plan.roamingGb ?? 0
  return {
    zone,
    country: z.country,
    flag: z.flag,
    network: z.network,
    includedGb,
    extraGb,
    allowanceGb: zone === 'world' ? includedGb + extraGb : null,
    /* Ohne Kontingent im Tarif konnte auch nichts verbraucht werden. */
    usedGb: zone === 'world' ? (includedGb > 0 ? z.usedGb : 0) : z.usedGb,
    extraPerGb: zone === 'world' ? '4,99 \u20AC' : null,
    euFupGb: euFupGb(plan.monthly),
    euUsedGb: zone === 'eu' ? z.usedGb : 0,
  }
}

/** Zusatzpakete fuer die Welt-Zone */
export const ROAMING_ADDONS = [
  { key: 'S', gb: 1, price: '4,99 €', note: '7 Tage gültig' },
  { key: 'M', gb: 3, price: '9,99 €', note: '14 Tage gültig' },
  { key: 'L', gb: 10, price: '19,99 €', note: '30 Tage gültig' },
]

/* ---------- Checkout ---------- */
export interface PayMethod {
  key: 'sepa' | 'card' | 'paypal'
  label: string
  meta: string
}

export const PAY_METHODS: PayMethod[] = [
  { key: 'sepa', label: 'SEPA-Lastschrift', meta: 'Abbuchung am 8. jeden Monats' },
  { key: 'card', label: 'Kredit- oder Debitkarte', meta: 'Visa, Mastercard, Amex' },
  { key: 'paypal', label: 'PayPal', meta: 'Weiterleitung zur Bestätigung' },
]

/* ---------- Identifizierung ----------
   Pflicht nach § 172 TKG — ohne Nachweis darf keine SIM aktiviert
   werden. Die Dauerangaben sind das, was der Nutzer wissen muss,
   um zu waehlen. */
export interface IdentMethod {
  key: 'eid' | 'video' | 'photo'
  label: string
  duration: string
  meta: string
  recommended?: boolean
}

export const IDENT_METHODS: IdentMethod[] = [
  {
    key: 'eid',
    label: 'Online-Ausweis',
    duration: 'ca. 2 Min',
    meta: 'Mit AusweisApp und NFC — sofortiges Ergebnis, rund um die Uhr',
    recommended: true,
  },
  {
    key: 'video',
    label: 'Video-Chat',
    duration: 'ca. 5 Min',
    meta: 'Mit Mitarbeiter, täglich 8–22 Uhr — Wartezeit möglich',
  },
  {
    key: 'photo',
    label: 'Foto-Ident',
    duration: 'ca. 3 Min',
    meta: 'Ausweis abfotografieren — Prüfung dauert bis zu 24 Stunden',
  },
]

/* Die drei Takte der Pruefung. Sie heissen fuer alle Verfahren gleich —
   lesen, pruefen, bestaetigen — aber der Text sagt, was gerade beim
   gewaehlten Verfahren passiert und was der Kunde dabei tun muss.

   Der Titel steht im Praesens und nicht im Partizip ("Ausweis wird
   gelesen", nicht "Gelesen"): hier laeuft eine Pruefung, an deren Ende
   auch ein Nein stehen koennte. Bei der eSIM-Fertigung ist das anders,
   dort entsteht etwas, und der Takt ist abgeschlossen. */
export interface IdentAct {
  beat: 'read' | 'check' | 'confirm'
  title: string
  text: string
  ms: number
}

export const IDENT_ACTS: Record<IdentMethod['key'], IdentAct[]> = {
  eid: [
    {
      beat: 'read',
      ms: 2900,
      title: 'Ausweis wird gelesen',
      text: 'Halte ihn an die Rückseite Deines iPhones und lass ihn dort liegen.',
    },
    {
      beat: 'check',
      ms: 2300,
      title: 'Daten werden geprüft',
      text: 'Name und Anschrift kommen direkt aus dem Chip — wir tippen nichts ab.',
    },
    {
      beat: 'confirm',
      ms: 1900,
      title: 'Identität bestätigt',
      text: 'Das war der gesetzliche Teil. Jetzt entsteht Deine eSIM.',
    },
  ],
  video: [
    {
      beat: 'read',
      ms: 2900,
      title: 'Verbindung wird aufgebaut',
      text: 'Gleich meldet sich jemand aus dem Serviceteam bei Dir.',
    },
    {
      beat: 'check',
      ms: 2300,
      title: 'Ausweis wird geprüft',
      text: 'Halte ihn ruhig ins Bild — die Hologramme müssen erkennbar sein.',
    },
    {
      beat: 'confirm',
      ms: 1900,
      title: 'Identität bestätigt',
      text: 'Das war der gesetzliche Teil. Jetzt entsteht Deine eSIM.',
    },
  ],
  photo: [
    {
      beat: 'read',
      ms: 2900,
      title: 'Aufnahmen werden geprüft',
      text: 'Vorder- und Rückseite, beide scharf — das sieht sich die Erkennung zuerst an.',
    },
    {
      beat: 'check',
      ms: 2300,
      title: 'Daten werden abgeglichen',
      text: 'Die Felder aus dem Ausweis gegen die Angaben aus Deiner Bestellung.',
    },
    {
      beat: 'confirm',
      ms: 1900,
      title: 'Identität bestätigt',
      text: 'Das war der gesetzliche Teil. Jetzt entsteht Deine eSIM.',
    },
  ],
}


/* ---------- Formatierung ---------- */
export const fmtEuro = (n: number) => `${n.toFixed(2).replace('.', ',')} \u20AC`
export const fmtGb = (n: number, digits = 1) => `${n.toFixed(digits).replace('.', ',')} GB`
export const fmtDate = (d: Date) =>
  d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
export const fmtDayMonth = (d: Date) =>
  d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })

/* ---------- Geraetecheck ----------
   Der teuerste Abbruch einer eSIM-Marke passiert nach dem Kauf: das
   Geraet kann keine eSIM oder haengt im SIM-Lock eines anderen
   Anbieters. Beides ist vor der Bestellung in zwei Sekunden geklaert
   und danach ein Fall fuer die Ruecklastschrift. */
export interface DeviceCheck {
  model: string
  os: string
  esim: boolean
  unlocked: boolean
}

/** Im Echtbetrieb aus Capacitor-Device und einer Geraeteliste; hier
    fest, damit die Vorfuehrung reproduzierbar bleibt. */
export const DEVICE: DeviceCheck = {
  model: 'iPhone 16 Pro',
  os: 'iOS 26.1',
  esim: true,
  unlocked: true,
}

/* ---------- Portierung ----------
   Rufnummernmitnahme ist in Deutschland seit Dezember 2021 kostenlos
   und binnen eines Werktags zu erledigen. Die eine Entscheidung, die
   dem Kunden bleibt, ist der Zeitpunkt — und genau die wurde bisher
   nicht gestellt. */
export interface PortDate {
  key: 'now' | 'end'
  label: string
  meta: string
}

export const PORT_DATES: PortDate[] = [
  {
    key: 'now',
    label: 'So schnell wie möglich',
    meta: 'Meist am nächsten Werktag. Dein alter Vertrag endet dann vorzeitig — Restlaufzeit kann berechnet werden.',
  },
  {
    key: 'end',
    label: 'Zum Ende meines alten Vertrags',
    meta: 'Keine doppelten Kosten. Bis dahin nutzt Du NOURA mit einer neuen Nummer.',
  },
]

/* ---------- Vertragszusammenfassung ----------
   Nach § 54 TKG muss die Zusammenfassung vor Vertragsschluss
   vorliegen — in der Praxis kommt sie als PDF-Anhang nach der
   Bestellung, also genau dann, wenn sie niemand mehr liest. Hier
   steht sie im Bestellablauf, aus den Tarifdaten gerechnet.

   Die Datenraten folgen dem Muster der Produktinformation
   (maximal / normalerweise verfuegbar / minimal). Die Faktoren sind
   fuer den Prototyp gesetzt; im Echtbetrieb kommen sie aus der
   Netzmessung. */
export interface ContractRow {
  label: string
  value: string
}

export function contractSummary(plan: Plan): ContractRow[] {
  const normal = Math.round(plan.downMbit * 0.6)
  /* CREATE sichert 1 Mbit/s zu jeder Zeit zu — wo der Tarif eine
     Untergrenze nennt, gilt sie und nicht der Schaetzfaktor. */
  const min = plan.guaranteedMbit ?? Math.max(1, Math.round(plan.downMbit * 0.1))
  return [
    {
      label: 'Dienst',
      value: 'Mobilfunk über 5G-eSIM: unbegrenztes Datenvolumen, Telefonie- und SMS-Flat ins deutsche Netz.',
    },
    {
      label: 'Preis',
      value: `${fmtEuro(plan.monthly)} pro Monat inkl. ${Math.round(VAT * 100)} % MwSt. Keine Anschluss- oder Aktivierungsgebühr.`,
    },
    {
      label: 'Laufzeit und Kündigung',
      value: 'Keine Mindestlaufzeit. Monatlich zum Monatsende kündbar, direkt in der App.',
    },
    {
      label: 'Datenrate Download',
      value: `Maximal ${plan.downMbit} Mbit/s, normalerweise verfügbar ${normal} Mbit/s, mindestens ${min} Mbit/s.`,
    },
    {
      label: 'Roaming',
      value: `EU zum Inlandspreis mit ${euFupGb(plan.monthly)} GB Fair-Use-Volumen. Weltweit ${
        plan.roamingGb ? `${plan.roamingGb} GB inklusive, danach 4,99 €` : 'zubuchbar ab 4,99 €'
      } je GB.`,
    },
    {
      label: 'Bei Störungen',
      value: 'Bleibt die Datenrate dauerhaft hinter der Angabe zurück, kannst Du das Entgelt mindern oder außerordentlich kündigen.',
    },
  ]
}

/* ---------- eSIM-Einrichtung ----------
   Der Schritt, an dem eine eSIM-Anmeldung tatsaechlich scheitert. Er
   passiert auf dem Geraet, nicht auf dem Server, und er braucht eine
   Handlung des Nutzers — deshalb ist er hier ein eigener Abschnitt
   und keine weitere Zeile in der Aktivierungsanimation. */
export const ESIM_REQUIREMENTS = [
  'WLAN oder eine bestehende Mobilfunkverbindung',
  'Rund 2 Minuten — das iPhone bleibt in dieser Zeit an',
  'Deine bisherige SIM kann im Gerät bleiben',
]

/** Der Vorfuehrkunde. Stand bisher an fuenf Stellen als Zeichenkette
    im Markup; seit die Karte seinen Namen traegt, waeren es sechs —
    und die Karte koennte dem Screen widersprechen, auf dem sie liegt.
    Der Nachname ist Vorfuehrdatum wie die Rufnummer und die IBAN. */
export const HOLDER = { first: 'Marcel', full: 'Marcel Weber' }

/* ---------- Die Entstehung der eSIM ----------
   Zwei Screens, eine Geschichte. Beim Anbieter wird die Karte gebaut,
   auf dem Geraet zieht sie ins Netz. Titel und Erklaerung stehen hier
   zusammen, damit die Reihenfolge an einer Stelle gepflegt wird und
   nicht in zwei Komponenten auseinanderlaeuft.

   Der Takt-Name gehoert dazu: er sagt der Buehne, welches Bild sie
   zeigt. Stuende er nur in der Komponente, waere jeder eingeschobene
   Schritt eine stille Verschiebung aller folgenden Bilder. */
/* ms = wie lange dieser Takt laeuft. Die Takte sind verschieden lang,
   weil in ihnen verschieden viel passiert — der Laser hat drei
   Aufgaben, die Netzsuche muss einmal rundherum. Eine einheitliche
   Dauer liesse entweder den Balken gegen das Bild laufen oder das Bild
   abschneiden. */
export type EsimAct = { beat: Beat; title: string; text: string; ms: number }

/** Anbieterseite. Hier wartet der Kunde — also zeigen wir ihm, worauf. */
export const FORGE_ACTS: EsimAct[] = [
  {
    beat: 'design',
    ms: 1900,
    title: 'Entworfen',
    text: 'Deine eSIM entsteht als Entwurf: eine Kennung, die es genau einmal gibt.',
  },
  {
    beat: 'laser',
    ms: 3200,
    title: 'Gelasert',
    text: 'Chip und Dein Name werden fest in die Karte geschrieben.',
  },
  {
    beat: 'seal',
    ms: 2050,
    title: 'Versiegelt',
    text: 'Dein Tarif kommt auf die Karte — freigegeben nur für Dein iPhone.',
  },
]

/** Der Schlussmoment der Aktivierung. Kein Arbeitsschritt mehr, sondern
    die Uebergabe: fertig ist die eSIM erst nach der Einrichtung, aber
    unsere Arbeit daran ist hier zu Ende. */
export const FORGE_FINALE: EsimAct = {
  beat: 'ready',
  /* Kein Arbeitstakt, sondern der Nachlauf, in dem die Karte sich
     aufrichtet und zum Kunden dreht. */
  ms: 1300,
  title: 'Bereit für Dein iPhone',
  text: 'Fertig gebaut. Jetzt muss sie nur noch auf Dein Gerät.',
}

/** Geraeteseite. Dieselbe Karte, vier weitere Takte — sie zieht um und
    meldet sich im Netz an. */
export const ESIM_INSTALL_ACTS: EsimAct[] = [
  {
    beat: 'load',
    ms: 1750,
    title: 'Profil wird geladen',
    text: 'Dein iPhone holt die eSIM ab. Bleib solange in dieser Ansicht.',
  },
  {
    beat: 'install',
    ms: 2050,
    title: 'eSIM wird eingerichtet',
    text: 'Das Profil wird in den Mobilfunkeinstellungen abgelegt.',
  },
  {
    beat: 'search',
    ms: 2600,
    title: 'Netz wird gesucht',
    text: 'Das iPhone verliert jetzt kurz die Verbindung — das gehört dazu.',
  },
  {
    beat: 'live',
    ms: 2200,
    title: 'Deine Nummer ist aktiv',
    text: 'Angemeldet im 5G-Netz. Ab hier telefonierst Du über NOURA.',
  },
]


/** Rueckfallweg, wenn die automatische Einrichtung nicht laeuft — in
    jeder echten eSIM-App der meistgenutzte Hilfeinhalt. */
export const ESIM_MANUAL = {
  smdp: 'rsp.noura.de',
  code: 'K2-9F4T-XQ7M-3BLD',
}

/** Was direkt nach der Einrichtung ansteht. Ohne diese Liste landet
    ein frischer Kunde auf einem Verbrauchs-Dashboard und weiss nicht,
    ob er noch etwas tun muss. */
export const FIRST_STEPS = [
  {
    title: 'Mobile Daten auf NOURA stellen',
    text: 'Einstellungen → Mobilfunk → Mobile Daten. Sonst surfst Du weiter über Deinen alten Tarif.',
  },
  {
    title: 'Alte SIM behalten, bis die Portierung durch ist',
    text: 'Wir melden uns, sobald Deine Nummer umgezogen ist. Erst danach kannst Du sie entfernen.',
  },
  {
    title: 'iMessage und FaceTime neu verknüpfen',
    text: 'Beide hängen an der Rufnummer und brauchen nach dem Wechsel einmal ein paar Minuten.',
  },
]

/* ---------- Verfuegbarkeit der Ident-Verfahren ----------
   Das Video-Ident laeuft mit Menschen und hat deshalb Oeffnungszeiten.
   Wer um 23 Uhr bestellt und das erst im Wartebildschirm erfaehrt,
   bricht ab. */
export const VIDEO_IDENT_HOURS = { from: 8, to: 22 }

export const identAvailable = (key: IdentMethod['key'], now: Date = new Date()) =>
  key !== 'video' || (now.getHours() >= VIDEO_IDENT_HOURS.from && now.getHours() < VIDEO_IDENT_HOURS.to)
