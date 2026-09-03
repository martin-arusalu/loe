import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

interface GoogleSignInButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Standard multicolour Google "G" mark, displayed at its fixed 18px size. */
function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48" accessibilityElementsHidden>
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.3 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.73H24v9.02h12.62c-.54 2.91-2.18 5.38-4.65 7.03l7.17 5.57C43.33 37.52 46.5 31.77 46.5 24.5z" />
      <Path fill="#FBBC05" d="M10.54 28.59A14.49 14.49 0 0 1 9.73 24c0-1.59.27-3.13.81-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.98-6.19z" />
      <Path fill="#34A853" d="M24 48c6.3 0 11.59-2.08 15.45-5.67l-7.17-5.57c-1.99 1.33-4.54 2.12-8.28 2.12-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

/**
 * Custom light-pill variant permitted by Google's current branding guidelines.
 * The standard multicolour mark stays on white and the call to action is clear.
 */
export default function GoogleSignInButton({ onPress, disabled = false, style }: GoogleSignInButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Jätka Google'iga"
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          height: 52,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#747775",
          backgroundColor: "#ffffff",
          justifyContent: "center",
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <View style={{ position: "absolute", left: 16 }} pointerEvents="none">
        <GoogleMark />
      </View>
      <Text style={{ color: "#1f1f1f", fontSize: 15, fontWeight: "600", textAlign: "center" }}>
        Jätka Google&apos;iga
      </Text>
    </Pressable>
  );
}
