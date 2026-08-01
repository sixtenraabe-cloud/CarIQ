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
import { currencyFor, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Historik — CarIQ" },
      {
        name: "description",
        content: "Alla dina sparade bildiagnoser med bedömning, troliga orsaker och uppskattad kostnad.",
      },
      { property: "og:title", content: "Historik — CarIQ" },
      { property: "og:description", content: "Se tidigare diagnoser och följ hur problemet utvecklats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user, loading } = useAuth();
  const { t, lang } = useI18n();
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
      toast.success(t.reportDeleted);
      void queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
    },
    onError: () => toast.error(t.errDelete),
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
      <main className="px-4 py-20 text-center">
        <h1 className="text-2xl">{t.historyLoginTitle}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t.historyLoginSub}</p>
        <Button asChild className="mt-6">
          <Link to="/auth">{t.authSignIn}</Link>
        </Button>
      </main>
    );
  }

  const rows = query.data ?? [];

  return (
    <main className="px-4 pt-8">
      <p className="stencil">{t.historyKicker}</p>
      <h1 className="mt-2 text-2xl">{t.historyTitle}</h1>

      {query.isLoading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="panel mt-6 p-8 text-center">
          <p className="text-muted-foreground">{t.historyEmpty}</p>
          <Button asChild className="mt-4">
            <Link to="/">{t.doDiagnosis}</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="tile p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <VerdictBadge verdict={row.verdict as Verdict} />
                  <h2 className="mt-2 text-lg leading-snug">{row.headline}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{row.car_summary}</p>
                </div>
                <button
                  aria-label={t.deleteReport}
                  onClick={() => del.mutate(row.id)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{row.symptom}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {new Date(row.created_at).toLocaleString(currencyFor(lang).locale)} · {row.confidence}%{" "}
                {t.confidence.toLowerCase()} · {row.estimated_cost}
                {row.had_audio ? ` · ${t.audioAnalyzed}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
