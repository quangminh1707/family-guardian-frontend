import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: "class",

  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Custom theme từ stitch/
        background: '#0e0e10',
        'surface': '#0e0e10',
        'surface-container': '#19191c',
        'surface-container-low': '#131315',
        'surface-container-lowest': '#000000',
        'surface-container-high': '#1f1f22',
        'surface-container-highest': '#262528',
        'surface-bright': '#2c2c2f',
        primary: '#bd9dff',
        'primary-dim': '#8a4cfc',
        secondary: '#699cff',
        tertiary: '#ffa5d9',
        error: '#ff6e84',
        'on-primary': '#3c0089',
        'on-primary-fixed': '#000000',
        'on-secondary': '#001e4a',
        'on-surface': '#f9f5f8',
        'on-surface-variant': '#adaaad',
        'on-background': '#f9f5f8',
        outline: '#767577',
        'outline-variant': '#48474a',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate as any],

}

export default config
