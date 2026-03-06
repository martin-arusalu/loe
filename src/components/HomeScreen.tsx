import { Book } from "@/lib/storage";
import { AuthUser } from "@/lib/auth";
import { ApiBook, UserStats } from "@/lib/api";
import { Flame, LogOut } from "lucide-react";

interface HomeScreenProps {
  library: Book[];
  user: AuthUser | null;
  apiBooks?: ApiBook[];
  stats?: UserStats | null;
  onTextReady: (text: string, title: string) => void;
  onImport: () => void;
  onOpenBook: (book: Book) => void;
  onOpenApiBook?: (book: ApiBook) => void;
  onLoginRequest: () => void;
  onLogout: () => void;
}

export default function HomeScreen({
  library,
  user,
  stats,
  onImport,
  onOpenBook,
  onLoginRequest,
  onLogout,
}: HomeScreenProps) {
  const formatProgress = (book: Book) => {
    if (!book.chunks.length) return "";
    const pct = Math.ceil((book.position / book.chunks.length) * 100);
    return `${pct}%`;
  };

  return (
    <div className="relative min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center px-6 py-10 gap-10">
      {/* Auth button — top right */}
      <div className="absolute top-5 right-6">
        {user ? (
          <div className="flex flex-row gap-2 items-center">
            {user.picture && (
              <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full" />
            )}
            <span className="inline">Tere, {user.name}!</span>
            <button
              onClick={onLogout}
              className="flex items-center bg-stone-800 border border-stone-700/50 py-1.5 px-1.5 rounded-lg text-stone-500 hover:text-stone-300 transition-colors text-sm"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginRequest}
            className="text-stone-500 hover:text-stone-300 transition-colors text-sm"
          >
            Logi sisse
          </button>
        )}
      </div>
      {/* Hero header */}
      <div className="text-center select-none">
        <h1 className="text-2xl font-thin tracking-[0.7rem] text-stone-50 mb-2 mt-20 font-serif">
          Lauselt
        </h1>

        <p className="text-stone-500 text-base">Kasuta väikseid hetki, et saada palju loetud.</p>
      </div>

      {/* Streak & today stats — shown only when logged in and stats are available */}
      {user && stats && (
        <div className="w-full max-w-sm">
          <div
            className={`rounded-2xl border p-4 flex gap-4 transition-colors backdrop-blur-sm ${
              stats.today.goalMet
                ? "bg-gradient-to-r from-amber-800/10 to-amber-950/10 border-amber-700/10"
                : "bg-stone-900 border-stone-800"
            }`}
          >
            {/* Streak */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1 py-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-amber-400 tabular-nums leading-none">
                  {stats.streak.current}
                </span>
                {stats.today.goalMet && (
                  <span className="text-amber-400 text-base leading-none">
                    <Flame size={20} className="text-amber-600/70" aria-hidden="true" />
                  </span>
                )}
              </div>
              <span className="text-xs text-stone-500 text-center leading-tight">
                Järjest päevi loetud
              </span>
            </div>

            {/* Divider */}
            <div className="w-px bg-stone-800" />

            {/* Today */}
            <div className="flex-1 flex flex-col justify-center gap-2 py-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500">Täna loetud</span>
                <span className="text-xs text-stone-400 tabular-nums">
                  {stats.today.chunksScrolled}
                  <span className="text-stone-600">/{stats.today.dailyGoal}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-stone-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.today.goalMet ? "bg-amber-400" : "bg-stone-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (stats.today.chunksScrolled / stats.today.dailyGoal) * 100)}%`,
                  }}
                />
              </div>
              {stats.today.goalMet ? (
                <span className="text-xs text-amber-400">✓ Tänane eesmärk täidetud</span>
              ) : (
                <span className="text-xs text-stone-600">
                  {stats.today.remaining} tükki eesmärgini
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col gap-3">
        {/* Saved library */}
        {library.length > 0 && (
          <div className="rounded-2xl bg-stone-950/50 border border-stone-800 overflow-hidden">
            <p className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-stone-500 border-b border-stone-800">
              Minu raamatukogu
            </p>
            {[...library]
              .sort((a, b) => (b.lastRead ?? 0) - (a.lastRead ?? 0))
              .map((book) => (
                <div
                  key={book.id}
                  className="flex items-center border-b border-stone-800 last:border-0"
                >
                  <button
                    onClick={() => onOpenBook(book)}
                    className="flex-1 flex min-w-0 items-center justify-between px-6 py-4 text-left hover:bg-stone-800 transition-colors duration-150"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-stone-200 font-medium text-sm truncate">{book.title}</p>
                      {book.chunks.length > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-stone-600">{formatProgress(book)}</span>
                          <div className="h-0.5 rounded-full w-full overflow-hidden bg-stone-800">
                            {formatProgress(book) === "100%" ? (
                              <div
                                className="h-full rounded-full transition-all bg-green-500"
                                style={{
                                  width: "100%",
                                }}
                              />
                            ) : (
                              <div
                                className="h-full rounded-full transition-all bg-yellow-500"
                                style={{
                                  width: formatProgress(book),
                                }}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-stone-600 text-sm ml-3 shrink-0">›</span>
                  </button>
                </div>
              ))}
          </div>
        )}

        {/* Import option */}
        <button
          onClick={onImport}
          className="w-full rounded-2xl bg-stone-950/50 border border-stone-800 px-6 py-5 text-left hover:bg-stone-800 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div>
              <p className="font-semibold text-stone-50 text-base">Lae üles oma raamat</p>
              <p className="text-stone-600 text-sm mt-0.5 italic">EPUB formaadis failid</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
