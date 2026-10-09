/**
 * Gera um UUID v4. Usa crypto.randomUUID quando existe (web e Hermes recentes);
 * caso contrário, cai num gerador baseado em Math.random — suficiente aqui,
 * pois o UUID só identifica a linha (não é segredo).
 */
export function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
