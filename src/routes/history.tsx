import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/diagnosis-report";
import { deleteDiagnosis, listDiagnoses } from "@/lib/diagnose.functions";
import type { Verdict } from "@/lib/diagnosis-types";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Your diagnosis history — Kliktest" },
      {
        name: "description",
        content:
          "Every car symptom check you have run, with the verdict, likely causes and repair cost estimate.",
      },
      { property: "og:title", content: "Your diagnosis history — Kliktest" },
      {
        property: "og:description",
        content: "Revisit past car diagnoses and track how a problem developed over time.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user, loading } = useAuth();
  const fetchAll = useServerFn(listDiagnoses);
  const remove = useServerFn(deleteDiagnosis);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["diagnoses"],
    queryFn: () => fetchAll(),
    enabled: Boolean(user),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Report deleted.");
      void queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
    },
    onError: () => toast.error("Could not delete that report."),
  });

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-3xl">Sign in to see your history</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Saved diagnoses are tied to your account.
        </p>
        <Button asChild className="mt-6">
          <Link to="/auth">Sign in</Link>
        </Button>
      </main>
    );
  }

  const rows = query.data ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="stencil">Garage log</p>
      <h1 className="mt-2 text-4xl">Diagnosis history</h1>

      {query.isLoading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="panel mt-6 p-8 text-center">
          <p className="text-muted-foreground">No saved reports yet.</p>
          <Button asChild className="mt-4">
            <Link to="/">Run a diagnosis</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <VerdictBadge verdict={row.verdict as Verdict} />
                  <h2 className="mt-2 text-lg leading-snug">{row.headline}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{row.car_summary}</p>
                </div>
                <button
                  aria-label="Delete report"
                  onClick={() => del.mutate(row.id)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{row.symptom}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {new Date(row.created_at).toLocaleString()} · {row.confidence}% confidence ·{" "}
                {row.estimated_cost}
                {row.had_audio ? " · audio analysed" : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}