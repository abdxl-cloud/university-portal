import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

// Every screen renders inside the `.fb-app` shell (theme, detail layer, tweaks).
// Routes are added here as each feature is ported over from prototype/.
export default [
  layout("shell.tsx", [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
  ]),
] satisfies RouteConfig;
