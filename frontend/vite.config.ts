import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const frontendReact = fileURLToPath(new URL("./node_modules/react", import.meta.url));
const frontendReactDom = fileURLToPath(new URL("./node_modules/react-dom", import.meta.url));
const frontendReactJsxRuntime = fileURLToPath(new URL("./node_modules/react/jsx-runtime.js", import.meta.url));
const frontendReactJsxDevRuntime = fileURLToPath(new URL("./node_modules/react/jsx-dev-runtime.js", import.meta.url));
const frontendReactDomClient = fileURLToPath(new URL("./node_modules/react-dom/client.js", import.meta.url));
const frontendReactDomServer = fileURLToPath(new URL("./node_modules/react-dom/server.js", import.meta.url));

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom", "react-router"],
    alias: {
      react: frontendReact,
      "react/jsx-runtime": frontendReactJsxRuntime,
      "react/jsx-dev-runtime": frontendReactJsxDevRuntime,
      "react-dom": frontendReactDom,
      "react-dom/client": frontendReactDomClient,
      "react-dom/server": frontendReactDomServer,
    },
  },
  ssr: {
    noExternal: ["react-router"],
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
