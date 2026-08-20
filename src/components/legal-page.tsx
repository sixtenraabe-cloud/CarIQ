import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="px-4 pt-8">
      <h1 className="font-display text-2xl tracking-tight">{title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">Senast uppdaterad: {updated}</p>
      <div className="mt-5 space-y-5 text-sm leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-base [&_h2]:text-foreground [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
      <nav className="mt-8 flex flex-wrap gap-3 text-xs text-primary underline">
        <Link to="/villkor">Villkor</Link>
        <Link to="/aterbetalning">Återbetalningspolicy</Link>
        <Link to="/integritet">Integritetspolicy</Link>
        <Link to="/">Hem</Link>
      </nav>
    </main>
  );
}
