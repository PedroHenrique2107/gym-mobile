export const JAM_INVITE_STORAGE_KEY = 'gymflow:jam-invite-code';
export const JAM_HOST_INVITE_STORAGE_KEY = 'gymflow:jam-host-invite';
const JAM_HOST_INVITE_CHANGE_EVENT = 'gymflow:jam-host-invite-change';

const INVITE_CODE_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

/**
 * O segredo fica no fragmento para nunca chegar ao proxy, ao servidor Next ou
 * aos logs HTTP. A página o move para sessionStorage antes de limpar a URL.
 */
export function readInviteCodeFromHash(hash: string): string | null {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get('codigo')?.trim() ?? '';
  return isValidInviteCode(value) ? value : null;
}

export function normalizeInviteCode(value: string): string | null {
  const normalized = value.trim();
  return isValidInviteCode(normalized) ? normalized : null;
}

export function buildInvitePath(inviteCode: string): string {
  const normalized = normalizeInviteCode(inviteCode);
  if (!normalized) throw new Error('Código de convite inválido.');
  return `/jam/entrar#codigo=${encodeURIComponent(normalized)}`;
}

export function participantInitials(name: string | null | undefined): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return `${first}${last}`.toLocaleUpperCase('pt-BR');
}

export interface StoredHostInvite {
  readonly jamId: string;
  readonly inviteCode: string;
  readonly expiresAt: string;
}

export function storeHostInvite(invite: StoredHostInvite): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(JAM_HOST_INVITE_STORAGE_KEY, JSON.stringify(invite));
  window.dispatchEvent(new Event(JAM_HOST_INVITE_CHANGE_EVENT));
}

export function readHostInvite(jamId: string, now = Date.now()): StoredHostInvite | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(JAM_HOST_INVITE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isStoredHostInvite(value) || value.jamId !== jamId) return null;
    if (new Date(value.expiresAt).getTime() <= now) return null;
    return value;
  } catch {
    return null;
  }
}

export function clearHostInvite(): void {
  if (typeof sessionStorage === 'undefined') return;
  if (sessionStorage.getItem(JAM_HOST_INVITE_STORAGE_KEY) === null) return;
  sessionStorage.removeItem(JAM_HOST_INVITE_STORAGE_KEY);
  window.dispatchEvent(new Event(JAM_HOST_INVITE_CHANGE_EVENT));
}

export function subscribeHostInvite(onChange: () => void): () => void {
  window.addEventListener(JAM_HOST_INVITE_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(JAM_HOST_INVITE_CHANGE_EVENT, onChange);
}

function isValidInviteCode(value: string): boolean {
  return INVITE_CODE_PATTERN.test(value);
}

function isStoredHostInvite(value: unknown): value is StoredHostInvite {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['jamId'] === 'string' &&
    typeof candidate['inviteCode'] === 'string' &&
    isValidInviteCode(candidate['inviteCode']) &&
    typeof candidate['expiresAt'] === 'string' &&
    Number.isFinite(new Date(candidate['expiresAt']).getTime())
  );
}
