/**
 * Lexilume — UUID helpers (persistence reliability).
 *
 * Centralizes RFC-4122 v4 UUID generation and validation so runtime-created
 * records are never written with non-UUID string identifiers into UUID
 * columns, and so remote writes can be guarded against invalid foreign keys.
 */

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUuid(id: unknown): id is string {
  return typeof id === 'string' && UUID_V4_RE.test(id);
}
