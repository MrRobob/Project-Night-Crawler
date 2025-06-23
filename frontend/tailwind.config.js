// tailwind.config.js
// Verwende die ES-Modul-Syntax
export const content = [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
];
export const theme = {
  extend: {
    fontFamily: {
      inter: ['Inter', 'sans-serif'], // Stellt sicher, dass Inter verfügbar ist
    },
  },
};
export const plugins = [];
