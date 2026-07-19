import type { Config } from "@react-router/dev/config";

// SPA mode. The portal reads `window`/`localStorage` during render and ships as
// static files behind nginx, so there is no server to render on. Turning SSR
// back on requires making those reads client-only first.
export default {
  ssr: false,
} satisfies Config;
