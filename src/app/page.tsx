import { Suspense } from 'react';
import { CalendarShell } from '@/components/calendar-shell';

export default function Home() {
  return (
    <Suspense fallback={<div className="mt-[60px] p-4 text-text-muted">Loading...</div>}>
      <CalendarShell />
    </Suspense>
  );
}
