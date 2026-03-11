'use client';

import { useCalendarState } from '@/hooks/use-calendar-state';
import { useEvents, useSearchEvents } from '@/hooks/use-events';
import { expandRecurrences } from '@/lib/recurrence';
import { NavBar } from './nav-bar';
import { YearlyView } from './views/yearly-view';
import { MonthlyView } from './views/monthly-view';
import { WeeklyView } from './views/weekly-view';
import { DailyView } from './views/daily-view';
import { EventModal } from './event-modal';
import { useMemo, useState, useCallback } from 'react';
import type { ExpandedEvent } from '@/types/event';

export function CalendarShell() {
  const {
    view,
    setView,
    currentDate,
    setDate,
    start,
    end,
    stepDate,
    goToToday,
    searchQuery,
    setSearchQuery,
  } = useCalendarState();

  const { data: rawEvents = [] } = useEvents(start, end);
  const { data: searchResults } = useSearchEvents(searchQuery);

  const events: ExpandedEvent[] = useMemo(() => {
    const source = searchQuery ? (searchResults ?? []) : rawEvents;
    return expandRecurrences(source, currentDate, view);
  }, [rawEvents, searchResults, searchQuery, currentDate, view]);

  // Event modal state
  const [modalState, setModalState] = useState<{
    open: boolean;
    event?: ExpandedEvent;
    date?: Date;
    hour?: number;
  }>({ open: false });

  const openCreateModal = useCallback((date?: Date, hour?: number) => {
    setModalState({ open: true, date, hour });
  }, []);

  const openEditModal = useCallback((event: ExpandedEvent) => {
    setModalState({ open: true, event });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ open: false });
  }, []);

  const navigate = useCallback(
    (newView: typeof view, date: Date) => {
      setView(newView);
      setDate(date);
    },
    [setView, setDate]
  );

  const viewProps = {
    events,
    currentDate,
    onEventClick: openEditModal,
    onEmptyClick: openCreateModal,
    onNavigate: navigate,
  };

  return (
    <>
      <NavBar
        view={view}
        currentDate={currentDate}
        searchQuery={searchQuery}
        onViewChange={setView}
        onPrev={() => stepDate(-1)}
        onNext={() => stepDate(1)}
        onToday={goToToday}
        onSearchChange={setSearchQuery}
      />

      <main className="mt-[56px] relative overflow-hidden" style={{ height: 'calc(100vh - 56px - 64px)' }}>
        <div className="p-4 h-full overflow-hidden">
          {view === 'yearly' && <YearlyView {...viewProps} />}
          {view === 'monthly' && <MonthlyView {...viewProps} />}
          {view === 'weekly' && <WeeklyView {...viewProps} />}
          {view === 'daily' && <DailyView {...viewProps} />}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full h-16 bg-bg flex items-center justify-end px-6 z-[100]">
        <button
          onClick={() => openCreateModal(currentDate)}
          className="group w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-accent-hover text-white border-none cursor-pointer shadow-[0_4px_16px_rgba(74,144,217,0.35)] flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-[0_6px_24px_rgba(74,144,217,0.5)] active:scale-95"
        >
          <svg className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </footer>

      {modalState.open && (
        <EventModal
          event={modalState.event}
          defaultDate={modalState.date}
          defaultHour={modalState.hour}
          onClose={closeModal}
        />
      )}
    </>
  );
}
