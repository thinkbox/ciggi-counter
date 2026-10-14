// Browser entry. This file runs once when the page loads.
// createRoot attaches the React app to the empty <div id="root"> in index.html.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import { migrateFromLocalStorage } from "./migrate.js";
import "./index.css";

if (!window.location.hash) {
  window.location.hash = "#/";
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: { retry: false },
  },
});

await migrateFromLocalStorage();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
