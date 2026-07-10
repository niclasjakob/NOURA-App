export interface Plan {
  key: 'create' | 'consume' | 'message'
  name: string
  price: string
  chip: string | null
  desc: string
  features: string[]
}

/** Plan data from Figma "Sim Plan v3" component (Creator / Consumer / Basic) */
export const PLANS: Plan[] = [
  {
    key: 'create',
    name: 'CREATE',
    price: '40€ / Monat',
    chip: 'Beliebt',
    desc: 'Die Premium-Wahl für kreative Köpfe – perfekt für Content Creator & Digital Nomads.',
    features: [
      'Unbegrenztes Datenvolumen mit 5G',
      'Allnet Telefonie & SMS Flat',
      'Bis zu 500 Mbit/s im Download',
      'Bis zu 100 Mbit/s im Upload',
      'EU + 3GB International Roaming inklusive',
      'Chat & Callback Service',
    ],
  },
  {
    key: 'consume',
    name: 'CONSUME',
    price: '20€ / Monat',
    chip: null,
    desc: 'Der perfekte Begleiter für den Alltag – ideal für Social Media & Streaming.',
    features: [
      'Unbegrenztes Datenvolumen mit 5G',
      'Allnet Telefonie & SMS Flat',
      'Bis zu 100 Mbit/s im Download',
      'Bis zu 20 Mbit/s im Upload',
      'EU Roaming inklusive',
      'Chat & Callback Service',
    ],
  },
  {
    key: 'message',
    name: 'MESSAGE',
    price: '10€ / Monat',
    chip: null,
    desc: 'Die ideale Wahl fürs Messaging – immer online und perfekt für Nachrichten.',
    features: [
      'Unbegrenztes Datenvolumen mit 5G',
      'Allnet Telefonie & SMS Flat',
      'Bis zu 10 Mbit/s im Download',
      'Bis zu 5 Mbit/s im Upload',
      'EU Roaming inklusive',
      'Chat Service',
    ],
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
