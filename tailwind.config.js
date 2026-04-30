/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0F2B46", light: "#1B3A5C", dark: "#091D2F" },
        accent: { DEFAULT: "#E67E22", light: "#F0A05A" },
        success: { DEFAULT: "#1ABC9C", light: "#D5F5EE" },
        danger: { DEFAULT: "#E74C3C", light: "#FDEDEC" },
        warn: { DEFAULT: "#F39C12", light: "#FEF5E7" },
        muted: { DEFAULT: "#6B7B8D", light: "#F4F6F9" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
