import { useColorScheme } from 'react-native';

export const light = {
  bg: '#FAF6F0',
  surface: '#FFFFFF',
  line: '#ECE6DD',
  text: '#1C1A22',
  textMuted: '#6E6A75',
  regles: '#E0525A',
  folliculaire: '#5FA37E',
  ovulation: '#E6A23C',
  luteale: '#3A6FA8',
  spm: '#5E4B8B',
  good: '#3F7A5A',
  accentBg: '#1C1A22',
  accentFg: '#FAF6F0',
} as const;

export const dark = {
  bg: '#0E0D12',
  surface: '#1A1820',
  line: '#2C2835',
  text: '#F3F0EA',
  textMuted: '#9C97A6',
  regles: '#F06A71',
  folliculaire: '#74BD95',
  ovulation: '#F2B65A',
  luteale: '#6AAEE6',
  spm: '#9A86D4',
  good: '#74BD95',
  accentBg: '#F3F0EA',
  accentFg: '#0E0D12',
} as const;

export type Theme = { [K in keyof typeof light]: string };

export const radii = {
  card: 20,
  button: 18,
  pill: 999,
} as const;

export const space = {
  screen: 20,
  grid: 8,
} as const;

export const type = {
  ring: 64,
  title: 30,
  body: 17,
  secondary: 15,
  label: 12,
  labelTracking: 0.8,
} as const;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}
