/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/pages/**/*.tsx", "./src/components/**/*.tsx", "./src/app/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        'text': "rgb(var(--text) / <alpha-value>)",
        'background': "rgb(var(--background) / <alpha-value>)",
        'primary': "rgb(var(--primary) / <alpha-value>)",
        'secondary': "rgb(var(--secondary) / <alpha-value>)",
        'accent': "rgb(var(--accent) / <alpha-value>)"
      }
    },
  },
  plugins: [],
};
