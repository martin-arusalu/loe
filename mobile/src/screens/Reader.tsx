/**
 * Reader — port of the web `src/components/Reader.tsx`.
 *
 * Structure is identical:
 *   horizontal pager: [back panel] [reader] [stats panel]
 *   vertical pager inside the reader, holding only [prev?, current, next?]
 *   and imperatively re-centred after every settle (hand-rolled virtualiser,
 *   so a 10 000-chunk book costs the same as a 3-chunk one).
 *
 * `pagingEnabled` replaces CSS scroll-snap, and `onMomentumScrollEnd` replaces
 * the `scrollend` event plus its debounced Safari fallback.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Flame, Loader, Square, Volume2 } from "lucide-react-native";
import ChunkMarkdown from "@/components/ChunkMarkdown";
import LoadingScreen from "@/screens/LoadingScreen";
import GlowBackground from "@/components/GlowBackground";
import type { UserStats } from "@/lib/api";
import formatNumber from "@/lib/formatNumber";
import { APP_VERSION } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";
import { useTts } from "@/hooks/useTts";
import { colors, fonts } from "@/theme";

interface ReaderProps {
  chunks: string[];
  title: string;
  initialChunk?: number;
  onBack: () => void;
  onPositionChange?: (position: number, forward: boolean) => void;
  stats?: UserStats | null;
  onDeleteAccount: () => Promise<void>;
}

export default function Reader({
  chunks,
  title,
  initialChunk = 0,
  onBack,
  onPositionChange,
  stats,
  onDeleteAccount,
}: ReaderProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // chunks.length is the virtual "completion card" slot.
  const [curIndex, setCurIndex] = useState(initialChunk);
  const [showChapterDialog, setShowChapterDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const hScrollRef = useRef<ScrollView>(null);
  const vScrollRef = useRef<ScrollView>(null);
  // Set when the window shifted and scroll must be re-centred without animation.
  const needsRecenter = useRef(false);

  const onPositionChangeRef = useRef(onPositionChange);
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  const prevIndex = curIndex > 0 ? curIndex - 1 : null;
  const nextIndex = curIndex < chunks.length ? curIndex + 1 : null;

  const tts = useTts({
    chunks,
    onAdvance: (next) => {
      needsRecenter.current = true;
      setCurIndex(next);
      onPositionChangeRef.current?.(next, true);
    },
  });

  const chapters = useMemo(
    () =>
      chunks
        .map((chunk, index) => ({ chunk, index }))
        .filter(({ chunk }) => chunk.trimStart().startsWith("## "))
        .map(({ chunk, index }) => ({
          index,
          title: chunk
            .trimStart()
            .split("\n")[0]
            .replace(/^##\s*/, ""),
        })),
    [chunks]
  );

  const confirmDeleteAccount = async () => {
    if (deletingAccount) return;
    setDeletingAccount(true);
    setDeleteError("");
    try {
      await onDeleteAccount();
    } catch {
      setDeletingAccount(false);
      setDeleteError("Konto kustutamine ebaõnnestus. Palun proovi hiljem uuesti.");
    }
  };

  const currentChapter = useMemo(() => {
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (chapters[i].index <= curIndex) return chapters[i];
    }
    return null;
  }, [chapters, curIndex]);

  // Start centred on the reader panel and on the current chunk.
  useLayoutEffect(() => {
    hScrollRef.current?.scrollTo({ x: width, animated: false });
    vScrollRef.current?.scrollTo({ y: prevIndex !== null ? height : 0, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-centre instantly after a window shift so there is no visual jump.
  useLayoutEffect(() => {
    if (!needsRecenter.current) return;
    needsRecenter.current = false;
    vScrollRef.current?.scrollTo({ y: curIndex > 0 ? height : 0, animated: false });
  }, [curIndex, height]);

  // Notify TTS so it can continue autoplay or stop on manual navigation.
  useEffect(() => {
    tts.onChunkChanged(curIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curIndex]);

  useEffect(() => () => tts.stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerticalSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slot = Math.round(e.nativeEvent.contentOffset.y / height);
    const hasPrev = curIndex > 0;

    // Slot layout — with prev: [prev, cur, next]; without: [cur, next]
    const scrolledToPrev = hasPrev && slot === 0 && prevIndex !== null;
    const scrolledToNext = hasPrev
      ? slot === 2 && nextIndex !== null
      : slot === 1 && nextIndex !== null;

    if (!scrolledToPrev && !scrolledToNext) return;

    const target = scrolledToNext ? nextIndex! : prevIndex!;
    needsRecenter.current = true;
    setCurIndex(target);
    onPositionChangeRef.current?.(target, scrolledToNext);

    trackEvent("chunk scrolled", {
      book: title,
      chunk: target,
      direction: scrolledToNext ? "next" : "prev",
      time: new Date().toISOString(),
    });
  };

  const handleHorizontalSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Math.round(e.nativeEvent.contentOffset.x / width) === 0) onBack();
  };

  const goToChunk = (index: number) => {
    needsRecenter.current = true;
    setCurIndex(index);
    onPositionChangeRef.current?.(index, false);
    trackEvent("chunk goto", { book: title, chunk: index, time: new Date().toISOString() });
  };

  const handleTtsPress = () => {
    if (tts.ttsState === "idle") tts.play(curIndex);
    else tts.stop();
  };

  const progress =
    chunks.length > 0
      ? Math.round(((Math.min(curIndex, chunks.length - 1) + 1) / chunks.length) * 100)
      : 0;

  // Only 2–3 items are ever mounted.
  const windowItems: number[] = [];
  if (prevIndex !== null) windowItems.push(prevIndex);
  windowItems.push(curIndex);
  if (nextIndex !== null) windowItems.push(nextIndex);

  return (
    <ScrollView
      ref={hScrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      overScrollMode="never"
      onMomentumScrollEnd={handleHorizontalSettle}
      className="flex-1"
    >
      {/* ── Back panel (swipe right-to-left off the reader → home) ── */}
      <View style={{ width, height }}>
        <LoadingScreen />
      </View>

      {/* ── Reader panel ── */}
      <View style={{ width, height }} className="bg-stone-950">
        {/* Progress bar */}
        <View className="absolute left-0 right-0 top-0 z-20 h-0.5 bg-stone-800">
          <LinearGradient
            colors={[colors.amber[600], colors.amber[400]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: "100%", width: `${progress}%` }}
          />
        </View>

        {/* Chunk feed */}
        <ScrollView
          ref={vScrollRef}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          onMomentumScrollEnd={handleVerticalSettle}
        >
          {windowItems.map((index) => (
            <View
              key={`chunk-${index}`}
              style={{ width, height }}
              className="items-center justify-center px-8"
            >
              {index === chunks.length ? (
                <Animated.View entering={FadeInUp.duration(500)} className="max-w-sm items-center">
                  <View className="mb-6 h-16 w-16 items-center justify-center rounded-2xl border border-amber-700/25 bg-amber-950/20">
                    <Text className="text-2xl text-amber-400">✓</Text>
                  </View>
                  <Text
                    className="mb-2 text-xl text-stone-200"
                    style={{ fontFamily: fonts.heading, letterSpacing: 2 }}
                  >
                    Lõpetatud
                  </Text>
                  <Text className="mb-8 text-center text-sm text-stone-600">
                    {formatNumber(chunks.length)} lõiku · {title}
                  </Text>
                  <Pressable onPress={onBack} className="rounded-xl bg-amber-500 px-8 py-3">
                    <Text className="text-sm font-semibold text-stone-900">Loe midagi muud</Text>
                  </Pressable>
                </Animated.View>
              ) : (
                <View
                  className={`w-full max-w-xl ${
                    chunks[index].trimStart().startsWith("## ")
                      ? "border-l-2 border-amber-600/40 pl-4"
                      : ""
                  }`}
                >
                  <ChunkMarkdown>{chunks[index]}</ChunkMarkdown>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Top bar */}
        <View
          pointerEvents="box-none"
          className="absolute left-0 right-0 top-0 z-10 px-8"
          style={{ paddingTop: insets.top + 8 }}
        >
          <View className="w-full flex-row items-center justify-between">
            <Pressable onPress={onBack} hitSlop={8}>
              <Text className="text-sm text-stone-500">← Tagasi</Text>
            </Pressable>
            {stats && curIndex < chunks.length && (
              <Pressable
                accessibilityLabel="Ava statistika"
                onPress={() => hScrollRef.current?.scrollTo({ x: width * 2, animated: true })}
                hitSlop={8}
                className="flex-row items-center gap-2"
              >
                {stats.today.goalMet && <Flame size={14} color={colors.amber[500]} />}
                <Text className="text-sm text-stone-500">
                  {formatNumber(stats.today.chunksScrolled)}/{formatNumber(stats.today.dailyGoal)}
                </Text>
              </Pressable>
            )}
          </View>
          <Text numberOfLines={1} className="mt-2 w-full text-center text-sm text-stone-600">
            {title}
          </Text>
        </View>

        {/* Scroll hint */}
        {curIndex === 0 && (
          <Animated.View
            entering={FadeIn.delay(600)}
            pointerEvents="none"
            className="absolute bottom-28 left-0 right-0 items-center gap-1"
          >
            <Text className="text-xs text-stone-600">keri</Text>
            <Text className="text-xs text-stone-600">↓</Text>
          </Animated.View>
        )}

        {/* Bottom controls */}
        {curIndex < chunks.length && (
          <View
            pointerEvents="box-none"
            className="absolute left-0 right-0 flex-row items-center justify-center gap-3"
            style={{ bottom: insets.bottom + 24 }}
          >
            <Pressable
              onPress={handleTtsPress}
              hitSlop={8}
              accessibilityLabel={tts.ttsState === "idle" ? "Esita" : "Peata"}
            >
              {tts.ttsState === "loading" ? (
                <Loader size={16} color={colors.stone[500]} />
              ) : tts.ttsState === "playing" ? (
                <Square size={14} color={colors.stone[500]} />
              ) : (
                <Volume2 size={16} color={colors.stone[500]} />
              )}
            </Pressable>

            <Text className="text-xs text-stone-600">
              {formatNumber(curIndex + 1)} / {formatNumber(chunks.length)}
            </Text>

            {chapters.length > 0 && (
              <Pressable onPress={() => setShowChapterDialog(true)} hitSlop={8}>
                <Text className="text-sm text-stone-500">
                  {currentChapter ? `Peatükk ${currentChapter.title}` : "Peatükk"}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Chapter dialog */}
        <Modal
          visible={showChapterDialog}
          transparent
          animationType="fade"
          onRequestClose={() => setShowChapterDialog(false)}
        >
          <Pressable
            onPress={() => setShowChapterDialog(false)}
            className="flex-1 items-center justify-center bg-stone-950/80 px-8"
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="max-h-[70%] w-full max-w-sm rounded-2xl border border-stone-800 bg-stone-900 p-5"
            >
              <Text className="mb-4 text-lg text-stone-200" style={{ fontFamily: fonts.heading }}>
                Mine peatükile
              </Text>
              <ScrollView>
                {chapters.map((ch) => (
                  <Pressable
                    key={ch.index}
                    onPress={() => {
                      goToChunk(ch.index);
                      setShowChapterDialog(false);
                    }}
                    className={`rounded-xl px-3 py-2.5 ${
                      ch.index === curIndex ? "bg-amber-500/10" : ""
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        ch.index === curIndex ? "text-amber-400" : "text-stone-400"
                      }`}
                    >
                      {ch.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable onPress={() => setShowChapterDialog(false)} className="mt-4">
                <Text className="text-center text-sm text-stone-500">Sulge</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>

      <Modal
        visible={showDeleteDialog}
        transparent
        animationType="fade"
        onRequestClose={() => !deletingAccount && setShowDeleteDialog(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full max-w-sm rounded-2xl border border-red-900/50 bg-stone-900 p-5">
            <Text className="text-lg font-semibold text-stone-100">Kustuta konto</Text>
            <Text className="mt-2 text-sm leading-5 text-stone-400">
              See kustutab sinu konto ja serverisse salvestatud lugemisprogressi jäädavalt. Seda ei
              saa tagasi võtta.
            </Text>
            {!!deleteError && <Text className="mt-2 text-xs text-red-400">{deleteError}</Text>}
            <View className="mt-5 flex-row justify-end gap-4">
              <Pressable
                disabled={deletingAccount}
                onPress={() => {
                  setShowDeleteDialog(false);
                  setDeleteError("");
                }}
                hitSlop={8}
              >
                <Text className="text-sm text-stone-400">Tühista</Text>
              </Pressable>
              <Pressable
                disabled={deletingAccount}
                onPress={confirmDeleteAccount}
                className="rounded-lg bg-red-950 px-3 py-2"
              >
                <Text className="text-sm font-medium text-red-300">
                  {deletingAccount ? "Kustutan…" : "Jah, tahan konto kustutada"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Stats panel ── */}
      <View style={{ width, height }} className="bg-stone-950 px-8">
        <GlowBackground
          glows={[
            {
              position: { top: "15%", left: "20%" },
              size: 128,
              color: colors.amber[900],
              opacity: 0.06,
            },
            {
              position: { bottom: "25%", right: "15%" },
              size: 96,
              color: colors.stone[700],
              opacity: 0.08,
            },
          ]}
        />
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
        >
          {stats && (
            <View className="rounded-2xl border border-stone-800 bg-stone-950/50 p-5">
              <View className="flex-row items-baseline justify-between gap-4">
                <Text className="text-lg font-semibold text-stone-200">Statistika</Text>
                {stats.today.goalMet ? (
                  <Text className="text-xs text-amber-400">✓ eesmärk täidetud</Text>
                ) : (
                  <Text className="text-xs text-stone-600">
                    {formatNumber(stats.today.remaining)} lõiku eesmärgini
                  </Text>
                )}
              </View>

              <StatRow
                label="Kokku loetud"
                value={`${formatNumber(stats.totals.chunksRead)} lõiku`}
              >
                <Text className="mt-0.5 text-[10px] text-stone-600">
                  Mis on umbes {formatNumber(Math.round((stats.totals.chunksRead * 110) / 1300))}{" "}
                  raamatulehekülge
                </Text>
              </StatRow>
              <StatRow
                label="Keskmine päevas"
                value={`${
                  stats.totals.daysActive > 0
                    ? formatNumber(Math.round(stats.totals.chunksRead / stats.totals.daysActive))
                    : 0
                } lõiku`}
              />
              <StatRow label="Aktiivseid päevi" value={String(stats.totals.daysActive)} />
              <StatRow
                label="Järjest"
                value={`${stats.streak.current} päev${stats.streak.current !== 1 ? "a" : ""}`}
              />
              <StatRow
                label="Täna loetud"
                value={`${formatNumber(stats.today.chunksScrolled)}/${formatNumber(stats.today.dailyGoal)}`}
              />
            </View>
          )}

          <Pressable
            onPress={() => hScrollRef.current?.scrollTo({ x: width, animated: true })}
            className="mt-6"
          >
            <Text className="text-center text-sm text-stone-500">← Tagasi</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowDeleteDialog(true)}
            className="mt-8 self-center px-3 py-2"
            hitSlop={8}
            accessibilityLabel="Kustuta konto"
          >
            <Text className="text-xs text-stone-600">Kustuta konto</Text>
          </Pressable>

          <Text className="mt-3 text-center text-xs text-stone-700">
            Rakenduse versioon: {APP_VERSION}
          </Text>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

function StatRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <View className="flex-row justify-between border-b border-stone-800 py-3">
      <Text className="text-sm text-stone-500">{label}</Text>
      <View className="items-end">
        <Text className="text-sm font-semibold text-stone-200">{value}</Text>
        {children}
      </View>
    </View>
  );
}
