/**
 * Aviso temporário no rodapé, com ação opcional ("Desfazer").
 * Também mostra os erros de sincronização do DataProvider.
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

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
          style={[styles.container, { bottom: insets.bottom + 72 }]}
          accessibilityLiveRegion="polite"
        >
          <View style={[styles.bar, { backgroundColor: message.error ? colors.danger : colors.text }]}>
            <Text style={[styles.text, { color: message.error ? colors.primaryText : colors.background }]}>{message.text}</Text>
            {message.actionLabel ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  message.onAction?.();
                  setMessage(null);
                }}
                hitSlop={8}
              >
                <Text style={[styles.action, { color: message.error ? colors.primaryText : colors.primary }]}>
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
    maxWidth: 560,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  text: { flex: 1, fontSize: 15 },
  action: { fontSize: 15, fontWeight: '700' },
});
