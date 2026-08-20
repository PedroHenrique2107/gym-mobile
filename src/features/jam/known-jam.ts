const KNOWN_JAM_PREFIX = 'gymflow:known-jam:';
const KNOWN_JAM_CHANGE_EVENT = 'gymflow:known-jam-change';

export function markKnownJam(ownerId: string, jamId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`${KNOWN_JAM_PREFIX}${ownerId}`, jamId);
  window.dispatchEvent(new Event(KNOWN_JAM_CHANGE_EVENT));
}

export function readKnownJam(ownerId: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(`${KNOWN_JAM_PREFIX}${ownerId}`);
}

export function clearKnownJam(ownerId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(`${KNOWN_JAM_PREFIX}${ownerId}`);
  window.dispatchEvent(new Event(KNOWN_JAM_CHANGE_EVENT));
}

export function subscribeKnownJam(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent): void => {
    if (event.key === null || event.key.startsWith(KNOWN_JAM_PREFIX)) onChange();
  };
  window.addEventListener(KNOWN_JAM_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(KNOWN_JAM_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}
