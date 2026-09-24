/* ============================================================
   NOURA — Beruehrung

   Die App hat dieses Sinnesorgan bis zum 2026-09-18 nicht benutzt. Auf
   einem Geraet, dessen kennzeichnende Hardware eine Haptik-Engine ist,
   und in einer Kategorie, in der jeder Wettbewerber ein Formular und
   eine Rechnung ist, war das die groesste offene Luecke — und die
   billigste, die sich schliessen laesst.

   Haptik ist hier ausdruecklich auch eine Massnahme der
   Barrierefreiheit, nicht nur Luxus: sie gibt der Rueckmeldung einen
   zweiten Kanal fuer jeden, der Bewegung reduziert hat oder die
   Animation gar nicht sehen kann. Deshalb wird sie NICHT unter
   `prefers-reduced-motion` abgeschaltet.

   Das Vokabular ist bewusst klein. Eine Haptik, die bei allem
   ausloest, bedeutet nichts.

   Die vier Regeln:
   1. Nie das einzige Signal — zu jeder Haptik gehoert etwas Sichtbares.
   2. Nie beim Scrollen, nie bei einer Wiederholung.
   3. Beim Druecken, nicht beim Loslassen: der Finger liegt noch auf,
      die Rueckmeldung liest sich als Kontakt.
   4. Den Systemschalter achten. Meldet die Plattform keine Haptik,
      passiert lautlos nichts — und niemals ein Ton als Ersatz.
   ============================================================ */
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

/* Im Browser gibt es das Plugin nicht, und auf iOS kann der Nutzer die
   Haptik systemweit abschalten. Beides ist kein Fehlerfall: die Geste
   faellt einfach weg, das Sichtbare traegt sie ohnehin. Die Aufrufe
   sind absichtlich nicht `await`-bar — eine Haptik, auf die der
   Aufrufer wartet, waere ein Zeitgeber im Bedienpfad. */
const enabled = Capacitor.isPluginAvailable('Haptics')

function fire(run: () => Promise<unknown>) {
  if (!enabled) return
  try {
    void run().catch(() => {})
  } catch {
    /* Regel 4: lautlos. */
  }
}

/** Das iOS-Idiom fuer "eine Wahl schrubbt vorbei": Tarifkarussell,
    Reiter, Segment. */
export const hapticSelection = () => fire(() => Haptics.selectionChanged())

/** Kontakt mit einem Bedienelement — beim Druecken, nicht beim
    Loslassen. Das Loslassen traegt schon die Feder. */
export const hapticPress = () => fire(() => Haptics.impact({ style: ImpactStyle.Light }))

/** Der eine Schlag, der schwerer ist als die davor. Nur der letzte
    Takt der Signatur-Abfolge ("im Netz"). */
export const hapticLand = () => fire(() => Haptics.impact({ style: ImpactStyle.Medium }))

/** Der folgenreiche Moment: Bestellung abgeschickt, Code angenommen,
    eSIM im Netz. */
export const hapticSuccess = () =>
  fire(() => Haptics.notification({ type: NotificationType.Success }))

/** Abgelehnt. Gehoert zu dem Ruettler, den das Feld schon zeigt. */
export const hapticError = () =>
  fire(() => Haptics.notification({ type: NotificationType.Error }))
