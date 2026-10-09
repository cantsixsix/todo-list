import { nextOccurrence } from '../recurrence';

// Sexta-feira, 9 de outubro de 2026
const TODAY = new Date(2026, 9, 9);

describe('nextOccurrence', () => {
  it('diária vai para amanhã', () => {
    expect(nextOccurrence('2026-10-09', 'daily', TODAY)).toBe('2026-10-10');
  });

  it('dias úteis pula o fim de semana', () => {
    // sexta → segunda
    expect(nextOccurrence('2026-10-09', 'weekdays', TODAY)).toBe('2026-10-12');
    // segunda → terça
    expect(nextOccurrence('2026-10-12', 'weekdays', new Date(2026, 9, 12))).toBe('2026-10-13');
  });

  it('semanal mantém o dia da semana', () => {
    expect(nextOccurrence('2026-10-09', 'weekly', TODAY)).toBe('2026-10-16');
  });

  it('mensal não pula fevereiro e volta ao dia 31 depois', () => {
    const jan31 = new Date(2027, 0, 31);
    expect(nextOccurrence('2027-01-31', 'monthly', jan31)).toBe('2027-02-28');
    const feb28 = new Date(2027, 1, 28);
    expect(nextOccurrence('2027-01-31', 'monthly', feb28)).toBe('2027-03-31');
  });

  it('anual em 29/fev cai em 28/fev nos anos comuns', () => {
    expect(nextOccurrence('2028-02-29', 'yearly', new Date(2028, 1, 29))).toBe('2029-02-28');
  });

  it('tarefa muito atrasada pula direto para o futuro', () => {
    expect(nextOccurrence('2026-09-01', 'weekly', TODAY)).toBe('2026-10-13');
    expect(nextOccurrence('2026-01-15', 'monthly', TODAY)).toBe('2026-10-15');
  });

  it('sem data conta a partir de hoje', () => {
    expect(nextOccurrence(null, 'daily', TODAY)).toBe('2026-10-10');
  });
});
