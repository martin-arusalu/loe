/**
 * Port of the web `src/App.tsx`.
 *
 * Keeps the same `home | import | read` state machine, the same API sync flow
 * and the same offline pending-progress queue. Platform swaps:
 *  - `navigator.onLine`      → expo-network
 *  - `window.addEventListener("auth:sessionExpired")` → `onSessionExpired()`
 *  - service-worker cache purge + reload → expo-updates
 */
import { useCallback, useEffect, useState } from "react";
import * as Network from "expo-network";
import * as Updates from "expo-updates";
import HomeScreen from "@/screens/HomeScreen";
import Importer from "@/screens/Importer";
import LandingScreen from "@/screens/LandingScreen";
import LoadingScreen from "@/screens/LoadingScreen";
import Reader from "@/screens/Reader";
import { chunkText } from "@/lib/chunker";
import {
  clearAllData as clearLocalData,
  bookId,
  clearPendingProgress,
  getCurrentBookId,
  getPendingProgress,
  loadAllBooks,
  loadBook,
  queuePendingProgress,
  saveBook,
  setCurrentBookId,
  type Book,
} from "@/lib/storage";
import {
  clearAuthUser,
  deleteAccount,
  loadAuthUser,
  onAuthChange,
  onSessionExpired,
  type AuthUser,
} from "@/lib/auth";
import {
  getAllReadingProgress,
  getBookChunks,
  getBooks,
  getStats,
  openBook,
  recordScroll,
  type ApiBook,
  type UserStats,
} from "@/lib/api";
import { syncAmplitudeUser, trackEvent } from "@/lib/analytics";
import { useToast } from "@/components/Toast";
import { LOCAL_PREVIEW_MODE, LOCAL_PREVIEW_USER } from "@/lib/constants";

type AppState = { view: "home" } | { view: "import" } | { view: "read"; book: Book };

async function isOnline(): Promise<boolean> {
  const state = await Network.getNetworkStateAsync();
  return state.isInternetReachable ?? state.isConnected ?? true;
}

