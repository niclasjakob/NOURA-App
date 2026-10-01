# NOURA — eSIM App

Interactive prototype of **NOURA**, the eSIM app connected by Vodafone, built with React + TypeScript + Vite from the Figma design [NOURA Concept · 📱 Hi-Fi V7](https://www.figma.com/design/6DK1NP0pdeuesOy14tl4YE/NOURA-Concept?node-id=1543-1842).

## Screens & flow

Intro → Onboarding (Digital / Flexibel / Highspeed) → Plan selection (CREATE / CONSUME / MESSAGE, swipeable) → eSIM activation animation → Home (usage dashboard, "Mehr" FAB menu) → bottom sheets for Support chat, Account and current plan.

The plan chosen during onboarding carries through to Home and the plan sheet. "Mit Passkey anmelden" on the intro screen shows a simulated passkey sheet, then goes straight to Home. Opening the app with `?code=XXXX` (e.g. `?code=T4JQ`) carries a Magic Code into the plan selection.

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
```

## Project structure

```
src/
├── App.tsx              # Screen routing, sheet state, toast
├── main.tsx             # Entry point
├── components/ui.tsx    # StatusBar, BackgroundGradient, SimCard, EsimIcon, FeatureList, icons
├── screens/screens.tsx  # Intro, Onboarding, SelectPlan, Activation, Home
├── sheets/sheets.tsx    # SupportSheet (chat), ProfileSheet, PlanSheet
├── data/plans.ts        # Plan + onboarding copy from Figma
└── styles/global.css    # Design tokens & all styling
```

## Design tokens (from Figma)

| Token | Value |
| --- | --- |
| Background | `#232452` + red/purple gradient glow |
| Accent | `#e15055` |
| Glass surfaces | `rgba(255,255,255,.1)` / `.2` with backdrop blur |
| Muted text | `rgba(255,255,255,.5)` |
| Font | General Sans (500/600/700) via Fontshare |
| Radius | 24px buttons/cards, 16px tiles |

All card artwork, the eSIM chip icon and the background gradient are recreated in pure CSS/SVG — no binary assets, no expiring Figma URLs.

## Publishing to GitHub

The repo is initialized locally with an initial commit. To publish:

```bash
gh repo create noura-app --private --source . --push
# or manually:
git remote add origin git@github.com:<your-user>/noura-app.git
git push -u origin main
```

## Notes

- Prototype only: no backend, all data is static (`src/data/plans.ts`).
- The phone frame renders at 393×852 (iPhone 15) on desktop and full-screen on mobile.
- Respects `prefers-reduced-motion` for the activation animation.
