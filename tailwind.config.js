/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        royal: "#1e40af",
        brand: "#2563eb",
        pale: "#eff6ff",
        slate: { 25: "#fbfcfe" },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
      boxShadow: {
        soft: "0 14px 40px rgba(15, 23, 42, .07)",
      },
    },
  },
  plugins: [],
};
