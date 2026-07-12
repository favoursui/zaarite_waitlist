/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./build/**/*.html", "./build/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        slategray: "#64748B",
        mint: "#22C55E",
        "mint-dark": "#16A34A",
        offwhite: "#F8FAF9",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
