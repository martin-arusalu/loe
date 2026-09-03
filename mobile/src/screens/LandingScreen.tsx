import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useRouter } from "expo-router";
import {
  ArrowDown,
  BookOpen,
  BookmarkCheck,
  Flame,
  LibraryBig,
  MonitorSmartphone,
  Scroll,
  Target,
  Upload,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import GlowBackground from "@/components/GlowBackground";
import { colors, fonts } from "@/theme";

const DEMO_CHUNKS = [
  "Kui Arno isaga koolimajja jõudis, olid tunnid juba alanud.",
  "Kooliõpetaja kutsus mõlemad oma tuppa, rääkis nendega natuke aega, käskis Arnot hoolas ja korralik olla, ja seadis ta siis pinki ühe pikkade juustega poisi kõrvale istuma.",
  "Siis andis kooliõpetaja talle raamatust midagi kirjutada ja Arnol ei olnud nüüd enam aega muu peale mõtelda.",
  "Ta võttis tahvli ja hakkas kirjutama. Kui ta umbes paar rida oli kirjutanud, kummardas pikkade juustega poiss tema kõrva juurde ja küsis sosinal:",
  "“Mis koolmeister ütles, kui teie tema toas olite?”",
  "Arno teadis, et tunni ajal kõnelda ei tohi, vaatas esiti aralt kooliõpetaja poole ja vastas siis:",
];

const HOW_IT_WORKS = [
  {
    Icon: BookOpen,
    title: "Vali raamat või lae üles oma",
    desc: "Eesti klassikud on juba olemas. Või impordi oma EPUB fail.",
  },
  {
    Icon: Scroll,
    title: "Loe üks lõik korraga",
    desc: "Raamat on jagatud väikesteks osadeks. Keri alla — loe järgmine.",
  },
  {
    Icon: Target,
    title: "Ehita lugemisharjumus",
    desc: "Päevane eesmärk ja seeria hoiavad sind järjel.",
  },
];

const FREE_FEATURES = [
  { Icon: Upload, text: "Importida oma raamatu (raamat salvestub sinu seadmesse)." },
  { Icon: BookmarkCheck, text: "Jätkata pooleli jäänud kohast (progress sünkib kontoga)." },
];

const PLUS_FEATURES = [
  { Icon: Flame, text: "Tekita järjepidev lugemisharjumus (päevas vähemalt 50 lõiku)." },
  { Icon: LibraryBig, text: "Ligipääs valitud raamatutele (toimetatud ja kontrollitud)." },
  { Icon: MonitorSmartphone, text: "Raamatud igas seadmes (ei pea eraldi importima)." },
];

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [demoIndex, setDemoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoIndex((i) => (i + 1) % DEMO_CHUNKS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-stone-900"
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      {/* ── Hero ── */}
      <View className="bg-stone-950 px-6 pb-24" style={{ paddingTop: insets.top + 56 }}>
        <GlowBackground
          glows={[
            {
              position: { top: -80, left: "15%" },
              size: 360,
              color: colors.amber[700],
              opacity: 0.08,
            },
            {
              position: { top: "10%", right: -40 },
              size: 220,
              color: colors.amber[900],
              opacity: 0.06,
            },
          ]}
        />
        <Animated.View entering={FadeIn.duration(600)} className="items-center">
          <Image
            source={require("../../assets/icon.png")}
            className="mb-6 h-14 w-14"
            resizeMode="contain"
          />
          <Text
            className="mb-4 text-3xl text-stone-300"
            style={{ fontFamily: fonts.heading, letterSpacing: 12 }}
          >
            Lauselt
          </Text>
          <Text className="text-center text-base font-medium text-amber-400/80">
            Loe raamatuid üks lõik korraga.
          </Text>
          <Text className="mt-3 max-w-md text-center text-sm leading-relaxed text-stone-500">
            Nagu TikTok, aga raamatute jaoks — keri alla ja loe järgmine lõik. Ideaalne
            bussipeatuses, järjekorras või enne uinumist.
          </Text>
        </Animated.View>
      </View>

      {/* ── CTA ── */}
      <View className="items-center px-6" style={{ marginTop: -32 }}>
        <Animated.View entering={FadeInUp.delay(300).duration(500)} className="w-full max-w-sm">
          <Pressable
            onPress={() => router.push("/login")}
            accessibilityLabel="Logi sisse ja alusta lugemist"
            className="w-full overflow-hidden rounded-2xl active:opacity-90"
          >
            <LinearGradient
              colors={[colors.amber[500], colors.amber[400]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 16, alignItems: "center" }}
            >
              <Text className="text-base font-semibold text-stone-900">
                Alusta lugemist — tasuta
              </Text>
            </LinearGradient>
          </Pressable>
          <Text className="mt-3.5 text-center text-xs text-stone-500">
            Konto loomine võtab 5 sekundit.
          </Text>
        </Animated.View>
      </View>

      {/* ── Demo phone ── */}
      <View className="mt-12 items-center px-6">
        <View className="w-[250px] rounded-[28px] border-2 border-stone-700/40 bg-stone-950 p-3">
          <View className="mb-3 flex-row items-center justify-between px-2">
            <View className="h-1 w-8 rounded-full bg-stone-800" />
            <View className="h-3 w-12 rounded-full bg-stone-800" />
            <View className="h-1 w-8 rounded-full bg-stone-800" />
          </View>
          <View className="mx-1 mb-4 h-0.5 overflow-hidden rounded-full bg-stone-800">
            <LinearGradient
              colors={[colors.amber[600], colors.amber[400]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: "100%", width: `${((demoIndex + 1) / DEMO_CHUNKS.length) * 100}%` }}
            />
          </View>
          <View className="min-h-[140px] justify-center px-3">
            <Animated.Text
              key={demoIndex}
              entering={FadeIn.duration(400)}
              className="text-[15px] leading-relaxed text-stone-200"
              style={{ fontFamily: fonts.serif }}
            >
              {DEMO_CHUNKS[demoIndex]}
            </Animated.Text>
          </View>
          <Text className="mb-2 mt-3 text-center text-[10px] text-stone-600">
            {demoIndex + 1} / {DEMO_CHUNKS.length}
          </Text>
          <View className="items-center pb-1">
            <ArrowDown size={12} color={colors.stone[700]} />
          </View>
        </View>
        <Text className="mt-4 text-xs text-stone-600">Keri alla → järgmine lõik</Text>
      </View>

      {/* ── How it works ── */}
      <View className="mt-14 px-6">
        <Text
          className="mb-8 text-xs uppercase tracking-[3px] text-stone-500"
          style={{ fontFamily: fonts.heading }}
        >
          Kuidas see toimib
        </Text>
        <View className="gap-6">
          {HOW_IT_WORKS.map(({ Icon, title, desc }, i) => (
            <Animated.View
              key={title}
              entering={FadeInUp.delay(400 + i * 120).duration(500)}
              className="flex-row items-start gap-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl border border-amber-700/20 bg-amber-950/20">
                <Icon size={18} color={colors.amber[400]} />
              </View>
              <View className="flex-1">
                <Text className="mb-0.5 text-sm font-semibold text-stone-200">{title}</Text>
                <Text className="text-xs leading-relaxed text-stone-500">{desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* ── Feature cards ── */}
      <View className="mt-14 gap-4 px-6">
        <View className="rounded-3xl border border-stone-800/60 bg-stone-900/60 px-7 py-7">
          <View className="mb-5 flex-row items-center gap-3">
            <View className="h-8 w-8 items-center justify-center rounded-lg bg-stone-700/40">
              <Upload size={14} color={colors.stone[300]} />
            </View>
            <Text
              className="text-xs uppercase tracking-[2px] text-stone-400"
              style={{ fontFamily: fonts.heading }}
            >
              Tasuta kasutajana saad
            </Text>
          </View>
          <View className="gap-4">
            {FREE_FEATURES.map(({ Icon, text }) => (
              <View key={text} className="flex-row items-start gap-3">
                <Icon size={16} color={colors.stone[500]} style={{ marginTop: 2 }} />
                <Text className="flex-1 text-sm leading-relaxed text-stone-300">{text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="overflow-hidden rounded-3xl border border-amber-700/20 bg-amber-950/10 px-7 py-7">
          <View className="mb-5 flex-row items-center gap-3">
            <View className="h-8 w-8 items-center justify-center rounded-lg border border-amber-600/15 bg-amber-800/20">
              <Flame size={14} color={colors.amber[400]} />
            </View>
            <Text
              className="text-xs uppercase tracking-[2px] text-amber-400"
              style={{ fontFamily: fonts.heading }}
            >
              Lauselt+
            </Text>
          </View>
          <View className="gap-4">
            {PLUS_FEATURES.map(({ Icon, text }) => (
              <View key={text} className="flex-row items-start gap-3">
                <Icon size={16} color={colors.amber[400]} style={{ marginTop: 2 }} />
                <Text className="flex-1 text-sm leading-relaxed text-stone-300">{text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Footer ── */}
      <View className="mt-14 flex-row items-center justify-center gap-3">
        <Pressable onPress={() => router.push("/privaatsus")} hitSlop={8}>
          <Text className="text-sm text-stone-500">Privaatsus</Text>
        </Pressable>
        <Text className="text-stone-700">·</Text>
        <Pressable onPress={() => router.push("/tingimused")} hitSlop={8}>
          <Text className="text-sm text-stone-500">Kasutustingimused</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
