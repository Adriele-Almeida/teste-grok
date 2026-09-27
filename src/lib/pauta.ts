import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const TZ = "America/Sao_Paulo";

export const STATUSES = ["pending", "approved", "changes", "rejected"] as const;
export type Status = (typeof STATUSES)[number];

export const REVIEW_ACTIONS = ["approved", "changes", "rejected"] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export type CalendarView = "year" | "month" | "week";

export type Review = {
  id: number;
  postId: number;
  action: ReviewAction;
  comment: string;
  createdAt: string;
};

export type Post = {
  id: number;
  scheduledAt: string;
  caption: string;
  mediaUrl: string;
  mediaAlt: string;
  status: Status;
  reviews: Review[];
};

export type Studio = {
  clientName: string;
};

export type BoardData = {
  studio: Studio;
  posts: Post[];
};

export const STATUS_LABEL: Record<Status, string> = {
  pending: "Aguardando",
  approved: "Aprovado",
  changes: "Ajuste",
  rejected: "Reprovado",
};

export const ACTION_LABEL: Record<ReviewAction, string> = {
  approved: "Aprovou",
  changes: "Pediu ajuste",
  rejected: "Reprovou",
};

export function isStatus(v: string): v is Status {
  return (STATUSES as readonly string[]).includes(v);
}
export function isReviewAction(v: string): v is ReviewAction {
  return (REVIEW_ACTIONS as readonly string[]).includes(v);
}

function part(
  iso: string,
  type: Intl.DateTimeFormatPartTypes,
  options: Intl.DateTimeFormatOptions,
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    ...options,
  }).formatToParts(new Date(iso));
  return parts.find((item) => item.type === type)?.value ?? "";
}

export function dateKeyFromIso(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
}

export function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function dateFromKey(key: string): Date {
  return parseISO(`${key}T12:00:00`);
}

export function formatTime(iso: string): string {
  const hour = part(iso, "hour", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const minute = part(iso, "minute", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${hour}:${minute}`;
}

export function formatDayHeading(key: string): string {
  const raw = format(dateFromKey(key), "EEEE, d 'de' MMMM", { locale: ptBR });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatPostWhen(iso: string): string {
  const key = dateKeyFromIso(iso);
  return `${format(dateFromKey(key), "d MMM", { locale: ptBR })} · ${formatTime(iso)}`;
}

export function formatMonthTitle(date: Date): string {
  const raw = format(date, "MMMM yyyy", { locale: ptBR });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function isoToDatetimeLocal(iso: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  };
  return `${part(iso, "year", opts)}-${part(iso, "month", opts)}-${part(iso, "day", opts)}T${part(iso, "hour", opts)}:${part(iso, "minute", opts)}`;
}

export function datetimeLocalToIso(local: string): string {
  return new Date(`${local}:00-03:00`).toISOString();
}

export function statusTone(status: Status): { fg: string; bg: string; dot: string } {
  switch (status) {
    case "approved":
      return { fg: "text-ok", bg: "bg-ok-bg", dot: "bg-ok" };
    case "changes":
      return { fg: "text-edit", bg: "bg-edit-bg", dot: "bg-edit" };
    case "rejected":
      return { fg: "text-no", bg: "bg-no-bg", dot: "bg-no" };
    default:
      return { fg: "text-wait", bg: "bg-wait-bg", dot: "bg-wait" };
  }
}

export function canReview(status: Status): boolean {
  return status === "pending" || status === "changes";
}

export function titleFromCaption(caption: string): string {
  const line = caption.trim().split("\n")[0] ?? "";
  return line.slice(0, 80) || "Post";
}
