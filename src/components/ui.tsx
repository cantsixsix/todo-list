/**
 * Peças básicas de interface. Todas seguem o sistema de design
 * (src/theme/tokens.ts) e já vêm com acessibilidade.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, useState } from 'react';
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

import { useTheme } from '@/theme/ThemeProvider';
import { elevation, fonts, radius, space, type, type TypeVariant } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function ThemedText({
  style,
  muted,
  variant = 'body',
  ...props
}: TextProps & { muted?: boolean; variant?: TypeVariant }) {
  const { colors } = useTheme();
  return <Text {...props} style={[type[variant], { color: muted ? colors.textMuted : colors.text }, style]} />;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  title,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
  ...props
}: Omit<PressableProps, 'style'> & {
  title: string;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg = { primary: colors.primary, secondary: colors.surfaceAlt, danger: colors.dangerSoft, ghost: 'transparent' }[variant];
  const fg = { primary: colors.primaryText, secondary: colors.text, danger: colors.danger, ghost: colors.link }[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        variant === 'primary' && !isDisabled ? elevation(1, colors.shadow) : null,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.buttonInner}>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={[type.bodyMedium, { color: fg, fontFamily: fonts.semibold }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export const TextField = forwardRef<TextInput, TextInputProps & { label?: string; icon?: IconName }>(function TextField(
  { label, icon, style, onFocus, onBlur, ...props },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      {label ? <Text style={[type.caption, { color: colors.textMuted }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.surface,
            borderColor: focused ? colors.primary : colors.border,
            // "Anel" de foco: deixa claro onde se está digitando.
            boxShadow: focused ? `0px 0px 0px 3px ${colors.primarySoft}` : undefined,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={colors.textSubtle} /> : null}
        <TextInput
          ref={ref}
          // O rótulo visível também é lido pelos leitores de tela.
          accessibilityLabel={label}
          placeholderTextColor={colors.textSubtle}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, type.body, { color: colors.text }, style]}
          {...props}
        />
      </View>
    </View>
  );
});

export function Chip({
  label,
  selected,
  color,
  count,
  icon,
  onPress,
}: {
  label: string;
  selected?: boolean;
  /** Cor de destaque (ex.: cor da lista ou da prioridade). */
  color?: string;
  count?: number;
  icon?: IconName;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const accent = color ?? colors.primary;
  const fg = selected ? (color ? '#FFFFFF' : colors.primaryText) : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={count ? `${label}, ${count}` : label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? accent : colors.surface,
          borderColor: selected ? accent : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon ? <Ionicons name={icon} size={15} color={selected ? fg : colors.textMuted} /> : null}
      <Text style={[type.small, { color: fg, fontFamily: fonts.semibold }]}>{label}</Text>
      {count ? (
        <View style={[styles.count, { backgroundColor: selected ? 'rgba(255,255,255,0.25)' : colors.surfaceAlt }]}>
          <Text style={[type.caption, { color: fg, fontFamily: fonts.semibold, fontSize: 12 }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors, scheme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        scheme === 'light' ? elevation(1, colors.shadow) : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Barra de progresso fina (0 a 1). */
export function ProgressBar({ value, color, height = 8 }: { value: number; color?: string; height?: number }) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[styles.track, { height, backgroundColor: colors.surfaceAlt }]}
    >
      <View style={{ width: `${pct * 100}%`, height, borderRadius: radius.pill, backgroundColor: color ?? colors.primary }} />
    </View>
  );
}

/** Ícone dentro de um quadrado colorido (usado em listas e ajustes). */
export function IconBadge({ name, color, size = 34 }: { name: IconName; color: string; size?: number }) {
  return (
    <View style={[styles.iconBadge, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: color }]}>
      <Ionicons name={name} size={size * 0.52} color="#FFFFFF" />
    </View>
  );
}

/** Círculo com as iniciais do nome. */
export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft }]}>
      <Text style={{ fontFamily: fonts.bold, fontSize: size * 0.38, color: colors.link }}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 50, borderRadius: radius.md, paddingHorizontal: space.xl, alignItems: 'center', justifyContent: 'center' },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  field: { gap: space.xs + 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.md + 2,
  },
  input: { flex: 1, paddingVertical: space.md, outlineStyle: 'none' } as never,
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    paddingHorizontal: space.md + 2,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  count: { minWidth: 20, paddingHorizontal: 6, borderRadius: radius.pill, alignItems: 'center' },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  track: { width: '100%', borderRadius: radius.pill, overflow: 'hidden' },
  iconBadge: { alignItems: 'center', justifyContent: 'center' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
});
