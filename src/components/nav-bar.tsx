'use client';

import { CalendarView } from '@/types/event';
import { getWeekNumber } from '@/lib/date-utils';

interface NavBarProps {
  view: CalendarView;
  currentDate: Date;
  searchQuery: string;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSearchChange: (query: string) => void;
}

const VIEW_LABELS: Record<CalendarView, string> = {
  yearly: 'Year',
  monthly: 'Month',
  weekly: 'Week',
  daily: 'Day',
};

function getNavTitle(view: CalendarView, date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  switch (view) {
    case 'yearly':
      return String(date.getFullYear());
    case 'monthly':
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    case 'weekly':
      return `Week ${getWeekNumber(date)}, ${date.getFullYear()}`;
    case 'daily':
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  }
}

export function NavBar({
  view,
  currentDate,
  searchQuery,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onSearchChange,
}: NavBarProps) {
  return (
    <nav className={`fixed top-0 left-0 w-full h-[56px] backdrop-blur-md flex items-center px-5 z-[500] ${view === 'daily' ? 'bg-bg/80 border-b border-transparent' : 'bg-surface/80 border-b border-white/[0.06]'}`}>
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onToday}
          className="px-3.5 py-1.5 rounded-lg bg-accent/15 text-accent text-sm font-medium hover:bg-accent/25 active:bg-accent/35 transition-colors cursor-pointer"
        >
          Today
        </button>
        <button
          onClick={onPrev}
          className="px-2 py-1.5 text-text-muted hover:text-text text-sm transition-colors cursor-pointer rounded-lg hover:bg-white/[0.06]"
        >
          &#8249;
        </button>
        <span className="font-semibold text-[15px] tracking-tight min-w-[140px] text-center">{getNavTitle(view, currentDate)}</span>
        <button
          onClick={onNext}
          className="px-2 py-1.5 text-text-muted hover:text-text text-sm transition-colors cursor-pointer rounded-lg hover:bg-white/[0.06]"
        >
          &#8250;
        </button>
      </div>

      <div className="flex items-center justify-center flex-1">
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1">
          {(['yearly', 'monthly', 'weekly', 'daily'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-5 py-2 rounded-md text-sm font-medium cursor-pointer transition-all ${
                view === v
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-muted hover:text-text hover:bg-white/[0.06]'
              }`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end flex-1">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events..."
            className="pl-8 pr-3 py-1.5 w-48 rounded-lg bg-white/[0.04] border border-white/[0.06] text-text text-sm placeholder:text-text-muted/60 focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all"
          />
        </div>
      </div>
    </nav>
  );
}
