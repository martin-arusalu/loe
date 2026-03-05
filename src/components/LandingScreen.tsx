import { useRef } from "react";
import {
  Upload,
  BookmarkCheck,
  BarChart2,
  Flame,
  LibraryBig,
  MonitorSmartphone,
} from "lucide-react";
import { Link } from "react-router-dom";

interface LandingScreenProps {
  onLogin: () => void;
}

export default function LandingScreen({ onLogin }: LandingScreenProps) {
  const premiumRef = useRef<HTMLDivElement>(null);

  const scrollToPremium = () => {
    premiumRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center px-5 py-12 gap-6">
      {/* ── Hero ──────────────────────────────────────────── */}
      <header className="text-center select-none pt-6">
        <h1 className="text-2xl font-thin tracking-[0.7rem] text-stone-50 mb-3 font-serif">
          Lauselt
        </h1>
        <p className="text-stone-400 text-base">Kasuta väikseid hetki, et saada palju loetud.</p>
      </header>

      {/* ── Description ───────────────────────────────────── */}
      <p className="text-stone-400 text-sm leading-relaxed text-center max-w-xs">
        Muuda lugemine lihtsaks. Loe raamatuid väikeste tükkidena — täpselt nii kiiresti kui ise
        tahad. Avasta olemasolevaid Eesti klassikuid või lae üles oma raamat.
      </p>

      {/* ── CTA ───────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <button
          onClick={onLogin}
          aria-label="Logi sisse ja alusta lugemist"
          className="w-full rounded-2xl bg-stone-100 text-stone-950 font-semibold py-3.5 text-base
                     hover:bg-white active:scale-[0.98] transition-all duration-150"
        >
          Logi sisse ja alusta lugemist
        </button>

        <p className="text-stone-500 text-sm">Lugemine algab esimesest lausest.</p>

        <button
          onClick={scrollToPremium}
          aria-label="Vaata Lauselt+ eeliseid"
          className="text-amber-400/80 hover:text-amber-300 text-sm transition-colors
                     underline underline-offset-2 decoration-amber-400/40"
        >
          Vaata Lauselt+ eeliseid ↓
        </button>
      </div>

      {/* ── Feature cards ─────────────────────────────────── */}
      <div className="w-full max-w-xs flex flex-col gap-4">
        {/* Free card */}
        <section
          aria-labelledby="free-heading"
          className="rounded-2xl bg-stone-900 border border-stone-800 px-5 py-5 flex flex-col gap-4"
        >
          <h2
            id="free-heading"
            className="text-xs font-semibold uppercase tracking-widest text-stone-500"
          >
            Sisse logides saad
          </h2>

          <ul className="flex flex-col gap-3" role="list">
            {[
              { Icon: Upload, text: "Importida oma raamatu (raamat salvestub sinu seadmesse)." },
              {
                Icon: BookmarkCheck,
                text: "Jätkata pooleli jäänud kohast (progress sünkib kontoga).",
              },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-stone-300 text-sm">
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
          className="relative rounded-2xl bg-stone-900 border border-amber-800/40
                     px-5 py-5 flex flex-col gap-4 overflow-hidden"
        >
          {/* Subtle amber glow */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-amber-900/15 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          <h2
            id="premium-heading"
            className="text-xs font-semibold uppercase tracking-widest text-amber-400/80"
          >
            Lauselt+
          </h2>

          <ul className="flex flex-col gap-3" role="list">
            {[
              {
                Icon: Flame,
                text: "Tekita järjepidev lugemisharjumus (päevas vähemalt 50 jututükki).",
              },
              {
                Icon: LibraryBig,
                text: "Ligipääs valitud raamatutele (toimetatud ja kontrollitud).",
              },
              { Icon: MonitorSmartphone, text: "Raamatud igas seadmes (ei pea eraldi importima)." },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-stone-300 text-sm">
                <Icon size={16} className="mt-0.5 shrink-0 text-amber-400/70" aria-hidden="true" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-col gap-2 text-center">
        <Link
          to="/privacy"
          className="text-stone-500 text-sm hover:text-stone-300 transition-colors"
        >
          Loe privaatsuspoliitikat
        </Link>
        <Link to="/terms" className="text-stone-500 text-sm hover:text-stone-300 transition-colors">
          Loe kasutustingimusi
        </Link>
      </div>
    </div>
  );
}
