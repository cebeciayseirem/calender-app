'use client';

import { DailyQuote } from './daily-quote';
import { HabitTracker } from './habit-tracker';
import { WeatherWidget } from './weather-widget';

export function DailySidebar() {
  return (
    <aside className="w-[350px] shrink-0 bg-surface rounded-2xl flex flex-col overflow-hidden max-md:w-full">
      <DailyQuote />
      <div className="w-full h-px bg-border" />
      <div className="flex-1 overflow-y-auto">
        <HabitTracker />
      </div>
      <div className="w-full h-px bg-border" />
      <div className="mt-auto">
        <WeatherWidget />
      </div>
    </aside>
  );
}
