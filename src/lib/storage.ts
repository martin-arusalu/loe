/**
 * Persists reading sessions to IndexedDB.
 * Supports multiple books; the most recently opened is tracked as "current".
 */

const DB_NAME = "reedfeed";
const DB_VERSION = 2;
const BOOKS_STORE = "books";
const META_STORE = "meta";
const CURRENT_KEY = "currentBookId";

export interface Book {
  id: string; // stable slug derived from title
  title: string;
  author?: string;
  chunks: string[];
  position: number;
  lastRead?: number; // unix ms timestamp — updated on every scroll
  slug?: string; // API book slug, present when loaded from the server
}

export function bookId(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\u00C0-\u024F]+/gi, "-")
      .replace(/^-|-$/g, "") || "book"
  );
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      // migrate: drop old session store if it exists
      if ((event.oldVersion ?? 0) < 2) {
        if (db.objectStoreNames.contains("session")) {
          db.deleteObjectStore("session");
        }
        db.createObjectStore(BOOKS_STORE);
        db.createObjectStore(META_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBook(book: Book): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKS_STORE, "readwrite");
    tx.objectStore(BOOKS_STORE).put(book, book.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadBook(id: string): Promise<Book | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKS_STORE, "readonly");
    const req = tx.objectStore(BOOKS_STORE).get(id);
    req.onsuccess = () => resolve((req.result as Book) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function loadAllBooks(): Promise<Book[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKS_STORE, "readonly");
    const req = tx.objectStore(BOOKS_STORE).getAll();
    req.onsuccess = () => {
      const books = req.result as Book[];
      resolve(books);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBook(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([BOOKS_STORE, META_STORE], "readwrite");
    tx.objectStore(BOOKS_STORE).delete(id);
    // clear current if it points to this book
    const metaReq = tx.objectStore(META_STORE).get(CURRENT_KEY);
    metaReq.onsuccess = () => {
      if (metaReq.result === id) {
        tx.objectStore(META_STORE).delete(CURRENT_KEY);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCurrentBookId(): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readonly");
    const req = tx.objectStore(META_STORE).get(CURRENT_KEY);
    req.onsuccess = () => resolve((req.result as string) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function setCurrentBookId(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readwrite");
    tx.objectStore(META_STORE).put(id, CURRENT_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Offline pending-progress queue ────────────────────────────────────────
// Stores the most-recent unsynced chunk position per book slug in localStorage.
// Only the latest position matters because the API accepts the final index.

const PENDING_PROGRESS_KEY = "reedfeed_pending_progress";

type PendingProgressMap = Record<string, number>; // slug → chunkIndex

function loadPendingProgressMap(): PendingProgressMap {
  try {
    const raw = localStorage.getItem(PENDING_PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as PendingProgressMap) : {};
  } catch {
    return {};
  }
}

/** Persist (or overwrite) the latest unsynced position for a book. */
export function queuePendingProgress(slug: string, chunkIndex: number): void {
  const map = loadPendingProgressMap();
  map[slug] = chunkIndex;
  localStorage.setItem(PENDING_PROGRESS_KEY, JSON.stringify(map));
}

/** Return all pending (slug, chunkIndex) pairs. */
export function getPendingProgress(): Array<
  { slug: string; chunkIndex: number }
> {
  const map = loadPendingProgressMap();
  return Object.entries(map).map(([slug, chunkIndex]) => ({
    slug,
    chunkIndex,
  }));
}

/** Remove a successfully-synced entry. */
export function clearPendingProgress(slug: string): void {
  const map = loadPendingProgressMap();
  delete map[slug];
  localStorage.setItem(PENDING_PROGRESS_KEY, JSON.stringify(map));
}

/** Wipe all books, reading position, and pending-progress data. Called on logout. */
export async function clearAllData(): Promise<void> {
  // Clear IndexedDB stores
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([BOOKS_STORE, META_STORE], "readwrite");
    tx.objectStore(BOOKS_STORE).clear();
    tx.objectStore(META_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  // Clear localStorage progress queue
  localStorage.removeItem(PENDING_PROGRESS_KEY);
}
