/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          50: '#FAF6F0',
          100: '#F4ECE0',
          200: '#E7D5BF',
          300: '#D5BA98',
          400: '#BC966C',
          500: '#9E7444',
          600: '#7E5830',
          700: '#624122',
          800: '#462C16',
          900: '#2E1C0D',
        },
        martin: {
          green: {
            50: '#F0FDF4',
            100: '#DCFCE7',
            200: '#BBF7D0',
            300: '#86EFAC',
            400: '#22C55E',
            500: '#00843D', // Verde Oficial Martin
            600: '#007335',
            700: '#005C2A',
            800: '#004720',
            900: '#003317',
          },
          orange: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#F59E0B',
            500: '#E07A00', // Naranja Oficial Martin
            600: '#C66700',
            700: '#9E4D00',
            800: '#7D3A00',
            900: '#5C2800',
          }
        },
        brand: {
          primary: '#00843D', // Verde Martín
          accent: '#E07A00',  // Naranja Martín
          dark: '#0F172A',
          surface: '#F8FAFC'
        }
      }
    },
  },
  plugins: [],
}
