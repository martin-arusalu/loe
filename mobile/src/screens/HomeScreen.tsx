import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Flame, LogOut, Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { ApiBook, UserStats } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";
import type { Book } from "@/lib/storage";
import formatNumber from "@/lib/formatNumber";
import GlowBackground from "@/components/GlowBackground";
import { colors, fonts } from "@/theme";
import { LOCAL_PREVIEW_MODE } from "@/lib/constants";

interface HomeScreenProps {
  library: Book[];
  user: AuthUser | null;
  apiBooks?: ApiBook[];
  stats?: UserStats | null;
  onImport: () => void;
  onOpenBook: (book: Book) => void;
  onOpenApiBook?: (book: ApiBook) => void;
  onLogout: () => void;
}

function progressPercent(book: Book): number {
  if (!book.chunks.length) return 0;
  return Math.ceil((book.position / book.chunks.length) * 100);
}

export default function HomeScreen({
  library,
  user,
  stats,
  onImport,
  onOpenBook,
  onLogout,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const sorted = [...library].sort((a, b) => (b.lastRead ?? 0) - (a.lastRead ?? 0));

  return (
    <View className="flex-1 bg-stone-950">
      <GlowBackground
        glows={[
          {
            position: { top: -40, left: "20%" },
            size: 300,
            color: colors.amber[900],
            opacity: 0.05,
          },
          {
            position: { bottom: "20%", right: -60 },
            size: 240,
            color: colors.stone[700],
            opacity: 0.05,
          },
        ]}
      />

      {/* ── Header ── */}
      <Animated.View
        entering={FadeIn.duration(500)}
        className="flex-row items-center justify-between px-6 pb-3"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center">
          <Image
            source={require("../../assets/icon.png")}
            className="mr-3 h-6 w-6 rounded-sm"
            resizeMode="contain"
          />
          <Text
            className="text-lg text-stone-200"
            style={{ fontFamily: fonts.sansSemibold, letterSpacing: 5 }}
          >
            Lauselt
          </Text>
        </View>

        {user && (
          <View className="flex-row items-center gap-2.5">
            {user.picture && (
              <Image source={{ uri: user.picture }} className="h-7 w-7 rounded-full" />
            )}
            <Text className="text-sm text-stone-400">{user.name}</Text>
            <Pressable
              onPress={onLogout}
              accessibilityLabel="Logi välja"
              hitSlop={8}
              className="rounded-lg p-1.5"
            >
              <LogOut size={16} color={colors.stone[600]} />
            </Pressable>
          </View>
        )}
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}
      >
        <View className="mt-6 w-full max-w-sm gap-5 self-center">
          {/* ── Streak & today ── */}
          {user && stats && (
            <Animated.View
              entering={FadeInUp.delay(100).duration(500)}
              className={`flex-row gap-4 rounded-2xl border bg-stone-900/60 p-4 ${
                stats.today.goalMet ? "border-amber-700/25" : "border-stone-800/60"
              }`}
            >
              <View className="flex-1 items-center justify-center gap-1 py-1">
                <View className="flex-row items-baseline gap-1">
                  <Text
                    className={`text-2xl ${stats.today.goalMet ? "text-amber-400" : "text-stone-500"}`}
                    style={{ fontFamily: fonts.heading }}
                  >
                    {stats.streak.current}
                  </Text>
                  {stats.today.goalMet && <Flame size={16} color={colors.amber[500]} />}
                </View>
                <Text className="text-center text-[11px] text-stone-500">Järjest päevi</Text>
              </View>

              <View className="w-px bg-stone-700/50" />

              <View className="flex-1 justify-center gap-2 py-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] text-stone-500">Täna</Text>
                  <Text className="text-[11px] text-stone-400">
                    {formatNumber(stats.today.chunksScrolled)}
                    <Text className="text-stone-600">/{formatNumber(stats.today.dailyGoal)}</Text>
                  </Text>
                </View>
                <View className="h-1.5 overflow-hidden rounded-full bg-stone-800">
                  <LinearGradient
                    colors={
                      stats.today.goalMet
                        ? [colors.amber[500], colors.amber[400]]
                        : [colors.stone[600], colors.stone[600]]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: "100%",
                      borderRadius: 999,
                      width: `${Math.min(100, (stats.today.chunksScrolled / stats.today.dailyGoal) * 100)}%`,
                    }}
                  />
                </View>
                {stats.today.goalMet ? (
                  <Text className="text-[11px] text-amber-400">✓ Eesmärk täidetud</Text>
                ) : (
                  <Text className="text-[11px] text-stone-600">
                    {formatNumber(stats.today.remaining)} lõiku eesmärgini
                  </Text>
                )}
              </View>
            </Animated.View>
          )}

          {/* ── Library ── */}
          {sorted.length > 0 && (
            <Animated.View entering={FadeInUp.delay(200).duration(500)}>
              <Text
                className="mb-3 px-1 text-[11px] uppercase tracking-[2px] text-stone-500"
                style={{ fontFamily: fonts.heading }}
              >
                Raamaturiiul
              </Text>
              <View className="overflow-hidden rounded-2xl border border-stone-800/60 bg-stone-900/60">
                {sorted.map((book, i) => {
                  const pct = progressPercent(book);
                  return (
                    <Pressable
                      key={book.id}
                      onPress={() => onOpenBook(book)}
                      className={`flex-row items-center justify-between px-5 py-4 active:bg-stone-800/50 ${
                        i < sorted.length - 1 ? "border-b border-stone-800/40" : ""
                      }`}
                    >
                      <View className="min-w-0 flex-1">
                        <Text numberOfLines={1} className="text-sm font-medium text-stone-200">
                          {book.title}
                        </Text>
                        {book.author && (
                          <Text numberOfLines={1} className="mt-0.5 text-xs text-stone-600">
                            {book.author}
                          </Text>
                        )}
                        {book.chunks.length > 0 && (
                          <View className="mt-2 flex-row items-center gap-2">
                            <View className="h-[3px] flex-1 overflow-hidden rounded-full bg-stone-800">
                              <LinearGradient
                                colors={
                                  pct === 100
                                    ? ["#16a34a", "#22c55e"]
                                    : [colors.amber[600], colors.amber[500]]
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ height: "100%", width: `${pct}%`, opacity: 0.6 }}
                              />
                            </View>
                            <Text className="w-8 text-right text-[11px] text-stone-600">
                              {pct}%
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="ml-3 text-stone-700">›</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── Import ── */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <Pressable
              onPress={onImport}
              className="w-full rounded-2xl border border-dashed border-stone-700/50 px-5 py-4 active:opacity-80"
            >
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-stone-800/60">
                  <Plus size={16} color={colors.stone[400]} />
                </View>
                <View>
                  <Text className="text-sm font-medium text-stone-300">Lae üles oma raamat</Text>
                  <Text className="mt-0.5 text-xs text-stone-600">EPUB formaadis fail</Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
