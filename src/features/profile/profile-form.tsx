'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { FormField } from '@/components/forms/form-field';
import { ErrorState } from '@/components/feedback/state-message';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/generated/types';
import { describeApiError, requireApiData } from '@/lib/api/result';

import { profileKeys, useProfile, type Profile } from './use-profile';

type UpdateProfileRequest = components['schemas']['UpdateProfileRequest'];
type ProfileTimezone = NonNullable<UpdateProfileRequest['timezone']>;

const WEEKDAYS = [
  [1, 'Seg'],
  [2, 'Ter'],
  [3, 'Qua'],
  [4, 'Qui'],
  [5, 'Sex'],
  [6, 'Sab'],
  [7, 'Dom'],
] as const;

export function ProfileForm() {
  const profile = useProfile();

  if (profile.isPending) {
    return <Card aria-busy="true">Carregando seus dados...</Card>;
  }

  if (profile.isError) {
    return (
      <Card>
        <ErrorState
          title="Nao foi possivel abrir seu perfil"
          description={describeApiError(profile.error, 'Falha inesperada ao carregar o perfil.')}
          onRetry={() => void profile.refetch()}
        />
      </Card>
    );
  }

  return <ProfileEditor key={profile.data.version} profile={profile.data} />;
}

function ProfileEditor({ profile }: { readonly profile: Profile }) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(profile.fullName ?? '');
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? '');
  const [biologicalSex, setBiologicalSex] = useState(profile.biologicalSex ?? '');
  const [heightCm, setHeightCm] = useState(profile.heightCm ?? '');
  const [weightKg, setWeightKg] = useState(profile.weightKg ?? '');
  const [targetWeightKg, setTargetWeightKg] = useState(profile.targetWeightKg ?? '');
  const [experience, setExperience] = useState(profile.experience);
  const [goal, setGoal] = useState(profile.goal);
  const [weeklyFrequency, setWeeklyFrequency] = useState(profile.weeklyFrequency);
  const [sessionMinutes, setSessionMinutes] = useState(profile.sessionMinutes);
  const [availableWeekdays, setAvailableWeekdays] = useState(profile.availableWeekdays);
  const [trainingPlace, setTrainingPlace] = useState(profile.trainingPlace ?? '');
  const [equipment, setEquipment] = useState(profile.equipment.join(', '));
  const [limitations, setLimitations] = useState(profile.limitations ?? '');
  const [restSecondsDefault, setRestSecondsDefault] = useState(profile.restSecondsDefault);
  const [progressionIncrementKg, setProgressionIncrementKg] = useState(
    profile.progressionIncrementKg,
  );
  const [timezone, setTimezone] = useState<ProfileTimezone>(profile.timezone as ProfileTimezone);
  const [startDate, setStartDate] = useState(profile.startDate ?? '');
  const [deadline, setDeadline] = useState(profile.deadline ?? '');

  const mutation = useMutation({
    mutationFn: async (body: UpdateProfileRequest) => {
      const { data, error } = await apiClient.PATCH('/api/v1/me', {
        params: { header: { 'If-Match': `"${profile.version}"` } },
        body,
      });
      return requireApiData(data, error, 'salvar o perfil');
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(profileKeys.me, updated);
      toast.success(
        profile.onboardingCompletedAt ? 'Perfil atualizado.' : 'Configuracao inicial concluida.',
      );
    },
    onError: async (error) => {
      toast.error(describeApiError(error, 'Nao foi possivel salvar o perfil.'));
      if (error instanceof Error && 'code' in error && error.code === 'RESOURCE_VERSION_CONFLICT') {
        await queryClient.invalidateQueries({ queryKey: profileKeys.me });
      }
    },
  });

  function toggleWeekday(weekday: number): void {
    setAvailableWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((value) => value !== weekday)
        : [...current, weekday].sort((a, b) => a - b),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const body: UpdateProfileRequest = {
      fullName: emptyToNull(fullName),
      birthDate: emptyToNull(birthDate),
      biologicalSex: biologicalSex
        ? (biologicalSex as components['schemas']['BiologicalSex'])
        : null,
      heightCm: emptyToNull(heightCm),
      weightKg: emptyToNull(weightKg),
      targetWeightKg: emptyToNull(targetWeightKg),
      experience,
      goal,
      weeklyFrequency,
      sessionMinutes,
      availableWeekdays,
      trainingPlace: emptyToNull(trainingPlace),
      equipment: equipment
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter((value, index, all) => value.length > 0 && all.indexOf(value) === index),
      limitations: emptyToNull(limitations),
      restSecondsDefault,
      progressionIncrementKg,
      timezone,
      startDate: emptyToNull(startDate),
      deadline: emptyToNull(deadline),
      ...(profile.onboardingCompletedAt ? {} : { onboardingCompleted: true }),
    };

    mutation.mutate(body);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!profile.onboardingCompletedAt ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardTitle>Conclua sua configuracao inicial</CardTitle>
          <CardDescription className="mt-1">
            Estes dados personalizam a duracao, os dias e as metas das suas fichas.
          </CardDescription>
        </Card>
      ) : null}

      {mutation.isError ? (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {describeApiError(mutation.error, 'Nao foi possivel salvar o perfil.')}
        </p>
      ) : null}

      <Card className="flex flex-col gap-4">
        <CardTitle>Dados pessoais</CardTitle>
        <FormField id="profile-name" label="Nome completo">
          <Input
            id="profile-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            maxLength={120}
            autoComplete="name"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField id="profile-birth" label="Nascimento">
            <Input
              id="profile-birth"
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
            />
          </FormField>
          <FormField id="profile-sex" label="Sexo biologico">
            <Select
              id="profile-sex"
              value={biologicalSex}
              onChange={(event) => setBiologicalSex(event.target.value)}
            >
              <option value="">Nao informar</option>
              <option value="FEMALE">Feminino</option>
              <option value="MALE">Masculino</option>
              <option value="INTERSEX">Intersexo</option>
              <option value="UNDISCLOSED">Prefiro nao dizer</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <DecimalInput
            id="profile-height"
            label="Altura (cm)"
            value={heightCm}
            onChange={setHeightCm}
          />
          <DecimalInput
            id="profile-weight"
            label="Peso (kg)"
            value={weightKg}
            onChange={setWeightKg}
          />
          <DecimalInput
            id="profile-target"
            label="Meta (kg)"
            value={targetWeightKg}
            onChange={setTargetWeightKg}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <CardTitle>Objetivo e rotina</CardTitle>
        <FormField id="profile-goal" label="Objetivo">
          <Select
            id="profile-goal"
            value={goal}
            onChange={(event) => setGoal(event.target.value as typeof goal)}
          >
            <option value="HYPERTROPHY">Hipertrofia</option>
            <option value="STRENGTH">Forca</option>
            <option value="WEIGHT_LOSS">Emagrecimento</option>
            <option value="RECOMPOSITION">Recomposicao corporal</option>
            <option value="CONDITIONING">Condicionamento</option>
            <option value="HEALTH">Saude</option>
          </Select>
        </FormField>

        <FormField id="profile-experience" label="Experiencia">
          <Select
            id="profile-experience"
            value={experience}
            onChange={(event) => setExperience(event.target.value as typeof experience)}
          >
            <option value="BEGINNER">Iniciante</option>
            <option value="INTERMEDIATE">Intermediario</option>
            <option value="ADVANCED">Avancado</option>
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField id="profile-frequency" label="Treinos por semana">
            <Input
              id="profile-frequency"
              type="number"
              min={1}
              max={7}
              value={weeklyFrequency}
              onChange={(event) => {
                if (Number.isFinite(event.currentTarget.valueAsNumber)) {
                  setWeeklyFrequency(event.currentTarget.valueAsNumber);
                }
              }}
              required
            />
          </FormField>
          <FormField id="profile-duration" label="Duracao (min)">
            <Input
              id="profile-duration"
              type="number"
              min={5}
              max={480}
              value={sessionMinutes}
              onChange={(event) => {
                if (Number.isFinite(event.currentTarget.valueAsNumber)) {
                  setSessionMinutes(event.currentTarget.valueAsNumber);
                }
              }}
              required
            />
          </FormField>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Dias disponiveis</legend>
          <div className="grid grid-cols-4 gap-2">
            {WEEKDAYS.map(([value, label]) => (
              <label
                key={value}
                className="tap flex items-center justify-center gap-2 rounded-lg border border-input bg-secondary/40 px-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={availableWeekdays.includes(value)}
                  onChange={() => toggleWeekday(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <FormField id="profile-place" label="Local de treino">
          <Input
            id="profile-place"
            value={trainingPlace}
            onChange={(event) => setTrainingPlace(event.target.value)}
            maxLength={120}
            placeholder="Academia do bairro"
          />
        </FormField>
        <FormField
          id="profile-equipment"
          label="Equipamentos disponiveis"
          hint="Separe por virgula, por exemplo: barra, halteres, polia."
        >
          <Input
            id="profile-equipment"
            value={equipment}
            onChange={(event) => setEquipment(event.target.value)}
            placeholder="barra, halteres, banco"
          />
        </FormField>
        <FormField id="profile-limitations" label="Limitacoes ou cuidados">
          <Textarea
            id="profile-limitations"
            value={limitations}
            onChange={(event) => setLimitations(event.target.value)}
            maxLength={500}
          />
        </FormField>
      </Card>

      <Card className="flex flex-col gap-4">
        <CardTitle>Preferencias do treino</CardTitle>
        <div className="grid grid-cols-2 gap-3">
          <FormField id="profile-rest" label="Descanso padrao (s)">
            <Input
              id="profile-rest"
              type="number"
              min={0}
              max={1800}
              value={restSecondsDefault}
              onChange={(event) => {
                if (Number.isFinite(event.currentTarget.valueAsNumber)) {
                  setRestSecondsDefault(event.currentTarget.valueAsNumber);
                }
              }}
              required
            />
          </FormField>
          <DecimalInput
            id="profile-increment"
            label="Incremento (kg)"
            value={progressionIncrementKg}
            onChange={setProgressionIncrementKg}
            required
          />
        </div>
        <FormField id="profile-timezone" label="Fuso horario">
          <Select
            id="profile-timezone"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value as ProfileTimezone)}
          >
            <option value="America/Sao_Paulo">Brasilia</option>
            <option value="America/Manaus">Manaus</option>
            <option value="America/Belem">Belem</option>
            <option value="America/Fortaleza">Fortaleza</option>
            <option value="America/Recife">Recife</option>
            <option value="America/Bahia">Bahia</option>
            <option value="America/Cuiaba">Cuiaba</option>
            <option value="America/Campo_Grande">Campo Grande</option>
            <option value="America/Porto_Velho">Porto Velho</option>
            <option value="America/Rio_Branco">Rio Branco</option>
            <option value="America/Boa_Vista">Boa Vista</option>
            <option value="America/Noronha">Fernando de Noronha</option>
            <option value="UTC">UTC</option>
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField id="profile-start" label="Inicio do plano">
            <Input
              id="profile-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </FormField>
          <FormField id="profile-deadline" label="Prazo da meta">
            <Input
              id="profile-deadline"
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </FormField>
        </div>
      </Card>

      <Button type="submit" size="lg" disabled={mutation.isPending}>
        {mutation.isPending
          ? 'Salvando...'
          : profile.onboardingCompletedAt
            ? 'Salvar perfil'
            : 'Concluir configuracao'}
      </Button>
    </form>
  );
}

function DecimalInput({
  id,
  label,
  value,
  onChange,
  required = false,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly required?: boolean;
}) {
  return (
    <FormField id={id} label={label}>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(',', '.'))}
        inputMode="decimal"
        pattern="[0-9]+([.,][0-9]{1,2})?"
        required={required}
      />
    </FormField>
  );
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
