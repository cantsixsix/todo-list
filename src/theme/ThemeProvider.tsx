import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { palettes, type Palette } from './colors';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeValue {
  colors: Palette;
  scheme: 'light' | 'dark';
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const STORAGE_KEY = 'theme-preference';
const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Lembra a escolha do usuário entre aberturas do app.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
      })
      .catch(() => {});
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
    return {
      colors: palettes[scheme],
      scheme,
      preference,
      setPreference: (p) => {
        setPreferenceState(p);
        AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
      },
    };
  }, [preference, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme precisa estar dentro de <ThemeProvider>');
  return ctx;
}
