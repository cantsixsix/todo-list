/** Prioridade: 0 = nenhuma, 1 = baixa, 2 = média, 3 = alta (igual ao banco). */
export type Priority = 0 | 1 | 2 | 3;

/** Uma linha da tabela `lists`. */
export interface TaskList {
  id: string;
  user_id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

/** Uma linha da tabela `tasks`. Datas vêm do banco como string ISO. */
export interface Task {
  id: string;
  user_id: string;
  list_id: string | null;
  title: string;
  notes: string;
  /** Data no formato YYYY-MM-DD (sem horário), ou null. */
  due_date: string | null;
  priority: Priority;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

/** Campos que o usuário pode enviar ao criar uma tarefa. */
export type NewTask = Pick<Task, 'title'> & Partial<Pick<Task, 'list_id' | 'notes' | 'due_date' | 'priority'>>;

/** Campos que o usuário pode alterar numa tarefa. */
export type TaskPatch = Partial<Pick<Task, 'title' | 'notes' | 'due_date' | 'priority' | 'completed_at' | 'list_id' | 'position'>>;

export type NewList = Pick<TaskList, 'name'> & Partial<Pick<TaskList, 'color'>>;
export type ListPatch = Partial<Pick<TaskList, 'name' | 'color' | 'position'>>;

/** Os filtros "inteligentes" da tela principal. */
export type SmartFilter = 'today' | 'upcoming' | 'all' | 'completed';
