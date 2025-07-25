/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#37966F', // Bouton principal, lien/action
        secondary: '#A5D6A7', // Bouton secondaire
        background: '#F0FFF4', // Fond principal
        backgroundSecondary: '#E8F5E9', // Fond secondaire
        text: '#1A1A1A', // Texte principal
        textSecondary: '#4A635D', // Texte secondaire
        border: '#D0E8DA', // Bordures/séparateurs
        hover: '#B2DFDB', // Hover/sélection
        error: '#D32F2F', // Erreur/alerte

        dark: {
          primary: '#37966F', // Main green, can stay the same or be brightened
          secondary: '#A5D6A7', // Light green for accents
          background: '#1A2B27', // Dark desaturated green-gray
          backgroundSecondary: '#2A4B42', // Slightly lighter version
          text: '#E8F5E9', // Light text for high contrast
          textSecondary: '#A5D6A7', // Muted light green for secondary text
          border: '#4A635D', // Dark, subtle green-gray border
          hover: '#3A635A', // A slightly lighter background for hover states
          error: '#EF5350', // A slightly brighter red for dark backgrounds
        }
      },
      fontFamily: {
        title: ['General Sans', 'Segoe UI', 'sans-serif'],
        body: ['IBM Plex Sans', 'Arial', 'sans-serif'],
        ui: ['Manrope', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        h1: ['32px', { lineHeight: '40px', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '32px', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '28px', fontWeight: '500' }],
        base: ['16px', { lineHeight: '24px', fontWeight: '400' }],
        legend: ['14px', { lineHeight: '20px', fontWeight: '300' }],
        kpi: ['24px', { lineHeight: '32px', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
}

