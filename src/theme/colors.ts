/** Paletas clara e escura. Todas as telas usam estes nomes, nunca cores soltas. */
export const palettes = {
  light: {
    background: '#F7F7FB',
    surface: '#FFFFFF',
    surfaceAlt: '#EFEFF5',
    border: '#E2E2EA',
    text: '#14141F',
    textMuted: '#6B6B7B',
    primary: '#4F46E5',
    primaryText: '#FFFFFF',
    danger: '#DC2626',
    success: '#16A34A',
    warning: '#D97706',
  },
  dark: {
    background: '#0E0E14',
    surface: '#18181F',
    surfaceAlt: '#23232C',
    border: '#2E2E38',
    text: '#F2F2F7',
    textMuted: '#9A9AAA',
    primary: '#818CF8',
    primaryText: '#0E0E14',
    danger: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
  },
} as const;

export type Palette = { [K in keyof (typeof palettes)['light']]: string };

/** Cor de cada nível de prioridade (0 = nenhuma). */
export function priorityColor(p: number, c: Palette): string {
  return [c.textMuted, '#3B82F6', c.warning, c.danger][p] ?? c.textMuted;
}

export const PRIORITY_LABELS = ['Nenhuma', 'Baixa', 'Média', 'Alta'] as const;

/** Cores oferecidas ao criar uma lista. */
export const LIST_COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#64748B'];
