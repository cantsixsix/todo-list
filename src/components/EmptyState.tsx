import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

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
      {/* Círculos concêntricos: dão "peso" de ilustração sem precisar de imagem. */}
      <View style={[styles.halo, { backgroundColor: colors.primarySoft, opacity: 0.5 }]}>
        <View style={[styles.circle, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={icon} size={34} color={colors.link} />
        </View>
      </View>
      <ThemedText variant="heading" style={styles.center}>
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText muted variant="small" style={styles.center}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.xxxl, paddingHorizontal: space.xxl, gap: space.sm },
  halo: { width: 116, height: 116, borderRadius: 58, alignItems: 'center', justifyContent: 'center', marginBottom: space.md },
  circle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center', maxWidth: 320 },
});
