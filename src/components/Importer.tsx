import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { parsePdf } from '@/lib/parsePdf';
import { parseEpub } from '@/lib/parseEpub';

interface ImporterProps {
  onTextReady: (text: string, title: string) => void;
}

export default function Importer({ onTextReady }: ImporterProps) {
  const [pasteValue, setPasteValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      try {
        const buffer = await file.arrayBuffer();
        let text = '';

        if (file.name.endsWith('.pdf')) {
          text = await parsePdf(buffer);
        } else if (file.name.endsWith('.epub')) {
          text = await parseEpub(buffer);
        } else {
          // plain text
          text = await file.text();
        }

        if (!text.trim()) {
          setError('Failist ei leitud loetavat teksti.');
          return;
        }

        onTextReady(text, file.name.replace(/\.[^.]+$/, ''));
      } catch (err) {
        console.error(err);
        setError('Faili töötlemine ebaõnnestus. Palun proovi teist faili.');
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
      'application/pdf': ['.pdf'],
      'application/epub+zip': ['.epub'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  const handlePasteSubmit = () => {
    const text = pasteValue.trim();
    if (!text) return;
    onTextReady(text, 'Kleebitud tekst');
    setPasteValue('');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center px-12 py-10 gap-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-stone-50 mb-2">Loe</h1>
        <p className="text-stone-400 text-lg">Loe kõike, üks amps korraga.</p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-amber-400 bg-amber-400/10' : 'border-stone-700 hover:border-stone-500 bg-stone-900'}`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <p className="text-stone-400 animate-pulse">Faili töödeldakse…</p>
        ) : isDragActive ? (
          <p className="text-amber-400 font-medium">Tõsta siia…</p>
        ) : (
          <>
            <p className="text-stone-300 font-medium mb-1">Tõsta fail siia või klõpsa, et sirvida</p>
            <p className="text-stone-500 text-sm">Toetab PDF, EPUB ja TXT faile</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm -mt-4">{error}</p>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 w-full max-w-xl text-stone-600">
        <div className="flex-1 h-px bg-stone-800" />
        <span className="text-sm">või kleebi tekst</span>
        <div className="flex-1 h-px bg-stone-800" />
      </div>

      {/* Paste area */}
      <div className="w-full max-w-xl flex flex-col gap-3">
        <textarea
          className="w-full h-40 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 p-4 text-sm resize-none
            placeholder:text-stone-600 focus:outline-none focus:border-amber-400 transition-colors"
          placeholder="Kleebi oma tekst siia…"
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
        />
        <button
          onClick={handlePasteSubmit}
          disabled={!pasteValue.trim()}
          className="self-end px-6 py-2 rounded-xl bg-amber-400 text-stone-950 font-semibold text-sm
            disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-300 transition-colors"
        >
          Alusta lugemist →
        </button>
      </div>
    </div>
  );
}
