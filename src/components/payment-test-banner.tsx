import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;

  return (
    <div className="w-full border-b border-signal-caution/40 bg-signal-caution/15 px-4 py-2 text-center text-xs text-signal-caution">
      Alla betalningar i förhandsvisningen är i testläge.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold underline"
      >
        Läs mer
      </a>
    </div>
  );
}
