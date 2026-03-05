import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthUser, loginWithGoogle } from '@/lib/auth';

interface LoginScreenProps {
  onBack: () => void;
  onLogin: (user: AuthUser) => void;
}

export default function LoginScreen({ onBack, onLogin }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center px-6 py-10 gap-8">
      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-5 left-6 text-stone-500 hover:text-stone-300 transition-colors text-sm"
      >
        ← Tagasi
      </button>

      {/* Heading */}
      <div className="text-center select-none">
        <h1 className="text-2xl font-thin tracking-[0.7rem] text-stone-50 mb-2 font-serif">
          Lauselt
        </h1>
        <p className="text-stone-500 text-base">Logi sisse, et salvestada progress</p>
      </div>

      {/* Sign-in card */}
      <div className="w-full max-w-xs flex flex-col items-center gap-4">
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            const idToken = credentialResponse.credential;
            if (!idToken) {
              setError('Google ei tagastanud tokenit.');
              return;
            }
            setLoading(true);
            setError(null);
            loginWithGoogle(idToken)
              .then((user) => onLogin(user))
              .catch((err) => {
                console.error(err);
                setError('Sisselogimine ebaõnnestus. Palun proovi uuesti.');
              })
              .finally(() => setLoading(false));
          }}
          onError={() => setError('Google sisselogimine ebaõnnestus.')}
          theme="filled_black"
          shape="rectangular"
          text="signin_with"
        />

        {loading && (
          <p className="text-stone-500 text-sm animate-pulse">Sisselogimine…</p>
        )}
        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
