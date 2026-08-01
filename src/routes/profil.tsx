import { createFileRoute, Link } from "@tanstack/react-router";
import { LogOut, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useCar } from "@/lib/car-store";
import { useI18n } from "@/lib/i18n";
import { LanguagePicker } from "@/components/language-picker";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil — BilHjälpen AI" },
      {
        name: "description",
        content: "Hantera ditt konto och din sparade bil i BilHjälpen AI.",
      },
      { property: "og:title", content: "Profil — BilHjälpen AI" },
      { property: "og:description", content: "Konto, sparad bil och inställningar." },
    ],
  }),
  component: Profil,
});

function Profil() {
  const { user } = useAuth();
  const { car } = useCar();
  const { t } = useI18n();

  return (
    <main className="px-4 pt-8">
      <h1 className="text-2xl">{t.navProfile}</h1>

      <div className="mt-5">
        <p className="stencil mb-2">{t.language}</p>
        <LanguagePicker />
      </div>

      <div className="panel mt-6 space-y-3 p-5">
        <div className="flex items-center gap-3">
          <Mail className="size-5 text-primary" />
          <div className="min-w-0">
            <p className="stencil">Konto</p>
            <p className="truncate text-sm">{user?.email ?? "Inte inloggad"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-primary" />
          <div className="min-w-0">
            <p className="stencil">Sparad bil</p>
            <p className="truncate text-sm">
              {car ? `${car.make} ${car.model} (${car.year})` : "Ingen bil sparad"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <Button asChild variant="secondary">
          <Link to="/garage">Hantera min bil</Link>
        </Button>
        {user ? (
          <Button variant="outline" onClick={() => void supabase.auth.signOut()}>
            <LogOut className="size-4" /> Logga ut
          </Button>
        ) : (
          <Button asChild>
            <Link to="/auth">Logga in</Link>
          </Button>
        )}
      </div>
    </main>
  );
}