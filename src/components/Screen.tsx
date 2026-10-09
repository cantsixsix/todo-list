/**
 * Contêiner padrão das telas. Em telas largas (web/tablet) centraliza o
 * conteúdo numa coluna confortável de ler, em vez de esticar de ponta a ponta.
 */
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.outer, { backgroundColor: colors.background }]}>
      <View style={[styles.inner, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center' },
  inner: { flex: 1, width: '100%', maxWidth: 720 },
});
