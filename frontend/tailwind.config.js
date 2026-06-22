/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 温暖厨房调色板（参考 冰箱菜谱_创意方案.html）
        cream: {
          50: '#FFFCF5',
          100: '#FBF6EC',
          200: '#F3EAD8',
          300: '#E8DCC4',
        },
        ink: {
          DEFAULT: '#1F1A14',
          soft: '#4A3F31',
          muted: '#6B5D45',
        },
        wine: {
          50: '#FBF1EE',
          100: '#F3D9D2',
          400: '#C2553F',
          500: '#A8341E',
          600: '#8E2B19',
          700: '#7A2415',
        },
        pumpkin: {
          400: '#F09A55',
          500: '#E8843C',
          600: '#D26F2A',
        },
        moss: {
          400: '#5A7A5A',
          500: '#3D5A3D',
          600: '#2A4129',
        },
        gold: {
          400: '#D9B463',
          500: '#C9A24B',
        },
        line: '#D9CDB5',
        // 兼容旧 brand（指向 wine，避免破坏现有代码）
        brand: {
          50: '#FBF1EE',
          100: '#F3D9D2',
          200: '#E8B7AC',
          300: '#D88A77',
          400: '#C2553F',
          500: '#A8341E',
          600: '#8E2B19',
          700: '#7A2415',
          800: '#5E1C10',
          900: '#421308',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        italic: ['"Fraunces"', 'serif'],
      },
      boxShadow: {
        'paper': '0 20px 40px rgba(31,26,20,.06)',
        'paper-lg': '0 30px 60px rgba(31,26,20,.08)',
        'warm': '0 8px 22px rgba(168,52,30,.18)',
        'warm-lg': '0 12px 28px rgba(168,52,30,.28)',
      },
      backgroundImage: {
        'paper-texture':
          "radial-gradient(circle at 20% 30%, rgba(232,132,60,.05) 0, transparent 40%)," +
          "radial-gradient(circle at 80% 70%, rgba(168,52,30,.04) 0, transparent 40%)," +
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 .1 0 0 0 0 .08 0 0 0 0 .05 0 0 0 .04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
