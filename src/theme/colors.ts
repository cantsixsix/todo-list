/**
 * Paletas clara e escura. As telas usam estes NOMES (função da cor),
 * nunca cores soltas — trocar a identidade visual é mexer só aqui.
 */
export const palettes = {
  light: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceAlt: '#F0F2F5',
    border: '#E6E8EC',
    text: '#0F172A',
    textMuted: '#64748B',
    textSubtle: '#94A3B8',
    primary: '#4F46E5',
    primaryText: '#FFFFFF',
    /** Fundo suave da cor principal (item selecionado, destaque). */
    primarySoft: '#EEF0FF',
    /** Texto em destaque (links, item ativo). Separado de `primary` por contraste. */
    link: '#4F46E5',
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
    surface: '#13161E',
    surfaceAlt: '#1B1F29',
    border: '#242936',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    textSubtle: '#64748B',
    // Mesmo índigo da marca, só um pouco mais claro para contrastar com o fundo escuro.
    primary: '#6366F1',
    primaryText: '#FFFFFF',
    primarySoft: '#1E1F3A',
    link: '#A5B4FC',
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
