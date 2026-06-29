/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        soft:    "0 4px 24px rgba(15, 23, 42, 0.06)",
        card:    "0 2px 8px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(15,23,42,0.04)",
        elevated:"0 8px 32px rgba(15, 23, 42, 0.12)",
        glow:    "0 0 0 3px rgba(59,130,246,0.15)",
        "glow-cyan": "0 0 0 3px rgba(6,182,212,0.18)",
      },
      colors: {
        navy: {
          DEFAULT: "#0f172a",
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          800: "#1e293b",
          900: "#0f172a",
          950: "#0a0f1e",
        },
        brand: {
          DEFAULT: "#2563eb",
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        accent: {
          DEFAULT: "#06b6d4",
          50:  "#ecfeff",
          100: "#cffafe",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        surface: {
          0: "#ffffff",
          1: "#f9fafb",
          2: "#f3f4f6",
          3: "#e5e7eb",
        },
      },
      borderRadius: {
        "xl":  "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      animation: {
        "fade-in":    "fadeIn 0.2s ease-out",
        "slide-up":   "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow":  "spin 2s linear infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
      backgroundImage: {
        "gradient-hero": "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        "gradient-brand": "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
        "gradient-subtle": "linear-gradient(180deg, #f9fafb 0%, #ffffff 100%)",
      },
    },
  },
  plugins: [],
};
