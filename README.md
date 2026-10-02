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
├── App.tsx            # Screen routing, sheet state, toast
├── main.tsx           # Entry point
├── screens/           # Intro, Onboarding, SelectPlan, Home, Checkout, Ident, eSIM journey
├── sheets/            # Support chat, account pages, plan, Magic Code, confirm and usage sheets
├── components/        # Shared UI (ui.tsx), passkey prompt, eSIM forge, onboarding visuals, usage
├── data/              # Static prototype data: plans, account, Magic Codes, settings, support
├── hooks/a11y.ts      # Accessibility helpers
├── lib/haptics.ts     # Capacitor haptics wrapper
├── figma/             # Code Connect mappings (*.figma.ts)
├── assets/            # Fonts (General Sans), images
└── styles/            # Tokens (global.css, theme.css) and per-area stylesheets
ios/                   # Capacitor iOS project (ios/App/App.xcodeproj)
```

## Design tokens (from Figma)

| Token | Value |
| --- | --- |
| Background | `#232452` + red/purple gradient glow |
| Accent | `#e15055` |
| Glass surfaces | `rgba(255,255,255,.1)` / `.2` with backdrop blur |
| Muted text | `rgba(255,255,255,.5)` |
| Font | General Sans (500/600/700), bundled in `src/assets/fonts/` so the iOS app works offline |
| Radius | 24px buttons/cards, 16px tiles |

Card artwork and the eSIM chip icon are recreated in CSS/SVG. The few binary assets (fonts, aurora background, Vodafone lock-up) live in `src/assets/`, so there are no expiring Figma URLs.

## Running on iOS (Xcode)

The iOS app is a Capacitor shell around the web build. Xcode runs whatever is in `dist/`, so rebuild and sync after every code change:

```bash
npm run ios                              # build, sync, open Xcode
# or, with Xcode already open:
npm run build && npx cap sync ios
```

Then press **⌘R** in Xcode. Open `ios/App/App.xcodeproj`, not the repo folder. `vite` is only installed locally, so call it through `npm run build` or `npx vite build`.

**iPhone Duo:** the simulator needs the Xcode 27.1 beta and the iOS 27.1 simulator runtime. Xcode 27.0 can't download that runtime, and the iOS 27.2 runtime does not support iPhone Duo. Use **Xcode → Open Developer Tool → Simulator** to open the simulator window.

## Git workflow

The branch model, naming scheme and commit format are in [BRANCHING.md](BRANCHING.md). In short, never commit to `main` directly. Work on a short-lived branch and merge through a pull request.

Push the current state of your branch:

```bash
git status                               # check what will be included
git add -A
git commit -m "feat(home): what changes"
git push                                 # first push of a new branch: git push -u origin <branch>
```

Secrets stay out of the repo: `.env*` and `*token*` are in `.gitignore`. Check new config files such as `.mcp.json` for keys before committing.

## Notes

- Prototype only: no backend, all data is static (`src/data/`).
- The phone frame renders at 393×852 (iPhone 15) on desktop and full-screen on mobile.
- Respects `prefers-reduced-motion`.
