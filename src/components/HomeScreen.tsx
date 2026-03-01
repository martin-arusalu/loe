import { useState } from 'react';
import { PREDEFINED_BOOKS } from '@/lib/predefinedBooks';

interface HomeScreenProps {
  onTextReady: (text: string, title: string) => void;
  onImport: () => void;
}

export default function HomeScreen({ onTextReady, onImport }: HomeScreenProps) {
  const [showBooks, setShowBooks] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center px-6 py-10 gap-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-stone-50 mb-2">Loe</h1>
        <p className="text-stone-400 text-lg">Loe kõike, üks amps korraga.</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* Classics option */}
        <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden">
          <button
            onClick={() => setShowBooks((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-stone-800 transition-colors"
          >
            <div>
              <p className="font-semibold text-stone-50 text-base">Loe olemasolevast klassikat</p>
              <p className="text-stone-500 text-sm mt-0.5">Eesti kirjanduse klassika</p>
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
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-stone-800 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed border-b border-stone-800 last:border-b-0"
                >
                  <div>
                    <p className="text-stone-200 font-medium text-sm">{book.title}</p>
                    <p className="text-stone-500 text-xs mt-0.5">{book.author}</p>
                  </div>
                  {loading === book.path ? (
                    <span className="text-amber-400 text-xs animate-pulse">Laen…</span>
                  ) : (
                    <span className="text-stone-600 text-sm">›</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Import option */}
        <button
          onClick={onImport}
          className="w-full rounded-2xl bg-stone-900 border border-stone-800 px-6 py-5 text-left
            hover:bg-stone-800 transition-colors"
        >
          <p className="font-semibold text-stone-50 text-base">Impordi oma raamat</p>
          <p className="text-stone-500 text-sm mt-0.5">PDF, EPUB, TXT või kleebi tekst</p>
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
