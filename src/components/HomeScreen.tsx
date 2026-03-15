import { Book } from "@/lib/storage";
import { AuthUser } from "@/lib/auth";
import { ApiBook, UserStats } from "@/lib/api";
import formatNumber from "@/lib/formatNumber";
import { Flame, LogOut, Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface HomeScreenProps {
  library: Book[];
  user: AuthUser | null;
  apiBooks?: ApiBook[];
  stats?: UserStats | null;
  onTextReady: (text: string, title: string) => void;
  onImport: () => void;
  onOpenBook: (book: Book) => void;
  onOpenApiBook?: (book: ApiBook) => void;
  onLogout: () => void;
}

export default function HomeScreen({
  library,
  user,
  stats,
  onImport,
  onOpenBook,
  onLogout,
}: HomeScreenProps) {
  const formatProgress = (book: Book) => {
    if (!book.chunks.length) return "";
    const pct = Math.ceil((book.position / book.chunks.length) * 100);
    return `${pct}%`;
  };

  return (
    <div className="min-h-screen bg-stone-900/50 text-stone-100 flex flex-col relative overflow-hidden transition-colors">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[60vw] h-[40vw] max-w-[500px] max-h-[300px] rounded-full bg-amber-900/5 blur-3xl animate-glow-drift-slow" />
        <div className="absolute bottom-[20%] right-[-10%] w-[35vw] h-[35vw] max-w-[300px] max-h-[300px] rounded-full bg-stone-700/5 blur-3xl animate-glow-drift" />
      </div>

      {/* ── Header ────────────────────────────────────────── */}
      <header
        className="bg-gradient-to-t from-stone-950/10 to-stone-950 relative z-10 px-6 pt-5 pb-3 flex items-center justify-between animate-fade-in"
        style={{ borderLeft: "none", borderRight: "none", borderTop: "none" }}
      >
        <h1 className="flex items-center text-lg font-semibold tracking-[0.3em] text-stone-200 select-none">
          <img src="/favicon.svg" alt="Lauselt" className="w-6 h-6 mr-3 rounded-sm" />
          Lauselt
        </h1>
        {user ? (
          <div className="flex items-center gap-2.5">
            {user.picture && (
              <img
                src={user.picture}
                alt=""
                className="w-7 h-7 rounded-full ring-1 ring-stone-700/50 ring-offset-1 ring-offset-[#0c0a09]"
              />
            )}
            <span className="text-sm text-stone-400 inline">{user.name}</span>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-stone-600 hover:text-stone-300 hover:bg-stone-800/50 transition-all duration-200"
              aria-label="Logi välja"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-stone-500 hover:text-stone-300 transition-colors duration-200 text-sm"
          >
            Logi sisse
          </Link>
        )}
      </header>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-6 pb-10">
        <div className="w-full max-w-sm flex flex-col gap-5 mt-6">
          {/* Streak & today stats */}
          {user && stats && (
            <div
              className={`glass rounded-2xl p-4 flex gap-4 transition-all duration-500 animate-fade-in-up delay-1 ${
                stats.today.goalMet ? "!border-amber-700/25 animate-pulse-glow" : ""
              }`}
            >
              {/* Streak */}
              <div className="flex-1 flex flex-col items-center justify-center gap-1 py-1">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-bold ${stats.today.goalMet ? "text-gradient-amber" : "text-stone-500"} tabular-nums leading-none`}
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {stats.streak.current}
                  </span>
                  {stats.today.goalMet && (
                    <Flame size={16} className="text-amber-500/80" aria-hidden="true" />
                  )}
                </div>
                <span className="text-[11px] text-stone-500 text-center leading-tight">
                  Järjest päevi
                </span>
              </div>

              {/* Divider */}
              <div className="w-px bg-gradient-to-b from-transparent via-stone-700/50 to-transparent" />

              {/* Today */}
              <div className="flex-1 flex flex-col justify-center gap-2 py-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">Täna</span>
                  <span className="text-[11px] text-stone-400 tabular-nums">
                    {formatNumber(stats.today.chunksScrolled)}
                    <span className="text-stone-600">/{formatNumber(stats.today.dailyGoal)}</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-stone-800/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      stats.today.goalMet
                        ? "bg-gradient-to-r from-amber-500 to-amber-400 progress-glow"
                        : "bg-stone-600"
                    }`}
                    style={{
                      width: `${Math.min(100, (stats.today.chunksScrolled / stats.today.dailyGoal) * 100)}%`,
                    }}
                  />
                </div>
                {stats.today.goalMet ? (
                  <span className="text-[11px] text-amber-400/90">✓ Eesmärk täidetud</span>
                ) : (
                  <span className="text-[11px] text-stone-600">
                    {formatNumber(stats.today.remaining)} lõiku eesmärgini
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Library ─────────────────────────────────────── */}
          {library.length > 0 && (
            <div className="animate-fade-in-up delay-2">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500 mb-3 px-1"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Raamatukogu
              </p>
              <div className="glass rounded-2xl overflow-hidden">
                {[...library]
                  .sort((a, b) => (b.lastRead ?? 0) - (a.lastRead ?? 0))
                  .map((book, i, arr) => (
                    <button
                      key={book.id}
                      onClick={() => onOpenBook(book)}
                      className={`w-full flex items-center justify-between px-5 py-4 text-left
                        hover:bg-stone-800/30 transition-all duration-200 group
                        ${i < arr.length - 1 ? "border-b border-stone-800/40" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-stone-200 text-sm font-medium truncate group-hover:text-stone-50 transition-colors">
                          {book.title}
                        </p>
                        {book.author && (
                          <p className="text-stone-600 text-xs truncate mt-0.5">{book.author}</p>
                        )}
                        {book.chunks.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="h-[3px] rounded-full flex-1 bg-stone-800/80 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  formatProgress(book) === "100%"
                                    ? "bg-gradient-to-r from-green-600/70 to-green-500/70"
                                    : "bg-gradient-to-r from-amber-600/50 to-amber-500/50"
                                }`}
                                style={{ width: formatProgress(book) }}
                              />
                            </div>
                            <span className="text-[11px] text-stone-600 tabular-nums w-8 text-right">
                              {formatProgress(book)}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-stone-700 ml-3 shrink-0 group-hover:text-stone-400 group-hover:translate-x-0.5 transition-all duration-200">
                        ›
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* ── Import ──────────────────────────────────────── */}
          <button
            onClick={onImport}
            className="w-full rounded-2xl border border-dashed border-stone-700/50 px-5 py-4 text-left
              hover:border-amber-700/30 hover:bg-amber-950/5 transition-all duration-300 group
              animate-fade-in-up delay-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-stone-800/60 flex items-center justify-center group-hover:bg-amber-900/20 group-hover:border-amber-700/20 transition-all duration-300 border border-transparent">
                <Plus
                  size={16}
                  className="text-stone-400 group-hover:text-amber-400/80 transition-colors duration-300"
                />
              </div>
              <div>
                <p className="text-stone-300 text-sm font-medium group-hover:text-stone-100 transition-colors">
                  Lae üles oma raamat
                </p>
                <p className="text-stone-600 text-xs mt-0.5">EPUB formaadis fail</p>
              </div>
            </div>
          </button>

          {/* PWA helper */}
          <div className="flex justify-center pt-2 animate-fade-in delay-5">
            <Link
              to="/kuidas-kasutada"
              className="text-[11px] text-stone-600 hover:text-stone-400 transition-colors duration-200"
            >
              Kuidas saada Lauselt avalehele?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
