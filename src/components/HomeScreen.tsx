import { useState } from 'react';
import { PREDEFINED_BOOKS } from '@/lib/predefinedBooks';
import { Book } from '@/lib/storage';

interface HomeScreenProps {
  library: Book[];
  onTextReady: (text: string, title: string) => void;
  onImport: () => void;
  onOpenBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
}

export default function HomeScreen({ library, onTextReady, onImport, onOpenBook, onDeleteBook }: HomeScreenProps) {
  const [showBooks, setShowBooks] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatProgress = (book: Book) => {
    if (!book.chunks.length) return '';
    const pct = Math.round((book.position / book.chunks.length) * 100);
    return `${pct}%`;
  };

  const handleBookSelect = async (book: (typeof PREDEFINED_BOOKS)[number]) => {
    setError(null);
    setLoading(book.path);
    try {
      const res = await fetch(book.path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.trim()) throw new Error('Tühi fail');
      onTextReady(text, book.title);
    } catch (err) {
      console.error(err);
      setError('Raamatu laadimine ebaõnnestus. Palun proovi uuesti.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center px-6 py-10 gap-10"
    >
      {/* Hero header */}
      <div className="text-center select-none">
        <h1
          className="text-2xl font-thin tracking-[0.7rem] text-stone-50 mb-2 font-serif"
        >
          Lauselt
        </h1>

        <p
          className="text-stone-500 text-base"
        >
          Kasuta väikseid hetki, et saada palju loetud.
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">

        {/* Saved library */}
        {library.length > 0 && (
          <div
            className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden"
          >
            <p className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-stone-500 border-b border-stone-800">Minu raamatukogu</p>
            {[...library].sort((a, b) => (b.lastRead ?? b.lastOpened) - (a.lastRead ?? a.lastOpened)).map((book) => (
              <div
                key={book.id}
                className="flex items-center border-b border-stone-800 last:border-0"
              >
                <button
                  onClick={() => onOpenBook(book)}
                  className="flex-1 flex min-w-0 items-center justify-between px-6 py-4 text-left hover:bg-stone-800 transition-colors duration-150"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-stone-200 font-medium text-sm truncate">
                      {book.title}
                    </p>
                    {book.chunks.length > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-stone-600">
                          {formatProgress(book)}
                        </span>
                        <div
                          className="h-0.5 rounded-full w-full overflow-hidden bg-stone-800"
                        >
                          <div
                            className="h-full rounded-full transition-all bg-yellow-500"
                            style={{
                              width: formatProgress(book),
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-stone-600 text-sm ml-3 shrink-0">›</span>
                </button>
                <button
                  onClick={() => onDeleteBook(book.id)}
                  className="px-4 py-4 text-stone-600 hover:text-red-400 text-lg leading-none shrink-0 transition-colors duration-150"
                  title="Kustuta"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Classics option */}
        <div
          className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden"
        >
          <button
            onClick={() => setShowBooks((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-stone-800 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div>
                <p className="font-semibold text-stone-50 text-base">
                  Loe olemasolevat klassikat
                </p>
                <p className="text-stone-600 text-sm mt-0.5 italic">
                  Eesti kirjanduse klassika
                </p>
              </div>
            </div>
            <span
              className={`text-stone-400 text-lg transition-transform duration-200 ${showBooks ? 'rotate-90' : ''}`}
            >
              ›
            </span>
          </button>

          {showBooks && (
            <div className="border-t border-stone-800">
              {PREDEFINED_BOOKS.map((book) => (
                <button
                  key={book.path}
                  onClick={() => handleBookSelect(book)}
                  disabled={loading !== null}
                  className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-stone-800
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <p className="text-stone-200 font-medium text-sm">{book.title}</p>
                    <p className="text-stone-200 text-xs mt-0.5 italic">{book.author}</p>
                  </div>
                  {loading === book.path ? (
                    <span className="text-amber-400 text-xs animate-pulse">Laen…</span>
                  ) : (
                    <span className="text-amber-400 text-sm">›</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Import option */}
        <button
          onClick={onImport}
          className="w-full rounded-2xl bg-stone-900 border border-stone-800 px-6 py-5 text-left hover:bg-stone-800 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div>
              <p className="font-semibold text-stone-50 text-base">Lae üles oma raamat</p>
              <p className="text-stone-600 text-sm mt-0.5 italic">
                EPUB formaadis failid
              </p>
            </div>
          </div>
        </button>
      </div>

      {error && (
        <p
          className="text-red-400 text-sm px-4 py-2 rounded-lg"
        >
          {error}
        </p>
      )}
    </div>
  );
}
