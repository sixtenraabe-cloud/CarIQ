import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { LanguagePicker } from "@/components/language-picker";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Logga in — CarIQ" },
      {
        name: "description",
        content: "Skapa ett konto eller logga in för att spara dina bildiagnoser i CarIQ.",
      },
      { property: "og:title", content: "Logga in — CarIQ" },
      { property: "og:description", content: "Spara och följ dina AI-diagnoser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://cariq-test.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://cariq-test.lovable.app/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [existingEmail, setExistingEmail] = useState<string | null>(null);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (user) void navigate({ to: "/" });
  }, [user, navigate]);

  const friendlyError = (error: unknown) => {
    const raw = error instanceof Error ? error.message : "";
    const msg = raw.toLowerCase();
    if (msg.includes("pwned") || msg.includes("weak") || msg.includes("password should be")) {
      return t.weakPassword;
    }
    if (msg.includes("invalid login credentials")) return t.invalidCredentials;
    if (msg.includes("email not confirmed")) return t.emailNotConfirmed;
    return raw || t.authFailed;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) {
          if (error.message.toLowerCase().includes("already registered")) {
            setExistingEmail(email);
            return;
          }
          throw error;
        }
        // Supabase returns a user with an empty identities array when the
        // email already belongs to a confirmed account.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setExistingEmail(email);
          return;
        }
        if (data.session) {
          toast.success(t.welcomeBack);
        } else {
          setPendingEmail(email);
          toast.success(t.checkEmail);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t.welcomeBack);
      }
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (!email) {
      toast.error(t.emailLabel);
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSentTo(email);
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!pendingEmail) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
      toast.success(t.resendSent);
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(t.googleFailed);
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  };

  return (
    <main className="px-4 pt-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="stencil">{t.authKicker}</p>
          <h1 className="mt-1 text-3xl">{mode === "signin" ? t.authSignIn : t.authSignUp}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.authSub}</p>
        </div>
        <LanguagePicker />
      </div>

      {existingEmail ? (
        <div className="panel space-y-4 p-5">
          <h2 className="text-xl">{t.accountExists}</h2>
          <p className="text-sm text-muted-foreground">{existingEmail}</p>
          <Button
            className="w-full"
            onClick={() => {
              setExistingEmail(null);
              setMode("signin");
            }}
          >
            {t.goToSignIn}
          </Button>
          <button
            type="button"
            onClick={() => void forgotPassword()}
            disabled={busy}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {t.forgotPassword}
          </button>
        </div>
      ) : resetSentTo ? (
        <div className="panel space-y-4 p-5">
          <h2 className="text-xl">{t.resetSentTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {t.resetSentBody.replace("{email}", resetSentTo)}
          </p>
          <button
            type="button"
            onClick={() => {
              setResetSentTo(null);
              setMode("signin");
            }}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {t.backToSignIn}
          </button>
        </div>
      ) : pendingEmail ? (
        <div className="panel space-y-4 p-5">
          <h2 className="text-xl">{t.confirmTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {t.confirmBody.replace("{email}", pendingEmail)}
          </p>
          <Button className="w-full" onClick={() => void resend()} disabled={busy}>
            {t.resendEmail}
          </Button>
          <button
            type="button"
            onClick={() => {
              setPendingEmail(null);
              setMode("signin");
            }}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {t.backToSignIn}
          </button>
        </div>
      ) : (
      <form onSubmit={submit} className="panel space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="email">{t.emailLabel}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t.passwordLabel}</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {mode === "signin" ? t.authSignIn : t.authSignUp}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => void google()}>
          {t.continueGoogle}
        </Button>
        {mode === "signin" ? (
          <button
            type="button"
            onClick={() => void forgotPassword()}
            disabled={busy}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {t.forgotPassword}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? t.toSignUp : t.toSignIn}
        </button>
      </form>
      )}
    </main>
  );
}
