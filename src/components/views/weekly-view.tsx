'use client';

import { getMonday, isSameDay, formatTime, toLocalISO } from '@/lib/date-utils';
import { calculateOverlapLayout } from '@/lib/overlap';
import { startOfDay } from 'date-fns';
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
      <div className="flex">
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const dayEvents = events.filter((e) =>
            isSameDay(new Date(e.start), day)
          );
          const layout = calculateOverlapLayout(dayEvents);
          const dayStart = startOfDay(day).getTime();

          return (
            <DayColumn
              key={i}
              dayIndex={i}
              day={day}
              isToday={isToday}
              layout={layout}
              dayStart={dayStart}
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
  layout,
  dayStart,
  onEventClick,
  onEmptyClick,
  onNavigate,
}: {
  dayIndex: number;
  day: Date;
  isToday: boolean;
  layout: ReturnType<typeof calculateOverlapLayout>;
  dayStart: number;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
  onNavigate: (view: CalendarView, date: Date) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayIndex });

  return (
    <div className="flex-1 relative border-r border-border last:border-r-0">
      <div
        className={`text-center p-2 font-bold cursor-pointer ${
          isToday ? 'bg-accent text-white' : 'bg-surface'
        }`}
        onClick={() => onNavigate('daily', day)}
      >
        {day.toLocaleDateString('default', {
          weekday: 'short',
          day: 'numeric',
        })}
      </div>

      <div
        ref={setNodeRef}
        className={`relative h-[calc(100vh-130px)] transition-colors ${
          isOver ? 'bg-accent/10' : ''
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            const hour = Math.floor(
              (e.nativeEvent.offsetY / e.currentTarget.clientHeight) * 24
            );
            onEmptyClick(day, hour);
          }
        }}
      >
        {layout.map(({ event, column, totalColumns }, idx) => (
          <DraggableEvent
            key={idx}
            event={event}
            column={column}
            totalColumns={totalColumns}
            dayStart={dayStart}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableEvent({
  event,
  column,
  totalColumns,
  dayStart,
  onEventClick,
}: {
  event: ExpandedEvent;
  column: number;
  totalColumns: number;
  dayStart: number;
  onEventClick: (event: ExpandedEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: event.id + event.start });

  const eStart = new Date(event.start).getTime();
  const eEnd = new Date(event.end).getTime();
  const topPercent = ((eStart - dayStart) / MS_PER_DAY) * 100;
  const heightPercent = ((eEnd - eStart) / MS_PER_DAY) * 100;
  const widthPercent = 100 / totalColumns;
  const leftPercent = column * widthPercent;

  const style: React.CSSProperties = {
    top: `${topPercent}%`,
    height: `${heightPercent}%`,
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
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
      className="absolute rounded-md px-2 py-1 text-white text-[13px] overflow-hidden cursor-grab shadow-sm hover:shadow-md transition-shadow"
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
    >
      <span className="font-semibold block">{event.title}</span>
      <span className="text-[11px] opacity-80">
        {formatTime(new Date(event.start))}
      </span>
    </div>
  );
}
