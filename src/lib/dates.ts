/**
 * Utilitários de data. Trabalhamos com datas "de calendário" (YYYY-MM-DD),
 * sempre no fuso horário local do aparelho — assim "hoje" é o hoje do usuário,
 * e não o hoje em UTC.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** Converte um Date para 'YYYY-MM-DD' usando o fuso local. */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Converte 'YYYY-MM-DD' para um Date à meia-noite local. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Diferença em dias de calendário: daysBetween(hoje, amanhã) === 1. */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}

/** Próxima segunda-feira (nunca hoje). */
export function nextMonday(today: Date): Date {
  const day = today.getDay(); // 0 = domingo
  const delta = ((8 - day) % 7) || 7;
  return addDays(today, delta);
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Rótulo amigável para uma data de vencimento:
 * "Hoje", "Amanhã", "Ontem", "qui", "12 mar", "12 mar 2027".
 */
export function formatDueDate(iso: string, today: Date = new Date()): string {
  const date = fromISODate(iso);
  const diff = daysBetween(today, date);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  if (diff > 1 && diff < 7) return WEEKDAYS[date.getDay()];
  const base = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === today.getFullYear() ? base : `${base} ${date.getFullYear()}`;
}

/**
 * Interpreta o que o usuário digitou como data. Aceita:
 * "hoje", "amanhã", "dd/mm", "dd/mm/aaaa" e "aaaa-mm-dd".
 * Retorna 'YYYY-MM-DD' ou null se não reconhecer.
 */
export function parseDateInput(input: string, today: Date = new Date()): string | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;
  if (text === 'hoje') return toISODate(today);
  if (text === 'amanha' || text === 'amanhã') return toISODate(addDays(today, 1));

  let y: number, m: number, d: number;
  const br = text.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/);
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (br) {
    d = Number(br[1]);
    m = Number(br[2]);
    y = br[3] ? Number(br[3].length === 2 ? `20${br[3]}` : br[3]) : today.getFullYear();
  } else if (iso) {
    y = Number(iso[1]);
    m = Number(iso[2]);
    d = Number(iso[3]);
  } else {
    return null;
  }

  const date = new Date(y, m - 1, d);
  // Rejeita datas impossíveis como 31/02 (o JS "rolaria" para março).
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return toISODate(date);
}
