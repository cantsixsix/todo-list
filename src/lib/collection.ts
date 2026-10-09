/** Operações imutáveis em arrays de registros com `id` (usadas pelo estado do app). */
export function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const i = items.findIndex((x) => x.id === item.id);
  if (i === -1) return [...items, item];
  const copy = items.slice();
  copy[i] = item;
  return copy;
}

export function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((x) => x.id !== id);
}

export function patchById<T extends { id: string }>(items: T[], id: string, patch: Partial<T>): T[] {
  return items.map((x) => (x.id === id ? { ...x, ...patch } : x));
}
