-- =============================================================================
-- Tarefas recorrentes
-- Ao concluir uma tarefa recorrente, o app move a data para a próxima
-- ocorrência em vez de marcá-la como concluída.
-- =============================================================================
alter table public.tasks
  add column recurrence text
  check (recurrence in ('daily', 'weekdays', 'weekly', 'monthly', 'yearly'));

comment on column public.tasks.recurrence is
  'Repetição: daily, weekdays (seg–sex), weekly, monthly, yearly ou null (não repete).';
