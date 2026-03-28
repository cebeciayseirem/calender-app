'use client';

import { useState, useEffect, useRef } from 'react';
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/use-events';
import type { ExpandedEvent, EventFormData, RecurrenceConfig } from '@/types/event';
import { CATEGORY_COLORS } from '@/types/event';
import { DateTimePicker } from './date-time-picker';
import { RecurrencePicker } from './recurrence-picker';

interface EventModalProps {
  event?: ExpandedEvent;
  defaultDate?: Date;
  defaultHour?: number;
  onClose: () => void;
}

export function EventModal({
  event,
  defaultDate,
  defaultHour,
  onClose,
}: EventModalProps) {
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const isEditing = !!event;
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Form state
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [category, setCategory] = useState(event?.category ?? '');
  const [color, setColor] = useState(event?.color ?? '#74d5ff');
  const [startDateTime, setStartDateTime] = useState(() => {
    if (event) return event.start;
    if (defaultDate) {
      const d = new Date(defaultDate);
      if (defaultHour != null) d.setHours(defaultHour, 0, 0);
      return toLocalDatetime(d);
    }
    return '';
  });
  const [endDateTime, setEndDateTime] = useState(() => {
    if (event) return event.end;
    if (defaultDate) {
      const d = new Date(defaultDate);
      if (defaultHour != null) d.setHours(defaultHour + 1, 0, 0);
      else d.setHours(d.getHours() + 1, 0, 0);
      return toLocalDatetime(d);
    }
    return '';
  });
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | null>(
    event?.recurrence ?? null
  );

  // Track focused field for icon highlighting
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 50);
  }, []);

  // Auto-grow textarea
  useEffect(() => {
    if (descRef.current) {
      descRef.current.style.height = 'auto';
      descRef.current.style.height = descRef.current.scrollHeight + 'px';
    }
  }, [description]);

  const setTag = (tag: string) => {
    if (category === tag) {
      setCategory('');
      setColor('#74d5ff');
    } else {
      setCategory(tag);
      setColor(CATEGORY_COLORS[tag] || '#74d5ff');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDateTime || !endDateTime) {
      alert('Please select both start and end date/time.');
      return;
    }
    if (endDateTime <= startDateTime) {
      alert('End date/time must be after start date/time.');
      return;
    }

    const data: EventFormData = {
      title,
      start: startDateTime,
      end: endDateTime,
      description: description || undefined,
      location: location || undefined,
      color,
      category: category || undefined,
      recurrence,
    };

    if (isEditing && event) {
      if (event.isOccurrence) {
        const applyAll = confirm(
          'Apply to all future events? OK = All, Cancel = This only'
        );
        if (!applyAll) {
          data.recurrence = null;
          await createMutation.mutateAsync(data);
        } else {
          await updateMutation.mutateAsync({ id: event.id, data });
        }
      } else {
        await updateMutation.mutateAsync({ id: event.id, data });
      }
    } else {
      await createMutation.mutateAsync(data);
    }

    onClose();
  };

  const handleDelete = async () => {
    if (event && confirm('Delete this event?')) {
      await deleteMutation.mutateAsync(event.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[1000] animate-[modalFadeIn_0.2s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gradient-to-br from-surface to-bg border border-white/[0.06] rounded-2xl w-[480px] max-h-[85vh] overflow-y-auto shadow-[0_24px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04),0_0_80px_rgba(63,145,66,0.06)] animate-[modalSlideIn_0.25s_ease-out]">
        {/* Color accent bar */}
        <div
          className="h-1.5 rounded-t-2xl transition-colors duration-300"
          style={{ backgroundColor: color }}
        />

        <form onSubmit={handleSubmit} className="p-6">
          {/* Title */}
          <div className="flex items-stretch mb-1">
            <div className="w-[30px] shrink-0" />
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
              className="flex-1 text-[1.35rem] font-semibold py-3 bg-transparent border-b-2 border-white/[0.08] rounded-none focus:outline-none focus:border-accent transition-colors duration-200 placeholder:text-[#556677]"
            />
          </div>

          {/* Category tags */}
          <div className="flex gap-2 mb-5 ml-[30px] mt-3">
            {Object.entries(CATEGORY_COLORS).map(([tag, tagColor]) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTag(tag)}
                className={`flex-1 py-1.5 rounded-lg border-[1.5px] text-sm font-medium cursor-pointer transition-all duration-200 ${
                  category === tag
                    ? 'text-white shadow-[0_0_12px_rgba(63,145,66,0.25)] scale-[1.02]'
                    : 'border-white/10 bg-transparent text-text-muted hover:border-white/25 hover:text-text hover:scale-[1.02]'
                }`}
                style={
                  category === tag
                    ? { backgroundColor: tagColor, borderColor: tagColor, boxShadow: `0 0 14px ${tagColor}33` }
                    : undefined
                }
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Date/Time picker */}
          <DateTimePicker
            startDateTime={startDateTime}
            endDateTime={endDateTime}
            onStartChange={setStartDateTime}
            onEndChange={setEndDateTime}
          />

          {/* Description */}
          <div className="flex items-start gap-2.5 mb-4 group">
            <svg
              className={`w-5 h-5 shrink-0 mt-2.5 transition-colors duration-200 ${
                focusedField === 'desc' ? 'text-accent' : 'text-text-muted group-hover:text-text/60'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="15" y2="18" />
            </svg>
            <textarea
              ref={descRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => setFocusedField('desc')}
              onBlur={() => setFocusedField(null)}
              placeholder="Add description"
              rows={1}
              className="flex-1 bg-transparent py-2.5 border-b-[1.5px] border-white/[0.08] rounded-none text-[0.95rem] leading-normal font-[inherit] focus:outline-none focus:border-accent transition-colors duration-200 placeholder:text-[#556677] resize-none overflow-hidden"
            />
          </div>

          {/* Location */}
          <div className="flex items-center gap-2.5 mb-4 group">
            <svg
              className={`w-5 h-5 shrink-0 transition-colors duration-200 ${
                focusedField === 'loc' ? 'text-accent' : 'text-text-muted group-hover:text-text/60'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => setFocusedField('loc')}
              onBlur={() => setFocusedField(null)}
              placeholder="Add location"
              className="flex-1 bg-transparent py-2.5 border-b-[1.5px] border-white/[0.08] rounded-none text-[0.95rem] focus:outline-none focus:border-accent transition-colors duration-200 placeholder:text-[#556677]"
            />
          </div>

          {/* Recurrence */}
          <RecurrencePicker
            recurrence={recurrence}
            startDateTime={startDateTime}
            onChange={setRecurrence}
          />

          {/* Actions */}
          <div className="flex gap-3 mt-5 justify-end">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="mr-auto bg-transparent text-[#e05555] border-[1.5px] border-[rgba(224,85,85,0.25)] px-5 py-2.5 rounded-xl cursor-pointer text-sm font-medium hover:bg-[rgba(224,85,85,0.1)] hover:border-[#e05555] transition-all duration-200"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent text-text-muted border-[1.5px] border-white/[0.08] px-5 py-2.5 rounded-xl cursor-pointer text-sm font-medium hover:border-white/20 hover:text-text transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-br from-accent to-accent-hover text-white border-none px-8 py-2.5 rounded-xl cursor-pointer text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(63,145,66,0.35)] active:translate-y-0 transition-all duration-200"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function toLocalDatetime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}
