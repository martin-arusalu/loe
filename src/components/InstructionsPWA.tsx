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
          Ava <span className="font-bold">Lauselt</span> oma iPhone’i või iPadi brauseris.
        </li>
        <li>
          Vajuta brauseri <span className="font-semibold">Share / Jaga</span> nuppu
          (ruut ülespoole noolega).
        </li>
        <li>
          Kerige alla ja vali <span className="font-semibold">Add to Home Screen</span>.
        </li>
        <li>
          Kinnita nime valik ja vajuta <span className="font-semibold">Add</span>.
        </li>
        <li>
          Nüüd saad <span className="font-bold">Lauselt</span> rakenduse avada nagu tavalise
          rakenduse avalehelt.
        </li>
      </ol>
    );
  }

  if (platform === "android-chrome") {
    return (
      <ol className="list-decimal list-inside space-y-2 text-sm text-stone-200">
        <li>
          Ava <span className="font-bold">Lauselt</span> Chrome’i brauseris.
        </li>
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
          Ava <span className="font-bold">Lauselt</span> Chrome’i või Edge’i brauseris.
        </li>
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
          eraldi aknana.
        </li>
      </ol>
    );
  }

  if (platform === "desktop-safari") {
    return (
      <ol className="list-decimal list-inside space-y-2 text-sm text-stone-200">
        <li>
          Ava <span className="font-bold">Lauselt</span> Maci Safaris.
        </li>
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
      <p>Kui sinu seadet ei tuvastatud täpselt, proovi järgmist:</p>
      <ol className="list-decimal list-inside space-y-2">
        <li>Otsi brauseri menüüst valikut nagu „Install app“ või „Add to Home screen“.</li>
        <li>
          Kui sellist valikut pole, vali ülal valikust seade, mis on sinu omale kõige sarnasem.
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

  const detectedLabel =
    PLATFORM_OPTIONS.find((p) => p.key === detected)?.label ?? "Määramata seade või brauser";

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-xl">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center text-sm text-stone-400 hover:text-stone-200 transition-colors"
        >
          <span className="mr-1">←</span> Tagasi avalehele
        </button>

        <div className="rounded-3xl border border-stone-800 bg-stone-950/60 p-6 sm:p-8 shadow-lg shadow-black/30">
          <h1 className="text-xl sm:text-2xl font-semibold mb-2">
            Kuidas kasutada <span className="font-bold">Lauselt</span> rakendusena
          </h1>
          <p className="text-stone-400 text-sm sm:text-base mb-6">
            Lisa <span className="font-bold">Lauselt</span> oma seadme avalehele, et kasutada seda
            nagu tavalist rakendust – täisekraanil ja kiirelt kättesaadavana.
          </p>

          <div className="mb-6 space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Sinu seade</p>
            <p className="text-xs text-stone-400">
              Automaatselt tuvastatud:{" "}
              <span className="font-medium text-stone-200">{detectedLabel}</span>
            </p>
          </div>

          <label className="block mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Vali juhised
            <select
              className="mt-2 w-full rounded-xl bg-stone-900 border border-stone-700 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500/80"
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

          <div className="mt-4 border-t border-stone-800 pt-4">
            <Instructions platform={selected} />
          </div>
        </div>
      </div>
    </div>
  );
}
