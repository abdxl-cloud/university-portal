import * as React from "react";

import "../../../prototype/src/styles/base.css";
import "../../../prototype/src/styles/tokens.css";
import "../../../prototype/src/styles/app.css";

export function meta() {
  return [
    { title: "University Portal Prototype" },
    { name: "description", content: "Interactive university portal prototype" },
  ];
}

export default function PrototypeRoute() {
  const [PrototypeApp, setPrototypeApp] = React.useState<React.ComponentType | null>(null);

  React.useEffect(() => {
    let mounted = true;
    import("../../../prototype/src/app/App.jsx").then((module) => {
      if (mounted) setPrototypeApp(() => module.default);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!PrototypeApp) {
    return <div style={{ minHeight: "100vh", background: "var(--bg)" }} />;
  }

  return <PrototypeApp />;
}
