/**
 * Design tokens mirrored from the web app's `src/app/globals.css`
 * and its Tailwind `stone` / `amber` usage. Use these for anything that cannot
 * be expressed as a NativeWind class (gradients, SVG icon colors, blur tints).
 */
export const colors = {
  background: "#0c0a09",
  foreground: "#e7e5e4",

  stone: {
    50: "#fafaf9",
    100: "#f5f5f4",
    200: "#e7e5e4",
    300: "#d6d3d1",
    400: "#a8a29e",
    500: "#78716c",
    600: "#57534e",
    700: "#44403c",
    800: "#292524",
    900: "#1c1917",
    950: "#0c0a09",
  },
  amber: {
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
} as const;

export const fonts = {
  sans: "Quicksand_500Medium",
  sansSemibold: "Quicksand_600SemiBold",
  serif: "Lora_400Regular",
  serifBold: "Lora_600SemiBold",
  serifItalic: "Lora_400Regular_Italic",
  heading: "PlusJakartaSans_600SemiBold",
} as const;

/** Amber gradient used for progress bars and the primary button. */
export const amberGradient = [colors.amber[600], colors.amber[400]] as const;
