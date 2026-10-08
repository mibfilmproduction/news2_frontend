
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { QueryProvider } from "./lib/react-query";

// Sentry loads AFTER first paint — never blocks FCP/LCP on the critical path
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  import("./lib/sentry").then(({ initSentry }) => initSentry()).catch(() => {});
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <App />
      <Toaster />
    </QueryProvider>
  </React.StrictMode>,
);

// If you want your app to work offline and load faster, you can enable PWA functionality
// by uncommenting the line below. Learn more: https://web.dev/progressive-web-apps/
if (import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true') {
  serviceWorkerRegistration.register({
    onSuccess: () => console.log('mibDaily News is now available offline.'),
    onUpdate: (reg) => {
      console.log('New version available! Ready to update.');
      // Optional: You could show a notification to the user here
      // asking them to refresh to get the new version
    }
  });
}
