import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { parseEpub } from "@/lib/parseEpub";
import { trackEvent } from "@/lib/analytics";
import { Upload } from "lucide-react";

interface ImporterProps {
  onTextReady: (text: string, title: string) => void;
  onBack?: () => void;
}

export default function Importer({ onTextReady, onBack }: ImporterProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      try {
        const buffer = await file.arrayBuffer();
        let text = "";

        if (file.name.endsWith(".epub")) {
          text = await parseEpub(buffer);
        } else {
          text = await file.text();
        }

        if (!text.trim()) {
          setError("Failist ei leitud loetavat teksti.");
          return;
        }

        onTextReady(text, file.name.replace(/\.[^.]+$/, ""));
        trackEvent("imported file", {
          book: file.name.replace(/\.[^.]+$/, ""),
        });
      } catch (err) {
        console.error(err);
        setError("Faili töötlemine ebaõnnestus. Palun proovi teist faili.");
      } finally {
        setLoading(false);
      }
    },
    [onTextReady]
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) handleFile(accepted[0]);
    },
    [handleFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/epub+zip": [".epub"],
    },
    multiple: false,
  });

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-100 flex flex-col items-center px-6 py-10 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[60vw] h-[40vw] max-w-[500px] max-h-[350px] rounded-full bg-amber-900/4 blur-3xl animate-glow-drift-slow" />
      </div>

      {/* Back button */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {onBack && (
          <button
            onClick={onBack}
            className="text-stone-600 hover:text-stone-300 transition-colors duration-200 text-sm mb-8"
            aria-label="Tagasi avalehele"
          >
            ← Tagasi
          </button>
        )}
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-md -mt-10">
        <div className="text-center mb-8 select-none animate-fade-in-up delay-1">
          <h1
            className="text-xl font-semibold tracking-[0.12em] text-stone-200 mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Lae üles raamat
          </h1>
          <p className="text-stone-500 text-sm">Toetab EPUB formaadis faile</p>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`w-full glass rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 animate-fade-in-scale delay-2
            ${
              isDragActive
                ? "border-amber-500/40 bg-amber-500/5 scale-[1.02] shadow-[0_0_30px_rgba(245,158,11,0.08)]"
                : "hover:border-stone-600/60 hover:shadow-lg"
            }`}
          style={{ borderStyle: "dashed", borderWidth: "2px" }}
        >
          <input {...getInputProps()} />
          {loading ? (
            <p className="text-stone-400 animate-pulse">Faili töödeldakse…</p>
          ) : isDragActive ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl glass-amber flex items-center justify-center">
                <Upload size={20} className="text-amber-400 animate-bounce" />
              </div>
              <p className="text-amber-400 font-medium">Tõsta siia…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-stone-800/80 backdrop-blur-sm flex items-center justify-center transition-colors group-hover:bg-stone-700/80">
                <Upload size={20} className="text-stone-400" />
              </div>
              <div>
                <p className="text-stone-300 text-sm font-medium">
                  Tõsta fail siia või klõpsa, et sirvida
                </p>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm mt-4 text-center animate-fade-in">{error}</p>}

        <p className="text-stone-700 text-xs text-center mt-6 leading-relaxed max-w-[280px] animate-fade-in delay-3">
          Raamatufail jääb sinu seadmesse. Serverisse salvestame ainult lugemisprogressi.
        </p>
      </div>
    </div>
  );
}
