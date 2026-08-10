'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { readQueueStatus } from './repository';
import type { OfflineQueueStatus } from './types';

const EMPTY_STATUS: OfflineQueueStatus = { pending: 0, blocked: 0 };

export function useOfflineOwnerId() {
  return useQuery({
    queryKey: ['offline', 'owner'],
    queryFn: async () => {
      const { getCurrentOwnerId } = await import('./owner');
      return getCurrentOwnerId();
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useOfflineQueueStatus(ownerId: string | null | undefined): OfflineQueueStatus {
  const [status, setStatus] = useState<OfflineQueueStatus>(EMPTY_STATUS);

  useEffect(() => {
    if (!ownerId) return;
    const refresh = () => {
      void readQueueStatus(ownerId).then(setStatus);
    };
    refresh();
    window.addEventListener('gymflow:offline-change', refresh);
    window.addEventListener('gymflow:sync-complete', refresh);
    return () => {
      window.removeEventListener('gymflow:offline-change', refresh);
      window.removeEventListener('gymflow:sync-complete', refresh);
    };
  }, [ownerId]);

  return ownerId ? status : EMPTY_STATUS;
}
