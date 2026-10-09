/**
 * Sistema de design: escalas fixas de espaçamento, cantos, tipografia e
 * sombras. Usar sempre estes valores (nunca números soltos) é o que deixa
 * o app com aparência consistente e "profissional".
 */
import type { TextStyle, ViewStyle } from 'react-native';

/** Espaçamento em múltiplos de 4 px. */
export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

/**
 * Família Inter: no Android cada peso é uma fonte separada, por isso
 * usamos fontFamily (e não fontWeight) para escolher o peso.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Escala tipográfica. */
export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, letterSpacing: -0.1 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  small: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  overline: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

/**
 * Sombras suaves em camadas (como iOS/Material 3). `boxShadow` funciona
 * igual no Android, iOS e web nas versões atuais do React Native.
 */
export function elevation(level: 1 | 2 | 3, rgb: string): ViewStyle {
  const shadows = {
    1: `0px 1px 2px rgba(${rgb}, 0.05), 0px 1px 3px rgba(${rgb}, 0.06)`,
    2: `0px 2px 4px rgba(${rgb}, 0.05), 0px 6px 16px rgba(${rgb}, 0.08)`,
    3: `0px 8px 16px rgba(${rgb}, 0.08), 0px 16px 40px rgba(${rgb}, 0.12)`,
  };
  return { boxShadow: shadows[level] };
}

/** Largura a partir da qual o app troca as abas de baixo pelo menu lateral. */
export const WIDE_BREAKPOINT = 900;
