/**
 * Fonte única de verdade para tarefas e listas do usuário logado.
 *
 * Como funciona:
 *  1. Abre instantaneamente com o cache salvo no aparelho (funciona sem internet).
 *  2. Busca a versão atual no servidor.
 *  3. Assina o "Realtime" do Supabase: mudanças feitas em outro aparelho
 *     (ex.: na versão web) chegam aqui em tempo real.
 *  4. Toda alteração é "otimista": a tela muda na hora e, se o servidor
 *     recusar, desfazemos e mostramos o erro.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import * as api from '@/lib/api';
import { patchById, removeById, upsertById } from '@/lib/collection';
import { supabase } from '@/lib/supabase';
import { nextPosition } from '@/lib/tasks';
import type { ListPatch, NewList, NewTask, Task, TaskList, TaskPatch } from '@/lib/types';
import { uuid } from '@/lib/uuid';

import { useSnackbar } from '@/components/Snackbar';

import { useAuth } from './AuthProvider';

interface DataValue {
  tasks: Task[];
  lists: TaskList[];
  /** true só na primeira carga sem cache. */
  loading: boolean;
  /** true enquanto puxa dados do servidor (pull-to-refresh). */
  refreshing: boolean;
  refresh: () => Promise<void>;
  addTask: (task: NewTask) => Promise<Task | undefined>;
  editTask: (id: string, patch: TaskPatch) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<Task | undefined>;
  restoreTask: (task: Task) => Promise<void>;
  clearCompleted: () => Promise<void>;
  addList: (list: NewList) => Promise<TaskList | undefined>;
  editList: (id: string, patch: ListPatch) => Promise<void>;
  removeList: (id: string) => Promise<void>;
}

const DataContext = createContext<DataValue | null>(null);

interface Snapshot {
  tasks: Task[];
  lists: TaskList[];
}

const cacheKey = (userId: string) => `data-cache:v1:${userId}`;

