import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MarkdownDisplay from "react-native-markdown-display";
import { colors, fonts } from "@/theme";

const markdownStyles = {
  body: { color: colors.stone[300], fontFamily: fonts.sans, fontSize: 15, lineHeight: 24 },
  heading1: { color: colors.stone[100], fontFamily: fonts.heading, fontSize: 22, marginBottom: 12 },
  heading2: { color: colors.stone[200], fontFamily: fonts.heading, fontSize: 18, marginTop: 20 },
  link: { color: colors.amber[400] },
};

export default function LegalDocument({ title, url }: { title: string; url: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(url)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
      .then(setContent)
      .catch(() => setFailed(true));
  }, [url]);

  return (
    <View className="flex-1 bg-stone-950" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center px-6 pb-4">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-sm text-stone-500">← Tagasi</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}
      >
        <Text className="mb-6 text-2xl text-stone-100" style={{ fontFamily: fonts.heading }}>
          {title}
        </Text>
        {failed ? (
          <Text className="text-sm text-stone-500">
            Dokumendi laadimine ebaõnnestus. Vaata lauselt.ee.
          </Text>
        ) : content === null ? (
          <Text className="text-sm text-stone-600">Laen…</Text>
        ) : (
          <MarkdownDisplay style={markdownStyles}>{content}</MarkdownDisplay>
        )}
      </ScrollView>
    </View>
  );
}
