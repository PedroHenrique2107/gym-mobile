export function shouldBlockInitialJamCheck({
  online,
  knownJamStorageReady,
  hasKnownJam,
  pending,
  error,
}: {
  readonly online: boolean;
  readonly knownJamStorageReady: boolean;
  readonly hasKnownJam: boolean;
  readonly pending: boolean;
  readonly error: boolean;
}): boolean {
  if (!pending && !error) return false;
  if (online) return true;
  if (!knownJamStorageReady) return true;
  return hasKnownJam;
}
