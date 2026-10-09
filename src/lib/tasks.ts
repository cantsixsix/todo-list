/**
 * Regras de negócio das tarefas: filtros, ordenação e agrupamento.
 * Tudo aqui é função pura (sem rede, sem React) — fácil de testar.
 */
import { daysBetween, fromISODate, toISODate } from './dates';
import type { SmartFilter, Task } from './types';

export const isCompleted = (t: Task) => t.completed_at !== null;

export function isOverdue(t: Task, today: Date = new Date()): boolean {
  return !isCompleted(t) && t.due_date !== null && t.due_date < toISODate(today);
}

/** Aplica um filtro inteligente (Hoje, Próximos, Todas, Concluídas). */
export function applyFilter(tasks: Task[], filter: SmartFilter, today: Date = new Date()): Task[] {
  const todayIso = toISODate(today);
  switch (filter) {
    case 'today':
      // "Hoje" também mostra as atrasadas, para nada ficar esquecido.
      return tasks.filter((t) => !isCompleted(t) && t.due_date !== null && t.due_date <= todayIso);
    case 'upcoming':
      return tasks.filter((t) => !isCompleted(t) && t.due_date !== null && t.due_date > todayIso);
    case 'all':
      return tasks.filter((t) => !isCompleted(t));
    case 'completed':
      return tasks.filter(isCompleted);
  }
}

/** Busca simples por título e notas, sem diferenciar maiúsculas/acentos. */
export function searchTasks(tasks: Task[], query: string): Task[] {
  const q = normalize(query.trim());
  if (!q) return tasks;
  return tasks.filter((t) => normalize(t.title).includes(q) || normalize(t.notes).includes(q));
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Ordem padrão das tarefas abertas:
 * 1) com data antes das sem data, data mais próxima primeiro;
 * 2) maior prioridade primeiro;
 * 3) posição manual; 4) mais antiga primeiro.
 * Concluídas: a concluída mais recentemente primeiro.
 */
export function compareTasks(a: Task, b: Task): number {
  const aDone = isCompleted(a);
  const bDone = isCompleted(b);
  if (aDone !== bDone) return aDone ? 1 : -1;
  if (aDone && bDone) return (b.completed_at ?? '').localeCompare(a.completed_at ?? '');

  if (a.due_date !== b.due_date) {
    if (a.due_date === null) return 1;
    if (b.due_date === null) return -1;
    return a.due_date.localeCompare(b.due_date);
  }
  if (a.priority !== b.priority) return b.priority - a.priority;
  if (a.position !== b.position) return a.position - b.position;
  return a.created_at.localeCompare(b.created_at);
}

export const sortTasks = (tasks: Task[]) => [...tasks].sort(compareTasks);

export interface TaskSection {
  key: string;
  title: string;
  data: Task[];
}

/** Agrupa tarefas em seções: Atrasadas, Hoje, Amanhã, Esta semana, Mais tarde, Sem data. */
export function groupByDue(tasks: Task[], today: Date = new Date()): TaskSection[] {
  const buckets: Record<string, TaskSection> = {
    overdue: { key: 'overdue', title: 'Atrasadas', data: [] },
    today: { key: 'today', title: 'Hoje', data: [] },
    tomorrow: { key: 'tomorrow', title: 'Amanhã', data: [] },
    week: { key: 'week', title: 'Próximos 7 dias', data: [] },
    later: { key: 'later', title: 'Mais tarde', data: [] },
    none: { key: 'none', title: 'Sem data', data: [] },
  };
  for (const t of sortTasks(tasks)) {
    if (t.due_date === null) {
      buckets.none.data.push(t);
      continue;
    }
    const diff = daysBetween(today, fromISODate(t.due_date));
    if (diff < 0) buckets.overdue.data.push(t);
    else if (diff === 0) buckets.today.data.push(t);
    else if (diff === 1) buckets.tomorrow.data.push(t);
    else if (diff <= 7) buckets.week.data.push(t);
    else buckets.later.data.push(t);
  }
  return Object.values(buckets).filter((s) => s.data.length > 0);
}

/** Quantas tarefas abertas existem por lista (para os contadores). */
export function countOpenByList(tasks: Task[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of tasks) {
    if (isCompleted(t) || !t.list_id) continue;
    counts[t.list_id] = (counts[t.list_id] ?? 0) + 1;
  }
  return counts;
}

/**
 * Atalhos no título ao criar uma tarefa, estilo apps profissionais:
 *   "Comprar pão !alta hoje"  → título "Comprar pão", prioridade 3, vence hoje
 *   "Relatório !! amanhã"      → prioridade 2, vence amanhã
 * Palavras reconhecidas: hoje, amanhã/amanha; !, !!, !!!, !baixa, !media/!média, !alta.
 */
export function parseQuickAdd(input: string, today: Date = new Date()): {
  title: string;
  due_date: string | null;
  priority: Task['priority'];
} {
  let due_date: string | null = null;
  let priority: Task['priority'] = 0;
  const kept: string[] = [];

  for (const word of input.trim().split(/\s+/)) {
    const w = word.toLowerCase();
    if (w === 'hoje') due_date = toISODate(today);
    else if (w === 'amanhã' || w === 'amanha') {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      due_date = toISODate(d);
    } else if (w === '!!!' || w === '!alta') priority = 3;
    else if (w === '!!' || w === '!media' || w === '!média') priority = 2;
    else if (w === '!' || w === '!baixa') priority = 1;
    else kept.push(word);
  }

  const title = kept.join(' ');
  // Se a pessoa digitou só "hoje", não apagamos tudo: vira o título.
  if (!title) return { title: input.trim(), due_date: null, priority: 0 };
  return { title, due_date, priority };
}

/** Posição para inserir no fim de uma lista ordenada manualmente. */
export function nextPosition(tasks: { position: number }[]): number {
  return tasks.reduce((max, t) => Math.max(max, t.position), 0) + 1;
}

/**
 * Progresso do dia: tarefas de hoje (incluindo atrasadas) já concluídas
 * hoje versus o total. Usado na barra de progresso da tela inicial.
 */
export function todayProgress(tasks: Task[], today: Date = new Date()): { done: number; total: number } {
  const todayIso = toISODate(today);
  const open = tasks.filter((t) => !isCompleted(t) && t.due_date !== null && t.due_date <= todayIso).length;
  const done = tasks.filter((t) => t.completed_at !== null && toISODate(new Date(t.completed_at)) === todayIso).length;
  return { done, total: open + done };
}
