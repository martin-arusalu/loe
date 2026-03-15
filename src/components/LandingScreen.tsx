import {
  Upload,
  BookmarkCheck,
  Flame,
  LibraryBig,
  MonitorSmartphone,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useIsPWA } from "../hooks/isPwa";

export default function LandingScreen() {
  const isPWA = useIsPWA();
  // const loginAsMainCta = !!isPWA
  const loginAsMainCta = true; // for now always show login first

  return (
    <div className="min-h-screen text-stone-100 flex flex-col relative overflow-hidden">
      {/* ── Top dark section (hero) ───────────────────────── */}
      <div className="relative bg-[#0c0a09]">
        {/* Animated decorative glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[70vw] h-[45vw] max-w-[600px] max-h-[350px] rounded-full bg-amber-700/8 blur-3xl animate-glow-drift" />
          <div className="absolute top-[10%] right-[-5%] w-[30vw] h-[30vw] max-w-[250px] max-h-[250px] rounded-full bg-amber-900/6 blur-3xl animate-glow-drift-slow" />
        </div>

        <header className="relative z-10 flex flex-col items-center text-center select-none pt-16 sm:pt-24 lg:pt-32 pb-20 sm:pb-28 lg:pb-36 px-6">
          {/* App icon */}
          <div className="mb-6 sm:mb-8 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl glass-amber flex items-center justify-center animate-fade-in-scale animate-float">
            <BookOpen size={26} className="text-amber-400/90 sm:w-7 sm:h-7" />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-[0.5em] text-stone-300 mb-4 sm:mb-5 animate-fade-in-up delay-1">
            Lauselt
          </h1>
          <p className="text-stone-400 text-base sm:text-lg lg:text-xl max-w-lg leading-relaxed animate-fade-in-up delay-2">
            Kasuta väikseid hetki, et saada palju loetud.
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

        {/* ── Description + CTA ─────────────────────────── */}
        <div className="relative z-10 flex flex-col items-center px-6 pt-10 sm:pt-14">
          <p className="text-stone-400 text-sm sm:text-base leading-relaxed text-center max-w-md lg:max-w-lg mb-8 sm:mb-10 animate-fade-in-up delay-3">
            Loe raamatuid väikeste lõikudena — täpselt nii kiiresti kui ise tahad. Avasta
            olemasolevaid Eesti klassikuid või lae üles oma raamat.
          </p>

          {loginAsMainCta ? (
            <div className="animate-fade-in-up delay-4 flex flex-col items-center">
              <Link
                to="/login"
                aria-label="Logi sisse ja alusta lugemist"
                className="btn-primary w-full max-w-xs sm:max-w-sm rounded-2xl
                           text-stone-900 font-semibold px-8 py-3.5 sm:py-4 text-base sm:text-lg
                           cursor-pointer text-center"
              >
                Logi sisse ja alusta lugemist
              </Link>

              <p className="text-stone-500 text-xs sm:text-sm mt-3.5">
                Lugemine algab esimesest lausest.
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
                Lugemine algab esimesest lausest.
              </p>
            </div>
          )}
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
          <div className="flex flex-wrap items-center justify-center gap-4 text-stone-500 text-xs sm:text-sm">
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
