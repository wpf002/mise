/**
 * Mise palette. Pulled from a working line: seasoned cast iron, cream ramekins,
 * paprika, saffron, bay leaf, and a plum for the wildcard.
 */
export const palette = {
  castIron: '#1C1A17',
  ember: '#2A2622',
  smoke: '#3A3530',
  creme: '#F7F0E3',
  flour: '#FFFBF4',
  paprika: '#E04E2B',
  saffron: '#F4B23E',
  bay: '#4E7A5A',
  plum: '#6B3B5A',
  ash: '#9A9187',
} as const;

/** One color per wheel so a category is recognizable before its label is read. */
export const categoryColor = {
  protein: palette.paprika,
  produce: palette.bay,
  equipment: palette.ash,
  style: palette.saffron,
  cuisine: '#C7774A',
  wildcard: palette.plum,
  format: '#8C6A4F',
  flavor: '#D98F3F',
} as const;

export interface ThemeColors {
  bg: string;
  surface: string;
  raised: string;
  text: string;
  muted: string;
  primary: string;
  accent: string;
}

export const theme: { dark: ThemeColors; light: ThemeColors } = {
  dark: {
    bg: palette.castIron,
    surface: palette.ember,
    raised: palette.smoke,
    text: palette.creme,
    muted: palette.ash,
    primary: palette.paprika,
    accent: palette.saffron,
  },
  light: {
    bg: palette.flour,
    surface: palette.creme,
    raised: '#EFE5D3',
    text: palette.castIron,
    muted: '#6E665D',
    primary: palette.paprika,
    accent: '#C98A1E',
  },
};

export const font = {
  display: 'Fraunces_700Bold',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  body: 'Manrope_500Medium',
  bodyBold: 'Manrope_700Bold',
} as const;

/** Cook Mode targets: big enough for a knuckle. */
export const touch = { min: 56, cook: 72 } as const;
export const radius = { sm: 10, md: 18, lg: 28, pill: 999 } as const;
