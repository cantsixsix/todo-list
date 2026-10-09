import { addDays, daysBetween, formatDueDate, nextMonday, parseDateInput, toISODate } from '../dates';

// Quinta-feira, 9 de outubro de 2026 — data fixa para os testes serem determinísticos.
const TODAY = new Date(2026, 9, 9);

describe('toISODate / addDays', () => {
  it('formata no fuso local com zeros à esquerda', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('atravessa virada de mês e ano', () => {
    expect(toISODate(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01');
  });
});

describe('daysBetween', () => {
  it('conta dias de calendário', () => {
    expect(daysBetween(TODAY, addDays(TODAY, 3))).toBe(3);
    expect(daysBetween(TODAY, addDays(TODAY, -2))).toBe(-2);
  });
});

describe('nextMonday', () => {
  it('a partir de quinta vai para a segunda seguinte', () => {
    expect(toISODate(nextMonday(TODAY))).toBe('2026-10-12');
  });
  it('a partir de segunda vai para a próxima semana', () => {
    expect(toISODate(nextMonday(new Date(2026, 9, 12)))).toBe('2026-10-19');
  });
});

describe('formatDueDate', () => {
  it.each([
    ['2026-10-09', 'Hoje'],
    ['2026-10-10', 'Amanhã'],
    ['2026-10-08', 'Ontem'],
    ['2026-10-13', 'ter'],
    ['2026-12-25', '25 dez'],
    ['2027-03-01', '1 mar 2027'],
  ])('%s → %s', (iso, label) => {
    expect(formatDueDate(iso, TODAY)).toBe(label);
  });
});

describe('parseDateInput', () => {
  it.each([
    ['hoje', '2026-10-09'],
    ['Amanhã', '2026-10-10'],
    ['25/12', '2026-12-25'],
    ['1/2/27', '2027-02-01'],
    ['2027-05-20', '2027-05-20'],
  ])('%s → %s', (input, iso) => {
    expect(parseDateInput(input, TODAY)).toBe(iso);
  });
  it.each(['', 'ontem?', '31/02', '2026-13-01'])('rejeita %p', (input) => {
    expect(parseDateInput(input, TODAY)).toBeNull();
  });
});
