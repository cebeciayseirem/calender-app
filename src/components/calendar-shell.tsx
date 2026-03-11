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

      <main className="mt-[60px] p-4 relative min-h-[calc(100vh-60px)]">
        {view === 'yearly' && <YearlyView {...viewProps} />}
        {view === 'monthly' && <MonthlyView {...viewProps} />}
        {view === 'weekly' && <WeeklyView {...viewProps} />}
        {view === 'daily' && <DailyView {...viewProps} />}

        <button
          onClick={() => openCreateModal(currentDate)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-accent text-white text-[28px] border-none cursor-pointer shadow-[0_4px_12px_rgba(74,144,217,0.4)] flex items-center justify-center transition-all hover:bg-accent-hover hover:scale-110 z-[100] leading-none"
        >
          +
        </button>
      </main>

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
