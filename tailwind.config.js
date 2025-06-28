module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Poppins', 'sans-serif'],
      },
      colors: {
        primary: '#1d4ed8',
        accent: '#10b981',
        text: '#111827',
        muted: '#6b7280',
        bg: '#f9fafb',
        error: '#ef4444',
      },
    },
  },
  plugins: [],
}