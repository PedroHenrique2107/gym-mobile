'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { io, type Socket } from 'socket.io-client';

import { resolveApiBaseUrl } from '@/lib/api/base-url';
import { getSupabaseBrowserClient } from '@/lib/auth/supabase-browser';

import {
  heartbeatWorkoutJam,
  loadActiveWorkoutJam,
  loadWorkoutJamEvents,
  type WorkoutJamSnapshot,
} from './api';
import { mergeWorkoutJamEventPage, type WorkoutJamEventTimeline } from './events';
import { clearKnownJam, markKnownJam, readKnownJam, subscribeKnownJam } from './known-jam';

export const workoutJamKeys = {
  active: ['workout-jams', 'active'] as const,
  events: (jamId: string) => ['workout-jams', jamId, 'events'] as const,
};

export type JamChannelStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

export function useWorkoutJam(ownerId: string | null | undefined) {
  const queryClient = useQueryClient();
  const enabled = Boolean(ownerId);
  const online = useOnlineStatus();
  const [channel, setChannel] = useState<{
    readonly jamId: string | null;
    readonly status: JamChannelStatus;
  }>({ jamId: null, status: 'idle' });
  const lastKnownJamId = useSyncExternalStore(
    subscribeKnownJam,
    () => (ownerId ? readKnownJam(ownerId) : null),
    () => null,
  );
  const knownJamStorageReady = useSyncExternalStore(
    subscribeKnownJam,
    () => true,
    () => false,
  );

  const active = useQuery({
    queryKey: workoutJamKeys.active,
    enabled,
    queryFn: async () => {
      const snapshot = await loadActiveWorkoutJam();
      if (snapshot && ownerId) markKnownJam(ownerId, snapshot.id);
      return snapshot;
    },
    retry: false,
    refetchInterval: (query) => {
      if (!online) return false;
      const current = query.state.data;
      const connected = current && channel.jamId === current.id && channel.status === 'connected';
      return connected ? 60_000 : 10_000;
    },
  });
  const jamId = active.data?.id;

  const events = useQuery({
    queryKey: workoutJamKeys.events(jamId ?? 'none'),
    enabled: Boolean(jamId) && online,
    queryFn: async () => {
      const queryKey = workoutJamKeys.events(jamId!);
      let timeline = queryClient.getQueryData<WorkoutJamEventTimeline>(queryKey) ?? {
        data: [],
        lastSequence: '0',
      };

      // O backend entrega no máximo 100 por vez. Drenar páginas cheias impede
      // que um pico de eventos deixe o cursor preso na primeira centena.
      for (let pageNumber = 0; pageNumber < 10; pageNumber += 1) {
        const page = await loadWorkoutJamEvents(jamId!, timeline.lastSequence);
        timeline = mergeWorkoutJamEventPage(timeline, page);
        if (page.data.length < 100) break;
      }
      return timeline;
    },
    retry: false,
    refetchInterval: online
      ? channel.jamId === jamId && channel.status === 'connected'
        ? 60_000
        : 12_000
      : false,
  });

  useEffect(() => {
    if (!enabled || !online || !jamId) {
      return;
    }

    const socket = createJamSocket();

    const refresh = (): void => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: workoutJamKeys.active }),
        queryClient.invalidateQueries({ queryKey: workoutJamKeys.events(jamId) }),
      ]);
    };
    const onConnect = (): void => {
      setChannel({ jamId, status: 'connecting' });
      socket.emit('jam:join', { jamId });
    };
    const onJoined = (message: { jamId?: string }): void => {
      if (message.jamId === jamId) setChannel({ jamId, status: 'connected' });
    };
    const onSignal = (message: { jamId?: string }): void => {
      if (message.jamId === jamId) refresh();
    };
    const onDisconnect = (): void => setChannel({ jamId, status: 'disconnected' });
    const onConnectError = (): void => setChannel({ jamId, status: 'disconnected' });

    socket.on('connect', onConnect);
    socket.on('jam:joined', onJoined);
    socket.on('jam:event', onSignal);
    socket.on('jam:presence', onSignal);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.connect();

    let heartbeatCount = 0;
    const heartbeat = window.setInterval(() => {
      heartbeatCount += 1;
      if (socket.connected) socket.emit('jam:heartbeat', { jamId });
      if (!socket.connected || heartbeatCount % 3 === 0) {
        void heartbeatWorkoutJam(jamId)
          .then(refresh)
          .catch(() => {
            if (!socket.connected) onConnectError();
          });
      }
    }, 20_000);

    return () => {
      window.clearInterval(heartbeat);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [enabled, jamId, online, queryClient]);

  function setSnapshot(
    snapshot:
      | WorkoutJamSnapshot
      | null
      | ((current: WorkoutJamSnapshot | null | undefined) => WorkoutJamSnapshot | null),
  ): void {
    let nextId: string | null = null;
    queryClient.setQueryData<WorkoutJamSnapshot | null>(workoutJamKeys.active, (current) => {
      const next = typeof snapshot === 'function' ? snapshot(current) : snapshot;
      nextId = next?.id ?? null;
      return next;
    });
    if (nextId && ownerId) markKnownJam(ownerId, nextId);
  }

  async function refresh(): Promise<void> {
    await Promise.all([active.refetch(), jamId ? events.refetch() : Promise.resolve()]);
  }

  const channelStatus: JamChannelStatus =
    !enabled || !jamId
      ? 'idle'
      : !online
        ? 'disconnected'
        : channel.jamId === jamId
          ? channel.status
          : 'connecting';

  return {
    active,
    events,
    online,
    channelStatus,
    channelConnected: online && Boolean(jamId) && channelStatus === 'connected',
    lastKnownJamId,
    knownJamStorageReady,
    clearLastKnownJam: () => {
      if (ownerId) clearKnownJam(ownerId);
    },
    setSnapshot,
    refresh,
  };
}

function createJamSocket(): Socket {
  const apiOrigin = new URL(resolveApiBaseUrl()).origin;
  return io(`${apiOrigin}/workout-jams`, {
    path: '/socket.io/workout-jams',
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    auth: (authorize) => {
      void getSupabaseBrowserClient()
        .auth.getSession()
        .then(({ data }) => authorize({ token: data.session?.access_token ?? '' }))
        .catch(() => authorize({ token: '' }));
    },
  });
}

function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribeOnline, readOnline, () => true);
}

function subscribeOnline(onChange: () => void): () => void {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

function readOnline(): boolean {
  return navigator.onLine;
}
