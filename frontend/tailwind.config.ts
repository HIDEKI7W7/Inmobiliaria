import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Unificación: Paleta de colores oficial institucional de Propio (Hexadecimales exactos)
        brand: {
          lima: '#ccff00', // Verde Lima exacto
          azuldoscuro: '#000033', // Azul Marino exacto
          azulligero: '#0066ff', // Azul ligero exacto
        },
        branding: {
          black: "#000000",
          white: "#FFFFFF",
          muted: "#F8FAFC"
        },
        'propio-blue': '#000033',
        'propio-green': '#ccff00',
        'propio-base': '#F8FAFC',
        'propio-main': '#000033',
        'propio-body': '#334155',
        'btn-propio-action': '#ccff00',
        'propio-bg': '#F8FAFC',
        'propio-card': '#FFFFFF',
        'propio-dark': '#000033',
        'propio-text': '#475569',
        'propio-accent': '#ccff00',
        'propio-border': '#E2E8F0',
      },
      fontFamily: {
        // Unificación total: palo seco sin serifas
        sans: ['Inter', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
