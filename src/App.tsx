import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import HomeScreen from "@/components/HomeScreen";
import Importer from "@/components/Importer";
import LandingScreen from "@/components/LandingScreen";
import LoginScreen from "@/components/LoginScreen";
import PrivacyPolicy from "@/components/PrivacyPolicy";
import Reader from "@/components/Reader";
import TermsOfService from "@/components/TermsOfService";
import { chunkText } from "@/lib/chunker";
import { AuthUser, clearAuthUser, loadAuthUser } from "@/lib/auth";
import { clearAllData } from "@/lib/storage";
import {
  ApiBook,
  UserStats,
  getAllReadingProgress,
  getBookChunks,
  getBooks,
  getStats,
  openBook,
  recordScroll,
} from "@/lib/api";
import {
  Book,
  bookId,
  clearPendingProgress,
  getCurrentBookId,
  getPendingProgress,
  loadAllBooks,
  loadBook,
  queuePendingProgress,
  saveBook,
  setCurrentBookId,
} from "@/lib/storage";

const GOOGLE_CLIENT_ID = "382553774833-b3673gncnf51ha3td8s2t8j90kipd4ao.apps.googleusercontent.com";

type AppState =
  | { view: "home" }
  | { view: "import" }
  | { view: "login" }
  | { view: "read"; book: Book };

