'use client';

import { DailyQuote } from './daily-quote';
import { HabitTracker } from './habit-tracker';
import { WeatherWidget } from './weather-widget';

interface DailySidebarProps {
  date: string; // 'yyyy-MM-dd'
}

export function DailySidebar({ date }: DailySidebarProps) {
  return (
    <aside className="w-[350px] shrink-0 flex flex-col overflow-hidden max-md:w-full">
      <div className="flex-1 bg-surface rounded-2xl overflow-y-auto flex flex-col">
        <DailyQuote />
        <div className="w-full h-px bg-border" />
        <div className="flex-1">
          <HabitTracker date={date} />
        </div>
        <div className="w-full h-px bg-border" />
        <WeatherWidget />
      </div>
    </aside>
  );
}
