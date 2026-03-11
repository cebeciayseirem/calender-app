'use client';

import { CalendarView } from '@/types/event';

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
    case 'daily':
      return date.toLocaleDateString(undefined, {
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
    <nav className="fixed top-0 left-0 w-full h-[50px] bg-surface border-b border-border flex justify-between items-center px-4 z-[500]">
      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="px-3 py-1.5 border border-border rounded bg-[#2a2a4a] text-text text-sm hover:bg-[#3a3a5a] cursor-pointer"
        >
          Today
        </button>
        <button
          onClick={onPrev}
          className="px-3 py-1.5 border border-border rounded bg-[#2a2a4a] text-text text-sm hover:bg-[#3a3a5a] cursor-pointer"
        >
          &larr;
        </button>
        <button
          onClick={onNext}
          className="px-3 py-1.5 border border-border rounded bg-[#2a2a4a] text-text text-sm hover:bg-[#3a3a5a] cursor-pointer"
        >
          &rarr;
        </button>
        <span className="font-bold ml-3">{getNavTitle(view, currentDate)}</span>
      </div>

      <div className="flex items-center gap-2">
        {(['yearly', 'monthly', 'weekly', 'daily'] as const).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`px-3 py-1.5 border rounded text-sm cursor-pointer transition-colors ${
              view === v
                ? 'bg-accent text-white border-accent'
                : 'border-border bg-[#2a2a4a] text-text hover:bg-[#3a3a5a]'
            }`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="px-2 py-1.5 rounded border border-border bg-surface text-text text-sm focus:outline-none focus:border-accent"
        />
      </div>
    </nav>
  );
}
