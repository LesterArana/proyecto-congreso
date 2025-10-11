/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        umgBlue: "#0066B3", // color azul institucional
        umgRed: "#C9252B",
      },
    },
  },
  plugins: [],
};
