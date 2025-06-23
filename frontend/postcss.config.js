// postcss.config.js
// Importiere das spezifische Tailwind CSS PostCSS-Plugin für v4.x
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

// Exportiere die PostCSS-Konfiguration als ES-Modul.
// Die Plugins müssen als Funktionen aufgerufen werden.
export default {
  plugins: [
    tailwindcss(), // Rufe das @tailwindcss/postcss Plugin als Funktion auf
    autoprefixer(), // Rufe autoprefixer als Funktion auf
  ],
};
