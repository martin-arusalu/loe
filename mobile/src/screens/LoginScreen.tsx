import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { loginWithApple, loginWithGoogle, type AuthUser } from "@/lib/auth";
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "@/lib/constants";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import GlowBackground from "@/components/GlowBackground";
import { colors, fonts } from "@/theme";

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
  onBack?: () => void;
}

export default function LoginScreen({ onLogin, onBack }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      offlineAccess: false,
    });
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch(() => {});
    }
  }, []);

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) {
        setError("Google ei tagastanud tokenit.");
        return;
      }
      onLogin(await loginWithGoogle(idToken));
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === statusCodes.SIGN_IN_CANCELLED) return;
      console.error(e);
      setError("Sisselogimine ebaõnnestus. Palun proovi uuesti.");
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setError(null);
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        setError("Apple ei tagastanud tokenit.");
        return;
      }
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(" ");
      onLogin(await loginWithApple(credential.identityToken, fullName || undefined));
    } catch (e) {
      if ((e as { code?: string }).code === "ERR_REQUEST_CANCELED") return;
      console.error(e);
      setError("Sisselogimine ebaõnnestus. Palun proovi uuesti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-stone-950 px-6" style={{ paddingTop: insets.top + 16 }}>
      <GlowBackground
        glows={[
          {
            position: { top: "20%", left: "25%" },
            size: 260,
            color: colors.amber[900],
            opacity: 0.05,
          },
        ]}
      />

      <View className="flex-1 items-center justify-center">
        <Animated.View entering={FadeInUp.delay(100).duration(500)} className="mb-10 items-center">
          <Text
            className="mb-3 text-2xl text-stone-50"
            style={{ fontFamily: fonts.heading, letterSpacing: 3 }}
          >
            Lauselt
          </Text>
          <Text className="text-sm text-stone-500">Logi sisse, et salvestada progress</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          className="w-full max-w-sm gap-3 rounded-2xl border border-stone-800/60 bg-stone-900/60 px-6 py-8"
        >
          <GoogleSignInButton onPress={handleGoogle} disabled={loading} style={{ width: "100%" }} />

          {appleAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={12}
              style={{ width: "100%", height: 52 }}
              onPress={handleApple}
            />
          )}

          {!appleAvailable && (
            <Text className="text-center text-sm text-stone-500">
              Apple&apos;iga sisselogimine on saadaval ainult iPhone&apos;is või iPadis.
            </Text>
          )}

          {loading && <Text className="text-center text-sm text-stone-500">Sisselogimine…</Text>}
          {error && <Text className="text-center text-sm text-red-400">{error}</Text>}
        </Animated.View>

        {onBack && (
          <Pressable onPress={onBack} className="mt-4" hitSlop={8}>
            <Text className="text-sm text-stone-600">← Tagasi</Text>
          </Pressable>
        )}

        <Text className="mt-6 max-w-[260px] text-center text-xs leading-relaxed text-stone-700">
          Sisselogimisega nõustud meie kasutustingimuste ja privaatsuspoliitikaga.
        </Text>
      </View>
    </View>
  );
}
