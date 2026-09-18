/* ============================================================
   NOURA — Reisen / Roaming

   Der Kern-Anwendungsfall einer eSIM-Marke, im Prototyp bisher nur
   als Zeile im Tarif-Text vorhanden. Die Produktregel, die der
   Nutzer verstehen muss, ist einfach und wird hier ueberall
   durchgehalten:

     EU   → das Inlandsvolumen gilt weiter, kein eigenes Kontingent
     Welt → begrenztes Kontingent aus dem Tarif, danach Preis je GB

   Deshalb traegt nur die Welt-Zone einen Fortschrittsring. In der
   EU waere er eine Erfindung — es gibt dort nichts, was leer wird.
   Der Einstieg in die Reiseansicht liegt im "Mehr"-Menue auf Home.
   ============================================================ */
import { fmtGb } from '../data/account'

/* ---------- Kontingent-Ring ----------
   Anders als der ∞-Ring auf der Home-Kachel zeigt dieser einen
   echten Fuellstand, weil es hier eine echte Grenze gibt. */
export function AllowanceRing({ used, total, run }: { used: number; total: number; run: boolean }) {
  const R = 54
  const C = 2 * Math.PI * R
  const pct = Math.min(1, total > 0 ? used / total : 0)
  const left = Math.max(0, total - used)
  /* Ab 80 % faerbt sich der Bogen — vorher ist die Warnung nur Laerm. */
  const tight = pct >= 0.8

  return (
    <div className="allow-ring">
      <svg viewBox="0 0 126 126" aria-hidden="true" focusable="false">
        <circle cx="63" cy="63" r={R} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="6" />
        <circle
          cx="63"
          cy="63"
          r={R}
          fill="none"
          stroke={tight ? 'var(--noura-accent)' : '#fff'}
          strokeWidth="6"
          strokeLinecap="round"
          className="allow-arc"
          strokeDasharray={C}
          /* Startet leer und faehrt auf den Wert — derselbe Uebergang
             traegt spaeter das Zubuchen eines Datenpakets. */
          strokeDashoffset={run ? C - C * pct : C}
          transform="rotate(-90 63 63)"
        />
      </svg>
      <div className="allow-mid">
        <b>{fmtGb(left)}</b>
        <em>übrig</em>
      </div>
    </div>
  )
}
