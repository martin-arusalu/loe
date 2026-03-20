export default function LoadingScreen() {
  return (
    <div className="h-screen w-full bg-stone-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/3 w-40 h-40 rounded-full bg-amber-900/8 blur-3xl animate-glow-drift-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-28 h-28 rounded-full bg-stone-700/10 blur-2xl animate-glow-drift" />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-950/6 blur-3xl animate-glow-drift-slow"
          style={{ animationDelay: "4s" }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute w-1 h-1 rounded-full bg-stone-700 back-panel-particle"
          style={{ top: "28%", left: "22%", animationDelay: "0s" }}
        />
        <div
          className="absolute w-1 h-1 rounded-full bg-stone-700 back-panel-particle"
          style={{ top: "62%", left: "75%", animationDelay: "0.7s" }}
        />
        <div
          className="absolute w-0.5 h-0.5 rounded-full bg-amber-800/60 back-panel-particle"
          style={{ top: "42%", left: "15%", animationDelay: "1.3s" }}
        />
        <div
          className="absolute w-0.5 h-0.5 rounded-full bg-stone-600 back-panel-particle"
          style={{ top: "75%", left: "55%", animationDelay: "0.4s" }}
        />
        <div
          className="absolute w-1 h-1 rounded-full bg-amber-900/50 back-panel-particle"
          style={{ top: "18%", left: "65%", animationDelay: "1.8s" }}
        />
        <div
          className="absolute w-0.5 h-0.5 rounded-full bg-stone-700 back-panel-particle"
          style={{ top: "85%", left: "32%", animationDelay: "0.9s" }}
        />
      </div>

      {/* Spinner */}
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          <div className="back-panel-ring w-14 h-14 rounded-full" />
          <div className="absolute flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-500 back-panel-dot-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-stone-500 back-panel-dot-2" />
            <div className="w-1.5 h-1.5 rounded-full bg-stone-500 back-panel-dot-3" />
          </div>
        </div>
        <span className="text-stone-700 text-xs tracking-widest uppercase back-panel-label-shimmer">
          Laen
        </span>
      </div>
    </div>
  );
}
