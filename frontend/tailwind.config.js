/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          light: "var(--color-primary-light)",
          dark: "var(--color-primary-dark)",
        },
        base: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        edge: "var(--color-border)",
        "edge-strong": "var(--color-border-strong)",
        ink: {
          DEFAULT: "var(--color-text)",
          soft: "var(--color-text-soft)",
          faint: "var(--color-text-faint)",
        },
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      boxShadow: {
        glass: "0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px -12px rgba(15, 23, 42, 0.12)",
        "glass-dark": "0 1px 2px rgba(0, 0, 0, 0.3), 0 16px 40px -12px rgba(0, 0, 0, 0.55)",
        "glass-hover": "0 1px 2px rgba(15, 23, 42, 0.06), 0 20px 40px -14px rgba(15, 23, 42, 0.18)",
      },
      backdropBlur: {
        glass: "20px",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        "slide-up": { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "ring-fill": { "0%": { strokeDashoffset: "var(--ring-circumference)" }, "100%": { strokeDashoffset: "var(--ring-offset)" } },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "ring-fill": "ring-fill 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
      },
    },
  },
  plugins: [],
};
