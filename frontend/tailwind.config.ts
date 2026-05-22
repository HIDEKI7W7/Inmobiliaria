import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        'propio-blue': '#04045E',
        'propio-green': '#b9fa3c',
        // Tokens de diseño Linear.app premium
        'linear-canvas': '#010102',
        'linear-surface-1': '#0f1011',
        'linear-surface-2': '#141516',
        'linear-surface-3': '#18191a',
        'linear-hairline': '#23252a',
        'linear-hairline-strong': '#34343a',
        'linear-primary': '#5e6ad2',
        'linear-primary-hover': '#828fff',
        'linear-ink': '#f7f8f8',
        'linear-ink-muted': '#d0d6e0',
        'linear-ink-subtle': '#8a8f98',
        'linear-success': '#27a644',
      },
      fontFamily: {
        sans: ['MADE Tommy Soft', 'var(--font-plus-jakarta)', 'sans-serif'], // Cuerpo
        heading: ['Amerika Sans', 'var(--font-outfit)', 'sans-serif'], // Títulos
      },
    },
  },
  plugins: [],
};

export default config;
