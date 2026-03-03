import { useEffect, useState } from 'react';
import HomeScreen from '@/components/HomeScreen';
import Importer from '@/components/Importer';
import Reader from '@/components/Reader';
import { chunkText } from '@/lib/chunker';
import {
  Book,
  bookId,
  deleteBook,
  getCurrentBookId,
  loadAllBooks,
  loadBook,
  saveBook,
  setCurrentBookId,
} from '@/lib/storage';

type AppState =
  | { view: 'home' }
  | { view: 'import' }
  | { view: 'read'; book: Book };

export default function App() {
  const [state, setState] = useState<AppState>({ view: 'home' });
  const [library, setLibrary] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore previous session on first load
  useEffect(() => {
    Promise.all([loadAllBooks(), getCurrentBookId()]).then(([books, currentId]) => {
      setLibrary(books);
      if (currentId) {
        const current = books.find((b) => b.id === currentId) ?? null;
        if (current) {
          setState({ view: 'read', book: current });
        }
      }
      setLoading(false);
    });
  }, []);

  const handleTextReady = async (text: string, title: string) => {
    const chunks = chunkText(text);
    if (chunks.length === 0) return;

    const id = bookId(title);
    // Preserve existing position if the same book is opened again
    const existing = await loadBook(id);
    const book: Book = {
      id,
      title,
      chunks,
      position: existing ? existing.position : 0,
      lastOpened: Date.now(),
    };
    await saveBook(book);
    await setCurrentBookId(id);
    setLibrary(await loadAllBooks());
    setState({ view: 'read', book });
  };

  const handlePositionChange = async (position: number) => {
    if (state.view !== 'read') return;
    const updatedBook: Book = { ...state.book, position };
    await saveBook(updatedBook);
    setState({ view: 'read', book: updatedBook });
  };

  const handleOpenBook = async (book: Book) => {
    await setCurrentBookId(book.id);
    const fresh = await loadBook(book.id);
    setState({ view: 'read', book: fresh ?? book });
  };

  const handleDeleteBook = async (id: string) => {
    await deleteBook(id);
    const books = await loadAllBooks();
    setLibrary(books);
  };

  const handleBack = async () => {
    const books = await loadAllBooks();
    setLibrary(books);
    setState({ view: 'home' });
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-stone-950">
        <p className="text-stone-500 text-lg tracking-wide">Laen…</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-stone-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (state.view === 'read') {
    return (
      <Reader
        chunks={state.book.chunks}
        title={state.book.title}
        initialChunk={state.book.position}
        onBack={handleBack}
        onPositionChange={handlePositionChange}
      />
    );
  }

  if (state.view === 'import') {
    return <Importer onTextReady={handleTextReady} onBack={handleBack} />;
  }

  return (
    <HomeScreen
      library={library}
      onTextReady={handleTextReady}
      onImport={() => setState({ view: 'import' })}
      onOpenBook={handleOpenBook}
      onDeleteBook={handleDeleteBook}
    />
  );
}
