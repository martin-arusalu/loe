import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import remarkBreaks from "remark-breaks";
import { defaultRemarkPlugins, Streamdown } from "streamdown";
import { UserStats } from "@/lib/api";
import formatNumber from "@/lib/formatNumber";
import { APP_VERSION } from "@/lib/constants";
import { Flame } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const ENABLE_GOTO = false;

interface ReaderProps {
  chunks: string[];
  title: string;
  initialChunk?: number;
  onBack: () => void;
  onPositionChange?: (position: number, forward: boolean) => void;
  stats?: UserStats | null;
}

// Index chunks.length is used as the virtual "completion card" slot.
export default function Reader({
  chunks,
  title,
  initialChunk = 0,
  onBack,
  onPositionChange,
  stats,
}: ReaderProps) {
  // curIndex is the index of the chunk currently centered.
  // chunks.length means the completion card is centered.
  const [curIndex, setCurIndex] = useState(initialChunk);
  const [goToValue, setGoToValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const hContainerRef = useRef<HTMLDivElement>(null);
  // Flag: we just shifted the window and need to re-center scroll without animation.
  const needsRecenter = useRef(false);
  const [streakJustCompleted, setStreakJustCompleted] = useState(false);
  const prevGoalMetRef = useRef<boolean>(stats?.today.goalMet ?? false);
  const [showChapterDialog, setShowChapterDialog] = useState(false);

  const chapters = useMemo(() => {
    return chunks
      .map((chunk, index) => ({ chunk, index }))
      .filter(({ chunk }) => chunk.trimStart().startsWith("## "))
      .map(({ chunk, index }) => {
        const firstLine = chunk.trimStart().split("\n")[0];
        const title = firstLine.replace(/^##\s*/, "");
        return { index, title };
      });
  }, [chunks]);

  const currentChapter = useMemo(() => {
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (chapters[i].index <= curIndex) return chapters[i];
    }
    return null;
  }, [chapters, curIndex]);

  const prevIndex = curIndex > 0 ? curIndex - 1 : null;
  const nextIndex = curIndex < chunks.length ? curIndex + 1 : null;

  // Keep latest callback in a ref so event-listener closures never go stale.
  const onPositionChangeRef = useRef(onPositionChange);
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  // On first mount, scroll so the current chunk is centered (position 1 when prev exists, else 0).
  // Also center the horizontal container on the reader panel (index 1, between back and Go To panels).
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = prevIndex !== null ? el.clientHeight : 0;
    const hEl = hContainerRef.current;
    if (hEl) hEl.scrollLeft = hEl.clientWidth;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After a window shift, instantly re-center scroll so there is no visual jump.
  useLayoutEffect(() => {
    if (!needsRecenter.current) return;
    needsRecenter.current = false;
    const el = containerRef.current;
    if (!el) return;
    // After the shift, the new curIndex may or may not have a prev.
    const hasPrev = curIndex > 0;
    el.scrollTop = hasPrev ? el.clientHeight : 0;
  }, [curIndex]);

  // Detect when the user snaps to prev or next and shift the window.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScrollEnd = () => {
      const height = el.clientHeight;
      // Which slot (0-based) is now snapped into view?
      const slot = Math.round(el.scrollTop / height);
      const hasPrev = curIndex > 0;

      // Slot layout:  [prev?, current, next?]
      // With prev:    slot 0 = prev, slot 1 = cur, slot 2 = next
      // Without prev: slot 0 = cur, slot 1 = next

      const scrolledToPrev = hasPrev && slot === 0 && prevIndex !== null;
      const scrolledToNext = hasPrev
        ? slot === 2 && nextIndex !== null
        : slot === 1 && nextIndex !== null;

      if (scrolledToPrev) {
        needsRecenter.current = true;
        setCurIndex(prevIndex!);
        onPositionChangeRef.current?.(prevIndex!, false);
      } else if (scrolledToNext) {
        needsRecenter.current = true;
        setCurIndex(nextIndex!);
        onPositionChangeRef.current?.(nextIndex!, true);
      }

      trackEvent("chunk scrolled", {
        book: title,
        chunk: nextIndex,
        direction: scrolledToNext ? "next" : "prev",
        time: new Date().toISOString(),
      });
    };

    // `scrollend` is only available in Safari 17.4+ — fall back to a debounced
    // scroll listener on older iOS devices where the event never fires.
    const supportsScrollEnd = "onscrollend" in window;
    if (supportsScrollEnd) {
      el.addEventListener("scrollend", handleScrollEnd);
      return () => el.removeEventListener("scrollend", handleScrollEnd);
    } else {
      let timer: ReturnType<typeof setTimeout>;
      const handleScroll = () => {
        clearTimeout(timer);
        timer = setTimeout(handleScrollEnd, 150);
      };
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        el.removeEventListener("scroll", handleScroll);
        clearTimeout(timer);
      };
    }
  }, [curIndex, prevIndex, nextIndex, chunks.length, title]);

  // Detect horizontal swipe left (snap to back panel) → go home.
  useEffect(() => {
    const el = hContainerRef.current;
    if (!el) return;

    const handleHScrollEnd = () => {
      if (Math.round(el.scrollLeft / el.clientWidth) === 0) {
        onBack();
      }
    };

    const supportsScrollEnd = "onscrollend" in window;
    if (supportsScrollEnd) {
      el.addEventListener("scrollend", handleHScrollEnd);
      return () => el.removeEventListener("scrollend", handleHScrollEnd);
    } else {
      let timer: ReturnType<typeof setTimeout>;
      const handleHScroll = () => {
        clearTimeout(timer);
        timer = setTimeout(handleHScrollEnd, 150);
      };
      el.addEventListener("scroll", handleHScroll, { passive: true });
      return () => {
        el.removeEventListener("scroll", handleHScroll);
        clearTimeout(timer);
      };
    }
  }, [onBack]);

  const progress =
    chunks.length > 0
      ? Math.round(((Math.min(curIndex, chunks.length - 1) + 1) / chunks.length) * 100)
      : 0;

  useEffect(() => {
    const prevGoalMet = prevGoalMetRef.current;
    const currentGoalMet = stats?.today.goalMet ?? false;

    if (!prevGoalMet && currentGoalMet) {
      setStreakJustCompleted(true);
    }

    prevGoalMetRef.current = currentGoalMet;
  }, [stats?.today.goalMet]);

  useEffect(() => {
    if (!streakJustCompleted) return;

    const timeout = window.setTimeout(() => {
      setStreakJustCompleted(false);
    }, 1200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [streakJustCompleted]);

  // Build the 2–3 items that are actually in the DOM.
  const windowItems: { id: string; index: number }[] = [];
  if (prevIndex !== null) {
    windowItems.push({ id: `chunk-${prevIndex}`, index: prevIndex });
  }
  windowItems.push({ id: `chunk-${curIndex}`, index: curIndex });
  if (nextIndex !== null) {
    windowItems.push({ id: `chunk-${nextIndex}`, index: nextIndex });
  }

  const goToChunk = (raw: string) => {
    const num = parseInt(raw, 10);
    if (isNaN(num)) return;
    const clamped = Math.max(1, Math.min(num, chunks.length)) - 1; // 1-based → 0-based
    needsRecenter.current = true;
    setCurIndex(clamped);
    onPositionChangeRef.current?.(clamped, false);
    setGoToValue("");
    setTimeout(
      () =>
        hContainerRef.current?.scrollTo({
          left: hContainerRef.current.clientWidth,
          behavior: "smooth",
        }),
      0
    );
    trackEvent("chunk goto", { book: title, chunk: clamped, time: new Date().toISOString() });
  };

  const handleAppRefresh = async () => {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    window.location.reload();
  };

  const openStatsPanel = () => {
    const hEl = hContainerRef.current;
    if (!hEl) return;
    hEl.scrollTo({ left: hEl.clientWidth * 2, behavior: "smooth" });
  };

  return (
    /* Horizontal snap container: Go Home (left) + reader (center) + Go To (right) */
    <div
      ref={hContainerRef}
      className="h-screen overflow-x-scroll flex"
      style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
    >
      {/* ── Back panel (swipe left to go home) ── */}
      <div className="h-screen min-w-full bg-stone-950" style={{ scrollSnapAlign: "start" }} />

      {/* ── Reader panel ── */}
      <div
        className="relative h-screen min-w-full flex flex-col bg-stone-950 overflow-hidden"
        style={{ scrollSnapAlign: "start" }}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 px-8 pt-4 bg-gradient-to-b from-stone-950 to-transparent pointer-events-none">
          <div className="flex items-center justify-between w-full">
            <button
              onClick={onBack}
              className="pointer-events-auto text-stone-500 hover:text-stone-300 transition-colors text-sm whitespace-nowrap min-w-0 flex-shrink-0 flex items-center"
            >
              ← Tagasi
            </button>
            {stats && curIndex < chunks.length && (
              <button
                type="button"
                onClick={openStatsPanel}
                className="pointer-events-auto"
                aria-label="Ava statistika"
              >
                <div className="flex gap-2">
                  {stats.today.goalMet && (
                    <div
                      className={`flex items-center gap-1 text-amber-500 text-sm ${
                        streakJustCompleted ? "streak-celebrate" : ""
                      }`}
                    >
                      <Flame size={14} className="text-amber-500" aria-hidden="true" />
                    </div>
                  )}
                  <span className="text-stone-500 text-sm tabular-nums whitespace-nowrap min-w-0 flex-shrink-0 flex items-center justify-end">
                    {formatNumber(stats.today.chunksScrolled)}/{formatNumber(stats.today.dailyGoal)}
                  </span>
                </div>
              </button>
            )}
          </div>
          <p className="text-stone-600 text-sm font-medium truncate text-center mt-2 w-full">
            {title}
          </p>
        </div>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-stone-800 z-20">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, boxShadow: "0 0 8px rgba(245,158,11,0.3)" }}
          />
        </div>

        {/* Scrollable chunk feed — only prev / current / next in the DOM */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden overflow-y-scroll"
          style={{ scrollSnapType: "y mandatory" }}
        >
          {windowItems.map(({ id, index }) =>
            index === chunks.length ? (
              // Completion card
              <div
                key={id}
                className="min-h-screen flex items-center justify-center px-8"
                style={{ scrollSnapAlign: "center" }}
              >
                <div className="text-center max-w-sm animate-fade-in-up">
                  <div className="w-16 h-16 rounded-2xl glass-amber flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">✓</span>
                  </div>
                  <h2
                    className="text-stone-200 text-xl font-semibold tracking-[0.12em] mb-2"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Lõpetatud
                  </h2>
                  <p className="text-stone-600 mb-8 text-sm">
                    {formatNumber(chunks.length)} lõiku · {title}
                  </p>
                  <button
                    onClick={onBack}
                    className="btn-primary px-8 py-3 rounded-xl text-sm font-semibold"
                  >
                    Loe midagi muud
                  </button>
                </div>
              </div>
            ) : (
              // Regular chunk
              <div
                key={id}
                className="min-h-screen flex items-center justify-center px-8"
                style={{ scrollSnapAlign: "center" }}
              >
                <div
                  className={`max-w-xl w-full${chunks[index].trimStart().startsWith("## ") ? " border-l-2 border-amber-600/40 pl-4" : ""}`}
                >
                  <div className="text-stone-100 text-xl md:text-2xl leading-relaxed font-serif text-balance prose prose-invert prose-p:my-4 prose-strong:font-bold prose-em:italic prose-ul:my-4 prose-ol:my-4 prose-li:my-1">
                    <Streamdown
                      linkSafety={{ enabled: false }}
                      remarkPlugins={[...Object.values(defaultRemarkPlugins), remarkBreaks]}
                    >
                      {chunks[index]}
                    </Streamdown>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Scroll hint on first chunk */}
        {curIndex === 0 && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-1 text-stone-600 text-xs animate-bounce">
              <span>keri</span>
              <span>↓</span>
            </div>
          </div>
        )}

        {/* Chunk position & chapter */}
        {curIndex < chunks.length && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-3 pointer-events-none">
            <span className="text-stone-600 text-xs tabular-nums">
              {formatNumber(curIndex + 1)} / {formatNumber(chunks.length)}
            </span>
            {chapters.length > 0 && (
              <button
                className="pointer-events-auto text-stone-500 hover:text-stone-300 transition-colors text-xs"
                onClick={() => setShowChapterDialog(true)}
              >
                {currentChapter ? `Peatükk ${currentChapter.title}` : "Peatükk"}
              </button>
            )}
          </div>
        )}

        {/* Chapter selection dialog */}
        {showChapterDialog && (
          <div
            className="absolute inset-0 z-30 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center px-8"
            onClick={() => setShowChapterDialog(false)}
          >
            <div
              className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl p-5 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                className="text-stone-200 text-lg font-semibold mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Mine peatükile
              </h3>
              <div className="flex flex-col gap-1">
                {chapters.map((ch) => (
                  <button
                    key={ch.index}
                    className={`text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      ch.index === curIndex
                        ? "bg-amber-500/10 text-amber-400"
                        : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                    }`}
                    onClick={() => {
                      needsRecenter.current = true;
                      setCurIndex(ch.index);
                      onPositionChangeRef.current?.(ch.index, false);
                      setShowChapterDialog(false);
                    }}
                  >
                    {ch.title}
                  </button>
                ))}
              </div>
              <button
                className="mt-4 w-full text-center text-stone-500 hover:text-stone-300 text-sm transition-colors"
                onClick={() => setShowChapterDialog(false)}
              >
                Sulge
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Go To panel (swipe right to reveal) ── */}
      <div
        className="relative h-screen min-w-full flex flex-col items-center bg-stone-900/50 px-8 justify-around"
        style={{ scrollSnapAlign: "start" }}
      >
        <div className="w-full max-w-xs flex flex-col gap-6">
          {/* Stats summary */}
          {stats && (
            <div className="mt-6">
              <div className="rounded-2xl bg-stone-950/50 border border-stone-800 p-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-lg font-semibold text-stone-200">Statistika</span>
                  {stats.today.goalMet ? (
                    <span className="text-xs text-amber-400">✓ eesmärk täidetud</span>
                  ) : (
                    <span className="text-xs text-stone-600">
                      {formatNumber(stats.today.remaining)} lõiku eesmärgini
                    </span>
                  )}
                </div>

                <table className="w-full text-sm mt-4">
                  <tbody className="divide-y divide-stone-800">
                    <tr>
                      <td className="py-3 text-stone-500">Kokku loetud</td>
                      <td className="py-3 text-right tabular-nums">
                        <span className="text-stone-200 font-semibold">
                          {formatNumber(stats.totals.chunksRead)}
                        </span>{" "}
                        <span className="text-stone-600">lõiku</span>
                        <div className="text-stone-600 text-[10px] mt-0.5">
                          Mis on umbes{" "}
                          {formatNumber(Math.round((stats.totals.chunksRead * 110) / 1500))}{" "}
                          raamatulehekülge
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-stone-500">Keskmine päevas</td>
                      <td className="py-3 text-right tabular-nums">
                        <span className="text-stone-200 font-semibold">
                          {stats.totals.daysActive > 0
                            ? formatNumber(
                                Math.round(stats.totals.chunksRead / stats.totals.daysActive)
                              )
                            : 0}
                        </span>{" "}
                        <span className="text-stone-600">lõiku</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-stone-500">Aktiivseid päevi</td>
                      <td className="py-3 text-right tabular-nums">
                        <span className="text-stone-200 font-semibold">
                          {stats.totals.daysActive}
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3 text-stone-500">Järjest</td>
                      <td className="py-3 text-right tabular-nums">
                        <span className="text-stone-200 font-semibold">{stats.streak.current}</span>{" "}
                        <span className="text-stone-600">
                          päev{stats.streak.current !== 1 && "a"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-stone-500">Täna loetud</td>
                      <td className="py-3 text-right tabular-nums">
                        <span className="text-stone-200 font-semibold">
                          {formatNumber(stats.today.chunksScrolled)}
                        </span>
                        <span className="text-stone-600">
                          /{formatNumber(stats.today.dailyGoal)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {!stats.today.goalMet && (
                  <div className="mt-4 h-1.5 rounded-full bg-stone-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-stone-500 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (stats.today.chunksScrolled / stats.today.dailyGoal) * 100
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {ENABLE_GOTO && (
            <div className="flex flex-col gap-3">
              <h2
                className="text-stone-200 text-lg font-semibold tracking-[0.12em] mb-1"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Mine lõigule
              </h2>
              <p className="text-stone-600 text-sm">1 – {formatNumber(chunks.length)}</p>

              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={chunks.length}
                value={goToValue}
                onChange={(e) => setGoToValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goToChunk(goToValue)}
                placeholder="Lõigu number"
                className="w-full rounded-xl bg-stone-800 text-stone-100 placeholder-stone-600 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400 tabular-nums"
              />

              <button
                onClick={() => goToChunk(goToValue)}
                disabled={goToValue === ""}
                className="w-full py-3 rounded-xl bg-amber-500 text-stone-950 font-semibold hover:bg-amber-400 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
              >
                Mine
              </button>
            </div>
          )}

          <button
            onClick={() =>
              hContainerRef.current?.scrollTo({
                left: hContainerRef.current.clientWidth,
                behavior: "smooth",
              })
            }
            className="text-stone-500 hover:text-stone-300 text-sm transition-colors text-center"
          >
            ← Tagasi
          </button>
        </div>
        <div className="flex flex-col gap-1 text-xs text-stone-600">
          <div>Rakenduse versioon: {APP_VERSION}</div>
          <button
            className="border p-2 rounded-xl border-stone-700 text-stone-500 hover:text-stone-300 text-sm transition-colors text-center"
            onClick={handleAppRefresh}
          >
            Värskenda
          </button>
        </div>
      </div>
    </div>
  );
}
