import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { Car, Clock, Home, User } from "lucide-react";
import { LanguageProvider, useI18n } from "@/lib/i18n";
import { PaymentTestModeBanner } from "@/components/payment-test-banner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CarIQ — Din digitala bilmekaniker" },
      {
        name: "description",
        content: "Diagnostisera bilproblem med ljud, foto och intelligent AI-analys.",
      },
      { name: "author", content: "Lovable" },
      { name: "theme-color", content: "#0F172A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "CarIQ" },
      { property: "og:title", content: "CarIQ — Din digitala bilmekaniker" },
      { property: "og:description", content: "Diagnostisera bilproblem med ljud, foto och intelligent AI-analys." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "CarIQ — Din digitala bilmekaniker" },
      { name: "twitter:description", content: "Diagnostisera bilproblem med ljud, foto och intelligent AI-analys." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/lE1hyG4ER5bzDUP6vC0POLDY4GQ2/social-images/social-1785665111356-social-image.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/lE1hyG4ER5bzDUP6vC0POLDY4GQ2/social-images/social-1785665111356-social-image.webp" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "CarIQ",
          url: "https://cariq-test.lovable.app",
          inLanguage: "sv-SE",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "CarIQ",
          url: "https://cariq-test.lovable.app",
          logo: "https://storage.googleapis.com/gpt-engineer-file-uploads/lE1hyG4ER5bzDUP6vC0POLDY4GQ2/social-images/social-1785665111356-social-image.webp",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <PaymentTestModeBanner />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <div className="flex-1">
          <Outlet />
        </div>
        <SiteFooter />
        <TabBar />
      </div>
      </LanguageProvider>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

const TABS = [
  { to: "/", key: "navHome", icon: Home },
  { to: "/history", key: "navHistory", icon: Clock },
  { to: "/garage", key: "navGarage", icon: Car },
  { to: "/profil", key: "navProfile", icon: User },
] as const;

function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border px-4 pb-28 pt-6 text-center text-xs text-muted-foreground">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-medium">
        <Link to="/pris" className="underline underline-offset-2 hover:text-foreground">
          Priser
        </Link>
        <Link to="/villkor" className="underline underline-offset-2 hover:text-foreground">
          Villkor
        </Link>
        <Link to="/aterbetalning" className="underline underline-offset-2 hover:text-foreground">
          Återbetalning
        </Link>
        <Link to="/integritet" className="underline underline-offset-2 hover:text-foreground">
          Integritetspolicy
        </Link>
      </nav>
      <p className="mt-3">
        © {new Date().getFullYear()} CarIQ App. Betalningar hanteras av Paddle.com Market Ltd, vår
        Merchant of Record.
      </p>
    </footer>
  );
}

function TabBar() {
  const { t } = useI18n();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: tab.to === "/" }}
            className="flex flex-1 flex-col items-center gap-1 py-1 text-[11px] font-medium text-muted-foreground transition-colors [&.active]:text-primary"
          >
            <tab.icon className="size-5" />
            {t[tab.key]}
          </Link>
        ))}
      </div>
    </nav>
  );
}
