import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// A stale deploy can leave the browser pointing at chunk URLs that no longer
// exist ("Importing a module script failed" + blank screen). Reload once so the
// fresh asset manifest is picked up.
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    const key = "cariq:chunk-reload";
    const last = Number(window.sessionStorage.getItem(key) ?? 0);
    // Guard against a reload loop when the chunk is genuinely gone.
    if (Date.now() - last < 15000) return;
    window.sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
