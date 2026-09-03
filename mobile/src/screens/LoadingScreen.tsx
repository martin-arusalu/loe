import { View, Text } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import GlowBackground from "@/components/GlowBackground";
import { colors } from "@/theme";

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      )
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={style} className="h-1.5 w-1.5 rounded-full bg-stone-500" />;
}

export default function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-stone-950">
      <GlowBackground
        glows={[
          {
            position: { top: "25%", left: "33%" },
            size: 160,
            color: colors.amber[900],
            opacity: 0.08,
          },
          {
            position: { bottom: "33%", right: "25%" },
            size: 112,
            color: colors.stone[700],
            opacity: 0.1,
          },
          {
            position: { top: "40%", left: "25%" },
            size: 256,
            color: colors.amber[950],
            opacity: 0.06,
          },
        ]}
      />
      <View className="items-center gap-5">
        <View className="h-14 w-14 items-center justify-center rounded-full border border-stone-800">
          <View className="flex-row items-center gap-1.5">
            <Dot delay={0} />
            <Dot delay={150} />
            <Dot delay={300} />
          </View>
        </View>
        <Text className="text-xs uppercase tracking-[3px] text-stone-700">Laen</Text>
      </View>
    </View>
  );
}
