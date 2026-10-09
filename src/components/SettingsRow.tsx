/** Linha de ajustes: ícone colorido + título + valor/seta. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

import { IconBadge, ThemedText } from './ui';

export function SettingsRow({
  icon,
  color,
  label,
  value,
  onPress,
  danger,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}
    >
      <IconBadge name={icon} color={color} size={30} />
      <View style={[styles.body, !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <ThemedText variant="bodyMedium" style={[styles.flex, danger && { color: colors.danger }]}>
          {label}
        </ThemedText>
        {value ? (
          <ThemedText muted variant="small">
            {value}
          </ThemedText>
        ) : null}
        {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: space.lg },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md + 2, paddingRight: space.lg },
});
