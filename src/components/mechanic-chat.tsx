import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mechanicChat } from "@/lib/diagnose.functions";
import type { CarProfile, ChatMessage, DiagnosisResult } from "@/lib/diagnosis-types";
import { currencyFor, useI18n } from "@/lib/i18n";

export function MechanicChat({
  car,
  tags,
  symptom,
  result,
}: {
  car: CarProfile;
  tags: string[];
  symptom: string;
  result: DiagnosisResult;
}) {
  const { t, lang } = useI18n();
  const ask = useServerFn(mechanicChat);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const started = useRef(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const payload = (history: ChatMessage[]) => ({
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
      messages: history,
    },
  });

  const send = async (history: ChatMessage[]) => {
    setLoading(true);
    setError(false);
    try {
      const { reply } = await ask(payload(history));
      setMessages([...history, { role: "assistant", content: reply }]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void send([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  const submit = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    void send([...messages, { role: "user", content: text }]);
  };

  return (
    <div className="panel border-l-4 border-primary p-4">
      <div className="flex items-center gap-2">
        <Wrench className="size-5 text-primary" />
        <p className="font-semibold">{t.chatMechanic}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t.chatSub}</p>

      <div className="mt-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
              message.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-secondary text-foreground"
            }`}
          >
            {message.content}
          </div>
        ))}
        {loading ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> {t.chatThinking}
          </p>
        ) : null}
        {error ? <p className="text-xs text-destructive">{t.chatError}</p> : null}
        <div ref={endRef} />
      </div>

      <div className="mt-4 flex items-end gap-2">
        <Textarea
          rows={2}
          maxLength={1000}
          value={input}
          placeholder={t.chatPlaceholder}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <Button type="button" size="icon" aria-label={t.chatSend} disabled={loading} onClick={submit}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}