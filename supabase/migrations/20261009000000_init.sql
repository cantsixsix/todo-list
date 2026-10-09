-- =============================================================================
-- Esquema inicial do app Tarefas
-- Tabelas: lists (listas/projetos) e tasks (tarefas)
-- Segurança: Row Level Security — cada usuário só enxerga os próprios dados.
-- =============================================================================

-- Mantém updated_at sempre atualizado em qualquer UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Listas
-- -----------------------------------------------------------------------------
create table public.lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  color       text not null default '#4F46E5' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  position    double precision not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index lists_user_id_idx on public.lists (user_id);

create trigger lists_set_updated_at
  before update on public.lists
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tarefas
-- -----------------------------------------------------------------------------
create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  list_id       uuid references public.lists (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 500),
  notes         text not null default '' check (char_length(notes) <= 5000),
  due_date      date,
  -- 0 = nenhuma, 1 = baixa, 2 = média, 3 = alta
  priority      smallint not null default 0 check (priority between 0 and 3),
  completed_at  timestamptz,
  position      double precision not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_list_id_idx on public.tasks (list_id);
create index tasks_user_due_idx on public.tasks (user_id, due_date) where completed_at is null;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- (select auth.uid()) é avaliado uma vez por consulta — recomendação de
-- performance do próprio Supabase.
-- -----------------------------------------------------------------------------
alter table public.lists enable row level security;
alter table public.tasks enable row level security;

create policy "lists: dono lê"      on public.lists for select to authenticated using ((select auth.uid()) = user_id);
create policy "lists: dono cria"    on public.lists for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "lists: dono altera"  on public.lists for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "lists: dono apaga"   on public.lists for delete to authenticated using ((select auth.uid()) = user_id);

create policy "tasks: dono lê"      on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy "tasks: dono cria"    on public.tasks for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    -- impede colocar uma tarefa numa lista de outra pessoa
    and (list_id is null or exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())))
  );
create policy "tasks: dono altera"  on public.tasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (list_id is null or exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())))
  );
create policy "tasks: dono apaga"   on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- Exclusão de conta (exigida pela Google Play para apps com login)
-- A função roda com privilégios elevados (security definer), mas só apaga
-- o usuário que está chamando. As tarefas/listas somem por "on delete cascade".
-- -----------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- -----------------------------------------------------------------------------
-- Realtime: alterações feitas no celular aparecem na web na hora (e vice-versa)
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.lists, public.tasks;
