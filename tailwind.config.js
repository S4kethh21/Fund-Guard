/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--bg-primary)',
          'bg-secondary': 'var(--bg-secondary)',
          surface: 'var(--surface)',
          'surface-elevated': 'var(--surface-elevated)',
          'surface-raised': 'var(--surface-raised)',
          'surface-hover': 'var(--surface-hover)',
          border: 'var(--border)',
          'border-subtle': 'var(--border-subtle)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          card: 'var(--card-bg)',
          'card-border': 'var(--card-border)',
        },
        gov: {
          dark: '#0A192F',    // Deep Navy
          slate: '#1E293B',   // Dark Slate
          subtle: '#334155',  // Muted Slate
          border: '#CBD5E1',  // Border Grey
          surface: '#F8FAFC', // Background off-white
          ashoka: '#1E3A8A',  // Official National Blue
          ashokaHover: '#172554',
          gold: '#B45309'     // Official Seal Accent
        },
        risk: {
          low: '#059669',     // Emerald Green
          lowBg: '#ECFDF5',
          lowBorder: '#A7F3D0',
          med: '#D97706',     // Amber
          medBg: '#FFFBEB',
          medBorder: '#FDE68A',
          high: '#DC2626',    // Crimson Red
          highBg: '#FEF2F2',
          highBorder: '#FECACA'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