export default function AppShell() {
  const { toast } = useToast();

  const [state, setState] = useState<AppState>({ view: "home" });
  const [library, setLibrary] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(() =>
    LOCAL_PREVIEW_MODE ? LOCAL_PREVIEW_USER : loadAuthUser()
  );
  const [apiBooks, setApiBooks] = useState<ApiBook[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);

  // Login happens on the /login route, so mirror the shared auth cache.
  useEffect(() => onAuthChange(() => setUser(loadAuthUser())), []);

  const fetchStats = useCallback(async () => {
    if (!user || LOCAL_PREVIEW_MODE) return;
    try {
      setStats(await getStats());
    } catch {
      // Stats unavailable — fail silently.
    }
  }, [user]);

  // ── OTA update prompt (replaces the web cache-purge reload) ──
  useEffect(() => {
    if (__DEV__) return;
    Updates.checkForUpdateAsync()
      .then(async (result) => {
        if (!result.isAvailable) return;
        await Updates.fetchUpdateAsync();
        toast("Rakenduse värskendus on saadaval", {
          duration: Infinity,
          action: { label: "Värskenda", onPress: () => Updates.reloadAsync() },
        });
      })
      .catch(() => {});
  }, [toast]);

  // ── API sync ──
  const syncApiData = useCallback(async () => {
    if (LOCAL_PREVIEW_MODE) {
      setLibrary(await loadAllBooks());
      setLoading(false);
      return;
    }
    try {
      const books = await getBooks();
      setApiBooks(books);

      await Promise.all(
        books.map(async (apiBook) => {
          const localId = bookId(apiBook.title);
          const existing = await loadBook(localId);
          // Always overwrite with API data to avoid stale metadata/content, but
          // preserve local position/lastRead so users keep their place.
          try {
            const chunksRes = await getBookChunks(apiBook.slug, 0, apiBook.totalChunks);
            await saveBook({
              id: localId,
              title: apiBook.title,
              author: apiBook.author,
              chunks: chunksRes.chunks,
              position: existing?.position ?? 0,
              lastRead: existing?.lastRead,
              slug: apiBook.slug,
            });
          } catch {
            // Skip this book if chunks can't be fetched.
          }
        })
      );

      const progress = await getAllReadingProgress();
      for (const entry of progress.books) {
        const existing = await loadBook(bookId(entry.title));
        if (existing && existing.slug === entry.slug) {
          await saveBook({
            ...existing,
            position: entry.currentChunk,
            lastRead: entry.lastReadAt ? new Date(entry.lastReadAt).getTime() : undefined,
          });
        }
      }
    } catch {
      // API unavailable — continue with whatever is cached locally.
    }
    setLibrary(await loadAllBooks());
    setLoading(false);
  }, []);

  // Restore previous session on first load.
  useEffect(() => {
    Promise.all([loadAllBooks(), getCurrentBookId()]).then(([books, currentId]) => {
      setLibrary(books);
      const current = currentId ? books.find((b) => b.id === currentId) : null;
      if (current && loadAuthUser()) {
        setState({ view: "read", book: current });
        setLoading(false);
      }
    });
  }, []);

  // Sync whenever the user changes (login / logout).
  useEffect(() => {
    syncAmplitudeUser();
    if (LOCAL_PREVIEW_MODE) {
      loadAllBooks().then((books) => {
        setLibrary(books);
        setLoading(false);
      });
      return;
    }
    if (!user) {
      setApiBooks([]);
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    isOnline().then((online) => {
      if (!online) {
        loadAllBooks().then((books) => {
          setLibrary(books);
          setLoading(false);
        });
        return;
      }
      syncApiData();
      fetchStats();
    });
  }, [user, syncApiData, fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [state.view, fetchStats]);

  // Force-logout when the refresh token itself is rejected.
  useEffect(
    () =>
      onSessionExpired(() => {
        trackEvent("session expired");
        setUser(null);
        setApiBooks([]);
        setState({ view: "home" });
      }),
    []
  );

  // Flush progress queued while offline.
  const flushPendingProgress = useCallback(async () => {
    if (!(await isOnline())) return;
    const pending = getPendingProgress();
    if (pending.length === 0) return;

    trackEvent("flush pending", { pending: pending.length });
    await Promise.all(
      pending.map(async ({ slug, chunkIndex }) => {
        try {
          await recordScroll(slug, chunkIndex, false);
          clearPendingProgress(slug);
        } catch {
          // Still offline — retry on the next tick.
        }
      })
    );
  }, []);

  useEffect(() => {
    const subscription = Network.addNetworkStateListener(() => {
      flushPendingProgress();
    });
    const interval = setInterval(flushPendingProgress, 30_000);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [flushPendingProgress]);

  // ── Handlers ──
  const handleTextReady = async (text: string, title: string) => {
    const chunks = chunkText(text);
    if (chunks.length === 0) return;

    const id = bookId(title);
    const existing = await loadBook(id);
    const book: Book = { id, title, chunks, position: existing ? existing.position : 0 };
    await saveBook(book);
    await setCurrentBookId(id);
    setLibrary(await loadAllBooks());
    setState({ view: "read", book });
  };

  const handlePositionChange = async (position: number, forward: boolean) => {
    if (state.view !== "read") return;
    const updated: Book = { ...state.book, position, lastRead: Date.now() };
    await saveBook(updated);
    setState({ view: "read", book: updated });

    if (updated.slug) {
      recordScroll(updated.slug, position, forward)
        .then(() => fetchStats())
        .catch(() => queuePendingProgress(updated.slug!, position));
    }
  };

  const handleOpenBook = async (book: Book) => {
    await setCurrentBookId(book.id);
    const fresh = await loadBook(book.id);
    setState({ view: "read", book: fresh ?? book });
    if (book.slug) openBook(book.slug).catch(() => {});
    trackEvent("open book", { book: book.title });
  };

  const handleOpenApiBook = async (apiBook: ApiBook) => {
    const localId = bookId(apiBook.title);
    const existing = await loadBook(localId);

    let chunks: string[];
    let startChunk = 0;
    try {
      const [openRes, chunksRes] = await Promise.all([
        openBook(apiBook.slug),
        getBookChunks(apiBook.slug, 0, apiBook.totalChunks),
      ]);
      chunks = chunksRes.chunks;
      startChunk = existing?.slug === apiBook.slug ? existing.position : openRes.currentChunk;
    } catch {
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
    trackEvent("open api book", { book: book.title });
  };

  const handleBack = async () => {
    trackEvent("back");
    setLibrary(await loadAllBooks());
    setState({ view: "home" });
  };

  const handleLogout = async () => {
    trackEvent("logout", { user: user?.email });
    await clearAuthUser();
    await clearLocalData();
    setUser(null);
  };

  const handleDeleteAccount = async () => {
    await deleteAccount();
    await clearLocalData();
    setUser(null);
    setLibrary([]);
    setState({ view: "home" });
    trackEvent("account deleted");
  };

  // ── Render ──
  if (loading) return <LoadingScreen />;

  if (state.view === "read") {
    return (
      <Reader
        chunks={state.book.chunks}
        title={state.book.title}
        initialChunk={state.book.position}
        onBack={handleBack}
        onPositionChange={handlePositionChange}
        stats={stats}
        onDeleteAccount={handleDeleteAccount}
      />
    );
  }

  if (state.view === "import") {
    return <Importer onTextReady={handleTextReady} onBack={handleBack} />;
  }

  if (!user) return <LandingScreen />;

  return (
    <HomeScreen
      library={library}
      user={user}
      apiBooks={apiBooks}
      stats={stats}
      onImport={() => setState({ view: "import" })}
      onOpenBook={handleOpenBook}
      onOpenApiBook={handleOpenApiBook}
      onLogout={handleLogout}
    />
  );
}
