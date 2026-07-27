# NOURA Design System

Extracted from Figma **NOURA Concept → 📱 Hi-Fi: V7** (node `1330-1774`) on 2026-07-13. Every value below was measured from the actual screens and components — usage counts are noted where they informed a decision.

## Visual identity in one paragraph

NOURA's look is **glassmorphism over an aurora**: a deep-indigo canvas (`#232452`) with four heavily blurred color blobs (blue `#4d7dac`, coral `#d9686c`, purple `#6d459a`, navy `#1a1a40`, layer blur 300px), and translucent white glass cards floating on top (white @10% fill, 1.5px light border, 24px backdrop blur, 24px corner radius). The single warm accent is a coral red `#e15055` used for CTAs and highlights, kept distinct from the Vodafone brand red `#e60000`, which appears only in "connected by Vodafone" contexts. All UI text is General Sans on white.

## Color

### Brand & accent

| Token | Value | Role |
|---|---|---|
| `accent` | `#e15055` | Primary NOURA accent — CTAs, selected states, highlights (115 uses, the dominant chromatic color) |
| `vodafoneRed` | `#e60000` | Vodafone brand red — logo/attribution contexts only (26 uses) |
| `positive` | `#288556` | Success states (Figma var `Color/Core/positive`) |

### Aurora palette (hero background)

| Token | Value |
|---|---|
| `aurora.base` | `#232452` |
| `aurora.blue` | `#4d7dac` |
| `aurora.coral` | `#d9686c` |
| `aurora.purple` | `#6d459a` |
| `aurora.navy` | `#1a1a40` |

### Glass & overlays

| Token | Value | Role |
|---|---|---|
| `glass.fill` | `white @10%` | Standard glass card fill (397 uses — the defining surface) |
| `glass.fillStrong` | `white @20%` | Hover/emphasis glass |
| `glass.border` | `white @50%` | Card borders (also used solid white at 1.5px) |
| `scrim.default` | `black @50%` | Modal backdrop |
| `scrim.heavy` | `#1d1d1d @75%` | Heavy overlay |
| `scrim.tintRed` / `tintBlue` | `#681828 @75%` / `#1c4388 @75%` | Tinted scrims over imagery (plan cards) |

### Neutrals & modes

Figma defines a two-mode variable collection ("Colors"): `contentPrimary` is `#1f1f1f` light / `#ffffff` dark, `bgSecondary` is `#f5f5f5` light / `#1f1f1f` dark, `primaryB` is `#ffffff` light / `#1f1f1f` dark. The Hi-Fi screens themselves are effectively dark-mode-only (white text on the aurora).

### Gradients

`Statistic Gradient` (paint style): linear, `#d32d1f → #8f359b`. Used for usage/data visualizations.

## Typography

One family carries the whole UI: **General Sans**. (Poppins appears only inside the embedded logo lockup; SF Pro only in iOS status bars — neither belongs in product UI.)

| Style | Spec | Usage |
|---|---|---|
| Display | Bold 40px | Hero numbers, intro moments |
| H1 | Bold 24px / 140% | Screen titles |
| H2 | Bold 20px | Card titles (41 uses) |
| H2 alt | Semibold 20px | Softer section titles |
| Body strong | Bold 16px | Emphasized body |
| Body | Semibold 16px | Standard body |
| **Label** | **Semibold 14px** | **The workhorse (123 uses): buttons, list items, nav** |
| Label soft | Medium 14px | Secondary labels |
| Caption | Medium 12px | Meta info, hints (24 uses) |

Line height is mostly auto in Figma; 140% is used where set explicitly. Secondary text on dark surfaces uses `white @50%` rather than a separate gray.

## Spacing

A clean 4px grid: **4, 8, 12, 16, 20, 24, 40, 64, 80**. The most common gaps are 8 (174×), 4 (142×), and 24 (63×).

Padding patterns: cards use `24px` all around (compact variant `20px`), full-bleed screens use `48px 24px`, pill buttons use `8px 16px`.

## Radius

| Token | Value | Usage |
|---|---|---|
| `xs` | 5 | Chips, tiny elements |
| `sm` | 8 | Inputs, small tiles |
| `md` | 16 | Nested cards |
| `lg` | **24** | Primary cards & sheets (54 uses — the signature radius) |
| `xl` | 40 | Figma var "Radius" |
| `xxl` | 56 | Figma var "Radius 2" — device-level container |
| `full` | 999 | Pills, buttons, avatars |

## Effects

Backdrop blur is the system's core effect: **24px** on glass cards, 10px soft variant, 40px on nav bars/sheets. The aurora shape uses a 300px layer blur (scale to ~120px on web for rendering cost). Shadows are minimal: a subtle `0 1px 1px black@25%` and a coral glow `1px 1px 8px #d9686c@20%` on accent elements.

## Component recipes

**Glass card** — `background: rgba(255,255,255,0.1)`, `border: 1.5px solid rgba(255,255,255,0.5)`, `border-radius: 24px`, `backdrop-filter: blur(24px)`, padding 24px, white text.

**Primary button** — coral `#e15055` fill, white Semibold 14px label, pill radius, `8px 16px` padding.

**Glass button** — same as primary but glass fill + border, soft blur.

**Aurora screen** — `#232452` base with four radial blobs (blue / coral / purple / navy) blurred heavily; glass content floats above.

**Plan cards (Consumer/Creator)** — tinted scrims (`tintRed`, `tintBlue`) at 75% over imagery, glass borders, statistic gradient for usage bars.

## Component inventory (Figma component sets)

`Feature v3` (onboarding feature slides with pagination + bottom nav), `Sim Plan v3` (plan selection cards), `Animation v2` (intro animation states), `Navbar v3` (bottom navigation). Screens: Animation, Home (×2), Intro, Attributes, Select Plan (Creator + 2× Consumer), Support, Profile / Create, Profile — all 393×852 (iPhone 15).

## Gaps worth closing in Figma

The file currently has only 4 color variables, 2 radius variables, 1 paint style, and **no text styles**. If NOURA moves past prototype stage, promoting the tokens above into Figma variables/styles (especially the 9 text styles and the glass fill/border colors) would make the file and the code stay in sync via the MCP integration.
