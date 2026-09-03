/**
 * Persists books and reading position.
 *
 * Web used IndexedDB; native uses expo-sqlite. The exported API is identical to
 * `src/lib/storage.ts` in the web app so screens port over unchanged.
 * Chunk arrays are stored as a JSON column — books are text-only and a few
 * hundred KB at most.
 */
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DB_NAME = "lauselt.db";
const CURRENT_KEY = "currentBookId";

export interface Book {
  id: string; // stable slug derived from title
  title: string;
  author?: string;
  chunks: string[];
  position: number;
  lastRead?: number; // unix ms — updated on every scroll
  slug?: string; // API book slug, present when loaded from the server
}

interface BookRow {
  id: string;
  title: string;
  author: string | null;
  chunks: string;
  position: number;
  lastRead: number | null;
  slug: string | null;
}

export function bookId(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\u00C0-\u024F]+/gi, "-")
      .replace(/^-|-$/g, "") || "book"
  );
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS books (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          author TEXT,
          chunks TEXT NOT NULL,
          position INTEGER NOT NULL DEFAULT 0,
          lastRead INTEGER,
          slug TEXT
        );
        CREATE TABLE IF NOT EXISTS meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

function rowToBook(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author ?? undefined,
    chunks: JSON.parse(row.chunks) as string[],
    position: row.position,
    lastRead: row.lastRead ?? undefined,
    slug: row.slug ?? undefined,
  };
}

export async function saveBook(book: Book): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO books (id, title, author, chunks, position, lastRead, slug)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       author = excluded.author,
       chunks = excluded.chunks,
       position = excluded.position,
       lastRead = excluded.lastRead,
       slug = excluded.slug`,
    [
      book.id,
      book.title,
      book.author ?? null,
      JSON.stringify(book.chunks),
      book.position,
      book.lastRead ?? null,
      book.slug ?? null,
    ],
  );
}

export async function loadBook(id: string): Promise<Book | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<BookRow>(
    "SELECT * FROM books WHERE id = ?",
    [id],
  );
  return row ? rowToBook(row) : null;
}

export async function loadAllBooks(): Promise<Book[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<BookRow>("SELECT * FROM books");
  return rows.map(rowToBook);
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM books WHERE id = ?", [id]);
  if ((await getCurrentBookId()) === id) {
    await db.runAsync("DELETE FROM meta WHERE key = ?", [CURRENT_KEY]);
  }
}

export async function getCurrentBookId(): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM meta WHERE key = ?",
    [
      CURRENT_KEY,
    ],
  );
  return row?.value ?? null;
}

export async function setCurrentBookId(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [CURRENT_KEY, id],
  );
}

// ── Offline pending-progress queue ────────────────────────────────────────
// Latest unsynced chunk position per book slug. Only the newest matters
// because the API accepts the final index.

const PENDING_PROGRESS_KEY = "lauselt_pending_progress";

type PendingProgressMap = Record<string, number>; // slug → chunkIndex

let pendingCache: PendingProgressMap = {};

/** Must be awaited once at startup, alongside `hydrateAuth()`. */
export async function hydratePendingProgress(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_PROGRESS_KEY);
    pendingCache = raw ? (JSON.parse(raw) as PendingProgressMap) : {};
  } catch {
    pendingCache = {};
  }
}

function persistPending(): void {
  AsyncStorage.setItem(PENDING_PROGRESS_KEY, JSON.stringify(pendingCache))
    .catch(() => {});
}

export function queuePendingProgress(slug: string, chunkIndex: number): void {
  pendingCache[slug] = chunkIndex;
  persistPending();
}

export function getPendingProgress(): Array<
  { slug: string; chunkIndex: number }
> {
  return Object.entries(pendingCache).map(([slug, chunkIndex]) => ({
    slug,
    chunkIndex,
  }));
}

export function clearPendingProgress(slug: string): void {
  delete pendingCache[slug];
  persistPending();
}

/** Wipe all books, reading position and pending progress. Called on logout. */
export async function clearAllData(): Promise<void> {
  const db = await getDb();
  await db.execAsync("DELETE FROM books; DELETE FROM meta;");
  pendingCache = {};
  await AsyncStorage.removeItem(PENDING_PROGRESS_KEY);
}
