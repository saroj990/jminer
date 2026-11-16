"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

type MonthYearPickerProps = {
  label: string;
  value: string; // YYYY-MM or ""
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  hint?: string;
  minYear?: number;
  maxYear?: number;
  allowEmpty?: boolean;
};

function parseValue(value: string): { year: string; month: string } {
  if (!value) return { year: "", month: "" };
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return { year: "", month: "" };
  return { year: match[1], month: match[2] };
}

const triggerClass =
  "flex h-10 w-full items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-left text-sm text-[var(--ink)] shadow-[var(--input-inset)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:cursor-not-allowed disabled:bg-[var(--panel-muted)] disabled:opacity-60";

const selectClass =
  "h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-sm text-[var(--ink)] shadow-[var(--input-inset)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:cursor-not-allowed disabled:bg-[var(--panel-muted)] disabled:opacity-60";

export function MonthYearPicker({
  label,
  value,
  onChange,
  disabled = false,
  className = "",
  hint,
  minYear = 1970,
  maxYear,
  allowEmpty = true,
}: MonthYearPickerProps) {
  const currentYear = new Date().getFullYear();
  const upperYear = maxYear ?? currentYear + 5;
  const { year, month } = parseValue(value);
  const [yearOpen, setYearOpen] = useState(false);
  const yearWrapRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = upperYear; y >= minYear; y -= 1) list.push(y);
    return list;
  }, [minYear, upperYear]);

  const emit = (nextYear: string, nextMonth: string) => {
    if (!nextYear && !nextMonth) {
      onChange("");
      return;
    }
    if (nextYear && nextMonth) {
      onChange(`${nextYear}-${nextMonth}`);
      return;
    }
    if (!nextYear || !nextMonth) {
      onChange("");
    }
  };

  useEffect(() => {
    if (!yearOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!yearWrapRef.current?.contains(event.target as Node)) {
        setYearOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setYearOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [yearOpen]);

  useEffect(() => {
    if (!yearOpen || !yearListRef.current) return;
    const selected = yearListRef.current.querySelector<HTMLElement>(
      '[data-selected="true"]',
    );
    selected?.scrollIntoView({ block: "nearest" });
  }, [yearOpen, year]);

  const pickYear = (nextYear: string) => {
    emit(
      nextYear,
      month || String(new Date().getMonth() + 1).padStart(2, "0"),
    );
    setYearOpen(false);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        {label}
      </span>
      <div className="grid grid-cols-[1.4fr_1fr] gap-2">
        <select
          aria-label={`${label} month`}
          className={selectClass}
          value={month}
          disabled={disabled}
          onChange={(e) => emit(year || String(currentYear), e.target.value)}
        >
          {allowEmpty ? <option value="">Month</option> : null}
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <div className="relative" ref={yearWrapRef}>
          <button
            type="button"
            aria-label={`${label} year`}
            aria-haspopup="listbox"
            aria-expanded={yearOpen}
            aria-controls={listId}
            disabled={disabled}
            className={triggerClass}
            onClick={() => setYearOpen((open) => !open)}
          >
            <span className={year ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"}>
              {year || "Year"}
            </span>
            <span className="text-[var(--ink-muted)]" aria-hidden>
              ▾
            </span>
          </button>

          {yearOpen ? (
            <ul
              id={listId}
              ref={yearListRef}
              role="listbox"
              aria-label={`${label} year options`}
              className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--line)] bg-[var(--panel)] py-1 shadow-[0_12px_30px_-18px_rgba(16,40,36,0.55)]"
            >
              {allowEmpty ? (
                <li role="option" aria-selected={!year}>
                  <button
                    type="button"
                    className="flex w-full px-3 py-2 text-left text-sm text-[var(--ink-muted)] hover:bg-[var(--accent-soft)]"
                    onClick={() => {
                      onChange("");
                      setYearOpen(false);
                    }}
                  >
                    Year
                  </button>
                </li>
              ) : null}
              {years.map((y) => {
                const selected = year === String(y);
                return (
                  <li
                    key={y}
                    role="option"
                    aria-selected={selected}
                    data-selected={selected ? "true" : "false"}
                  >
                    <button
                      type="button"
                      className={`flex w-full px-3 py-2 text-left text-sm hover:bg-[var(--accent-soft)] ${
                        selected
                          ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                          : "text-[var(--ink)]"
                      }`}
                      onClick={() => pickYear(String(y))}
                    >
                      {y}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
      {value ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[var(--ink-muted)]">
            {MONTHS.find((m) => m.value === month)?.label ?? ""} {year}
          </span>
          {allowEmpty && !disabled ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs font-medium text-[var(--ink-muted)] transition hover:text-[var(--danger)]"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : hint ? (
        <span className="text-xs text-[var(--ink-muted)]">{hint}</span>
      ) : null}
    </div>
  );
}
