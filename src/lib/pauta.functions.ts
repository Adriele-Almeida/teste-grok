import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import {
  isReviewAction,
  isStatus,
  titleFromCaption,
  type BoardData,
  type Post,
  type Review,
  type ReviewAction,
  type Status,
  type Studio,
} from "@/lib/pauta";

type PostRow = {
  id: number;
  scheduled_at: unknown;
  caption: string;
  media_url: string;
  media_alt: string;
  status: string;
};

type ReviewRow = {
  id: number;
  post_id: number;
  action: string;
  comment: string;
  created_at: unknown;
};

type StudioRow = {
  client_name: string;
};

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return String(value);
}

function asStatus(value: string): Status {
  return isStatus(value) ? value : "pending";
}
function asAction(value: string): ReviewAction {
  return isReviewAction(value) ? value : "approved";
}

function mapReview(row: ReviewRow): Review {
  return {
    id: Number(row.id),
    postId: Number(row.post_id),
    action: asAction(row.action),
    comment: row.comment,
    createdAt: iso(row.created_at),
  };
}

function mapPost(row: PostRow, reviews: Review[]): Post {
  return {
    id: Number(row.id),
    scheduledAt: iso(row.scheduled_at),
    caption: row.caption,
    mediaUrl: row.media_url,
    mediaAlt: row.media_alt,
    status: asStatus(row.status),
    reviews,
  };
}

const FALLBACK_STUDIO: Studio = { clientName: "Cliente" };

async function loadBoard(): Promise<BoardData> {
  const sql = await getSql();
  const studioRows = await sql<StudioRow>`
    select client_name from studio where id = 1
  `;
  const postRows = await sql<PostRow>`
    select id, scheduled_at, caption, media_url, media_alt, status
    from posts
    order by scheduled_at asc, id asc
  `;
  const reviewRows = await sql<ReviewRow>`
    select id, post_id, action, comment, created_at
    from reviews
    order by created_at asc, id asc
  `;
  const reviewsByPost = new Map<number, Review[]>();
  for (const row of reviewRows) {
    const mapped = mapReview(row);
    const list = reviewsByPost.get(mapped.postId) ?? [];
    list.push(mapped);
    reviewsByPost.set(mapped.postId, list);
  }
  return {
    studio: studioRows[0] ? { clientName: studioRows[0].client_name } : FALLBACK_STUDIO,
    posts: postRows.map((row) => mapPost(row, reviewsByPost.get(Number(row.id)) ?? [])),
  };
}

export const getBoard = createServerFn({ method: "GET" }).handler(async () => {
  return loadBoard();
});

type PostInput = {
  scheduledAt: string;
  caption: string;
  mediaUrl: string;
  mediaAlt: string;
};

function parsePostInput(data: unknown): PostInput {
  if (typeof data !== "object" || data === null) throw new Error("Dados inválidos");
  const d = data as Record<string, unknown>;
  const caption = String(d.caption ?? "").trim();
  const mediaUrl = String(d.mediaUrl ?? "").trim();
  const scheduledAt = String(d.scheduledAt ?? "").trim();
  if (!caption) throw new Error("A legenda é obrigatória");
  if (!mediaUrl) throw new Error("A arte é obrigatória");
  if (!scheduledAt) throw new Error("A data é obrigatória");
  return {
    scheduledAt,
    caption,
    mediaUrl,
    mediaAlt: String(d.mediaAlt ?? "").trim(),
  };
}

export const createPost = createServerFn({ method: "POST" })
  .validator((data: unknown) => parsePostInput(data))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const title = titleFromCaption(data.caption);
    const rows = await sql<{ id: number }>`
      insert into posts (
        scheduled_at, platform, format, title, caption, media_url, media_alt, campaign, status, notes
      ) values (
        ${data.scheduledAt}::timestamptz,
        'instagram',
        'feed',
        ${title},
        ${data.caption},
        ${data.mediaUrl},
        ${data.mediaAlt},
        '',
        'pending',
        ''
      )
      returning id
    `;
    return { id: Number(rows[0]?.id ?? 0) };
  });

export const updatePost = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data === null) throw new Error("Dados inválidos");
    const d = data as Record<string, unknown>;
    const id = Number(d.id);
    if (!Number.isFinite(id) || id <= 0) throw new Error("Post inválido");
    return { id, ...parsePostInput(d) };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const title = titleFromCaption(data.caption);
    await sql`
      update posts set
        scheduled_at = ${data.scheduledAt}::timestamptz,
        title = ${title},
        caption = ${data.caption},
        media_url = ${data.mediaUrl},
        media_alt = ${data.mediaAlt},
        status = 'pending'
      where id = ${data.id}
    `;
    return { ok: true };
  });

export const deletePost = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data === null) throw new Error("Dados inválidos");
    const id = Number((data as Record<string, unknown>).id);
    if (!Number.isFinite(id) || id <= 0) throw new Error("Post inválido");
    return { id };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`delete from posts where id = ${data.id}`;
    return { ok: true };
  });

export const submitReview = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data === null) throw new Error("Dados inválidos");
    const d = data as Record<string, unknown>;
    const postId = Number(d.postId);
    const action = String(d.action ?? "");
    const comment = String(d.comment ?? "").trim();
    if (!Number.isFinite(postId) || postId <= 0) throw new Error("Post inválido");
    if (!isReviewAction(action)) throw new Error("Ação inválida");
    if ((action === "changes" || action === "rejected") && !comment) {
      throw new Error("Escreva o que precisa mudar");
    }
    return { postId, action, comment };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`
      insert into reviews (post_id, action, comment, author_label)
      values (${data.postId}, ${data.action}, ${data.comment}, '')
    `;
    await sql`update posts set status = ${data.action} where id = ${data.postId}`;
    return { ok: true };
  });

export const updateStudio = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data === null) throw new Error("Dados inválidos");
    const clientName = String((data as Record<string, unknown>).clientName ?? "").trim();
    if (!clientName) throw new Error("Nome do cliente é obrigatório");
    return { clientName };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`
      insert into studio (id, client_name, agency_name, tagline, month_note, updated_at)
      values (1, ${data.clientName}, '', '', '', now())
      on conflict (id) do update set
        client_name = excluded.client_name,
        updated_at = now()
    `;
    return { ok: true };
  });
