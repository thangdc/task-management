import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "frappe-gantt/dist/frappe-gantt.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);