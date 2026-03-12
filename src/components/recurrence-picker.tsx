'use client';

import { useState } from 'react';
import type { RecurrenceConfig, RecurrenceType } from '@/types/event';

interface RecurrencePickerProps {
  recurrence: RecurrenceConfig | null;
  startDateTime: string;
  onChange: (rec: RecurrenceConfig | null) => void;
}

const PRESET_LABELS: Record<string, string> = {
  '': 'Does not repeat',
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
  yearly: 'Every year',
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function RecurrencePicker({
  recurrence,
  startDateTime,
  onChange,
}: RecurrencePickerProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  // Local state for custom modal
  const [recType, setRecType] = useState<RecurrenceType>(
    recurrence?.type ?? 'weekly'
  );
  const [interval, setInterval] = useState(recurrence?.interval ?? 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    recurrence?.daysOfWeek ?? []
  );
  const [endType, setEndType] = useState<'never' | 'on' | 'after'>(
    recurrence?.endType ?? 'never'
  );
  const [endDate, setEndDate] = useState(recurrence?.endDate ?? '');
  const [occurrenceCount, setOccurrenceCount] = useState(
    recurrence?.occurrenceCount ?? 1
  );
  const [monthlyMode, setMonthlyMode] = useState(
    recurrence?.monthlyMode ?? 'dayOfMonth'
  );

  const getLabel = (): string => {
    if (!recurrence) return 'Does not repeat';

    if (recurrence.type === 'weekly' && recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
      const days = recurrence.daysOfWeek
        .slice()
        .sort((a, b) => a - b)
        .map((d) => DAY_NAMES[d].slice(0, 3))
        .join(', ');
      if (recurrence.interval === 1) return `Weekly \u00b7 ${days}`;
      return `Every ${recurrence.interval} weeks \u00b7 ${days}`;
    }

    if (recurrence.interval === 1 && PRESET_LABELS[recurrence.type]) {
      return PRESET_LABELS[recurrence.type];
    }
    return `Every ${recurrence.interval} ${recurrence.type.replace('ly', '')}s`;
  };

  const handlePresetSelect = (type: string) => {
    if (!type) {
      onChange(null);
    } else {
      onChange({
        type: type as RecurrenceType,
        interval: 1,
        endType: 'never',
      });
    }
    setShowPresets(false);
  };

  const handleCustomSave = () => {
    const rec: RecurrenceConfig = {
      type: recType,
      interval,
      endType,
      endDate: endType === 'on' ? endDate || null : null,
      occurrenceCount: endType === 'after' ? occurrenceCount : null,
    };

    if (recType === 'weekly' && daysOfWeek.length > 0) {
      rec.daysOfWeek = daysOfWeek;
    }

    if (recType === 'monthly') {
      rec.monthlyMode = monthlyMode;
      if (monthlyMode === 'nthWeekday' && startDateTime) {
        const d = new Date(startDateTime);
        rec.nthWeekday = {
          weekday: d.getDay(),
          nth: Math.floor((d.getDate() - 1) / 7),
        };
      }
    }

    onChange(rec);
    setShowCustom(false);
  };

  const getMonthlyLabel = (): string => {
    if (!startDateTime) return 'Monthly on day 1';
    const d = new Date(startDateTime);
    if (monthlyMode === 'nthWeekday') {
      const nth = Math.floor((d.getDate() - 1) / 7);
      return `Monthly on the ${ORDINALS[nth]} ${DAY_NAMES[d.getDay()]}`;
    }
    return `Monthly on day ${d.getDate()}`;
  };

  return (
    <>
      {/* Trigger row */}
      <div
        className="flex items-center gap-2.5 mb-2.5 cursor-pointer group"
        onClick={() => setShowPresets(true)}
      >
        <svg
          className="w-5 h-5 text-text-muted shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M23 4v6h-6" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        <span className="text-text-muted text-[0.95rem] group-hover:text-text transition-colors">
          {getLabel()}
        </span>
      </div>

      {/* Preset modal */}
      {showPresets && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={(e) =>
            e.target === e.currentTarget && setShowPresets(false)
          }
        >
          <div className="bg-gradient-to-br from-surface to-bg border border-white/[0.06] rounded-2xl w-[340px] p-4 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
            {['', 'daily', 'weekly', 'monthly', 'yearly'].map((type) => (
              <div
                key={type}
                className="py-3.5 px-4 cursor-pointer text-[0.95rem] text-text border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.06] transition-colors"
                onClick={() => handlePresetSelect(type)}
              >
                {PRESET_LABELS[type]}
              </div>
            ))}
            <div
              className="py-3.5 px-4 cursor-pointer text-[0.95rem] text-accent hover:bg-white/[0.06] transition-colors"
              onClick={() => {
                setShowPresets(false);
                if (!recType) setRecType('weekly');
                setShowCustom(true);
              }}
            >
              Custom...
            </div>
          </div>
        </div>
      )}

      {/* Custom modal */}
      {showCustom && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={(e) =>
            e.target === e.currentTarget && setShowCustom(false)
          }
        >
          <div className="bg-gradient-to-br from-surface to-bg border border-white/[0.06] rounded-2xl w-[340px] p-5 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
            {/* Repeats every */}
            <div className="pb-3.5 border-b border-white/[0.06]">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2.5">
                Repeats every
              </label>
              <div className="flex gap-2.5">
                <input
                  type="number"
                  min="1"
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                  className="w-[60px] text-center px-2.5 py-2.5 border border-white/[0.08] rounded-lg bg-white/[0.04] text-text text-sm"
                />
                <select
                  value={recType}
                  onChange={(e) => setRecType(e.target.value as RecurrenceType)}
                  className="w-[120px] px-3 py-2.5 border border-white/[0.08] rounded-lg bg-surface text-text text-sm [&>option]:bg-surface [&>option]:text-text"
                >
                  <option value="daily">day</option>
                  <option value="weekly">week</option>
                  <option value="monthly">month</option>
                  <option value="yearly">year</option>
                </select>
              </div>
            </div>

            {/* Monthly mode */}
            {recType === 'monthly' && (
              <div className="py-3.5 border-b border-white/[0.06]">
                <select
                  value={monthlyMode}
                  onChange={(e) =>
                    setMonthlyMode(e.target.value as 'dayOfMonth' | 'nthWeekday')
                  }
                  className="w-full px-3 py-2.5 border border-white/[0.08] rounded-lg bg-surface text-text text-sm [&>option]:bg-surface [&>option]:text-text"
                >
                  <option value="dayOfMonth">
                    {startDateTime
                      ? `Monthly on day ${new Date(startDateTime).getDate()}`
                      : 'Monthly on day 1'}
                  </option>
                  <option value="nthWeekday">{getMonthlyLabel()}</option>
                </select>
              </div>
            )}

            {/* Weekly days */}
            {recType === 'weekly' && (
              <div className="py-3.5 border-b border-white/[0.06]">
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2.5">
                  Repeats on
                </label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                    <label
                      key={day}
                      className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer text-xs font-medium transition-all ${
                        daysOfWeek.includes(day)
                          ? 'bg-accent/30 border-accent text-white'
                          : 'border-white/15 text-text-muted hover:border-accent/50 hover:text-text'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={daysOfWeek.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDaysOfWeek([...daysOfWeek, day]);
                          } else {
                            setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
                          }
                        }}
                      />
                      {DAY_LABELS[day]}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Ends */}
            <div className="py-3.5">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2.5">
                Ends
              </label>

              <label className="flex items-center gap-3.5 py-3 cursor-pointer text-[0.95rem] text-text border-b border-white/[0.04]">
                <input
                  type="radio"
                  name="rec-end"
                  checked={endType === 'never'}
                  onChange={() => setEndType('never')}
                  className="hidden"
                />
                <span
                  className={`w-5 h-5 rounded-full border-2 shrink-0 relative ${
                    endType === 'never' ? 'border-accent' : 'border-white/20'
                  }`}
                >
                  {endType === 'never' && (
                    <span className="absolute top-[3px] left-[3px] w-2.5 h-2.5 rounded-full bg-accent" />
                  )}
                </span>
                Never
              </label>

              <label className="flex items-center gap-3.5 py-3 cursor-pointer text-[0.95rem] text-text border-b border-white/[0.04] flex-wrap">
                <input
                  type="radio"
                  name="rec-end"
                  checked={endType === 'on'}
                  onChange={() => setEndType('on')}
                  className="hidden"
                />
                <span
                  className={`w-5 h-5 rounded-full border-2 shrink-0 relative ${
                    endType === 'on' ? 'border-accent' : 'border-white/20'
                  }`}
                >
                  {endType === 'on' && (
                    <span className="absolute top-[3px] left-[3px] w-2.5 h-2.5 rounded-full bg-accent" />
                  )}
                </span>
                On
                <input
                  type="date"
                  value={endDate || ''}
                  onChange={(e) => setEndDate(e.target.value)}
                  onFocus={() => setEndType('on')}
                  className="ml-auto px-2.5 py-1.5 text-[0.85rem] border border-white/[0.08] rounded-lg bg-white/[0.04] text-text"
                />
              </label>

              <label className="flex items-center gap-3.5 py-3 cursor-pointer text-[0.95rem] text-text flex-wrap">
                <input
                  type="radio"
                  name="rec-end"
                  checked={endType === 'after'}
                  onChange={() => setEndType('after')}
                  className="hidden"
                />
                <span
                  className={`w-5 h-5 rounded-full border-2 shrink-0 relative ${
                    endType === 'after' ? 'border-accent' : 'border-white/20'
                  }`}
                >
                  {endType === 'after' && (
                    <span className="absolute top-[3px] left-[3px] w-2.5 h-2.5 rounded-full bg-accent" />
                  )}
                </span>
                After
                <input
                  type="number"
                  min="1"
                  value={occurrenceCount}
                  onChange={(e) =>
                    setOccurrenceCount(parseInt(e.target.value) || 1)
                  }
                  onFocus={() => setEndType('after')}
                  className="w-[60px] text-center px-2.5 py-1.5 text-[0.85rem] border border-white/[0.08] rounded-lg bg-white/[0.04] text-text"
                />
                <span>occurrence</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 justify-end mt-3.5">
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className="bg-transparent text-text-muted border border-white/[0.08] px-5 py-2.5 rounded-lg cursor-pointer text-sm hover:border-white/20 hover:text-text transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCustomSave}
                className="bg-gradient-to-br from-accent to-accent-hover text-white border-none px-6 py-2.5 rounded-lg cursor-pointer text-sm font-medium hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(74,144,217,0.3)] transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
