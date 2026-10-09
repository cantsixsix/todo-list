/**
 * Peças básicas de interface, todas já com o tema aplicado.
 */
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { forwardRef } from 'react';

import { useTheme } from '@/theme/ThemeProvider';

export function ThemedText({ style, muted, ...props }: TextProps & { muted?: boolean }) {
  const { colors } = useTheme();
  return <Text {...props} style={[{ color: muted ? colors.textMuted : colors.text, fontSize: 16 }, style]} />;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  title,
  variant = 'primary',
  loading,
  disabled,
  style,
  ...props
}: Omit<PressableProps, 'style'> & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg = { primary: colors.primary, secondary: colors.surfaceAlt, danger: colors.danger, ghost: 'transparent' }[variant];
  const fg = { primary: colors.primaryText, secondary: colors.text, danger: colors.primaryText, ghost: colors.primary }[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export const TextField = forwardRef<TextInput, TextInputProps & { label?: string }>(function TextField(
  { label, style, ...props },
  ref,
) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <TextInput
        ref={ref}
        // O rótulo visível também é lido pelos leitores de tela.
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          style,
        ]}
        {...props}
      />
    </View>
  );
});

export function Chip({
  label,
  selected,
  color,
  onPress,
}: {
  label: string;
  selected?: boolean;
  color?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const accent = color ?? colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? accent : colors.surfaceAlt,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={{ color: selected ? '#FFFFFF' : colors.text, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});
