import React from "react";
import { createRoot } from "react-dom/client";

import "./styles/base.css";
import "./styles/tokens.css";
import "./styles/app.css";
import App from "./app/App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
