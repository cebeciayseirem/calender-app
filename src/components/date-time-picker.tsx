'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/style.css';

interface DateTimePickerProps {
  startDateTime: string;
  endDateTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

export function DateTimePicker({
  startDateTime,
  endDateTime,
  onStartChange,
  onEndChange,
}: DateTimePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const startDate = startDateTime ? new Date(startDateTime) : null;
  const endDate = endDateTime ? new Date(endDateTime) : null;

  const dateDisplay = startDate
    ? format(startDate, 'EEE, d MMMM yyyy')
    : 'Select date';

  const startHour = startDate ? startDate.getHours() : null;
  const startMin = startDate ? startDate.getMinutes() : null;
  const endHour = endDate ? endDate.getHours() : null;
  const endMin = endDate ? endDate.getMinutes() : null;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  const buildDatetime = (date: Date | null, h: number, m: number): string => {
    if (!date) return '';
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}:00`;
  };

  const handleDateSelect = (day: Date | undefined) => {
    if (!day) return;
    const h = startHour ?? 9;
    const m = startMin ?? 0;
    onStartChange(buildDatetime(day, h, m));
    const eh = endHour ?? h + 1;
    const em = endMin ?? m;
    onEndChange(buildDatetime(day, eh, em));
    setShowDatePicker(false);
  };

  const handleStartTimeChange = (h: number, m: number) => {
    const base = startDate || new Date();
    onStartChange(buildDatetime(base, h, m));
    // Auto-adjust end if needed
    if (endDate) {
      const endTotal = (endHour ?? 0) * 60 + (endMin ?? 0);
      if (endTotal <= h * 60 + m) {
        onEndChange(buildDatetime(endDate, (h + 1) % 24, m));
      }
    }
  };

  const handleEndTimeChange = (h: number, m: number) => {
    const base = endDate || startDate || new Date();
    onEndChange(buildDatetime(base, h, m));
  };

  return (
    <div className="relative flex items-center gap-0 mb-2.5" ref={pickerRef}>
      <svg
        className="w-5 h-5 text-text-muted shrink-0 mr-2.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>

      <div
        className={`cursor-pointer text-[0.95rem] whitespace-nowrap transition-colors hover:text-text ${
          startDate ? 'text-text' : 'text-text-muted'
        }`}
        onClick={() => setShowDatePicker(!showDatePicker)}
      >
        {dateDisplay}
      </div>

      <span className="w-4 shrink-0" />

      <TimeSelect
        hour={startHour}
        minute={startMin}
        placeholder="Start"
        onChange={handleStartTimeChange}
      />

      <span className="text-text-muted text-[0.95rem] shrink-0 mx-1">
        &ndash;
      </span>

      <TimeSelect
        hour={endHour}
        minute={endMin}
        placeholder="End"
        onChange={handleEndTimeChange}
      />

      {showDatePicker && (
        <div className="absolute top-full left-0 z-[1200] bg-surface border border-border rounded-lg p-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <DayPicker
            mode="single"
            selected={startDate ?? undefined}
            onSelect={handleDateSelect}
            weekStartsOn={1}
            classNames={{
              root: 'text-text text-sm',
              day: 'rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-[#2a2a4a]',
              selected: 'bg-accent text-white font-bold',
              today: 'border border-accent',
              chevron: 'text-text fill-text',
            }}
          />
        </div>
      )}
    </div>
  );
}

function TimeSelect({
  hour,
  minute,
  placeholder,
  onChange,
}: {
  hour: number | null;
  minute: number | null;
  placeholder: string;
  onChange: (h: number, m: number) => void;
}) {
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="relative group">
      <select
        value={hour != null && minute != null ? `${hour}:${minute}` : ''}
        onChange={(e) => {
          const [h, m] = e.target.value.split(':').map(Number);
          onChange(h, m);
        }}
        className={`appearance-none bg-transparent border-none cursor-pointer text-[0.95rem] pr-1 focus:outline-none ${
          hour != null ? 'text-text' : 'text-text-muted'
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {Array.from({ length: 24 * 12 }, (_, i) => {
          const h = Math.floor(i / 12);
          const m = (i % 12) * 5;
          return (
            <option key={i} value={`${h}:${m}`}>
              {pad(h)}:{pad(m)}
            </option>
          );
        })}
      </select>
    </div>
  );
}
