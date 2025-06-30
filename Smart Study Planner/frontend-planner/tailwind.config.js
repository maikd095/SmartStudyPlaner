/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--color-background))",
        surface: {
          elevated: "hsl(var(--color-surface-elevated))",
        },
        text: {
          primary: "hsl(var(--color-text-primary))",
        },
        border: "hsl(var(--color-border))",
      },
    },
  },
  plugins: [],
};
