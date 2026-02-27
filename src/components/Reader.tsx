import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Streamdown } from 'streamdown';

interface ReaderProps {
  chunks: string[];
  title: string;
  initialChunk?: number;
  onBack: () => void;
  onPositionChange?: (position: number) => void;
}

// Index chunks.length is used as the virtual "completion card" slot.
export default function Reader({ chunks, title, initialChunk = 0, onBack, onPositionChange }: ReaderProps) {
  // curIndex is the index of the chunk currently centered.
  // chunks.length means the completion card is centered.
  const [curIndex, setCurIndex] = useState(initialChunk);
  const containerRef = useRef<HTMLDivElement>(null);
  // Flag: we just shifted the window and need to re-center scroll without animation.
  const needsRecenter = useRef(false);

  const prevIndex = curIndex > 0 ? curIndex - 1 : null;
  const nextIndex = curIndex < chunks.length ? curIndex + 1 : null;

  // Keep latest callback in a ref so event-listener closures never go stale.
  const onPositionChangeRef = useRef(onPositionChange);
  useEffect(() => { onPositionChangeRef.current = onPositionChange; }, [onPositionChange]);

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
        onPositionChangeRef.current?.(prevIndex!);
      } else if (scrolledToNext) {
        needsRecenter.current = true;
        setCurIndex(nextIndex!);
        // Only report numeric chunk position, not the completion-card slot.
        if (nextIndex! < chunks.length) {
          onPositionChangeRef.current?.(nextIndex!);
        }
      }
    };

    el.addEventListener('scrollend', handleScrollEnd);
    return () => el.removeEventListener('scrollend', handleScrollEnd);
  }, [curIndex, prevIndex, nextIndex, chunks.length]);

  const progress = chunks.length > 0
    ? Math.round(((Math.min(curIndex, chunks.length - 1) + 1) / chunks.length) * 100)
    : 0;

  // Build the 2–3 items that are actually in the DOM.
  const windowItems: { id: string; index: number }[] = [];
  if (prevIndex !== null) windowItems.push({ id: `chunk-${prevIndex}`, index: prevIndex });
  windowItems.push({ id: `chunk-${curIndex}`, index: curIndex });
  if (nextIndex !== null) windowItems.push({ id: `chunk-${nextIndex}`, index: nextIndex });

  return (
    <div className="relative h-screen bg-stone-950 overflow-hidden flex flex-col">
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
        <p className="text-stone-600 text-sm font-medium truncate text-center mt-2 w-full">{title}</p>
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
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {windowItems.map(({ id, index }) =>
          index === chunks.length ? (
            // Completion card
            <div
              key={id}
              className="min-h-screen flex items-center justify-center px-8"
              style={{ scrollSnapAlign: 'center' }}
            >
              <div className="text-center max-w-sm">
                <div className="text-5xl mb-6">✓</div>
                <h2 className="text-stone-200 text-2xl font-semibold mb-2">Oled lõpetanud.</h2>
                <p className="text-stone-500 mb-8 text-sm">{chunks.length} tükki · {title}</p>
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
              style={{ scrollSnapAlign: 'center' }}
            >
              <div
                className="max-w-xl w-full"
              >
                <div className="text-stone-100 text-xl md:text-2xl leading-relaxed font-serif text-balance prose prose-invert prose-headings:font-semibold prose-p:my-4 prose-h1:my-6 prose-h2:my-5 prose-h3:my-4 prose-strong:font-bold prose-em:italic prose-ul:my-4 prose-ol:my-4 prose-li:my-1">
                  <Streamdown>{chunks[index]}</Streamdown>
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
    </div>
  );
}
