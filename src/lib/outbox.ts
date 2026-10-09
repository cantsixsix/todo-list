/**
 * Fila de saída ("outbox") para o modo offline.
 *
 * Quando não há internet, cada alteração vira uma "operação" guardada no
 * aparelho. Quando a conexão volta, elas são enviadas em ordem.
 *
 * `enqueue` também compacta a fila para enviar o mínimo possível:
 *   criar + editar  → um único "criar" já com as edições
 *   criar + apagar  → nada (a tarefa nunca precisou existir no servidor)
 *   editar + editar → uma única edição combinada
 */
import type { ListPatch, NewList, NewTask, TaskPatch } from './types';

export type Op =
  | { kind: 'insertTask'; row: NewTask & { id: string; position: number; completed_at?: string | null } }
  | { kind: 'updateTask'; id: string; patch: TaskPatch }
  | { kind: 'deleteTask'; id: string }
  | { kind: 'deleteCompleted' }
  | { kind: 'insertList'; row: NewList & { id: string; position: number } }
  | { kind: 'updateList'; id: string; patch: ListPatch }
  | { kind: 'deleteList'; id: string };

const targetId = (op: Op): string | null => {
  switch (op.kind) {
    case 'insertTask':
    case 'insertList':
      return op.row.id;
    case 'deleteCompleted':
      return null;
    default:
      return op.id;
  }
};

const isTaskOp = (op: Op) => op.kind.endsWith('Task');

export function enqueue(queue: Op[], op: Op): Op[] {
  const id = targetId(op);
  if (id === null) return [...queue, op];
  const sameTarget = (o: Op) => targetId(o) === id && isTaskOp(o) === isTaskOp(op);

  if (op.kind === 'updateTask' || op.kind === 'updateList') {
    const i = queue.findIndex(sameTarget);
    const prev = queue[i];
    if (prev && (prev.kind === 'insertTask' || prev.kind === 'insertList')) {
      const copy = queue.slice();
      copy[i] = { ...prev, row: { ...prev.row, ...op.patch } } as Op;
      return copy;
    }
    // Junta com uma edição pendente do mesmo item, mantendo a ordem original.
    const j = queue.findIndex((o) => sameTarget(o) && o.kind === op.kind);
    if (j !== -1) {
      const copy = queue.slice();
      const old = copy[j] as typeof op;
      copy[j] = { ...old, patch: { ...old.patch, ...op.patch } } as Op;
      return copy;
    }
    return [...queue, op];
  }

  if (op.kind === 'deleteTask' || op.kind === 'deleteList') {
    const createdOffline = queue.some((o) => sameTarget(o) && (o.kind === 'insertTask' || o.kind === 'insertList'));
    let rest = queue.filter((o) => !sameTarget(o));
    // Apagar uma lista também descarta operações pendentes das tarefas dela.
    if (op.kind === 'deleteList') {
      rest = rest.filter((o) => !(o.kind === 'insertTask' && o.row.list_id === op.id));
    }
    return createdOffline ? rest : [...rest, op];
  }

  return [...queue, op];
}

/** Erro de rede (sem internet, servidor fora do ar) — vale a pena tentar de novo depois. */
export function isNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /failed to fetch|network request failed|networkerror|load failed|fetch failed|timeout/i.test(msg);
}
