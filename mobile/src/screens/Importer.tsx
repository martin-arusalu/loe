import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Upload } from "lucide-react-native";
import { parseEpub } from "@/lib/parseEpub";
import { trackEvent } from "@/lib/analytics";
import GlowBackground from "@/components/GlowBackground";
import { colors, fonts } from "@/theme";

interface ImporterProps {
  onTextReady: (text: string, title: string) => void;
  onBack?: () => void;
}

export default function Importer({ onTextReady, onBack }: ImporterProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async () => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/epub+zip", "text/plain"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const title = asset.name.replace(/\.[^.]+$/, "");
    setLoading(true);
    try {
      let text: string;
      if (asset.name.toLowerCase().endsWith(".epub")) {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        text = await parseEpub(base64);
      } else {
        text = await FileSystem.readAsStringAsync(asset.uri);
      }

      if (!text.trim()) {
        setError("Failist ei leitud loetavat teksti.");
        return;
      }

      onTextReady(text, title);
      trackEvent("imported file", { book: title });
    } catch (err) {
      console.error(err);
      setError("Faili töötlemine ebaõnnestus. Palun proovi teist faili.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-stone-950 px-6" style={{ paddingTop: insets.top + 16 }}>
      <GlowBackground
        glows={[
          {
            position: { top: "33%", left: "20%" },
            size: 300,
            color: colors.amber[900],
            opacity: 0.04,
          },
        ]}
      />

      {onBack && (
        <Animated.View entering={FadeIn.duration(400)}>
          <Pressable onPress={onBack} hitSlop={8} accessibilityLabel="Tagasi avalehele">
            <Text className="mb-8 text-sm text-stone-600">← Tagasi</Text>
          </Pressable>
        </Animated.View>
      )}

      <View className="flex-1 items-center justify-center">
        <Animated.View entering={FadeInUp.delay(100).duration(500)} className="mb-8 items-center">
          <Text
            className="mb-2 text-xl text-stone-200"
            style={{ fontFamily: fonts.heading, letterSpacing: 2 }}
          >
            Lae üles raamat
          </Text>
          <Text className="text-sm text-stone-500">Toetab EPUB formaadis faile</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)} className="w-full max-w-md">
          <Pressable
            onPress={handlePick}
            disabled={loading}
            className="w-full items-center rounded-2xl border-2 border-dashed border-stone-700/60 bg-stone-900/40 p-10 active:opacity-80"
          >
            {loading ? (
              <Text className="text-stone-400">Faili töödeldakse…</Text>
            ) : (
              <View className="items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-stone-800/80">
                  <Upload size={20} color={colors.stone[400]} />
                </View>
                <Text className="text-sm font-medium text-stone-300">Vali fail seadmest</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {error && <Text className="mt-4 text-center text-sm text-red-400">{error}</Text>}

        <Text className="mt-6 max-w-[280px] text-center text-xs leading-relaxed text-stone-700">
          Raamatufail jääb sinu seadmesse. Serverisse salvestame ainult lugemisprogressi.
        </Text>
      </View>
    </View>
  );
}
