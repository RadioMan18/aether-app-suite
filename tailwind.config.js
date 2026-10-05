import plugin from "@tailwindcss/vite";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--aether-bg)",
        "surface-1": "var(--aether-surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        border: "var(--aether-border)",
        "text-primary": "var(--aether-text)",
        "text-secondary": "var(--aether-text-muted)",
        "text-muted": "var(--aether-text-muted)",
        accent: "var(--aether-primary)",
        "accent-hover": "var(--aether-primary-hover)",
        success: "var(--aether-success)",
        warning: "var(--aether-warning)",
        danger: "var(--aether-error)",
        aether: {
          bg: "var(--aether-bg)",
          surface: "var(--aether-surface)",
          "surface-border": "var(--aether-border)",
          text: "var(--aether-text)",
          "text-muted": "var(--aether-text-muted)",
          primary: "var(--aether-primary)",
          "primary-hover": "var(--aether-primary-hover)",
          "primary-fg": "var(--aether-primary-fg)",
          selected: "var(--aether-selected)",
          "selected-border": "var(--aether-selected-border)",
          "selected-fg": "var(--aether-selected-fg)",
          success: "var(--aether-success)",
          warning: "var(--aether-warning)",
          error: "var(--aether-error)",
          info: "var(--aether-info)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [plugin],
};
