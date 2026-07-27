/**
 * NOURA Design Tokens
 * Extracted from Figma: NOURA-Concept → 📱 Hi-Fi: V7 (node 1330-1774)
 *
 * Typed mirror of tokens.css for use in TS logic, inline styles,
 * charts, canvas animations, or a Tailwind config.
 */

export const color = {
  brand: '#e15055',
  bgBase: '#232452',

  textPrimary: '#ffffff',
  textPrimarySoft: 'rgba(255, 255, 255, 0.9)',
  textSecondary: 'rgba(255, 255, 255, 0.5)',

  surfaceGlass: 'rgba(255, 255, 255, 0.1)',
  surfaceGlassStrong: 'rgba(255, 255, 255, 0.2)',
  surfaceScrim: 'rgba(0, 0, 0, 0.5)',
} as const;

export const font = {
  family: "'General Sans', -apple-system, 'Segoe UI', sans-serif",
  weight: {
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  size: {
    display: 40, // NOURA wordmark
    xl: 24,      // accent numerals (∞)
    lg: 20,      // headings, stat values
    md: 16,      // buttons, card price
    sm: 14,      // body, feature lists, tabs
    xs: 12,      // chips, sub-copy
  },
  leading: {
    tight: 'normal',
    body: 1.4,
  },
} as const;

export const radius = {
  card: 16,
  pill: 24,
  full: 1000,
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 48,
  16: 64,
} as const;

export const blur = {
  card: 5,
  nav: 12,
} as const;

export const shadow = {
  glowBrand: '1px 1px 8px rgba(217, 104, 108, 0.2)',
} as const;

export const layout = {
  viewportWidth: 393,
  viewportHeight: 852,
  contentWidth: 345,
  statusBarHeight: 54,
} as const;

export const size = {
  icon: 24,
  iconSm: 20,
  avatar: 54,
  simCardHeight: 173,
  statCardHeight: 150,
  usageRing: 126,
  tabHeight: 35,
} as const;

/** Subscription tiers as designed in "Sim Plan v3" */
export const plans = {
  create: { label: 'CREATE', price: 40, chip: 'Beliebt' },
  consume: { label: 'CONSUME', price: 20, chip: null },
  message: { label: 'MESSAGE', price: 10, chip: null },
} as const;

export const tokens = { color, font, radius, space, blur, shadow, layout, size, plans };
export default tokens;
