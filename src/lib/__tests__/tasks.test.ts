import {
  applyFilter,
  countOpenByList,
  groupByDue,
  isOverdue,
  nextPosition,
  parseQuickAdd,
  searchTasks,
  sortTasks,
  todayProgress,
} from '../tasks';
import type { Task } from '../types';

const TODAY = new Date(2026, 9, 9);

let seq = 0;
function task(over: Partial<Task> = {}): Task {
  seq += 1;
  return {
    id: `t${seq}`,
    user_id: 'u1',
    list_id: null,
    title: `Tarefa ${seq}`,
    notes: '',
    due_date: null,
    priority: 0,
    recurrence: null,
    completed_at: null,
    position: seq,
    created_at: `2026-10-01T00:00:0${seq % 10}Z`,
    updated_at: '2026-10-01T00:00:00Z',
    ...over,
  };
}

describe('applyFilter', () => {
  const overdue = task({ due_date: '2026-10-01' });
  const today = task({ due_date: '2026-10-09' });
  const future = task({ due_date: '2026-10-20' });
  const noDate = task();
  const done = task({ due_date: '2026-10-09', completed_at: '2026-10-09T10:00:00Z' });
  const all = [overdue, today, future, noDate, done];

  it('Hoje inclui atrasadas e ignora concluídas', () => {
    expect(applyFilter(all, 'today', TODAY)).toEqual([overdue, today]);
  });
  it('Próximos só tem datas futuras', () => {
    expect(applyFilter(all, 'upcoming', TODAY)).toEqual([future]);
  });
  it('Todas = todas as abertas', () => {
    expect(applyFilter(all, 'all', TODAY)).toEqual([overdue, today, future, noDate]);
  });
  it('Concluídas', () => {
    expect(applyFilter(all, 'completed', TODAY)).toEqual([done]);
  });
});

describe('isOverdue', () => {
  it('só tarefas abertas com data passada', () => {
    expect(isOverdue(task({ due_date: '2026-10-08' }), TODAY)).toBe(true);
    expect(isOverdue(task({ due_date: '2026-10-09' }), TODAY)).toBe(false);
    expect(isOverdue(task({ due_date: '2026-10-08', completed_at: 'x' }), TODAY)).toBe(false);
  });
});

describe('searchTasks', () => {
  it('ignora acentos e maiúsculas e procura nas notas', () => {
    const a = task({ title: 'Reunião com João' });
    const b = task({ title: 'Mercado', notes: 'comprar MAÇÃ' });
    const c = task({ title: 'Academia' });
    expect(searchTasks([a, b, c], 'joao')).toEqual([a]);
    expect(searchTasks([a, b, c], 'maca')).toEqual([b]);
    expect(searchTasks([a, b, c], '  ')).toEqual([a, b, c]);
  });
});

describe('sortTasks', () => {
  it('data mais próxima, depois prioridade, sem data por último, concluídas no fim', () => {
    const noDate = task();
    const lowSoon = task({ due_date: '2026-10-10', priority: 1 });
    const highSoon = task({ due_date: '2026-10-10', priority: 3 });
    const earliest = task({ due_date: '2026-10-09' });
    const doneOld = task({ completed_at: '2026-10-01T00:00:00Z' });
    const doneNew = task({ completed_at: '2026-10-05T00:00:00Z' });
    expect(sortTasks([doneOld, noDate, lowSoon, doneNew, highSoon, earliest])).toEqual([
      earliest,
      highSoon,
      lowSoon,
      noDate,
      doneNew,
      doneOld,
    ]);
  });
});

describe('groupByDue', () => {
  it('cria só as seções não vazias, na ordem certa', () => {
    const sections = groupByDue(
      [
        task({ due_date: '2026-11-30' }),
        task({ due_date: '2026-10-09' }),
        task({ due_date: '2026-10-01' }),
        task({ due_date: '2026-10-10' }),
        task({ due_date: '2026-10-15' }),
        task(),
      ],
      TODAY,
    );
    expect(sections.map((s) => s.title)).toEqual([
      'Atrasadas',
      'Hoje',
      'Amanhã',
      'Próximos 7 dias',
      'Mais tarde',
      'Sem data',
    ]);
  });
});

describe('countOpenByList', () => {
  it('conta só abertas e ignora sem lista', () => {
    expect(
      countOpenByList([
        task({ list_id: 'a' }),
        task({ list_id: 'a' }),
        task({ list_id: 'a', completed_at: 'x' }),
        task({ list_id: 'b' }),
        task(),
      ]),
    ).toEqual({ a: 2, b: 1 });
  });
});

describe('parseQuickAdd', () => {
  it('extrai data e prioridade do texto', () => {
    expect(parseQuickAdd('Comprar pão !alta hoje', TODAY)).toEqual({
      title: 'Comprar pão',
      due_date: '2026-10-09',
      priority: 3,
    });
    expect(parseQuickAdd('Relatório !! amanhã', TODAY)).toEqual({
      title: 'Relatório',
      due_date: '2026-10-10',
      priority: 2,
    });
  });
  it('texto sem atalhos fica igual', () => {
    expect(parseQuickAdd('  Ligar para o banco ', TODAY)).toEqual({
      title: 'Ligar para o banco',
      due_date: null,
      priority: 0,
    });
  });
  it('não deixa o título vazio', () => {
    expect(parseQuickAdd('hoje', TODAY).title).toBe('hoje');
  });
});

describe('nextPosition', () => {
  it('vai para o fim', () => {
    expect(nextPosition([])).toBe(1);
    expect(nextPosition([{ position: 3 }, { position: 7 }])).toBe(8);
  });
});

describe('todayProgress', () => {
  it('conta concluídas hoje e abertas de hoje/atrasadas', () => {
    const doneToday = task({ due_date: '2026-10-09', completed_at: new Date(2026, 9, 9, 10).toISOString() });
    const doneYesterday = task({ completed_at: new Date(2026, 9, 8, 10).toISOString() });
    const openToday = task({ due_date: '2026-10-09' });
    const overdue = task({ due_date: '2026-10-01' });
    const future = task({ due_date: '2026-10-20' });
    expect(todayProgress([doneToday, doneYesterday, openToday, overdue, future], TODAY)).toEqual({ done: 1, total: 3 });
  });
});
