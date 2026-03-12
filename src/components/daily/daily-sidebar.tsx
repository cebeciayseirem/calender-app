'use client';

import { DailyQuote } from './daily-quote';
import { HabitTracker } from './habit-tracker';
import { WeatherWidget } from './weather-widget';

interface DailySidebarProps {
  date: string; // 'yyyy-MM-dd'
}

export function DailySidebar({ date }: DailySidebarProps) {
  return (
    <aside className="w-[350px] shrink-0 bg-surface rounded-2xl flex flex-col overflow-hidden max-md:w-full">
      <DailyQuote />
      <div className="w-full h-px bg-border" />
      <div className="flex-1 overflow-y-auto">
        <HabitTracker date={date} />
      </div>
      <div className="w-full h-px bg-border" />
      <div className="mt-auto">
        <WeatherWidget />
      </div>
    </aside>
  );
}
