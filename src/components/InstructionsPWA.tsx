import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type PlatformKey =
  | "ios-safari"
  | "ios-other"
  | "android-chrome"
  | "desktop-chrome"
  | "desktop-safari"
  | "other";

interface PlatformOption {
  key: PlatformKey;
  label: string;
}

const PLATFORM_OPTIONS: PlatformOption[] = [
  { key: "ios-safari", label: "iPhone / iPad – Safari" },
  { key: "ios-other", label: "iPhone / iPad – muu brauser" },
  { key: "android-chrome", label: "Android – Chrome" },
  { key: "desktop-chrome", label: "Arvuti – Chrome / Edge" },
  { key: "desktop-safari", label: "Arvuti – Safari (Mac)" },
  { key: "other", label: "Muu seade või brauser" },
];

function detectPlatform(): PlatformKey {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent || "";

  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/i.test(ua);
  const isChrome = /Chrome|CriOS/i.test(ua) && !/Edge/i.test(ua);
  const isMac = /Macintosh/i.test(ua);

  if (isIOS && isSafari) return "ios-safari";
  if (isIOS && !isSafari) return "ios-other";
  if (isAndroid && isChrome) return "android-chrome";
  if (!isIOS && !isAndroid && isChrome) return "desktop-chrome";
  if (isMac && isSafari) return "desktop-safari";

  return "other";
}

function Instructions({ platform }: { platform: PlatformKey }) {
  if (platform === "ios-safari" || platform === "ios-other") {
    return (
      <ol className="list-decimal list-inside space-y-2 text-sm text-stone-200">
        <li>
          Vajuta brauseri <span className="font-semibold">Share / Jaga</span> nuppu (ruut ülespoole
          noolega).
        </li>
        <li>
          Kerige alla ja vali <span className="font-semibold">Add to Home Screen</span>.
        </li>
        <li>
          Kinnita nime valik ja vajuta <span className="font-semibold">Add / Lisa</span>.
        </li>
        <li>
          Nüüd leiad <span className="font-bold">Lauselt</span> oma telefoni avalehelt rakenduste
          hulgast.
        </li>
      </ol>
    );
  }

  if (platform === "android-chrome") {
    return (
      <ol className="list-decimal list-inside space-y-2 text-sm text-stone-200">
        <li>
          Vajuta paremal üleval <span className="font-semibold">kolme punkti</span> (menüü ikoon).
        </li>
        <li>
          Vali menüüst <span className="font-semibold">Add to Home screen</span> või „Install app“.
        </li>
        <li>
          Kinnita nime valik ja vajuta <span className="font-semibold">Add</span>.
        </li>
        <li>
          Nüüd leiad <span className="font-bold">Lauselt</span> oma telefoni avalehelt rakenduste
          hulgast.
        </li>
      </ol>
    );
  }

  if (platform === "desktop-chrome") {
    return (
      <ol className="list-decimal list-inside space-y-2 text-sm text-stone-200">
        <li>
          Vaata aadressiriba paremale – kui näed ikooni{" "}
          <span className="font-semibold">“Install app” / “Paigalda rakendus”</span>, vajuta seda.
        </li>
        <li>
          Vastasel juhul ava paremal üleval <span className="font-semibold">kolme punkti</span>{" "}
          menüü.
        </li>
        <li>
          Vali <span className="font-semibold">Install Lauselt</span> või{" "}
          <span className="font-semibold">Apps → Install this site as an app</span>.
        </li>
        <li>
          Järgi juhiseid – see lisab <span className="font-bold">Lauselt</span> sinu arvutisse
          eraldi rakendusena.
        </li>
      </ol>
    );
  }

  if (platform === "desktop-safari") {
    return (
      <ol className="list-decimal list-inside space-y-2 text-sm text-stone-200">
        <li>
          Ava ülemisest menüüst <span className="font-semibold">File</span>.
        </li>
        <li>
          Vali <span className="font-semibold">Add to Dock</span> (või sarnane valik, olenevalt
          Safari versioonist).
        </li>
        <li>
          Kinnita – <span className="font-bold">Lauselt</span> ilmub nüüd sinu Docki või
          rakendustena.
        </li>
      </ol>
    );
  }

  return (
    <div className="space-y-3 text-sm text-stone-200">
      <ol className="list-decimal list-inside space-y-2">
        <li>Otsi brauseri menüüst valikut nagu „Install app“ või „Add to Home screen“.</li>
        <li>
          Kui sellist valikut pole, vali all valikust seade, mis on sinu omale kõige sarnasem.
        </li>
        <li>
          Kui miski ei toimi, saad <span className="font-bold">Lauselt</span> alati avada tavalise
          veebilehena.
        </li>
      </ol>
    </div>
  );
}

export default function InstructionsPWA() {
  const navigate = useNavigate();
  const [detected, setDetected] = useState<PlatformKey>("other");
  const [selected, setSelected] = useState<PlatformKey>("other");

  useEffect(() => {
    const p = detectPlatform();
    setDetected(p);
    setSelected(p);
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-100 flex flex-col items-center px-6 py-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[50vw] h-[40vw] max-w-[400px] max-h-[300px] rounded-full bg-amber-900/4 blur-3xl animate-glow-drift-slow" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-8 text-sm text-stone-600 hover:text-stone-300 transition-colors duration-200 animate-fade-in"
        >
          ← Tagasi avalehele
        </button>

        <div className="glass rounded-2xl p-6 sm:p-8 animate-fade-in-up delay-1">
          <h1
            className="text-lg sm:text-xl font-semibold tracking-[0.12em] text-stone-200 mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Paigaldamine
          </h1>
          <p className="text-stone-500 text-sm mb-6 leading-relaxed">
            Lisa Lauselt oma seadme avalehele, et kasutada seda nagu tavalist rakendust.
          </p>

          <div className="border-t border-stone-700/40 pt-5">
            <Instructions platform={selected} />
          </div>

          <label
            className="block mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Vali seade:
            <select
              className="mt-2 w-full rounded-xl bg-stone-800/60 backdrop-blur-sm border border-stone-700/50 px-3 py-2.5 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-shadow duration-200"
              value={selected}
              onChange={(e) => setSelected(e.target.value as PlatformKey)}
            >
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
