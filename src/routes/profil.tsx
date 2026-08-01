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
      { title: "Profil — CarIQ" },
      { name: "description", content: "Hantera ditt konto, språk och din sparade bil i CarIQ." },
      { property: "og:title", content: "Profil — CarIQ" },
      { property: "og:description", content: "Konto, sparad bil och inställningar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl">{t.navProfile}</h1>
        <LanguagePicker />
      </div>

      <div className="panel mt-6 space-y-3 p-5">
        <div className="flex items-center gap-3">
          <Mail className="size-5 text-primary" />
          <div className="min-w-0">
            <p className="stencil">{t.account}</p>
            <p className="truncate text-sm">{user?.email ?? t.notSignedIn}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-primary" />
          <div className="min-w-0">
            <p className="stencil">{t.savedCarLabel}</p>
            <p className="truncate text-sm">
              {car ? `${car.make} ${car.model} (${car.year})` : t.noSavedCar}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <Button asChild variant="secondary">
          <Link to="/garage">{t.manageCar}</Link>
        </Button>
        {user ? (
          <Button variant="outline" onClick={() => void supabase.auth.signOut()}>
            <LogOut className="size-4" /> {t.signOut}
          </Button>
        ) : (
          <Button asChild>
            <Link to="/auth">{t.authSignIn}</Link>
          </Button>
        )}
      </div>
    </main>
  );
}
