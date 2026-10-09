import { enqueue, isNetworkError, type Op } from '../outbox';

const insert: Op = { kind: 'insertTask', row: { id: 'a', title: 'A', position: 1 } };

describe('enqueue', () => {
  it('editar depois de criar vira um único criar', () => {
    const q = enqueue(enqueue([], insert), { kind: 'updateTask', id: 'a', patch: { title: 'A2', priority: 3 } });
    expect(q).toEqual([{ kind: 'insertTask', row: { id: 'a', title: 'A2', priority: 3, position: 1 } }]);
  });

  it('criar e apagar offline se anulam', () => {
    const q = enqueue(enqueue([], insert), { kind: 'deleteTask', id: 'a' });
    expect(q).toEqual([]);
  });

  it('edições seguidas do mesmo item são combinadas', () => {
    let q: Op[] = [];
    q = enqueue(q, { kind: 'updateTask', id: 'x', patch: { title: '1' } });
    q = enqueue(q, { kind: 'updateTask', id: 'y', patch: { title: 'y' } });
    q = enqueue(q, { kind: 'updateTask', id: 'x', patch: { priority: 2 } });
    expect(q).toEqual([
      { kind: 'updateTask', id: 'x', patch: { title: '1', priority: 2 } },
      { kind: 'updateTask', id: 'y', patch: { title: 'y' } },
    ]);
  });

  it('apagar algo que já existe no servidor descarta edições pendentes e mantém o apagar', () => {
    let q: Op[] = [];
    q = enqueue(q, { kind: 'updateTask', id: 'x', patch: { title: '1' } });
    q = enqueue(q, { kind: 'deleteTask', id: 'x' });
    expect(q).toEqual([{ kind: 'deleteTask', id: 'x' }]);
  });

  it('apagar uma lista descarta tarefas criadas offline nela', () => {
    let q: Op[] = [];
    q = enqueue(q, { kind: 'insertTask', row: { id: 't', title: 'T', position: 1, list_id: 'L' } });
    q = enqueue(q, { kind: 'insertTask', row: { id: 'u', title: 'U', position: 2, list_id: null } });
    q = enqueue(q, { kind: 'deleteList', id: 'L' });
    expect(q.map((o) => o.kind)).toEqual(['insertTask', 'deleteList']);
  });

  it('tarefa e lista com mesmo id não se confundem', () => {
    let q: Op[] = [];
    q = enqueue(q, { kind: 'insertList', row: { id: 'same', name: 'L', position: 1 } });
    q = enqueue(q, { kind: 'deleteTask', id: 'same' });
    expect(q).toHaveLength(2);
  });
});

describe('isNetworkError', () => {
  it.each(['TypeError: Failed to fetch', 'Network request failed', 'Load failed'])('%s é de rede', (m) => {
    expect(isNetworkError(new Error(m))).toBe(true);
  });
  it('erro do servidor não é de rede', () => {
    expect(isNetworkError(new Error('new row violates row-level security policy'))).toBe(false);
  });
});
