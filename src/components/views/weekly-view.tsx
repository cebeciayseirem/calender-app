'use client';

import { getMonday, isSameDay, formatTime, toLocalISO } from '@/lib/date-utils';
import type { CalendarView, ExpandedEvent } from '@/types/event';
import { useUpdateEvent } from '@/hooks/use-events';
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

interface WeeklyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
  onNavigate: (view: CalendarView, date: Date) => void;
}

export function WeeklyView({
  events,
  currentDate,
  onEventClick,
  onEmptyClick,
  onNavigate,
}: WeeklyViewProps) {
  const monday = getMonday(currentDate);
  const today = new Date();
  const updateEvent = useUpdateEvent();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + i);
    return day;
  });

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;

    const event = events.find(
      (ev) => ev.id + ev.start === active.id
    );
    if (!event) return;

    const dropDayIndex = Number(over.id);
    const dropDay = days[dropDayIndex];
    if (!dropDay) return;

    const oldStart = new Date(event.start);
    const oldEnd = new Date(event.end);
    const duration = oldEnd.getTime() - oldStart.getTime();

    const newStart = new Date(dropDay);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);

    if (newStart.getTime() === oldStart.getTime()) return;

    updateEvent.mutate({
      id: event.id,
      data: {
        title: event.title,
        start: toLocalISO(newStart),
        end: toLocalISO(newEnd),
        description: event.description || undefined,
        location: event.location || undefined,
        color: event.color,
        category: event.category || undefined,
        recurrence: event.recurrence,
      },
    });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-full">
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const dayEvents = events
            .filter((e) => isSameDay(new Date(e.start), day))
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

          return (
            <DayColumn
              key={i}
              dayIndex={i}
              day={day}
              isToday={isToday}
              dayEvents={dayEvents}
              onEventClick={onEventClick}
              onEmptyClick={onEmptyClick}
              onNavigate={onNavigate}
            />
          );
        })}
      </div>
    </DndContext>
  );
}

function DayColumn({
  dayIndex,
  day,
  isToday,
  dayEvents,
  onEventClick,
  onEmptyClick,
  onNavigate,
}: {
  dayIndex: number;
  day: Date;
  isToday: boolean;
  dayEvents: ExpandedEvent[];
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
  onNavigate: (view: CalendarView, date: Date) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayIndex });

  return (
    <div className="flex-1 relative border-r border-border last:border-r-0 flex flex-col">
      {isToday && (<>
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-accent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-white/[0.02] via-50% to-transparent pointer-events-none" />
      </>)}
      <div
        className="text-center py-1.5 px-2 cursor-pointer transition-colors hover:bg-white/[0.03]"
        onClick={() => onNavigate('daily', day)}
      >
        <span className="block text-[10px] uppercase tracking-wider text-text-muted font-medium">
          {day.toLocaleDateString('en-US', { weekday: 'short' })}
        </span>
        <span className={`block text-base font-semibold ${
          isToday ? 'text-accent' : 'text-text'
        }`}>
          {day.getDate()}
        </span>
      </div>

      <div className="mx-2 h-px bg-white/[0.06]" />

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-2 flex flex-col gap-2 transition-colors ${
          isOver ? 'bg-accent/10' : ''
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onEmptyClick(day, 9);
          }
        }}
      >
        {dayEvents.map((event, idx) => (
          <DraggableEvent
            key={idx}
            event={event}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableEvent({
  event,
  onEventClick,
}: {
  event: ExpandedEvent;
  onEventClick: (event: ExpandedEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: event.id + event.start });

  const style: React.CSSProperties = {
    backgroundColor: event.color || '#4A90D9',
    opacity: isDragging ? 0.5 : 1,
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="rounded px-2.5 py-2 text-[13px] cursor-grab shadow-[2px_2px_4px_rgba(0,0,0,0.3)] hover:shadow-[2px_3px_6px_rgba(0,0,0,0.45)] hover:brightness-110 transition-all"
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
    >
      <span className="font-semibold block text-white leading-snug">{event.title}</span>
      <span className="text-[11px] text-white/75">
        {formatTime(new Date(event.start))} – {formatTime(new Date(event.end))}
      </span>
    </div>
  );
}
