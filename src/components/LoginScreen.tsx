import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { AuthUser, loginWithGoogle } from "@/lib/auth";

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-100 flex flex-col items-center px-6 py-10 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[50vw] h-[40vw] max-w-[400px] max-h-[300px] rounded-full bg-amber-900/5 blur-3xl animate-glow-drift-slow" />
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-sm -mt-10">
        {/* Heading */}
        <div className="text-center select-none mb-10 animate-fade-in-up delay-1">
          <h1
            className="text-2xl font-semibold tracking-[0.12em] text-stone-50 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Lauselt
          </h1>
          <p className="text-stone-500 text-sm">Logi sisse, et salvestada progress</p>
        </div>

        {/* Sign-in card */}
        <div className="w-full glass rounded-2xl px-6 py-8 flex flex-col items-center gap-5 animate-fade-in-scale delay-2">
          <p
            className="text-stone-400 text-xs uppercase tracking-[0.15em] font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Jätka Google&apos;iga
          </p>

          <GoogleLogin
            onSuccess={(credentialResponse) => {
              const idToken = credentialResponse.credential;
              if (!idToken) {
                setError("Google ei tagastanud tokenit.");
                return;
              }
              setLoading(true);
              setError(null);
              loginWithGoogle(idToken)
                .then((user) => onLogin(user))
                .catch((err) => {
                  console.error(err);
                  setError("Sisselogimine ebaõnnestus. Palun proovi uuesti.");
                })
                .finally(() => setLoading(false));
            }}
            onError={() => setError("Google sisselogimine ebaõnnestus.")}
            theme="filled_black"
            shape="rectangular"
            text="signin_with"
          />

          {loading && <p className="text-stone-500 text-sm animate-pulse">Sisselogimine…</p>}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>

        <div className="w-full max-w-sm mt-4 flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="text-stone-600 hover:text-stone-300 transition-colors duration-200 text-sm"
          >
            ← Tagasi
          </button>
        </div>

        <p className="text-stone-700 text-xs text-center mt-6 leading-relaxed max-w-[260px] animate-fade-in delay-3">
          Sisselogimisega nõustud meie kasutustingimuste ja privaatsuspoliitikaga.
        </p>
      </div>
    </div>
  );
}
