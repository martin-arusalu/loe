import { useCallback, useEffect, useRef, useState } from "react";
import { TTS_API_URL, TTS_SPEAKER, TTS_SPEED } from "@/lib/ttsConfig";

export type TtsState = "idle" | "loading" | "playing";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip markdown syntax so the API receives plain text. */
function stripMarkdown(raw: string): string {
  return raw
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

async function fetchAudioBlob(
  text: string,
  signal: AbortSignal,
): Promise<Blob> {
  const res = await fetch(TTS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, speaker: TTS_SPEAKER, speed: TTS_SPEED }),
    signal,
  });
  if (!res.ok) throw new Error(`TTS request failed: ${res.status}`);
  return res.blob();
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseTtsOptions {
  /**
   * The full list of text chunks being read.
   * Updated via ref internally, so the hook never goes stale.
   */
  chunks: string[];
  /**
   * Called when autoplay wants to advance to the next chunk.
   * The consumer is responsible for updating its own `curIndex` state.
   */
  onAdvance: (nextIndex: number) => void;
}

export interface UseTtsReturn {
  ttsState: TtsState;
  /** Start (or restart) autoplay from the given chunk index. */
  play: (index: number) => void;
  /** Stop playback and cancel any in-flight requests. */
  stop: () => void;
  /**
   * Must be called by the consumer whenever `curIndex` changes.
   * If the change was triggered by autoplay the hook will start playing the
   * new chunk; if the change was triggered by a manual scroll it will stop.
   */
  onChunkChanged: (newIndex: number) => void;
}

export function useTts({ chunks, onAdvance }: UseTtsOptions): UseTtsReturn {
  const [ttsState, setTtsState] = useState<TtsState>("idle");

  // Keep latest values accessible from async callbacks without stale closures.
  const chunksRef = useRef(chunks);
  chunksRef.current = chunks;
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;

  // Playback state (all refs — no re-renders needed to track these).
  const isAutoplayRef = useRef(false);
  const pendingAutoplayRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prefetchRef = useRef<{ index: number; blob: Blob } | null>(null);
  const prefetchAbortRef = useRef<AbortController | null>(null);

  // ---------------------------------------------------------------------------
  // Internal utilities
  // ---------------------------------------------------------------------------

  const cancelPrefetch = useCallback(() => {
    prefetchAbortRef.current?.abort();
    prefetchAbortRef.current = null;
    prefetchRef.current = null;
  }, []);

  const releaseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    isAutoplayRef.current = false;
    pendingAutoplayRef.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
    cancelPrefetch();
    releaseAudio();
    setTtsState("idle");
  }, [cancelPrefetch, releaseAudio]);

  // Prefetch the audio for a future chunk while the current one plays.
  const prefetch = useCallback(async (index: number) => {
    const currentChunks = chunksRef.current;
    if (index >= currentChunks.length) return;
    if (prefetchRef.current?.index === index) return; // already cached

    prefetchAbortRef.current?.abort();
    const controller = new AbortController();
    prefetchAbortRef.current = controller;

    const text = stripMarkdown(currentChunks[index]);
    if (!text) return;

    try {
      const blob = await fetchAudioBlob(text, controller.signal);
      if (!controller.signal.aborted) {
        prefetchRef.current = { index, blob };
      }
    } catch {
      // Prefetch failures are non-fatal; on-demand fetch will be the fallback.
    }
  }, []);

  const playIndex = useCallback(
    async (index: number) => {
      const currentChunks = chunksRef.current;

      if (index >= currentChunks.length) {
        stop();
        return;
      }

      const text = stripMarkdown(currentChunks[index]);

      if (!text) {
        // Skip empty chunks and keep going if autoplay is active.
        if (isAutoplayRef.current && index + 1 < currentChunks.length) {
          pendingAutoplayRef.current = true;
          onAdvanceRef.current(index + 1);
        } else {
          stop();
        }
        return;
      }

      setTtsState("loading");

      let blob: Blob;

      if (prefetchRef.current?.index === index) {
        // Use the pre-fetched blob immediately.
        blob = prefetchRef.current.blob;
        prefetchRef.current = null;
        prefetchAbortRef.current = null;
      } else {
        // Cancel any stale prefetch and fetch on-demand.
        cancelPrefetch();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          blob = await fetchAudioBlob(text, controller.signal);
        } catch (e) {
          if ((e as Error).name !== "AbortError") {
            console.error("TTS error:", e);
          }
          isAutoplayRef.current = false;
          setTtsState("idle");
          return;
        }
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        const nextChunks = chunksRef.current;
        if (isAutoplayRef.current && index + 1 < nextChunks.length) {
          pendingAutoplayRef.current = true;
          onAdvanceRef.current(index + 1);
          setTtsState("loading");
        } else {
          isAutoplayRef.current = false;
          setTtsState("idle");
        }
      });

      await audio.play();
      setTtsState("playing");

      // Kick off a prefetch for the next chunk while this one plays.
      if (isAutoplayRef.current && index + 1 < currentChunks.length) {
        prefetch(index + 1);
      }
    },
    [stop, cancelPrefetch, prefetch],
  );

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  const play = useCallback(
    (index: number) => {
      isAutoplayRef.current = true;
      playIndex(index);
    },
    [playIndex],
  );

  /**
   * Called by the consumer when it has changed the active chunk index.
   * If the change was triggered by autoplay the hook continues playing;
   * otherwise playback stops (manual navigation).
   */
  const onChunkChanged = useCallback(
    (newIndex: number) => {
      if (pendingAutoplayRef.current) {
        pendingAutoplayRef.current = false;
        playIndex(newIndex);
        return;
      }
      stop();
    },
    [playIndex, stop],
  );

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      prefetchAbortRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  return { ttsState, play, stop, onChunkChanged };
}
