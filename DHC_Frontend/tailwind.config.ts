import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#232326',
        'dark-border': '#333',
        'text-light': '#ccc',
        'text-muted': '#999',
        'accent-green': '#6bc786',
      }
    }
  },
  plugins: []
}

export default config

