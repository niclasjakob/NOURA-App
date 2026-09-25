export interface Plan {
  key: 'connect' | 'create'
  name: string
  price: string
  chip: string | null
  desc: string
  /** Eine Zeile: fuer wen der Tarif ist. Auf dem Auswahl-Screen steht
      sie unter der Karte, wo `desc` drei Zeilen gebraucht haette und
      die Vergleichstabelle unter die Falz geschoben hat. `desc` bleibt
      der lange Satz und traegt weiter das Plan-Sheet. */
  tagline: string
  /** Vollstaendige Leistungsliste — Gemeinsames plus Eigenes. Wird aus
      PLAN_SHARED und `distinct` zusammengesetzt, nicht von Hand
      gepflegt: vorher standen vier identische Zeilen in beiden Tarifen
      doppelt, und eine davon ("EU-Roaming mit Fair-Use") wich in CREATE
      im Wortlaut ab, obwohl sie dieselbe Leistung meinte. */
  features: string[]
  /** Was NUR dieser Tarif hat. Die Quelle fuer die Vergleichstabelle. */
  distinct: string[]
  /** Downloadrate in Mbit/s — als Zahl, damit die Verbrauchsansicht
      damit rechnen kann statt den Feature-Text zu zerlegen. */
  downMbit: number
  /** Dauerhaft zugesicherte Datenrate in Mbit/s — die Untergrenze, die
      auch bei Auslastung gilt. null = keine Zusicherung, dann rechnet
      die Produktinformation die Mindestrate wie bisher aus der
      Maximalrate. */
  guaranteedMbit: number | null
  /** Weltweites Roaming-Kontingent in GB (EU laeuft ueber das
      Inlandsvolumen). null = im Tarif nicht enthalten.

      Steht seit dem 2026-09-22 bei BEIDEN Tarifen auf null: die 3 GB
      weltweit sind aus CREATE gestrichen, Roaming ist kein
      Unterschied zwischen den Tarifen mehr. Das Feld bleibt, weil es
      die Welt-Zone und die Produktinformation weiter steuern — beide
      zeigen dann "zubuchbar ab 4,99 € je GB", und genau das ist jetzt
      fuer beide richtig. */
  roamingGb: number | null
  /** Monatspreis als Zahl — `price` ist Anzeigetext und taugt nicht
      als Rechengrundlage fuer die Kostenaufstellung im Checkout. */
  monthly: number
  /** Was die Datenrate im Alltag bedeutet. "Bis zu 300 Mbit/s" ist
      eine Zahl, die niemand einordnen kann — und die Datenrate ist
      der greifbarste Unterschied zwischen den Tarifen. */
  speedNote: string
  /** Wofuer die Magic Codes dieses Tarifs gut sind. Steht als eigenes
      Feld da, weil es eine der vier Vergleichszeilen ist — aus dem
      Satz "Magic Codes fuer …" herausgeschnitten waere es geraten,
      nicht gelesen. Dieselbe Begruendung wie bei `downMbit`. */
  magicScope: string
}

/* Was in BEIDEN Tarifen steckt. Einmal genannt, nicht zweimal.

   Bis zum 2026-09-22 stand diese Liste in beiden Tarifen ausgeschrieben
   — vier von sechs bzw. sieben Zeilen waren identisch. Auf dem
   Auswahl-Screen hiess das: zwei fast gleiche Listen nebeneinander, und
   der Unterschied, um den es bei der Wahl geht, ging darin unter. Wer
   vergleichen will, muss sehen, was verschieden ist; das Gemeinsame
   gehoert einmal an den Rand. */
export const PLAN_SHARED = [
  'Unbegrenztes Datenvolumen mit 5G',
  'Allnet Telefonie & SMS Flat',
  'EU-Roaming mit Fair-Use',
  'Chat & Callback Service',
]

/* Tarifdaten aus "Proposition & pricing" (GigaMobil Young):
   zwei unbegrenzte Tarife statt vorher drei. CONNECT fuer alle, deren
   soziales Leben online stattfindet, CREATE als Premium-Tarif fuer
   alle, die lernen, entdecken und gestalten. Der Preis ist ein glatter
   Betrag ohne Referenzpreis — kein 24,95 €, sondern 25 €. */
type PlanSpec = Omit<Plan, 'features'>

const SPECS: PlanSpec[] = [
  {
    key: 'connect',
    name: 'CONNECT',
    price: '25 € / Monat',
    chip: null,
    desc: 'Der unbegrenzte Tarif für alle, deren soziales Leben online stattfindet – mit Magic Codes für gemeinsame Erlebnisse.',
    tagline: 'Für alle, deren soziales Leben online stattfindet.',
    distinct: [
      'Bis zu 100 Mbit/s im Download',
      'Magic Codes für Konzerte, Kino, Sport & Reisen',
    ],
    downMbit: 100,
    speedNote: 'Schreiben, telefonieren, streamen und teilen — den ganzen Tag, ohne aufs Volumen zu schauen.',
    guaranteedMbit: null,
    roamingGb: null,
    monthly: 25,
    magicScope: 'Konzerte, Kino, Sport & Reisen',
  },
  {
    key: 'create',
    name: 'CREATE',
    price: '40 € / Monat',
    chip: 'Premium',
    desc: 'Der Premium-Tarif für alle, die lernen, entdecken und gestalten – Highspeed und Magic Codes, die weiterbringen.',
    tagline: 'Für alle, die lernen, entdecken und gestalten.',
    distinct: [
      'Bis zu 300 Mbit/s im Download',
      'Network Slicing: dauerhaft 1 Mbit/s zugesichert',
      'Magic Codes für Tools, Lernvorteile & Co-Creations',
    ],
    downMbit: 300,
    speedNote: 'Livestreams, große Uploads und Arbeiten in vollen Netzen — auch unterwegs ohne Warten.',
    guaranteedMbit: 1,
    roamingGb: null,
    monthly: 40,
    magicScope: 'Tools, Lernvorteile & Co-Creations',
  },
]

