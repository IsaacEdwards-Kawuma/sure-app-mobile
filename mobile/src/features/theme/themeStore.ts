import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../../theme';

export const THEME_KEY = '@surelink_theme';

type ThemeMode = 'dark' | 'light';
type AppTheme = typeof darkTheme;

interface ThemeState {
  mode: ThemeMode;
  theme: AppTheme;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  hydrate: () => Promise<void>;
}

function themeForMode(mode: ThemeMode): MD3Theme {
  return mode === 'light' ? lightTheme : darkTheme;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  theme: darkTheme,
  hydrated: false,

  setMode: async (mode: ThemeMode) => {
    await AsyncStorage.setItem(THEME_KEY, mode);
    set({ mode, theme: themeForMode(mode) });
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      const mode: ThemeMode = stored === 'light' || stored === 'dark' ? stored : 'dark';
      set({ mode, theme: themeForMode(mode), hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));
