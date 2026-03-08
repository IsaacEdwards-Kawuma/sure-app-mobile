import { useThemeStore } from '../features/theme/themeStore';
import { colors } from '../theme';

const fallbackTheme = {
  ...colors,
  mode: 'dark' as const,
  isDark: true,
  background: colors.backgroundDark,
  surface: colors.surfaceDark,
  BG_DARK: colors.backgroundDark,
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  borderSubtle: 'rgba(255,255,255,0.06)',
};

/**
 * Returns theme-aware colors for use in styles.
 * Use in layouts/screens so they respond to Settings → Theme (Dark/Light).
 * Always returns a full object so destructuring never hits "Property doesn't exist".
 */
export function useAppTheme() {
  try {
    const mode = useThemeStore((s) => s.mode) ?? 'dark';
    const isDark = mode === 'dark';
    const background = isDark ? colors.backgroundDark : colors.background;
    const surface = isDark ? colors.surfaceDark : colors.surface;
    return {
      ...colors,
      mode,
      isDark,
      background,
      surface,
      BG_DARK: colors.backgroundDark,
      textPrimary: isDark ? '#ffffff' : 'rgba(0,0,0,0.87)',
      textSecondary: isDark ? '#94a3b8' : 'rgba(0,0,0,0.6)',
      borderSubtle: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    };
  } catch {
    return fallbackTheme;
  }
}
