/**
 * Text-to-speech playback with prefetch and autoplay advance.
 *
 * Same state machine and public API as the web `src/hooks/useTts.ts`.
 * Differences forced by the platform:
 *  - `expo-audio` plays from a file URI, not a Blob URL, so each chunk's audio
 *    is written to the cache directory instead of `URL.createObjectURL`.
 *  - `setAudioModeAsync({ shouldPlayInBackground: true })` keeps playback alive
 *    when the screen locks (requires the `audio` background mode in app.json).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AudioPlayer,
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { TTS_API_URL, TTS_SPEAKER, TTS_SPEED } from "@/lib/ttsConfig";

export type TtsState = "idle" | "loading" | "playing";

/** Strip markdown syntax so the API receives plain text. */
function stripMarkdown(raw: string): string {
  return raw
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

let fileCounter = 0;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  return globalThis.btoa(binary);
}

/** Fetches synthesized audio and returns a local file URI. */
async function fetchAudioFile(
  text: string,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(TTS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, speaker: TTS_SPEAKER, speed: TTS_SPEED }),
    signal,
  });
  if (!res.ok) throw new Error(`TTS request failed: ${res.status}`);

  const base64 = arrayBufferToBase64(await res.arrayBuffer());

  const uri = `${FileSystem.cacheDirectory}tts-${fileCounter++}.wav`;
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return uri;
}

export interface UseTtsOptions {
  chunks: string[];
  onAdvance: (nextIndex: number) => void;
}

export interface UseTtsReturn {
  ttsState: TtsState;
  play: (index: number) => void;
  stop: () => void;
  onChunkChanged: (newIndex: number) => void;
}

export function useTts({ chunks, onAdvance }: UseTtsOptions): UseTtsReturn {
  const [ttsState, setTtsState] = useState<TtsState>("idle");

  const chunksRef = useRef(chunks);
  chunksRef.current = chunks;
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;

  const isAutoplayRef = useRef(false);
  const pendingAutoplayRef = useRef(false);
  const playerRef = useRef<AudioPlayer | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prefetchRef = useRef<{ index: number; uri: string } | null>(null);
  const prefetchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "duckOthers",
    }).catch(() => {});
  }, []);

  const cancelPrefetch = useCallback(() => {
    prefetchAbortRef.current?.abort();
    prefetchAbortRef.current = null;
    prefetchRef.current = null;
  }, []);

  const releasePlayer = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.remove();
      playerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    isAutoplayRef.current = false;
    pendingAutoplayRef.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
    cancelPrefetch();
    releasePlayer();
    setTtsState("idle");
  }, [cancelPrefetch, releasePlayer]);

  const prefetch = useCallback(async (index: number) => {
    const currentChunks = chunksRef.current;
    if (index >= currentChunks.length) return;
    if (prefetchRef.current?.index === index) return;

    prefetchAbortRef.current?.abort();
    const controller = new AbortController();
    prefetchAbortRef.current = controller;

    const text = stripMarkdown(currentChunks[index]);
    if (!text) return;

    try {
      const uri = await fetchAudioFile(text, controller.signal);
      if (!controller.signal.aborted) prefetchRef.current = { index, uri };
    } catch {
      // Non-fatal: the on-demand fetch is the fallback.
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
        if (isAutoplayRef.current && index + 1 < currentChunks.length) {
          pendingAutoplayRef.current = true;
          onAdvanceRef.current(index + 1);
        } else {
          stop();
        }
        return;
      }

      setTtsState("loading");

      let uri: string;
      if (prefetchRef.current?.index === index) {
        uri = prefetchRef.current.uri;
        prefetchRef.current = null;
        prefetchAbortRef.current = null;
      } else {
        cancelPrefetch();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          uri = await fetchAudioFile(text, controller.signal);
        } catch (e) {
          if ((e as Error).name !== "AbortError") {
            console.error("TTS error:", e);
          }
          isAutoplayRef.current = false;
          setTtsState("idle");
          return;
        }
      }

      releasePlayer();
      const player = createAudioPlayer({ uri });
      playerRef.current = player;

      player.addListener("playbackStatusUpdate", (status) => {
        if (!status.didJustFinish) return;
        const nextChunks = chunksRef.current;
        if (isAutoplayRef.current && index + 1 < nextChunks.length) {
          pendingAutoplayRef.current = true;
          setTtsState("loading");
          onAdvanceRef.current(index + 1);
        } else {
          isAutoplayRef.current = false;
          setTtsState("idle");
        }
      });

      player.play();
      setTtsState("playing");

      if (isAutoplayRef.current && index + 1 < currentChunks.length) {
        prefetch(index + 1);
      }
    },
    [stop, cancelPrefetch, prefetch, releasePlayer],
  );

  const play = useCallback(
    (index: number) => {
      isAutoplayRef.current = true;
      playIndex(index);
    },
    [playIndex],
  );

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

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      prefetchAbortRef.current?.abort();
      playerRef.current?.remove();
    };
  }, []);

  return { ttsState, play, stop, onChunkChanged };
}
