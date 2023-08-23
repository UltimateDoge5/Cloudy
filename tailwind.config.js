/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/pages/**/*.tsx", "./src/components/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        'text': '#010905',
        'background': '#d3f8e6',
        'primary': '#0e5658',
        'secondary': '#c2daf5',
        'accent': '#2172ca',
      }
    },
  },
  plugins: [],
};
