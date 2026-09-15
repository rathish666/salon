/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core brand palette — "Velvet & Oak"
        ink: '#1B1815',        // near-black warm charcoal, primary text/bg
        parchment: '#F7F2EA',  // warm ivory background
        oak: '#8A6E4B',        // muted warm brown, secondary accent
        champagne: '#C9A66B',  // gold accent, used sparingly (CTAs, highlights)
        rosewood: '#8C4A3D',   // deep terracotta-rose, used for emphasis/errors-adjacent warmth
        stone: '#A79C8E',      // muted taupe for secondary text/borders
        cream: '#FBF8F3',      // card surface on dark sections
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Work Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [],
};
