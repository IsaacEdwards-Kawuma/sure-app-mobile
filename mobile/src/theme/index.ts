/**
 * WiFi Manager design system — spec colours and Paper theme.
 * Primary: Navy #1E3A5F, Secondary: Teal #0B6E6E, Accent: Gold #C9A84C
 */
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const colors = {
  primary: '#1E3A5F',
  secondary: '#0B6E6E',
  accent: '#C9A84C',
  success: '#1A7A3E',
  danger: '#C0392B',
  warning: '#E67E22',
  info: '#6C3483',
  background: '#EEF2F7',
  backgroundDark: '#1a1a2e',
  /** @deprecated Use backgroundDark. Kept for compatibility. */
  BG_DARK: '#1a1a2e',
  surface: '#FFFFFF',
  surfaceDark: '#16213e',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.accent,
    background: colors.background,
    surface: colors.surface,
    error: colors.danger,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.accent,
    background: colors.backgroundDark,
    surface: colors.surfaceDark,
    error: colors.danger,
  },
};

export const theme = darkTheme;
