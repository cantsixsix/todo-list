import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { ThemedText } from './ui';

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={56} color={colors.border} />
      <ThemedText style={styles.title}>{title}</ThemedText>
      {subtitle ? (
        <ThemedText muted style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 32, gap: 8 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  subtitle: { textAlign: 'center', fontSize: 15 },
});
