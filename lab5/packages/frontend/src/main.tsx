import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./app/App";

const queryClient = new QueryClient();

async function enableMocking() {
  console.log("Running app...");

  if (
    import.meta.env.MODE !== "development" ||
    import.meta.env.VITE_USE_MOCK !== "true"
  ) {
    console.log("Run successfully!");

    return;
  }

  console.log("[MOCK] Run with mocks!");

  const { worker } = await import("./mocks/browser");
  await worker.start();
}

enableMocking().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
});
