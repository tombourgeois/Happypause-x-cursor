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
      },
    },
  },
  plugins: [],
};
