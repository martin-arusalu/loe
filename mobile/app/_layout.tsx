import { useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from "@sentry/react-native";
import { useFonts, Quicksand_500Medium, Quicksand_600SemiBold } from "@expo-google-fonts/quicksand";
import { Lora_400Regular, Lora_600SemiBold } from "@expo-google-fonts/lora";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans";
import { ToastProvider } from "@/components/Toast";
import { hydrateAuth } from "@/lib/auth";
import { hydratePendingProgress } from "@/lib/storage";
import { initAnalytics } from "@/lib/analytics";
import { colors } from "@/theme";
import "../global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

Sentry.init({
  dsn: "https://9178d0ea321862f1b95e94a36240aa69@o4510970097958912.ingest.de.sentry.io/4510970099531856",
  sendDefaultPii: true,
});

function RootLayout() {
  const [fontsLoaded] = useFonts({
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Lora_400Regular,
    Lora_600SemiBold,
    PlusJakartaSans_600SemiBold,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    Promise.all([hydrateAuth(), hydratePendingProgress()])
      .then(() => initAnalytics())
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen
              name="login"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen name="privaatsus" />
            <Stack.Screen name="tingimused" />
          </Stack>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
