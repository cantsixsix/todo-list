/**
 * Paletas clara e escura. As telas usam estes NOMES (função da cor),
 * nunca cores soltas — trocar a identidade visual é mexer só aqui.
 */
export const palettes = {
  light: {
    background: '#F5F6FA',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F6',
    border: '#E3E6EE',
    text: '#0F172A',
    textMuted: '#64748B',
    textSubtle: '#94A3B8',
    primary: '#4F46E5',
    primaryText: '#FFFFFF',
    /** Fundo suave da cor principal (item selecionado, destaque). */
    primarySoft: '#EEF0FF',
    danger: '#DC2626',
    dangerSoft: '#FEECEC',
    success: '#16A34A',
    successSoft: '#E8F7EE',
    warning: '#D97706',
    /** Cor do "véu" atrás de diálogos e da sombra. */
    shadow: '15, 23, 42',
  },
  dark: {
    background: '#0B0D12',
    surface: '#151821',
    surfaceAlt: '#1D212C',
    border: '#262B38',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    textSubtle: '#64748B',
    primary: '#8B8CFF',
    primaryText: '#0B0D12',
    primarySoft: '#23254A',
    danger: '#F87171',
    dangerSoft: '#3A1D22',
    success: '#4ADE80',
    successSoft: '#16301F',
    warning: '#FBBF24',
    shadow: '0, 0, 0',
  },
} as const;

export type Palette = { [K in keyof (typeof palettes)['light']]: string };

/** Cor de cada nível de prioridade (0 = nenhuma). */
export function priorityColor(p: number, c: Palette): string {
  return [c.textSubtle, '#3B82F6', c.warning, c.danger][p] ?? c.textSubtle;
}

export const PRIORITY_LABELS = ['Nenhuma', 'Baixa', 'Média', 'Alta'] as const;

/** Cores oferecidas ao criar uma lista. */
export const LIST_COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#64748B'];
