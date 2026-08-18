import { useState } from "react";
import { CalendarCheck, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { createWorkshopLead } from "@/lib/leads.functions";
import type { DiagnosisResult } from "@/lib/diagnosis-types";

type Partner = "mekonomen" | "mekanum" | "other";

const PARTNERS: { id: Partner; name: string; url: string }[] = [
  {
    id: "mekonomen",
    name: "Mekonomen",
    url: "https://www.mekonomen.se/boka-tid?utm_source=cariq&utm_medium=referral&utm_campaign=diagnos",
  },
  {
    id: "mekanum",
    name: "Mekanum",
    url: "https://www.mekanum.se/?utm_source=cariq&utm_medium=referral&utm_campaign=diagnos",
  },
  { id: "other", name: "", url: "" },
];

export function BookWorkshop({
  result,
  carLine,
  symptom,
}: {
  result: DiagnosisResult;
  carLine: string;
  symptom: string;
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [partner, setPartner] = useState<Partner>("mekonomen");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const chosen = PARTNERS.find((p) => p.id === partner)!;

  async function submit() {
    if (!name.trim() || !phone.trim() || !consent) {
      toast.error(t.bookRequired);
      return;
    }
    setSending(true);
    try {
      await createWorkshopLead({
        data: {
          partner,
          carSummary: carLine,
          verdict: result.verdict,
          headline: result.headline,
          symptom,
          estimatedCost: result.estimatedCost,
          contactName: name.trim(),
          contactPhone: phone.trim(),
          contactEmail: user?.email ?? "",
          location: location.trim(),
          note: note.trim(),
          consent: true,
        },
      });
      setSent(true);
      toast.success(t.bookSent);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.bookError);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="surface border-l-4 border-primary p-5">
      <div className="mb-1 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/12 text-primary">
          <CalendarCheck className="size-4" />
        </span>
        <p className="stencil">{t.bookTitle}</p>
      </div>
      <p className="text-sm text-muted-foreground">{t.bookSub}</p>

      {!user ? (
        <Button asChild className="mt-4 w-full">
          <Link to="/auth">{t.bookSignIn}</Link>
        </Button>
      ) : sent ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-signal-safe/50 bg-signal-safe/10 p-3 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-signal-safe" />
            <span>{t.bookSentSub}</span>
          </div>
          {chosen.url ? (
            <Button asChild variant="outline" className="w-full">
              <a href={chosen.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" /> {t.bookOpenPartner} {chosen.name}
              </a>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {PARTNERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPartner(p.id)}
                className={`rounded-lg border px-2 py-2 text-sm font-semibold transition-colors ${
                  partner === p.id
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-secondary/50 text-muted-foreground"
                }`}
              >
                {p.id === "other" ? t.bookOther : p.name}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="lead-name">{t.bookName}</Label>
              <Input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="lead-phone">{t.bookPhone}</Label>
              <Input
                id="lead-phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lead-loc">{t.bookLocation}</Label>
            <Input id="lead-loc" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="lead-note">{t.bookNote}</Label>
            <Textarea
              id="lead-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 size-4 accent-[hsl(var(--primary))]"
            />
            <span>{t.bookConsent}</span>
          </label>

          <Button className="w-full" disabled={sending} onClick={() => void submit()}>
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t.bookSending}
              </>
            ) : (
              <>
                <CalendarCheck className="size-4" /> {t.bookSubmit}
              </>
            )}
          </Button>
        </div>
      )}
    </section>
  );
}
