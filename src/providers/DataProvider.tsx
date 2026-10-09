/**
 * Fonte única de verdade para tarefas e listas do usuário logado.
 *
 * Como funciona:
 *  1. Abre instantaneamente com o cache salvo no aparelho (funciona sem internet).
 *  2. Busca a versão atual no servidor.
 *  3. Assina o "Realtime" do Supabase: mudanças feitas em outro aparelho
 *     (ex.: na versão web) chegam aqui em tempo real.
 *  4. Toda alteração é "otimista": a tela muda na hora.
 *     - Sem internet? A alteração vai para a fila offline (outbox) e é
 *       enviada sozinha quando a conexão voltar.
 *     - O servidor recusou (ex.: dado inválido)? Desfazemos e mostramos o erro.
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
import { AppState, Platform } from 'react-native';

import { useSnackbar } from '@/components/Snackbar';
import * as api from '@/lib/api';
import { patchById, removeById, upsertById } from '@/lib/collection';
import { enqueue, isNetworkError, type Op } from '@/lib/outbox';
import { supabase } from '@/lib/supabase';
import { nextPosition } from '@/lib/tasks';
import type { ListPatch, NewList, NewTask, Task, TaskList, TaskPatch } from '@/lib/types';
import { uuid } from '@/lib/uuid';

import { useAuth } from './AuthProvider';

interface DataValue {
  tasks: Task[];
  lists: TaskList[];
  /** true só na primeira carga sem cache. */
  loading: boolean;
  /** true enquanto puxa dados do servidor (pull-to-refresh). */
  refreshing: boolean;
  /** Quantas alterações feitas offline ainda não chegaram ao servidor. */
  pendingCount: number;
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
const outboxKey = (userId: string) => `outbox:v1:${userId}`;

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
  const [pendingCount, setPendingCount] = useState(0);

  // Ref sempre com o estado mais recente — usada para desfazer alterações.
  const dataRef = useRef(data);
  useLayoutEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Fila offline. Fica numa ref (não em state) porque é lida e alterada
  // dentro de funções assíncronas; o contador visível fica em pendingCount.
  const outbox = useRef<Op[]>([]);
  const flushing = useRef(false);
  const warnedOffline = useRef(false);

  const saveOutbox = useCallback(() => {
    setPendingCount(outbox.current.length);
    if (userId) AsyncStorage.setItem(outboxKey(userId), JSON.stringify(outbox.current)).catch(() => {});
  }, [userId]);

  const showError = useCallback(
    (e: unknown) => snack({ text: e instanceof Error ? e.message : String(e), error: true }),
    [snack],
  );

  /** Envia a fila em ordem. Para no primeiro erro de rede (tenta de novo depois). */
  const flush = useCallback(async (): Promise<boolean> => {
    if (flushing.current) return false;
    flushing.current = true;
    try {
      while (outbox.current.length) {
        const op = outbox.current[0];
        try {
          await api.runOp(op);
        } catch (e) {
          if (isNetworkError(e)) return false;
          // O servidor recusou de vez: descarta para não travar a fila.
          showError(e);
        }
        outbox.current = outbox.current.slice(1);
        saveOutbox();
      }
      if (warnedOffline.current) {
        warnedOffline.current = false;
        snack({ text: 'Conectado. Tudo sincronizado ✓' });
      }
      return true;
    } finally {
      flushing.current = false;
    }
  }, [saveOutbox, showError, snack]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      // Primeiro envia o que foi feito offline; senão o servidor "desfaria" isso.
      if (!(await flush())) return;
      const [tasks, lists] = await Promise.all([api.fetchTasks(), api.fetchLists()]);
      setData({ tasks, lists });
    } catch (e) {
      if (!isNetworkError(e)) showError(e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [userId, flush, showError]);

  // 1 + 2: cache local (dados + fila offline) e depois servidor.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    AsyncStorage.multiGet([cacheKey(userId), outboxKey(userId)])
      .then(([[, cached], [, queued]]) => {
        if (cancelled) return;
        if (queued) {
          outbox.current = JSON.parse(queued) as Op[];
          setPendingCount(outbox.current.length);
        }
        if (cached) {
          setData(JSON.parse(cached) as Snapshot);
          setLoading(false);
        }
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

  // Ao voltar para o app (ou a internet voltar, na web), sincroniza.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    const onOnline = () => refresh();
    if (Platform.OS === 'web') window.addEventListener('online', onOnline);
    return () => {
      sub.remove();
      if (Platform.OS === 'web') window.removeEventListener('online', onOnline);
    };
  }, [refresh]);

  // Enquanto houver pendências, tenta reenviar a cada 15 s.
  useEffect(() => {
    if (pendingCount === 0) return;
    const t = setInterval(() => flush(), 15_000);
    return () => clearInterval(t);
  }, [pendingCount, flush]);

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

  /**
   * Aplica a alteração na tela e envia ao servidor.
   * Sem internet → fila offline. Recusado pelo servidor → desfaz.
   */
  const mutate = useCallback(
    async (change: (prev: Snapshot) => Snapshot, op: Op): Promise<void> => {
      const before = dataRef.current;
      setData(change);
      const queue = (o: Op) => {
        outbox.current = enqueue(outbox.current, o);
        saveOutbox();
        if (!warnedOffline.current) {
          warnedOffline.current = true;
          snack({ text: 'Sem internet. Suas alterações serão enviadas quando a conexão voltar.' });
        }
      };
      // Se já há pendências, entra na fila para manter a ordem das alterações.
      if (outbox.current.length) return queue(op);
      try {
        await api.runOp(op);
      } catch (e) {
        if (isNetworkError(e)) return queue(op);
        setData(before);
        showError(e);
      }
    },
    [saveOutbox, showError, snack],
  );

  const value = useMemo<DataValue>(() => {
    const now = () => new Date().toISOString();
    return {
      ...data,
      loading,
      refreshing,
      pendingCount,
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
        const { id, title, notes, list_id, due_date, priority, position } = draft;
        await mutate((p) => ({ ...p, tasks: [...p.tasks, draft] }), {
          kind: 'insertTask',
          row: { id, title, notes, list_id, due_date, priority, position },
        });
        return draft;
      },

      async editTask(id, patch) {
        await mutate((p) => ({ ...p, tasks: patchById(p.tasks, id, { ...patch, updated_at: now() }) }), {
          kind: 'updateTask',
          id,
          patch,
        });
      },

      async toggleTask(id) {
        const task = dataRef.current.tasks.find((t) => t.id === id);
        if (!task) return;
        const completed_at = task.completed_at ? null : now();
        await mutate((p) => ({ ...p, tasks: patchById(p.tasks, id, { completed_at }) }), {
          kind: 'updateTask',
          id,
          patch: { completed_at },
        });
      },

      async removeTask(id) {
        const task = dataRef.current.tasks.find((t) => t.id === id);
        if (!task) return;
        await mutate((p) => ({ ...p, tasks: removeById(p.tasks, id) }), { kind: 'deleteTask', id });
        return task;
      },

      /** Usado pelo botão "Desfazer" depois de apagar. */
      async restoreTask(task) {
        const { id, title, notes, list_id, due_date, priority, position, completed_at } = task;
        await mutate((p) => ({ ...p, tasks: upsertById(p.tasks, task) }), {
          kind: 'insertTask',
          row: { id, title, notes, list_id, due_date, priority, position, completed_at },
        });
      },

      async clearCompleted() {
        await mutate((p) => ({ ...p, tasks: p.tasks.filter((t) => t.completed_at === null) }), {
          kind: 'deleteCompleted',
        });
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
        const { id, name, color, position } = draft;
        await mutate((p) => ({ ...p, lists: [...p.lists, draft] }), {
          kind: 'insertList',
          row: { id, name, color, position },
        });
        return draft;
      },

      async editList(id, patch) {
        await mutate((p) => ({ ...p, lists: patchById(p.lists, id, { ...patch, updated_at: now() }) }), {
          kind: 'updateList',
          id,
          patch,
        });
      },

      async removeList(id) {
        // O banco apaga as tarefas da lista junto (on delete cascade).
        await mutate(
          (p) => ({ lists: removeById(p.lists, id), tasks: p.tasks.filter((t) => t.list_id !== id) }),
          { kind: 'deleteList', id },
        );
      },
    };
  }, [data, loading, refreshing, pendingCount, refresh, userId, mutate]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData precisa estar dentro de <DataProvider>');
  return ctx;
}
