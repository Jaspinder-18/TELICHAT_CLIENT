/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support toggling dark mode via class
  theme: {
    extend: {
      colors: {
        // Sleek Telegram-like branding
        tg: {
          blue: 'var(--tg-blue, #24A1DE)',
          darkBlue: 'var(--tg-darkBlue, #1d82b3)',
          lightBlue: '#50b5ff',
          bgDark: 'var(--bg-app)',
          bgSidebarDark: 'var(--bg-sidebar)',
          bgChatDark: 'var(--bg-chat)',
          bubbleSelfDark: 'var(--bg-bubble-self)',
          bubbleOtherDark: 'var(--bg-bubble-other)',
          borderDark: 'var(--border-color)',
          textMuted: 'var(--color-text-muted)',
          textDefault: 'var(--color-text)',
        }
      }
    },
  },
  plugins: [],
}
