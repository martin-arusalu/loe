import { useRef } from "react";
import {
  Upload,
  BookmarkCheck,
  Flame,
  LibraryBig,
  MonitorSmartphone,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";

interface LandingScreenProps {
  onLogin: () => void;
}

export default function LandingScreen({ onLogin }: LandingScreenProps) {
  const premiumRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen text-stone-100 flex flex-col relative overflow-hidden">
      {/* ── Top dark section (hero) ───────────────────────── */}
      <div className="relative bg-[#0c0a09]">
        {/* Decorative glow in hero */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[80vw] h-[50vw] max-w-[700px] max-h-[400px] rounded-full bg-amber-800/6 blur-3xl" />
        </div>

        <header className="relative z-10 flex flex-col items-center text-center select-none pt-16 sm:pt-24 lg:pt-32 pb-16 sm:pb-24 lg:pb-32 px-6">
          <div className="mb-6 sm:mb-8 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
            <BookOpen size={28} className="text-amber-400/80 sm:w-8 sm:h-8" />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-thin tracking-[0.5em] sm:tracking-[0.7em] text-stone-50 mb-4 sm:mb-5 font-serif">
            Lauselt
          </h1>
          <p className="text-stone-400 text-base sm:text-lg lg:text-xl max-w-lg leading-relaxed">
            Kasuta väikseid hetki, et saada palju loetud.
          </p>
        </header>

        {/* Curved transition to warm section */}
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
        {/* Subtle warm texture */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-20 right-[-10%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full bg-amber-900/6 blur-3xl" />
          <div className="absolute bottom-20 left-[-5%] w-[30vw] h-[30vw] max-w-[300px] max-h-[300px] rounded-full bg-stone-600/8 blur-3xl" />
        </div>

        {/* ── Description + CTA ─────────────────────────── */}
        <div className="relative z-10 flex flex-col items-center px-6 pt-10 sm:pt-14">
          <p className="text-stone-400 text-sm sm:text-base leading-relaxed text-center max-w-md lg:max-w-lg mb-8 sm:mb-10">
            Muuda lugemine lihtsaks. Loe raamatuid väikeste tükkidena — täpselt nii kiiresti kui ise
            tahad. Avasta olemasolevaid Eesti klassikuid või lae üles oma raamat.
          </p>

          <button
            onClick={onLogin}
            aria-label="Logi sisse ja alusta lugemist"
            className="group relative w-full max-w-xs sm:max-w-sm rounded-2xl
                       bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900
                       font-semibold py-3.5 sm:py-4 text-base sm:text-lg
                       shadow-lg shadow-amber-900/20
                       hover:from-amber-400 hover:to-amber-500 hover:shadow-amber-800/30
                       active:scale-[0.97] transition-all duration-200 cursor-pointer"
          >
            Logi sisse ja alusta lugemist
          </button>

          <p className="text-stone-500 text-xs sm:text-sm mt-3.5">
            Lugemine algab esimesest lausest.
          </p>

          <Link
            to="/kuidas-kasutada"
            className="mt-5 w-full max-w-sm rounded-2xl border border-amber-500/50 bg-amber-500/5 px-5 py-4 text-left hover:bg-amber-500/12 hover:border-amber-400/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <MonitorSmartphone size={18} className="text-amber-300" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-100">Lauselt rakendus</p>
                <p className="text-xs text-amber-200/80 mt-1">
                  Samm-sammulised juhised, kuidas kasutada Lauselt rakendusena.
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* ── Feature cards ─────────────────────────────── */}
        <div className="relative z-10 w-full px-6 mt-14 sm:mt-20 lg:mt-24 flex justify-center">
          <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Free card */}
            <section
              aria-labelledby="free-heading"
              className="group rounded-2xl sm:rounded-3xl bg-stone-800/50 backdrop-blur-sm
                         border border-stone-700/40 px-6 py-6 sm:px-7 sm:py-7
                         flex flex-col gap-5
                         hover:border-stone-600/60 hover:bg-stone-800/70 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-700/60 flex items-center justify-center">
                  <Upload size={14} className="text-stone-300" aria-hidden="true" />
                </div>
                <h2
                  id="free-heading"
                  className="text-xs font-semibold uppercase tracking-widest text-stone-400"
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
              ref={premiumRef}
              id="premium"
              aria-labelledby="premium-heading"
              className="group relative rounded-2xl sm:rounded-3xl bg-stone-800/50 backdrop-blur-sm
                         border border-amber-700/20
                         px-6 py-6 sm:px-7 sm:py-7
                         flex flex-col gap-5 overflow-hidden
                         hover:border-amber-600/35 hover:bg-stone-800/70 transition-all duration-300"
            >
              {/* Subtle amber glow */}
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-500/8 blur-2xl
                           group-hover:bg-amber-500/15 transition-all duration-500"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-gradient-to-br from-amber-800/8 via-transparent to-transparent pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-800/25 border border-amber-600/15 flex items-center justify-center">
                  <Flame size={14} className="text-amber-400/80" aria-hidden="true" />
                </div>
                <h2
                  id="premium-heading"
                  className="text-xs font-semibold uppercase tracking-widest text-amber-400/80"
                >
                  Lauselt+
                </h2>
              </div>

              <ul className="relative flex flex-col gap-4" role="list">
                {[
                  {
                    Icon: Flame,
                    text: "Tekita järjepidev lugemisharjumus (päevas vähemalt 50 jututükki).",
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

        {/* ── Footer links ────────────────────────────────── */}
        <footer className="relative z-10 mt-14 sm:mt-20 pb-10 sm:pb-14 flex flex-col items-center gap-2">
          <div className="w-8 h-px bg-stone-700/50 mb-5" aria-hidden="true" />
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
