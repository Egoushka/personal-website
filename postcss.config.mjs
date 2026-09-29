// Tailwind CSS v4 runs as a PostCSS plugin inside `next build`; the output is the
// one static stylesheet the export ships (ADR 0007).
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
