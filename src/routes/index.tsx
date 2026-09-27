import { createFileRoute } from "@tanstack/react-router";
import { Board } from "@/components/board";
import { getBoard } from "@/lib/pauta.functions";

export const Route = createFileRoute("/")({
  loader: () => getBoard(),
  component: Home,
  pendingComponent: Pending,
});

function Home() {
  const initial = Route.useLoaderData();
  return <Board initial={initial} />;
}

function Pending() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg text-muted">
      <p className="font-display text-2xl text-ink">Carregando a pauta</p>
    </main>
  );
}