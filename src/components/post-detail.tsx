"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ACTION_LABEL,
  canReview,
  formatPostWhen,
  type Post,
  type ReviewAction,
} from "@/lib/pauta";
import { deletePost, submitReview } from "@/lib/pauta.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { useUi } from "@/store/ui";
import { cn } from "@/lib/utils";

export function PostDetail({ posts }: { posts: Post[] }) {
  const selectedPostId = useUi((s) => s.selectedPostId);
  const selectPost = useUi((s) => s.selectPost);
  const openForm = useUi((s) => s.openForm);
  const post = posts.find((item) => item.id === selectedPostId) ?? null;

  return (
    <Dialog open={Boolean(post)} onOpenChange={(open) => !open && selectPost(null)}>
      <DialogContent side="right" aria-describedby={undefined}>
        {post ? (
          <PostBody
            post={post}
            onClose={() => selectPost(null)}
            onEdit={() => {
              selectPost(null);
              openForm(post.id);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PostBody({
  post,
  onClose,
  onEdit,
}: {
  post: Post;
  onClose: () => void;
  onEdit: () => void;
}) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [needsComment, setNeedsComment] = useState(false);

  const reviewMutation = useMutation({
    mutationFn: (input: { action: ReviewAction; comment: string }) =>
      submitReview({
        data: { postId: post.id, action: input.action, comment: input.comment },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["board"] });
      setComment("");
      setNeedsComment(false);
      toast.success("Salvo");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePost({ data: { id: post.id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["board"] });
      onClose();
      toast.success("Post apagado");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function send(action: ReviewAction) {
    if ((action === "changes" || action === "rejected") && !comment.trim()) {
      setNeedsComment(true);
      toast.error("Escreva o que precisa mudar");
      return;
    }
    reviewMutation.mutate({ action, comment: comment.trim() });
  }

  const open = canReview(post.status);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <DialogTitle className="font-display text-2xl leading-tight text-ink">
            {formatPostWhen(post.scheduledAt)}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted">
            Arte, legenda e o dia da postagem.
          </DialogDescription>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2"
          aria-label="Fechar"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <img
          src={post.mediaUrl}
          alt={post.mediaAlt}
          className="aspect-[4/3] w-full rounded-md object-cover"
        />
        <div className="mt-4">
          <StatusBadge status={post.status} />
        </div>
        <section className="mt-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-subtle">Legenda</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{post.caption}</p>
        </section>

        <section className="mt-6">
          <h3 className="text-xs font-medium uppercase tracking-wide text-subtle">Histórico</h3>
          {post.reviews.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nada ainda.</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-3">
              {post.reviews.map((review) => (
                <li key={review.id} className="rounded-md bg-surface-2 p-3">
                  <p className="text-xs text-muted">
                    {ACTION_LABEL[review.action]} · {formatPostWhen(review.createdAt)}
                  </p>
                  {review.comment ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink">{review.comment}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="border-t border-border px-5 py-4">
        {open ? (
          <div className="flex flex-col gap-3">
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Se precisar de ajuste, escreva aqui."
              className={cn(needsComment && !comment.trim() && "ring-1 ring-no")}
            />
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="primary"
                onClick={() => send("approved")}
                disabled={reviewMutation.isPending}
              >
                Aprovar
              </Button>
              <Button
                variant="secondary"
                onClick={() => send("changes")}
                disabled={reviewMutation.isPending}
              >
                Pedir ajuste
              </Button>
              <Button
                variant="outline"
                onClick={() => send("rejected")}
                disabled={reviewMutation.isPending}
              >
                Reprovar
              </Button>
            </div>
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm("Apagar este post?")) deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
          >
            Apagar
          </Button>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
