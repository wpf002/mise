import { useColorScheme } from 'react-native';
import { theme, type ThemeColors } from './tokens';

export type Theme = ThemeColors;

export function useTheme(): Theme {
  return theme[useColorScheme() === 'light' ? 'light' : 'dark'];
}
