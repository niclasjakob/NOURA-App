// url=https://www.figma.com/design/6DK1NP0pdeuesOy14tl4YE/NOURA?node-id=308-1647
// source=src/components/ui.tsx
// component=Icons
import figma from 'figma'

const instance = figma.selectedInstance

/* Figma fuehrt neun Zeichen in EINEM Varianten-Set; der Code fuehrt fuenf
   einzelne Komponenten. Die Zuordnung ist deshalb Variante -> Komponenten-
   name, nicht Variante -> Prop.
 
   Alle neun stehen hier, auch die ohne Gegenstueck: eine nicht
   aufgefuehrte Variante liefert still `undefined` und damit kaputten Code.
   `Cancel` zeigt auf `Close` — der Pfad ist ein X (M18 6 6 18M6 6l12 12).
 
   ChevronDown gibt es im Code, aber in diesem Set nicht; es ist also
   keine Luecke dieser Zuordnung. */
const component = instance.getEnum('Icon', {
  Arrow_Left: 'ArrowLeft',
  Arrow_Right: 'ArrowRight',
  Plus: 'Plus',
  Cancel: 'Close',
  // Im Entwurf vorhanden, in src/components/ui.tsx noch nicht gezeichnet:
  Minus: null,
  Send: null,
  Chat: null,
  Placeholder: null,
  Edit: null,
})

export default {
  example: component
    ? figma.tsx`<${component} />`
    : figma.tsx`{/* Dieses Zeichen steht in Figma, aber noch nicht in src/components/ui.tsx */}`,
  imports: component ? [`import { ${component} } from '../components/ui'`] : [],
  id: 'noura-icons',
  metadata: { nestable: true },
}
