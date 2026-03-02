import { useEffect, useState } from 'react';
import HomeScreen from '@/components/HomeScreen';
import Importer from '@/components/Importer';
import Reader from '@/components/Reader';
import { chunkText } from '@/lib/chunker';
import { clearSession, loadSession, saveSession } from '@/lib/storage';

type AppState =
  | { view: 'home' }
  | { view: 'import' }
  | { view: 'read'; chunks: string[]; title: string; initialChunk: number };

export default function App() {
  const [state, setState] = useState<AppState>({ view: 'home' });
  const [loading, setLoading] = useState(true);

  // Restore previous session on first load
  useEffect(() => {
    loadSession().then((session) => {
      if (session && session.chunks.length > 0) {
        setState({
          view: 'read',
          chunks: session.chunks,
          title: session.title,
          initialChunk: session.position,
        });
      }
      setLoading(false);
    });
  }, []);

  const handleTextReady = (text: string, title: string) => {
    // TODO: When want to download MD, comment this in.
    // const blob = new Blob([text], { type: 'text/markdown' });
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = `${title}.md`;
    // a.click();
    // URL.revokeObjectURL(url);

    const chunks = chunkText(text);
    if (chunks.length === 0) return;
    saveSession({ title, chunks, position: 0 });
    setState({ view: 'read', chunks, title, initialChunk: 0 });
  };

  const handlePositionChange = (position: number) => {
    if (state.view !== 'read') return;
    saveSession({ title: state.title, chunks: state.chunks, position });
  };

  const handleBack = () => {
    setState({ view: 'home' });
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-stone-950">
        <p className="text-stone-500 text-lg tracking-wide">Laen…</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-stone-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (state.view === 'read') {
    return (
      <Reader
        chunks={state.chunks}
        title={state.title}
        initialChunk={state.initialChunk}
        onBack={handleBack}
        onPositionChange={handlePositionChange}
      />
    );
  }

  if (state.view === 'import') {
    return <Importer onTextReady={handleTextReady} onBack={handleBack} />;
  }

  return (
    <HomeScreen
      onTextReady={handleTextReady}
      onImport={() => setState({ view: 'import' })}
    />
  );
}