export const PLANS: Plan[] = SPECS.map((p) => ({
  ...p,
  features: [...PLAN_SHARED, ...p.distinct],
}))

/** Der Tarifname im Fliesstext und auf kleinen Flaechen: "Connect"
    statt "CONNECT". Die Versalform bleibt der Karte vorbehalten. */
export const planTitle = (p: Plan) => p.name.charAt(0) + p.name.slice(1).toLowerCase()

/* ---- Die Vergleichszeilen ----
   Drei Zeilen, und mehr gibt es nicht zu vergleichen. Jede rechnet
   ihren Wert aus dem Tarif aus, statt ihn ein zweites Mal
   hinzuschreiben: so kann die Tabelle nicht von der Leistungsliste
   abweichen, wenn jemand eine Zahl aendert.

   Sprachlich wichtig: CREATE bekommt eine ZUSICHERUNG, keine Vorfahrt.
   Die Rate darf sinken, nur nicht unter den garantierten Wert — NOURA
   verkauft keine Bevorzugung gegenueber anderen Kunden (siehe den
   Onboarding-Schritt "Du bleibst online", 2026-09-22). Deshalb steht
   hier "zugesichert" und nicht "reserviert" oder "freie Spur".

   Roaming stand hier bis zum 2026-09-22 als vierte Zeile ("EU
   inklusive" gegen "EU + 3 GB weltweit"). Seit die 3 GB gestrichen
   sind, ist EU-Roaming in beiden Tarifen dasselbe — und eine
   Vergleichszeile, auf der links und rechts dasselbe steht, ist keine.
   Sie steht jetzt bei PLAN_SHARED.

   Nicht ganz dasselbe ist das Fair-Use-Volumen: es haengt am Preis
   (§ euFupGb) und ergibt 32 GB fuer CONNECT gegen 51 GB fuer CREATE.
   Das ist eine Folge der EU-Verordnung, kein verkauftes Merkmal —
   es steht deshalb in der Reiseansicht und in der
   Produktinformation, wo es gebraucht wird, und nicht in der
   Schlagzeile der Tarifwahl. */
export const PLAN_DIFF: { label: string; value: (p: Plan) => string }[] = [
  {
    label: 'Tempo',
    value: (p) => `bis ${p.downMbit} Mbit/s`,
  },
  {
    label: 'Wenn das Netz voll ist',
    value: (p) =>
      p.guaranteedMbit ? `${p.guaranteedMbit} Mbit/s zugesichert` : 'ohne Zusicherung',
  },
  {
    label: 'Magic Codes öffnen',
    value: (p) => p.magicScope,
  },
]

/* Onboarding — drei Schritte, drei Bauteile des Produkts.

   Bis zum 2026-09-21 standen hier die Texte der Figma-Komponente
   "Feature v3": Digital / Flexibel / Highspeed. Zwei davon nannten kein
   Bauteil dieser App, sondern eine Vertragsbedingung ("monatlich
   kuendbar") und ein Netzlabel ("Surfe mit 5G") — Saetze, die jeder
   Anbieter schreiben kann und die deshalb nichts ueber NOURA sagen.
   Jetzt nennt jeder Schritt ein Stueck, das es in der App auch gibt:
   die eSIM, die Magic Codes, die zugesicherte Datenrate.
   Von Niclas am 2026-09-21 beauftragt.

   "Monatlich kuendbar" faellt damit nicht aus dem Ablauf: es steht in
   der Kopfzeile der Tarifwahl und im Kleingedruckten unter dem CTA —
   also an der Stelle, an der es die Entscheidung tatsaechlich
   beeinflusst.

   Laenge: die Koerper liegen bei rund 110 Zeichen. Darueber bricht der
   Absatz im 393er Rahmen auf eine vierte Zeile und draengt gegen die
   Punktleiste. */
export const ONBOARDING = [
  {
    tag: 'eSIM',
    title: 'In Minuten startklar.',
    body: 'Tarif wählen, Ausweis scannen, eSIM aufs iPhone. Kein Shop, keine Plastikkarte — danach läuft alles hier.',
  },
  {
    tag: 'Magic Codes',
    title: 'Codes, die Türen öffnen.',
    body: 'Vier Zeichen aus einem Stream oder von Freunden — und Du stehst beim Festival, Konzert oder Meet-up auf der Liste.',
  },
  {
    /* "Network Slicing" ist Fachsprache, und writing.md rät davon ab.
       Hier steht es trotzdem: es ist der Name des Bauteils, das CREATE
       von CONNECT trennt. Der Satz dahinter loest ihn sofort in
       Alltagssprache auf — nennen und erklaeren, nicht verstecken. */
    tag: 'Network Slicing',
    /* Hier stand bis zum 2026-09-22 "Volles Netz, freie Spur." mit einem
       Koerper ueber eine freigehaltene Spur. Das beschrieb Vorfahrt vor
       anderen Kunden — also Priorisierung, die NOURA nicht verkauft.
       Zugesichert wird eine Datenrate: sie darf sinken, nur nicht unter
       den garantierten Wert. Deshalb steht vorn das Ergebnis ("Du
       bleibst online") und dahinter der Mechanismus, und deshalb kommt
       im ganzen Schritt keine zweite Partei mehr vor. */
    title: 'Du bleibst online.',
    body: 'Network Slicing sichert CREATE dauerhaft 1 Mbit/s zu — im vollen Netz wird es langsamer, aber es reißt nicht ab.',
  },
]
