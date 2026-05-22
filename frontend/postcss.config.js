module.exports = {
  plugins: {
    tailwindcss: { config: './tailwind.config.ts' }, // Fuerza a PostCSS a usar el Tailwind Config local
    autoprefixer: {},
  },
};
