import { useEffect, useLayoutEffect, useRef, useState } from "react";
import remarkBreaks from "remark-breaks";
import { defaultRemarkPlugins, Streamdown } from "streamdown";
import { UserStats } from "@/lib/api";
import { APP_VERSION } from "@/lib/constants";
import { Flame } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

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

  const prevIndex = curIndex > 0 ? curIndex - 1 : null;
  const nextIndex = curIndex < chunks.length ? curIndex + 1 : null;

  // Keep latest callback in a ref so event-listener closures never go stale.
  const onPositionChangeRef = useRef(onPositionChange);
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  // On first mount, scroll so the current chunk is centered (position 1 when prev exists, else 0).
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = prevIndex !== null ? el.clientHeight : 0;
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
    setTimeout(() => hContainerRef.current?.scrollTo({ left: 0, behavior: "smooth" }), 0);
    trackEvent("chunk goto", { book: title, chunk: clamped, time: new Date().toISOString() });
  };

  const handleAppRefresh = async () => {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    window.location.reload();
  };

  return (
    /* Horizontal snap container: reader (left) + Go To (right) */
    <div
      ref={hContainerRef}
      className="h-screen overflow-x-scroll flex"
      style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
    >
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
            {curIndex < chunks.length && (
              <span className="text-stone-500 text-sm tabular-nums whitespace-nowrap min-w-0 flex-shrink-0 flex items-center justify-end">
                {curIndex + 1} / {chunks.length}
              </span>
            )}
          </div>
          <p className="text-stone-600 text-sm font-medium truncate text-center mt-2 w-full">
            {title}
          </p>
        </div>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-stone-800 z-20">
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
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
                <div className="text-center max-w-sm">
                  <div className="text-5xl mb-6">✓</div>
                  <h2 className="text-stone-200 text-2xl font-semibold mb-2">Oled lõpetanud.</h2>
                  <p className="text-stone-500 mb-8 text-sm">
                    {chunks.length} tükki · {title}
                  </p>
                  <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl bg-amber-400 text-stone-950 font-semibold hover:bg-amber-300 transition-colors"
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
                <div className="max-w-xl w-full">
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

        {/* Subtle streak completion indicator */}
        {stats?.today.goalMet && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
            <div
              className={`flex items-center gap-1.5 bg-stone-900/70 backdrop-blur-sm border border-amber-900/40 text-amber-600 text-xs px-3 py-1 rounded-full ${
                streakJustCompleted ? "streak-celebrate" : ""
              }`}
            >
              <Flame size={16} className="text-amber-500" aria-hidden="true" />
              <span className="tabular-nums">
                {stats.streak.current} päev{stats.streak.current !== 1 && "a"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Go To panel (swipe right to reveal) ── */}
      <div
        className="relative h-screen min-w-full flex flex-col items-center bg-stone-900 px-8 justify-around"
        style={{ scrollSnapAlign: "start" }}
      >
        <div className="w-full max-w-xs flex flex-col gap-6">
          {/* Stats summary */}
          {stats && (
            <>
              <h2 className="text-stone-200 text-2xl font-semibold mb-1">Statistika</h2>
              <div className="rounded-xl bg-stone-900 items-center border border-stone-800 p-4 flex">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-2xl font-bold text-amber-400 tabular-nums leading-none">
                    {stats.streak.current}
                  </span>
                  <span className="text-xs text-stone-500">
                    päev{stats.streak.current !== 1 && "a"} järjest
                  </span>
                </div>
                <div className="w-px bg-stone-800 mx-2" />
                <div className="flex-1 flex flex-col items-center gap-2">
                  <p className="text-2xl font-bold text-stone-200 tabular-nums leading-none">
                    {stats.today.chunksScrolled}
                    <span className="text-stone-600 text-base">/{stats.today.dailyGoal}</span>
                  </p>
                  <span className="text-xs text-stone-500">täna loetud</span>
                  {stats.today.goalMet ? (
                    <span className="text-xs text-amber-400">✓ eesmärk täidetud</span>
                  ) : (
                    <div className="w-full h-1 rounded-full bg-stone-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-stone-500 transition-all"
                        style={{
                          width: `${Math.min(100, (stats.today.chunksScrolled / stats.today.dailyGoal) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          <div>
            <h2 className="text-stone-200 text-2xl font-semibold mb-1">Mine tükile</h2>
            <p className="text-stone-500 text-sm">1 – {chunks.length}</p>
          </div>

          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={chunks.length}
            value={goToValue}
            onChange={(e) => setGoToValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goToChunk(goToValue)}
            placeholder="Tüki number"
            className="w-full rounded-xl bg-stone-800 text-stone-100 placeholder-stone-600 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400 tabular-nums"
          />

          <button
            onClick={() => goToChunk(goToValue)}
            disabled={goToValue === ""}
            className="w-full py-3 rounded-xl bg-amber-400 text-stone-950 font-semibold hover:bg-amber-300 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            Mine
          </button>

          <button
            onClick={() => hContainerRef.current?.scrollTo({ left: 0, behavior: "smooth" })}
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
