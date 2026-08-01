import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Mail, Minus, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

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
  const { car, saveCar } = useCar();
  const { t } = useI18n();
  const navigate = useNavigate();

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
          <div className="min-w-0 flex-1">
            <p className="stencil">{t.savedCarLabel}</p>
            <p className="truncate text-sm">
              {car ? `${car.make} ${car.model} (${car.year})` : t.noSavedCar}
            </p>
          </div>
          {car ? (
            <Button
              size="icon"
              variant="outline"
              aria-label={t.removeCarMinus}
              title={t.removeCarMinus}
              onClick={() => {
                saveCar(null);
                toast.success(t.carRemoved);
              }}
            >
              <Minus className="size-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              aria-label={t.addCarPlus}
              title={t.addCarPlus}
              onClick={() => void navigate({ to: "/garage" })}
            >
              <Plus className="size-4" />
            </Button>
          )}
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
