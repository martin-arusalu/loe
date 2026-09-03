/** @type {import('tailwindcss').Config} */
// Mirrors the web app's theme (src/app/globals.css). Keep the two in sync.
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0c0a09",
        foreground: "#e7e5e4",
      },
      fontFamily: {
        sans: ["Quicksand_500Medium"],
        serif: ["Lora_400Regular"],
        heading: ["PlusJakartaSans_600SemiBold"],
      },
    },
  },
  plugins: [],
};
