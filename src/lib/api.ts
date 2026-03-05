import { apiFetch } from "./auth";

// ── Types ─────────────────────────────────────────────────────────────────

export interface ApiBook {
  id: string;
  title: string;
  author: string;
  slug: string;
  totalChunks: number;
}

export interface BookProgress {
  currentChunk: number;
  lastReadAt: string;
}

export interface BookDetail {
  book: ApiBook;
  progress: BookProgress | null;
}

export interface BookChunksResponse {
  slug: string;
  totalChunks: number;
  from: number;
  to: number;
  chunks: string[];
}

export interface ReadingOpenResponse {
  book: { id: string; title: string; slug: string; totalChunks: number };
  currentChunk: number;
}

export interface ScrollResponse {
  currentChunk: number;
  dailyProgress: {
    chunksScrolled: number;
    goalMet: boolean;
    dailyGoal: number;
  };
  streakUpdated: boolean;
}

export interface CurrentReadingResponse {
  currentBook: (ApiBook & { currentChunk: number; lastReadAt: string }) | null;
}

export interface ReadingProgressEntry extends ApiBook {
  currentChunk: number;
  lastReadAt: string;
  percentComplete: number;
}

export interface AllReadingProgressResponse {
  books: ReadingProgressEntry[];
}

export interface UserStats {
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string | null;
  };
  today: {
    chunksScrolled: number;
    goalMet: boolean;
    dailyGoal: number;
    remaining: number;
  };
  totals: {
    chunksRead: number;
    daysActive: number;
    booksStarted: number;
  };
}

export interface DailyRecord {
  date: string;
  chunksScrolled: number;
  goalMet: boolean;
}

export interface DailyStatsResponse {
  dailyGoal: number;
  history: DailyRecord[];
}

// ── Books ──────────────────────────────────────────────────────────────────

export async function getBooks(): Promise<ApiBook[]> {
  const res = await apiFetch("/books");
  if (!res.ok) throw new Error(`GET /books failed: ${res.status}`);
  const data = await res.json();
  return data.books as ApiBook[];
}

export async function getBookDetail(slug: string): Promise<BookDetail> {
  const res = await apiFetch(`/books/${slug}`);
  if (!res.ok) throw new Error(`GET /books/${slug} failed: ${res.status}`);
  return res.json() as Promise<BookDetail>;
}

export async function getBookChunks(slug: string, from = 0, to = 20): Promise<BookChunksResponse> {
  const res = await apiFetch(`/books/${slug}/chunks?from=${from}&to=${to}`);
  if (!res.ok) {
    throw new Error(`GET /books/${slug}/chunks failed: ${res.status}`);
  }
  return res.json() as Promise<BookChunksResponse>;
}

// ── Reading ────────────────────────────────────────────────────────────────

export async function openBook(bookSlug: string): Promise<ReadingOpenResponse> {
  const res = await apiFetch("/reading/open", {
    method: "POST",
    body: JSON.stringify({ bookSlug }),
  });
  if (!res.ok) throw new Error(`POST /reading/open failed: ${res.status}`);
  return res.json() as Promise<ReadingOpenResponse>;
}

export async function recordScroll(bookSlug: string, chunkIndex: number): Promise<ScrollResponse> {
  const res = await apiFetch("/reading/scroll", {
    method: "POST",
    body: JSON.stringify({ bookSlug, chunkIndex }),
  });
  if (!res.ok) throw new Error(`POST /reading/scroll failed: ${res.status}`);
  return res.json() as Promise<ScrollResponse>;
}

export async function getCurrentReading(): Promise<CurrentReadingResponse> {
  const res = await apiFetch("/reading/current");
  if (!res.ok) throw new Error(`GET /reading/current failed: ${res.status}`);
  return res.json() as Promise<CurrentReadingResponse>;
}

export async function getAllReadingProgress(): Promise<AllReadingProgressResponse> {
  const res = await apiFetch("/reading/progress");
  if (!res.ok) throw new Error(`GET /reading/progress failed: ${res.status}`);
  return res.json() as Promise<AllReadingProgressResponse>;
}

// ── Stats ──────────────────────────────────────────────────────────────────

export async function getStats(): Promise<UserStats> {
  const res = await apiFetch("/stats");
  if (!res.ok) throw new Error(`GET /stats failed: ${res.status}`);
  return res.json() as Promise<UserStats>;
}

export async function getDailyStats(days = 30): Promise<DailyStatsResponse> {
  const res = await apiFetch(`/stats/daily?days=${days}`);
  if (!res.ok) throw new Error(`GET /stats/daily failed: ${res.status}`);
  return res.json() as Promise<DailyStatsResponse>;
}
