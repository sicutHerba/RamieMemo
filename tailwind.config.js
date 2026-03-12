/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'note-bg': '#FFFEF0',
        'note-border': '#E0E0E0',
      },
      boxShadow: {
        'note': '2px 2px 4px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
        'note-hover': '4px 4px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
