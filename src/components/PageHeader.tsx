/**
 * Cabeçalho único das telas principais (Tarefas, Listas, Ajustes):
 * linha de apoio pequena + título grande + espaço opcional à direita.
 * Usar sempre este componente mantém a continuidade entre as abas.
 */
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space } from '@/theme/tokens';
import { useIsWide } from '@/theme/useLayout';

import { ThemedText } from './ui';

export function PageHeader({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const wide = useIsWide();
  return (
    <View style={[styles.wrap, { paddingTop: wide ? space.xl : insets.top + space.md }]}>
      <View style={styles.text}>
        {eyebrow ? (
          <ThemedText muted variant="small">
            {eyebrow}
          </ThemedText>
        ) : null}
        <ThemedText variant="display" numberOfLines={1} accessibilityRole="header">
          {title}
        </ThemedText>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.lg },
  text: { flex: 1, minWidth: 0, gap: space.xxs },
});
