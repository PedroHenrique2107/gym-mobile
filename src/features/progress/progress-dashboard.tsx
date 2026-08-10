'use client';

import { MeasurementsPanel } from './measurements-panel';
import { PhotosPanel } from './photos-panel';
import { ProgressOverview } from './progress-overview';

export function ProgressDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <ProgressOverview />
      <MeasurementsPanel />
      <PhotosPanel />
    </div>
  );
}
