/** @type {import('tailwindcss').Config} */

module.exports = {
  mode: 'jit',
 // These paths are just examples, customize them to match your project structure
 content: ["./src/**/*.{html,js}"],
  plugins: [], 
 purge: [
   './public/**/*.html',
   './src/**/*.{js,jsx,ts,tsx,vue}',
 ],
  theme: {
    // ...
    fontFamily: {
      sans: [
        '"DM Sans"',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        '"Noto Sans"',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ],
    },
    animation: {
      'spin-slow': 'spin 5s linear infinite',
    },
  }
  // ...
}