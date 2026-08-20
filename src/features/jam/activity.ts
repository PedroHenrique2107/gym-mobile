import type { WorkoutJamEvent, WorkoutJamParticipant } from './api';

export function participantName(
  profileId: string | null | undefined,
  participants: readonly WorkoutJamParticipant[],
): string {
  if (!profileId) return 'Sistema';
  const participant = participants.find((item) => item.profileId === profileId);
  return participant?.name?.trim() || `Participante ${profileId.slice(0, 6)}`;
}

/**
 * Sempre explicita ator e dono do treino. Assim uma cor, avatar ou posição não
 * precisa carregar sozinha uma informação de autoria que afeta o histórico.
 */
export function describeWorkoutJamEvent(
  event: WorkoutJamEvent,
  participants: readonly WorkoutJamParticipant[],
): string {
  const actor = participantName(event.actorId, participants);
  const owner = participantName(event.subjectId, participants);

  switch (event.type) {
    case 'JAM_CREATED':
      return `${actor} iniciou a Jam.`;
    case 'INVITE_ACCEPTED':
      return `${actor} aceitou o convite.`;
    case 'INVITE_DECLINED':
      return `${actor} recusou o convite.`;
    case 'JAM_ACTIVATED':
      return 'Os dois treinos foram vinculados.';
    case 'SET_UPSERTED':
      return actor === owner
        ? `${actor} registrou uma série no próprio treino.`
        : `${actor} registrou uma série para ${owner}.`;
    case 'SET_DELETED':
      return actor === owner
        ? `${actor} removeu uma série do próprio treino.`
        : `${actor} removeu uma série de ${owner}.`;
    case 'EXERCISE_SETS_REPLACED':
      return actor === owner
        ? `${actor} atualizou as séries do próprio exercício.`
        : `${actor} atualizou as séries de ${owner}.`;
    case 'SESSION_COMPLETED':
      return `${owner} concluiu o próprio treino.`;
    case 'SESSION_ABANDONED':
      return `${owner} encerrou o próprio treino sem concluir.`;
    case 'PARTICIPANT_LEFT':
      return `${actor} saiu da Jam.`;
    case 'JAM_ENDED':
      return 'A Jam foi encerrada. Os treinos individuais foram preservados.';
  }
}
