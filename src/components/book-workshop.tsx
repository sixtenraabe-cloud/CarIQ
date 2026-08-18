import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, ClipboardCopy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { currencyFor, useI18n } from "@/lib/i18n";
import { createWorkshopLead } from "@/lib/leads.functions";
import { workshopMessage } from "@/lib/diagnose.functions";
import type { CarProfile, DiagnosisResult } from "@/lib/diagnosis-types";

export function BookWorkshop({
  result,
  carLine,
  symptom,
  car,
  tags,
}: {
  result: DiagnosisResult;
  carLine: string;
  symptom: string;
  car: CarProfile | null;
  tags: string[];
}) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [wantsBooking, setWantsBooking] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!car) return;
    let active = true;
    setMessageLoading(true);
    setMessageError(false);
    workshopMessage({
      data: {
        car,
        tags,
        symptom,
        language: lang,
        currency: currencyFor(lang).currencyName,
        result: {
          verdict: result.verdict,
          headline: result.headline,
          confidence: result.confidence,
          mechanicNote: result.mechanicNote,
          causes: result.causes,
          checks: result.checks,
          advice: result.advice,
          estimatedCost: result.estimatedCost,
          lampName: result.lampName,
          lampMeaning: result.lampMeaning,
        },
      },
    })
      .then((res) => {
        if (active) setMessage(res.message);
      })
      .catch(() => {
        if (active) setMessageError(true);
      })
      .finally(() => {
        if (active) setMessageLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t.bookError);
    }
  }

  async function submit() {
    if (!name.trim() || !phone.trim() || !consent) {
      toast.error(t.bookRequired);
      return;
    }
    setSending(true);
    try {
      await createWorkshopLead({
        data: {
          partner: "other",
          carSummary: carLine,
          verdict: result.verdict,
          headline: result.headline,
          symptom,
          estimatedCost: result.estimatedCost,
          contactName: name.trim(),
          contactPhone: phone.trim(),
          contactEmail: user?.email ?? "",
          location: location.trim(),
          note: [note.trim(), message].filter(Boolean).join("\n\n").slice(0, 500),
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

      <div className="mt-4 space-y-2 rounded-xl border border-border bg-secondary/40 p-3">
        <p className="text-sm font-semibold">{t.bookMsgTitle}</p>
        <p className="text-xs text-muted-foreground">{t.bookMsgSub}</p>
        {messageLoading ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> {t.bookMsgLoading}
          </p>
        ) : messageError ? (
          <p className="text-xs text-destructive">{t.bookMsgError}</p>
        ) : message ? (
          <>
            <p className="whitespace-pre-line rounded-lg bg-background/60 p-3 text-sm">{message}</p>
            <Button variant="outline" size="sm" onClick={() => void copyMessage()}>
              <ClipboardCopy className="size-4" /> {copied ? t.bookCopied : t.bookCopy}
            </Button>
          </>
        ) : null}
      </div>

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
        </div>
      ) : wantsBooking !== true ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold">{t.bookAsk}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setWantsBooking(true)}>
              <CalendarCheck className="size-4" /> {t.bookYes}
            </Button>
            <Button variant="outline" onClick={() => setWantsBooking(false)}>
              {t.bookNo}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
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
