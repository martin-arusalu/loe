import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LoginScreen from "@/components/LoginScreen";
import { AuthUser } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";

const GOOGLE_CLIENT_ID = "382553774833-b3673gncnf51ha3td8s2t8j90kipd4ao.apps.googleusercontent.com";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = useCallback(
    (user: AuthUser) => {
      trackEvent("login", { user: user?.email });
      navigate("/");
    },
    [navigate]
  );

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginScreen onLogin={handleLogin} />
    </GoogleOAuthProvider>
  );
}
