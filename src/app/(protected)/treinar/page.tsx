import type { Metadata } from 'next';

import { PageHeader } from '@/components/navigation/page-header';
import { ExerciseLibrary } from '@/features/exercises/exercise-library';
import { TrainingSession } from '@/features/sessions/training-session';
import { WorkoutManager } from '@/features/workouts/workout-manager';

export const metadata: Metadata = { title: 'Treinar' };

export default function TreinarPage() {
  return (
    <>
      <PageHeader title="Treinar" subtitle="Selecione uma ficha para comecar." />
      <div className="flex flex-col gap-8">
        <TrainingSession />
        <WorkoutManager />
        <div className="border-t border-border pt-8">
          <ExerciseLibrary />
        </div>
      </div>
    </>
  );
}