function AppInner() {
  const [state, setState] = useState<AppState>({ view: "home" });
  const [library, setLibrary] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(() => loadAuthUser());
  const [apiBooks, setApiBooks] = useState<ApiBook[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const s = await getStats();
      setStats(s);
    } catch {
      // Stats unavailable — fail silently
    }
  }, [user]);

  // Sync API books and reading progress when user is logged in
  const syncApiData = async () => {
    try {
      // Step 1: fetch the book catalogue and persist any books not yet stored locally
      const books = await getBooks();
      setApiBooks(books);

      await Promise.all(
        books.map(async (apiBook) => {
          const localId = bookId(apiBook.title);
          const existing = await loadBook(localId);
          // Only download chunks when the book is missing or belongs to a different slug
          if (!existing || existing.slug !== apiBook.slug) {
            try {
              const chunksRes = await getBookChunks(apiBook.slug, 0, apiBook.totalChunks);
              const book: Book = {
                id: localId,
                title: apiBook.title,
                chunks: chunksRes.chunks,
                position: existing?.position ?? 0,
                slug: apiBook.slug,
              };
              await saveBook(book);
            } catch {
              // Skip this book if chunks can't be fetched
            }
          }
        })
      );

      // Step 2: now that all books are in local storage, apply server-side progress
      const progress = await getAllReadingProgress();
      for (const entry of progress.books) {
        const localId = bookId(entry.title);
        const existing = await loadBook(localId);
        if (existing && existing.slug === entry.slug) {
          await saveBook({
            ...existing,
            position: entry.currentChunk,
            lastRead: entry.lastReadAt ? new Date(entry.lastReadAt).getTime() : undefined,
          });
        }
      }

      setLibrary(await loadAllBooks());
      setLoading(false);
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
        if (current && user) {
          setState({ view: "read", book: current });
          setLoading(false);
        }
      }
    });
  }, []);

  // Sync API data whenever the user changes (login / logout)
  useEffect(() => {
    if (user) {
      setLoading(true);
      syncApiData();
      fetchStats();
    } else {
      setApiBooks([]);
      setStats(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Refresh stats whenever the view changes
  useEffect(() => {
    fetchStats();
  }, [state.view, fetchStats]);

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
    };
    await saveBook(book);
    await setCurrentBookId(id);
    setLibrary(await loadAllBooks());
    setState({ view: "read", book });
  };

  // Force-logout when the refresh token itself is rejected by the server.
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setApiBooks([]);
      setState({ view: "home" });
    };
    window.addEventListener("auth:sessionExpired", handleSessionExpired);
    return () => window.removeEventListener("auth:sessionExpired", handleSessionExpired);
  }, []);

  // Flush any progress that was queued while offline.
  const flushPendingProgress = useCallback(async () => {
    if (!navigator.onLine) return;
    const pending = getPendingProgress();
    if (pending.length === 0) return;
    await Promise.all(
      pending.map(async ({ slug, chunkIndex }) => {
        try {
          await recordScroll(slug, chunkIndex);
          clearPendingProgress(slug);
        } catch {
          // Still offline — leave entry for the next attempt
        }
      })
    );
  }, []);

  // Listen for the browser coming back online and poll every 30 s as a fallback
  // (the `online` event can be unreliable in PWA/service-worker contexts).
  useEffect(() => {
    const handleOnline = () => {
      flushPendingProgress();
    };
    window.addEventListener("online", handleOnline);
    const interval = setInterval(() => {
      if (navigator.onLine) flushPendingProgress();
    }, 30_000);
    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, [flushPendingProgress]);

  const handlePositionChange = async (position: number) => {
    if (state.view !== "read") return;
    const updatedBook: Book = { ...state.book, position, lastRead: Date.now() };
    await saveBook(updatedBook);
    setState({ view: "read", book: updatedBook });
    // Sync scroll position to API; queue locally when offline so the position
    // is flushed automatically once the connection is restored.
    if (updatedBook.slug) {
      recordScroll(updatedBook.slug, position)
        .then(() => fetchStats())
        .catch(() => {
          if (updatedBook.slug) {
            queuePendingProgress(updatedBook.slug, position);
          }
        });
    }
  };

  const handleOpenBook = async (book: Book) => {
    await setCurrentBookId(book.id);
    const fresh = await loadBook(book.id);
    setState({ view: "read", book: fresh ?? book });
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
      startChunk = existing?.slug === apiBook.slug ? existing.position : openRes.currentChunk;
    } catch {
      // API unavailable — nothing to open
      return;
    }

    const book: Book = {
      id: localId,
      title: apiBook.title,
      chunks,
      position: startChunk,
      slug: apiBook.slug,
    };
    await saveBook(book);
    await setCurrentBookId(localId);
    setLibrary(await loadAllBooks());
    setState({ view: "read", book });
  };

  const handleDeleteBookProgress = async (id: string) => {
    const existing = await loadBook(id);
    if (existing) {
      await saveBook({ ...existing, position: 0, lastRead: undefined });
    }
    const books = await loadAllBooks();
    setLibrary(books);
  };

  const handleBack = async () => {
    const books = await loadAllBooks();
    setLibrary(books);
    setState({ view: "home" });
  };

  const handleLogin = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setState({ view: "home" });
  };

  const handleLogout = () => {
    clearAuthUser();
    clearAllData().catch(console.error);
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

  if (state.view === "read") {
    return (
      <Reader
        chunks={state.book.chunks}
        title={state.book.title}
        initialChunk={state.book.position}
        onBack={handleBack}
        onPositionChange={handlePositionChange}
        stats={stats}
      />
    );
  }

  if (state.view === "import") {
    return <Importer onTextReady={handleTextReady} onBack={handleBack} />;
  }

  if (state.view === "login") {
    return <LoginScreen onBack={handleBack} onLogin={handleLogin} />;
  }

  if (state.view === "home" && !user) {
    return <LandingScreen onLogin={() => setState({ view: "login" })} />;
  }

  return (
    <HomeScreen
      library={library}
      user={user}
      apiBooks={apiBooks}
      stats={stats}
      onTextReady={handleTextReady}
      onImport={() => setState({ view: "import" })}
      onOpenBook={handleOpenBook}
      onOpenApiBook={handleOpenApiBook}
      onDeleteProgress={handleDeleteBookProgress}
      onLoginRequest={() => setState({ view: "login" })}
      onLogout={handleLogout}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route
          path="*"
          element={
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <AppInner />
            </GoogleOAuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
