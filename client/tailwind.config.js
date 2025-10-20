/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // ✅ Fix: forza Tailwind a non usare i nuovi colori oklch()
  future: {
    disableColorFunction: true,
  },
};
