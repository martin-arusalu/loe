import { useState, useEffect } from "react";
import {
  Upload,
  BookmarkCheck,
  Flame,
  LibraryBig,
  MonitorSmartphone,
  BookOpen,
  ArrowDown,
  Scroll,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useIsPWA } from "../hooks/isPwa";

const DEMO_CHUNKS = [
  "Kui Arno isaga koolimajja jõudis, olid tunnid juba alanud.",
  "Kooliõpetaja kutsus mõlemad oma tuppa, rääkis nendega natuke aega, käskis Arnot hoolas ja korralik olla, ja seadis ta siis pinki ühe pikkade juustega poisi kõrvale istuma.",
  "Siis andis kooliõpetaja talle raamatust midagi kirjutada ja Arnol ei olnud nüüd enam aega muu peale mõtelda.",
  "Ta võttis tahvli ja hakkas kirjutama. Kui ta umbes paar rida oli kirjutanud, kummardas pikkade juustega poiss tema kõrva juurde ja küsis sosinal:",
  "“Mis koolmeister ütles, kui teie tema toas olite?”",
  "Arno teadis, et tunni ajal kõnelda ei tohi, vaatas esiti aralt kooliõpetaja poole ja vastas siis:",
];

export default function LandingScreen() {
  const isPWA = useIsPWA();
  const loginAsMainCta = true;
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoVisible, setDemoVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoVisible(false);
      setTimeout(() => {
        setDemoIndex((i) => (i + 1) % DEMO_CHUNKS.length);
        setDemoVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen text-stone-100 flex flex-col relative overflow-hidden">
      {/* ── Top dark section (hero) ───────────────────────── */}
      <div className="relative bg-[#0c0a09]">
        {/* Animated decorative glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[70vw] h-[45vw] max-w-[600px] max-h-[350px] rounded-full bg-amber-700/8 blur-3xl animate-glow-drift" />
          <div className="absolute top-[10%] right-[-5%] w-[30vw] h-[30vw] max-w-[250px] max-h-[250px] rounded-full bg-amber-900/6 blur-3xl animate-glow-drift-slow" />
        </div>

        <header className="relative z-10 flex flex-col items-center text-center select-none pt-16 sm:pt-24 lg:pt-28 pb-20 sm:pb-28 lg:pb-32 px-6">
          {/* App icon */}
          <img
            src="/favicon.svg"
            alt="Lauselt"
            className="mb-6 sm:mb-8 w-14 h-14 sm:w-16 sm:h-16 animate-fade-in-scale animate-float"
          />

          <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-[0.5em] text-stone-300 mb-4 sm:mb-5 animate-fade-in-up delay-1">
            Lauselt
          </h1>
          <p className="text-amber-400/80 text-base sm:text-lg lg:text-xl max-w-lg leading-relaxed animate-fade-in-up delay-2 font-medium">
            Loe raamatuid üks lõik korraga.
          </p>
          <p className="text-stone-500 text-sm sm:text-base max-w-md leading-relaxed mt-3 animate-fade-in-up delay-3">
            Nagu TikTok, aga raamatute jaoks — keri alla ja loe järgmine lõik. Ideaalne
            bussipeatuses, järjekorras või enne uinumist.
          </p>
        </header>

        {/* Curved transition */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden" aria-hidden="true">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            preserveAspectRatio="none"
            className="w-full h-8 sm:h-12 block"
          >
            <path d="M0,60 C480,0 960,0 1440,60 L1440,60 L0,60 Z" fill="#1c1917" />
          </svg>
        </div>
      </div>

      {/* ── Warm body section ─────────────────────────────── */}
      <div className="relative bg-stone-900 flex-1">
        {/* Animated warm texture glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-20 right-[-10%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full bg-amber-900/6 blur-3xl animate-glow-drift-slow" />
          <div className="absolute bottom-40 left-[-5%] w-[30vw] h-[30vw] max-w-[300px] max-h-[300px] rounded-full bg-stone-600/6 blur-3xl animate-glow-drift" />
        </div>

        {/* ── CTA ─────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col items-center px-6 mt-12 sm:mt-16">
          {loginAsMainCta ? (
            <div className="animate-fade-in-up delay-4 flex flex-col items-center">
              <Link
                to="/login"
                aria-label="Logi sisse ja alusta lugemist"
                className="btn-primary w-full max-w-xs sm:max-w-sm rounded-2xl
                           text-stone-900 font-semibold px-8 py-3.5 sm:py-4 text-base sm:text-lg
                           cursor-pointer text-center"
              >
                Alusta lugemist — tasuta
              </Link>

              <p className="text-stone-500 text-xs sm:text-sm mt-3.5">
                Konto loomine võtab 5 sekundit.
              </p>

              <Link
                to="/kuidas-kasutada"
                className="mt-4 text-xs sm:text-sm text-amber-400/70 hover:text-amber-300 transition-colors duration-200"
              >
                Kuidas paigaldada rakendusena?
              </Link>
            </div>
          ) : (
            <div className="animate-fade-in-up delay-4 flex flex-col items-center w-full">
              <Link
                to="/kuidas-kasutada"
                aria-label="Paigalda Lauselt rakendus"
                className="btn-primary w-full max-w-xs sm:max-w-sm rounded-2xl
                           text-stone-900 font-semibold py-3.5 sm:py-4 text-base sm:text-lg
                           cursor-pointer text-center"
              >
                Paigalda Lauselt rakendus
              </Link>

              <Link
                to="/login"
                aria-label="Logi sisse olemasoleva kontoga"
                className="mt-4 w-full max-w-xs sm:max-w-sm rounded-2xl glass
                           text-stone-100 font-medium py-3 text-sm sm:text-base
                           hover:border-stone-500 hover:bg-stone-800/60 transition-all duration-200 cursor-pointer text-center"
              >
                Logi sisse või registreeri
              </Link>

              <p className="text-stone-500 text-xs sm:text-sm mt-3.5">
                Konto loomine võtab 5 sekundit.
              </p>
            </div>
          )}
        </div>

        {/* ── Interactive demo + How it works ──────────── */}
        <div className="relative z-10 w-full px-6 pt-10 sm:pt-14 flex justify-center">
          <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 items-center">
            {/* Interactive demo column */}
            <div className="flex flex-col items-center">
              <div className="w-full max-w-xs animate-fade-in-up delay-5">
                {/* Phone mockup */}
                <div className="relative mx-auto w-[220px] sm:w-[250px]">
                  <div className="rounded-[28px] border-2 border-stone-700/40 bg-stone-950 p-3 shadow-2xl shadow-black/40">
                    {/* Status bar */}
                    <div className="flex justify-between items-center px-2 mb-3">
                      <div className="w-8 h-1 rounded-full bg-stone-800" />
                      <div className="w-12 h-3 rounded-full bg-stone-800" />
                      <div className="w-8 h-1 rounded-full bg-stone-800" />
                    </div>
                    {/* Progress bar */}
                    <div className="h-0.5 bg-stone-800 rounded-full mb-4 mx-1">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${((demoIndex + 1) / DEMO_CHUNKS.length) * 100}%` }}
                      />
                    </div>
                    {/* Chunk content */}
                    <div className="min-h-[120px] sm:min-h-[140px] flex items-center justify-center px-3">
                      <p
                        className={`text-stone-200 text-sm sm:text-[15px] leading-relaxed font-serif text-left transition-all duration-400 ${
                          demoVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
                        }`}
                      >
                        {DEMO_CHUNKS[demoIndex]}
                      </p>
                    </div>
                    {/* Chunk counter */}
                    <div className="text-center mt-3 mb-2">
                      <span className="text-stone-600 text-[10px] tabular-nums">
                        {demoIndex + 1} / {DEMO_CHUNKS.length}
                      </span>
                    </div>
                    {/* Scroll hint */}
                    <div className="flex justify-center pb-1">
                      <ArrowDown size={12} className="text-stone-700 animate-bounce" />
                    </div>
                  </div>
                  {/* Reflection glow */}
                  <div
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-amber-500/5 blur-2xl rounded-full"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-stone-600 text-xs text-center mt-4">Keri alla → järgmine lõik</p>
              </div>
            </div>

            {/* How it works column */}
            <div>
              <h2
                className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500 text-center md:text-left mb-8 animate-fade-in-up delay-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Kuidas see toimib
              </h2>
              <div className="flex flex-col gap-6">
                {[
                  {
                    step: "1",
                    Icon: BookOpen,
                    title: "Vali raamat või lae üles oma",
                    desc: "Eesti klassikud on juba olemas. Või impordi oma EPUB fail.",
                  },
                  {
                    step: "2",
                    Icon: Scroll,
                    title: "Loe üks lõik korraga",
                    desc: "Raamat on jagatud väikesteks osadeks. Keri alla — loe järgmine.",
                  },
                  {
                    step: "3",
                    Icon: Target,
                    title: "Ehita lugemisharjumus",
                    desc: "Päevane eesmärk ja seeria hoiavad sind järjel.",
                  },
                ].map(({ step, Icon, title, desc }, i) => (
                  <div
                    key={step}
                    className={`flex items-start gap-4 animate-fade-in-up`}
                    style={{ animationDelay: `${500 + i * 120}ms` }}
                  >
                    <div className="w-10 h-10 rounded-xl glass-amber flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-amber-400/80" />
                    </div>
                    <div>
                      <h3 className="text-stone-200 text-sm font-semibold mb-0.5">{title}</h3>
                      <p className="text-stone-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature cards ─────────────────────────────── */}
        <div className="relative z-10 w-full px-6 mt-14 sm:mt-20 lg:mt-24 flex justify-center">
          <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Free card */}
            <section
              aria-labelledby="free-heading"
              className="group glass rounded-2xl sm:rounded-3xl
                         px-6 py-6 sm:px-7 sm:py-7
                         flex flex-col gap-5
                         card-hover
                         animate-fade-in-up delay-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-700/40 flex items-center justify-center group-hover:bg-stone-700/60 transition-colors duration-300">
                  <Upload size={14} className="text-stone-300" aria-hidden="true" />
                </div>
                <h2
                  id="free-heading"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Tasuta kasutajana saad
                </h2>
              </div>

              <ul className="flex flex-col gap-4" role="list">
                {[
                  {
                    Icon: Upload,
                    text: "Importida oma raamatu (raamat salvestub sinu seadmesse).",
                  },
                  {
                    Icon: BookmarkCheck,
                    text: "Jätkata pooleli jäänud kohast (progress sünkib kontoga).",
                  },
                ].map(({ Icon, text }) => (
                  <li
                    key={text}
                    className="flex items-start gap-3 text-stone-300 text-sm leading-relaxed"
                  >
                    <Icon size={16} className="mt-0.5 shrink-0 text-stone-500" aria-hidden="true" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Premium card */}
            <section
              aria-labelledby="premium-heading"
              className="group relative glass-amber rounded-2xl sm:rounded-3xl
                         px-6 py-6 sm:px-7 sm:py-7
                         flex flex-col gap-5 overflow-hidden
                         card-hover
                         animate-fade-in-up delay-6"
            >
              {/* Animated amber glow */}
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-500/8 blur-2xl
                           group-hover:bg-amber-500/15 transition-all duration-700 animate-glow-drift-slow"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-gradient-to-br from-amber-800/6 via-transparent to-transparent pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg bg-amber-800/20 border border-amber-600/15 flex items-center justify-center
                              group-hover:bg-amber-800/30 group-hover:border-amber-500/25 transition-all duration-300"
                >
                  <Flame size={14} className="text-amber-400/80" aria-hidden="true" />
                </div>
                <h2
                  id="premium-heading"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-gradient-amber"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Lauselt+
                </h2>
              </div>

              <ul className="relative flex flex-col gap-4" role="list">
                {[
                  {
                    Icon: Flame,
                    text: "Tekita järjepidev lugemisharjumus (päevas vähemalt 50 lõiku).",
                  },
                  {
                    Icon: LibraryBig,
                    text: "Ligipääs valitud raamatutele (toimetatud ja kontrollitud).",
                  },
                  {
                    Icon: MonitorSmartphone,
                    text: "Raamatud igas seadmes (ei pea eraldi importima).",
                  },
                ].map(({ Icon, text }) => (
                  <li
                    key={text}
                    className="flex items-start gap-3 text-stone-300 text-sm leading-relaxed"
                  >
                    <Icon
                      size={16}
                      className="mt-0.5 shrink-0 text-amber-400/70"
                      aria-hidden="true"
                    />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <footer className="relative z-10 mt-14 sm:mt-20 pb-10 sm:pb-14 flex flex-col items-center gap-2">
          <div
            className="w-8 h-px bg-gradient-to-r from-transparent via-stone-700/50 to-transparent mb-5"
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-stone-500 text-xs sm:text-sm">
            <Link to="/privacy" className="hover:text-stone-300 transition-colors duration-200">
              Privaatsus
            </Link>
            <span aria-hidden="true" className="text-stone-700">
              ·
            </span>
            <Link to="/terms" className="hover:text-stone-300 transition-colors duration-200">
              Kasutustingimused
            </Link>
            <span aria-hidden="true" className="text-stone-700">
              ·
            </span>
            <Link
              to="/kuidas-kasutada"
              className="hover:text-stone-300 transition-colors duration-200"
            >
              Kuidas kasutada rakendusena
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
