import { useEffect, useState } from 'react';
import Importer from '@/components/Importer';
import Reader from '@/components/Reader';
import { chunkText } from '@/lib/chunker';
import { clearSession, loadSession, saveSession } from '@/lib/storage';

type AppState =
  | { view: 'import' }
  | { view: 'read'; chunks: string[]; title: string; initialChunk: number };

export default function App() {
  const [state, setState] = useState<AppState>({ view: 'import' });

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
    });
  }, []);

  const handleTextReady = (text: string, title: string) => {
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
    clearSession();
    setState({ view: 'import' });
  };

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

  return <Importer onTextReady={handleTextReady} />;
}
