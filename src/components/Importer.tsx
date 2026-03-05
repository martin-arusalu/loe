import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { parseEpub } from "@/lib/parseEpub";

interface ImporterProps {
  onTextReady: (text: string, title: string) => void;
  onBack?: () => void;
}

export default function Importer({ onTextReady, onBack }: ImporterProps) {
  const [pasteValue, setPasteValue] = useState("");
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
          // plain text
          text = await file.text();
        }

        if (!text.trim()) {
          setError("Failist ei leitud loetavat teksti.");
          return;
        }

        // TODO: uncomment when need to test Download extracted text as .md for testing
        // const mdName = file.name.replace(/\.[^.]+$/, '') + '.md';
        // const blob = new Blob([text], { type: 'text/markdown' });
        // const url = URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = mdName;
        // a.click();
        // URL.revokeObjectURL(url);

        onTextReady(text, file.name.replace(/\.[^.]+$/, ""));
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

  const handlePasteSubmit = () => {
    const text = pasteValue.trim();
    if (!text) return;
    onTextReady(text, "Kleebitud tekst");
    setPasteValue("");
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center px-12 py-10 gap-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-stone-50 mb-2">Oma raamat</h1>
        <p className="text-stone-400 text-lg">Lae üles oma raamat, et alustada lugemist</p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-amber-400 bg-amber-400/10" : "border-stone-700 hover:border-stone-500 bg-stone-900"}`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <p className="text-stone-400 animate-pulse">Faili töödeldakse…</p>
        ) : isDragActive ? (
          <p className="text-amber-400 font-medium">Tõsta siia…</p>
        ) : (
          <>
            <p className="text-stone-300 font-medium mb-1">
              Tõsta fail siia või klõpsa, et sirvida
            </p>
            <p className="text-stone-500 text-sm">Toetab EPUB formaadis faile</p>
          </>
        )}
      </div>

      {/* ── Privacy note ──────────────────────────────────── */}
      <p className="text-stone-600 text-xs text-center max-w-xs leading-relaxed">
        Sinu tasuta üleslaetud raamatufail püsib sinu seadmes. Serverisse salvestame ainult
        lugemisprogressi ja statistika.
      </p>

      {error && <p className="text-red-400 text-sm -mt-4">{error}</p>}

      {/* action area */}
      <div className="w-full max-w-xl flex flex-col gap-3">
        <div className="w-full max-w-xl flex items-center mb-2 justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-4 px-4 py-2 rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 transition-colors"
              aria-label="Tagasi avalehele"
            >
              ← Tagasi
            </button>
          )}
          <button
            onClick={handlePasteSubmit}
            disabled={!pasteValue.trim()}
            className="self-end px-6 py-2 rounded-xl bg-amber-400 text-stone-900 font-semibold text-sm
            disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-300 transition-colors"
          >
            Alusta lugemist →
          </button>
        </div>
      </div>
    </div>
  );
}
