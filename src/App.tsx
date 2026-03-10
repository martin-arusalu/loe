import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import HomeScreen from "@/components/HomeScreen";
import Importer from "@/components/Importer";
import InstructionsPWA from "@/components/InstructionsPWA";
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
  getSystemStats,
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
import { syncAmplitudeUserFromLocalStorage, trackEvent } from "@/lib/analytics";
import { toast, Toaster } from "sonner";
import { APP_VERSION } from "./lib/constants";

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
  const [showAppRefresh, setShowAppRefresh] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const s = await getStats();
      setStats(s);
    } catch {
      // Stats unavailable — fail silently
    }
  }, [user]);

  const handleAppRefresh = async () => {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    window.location.reload();
  };

  const checkAppVersion = async () => {
    try {
      const system = await getSystemStats();
      if (system.appVersion && system.appVersion !== APP_VERSION) {
        setShowAppRefresh(true);
      }
    } catch {
      // System info unavailable — fail silently
    }
  };

  useEffect(() => {
    if (!showAppRefresh) return;
    toast("Rakenduse värskendus on saadaval", {
      duration: Infinity,
      action: {
        label: "Värskenda",
        onClick: handleAppRefresh,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAppRefresh]);

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
      // API unavailable — continue with local data already in IndexedDB.
      setLibrary(await loadAllBooks());
      setLoading(false);
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
    syncAmplitudeUserFromLocalStorage();
    if (user) {
      if (!navigator.onLine) {
        // Offline — skip API calls and serve whatever is cached locally.
        loadAllBooks().then((books) => {
          setLibrary(books);
          setLoading(false);
        });
        return;
      }
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
    checkAppVersion();
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
      trackEvent("session expired");
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

    trackEvent("flush pending", { pending: pending.length });
    await Promise.all(
      pending.map(async ({ slug, chunkIndex }) => {
        try {
          await recordScroll(slug, chunkIndex, false);
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

  const handlePositionChange = async (position: number, forward: boolean) => {
    if (state.view !== "read") return;
    const updatedBook: Book = { ...state.book, position, lastRead: Date.now() };
    await saveBook(updatedBook);
    setState({ view: "read", book: updatedBook });
    // Sync scroll position to API; queue locally when offline so the position
    // is flushed automatically once the connection is restored.
    if (updatedBook.slug) {
      recordScroll(updatedBook.slug, position, forward)
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
    trackEvent("open book", { book: book?.title });
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
      // API unavailable — open from the locally cached copy if we have one.
      if (existing?.chunks?.length) {
        await setCurrentBookId(existing.id);
        setLibrary(await loadAllBooks());
        setState({ view: "read", book: existing });
        trackEvent("open api book offline", { book: existing.title });
      }
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

    trackEvent("open api book", { book: book?.title });
  };

  const handleBack = async () => {
    trackEvent("back");
    const books = await loadAllBooks();
    setLibrary(books);
    setState({ view: "home" });
  };

  const handleLogin = (loggedInUser: AuthUser) => {
    trackEvent("login", {
      user: loggedInUser?.email,
    });
    setUser(loggedInUser);
    setState({ view: "home" });
  };

  const handleLogout = () => {
    trackEvent("logout", {
      user: user?.email,
    });
    clearAuthUser();
    clearAllData().catch(console.error);
    setUser(null);
  };

  let content: ReactNode;

  if (loading) {
    content = (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-stone-900">
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
  } else if (state.view === "read") {
    content = (
      <Reader
        chunks={state.book.chunks}
        title={state.book.title}
        initialChunk={state.book.position}
        onBack={handleBack}
        onPositionChange={handlePositionChange}
        stats={stats}
      />
    );
  } else if (state.view === "import") {
    content = <Importer onTextReady={handleTextReady} onBack={handleBack} />;
  } else if (state.view === "login") {
    content = <LoginScreen onBack={handleBack} onLogin={handleLogin} />;
  } else if (state.view === "home" && !user) {
    content = <LandingScreen onLogin={() => setState({ view: "login" })} />;
  } else {
    content = (
      <HomeScreen
        library={library}
        user={user}
        apiBooks={apiBooks}
        stats={stats}
        onTextReady={handleTextReady}
        onImport={() => setState({ view: "import" })}
        onOpenBook={handleOpenBook}
        onOpenApiBook={handleOpenApiBook}
        onLoginRequest={() => setState({ view: "login" })}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <>
      {content}
      <Toaster
        theme="dark"
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast: "!bg-stone-800 !border-stone-700 !text-stone-200",
            actionButton: "!bg-amber-500 !text-stone-900 hover:!bg-amber-400",
          },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/kuidas-kasutada" element={<InstructionsPWA />} />
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
