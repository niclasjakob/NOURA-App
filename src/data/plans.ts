export interface Plan {
  key: 'connect' | 'create'
  name: string
  price: string
  chip: string | null
  desc: string
  features: string[]
  /** Downloadrate in Mbit/s — als Zahl, damit die Verbrauchsansicht
      damit rechnen kann statt den Feature-Text zu zerlegen. */
  downMbit: number
  /** Dauerhaft zugesicherte Datenrate in Mbit/s — die Untergrenze, die
      auch bei Auslastung gilt. null = keine Zusicherung, dann rechnet
      die Produktinformation die Mindestrate wie bisher aus der
      Maximalrate. */
  guaranteedMbit: number | null
  /** Weltweites Roaming-Kontingent in GB (EU laeuft ueber das
      Inlandsvolumen). null = im Tarif nicht enthalten. */
  roamingGb: number | null
  /** Monatspreis als Zahl — `price` ist Anzeigetext und taugt nicht
      als Rechengrundlage fuer die Kostenaufstellung im Checkout. */
  monthly: number
  /** Was die Datenrate im Alltag bedeutet. "Bis zu 300 Mbit/s" ist
      eine Zahl, die niemand einordnen kann — und die Datenrate ist
      der greifbarste Unterschied zwischen den Tarifen. */
  speedNote: string
}

/* Tarifdaten aus "Proposition & pricing" (GigaMobil Young):
   zwei unbegrenzte Tarife statt vorher drei. CONNECT fuer alle, deren
   soziales Leben online stattfindet, CREATE als Premium-Tarif fuer
   alle, die lernen, entdecken und gestalten. Der Preis ist ein glatter
   Betrag ohne Referenzpreis — kein 24,95 €, sondern 25 €. */
export const PLANS: Plan[] = [
  {
    key: 'connect',
    name: 'CONNECT',
    price: '25€ / Monat',
    chip: null,
    desc: 'Der unbegrenzte Tarif für alle, deren soziales Leben online stattfindet – mit Magic Codes für gemeinsame Erlebnisse.',
    features: [
      'Unbegrenztes Datenvolumen mit 5G',
      'Allnet Telefonie & SMS Flat',
      'Bis zu 100 Mbit/s im Download',
      'EU-Roaming mit Fair-Use inklusive',
      'Magic Codes für Konzerte, Kino, Sport & Reisen',
      'Chat & Callback Service',
    ],
    downMbit: 100,
    speedNote: 'Schreiben, telefonieren, streamen und teilen — den ganzen Tag, ohne aufs Volumen zu schauen.',
    guaranteedMbit: null,
    roamingGb: null,
    monthly: 25,
  },
  {
    key: 'create',
    name: 'CREATE',
    price: '40€ / Monat',
    chip: 'Premium',
    desc: 'Der Premium-Tarif für alle, die lernen, entdecken und gestalten – Highspeed und Magic Codes, die weiterbringen.',
    features: [
      'Unbegrenztes Datenvolumen mit 5G',
      'Allnet Telefonie & SMS Flat',
      'Bis zu 300 Mbit/s im Download',
      'Garantiert 1 Mbit/s zu jeder Zeit',
      'EU-Roaming mit Fair-Use · 3 GB weltweit inklusive',
      'Magic Codes für Tools, Lernvorteile & Co-Creations',
      'Chat & Callback Service',
    ],
    downMbit: 300,
    speedNote: 'Livestreams, große Uploads und Arbeiten in vollen Netzen — auch unterwegs ohne Warten.',
    guaranteedMbit: 1,
    roamingGb: 3,
    monthly: 40,
  },
]

/** Onboarding steps from Figma "Feature v3" component */
export const ONBOARDING = [
  {
    tag: 'Digital',
    title: 'Alles in einer App.',
    body: 'Vom Start bis zum Highspeed-Erlebnis – Erledige alles direkt in unserer App. Einfach, schnell, immer griffbereit.',
  },
  {
    tag: 'Flexibel',
    title: 'Monatlich kündbar.',
    body: 'Bleib unabhängig: Unser Tarif passt sich Deinem Leben an – ohne lange Vertragsbindung, ohne versteckte Kosten.',
  },
  {
    tag: 'Highspeed',
    title: 'Surfe mit 5G.',
    body: 'Streame, arbeite und surfe ohne Limits: Mit unserem 5G-Netz bist Du immer mit Höchstgeschwindigkeit unterwegs.',
  },
]
