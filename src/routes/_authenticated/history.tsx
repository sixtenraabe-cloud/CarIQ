import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Loader2, ScanSearch, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/diagnosis-report";
import { deleteDiagnosis, listDiagnoses } from "@/lib/diagnose.functions";
import type { Verdict } from "@/lib/diagnosis-types";
import { useAuth } from "@/hooks/use-auth";
import { currencyFor, useI18n } from "@/lib/i18n";
import { EmptyState } from "@/components/cariq-ui";

export const Route = createFileRoute("/_authenticated/history")({
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
      { property: "og:url", content: "https://cariq-test.lovable.app/history" },
    ],
    links: [{ rel: "canonical", href: "https://cariq-test.lovable.app/history" }],
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
  const grouped = rows.reduce<Record<string, typeof rows>>((acc, row) => {
    const label = new Date(row.created_at).toLocaleDateString(currencyFor(lang).locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    acc[label] = [...(acc[label] ?? []), row];
    return acc;
  }, {});

  return (
    <main className="app-page">
      <p className="stencil">{t.historyKicker}</p>
      <h1 className="mt-2 text-2xl">{t.historyTitle}</h1>

      {query.isLoading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Clock3}
            title={t.historyEmptyTitle}
            body={t.historyEmptySub}
            action={(
              <Button asChild>
                <Link to="/snabbkoll"><ScanSearch className="size-4" /> {t.quickPrimary}</Link>
              </Button>
            )}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <section key={date}>
              <p className="stencil mb-3">{date}</p>
              <ol className="relative space-y-3 border-l border-border pl-4">
                {items.map((row) => (
                  <li key={row.id} className="relative">
                    <span className="absolute -left-[21px] top-5 size-2.5 rounded-full border border-background bg-primary" aria-hidden="true" />
                    <article className="tile p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <VerdictBadge verdict={row.verdict as Verdict} />
                            {row.had_audio ? (
                              <span className="rounded-full border border-border bg-secondary/45 px-2 py-1 text-xs text-muted-foreground">
                                {t.audioAnalyzed}
                              </span>
                            ) : null}
                          </div>
                          <h2 className="mt-3 text-lg leading-snug">{row.headline}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">{row.car_summary}</p>
                        </div>
                        <button
                          aria-label={t.deleteReport}
                          onClick={() => del.mutate(row.id)}
                          className="grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">{row.symptom}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleTimeString(currencyFor(lang).locale, { hour: "2-digit", minute: "2-digit" })} · {row.confidence}%{" "}
                        {t.confidence.toLowerCase()} · {row.estimated_cost}
                      </p>
                    </article>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