/**
 * A `key` faz o React criar um estado novo do zero quando outra pessoa
 * entra na conta — assim nunca aparecem dados do usuário anterior.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  return (
    <DataStore key={userId ?? 'signed-out'} userId={userId}>
      {children}
    </DataStore>
  );
}

function DataStore({ userId, children }: { userId: string | null; children: ReactNode }) {
  const snack = useSnackbar();
  const [data, setData] = useState<Snapshot>({ tasks: [], lists: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Ref sempre com o estado mais recente — usada para desfazer alterações.
  const dataRef = useRef(data);
  useLayoutEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fail = useCallback(
    (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      snack({ text: /fetch|network/i.test(msg) ? 'Sem conexão. Verifique sua internet e tente de novo.' : msg, error: true });
    },
    [snack],
  );

  const refresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      const [tasks, lists] = await Promise.all([api.fetchTasks(), api.fetchLists()]);
      setData({ tasks, lists });
    } catch (e) {
      fail(e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [userId, fail]);

  // 1 + 2: cache local e depois servidor.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    AsyncStorage.getItem(cacheKey(userId))
      .then((raw) => {
        if (cancelled || !raw) return;
        setData(JSON.parse(raw) as Snapshot);
        setLoading(false);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) refresh();
      });
    return () => {
      cancelled = true;
    };
  }, [userId, refresh]);

  // Salva o cache (com pequeno atraso para não gravar a cada tecla).
  useEffect(() => {
    if (!userId || loading) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(cacheKey(userId), JSON.stringify(data)).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [data, userId, loading]);

  // Ao voltar para o app, busca novidades.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  // 3: tempo real.
  useEffect(() => {
    if (!userId) return;
    const apply =
      <T extends { id: string }>(key: keyof Snapshot) =>
      (payload: RealtimePostgresChangesPayload<T>) => {
        setData((prev) => {
          const items = prev[key] as unknown as T[];
          const next =
            payload.eventType === 'DELETE'
              ? removeById(items, (payload.old as Partial<T>).id ?? '')
              : upsertById(items, payload.new as T);
          return { ...prev, [key]: next };
        });
      };
    const channel = supabase
      .channel(`user-data-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` }, apply<Task>('tasks'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists', filter: `user_id=eq.${userId}` }, apply<TaskList>('lists'))
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /** Executa uma alteração otimista; se falhar, volta ao estado anterior. */
  const optimistic = useCallback(
    async <R,>(change: (prev: Snapshot) => Snapshot, request: () => Promise<R>): Promise<R | undefined> => {
      const before = dataRef.current;
      setData(change);
      try {
        return await request();
      } catch (e) {
        setData(before);
        fail(e);
        return undefined;
      }
    },
    [fail],
  );

  const value = useMemo<DataValue>(() => {
    const now = () => new Date().toISOString();
    return {
      ...data,
      loading,
      refreshing,
      refresh,

      async addTask(input) {
        if (!userId) return;
        const draft: Task = {
          id: uuid(),
          user_id: userId,
          list_id: input.list_id ?? null,
          title: input.title.trim(),
          notes: input.notes ?? '',
          due_date: input.due_date ?? null,
          priority: input.priority ?? 0,
          completed_at: null,
          position: nextPosition(dataRef.current.tasks),
          created_at: now(),
          updated_at: now(),
        };
        const saved = await optimistic(
          (p) => ({ ...p, tasks: [...p.tasks, draft] }),
          () =>
            api.insertTask({
              id: draft.id,
              title: draft.title,
              notes: draft.notes,
              list_id: draft.list_id,
              due_date: draft.due_date,
              priority: draft.priority,
              position: draft.position,
            }),
        );
        if (saved) setData((p) => ({ ...p, tasks: upsertById(p.tasks, saved) }));
        return saved;
      },

      async editTask(id, patch) {
        await optimistic(
          (p) => ({ ...p, tasks: patchById(p.tasks, id, { ...patch, updated_at: now() }) }),
          () => api.updateTask(id, patch),
        );
      },

      async toggleTask(id) {
        const task = dataRef.current.tasks.find((t) => t.id === id);
        if (!task) return;
        const completed_at = task.completed_at ? null : now();
        await optimistic(
          (p) => ({ ...p, tasks: patchById(p.tasks, id, { completed_at }) }),
          () => api.updateTask(id, { completed_at }),
        );
      },

      async removeTask(id) {
        const task = dataRef.current.tasks.find((t) => t.id === id);
        if (!task) return;
        await optimistic((p) => ({ ...p, tasks: removeById(p.tasks, id) }), () => api.deleteTask(id));
        return task;
      },

      /** Usado pelo botão "Desfazer" depois de apagar. */
      async restoreTask(task) {
        await optimistic(
          (p) => ({ ...p, tasks: upsertById(p.tasks, task) }),
          () =>
            api.insertTask({
              id: task.id,
              title: task.title,
              notes: task.notes,
              list_id: task.list_id,
              due_date: task.due_date,
              priority: task.priority,
              position: task.position,
            }).then((saved) =>
              task.completed_at ? api.updateTask(saved.id, { completed_at: task.completed_at }) : saved,
            ),
        );
      },

      async clearCompleted() {
        await optimistic(
          (p) => ({ ...p, tasks: p.tasks.filter((t) => t.completed_at === null) }),
          () => api.deleteCompletedTasks(),
        );
      },

      async addList(input) {
        if (!userId) return;
        const draft: TaskList = {
          id: uuid(),
          user_id: userId,
          name: input.name.trim(),
          color: input.color ?? '#4F46E5',
          position: nextPosition(dataRef.current.lists),
          created_at: now(),
          updated_at: now(),
        };
        const saved = await optimistic(
          (p) => ({ ...p, lists: [...p.lists, draft] }),
          () => api.insertList({ id: draft.id, name: draft.name, color: draft.color, position: draft.position }),
        );
        if (saved) setData((p) => ({ ...p, lists: upsertById(p.lists, saved) }));
        return saved;
      },

      async editList(id, patch) {
        await optimistic(
          (p) => ({ ...p, lists: patchById(p.lists, id, { ...patch, updated_at: now() }) }),
          () => api.updateList(id, patch),
        );
      },

      async removeList(id) {
        // O banco apaga as tarefas da lista junto (on delete cascade).
        await optimistic(
          (p) => ({ lists: removeById(p.lists, id), tasks: p.tasks.filter((t) => t.list_id !== id) }),
          () => api.deleteList(id),
        );
      },
    };
  }, [data, loading, refreshing, refresh, userId, optimistic]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData precisa estar dentro de <DataProvider>');
  return ctx;
}
