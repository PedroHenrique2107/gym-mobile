'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MailPlus, RefreshCw, Shield, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { FormField } from '@/components/forms/form-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/generated/types';
import { describeApiError, requireApiData, requireApiSuccess } from '@/lib/api/result';

import { useProfile } from '@/features/profile/use-profile';

type Account = components['schemas']['AccountResponse'];
type ProfileRole = components['schemas']['ProfileRole'];

const accountKeys = {
  all: ['admin', 'accounts'] as const,
};

export function AdminAccountsPanel() {
  const profile = useProfile();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');

  const accounts = useQuery({
    queryKey: accountKeys.all,
    enabled: profile.data?.role === 'ADMIN',
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/admin/accounts');
      return requireApiData(data, error, 'listar as contas');
    },
  });

  const refresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: accountKeys.all });
  };

  const invite = useMutation({
    mutationFn: async (invitedEmail: string) => {
      const { data, error } = await apiClient.POST('/api/v1/admin/accounts/invitations', {
        body: { email: invitedEmail.trim().toLowerCase() },
      });
      return requireApiData(data, error, 'enviar o convite');
    },
    onSuccess: async () => {
      setEmail('');
      await refresh();
      toast.success('Convite enviado. A conta aguarda senha e ativacao.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Nao foi possivel enviar o convite.')),
  });

  const resend = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST(
        '/api/v1/admin/accounts/{id}/invitations/resend',
        { params: { path: { id } } },
      );
      return requireApiData(data, error, 'reenviar o convite');
    },
    onSuccess: () => toast.success('Convite reenviado.'),
    onError: (error) =>
      toast.error(describeApiError(error, 'Nao foi possivel reenviar o convite.')),
  });

  const status = useMutation({
    mutationFn: async ({ account, next }: { account: Account; next: 'ACTIVE' | 'INACTIVE' }) => {
      const { data, error } = await apiClient.PATCH('/api/v1/admin/accounts/{id}/status', {
        params: { path: { id: account.id } },
        body: { status: next },
      });
      return requireApiData(data, error, 'alterar o acesso da conta');
    },
    onSuccess: async (updated) => {
      await refresh();
      toast.success(updated.status === 'ACTIVE' ? 'Conta ativada.' : 'Conta desativada.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Nao foi possivel alterar a conta.')),
  });

  const role = useMutation({
    mutationFn: async ({ account, next }: { account: Account; next: ProfileRole }) => {
      const { data, error } = await apiClient.PATCH('/api/v1/admin/accounts/{id}/role', {
        params: { path: { id: account.id } },
        body: { role: next },
      });
      return requireApiData(data, error, 'alterar o papel da conta');
    },
    onSuccess: async () => {
      await refresh();
      toast.success('Permissao atualizada.');
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Nao foi possivel alterar a permissao.')),
  });

  const remove = useMutation({
    mutationFn: async (account: Account) => {
      const { error } = await apiClient.DELETE('/api/v1/admin/accounts/{id}', {
        params: { path: { id: account.id } },
      });
      requireApiSuccess(error, 'excluir a conta');
    },
    onSuccess: async () => {
      await refresh();
      toast.success('Conta, acesso e dados dependentes foram excluídos.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível excluir a conta.')),
  });

  if (profile.data?.role !== 'ADMIN') return null;
  const adminProfile = profile.data;

  function handleInvite(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (email.trim()) invite.mutate(email);
  }

  return (
    <section aria-labelledby="admin-accounts-title" className="mt-6 border-t border-border pt-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Shield className="size-5" />
        </span>
        <div>
          <h2 id="admin-accounts-title" className="text-lg font-semibold">
            Administracao de contas
          </h2>
          <p className="text-sm text-muted-foreground">Convites, ativacao e permissoes.</p>
        </div>
      </div>

      <Card className="mb-4">
        <form onSubmit={handleInvite} className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Convidar pessoa</CardTitle>
              <CardDescription className="mt-1">
                {accounts.data
                  ? `${accounts.data.usage.occupied}/${accounts.data.usage.limit} vagas ocupadas`
                  : 'Carregando limite...'}
              </CardDescription>
            </div>
            {accounts.data ? (
              <Badge variant="neutral">{accounts.data.usage.available} livres</Badge>
            ) : null}
          </div>
          <FormField id="invite-email" label="E-mail">
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="pessoa@exemplo.com"
              required
            />
          </FormField>
          <Button type="submit" disabled={invite.isPending || accounts.data?.usage.available === 0}>
            <MailPlus /> {invite.isPending ? 'Enviando...' : 'Enviar convite'}
          </Button>
        </form>
      </Card>

      {accounts.isPending ? <Card aria-busy="true">Carregando contas...</Card> : null}
      {accounts.isError ? (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {describeApiError(accounts.error, 'Nao foi possivel carregar as contas.')}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {accounts.data?.data.map((account) => {
          const isSelf = account.id === adminProfile.id;
          return (
            <Card key={account.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate">
                    {account.fullName ?? `Conta ${account.id.slice(0, 8)}`}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {account.onboardingCompletedAt
                      ? 'Perfil inicial concluido'
                      : 'Ainda nao concluiu o perfil'}
                  </CardDescription>
                </div>
                <Badge variant={statusVariant(account.status)}>{statusLabel(account.status)}</Badge>
              </div>

              <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                <Select
                  aria-label={`Permissao de ${account.fullName ?? account.id}`}
                  value={account.role}
                  disabled={isSelf || role.isPending}
                  onChange={(event) => {
                    const next = event.target.value as ProfileRole;
                    if (window.confirm('Alterar a permissao desta conta?')) {
                      role.mutate({ account, next });
                    }
                  }}
                >
                  <option value="MEMBER">Membro</option>
                  <option value="ADMIN">Administrador</option>
                </Select>

                {account.status === 'PENDING_INVITE' ? (
                  <Button
                    variant="outline"
                    disabled={resend.isPending}
                    onClick={() => resend.mutate(account.id)}
                  >
                    <RefreshCw /> Reenviar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled={isSelf || status.isPending}
                    onClick={() => {
                      const next = account.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                      if (
                        window.confirm(`${next === 'ACTIVE' ? 'Ativar' : 'Desativar'} esta conta?`)
                      ) {
                        status.mutate({ account, next });
                      }
                    }}
                  >
                    {account.status === 'ACTIVE' ? 'Desativar' : 'Reativar'}
                  </Button>
                )}
              </div>

              {account.status === 'PENDING_INVITE' ? (
                <Button
                  disabled={status.isPending}
                  onClick={() => {
                    if (window.confirm('Ativar esta conta e liberar o uso do aplicativo?')) {
                      status.mutate({ account, next: 'ACTIVE' });
                    }
                  }}
                >
                  Ativar conta
                </Button>
              ) : null}

              <Button
                variant="destructive"
                disabled={isSelf || remove.isPending}
                onClick={() => {
                  const label = account.status === 'PENDING_INVITE' ? 'este convite' : 'esta conta';
                  if (
                    window.confirm(
                      `Excluir definitivamente ${label}? O acesso, os treinos, as medidas e as fotos serão removidos.`,
                    )
                  ) {
                    remove.mutate(account);
                  }
                }}
              >
                <Trash2 />
                {account.status === 'PENDING_INVITE' ? 'Excluir convite' : 'Excluir conta'}
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function statusLabel(status: Account['status']): string {
  return {
    ACTIVE: 'Ativa',
    PENDING_INVITE: 'Convite pendente',
    INACTIVE: 'Inativa',
    PENDING_DELETION: 'Exclusao pendente',
  }[status];
}

function statusVariant(status: Account['status']): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'PENDING_INVITE') return 'warning';
  if (status === 'INACTIVE') return 'danger';
  return 'neutral';
}
