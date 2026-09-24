// url=https://www.figma.com/design/6DK1NP0pdeuesOy14tl4YE/NOURA?node-id=301-1461
// source=src/components/ui.tsx
// component=Button
import figma from 'figma'

const instance = figma.selectedInstance

/* Vier Varianten-Achsen in Figma, drei davon bilden Code ab.
   Jede Option ist aufgefuehrt — eine fehlende liefert still `undefined`. */
const type = instance.getEnum('Type', {
  Filled: 'filled',
  Borderless: 'ghost',
})
const size = instance.getEnum('Size', {
  Large: 'large',
  Small: 'small',
})
const labelType = instance.getEnum('LabelType', {
  Text: 'text',
  Icon: 'icon',
  'Icon + Text': 'icon-text',
})
/* State zeichnet CSS ueber :active — es gibt dafuer keine Prop. Beide
   Werte stehen trotzdem hier, damit keiner still durchfaellt. */
instance.getEnum('State', { Enabled: 'enabled', Pressed: 'pressed' })

/* Size=Small + LabelType=Icon ist im Code der runde 64er Knopf; alles
   andere unterscheidet sich nur durch Type. Einen kleinen Textbutton
   hat die App nicht — Size wird daher nur fuer den Icon-Fall gelesen. */
const variant =
  labelType === 'icon' && size === 'small' ? 'icon' : type === 'ghost' ? 'ghost' : 'filled'

/* findText liefert bei Misserfolg ein ErrorHandle — truthy, aber ohne
   textContent. Deshalb ueber den Diskriminator pruefen, nicht ueber die
   Eigenschaft; dieselbe Regel gilt fuer findInstance weiter unten. */
const label = instance.findText('Button')
const labelText = label.type === 'TEXT' ? label.textContent : ''

/* Die verschachtelte Icons-Instanz loest ueber ihre eigene Zuordnung
   auf (src/figma/Icons.figma.ts) — nicht aus dem Ebenennamen geraten. */
const iconNode = instance.findInstance('Icons')
let icon
if (iconNode && iconNode.type === 'INSTANCE') {
  icon = iconNode.executeTemplate().example
}

/* `filled` ist die Voreinstellung und wird nicht ausgeschrieben. */
const variantProp = variant === 'filled' ? '' : ` variant="${variant}"`

export default {
  example:
    variant === 'icon'
      ? figma.tsx`<Button${variantProp} aria-label="${labelText || 'Weiter'}">${icon}</Button>`
      : icon
        ? figma.tsx`<Button${variantProp}>${icon}${labelText}</Button>`
        : figma.tsx`<Button${variantProp}>${labelText}</Button>`,
  imports: ["import { Button } from '../components/ui'"],
  id: 'noura-button',
  metadata: { nestable: true },
}
