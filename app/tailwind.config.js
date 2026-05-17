/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}", "./index.ts"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        charcoal: "#36333a",
        sage: "#b1b7a2",
        offWhite: "#f5f5f5",
        "primary-sage": "#b1b7a2",
        "vibrant-green": "#abec13",
        "background-dark": "#36333a",
        "zen-accent": "#b1b7a2",
        "zen-text": "#f5f5f5",
        "input-bg": "#444148",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1.25rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
