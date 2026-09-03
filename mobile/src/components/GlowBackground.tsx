/**
 * Replacement for the web app's `blur-3xl` background glows.
 *
 * React Native has no CSS blur filter, so each glow is a radial-ish stack of
 * concentric translucent circles. Cheap, GPU-friendly and visually equivalent
 * at these opacities.
 */
import { View } from "react-native";

interface GlowProps {
  /** Percentage/absolute style position, e.g. `{ top: "20%", left: "30%" }`. */
  position: {
    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
  };
  size: number;
  color: string;
  /** Peak opacity at the centre of the glow. */
  opacity?: number;
}

const RINGS = 6;

export function Glow({ position, size, color, opacity = 0.08 }: GlowProps) {
  return (
    <View
      pointerEvents="none"
      style={[{ position: "absolute", width: size, height: size }, position as object]}
    >
      {Array.from({ length: RINGS }).map((_, i) => {
        const scale = 1 - i / RINGS;
        const inset = (size * (1 - scale)) / 2;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              top: inset,
              left: inset,
              width: size * scale,
              height: size * scale,
              borderRadius: (size * scale) / 2,
              backgroundColor: color,
              opacity: opacity / RINGS,
            }}
          />
        );
      })}
    </View>
  );
}

interface GlowBackgroundProps {
  glows: GlowProps[];
}

export default function GlowBackground({ glows }: GlowBackgroundProps) {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {glows.map((g, i) => (
        <Glow key={i} {...g} />
      ))}
    </View>
  );
}
