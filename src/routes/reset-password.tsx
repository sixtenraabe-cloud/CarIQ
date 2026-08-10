import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Återställ lösenord — CarIQ" },
      {
        name: "description",
        content: "Välj ett nytt lösenord för ditt CarIQ-konto och kom tillbaka till dina bildiagnoser.",
      },
      { property: "og:title", content: "Återställ lösenord — CarIQ" },
      { property: "og:description", content: "Välj ett nytt lösenord för ditt CarIQ-konto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      setValid(ok);
      setReady(true);
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) finish(true);
    });

    void supabase.auth.getSession().then(({ data: current }) => {
      if (current.session) finish(true);
    });

    // Give supabase-js time to exchange the code/hash from the email link.
    const timer = window.setTimeout(() => finish(false), 3000);

    return () => {
      window.clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t.passwordUpdated);
      void navigate({ to: "/history" });
    } catch (error) {
      const msg = error instanceof Error ? error.message.toLowerCase() : "";
      if (msg.includes("pwned") || msg.includes("weak") || msg.includes("password should be")) {
        toast.error(t.weakPassword);
      } else {
        toast.error(error instanceof Error ? error.message : t.authFailed);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="px-4 pt-8">
      <p className="stencil">{t.authKicker}</p>
      <h1 className="mt-1 text-3xl">{t.resetTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t.resetSub}</p>

      {!ready ? (
        <div className="panel mt-6 p-5 text-sm text-muted-foreground">…</div>
      ) : !valid ? (
        <div className="panel mt-6 space-y-4 p-5">
          <p className="text-sm text-muted-foreground">{t.resetLinkInvalid}</p>
          <Button className="w-full" onClick={() => void navigate({ to: "/auth" })}>
            {t.backToSignIn}
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="panel mt-6 space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="new-password">{t.newPasswordLabel}</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {t.updatePassword}
          </Button>
        </form>
      )}
    </main>
  );
}