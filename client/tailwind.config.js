/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Facoltativo: timing/ombre/angoli più morbidi
      transitionDuration: { 200: '200ms', 300: '300ms' },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
      },
      // Facoltativo: palette neutra leggermente più “UI”
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          dark: '#0f172a', // slate-900 approx
        },
      },
    },
    container: {
      center: true,
      padding: '1rem',
      screens: { lg: '1024px', xl: '1280px', '2xl': '1440px' },
    },
  },
  plugins: [
    // Migliora gli <input>/<select>/<textarea> con dark mode coerente
    require('@tailwindcss/forms'),
    // Testi lunghi (blog/descrizioni) con buon contrasto
    require('@tailwindcss/typography'),
    // Troncamento testi con line-clamp-*
    require('@tailwindcss/line-clamp'),
  ],
}
