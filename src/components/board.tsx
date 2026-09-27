"use client";

import { useQuery } from "@tanstack/react-query";
import { endOfWeek, format, isSameMonth, parseISO, startOfWeek } from "date-fns";
import {
  dateFromKey,
  dateKeyFromIso,
  formatDayHeading,
  formatPostWhen,
  todayKey,
  type BoardData,
  type CalendarView,
  type Post,
} from "@/lib/pauta";
import { getBoard } from "@/lib/pauta.functions";
import {
  CalendarToolbar,
  cursorTitle,
  MonthCalendar,
  shiftCursor,
  WeekCalendar,
  YearCalendar,
} from "@/components/calendars";
import { PostDetail } from "@/components/post-detail";
import { PostForm, SettingsDialog } from "@/components/post-form";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useUi } from "@/store/ui";
import { cn } from "@/lib/utils";

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: "year", label: "Ano" },
  { id: "month", label: "Mês" },
  { id: "week", label: "Semana" },
];

export function Board({ initial }: { initial: BoardData }) {
  const { data } = useQuery({
    queryKey: ["board"],
    queryFn: () => getBoard(),
    initialData: initial,
  });
  const view = useUi((s) => s.view);
  const cursor = useUi((s) => s.cursor);
  const selectedDate = useUi((s) => s.selectedDate);
  const setView = useUi((s) => s.setView);
  const setCursor = useUi((s) => s.setCursor);
  const selectDate = useUi((s) => s.selectDate);
  const selectPost = useUi((s) => s.selectPost);
  const openForm = useUi((s) => s.openForm);
  const openSettings = useUi((s) => s.openSettings);

  const studio = data.studio;
  const posts = data.posts;
  const cursorDate = dateFromKey(cursor);

  const scoped =
    view === "year"
      ? posts.filter(
          (post) =>
            parseISO(dateKeyFromIso(post.scheduledAt) + "T12:00:00").getFullYear() ===
            cursorDate.getFullYear(),
        )
      : view === "week"
        ? postsInWeek(posts, cursor)
        : posts.filter((post) =>
            isSameMonth(parseISO(dateKeyFromIso(post.scheduledAt) + "T12:00:00"), cursorDate),
          );

  const dayPosts = selectedDate
    ? posts
        .filter((post) => dateKeyFromIso(post.scheduledAt) === selectedDate)
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    : [];

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-xl leading-none text-ink">Pauta</p>
              <p className="mt-1 text-xs text-muted">{studio.clientName}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={openSettings}>
                Nome do cliente
              </Button>
              <Button size="sm" onClick={() => openForm()}>
                Novo post
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <CalendarToolbar
              title={cursorTitle(cursor, view)}
              onPrev={() => {
                const next = shiftCursor(cursor, view, -1);
                setCursor(next);
                selectDate(next);
              }}
              onNext={() => {
                const next = shiftCursor(cursor, view, 1);
                setCursor(next);
                selectDate(next);
              }}
              onToday={() => {
                const today = todayKey();
                setCursor(today);
                selectDate(today);
              }}
            />
            <div className="flex rounded-full bg-surface-2 p-1">
              {VIEWS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={cn(
                    "h-9 rounded-full px-3 text-sm font-medium transition-colors duration-150",
                    view === item.id ? "bg-primary text-primary-fg" : "text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-6">
        <section className="min-w-0">
          {posts.length === 0 && view === "month" ? (
            <p className="mb-4 text-sm text-muted">
              Calendário vazio. Adicione um post com a arte, a legenda e o dia.
            </p>
          ) : null}
          {view === "year" ? <YearCalendar posts={scoped} /> : null}
          {view === "month" ? <MonthCalendar posts={scoped} /> : null}
          {view === "week" ? <WeekCalendar posts={scoped} /> : null}
        </section>
        <aside>
          <DayList dateKey={selectedDate} posts={dayPosts} onOpen={selectPost} />
        </aside>
      </main>

      <PostDetail posts={posts} />
      <PostForm posts={posts} />
      <SettingsDialog studio={studio} />
    </div>
  );
}

function DayList({
  dateKey,
  posts,
  onOpen,
}: {
  dateKey: string | null;
  posts: Post[];
  onOpen: (id: number) => void;
}) {
  return (
    <section className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-lg text-ink">
        {dateKey ? formatDayHeading(dateKey) : "O dia"}
      </h2>
      {posts.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Nenhum post neste dia.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {posts.map((post) => (
            <li key={post.id}>
              <button
                type="button"
                onClick={() => onOpen(post.id)}
                className="flex w-full gap-3 overflow-hidden rounded-md bg-surface-2 p-2 text-left"
              >
                <img
                  src={post.mediaUrl}
                  alt={post.mediaAlt}
                  className="size-14 shrink-0 rounded-sm object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-ink">{formatPostWhen(post.scheduledAt)}</span>
                    <StatusBadge status={post.status} />
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs text-muted">{post.caption}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function postsInWeek(posts: Post[], cursor: string) {
  const date = dateFromKey(cursor);
  const startKey = format(startOfWeek(date), "yyyy-MM-dd");
  const endKey = format(endOfWeek(date), "yyyy-MM-dd");
  return posts.filter((post) => {
    const key = dateKeyFromIso(post.scheduledAt);
    return key >= startKey && key <= endKey;
  });
}
