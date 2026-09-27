"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { datetimeLocalToIso, isoToDatetimeLocal, todayKey, type Post } from "@/lib/pauta";
import { createPost, updatePost, updateStudio } from "@/lib/pauta.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUi } from "@/store/ui";
import type { Studio } from "@/lib/pauta";

type FormState = {
  scheduledAt: string;
  caption: string;
  mediaUrl: string;
  mediaAlt: string;
};

const EMPTY: FormState = {
  scheduledAt: `${todayKey()}T18:00`,
  caption: "",
  mediaUrl: "",
  mediaAlt: "",
};

export function PostForm({ posts }: { posts: Post[] }) {
  const formOpen = useUi((s) => s.formOpen);
  const editingPostId = useUi((s) => s.editingPostId);
  const closeForm = useUi((s) => s.closeForm);
  const post = posts.find((item) => item.id === editingPostId) ?? null;

  return (
    <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
      <DialogContent side="right">
        <FormBody post={post} onClose={closeForm} />
      </DialogContent>
    </Dialog>
  );
}

function FormBody({ post, onClose }: { post: Post | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (post) {
      setForm({
        scheduledAt: isoToDatetimeLocal(post.scheduledAt),
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        mediaAlt: post.mediaAlt,
      });
    } else {
      setForm(EMPTY);
    }
  }, [post]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        scheduledAt: datetimeLocalToIso(form.scheduledAt),
        caption: form.caption,
        mediaUrl: form.mediaUrl,
        mediaAlt: form.mediaAlt,
      };
      if (post) {
        await updatePost({ data: { id: post.id, ...payload } });
      } else {
        await createPost({ data: payload });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["board"] });
      toast.success(post ? "Post atualizado" : "Post adicionado");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha uma imagem");
      return;
    }
    if (file.size > 1_200_000) {
      toast.error("Imagem grande demais. Use até cerca de 1 MB.");
      return;
    }
    const mediaUrl = await readAsDataUrl(file);
    setForm((current) => ({ ...current, mediaUrl, mediaAlt: file.name }));
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="px-5 pt-5">
        <DialogTitle className="font-display text-2xl text-ink">
          {post ? "Editar post" : "Novo post"}
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted">
          Arte, legenda e o dia em que vai ao ar.
        </DialogDescription>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <Field label="Data e hora">
          <Input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}
            required
          />
        </Field>
        <Field label="Arte">
          {form.mediaUrl ? (
            <img
              src={form.mediaUrl}
              alt={form.mediaAlt}
              className="mb-2 aspect-[4/3] w-full rounded-md object-cover"
            />
          ) : null}
          <Input
            type="file"
            accept="image/*"
            onChange={(event) => void onPickFile(event.target.files?.[0])}
          />
          <Input
            className="mt-2"
            value={form.mediaUrl.startsWith("data:") ? "" : form.mediaUrl}
            onChange={(event) =>
              setForm({ ...form, mediaUrl: event.target.value, mediaAlt: "" })
            }
            placeholder="Ou cole o link da imagem"
          />
        </Field>
        <Field label="Legenda">
          <Textarea
            value={form.caption}
            onChange={(event) => setForm({ ...form, caption: event.target.value })}
            required
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {post ? "Salvar" : "Colocar na pauta"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

export function SettingsDialog({ studio }: { studio: Studio }) {
  const open = useUi((s) => s.settingsOpen);
  const close = useUi((s) => s.closeSettings);
  const queryClient = useQueryClient();
  const [clientName, setClientName] = useState(studio.clientName);

  useEffect(() => {
    setClientName(studio.clientName);
  }, [studio]);

  const mutation = useMutation({
    mutationFn: () => updateStudio({ data: { clientName } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["board"] });
      toast.success("Nome atualizado");
      close();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent side="center">
        <form
          className="flex flex-col gap-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div>
            <DialogTitle className="font-display text-2xl text-ink">Cliente</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted">
              Cada cópia deste app é de um cliente. Coloque o nome aqui.
            </DialogDescription>
          </div>
          <Field label="Nome">
            <Input
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              required
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler a imagem"));
    reader.readAsDataURL(file);
  });
}
