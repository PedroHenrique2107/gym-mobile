'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Smartphone, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/generated/types';
import { ApiError, ErrorCode } from '@/lib/api/problem';
import { describeApiError, requireApiData, requireApiSuccess } from '@/lib/api/result';

import { decodeVapidPublicKey, supportsWebPush } from './push';

type Subscription = components['schemas']['PushSubscriptionResponse'];

const notificationKeys = {
  all: ['notifications'] as const,
  config: ['notifications', 'config'] as const,
  preferences: ['notifications', 'preferences'] as const,
  subscriptions: ['notifications', 'subscriptions'] as const,
};

export function NotificationSettings() {
  const queryClient = useQueryClient();
  const [reminderTime, setReminderTime] = useState('');
  const config = useQuery({
    queryKey: notificationKeys.config,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/notifications/config');
      return requireApiData(data, error, 'verificar notificacoes');
    },
  });
  const preferences = useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/notifications/preferences');
      return requireApiData(data, error, 'carregar preferencias de notificacao');
    },
  });
  const subscriptions = useQuery({
    queryKey: notificationKeys.subscriptions,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/notifications/subscriptions');
      return requireApiData(data, error, 'listar dispositivos de notificacao');
    },
  });
  const preference = preferences.data?.data.find((item) => item.type === 'WORKOUT_REMINDER');
  const selectedTime = reminderTime || preference?.reminderTime || '18:00';

  const enable = useMutation({
    mutationFn: async () => {
      if (!config.data?.enabled || !config.data.publicKey) {
        throw new Error('Web Push ainda nao esta configurado neste ambiente.');
      }
      if (!supportsWebPush()) {
        throw new Error(
          'Este navegador nao oferece Web Push neste modo. Instale a PWA e tente novamente.',
        );
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('A permissao de notificacao nao foi concedida.');
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const browserSubscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidPublicKey(config.data.publicKey),
        }));
      const serialized = browserSubscription.toJSON();
      if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) {
        throw new Error('O navegador devolveu uma subscription incompleta.');
      }

      const registered = await apiClient.POST('/api/v1/notifications/subscriptions', {
        body: {
          endpoint: serialized.endpoint,
          keys: { p256dh: serialized.keys.p256dh, auth: serialized.keys.auth },
          expirationTime: serialized.expirationTime ?? null,
          deviceName: 'Este dispositivo',
        },
      });
      requireApiData(registered.data, registered.error, 'registrar este dispositivo');

      const updated = await apiClient.PATCH('/api/v1/notifications/preferences/{type}', {
        params: {
          path: { type: 'WORKOUT_REMINDER' },
          ...(preference?.version === null || preference?.version === undefined
            ? {}
            : { header: { 'If-Match': `"${preference.version}"` } }),
        },
        body: { enabled: true, reminderTime: selectedTime },
      });
      return requireApiData(updated.data, updated.error, 'ativar o lembrete');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success('Lembrete de treino ativado neste dispositivo.');
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.code === ErrorCode.RESOURCE_VERSION_CONFLICT) {
        await queryClient.invalidateQueries({ queryKey: notificationKeys.preferences });
        toast.error('A preferencia mudou em outro dispositivo. Revise e tente novamente.');
        return;
      }
      toast.error(describeApiError(error, 'Nao foi possivel ativar o lembrete.'));
    },
  });

  const disable = useMutation({
    mutationFn: async () => {
      if (!preference || preference.version === null || preference.version === undefined) {
        return null;
      }
      const { data, error } = await apiClient.PATCH('/api/v1/notifications/preferences/{type}', {
        params: {
          path: { type: 'WORKOUT_REMINDER' },
          header: { 'If-Match': `"${preference.version}"` },
        },
        body: { enabled: false },
      });
      return requireApiData(data, error, 'desativar o lembrete');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.preferences });
      toast.success('Lembrete de treino desativado.');
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Nao foi possivel desativar o lembrete.')),
  });

  const remove = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await apiClient.DELETE(
        '/api/v1/notifications/subscriptions/{subscriptionId}',
        { params: { path: { subscriptionId } } },
      );
      requireApiSuccess(error, 'remover o dispositivo');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.subscriptions });
      toast.success('Dispositivo removido das notificacoes.');
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Nao foi possivel remover o dispositivo.')),
  });

  if (config.isPending || preferences.isPending || subscriptions.isPending) {
    return (
      <Card className="mt-6" aria-busy="true">
        Carregando notificacoes...
      </Card>
    );
  }

  if (config.isError || preferences.isError || subscriptions.isError) {
    return (
      <Card className="mt-6 border-destructive/30">
        <CardTitle>Notificacoes</CardTitle>
        <p className="mt-2 text-sm text-destructive">
          {describeApiError(
            config.error ?? preferences.error ?? subscriptions.error,
            'Nao foi possivel carregar as notificacoes.',
          )}
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>Lembretes de treino</CardTitle>
          <CardDescription className="mt-1">
            Opcional e desativado por padrao. Usa o horario e timezone do seu perfil.
          </CardDescription>
        </div>
        {preference?.enabled ? (
          <Bell className="text-success" aria-label="Lembrete ativo" />
        ) : (
          <BellOff className="text-muted-foreground" aria-label="Lembrete inativo" />
        )}
      </div>

      {!config.data?.enabled ? (
        <p className="mt-4 rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
          O servidor ainda nao possui as chaves Web Push. Nenhum lembrete sera enviado ate a
          configuracao ser concluida.
        </p>
      ) : (
        <div className="mt-4 flex gap-2">
          <Input
            aria-label="Horario do lembrete"
            type="time"
            value={selectedTime}
            disabled={preference?.enabled}
            onChange={(event) => setReminderTime(event.target.value)}
          />
          {preference?.enabled ? (
            <Button variant="outline" disabled={disable.isPending} onClick={() => disable.mutate()}>
              Desativar
            </Button>
          ) : (
            <Button disabled={enable.isPending || !selectedTime} onClick={() => enable.mutate()}>
              <Bell /> Ativar
            </Button>
          )}
        </div>
      )}

      {subscriptions.data?.data.length ? (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dispositivos inscritos
          </p>
          {subscriptions.data.data.map((subscription: Subscription) => (
            <DeviceRow
              key={subscription.id}
              subscription={subscription}
              removing={remove.isPending}
              onRemove={() => remove.mutate(subscription.id)}
            />
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function DeviceRow({
  subscription,
  removing,
  onRemove,
}: {
  readonly subscription: Subscription;
  readonly removing: boolean;
  readonly onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <p className="flex items-center gap-2 text-sm">
        <Smartphone className="size-4" /> {subscription.deviceName ?? 'Dispositivo'}
      </p>
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Remover ${subscription.deviceName ?? 'dispositivo'}`}
        disabled={removing}
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
