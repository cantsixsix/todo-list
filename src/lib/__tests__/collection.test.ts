import { patchById, removeById, upsertById } from '../collection';

const items = [
  { id: 'a', v: 1 },
  { id: 'b', v: 2 },
];

it('upsertById substitui ou adiciona sem mutar', () => {
  expect(upsertById(items, { id: 'b', v: 9 })).toEqual([{ id: 'a', v: 1 }, { id: 'b', v: 9 }]);
  expect(upsertById(items, { id: 'c', v: 3 })).toHaveLength(3);
  expect(items[1].v).toBe(2);
});

it('removeById e patchById', () => {
  expect(removeById(items, 'a')).toEqual([{ id: 'b', v: 2 }]);
  expect(patchById(items, 'a', { v: 5 })[0]).toEqual({ id: 'a', v: 5 });
});
