/**
 * Tarefas recorrentes: calcula a próxima data de uma repetição.
 */
import { addDays, fromISODate, toISODate } from './dates';
import type { Recurrence } from './types';

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  daily: 'Todo dia',
  weekdays: 'Dias úteis',
  weekly: 'Toda semana',
  monthly: 'Todo mês',
  yearly: 'Todo ano',
};

export const RECURRENCES = Object.keys(RECURRENCE_LABELS) as Recurrence[];

/** Soma meses sem "pular" mês: 31/jan + 1 mês = 28 ou 29/fev (não 3/mar). */
function addMonthsClamped(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

function step(date: Date, rule: Recurrence): Date {
  switch (rule) {
    case 'daily':
      return addDays(date, 1);
    case 'weekdays': {
      let next = addDays(date, 1);
      while (next.getDay() === 0 || next.getDay() === 6) next = addDays(next, 1);
      return next;
    }
    case 'weekly':
      return addDays(date, 7);
    case 'monthly':
      return addMonthsClamped(date, 1);
    case 'yearly':
      return addMonthsClamped(date, 12);
  }
}

/**
 * Próxima ocorrência depois de concluir a tarefa.
 * - Sempre fica no futuro (depois de hoje), mesmo que a tarefa estivesse
 *   muito atrasada — ninguém quer 10 "academias" atrasadas empilhadas.
 * - Mensal/anual preservam o dia original a partir da data de vencimento
 *   (dia 31 continua 31 nos meses que têm 31 dias).
 * - Sem data de vencimento, conta a partir de hoje.
 */
export function nextOccurrence(dueDate: string | null, rule: Recurrence, today: Date = new Date()): string {
  const todayIso = toISODate(today);
  const start = dueDate ? fromISODate(dueDate) : today;

  if (rule === 'monthly' || rule === 'yearly') {
    const months = rule === 'monthly' ? 1 : 12;
    for (let n = 1; n < 1000; n++) {
      const candidate = toISODate(addMonthsClamped(start, months * n));
      if (candidate > todayIso) return candidate;
    }
  }

  let next = step(start, rule);
  while (toISODate(next) <= todayIso) next = step(next, rule);
  return toISODate(next);
}
