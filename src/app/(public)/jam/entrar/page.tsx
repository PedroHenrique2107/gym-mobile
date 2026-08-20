import type { Metadata } from 'next';

import { WorkoutJamInvite } from '@/features/jam/workout-jam-invite';

export const metadata: Metadata = {
  title: 'Participar de Workout Jam',
  robots: { index: false, follow: false },
};

export default function WorkoutJamInvitePage() {
  return <WorkoutJamInvite />;
}
