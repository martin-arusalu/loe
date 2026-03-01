import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import { GlobalWorkerOptions } from "pdfjs-dist";
import './app/globals.css';
import App from './App';

Sentry.init({
  dsn: "https://9178d0ea321862f1b95e94a36240aa69@o4510970097958912.ingest.de.sentry.io/4510970099531856",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
