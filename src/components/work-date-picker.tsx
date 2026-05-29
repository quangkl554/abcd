'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

type WorkDatePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function WorkDatePicker({ label, value, onChange }: WorkDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => fromDateKey(value));
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = fromDateKey(value);

  useEffect(() => {
    if (open) setViewDate(fromDateKey(value));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const days = useMemo(() => calendarDays(viewDate), [viewDate]);

  function moveSelected(daysToMove: number) {
    onChange(toDateKey(addDays(selectedDate, daysToMove)));
  }

  function moveMonth(months: number) {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + months, 1));
  }

  return (
    <div className="date-control">
      <button className="date-step" type="button" title="Ngày trước" onClick={() => moveSelected(-1)}><ChevronLeft size={17} /></button>
      <div className="date-picker" ref={rootRef}>
        <button className="date-display" type="button" onClick={() => setOpen(current => !current)} aria-expanded={open}>
          <span><CalendarDays size={14} /> {label}</span>
          <strong>{formatDisplayDate(value)}</strong>
        </button>

        {open ? (
          <div className="calendar-popover">
            <div className="calendar-head">
              <button className="btn icon soft" type="button" onClick={() => moveMonth(-1)} title="Tháng trước"><ChevronLeft size={16} /></button>
              <div>
                <b>Tháng {viewDate.getMonth() + 1}</b>
                <span>{viewDate.getFullYear()}</span>
              </div>
              <button className="btn icon soft" type="button" onClick={() => moveMonth(1)} title="Tháng sau"><ChevronRight size={16} /></button>
            </div>
            <div className="calendar-grid calendar-weekdays">
              {WEEKDAYS.map(day => <span key={day}>{day}</span>)}
            </div>
            <div className="calendar-grid">
              {days.map(day => {
                const key = toDateKey(day.date);
                const selected = key === value;
                const today = key === todayKey();
                return (
                  <button
                    className={`calendar-day ${day.inMonth ? '' : 'outside'} ${selected ? 'selected' : ''} ${today ? 'today' : ''}`}
                    type="button"
                    key={key}
                    onClick={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                  >
                    {day.date.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="calendar-actions">
              <button className="btn soft" type="button" onClick={() => {
                onChange(todayKey());
                setOpen(false);
              }}>Hôm nay</button>
            </div>
          </div>
        ) : null}
      </div>
      <button className="date-step" type="button" title="Ngày sau" onClick={() => moveSelected(1)}><ChevronRight size={17} /></button>
    </div>
  );
}

function calendarDays(viewDate: Date) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = addDays(first, -startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(start, index);
    return { date, inMonth: date.getMonth() === viewDate.getMonth() };
  });
}

function addDays(date: Date, days: number) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function fromDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  const date = fromDateKey(value);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function todayKey() {
  return toDateKey(new Date());
}
