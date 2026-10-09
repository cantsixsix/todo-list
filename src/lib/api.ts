/**
 * Camada de acesso ao banco. As telas nunca falam com o Supabase direto:
 * passam por aqui (via DataProvider), o que deixa o resto do app simples.
 */
import type { Op } from './outbox';
import { supabase } from './supabase';
import type { ListPatch, NewList, NewTask, Task, TaskList, TaskPatch } from './types';

/** Erro do banco com o código do Postgres/PostgREST (ex.: 23505 = chave duplicada). */
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

/** Transforma o erro do Supabase numa exceção normal. */
function unwrap<T>({ data, error }: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (error) throw new ApiError(error.message, error.code);
  return data as T;
}

export async function fetchTasks(): Promise<Task[]> {
  return unwrap(await supabase.from('tasks').select('*').order('created_at'));
}

export async function fetchLists(): Promise<TaskList[]> {
  return unwrap(await supabase.from('lists').select('*').order('position'));
}

/** `id` é gerado no app para a interface poder mostrar a tarefa antes da resposta do servidor. */
export async function insertTask(
  task: NewTask & { id: string; position: number; completed_at?: string | null },
): Promise<Task> {
  return unwrap(await supabase.from('tasks').insert(task).select().single());
}

export async function updateTask(id: string, patch: TaskPatch): Promise<Task> {
  return unwrap(await supabase.from('tasks').update(patch).eq('id', id).select().single());
}

export async function deleteTask(id: string): Promise<void> {
  unwrap(await supabase.from('tasks').delete().eq('id', id));
}

export async function deleteCompletedTasks(): Promise<void> {
  unwrap(await supabase.from('tasks').delete().not('completed_at', 'is', null));
}

export async function insertList(list: NewList & { id: string; position: number }): Promise<TaskList> {
  return unwrap(await supabase.from('lists').insert(list).select().single());
}

export async function updateList(id: string, patch: ListPatch): Promise<TaskList> {
  return unwrap(await supabase.from('lists').update(patch).eq('id', id).select().single());
}

export async function deleteList(id: string): Promise<void> {
  unwrap(await supabase.from('lists').delete().eq('id', id));
}

export async function deleteMyAccount(): Promise<void> {
  unwrap(await supabase.rpc('delete_my_account'));
}

/**
 * Executa uma operação da fila offline. Pensado para ser seguro repetir:
 *  - "criar" que já chegou ao servidor (resposta perdida) → chave duplicada → ok
 *  - "editar" algo que foi apagado em outro aparelho → nenhuma linha → ok
 */
export async function runOp(op: Op): Promise<void> {
  try {
    switch (op.kind) {
      case 'insertTask':
        await insertTask(op.row);
        return;
      case 'updateTask':
        await updateTask(op.id, op.patch);
        return;
      case 'deleteTask':
        return deleteTask(op.id);
      case 'deleteCompleted':
        return deleteCompletedTasks();
      case 'insertList':
        await insertList(op.row);
        return;
      case 'updateList':
        await updateList(op.id, op.patch);
        return;
      case 'deleteList':
        return deleteList(op.id);
    }
  } catch (e) {
    if (e instanceof ApiError && (e.code === '23505' || e.code === 'PGRST116')) return;
    throw e;
  }
}
