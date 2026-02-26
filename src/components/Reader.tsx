import { useEffect, useRef, useState } from 'react';

interface ReaderProps {
  chunks: string[];
  title: string;
  initialChunk?: number;
  onBack: () => void;
  onPositionChange?: (position: number) => void;
}

export default function Reader({ chunks, title, initialChunk = 0, onBack, onPositionChange }: ReaderProps) {
  const [current, setCurrent] = useState(initialChunk);
  const containerRef = useRef<HTMLDivElement>(null);
  const chunkRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Keep latest callback in a ref so the observer closure never goes stale
  const onPositionChangeRef = useRef(onPositionChange);
  useEffect(() => { onPositionChangeRef.current = onPositionChange; }, [onPositionChange]);

  // Scroll to the saved position on first mount (instant, no animation)
  useEffect(() => {
    if (initialChunk <= 0) return;
    const el = chunkRefs.current[initialChunk];
    if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track which chunk is currently centered using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setCurrent(index);
            onPositionChangeRef.current?.(index);
          }
        }
      },
      {
        root: containerRef.current,
        threshold: 0.6,
      }
    );

    const refs = chunkRefs.current;
    refs.forEach((el) => { if (el) observer.observe(el); });

    return () => {
      refs.forEach((el) => { if (el) observer.unobserve(el); });
    };
  }, [chunks]);

  const progress = chunks.length > 0 ? Math.round(((current + 1) / chunks.length) * 100) : 0;

  return (
    <div className="relative h-screen bg-stone-950 overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-4
        bg-gradient-to-b from-stone-950 to-transparent pointer-events-none">
        <button
          onClick={onBack}
          className="pointer-events-auto text-stone-500 hover:text-stone-300 transition-colors text-sm"
        >
          ← Back
        </button>
        <p className="text-stone-600 text-sm font-medium truncate max-w-xs">{title}</p>
        <span className="text-stone-500 text-sm tabular-nums">
          {current + 1} / {chunks.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-stone-800 z-20">
        <div
          className="h-full bg-amber-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Scrollable chunk feed */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {/* Top spacer so first chunk starts centered */}
        <div style={{ height: 0 }} />

        {chunks.map((chunk, i) => (
          <div
            key={i}
            data-index={i}
            ref={(el) => { chunkRefs.current[i] = el; }}
            className="min-h-screen flex items-center justify-center px-8"
            style={{ scrollSnapAlign: 'center' }}
          >
            <div
              className={`max-w-xl w-full transition-all duration-500 ${
                i === current
                  ? 'opacity-100 scale-100'
                  : 'opacity-20 scale-95'
              }`}
            >
              <p className="text-stone-100 text-xl md:text-2xl leading-relaxed font-serif text-balance">
                {chunk}
              </p>
            </div>
          </div>
        ))}

        {/* Completion card */}
        <div
          className="min-h-screen flex items-center justify-center px-8"
          style={{ scrollSnapAlign: 'center' }}
        >
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-6">✓</div>
            <h2 className="text-stone-200 text-2xl font-semibold mb-2">You finished it.</h2>
            <p className="text-stone-500 mb-8 text-sm">{chunks.length} chunks · {title}</p>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-xl bg-amber-400 text-stone-950 font-semibold hover:bg-amber-300 transition-colors"
            >
              Read something else
            </button>
          </div>
        </div>
      </div>

      {/* Scroll hint on first chunk */}
      {current === 0 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-1 text-stone-600 text-xs animate-bounce">
            <span>scroll</span>
            <span>↓</span>
          </div>
        </div>
      )}
    </div>
  );
}
