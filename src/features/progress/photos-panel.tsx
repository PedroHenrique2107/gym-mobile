'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, ImagePlus, Pencil, Trash2, X } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { DateInput } from '@/components/forms/date-input';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/generated/types';
import { describeApiError, requireApiData, requireApiSuccess } from '@/lib/api/result';
import { formatCivilDate, todayCivil } from '@/lib/dates/civil-date';

import { progressKeys } from './progress-overview';

type Photo = components['schemas']['ProgressPhotoResponse'];
type AllowedMime = Photo['mimeType'];

const ALLOWED_MIMES = new Set<AllowedMime>(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function PhotosPanel() {
  const queryClient = useQueryClient();
  const [capturedOn, setCapturedOn] = useState(todayCivil());
  const [file, setFile] = useState<File | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editCapturedOn, setEditCapturedOn] = useState('');

  const photos = useQuery({
    queryKey: progressKeys.photos,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/progress/photos');
      return requireApiData(data, error, 'carregar as fotos');
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file || !ALLOWED_MIMES.has(file.type as AllowedMime)) {
        throw new Error('Escolha uma imagem JPEG, PNG ou WebP.');
      }
      if (file.size > MAX_PHOTO_BYTES) throw new Error('A foto deve ter no máximo 10 MB.');

      const { data, error } = await apiClient.POST('/api/v1/progress/photos', {
        body: { capturedOn, mimeType: file.type as AllowedMime, sizeBytes: file.size },
      });
      const reservation = requireApiData(data, error, 'reservar a foto');
      const response = await fetch(reservation.upload.url, {
        method: 'PUT',
        headers: { 'content-type': file.type, 'x-upsert': 'false' },
        body: file,
      });
      if (!response.ok) throw new Error('O envio ao armazenamento privado falhou.');

      const confirmed = await apiClient.POST('/api/v1/progress/photos/{photoId}/confirm', {
        params: { path: { photoId: reservation.photo.id } },
      });
      return requireApiData(confirmed.data, confirmed.error, 'confirmar a foto');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: progressKeys.photos });
      setFile(null);
      toast.success('Foto enviada e validada.');
    },
    onError: async (error) => {
      await queryClient.invalidateQueries({ queryKey: progressKeys.photos });
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a foto.');
    },
  });

  const open = useMutation({
    mutationFn: async (photoId: string) => {
      const { data, error } = await apiClient.POST('/api/v1/progress/photos/{photoId}/read-url', {
        params: { path: { photoId } },
      });
      return requireApiData(data, error, 'abrir a foto');
    },
    onSuccess: ({ download }) => {
      const anchor = document.createElement('a');
      anchor.href = download.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.click();
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível abrir a foto.')),
  });

  const confirm = useMutation({
    mutationFn: async (photoId: string) => {
      const { data, error } = await apiClient.POST('/api/v1/progress/photos/{photoId}/confirm', {
        params: { path: { photoId } },
      });
      return requireApiData(data, error, 'confirmar a foto');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: progressKeys.photos });
      toast.success('Foto validada e liberada.');
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'O arquivo ainda não está pronto para validação.')),
  });

  const remove = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await apiClient.DELETE('/api/v1/progress/photos/{photoId}', {
        params: { path: { photoId } },
      });
      requireApiSuccess(error, 'excluir a foto');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: progressKeys.photos });
      toast.success('Foto excluída do armazenamento privado.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível excluir a foto.')),
  });

  const update = useMutation({
    mutationFn: async ({ photo, date }: { photo: Photo; date: string }) => {
      const { data, error } = await apiClient.PATCH('/api/v1/progress/photos/{photoId}', {
        params: {
          path: { photoId: photo.id },
          header: { 'If-Match': `"${photo.version}"` },
        },
        body: { capturedOn: date },
      });
      return requireApiData(data, error, 'corrigir a data da foto');
    },
    onSuccess: async () => {
      setEditingPhoto(null);
      setEditCapturedOn('');
      await queryClient.invalidateQueries({ queryKey: progressKeys.photos });
      toast.success('Data da foto atualizada.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível atualizar a foto.')),
  });

  function selectFile(event: ChangeEvent<HTMLInputElement>): void {
    const selected = event.target.files?.[0] ?? null;
    if (selected && !ALLOWED_MIMES.has(selected.type as AllowedMime)) {
      event.target.value = '';
      setFile(null);
      toast.error('Use uma imagem JPEG, PNG ou WebP.');
      return;
    }
    if (selected && selected.size > MAX_PHOTO_BYTES) {
      event.target.value = '';
      setFile(null);
      toast.error('A foto deve ter no máximo 10 MB.');
      return;
    }
    setFile(selected);
  }

  const data = photos.data?.data ?? [];

  return (
    <section aria-labelledby="photos-title">
      <Card>
        <CardTitle id="photos-title">Fotos de progresso</CardTitle>
        <CardDescription className="mt-1">
          Arquivos privados, validados pela API antes de ficarem disponíveis.
        </CardDescription>
        <div className="mt-4 flex flex-col gap-3">
          <DateInput
            aria-label="Data da foto"
            value={capturedOn}
            max={todayCivil()}
            onChange={(event) => setCapturedOn(event.target.value)}
          />
          <Input
            aria-label="Escolher foto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={selectFile}
          />
          <Button disabled={!file || upload.isPending} onClick={() => upload.mutate()}>
            <ImagePlus /> {upload.isPending ? 'Enviando e validando...' : 'Enviar foto'}
          </Button>
        </div>

        {photos.isPending ? <p className="mt-4 text-sm">Carregando fotos...</p> : null}
        {photos.isError ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {describeApiError(photos.error, 'Não foi possível carregar as fotos.')}
          </p>
        ) : null}
        {photos.isSuccess && data.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhuma foto enviada.</p>
        ) : null}
        <ul className="mt-4 divide-y divide-border">
          {data.map((photo) => (
            <li key={photo.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex w-full items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{formatCivilDate(photo.capturedOn)}</p>
                  <p className="text-xs text-muted-foreground">
                    {photo.status === 'READY' ? 'Disponível' : 'Envio pendente'} ·{' '}
                    {formatBytes(photo.sizeBytes)}
                  </p>
                </div>
                <div className="flex gap-1">
                  {photo.status === 'PENDING' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={confirm.isPending}
                      onClick={() => confirm.mutate(photo.id)}
                    >
                      Validar
                    </Button>
                  ) : null}
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Editar data da foto"
                    onClick={() => {
                      setEditingPhoto(photo);
                      setEditCapturedOn(photo.capturedOn);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Abrir foto privada"
                    disabled={photo.status !== 'READY' || open.isPending}
                    onClick={() => open.mutate(photo.id)}
                  >
                    <ExternalLink />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Excluir foto"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm('Excluir definitivamente esta foto?'))
                        remove.mutate(photo.id);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              {editingPhoto?.id === photo.id ? (
                <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-secondary/40 p-2 min-[440px]:flex-row">
                  <DateInput
                    aria-label="Nova data da foto"
                    value={editCapturedOn}
                    max={todayCivil()}
                    onChange={(event) => setEditCapturedOn(event.target.value)}
                  />
                  <div className="flex shrink-0 gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      disabled={!editCapturedOn || update.isPending}
                      onClick={() => update.mutate({ photo, date: editCapturedOn })}
                    >
                      Salvar
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Cancelar edição da foto"
                      onClick={() => setEditingPhoto(null)}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
