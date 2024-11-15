/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        Jakarta: ["Jakarta", "sans-serif"],
        JakartaBold: ["Jakarta-Bold", "sans-serif"],
        JakartaExtraBold: ["Jakarta-ExtraBold", "sans-serif"],
        JakartaExtraLight: ["Jakarta-ExtraLight", "sans-serif"],
        JakartaLight: ["Jakarta-Light", "sans-serif"],
        JakartaMedium: ["Jakarta-Medium", "sans-serif"],
        JakartaSemiBold: ["Jakarta-SemiBold", "sans-serif"],
      },
      colors: {
        primary: {
          100: "#F3F0F8", // Púrpura muy claro
          200: "#E6E1F1", // Púrpura claro
          300: "#C5B6E3", // Púrpura suave
          400: "#9A84D2", // Púrpura medio
          500: "#6D29D2", // Púrpura aún más suave (proporcionado)
          600: "#5416A0", // Púrpura más suave (proporcionado)
          700: "#4A148C", // Púrpura (proporcionado)
          800: "#3B1070", // Púrpura oscuro
          900: "#2C0C54", // Púrpura muy oscuro
        },
        secondary: {
          100: "#E6FBF8", // Cian muy claro
          200: "#CCF7F1", // Cian claro
          300: "#99EFE3", // Cian suave
          400: "#66E7D5", // Cian medio
          500: "#00BFA5", // Cian (proporcionado)
          600: "#00A38C", // Cian oscuro
          700: "#008773", // Cian más oscuro
          800: "#006B5A", // Cian muy oscuro
          900: "#004F41", // Cian extremadamente oscuro
        },
        success: {
          100: "#F0FFF4",
          200: "#C6F6D5",
          300: "#9AE6B4",
          400: "#68D391",
          500: "#38A169",
          600: "#2F855A",
          700: "#276749",
          800: "#22543D",
          900: "#1C4532",
        },
        danger: {
          100: "#FFF5F5",
          200: "#FED7D7",
          300: "#FEB2B2",
          400: "#FC8181",
          500: "#F56565",
          600: "#E53E3E",
          700: "#C53030",
          800: "#9B2C2C",
          900: "#742A2A",
        },
        warning: {
          100: "#FFFBEB",
          200: "#FEF3C7",
          300: "#FDE68A",
          400: "#FACC15",
          500: "#EAB308",
          600: "#CA8A04",
          700: "#A16207",
          800: "#854D0E",
          900: "#713F12",
        },
        general: {
          100: "#CED1DD",
          200: "#858585",
          300: "#EEEEEE",
          400: "#0CC25F",
          500: "#F6F8FA",
          600: "#E6F3FF",
          700: "#EBEBEB",
          800: "#ADADAD",
        },
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        'poco-c65': {'raw': '(min-width: 720px) and (max-width: 1600px)'}, // Específico para tu dispositivo
      },
    },
  },
  plugins: [],
};
