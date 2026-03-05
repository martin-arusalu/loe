import { useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import HomeScreen from '@/components/HomeScreen';
import Importer from '@/components/Importer';
import LandingScreen from '@/components/LandingScreen';
import LoginScreen from '@/components/LoginScreen';
import Reader from '@/components/Reader';
import { chunkText } from '@/lib/chunker';
import { AuthUser, clearAuthUser, loadAuthUser } from '@/lib/auth';
import {
  ApiBook,
  getAllReadingProgress,
  getBooks,
  getBookChunks,
  openBook,
  recordScroll,
} from '@/lib/api';
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

const GOOGLE_CLIENT_ID = '382553774833-b3673gncnf51ha3td8s2t8j90kipd4ao.apps.googleusercontent.com';

type AppState =
  | { view: 'home' }
  | { view: 'import' }
  | { view: 'login' }
  | { view: 'read'; book: Book };

function AppInner() {
  const [state, setState] = useState<AppState>({ view: 'home' });
  const [library, setLibrary] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(() => loadAuthUser());
  const [apiBooks, setApiBooks] = useState<ApiBook[]>([]);

  // Sync API books and reading progress when user is logged in
  const syncApiData = async () => {
    try {
      const [books, progress] = await Promise.all([
        getBooks(),
        getAllReadingProgress(),
      ]);
      setApiBooks(books);

      // Merge server-side reading progress into local storage
      for (const entry of progress.books) {
        const localId = bookId(entry.title);
        const existing = await loadBook(localId);
        if (existing && existing.slug === entry.slug) {
          // Update position from server if the book is already locally stored
          await saveBook({ ...existing, position: entry.currentChunk });
        }
      }
      setLibrary(await loadAllBooks());
    } catch {
      // API unavailable — continue with local data
    }
  };

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

  // Sync API data whenever the user changes (login / logout)
  useEffect(() => {
    if (user) {
      syncApiData();
    } else {
      setApiBooks([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    const updatedBook: Book = { ...state.book, position, lastRead: Date.now() };
    await saveBook(updatedBook);
    setState({ view: 'read', book: updatedBook });
    // Sync scroll position to API (fire-and-forget)
    if (updatedBook.slug) {
      recordScroll(updatedBook.slug, position).catch(() => {});
    }
  };

  const handleOpenBook = async (book: Book) => {
    await setCurrentBookId(book.id);
    const fresh = await loadBook(book.id);
    setState({ view: 'read', book: fresh ?? book });
    // Notify API that this book is being opened (fire-and-forget)
    if (book.slug) {
      openBook(book.slug).catch(() => {});
    }
  };

  const handleOpenApiBook = async (apiBook: ApiBook) => {
    const localId = bookId(apiBook.title);
    const existing = await loadBook(localId);

    let chunks: string[];
    let startChunk = 0;

    try {
      // Notify API and get the last known position
      const [openRes, chunksRes] = await Promise.all([
        openBook(apiBook.slug),
        getBookChunks(apiBook.slug, 0, apiBook.totalChunks),
      ]);
      chunks = chunksRes.chunks;
      startChunk = existing?.slug === apiBook.slug
        ? existing.position
        : openRes.currentChunk;
    } catch {
      // API unavailable — nothing to open
      return;
    }

    const book: Book = {
      id: localId,
      title: apiBook.title,
      chunks,
      position: startChunk,
      lastOpened: Date.now(),
      slug: apiBook.slug,
    };
    await saveBook(book);
    await setCurrentBookId(localId);
    setLibrary(await loadAllBooks());
    setState({ view: 'read', book });
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

  const handleLogin = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setState({ view: 'home' });
  };

  const handleLogout = () => {
    clearAuthUser();
    setUser(null);
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

  if (state.view === 'login') {
    return <LoginScreen onBack={handleBack} onLogin={handleLogin} />;
  }

  if (state.view === 'home' && !user) {
    return <LandingScreen onLogin={() => setState({ view: 'login' })} />;
  }

  return (
    <HomeScreen
      library={library}
      user={user}
      apiBooks={apiBooks}
      onTextReady={handleTextReady}
      onImport={() => setState({ view: 'import' })}
      onOpenBook={handleOpenBook}
      onOpenApiBook={handleOpenApiBook}
      onDeleteBook={handleDeleteBook}
      onLoginRequest={() => setState({ view: 'login' })}
      onLogout={handleLogout}
    />
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppInner />
    </GoogleOAuthProvider>
  );
}
