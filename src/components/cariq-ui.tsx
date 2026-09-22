import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, OctagonAlert, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatusLevel = "safe" | "caution" | "soon" | "urgent" | "neutral";

const STATUS_STYLES: Record<StatusLevel, { border: string; bg: string; text: string; icon: LucideIcon }> = {
  safe: {
    border: "border-signal-safe/50",
    bg: "bg-signal-safe/10",
    text: "text-signal-safe",
    icon: CheckCircle2,
  },
  caution: {
    border: "border-signal-caution/50",
    bg: "bg-signal-caution/10",
    text: "text-signal-caution",
    icon: AlertTriangle,
  },
  soon: {
    border: "border-signal-soon/50",
    bg: "bg-signal-soon/10",
    text: "text-signal-soon",
    icon: TriangleAlert,
  },
  urgent: {
    border: "border-signal-urgent/50",
    bg: "bg-signal-urgent/10",
    text: "text-signal-urgent",
    icon: OctagonAlert,
  },
  neutral: {
    border: "border-border",
    bg: "bg-secondary/45",
    text: "text-muted-foreground",
    icon: CheckCircle2,
  },
};

export function StatusMark({ level = "neutral", className }: { level?: StatusLevel; className?: string }) {
  const style = STATUS_STYLES[level];
  const Icon = style.icon;
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg border", style.border, style.bg, style.text, className)}>
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

export function StatusPill({ level = "neutral", children }: { level?: StatusLevel; children: ReactNode }) {
  const style = STATUS_STYLES[level];
  const Icon = style.icon;
  return (
    <span className={cn("inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", style.border, style.bg, style.text)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}

export function CarStatusPanel({
  title,
  label,
  body,
  level = "safe",
  children,
}: {
  title: string;
  label: string;
  body?: string;
  level?: StatusLevel;
  children?: ReactNode;
}) {
  const style = STATUS_STYLES[level];
  return (
    <section className={cn("surface border-l-4 p-4", style.border)}>
      <div className="flex items-start gap-3">
        <StatusMark level={level} />
        <div className="min-w-0 flex-1">
          <p className="stencil">{title}</p>
          <h2 className="mt-1 text-xl leading-tight">{label}</h2>
          {body ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p> : null}
        </div>
      </div>
      {children ? <div className="mt-4 border-t border-border pt-4">{children}</div> : null}
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel p-7 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-lg border border-border bg-secondary/55 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AnalysisProgress({ steps, activeIndex }: { steps: string[]; activeIndex: number }) {
  return (
    <div className="surface p-4" aria-live="polite">
      <div className="space-y-3">
        {steps.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <div key={step} className="flex items-center gap-3">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition-colors",
                  done || active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : index + 1}
              </span>
              <span className={cn("text-sm", active ? "font-semibold text-foreground" : "text-muted-foreground")}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}