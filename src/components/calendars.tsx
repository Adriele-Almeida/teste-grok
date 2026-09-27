"use client";

import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getYear,
  isSameMonth,
  setMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  dateFromKey,
  dateKeyFromIso,
  formatMonthTitle,
  formatTime,
  statusTone,
  todayKey,
  type Post,
} from "@/lib/pauta";
import { useUi } from "@/store/ui";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

function postsByDay(posts: Post[]): Map<string, Post[]> {
  const map = new Map<string, Post[]>();
  for (const post of posts) {
    const key = dateKeyFromIso(post.scheduledAt);
    const list = map.get(key) ?? [];
    list.push(post);
    map.set(key, list);
  }
  return map;
}

function MonthGrid({
  month,
  grouped,
  compact = false,
  onPickMonth,
}: {
  month: Date;
  grouped: Map<string, Post[]>;
  compact?: boolean;
  onPickMonth?: (key: string) => void;
}) {
  const selectedDate = useUi((s) => s.selectedDate);
  const selectDate = useUi((s) => s.selectDate);
  const selectPost = useUi((s) => s.selectPost);
  const today = todayKey();
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="flex flex-col gap-2">
      {compact ? (
        <button
          type="button"
          onClick={() => onPickMonth?.(format(month, "yyyy-MM-dd"))}
          className="text-left text-sm font-medium text-ink"
        >
          {format(month, "MMMM", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}
        </button>
      ) : null}
      <div className={cn("grid grid-cols-7", compact ? "gap-0.5" : "gap-1")}>
        {WEEKDAYS.map((label, i) => (
          <div
            key={`${label}-${i}`}
            className={cn(
              "text-center font-medium text-subtle",
              compact ? "text-xs" : "pb-1 text-xs",
            )}
          >
            {label}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const items = grouped.get(key) ?? [];
          const isToday = key === today;
          const isSelected = key === selectedDate;
          const first = items[0];
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (compact) {
                  onPickMonth?.(key);
                  return;
                }
                selectDate(key);
                if (items.length === 1 && first) selectPost(first.id);
              }}
              className={cn(
                "flex min-h-0 flex-col rounded-sm text-left transition-colors duration-150",
                compact
                  ? "aspect-square items-center justify-center p-0"
                  : "min-h-20 gap-1 p-1 sm:min-h-28 sm:p-1.5",
                inMonth ? "bg-surface" : "bg-transparent",
                isSelected && !compact && "ring-1 ring-primary",
                isToday && compact && "bg-primary text-primary-fg",
                !inMonth && "opacity-40",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                  compact && "size-5",
                  isToday && !compact && "bg-primary text-primary-fg",
                  isToday && compact && "text-primary-fg",
                )}
              >
                {format(day, "d")}
              </span>
              {compact ? (
                items.length > 0 ? (
                  <span className="mt-0.5 flex gap-0.5">
                    {items.slice(0, 3).map((post) => (
                      <span
                        key={post.id}
                        className={cn("size-1 rounded-full", statusTone(post.status).dot)}
                      />
                    ))}
                  </span>
                ) : null
              ) : first ? (
                <span
                  className="relative mt-auto block w-full overflow-hidden rounded-xs"
                  onClick={(event) => {
                    event.stopPropagation();
                    selectPost(first.id);
                  }}
                >
                  <img
                    src={first.mediaUrl}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                  />
                  {items.length > 1 ? (
                    <span className="absolute right-1 bottom-1 rounded-full bg-ink/70 px-1.5 text-xs text-primary-fg">
                      +{items.length - 1}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function YearCalendar({ posts }: { posts: Post[] }) {
  const cursor = useUi((s) => s.cursor);
  const setCursor = useUi((s) => s.setCursor);
  const setView = useUi((s) => s.setView);
  const selectDate = useUi((s) => s.selectDate);
  const year = getYear(dateFromKey(cursor));
  const grouped = postsByDay(posts);
  const months = Array.from({ length: 12 }, (_, i) => setMonth(new Date(year, 0, 15), i));

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
      {months.map((month) => (
        <div key={month.toISOString()} className="rounded-lg bg-surface-2/60 p-3">
          <MonthGrid
            month={month}
            grouped={grouped}
            compact
            onPickMonth={(key) => {
              setCursor(key);
              selectDate(key);
              setView("month");
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function MonthCalendar({ posts }: { posts: Post[] }) {
  const cursor = useUi((s) => s.cursor);
  const grouped = postsByDay(posts);
  return <MonthGrid month={dateFromKey(cursor)} grouped={grouped} />;
}

export function WeekCalendar({ posts }: { posts: Post[] }) {
  const cursor = useUi((s) => s.cursor);
  const selectPost = useUi((s) => s.selectPost);
  const selectedPostId = useUi((s) => s.selectedPostId);
  const today = todayKey();
  const start = startOfWeek(dateFromKey(cursor));
  const days = eachDayOfInterval({ start, end: endOfWeek(start) });
  const grouped = postsByDay(posts);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7 md:gap-2">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const items = grouped.get(key) ?? [];
        const isToday = key === today;
        return (
          <section
            key={key}
            className={cn(
              "flex min-h-44 flex-col rounded-lg bg-surface p-2.5 shadow-[var(--shadow-border)]",
              isToday && "ring-1 ring-primary",
            )}
          >
            <header className="mb-2 flex items-baseline justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-subtle">
                {format(day, "EEE", { locale: ptBR })}
              </span>
              <span className="text-sm tabular-nums text-ink">{format(day, "d")}</span>
            </header>
            <div className="flex flex-col gap-2">
              {items.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => selectPost(post.id)}
                  className={cn(
                    "overflow-hidden rounded-md bg-surface-2 text-left",
                    selectedPostId === post.id && "ring-1 ring-primary",
                  )}
                >
                  <img
                    src={post.mediaUrl}
                    alt={post.mediaAlt}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="p-2">
                    <p className="text-xs text-muted">{formatTime(post.scheduledAt)}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-ink">{post.caption}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function CalendarToolbar({
  onPrev,
  onNext,
  onToday,
  title,
}: {
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        className="inline-flex size-11 items-center justify-center rounded-md bg-surface text-ink shadow-[var(--shadow-border)]"
        aria-label="Anterior"
      >
        <Chevron dir="left" />
      </button>
      <button
        type="button"
        onClick={onNext}
        className="inline-flex size-11 items-center justify-center rounded-md bg-surface text-ink shadow-[var(--shadow-border)]"
        aria-label="Próximo"
      >
        <Chevron dir="right" />
      </button>
      <h1 className="ml-1 font-display text-2xl leading-none text-ink sm:text-3xl">{title}</h1>
      <button
        type="button"
        onClick={onToday}
        className="ml-2 hidden h-9 rounded-full px-3 text-xs font-medium text-muted hover:bg-surface-2 sm:inline-flex sm:items-center"
      >
        Hoje
      </button>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={dir === "left" ? "M15 6 9 12l6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function shiftCursor(cursor: string, view: "year" | "month" | "week", dir: -1 | 1) {
  const date = dateFromKey(cursor);
  if (view === "year") return format(addMonths(date, 12 * dir), "yyyy-MM-dd");
  if (view === "week") return format(addWeeks(date, dir), "yyyy-MM-dd");
  return format(addMonths(date, dir), "yyyy-MM-dd");
}

export function cursorTitle(cursor: string, view: "year" | "month" | "week") {
  const date = dateFromKey(cursor);
  if (view === "year") return format(date, "yyyy");
  if (view === "week") {
    const start = startOfWeek(date);
    const end = endOfWeek(date);
    return `${format(start, "d MMM", { locale: ptBR })} – ${format(end, "d MMM yyyy", { locale: ptBR })}`;
  }
  return formatMonthTitle(date);
}
