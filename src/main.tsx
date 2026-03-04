import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import * as amplitude from "@amplitude/analytics-browser";
import * as Sentry from "@sentry/react";
import "./app/globals.css";
import App from "./App";


registerSW({ immediate: true });

Sentry.init({
  dsn:
    "https://9178d0ea321862f1b95e94a36240aa69@o4510970097958912.ingest.de.sentry.io/4510970099531856",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});

amplitude.init("8f28bd7687521f98bbf342a0a78ee136", {
  "autocapture": {
    "attribution": true,
    "fileDownloads": true,
    "formInteractions": true,
    "pageViews": true,
    "sessions": true,
    "elementInteractions": true,
    "networkTracking": true,
    "webVitals": true,
    "frustrationInteractions": {
      "thrashedCursor": true,
      "errorClicks": true,
      "deadClicks": true,
      "rageClicks": true,
    },
  },
  "serverZone": "EU",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
