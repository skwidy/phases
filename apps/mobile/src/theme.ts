import { useColorScheme } from 'react-native';

export const light = {
  bg: '#FBF3EA',
  surface: '#FFFAF4',
  line: '#EFDFCD',
  text: '#231A17',
  textMuted: '#75665E',
  regles: '#E0525A',
  folliculaire: '#5FA37E',
  ovulation: '#E6A23C',
  luteale: '#3A6FA8',
  spm: '#5E4B8B',
  good: '#3F7A5A',
  accentBg: '#A94C2A',
  accentFg: '#FFF8F1',
  warm: '#A94C2A',
  warmSoft: '#F7DCC4',
  warmGlow: '#F29E6B',
  sunsetFrom: '#FCE3CB',
  sunsetTo: '#F2B08C',
  ink: '#231A17',
  inkFg: '#FBF3EA',
} as const;

export const dark = {
  bg: '#17110E',
  surface: '#221915',
  line: '#3A2B24',
  text: '#F6EDE4',
  textMuted: '#B3A296',
  regles: '#F06A71',
  folliculaire: '#74BD95',
  ovulation: '#F2B65A',
  luteale: '#6AAEE6',
  spm: '#9A86D4',
  good: '#74BD95',
  accentBg: '#F08A5D',
  accentFg: '#1E120C',
  warm: '#F08A5D',
  warmSoft: '#3A2419',
  warmGlow: '#C8643B',
  sunsetFrom: '#2B1C16',
  sunsetTo: '#4A2A1C',
  ink: '#F6EDE4',
  inkFg: '#17110E',
} as const;

export type Theme = { [K in keyof typeof light]: string };

export const radii = {
  card: 22,
  button: 18,
  pill: 999,
} as const;

export const space = {
  screen: 20,
  grid: 8,
} as const;

// Titles: iOS system serif (New York), same as the site. Body stays ui-rounded.
export const fonts = {
  serif: 'ui-serif',
  rounded: 'ui-rounded',
} as const;

export const type = {
  ring: 64,
  title: 30,
  body: 17,
  secondary: 15,
  label: 12,
  labelTracking: 1,
} as const;

export const serif = {
  fontFamily: fonts.serif,
  fontWeight: '700' as const,
};

export function eyebrowStyle(theme: Theme) {
  return {
    color: theme.warm,
    fontSize: type.label,
    fontWeight: '800' as const,
    letterSpacing: type.labelTracking,
    textTransform: 'uppercase' as const,
  };
}

export function cardChrome(theme: Theme) {
  return {
    backgroundColor: theme.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: theme.line,
  };
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}
