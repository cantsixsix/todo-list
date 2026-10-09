/**
 * Aviso temporário no rodapé, com ação opcional ("Desfazer").
 * Também mostra os erros de sincronização do DataProvider.
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { elevation, fonts, radius, space, type } from '@/theme/tokens';
import { useIsWide } from '@/theme/useLayout';

export interface Message {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  error?: boolean;
}

const SnackContext = createContext<(m: Message) => void>(() => {});

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const wide = useIsWide();
  const [message, setMessage] = useState<Message | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((m: Message) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(m);
    timer.current = setTimeout(() => setMessage(null), 4500);
  }, []);

  return (
    <SnackContext.Provider value={show}>
      {children}
      {message ? (
        <View
          pointerEvents="box-none"
          // No celular fica acima da barra de abas e do campo de adicionar.
          style={[styles.container, { bottom: wide ? space.xl : insets.bottom + 150 }]}
          accessibilityLiveRegion="polite"
        >
          <View style={[styles.bar, { backgroundColor: colors.text }, elevation(3, colors.shadow)]}>
            <Ionicons
              name={message.error ? 'alert-circle' : 'checkmark-circle'}
              size={20}
              color={message.error ? colors.danger : colors.success}
            />
            <Text style={[styles.text, type.small, { color: colors.background }]}>{message.text}</Text>
            {message.actionLabel ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  message.onAction?.();
                  setMessage(null);
                }}
                hitSlop={8}
              >
                <Text style={[type.small, { color: colors.primary, fontFamily: fonts.bold }]}>
                  {message.actionLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </SnackContext.Provider>
  );
}

export const useSnackbar = () => useContext(SnackContext);

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  bar: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md + 2,
    borderRadius: radius.lg,
  },
  text: { flex: 1 },
});
