import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'

export default function Navbar() {
  const [keyword, setKeyword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const onSearch = (e) => {
    e.preventDefault()
    const q = keyword.trim()
    if (q) {
      navigate(`/?keyword=${encodeURIComponent(q)}`)
    } else {
      navigate('/')
    }
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-cream-100/85 border-b border-line">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <span
            className="w-9 h-9 rounded-xl grid place-items-center text-cream-50 text-lg shadow-warm"
            style={{ background: 'linear-gradient(135deg,#A8341E,#E8843C)' }}
          >
            冰
          </span>
          <span className="font-serif font-black text-xl text-ink hidden sm:inline tracking-tight">
            冰箱菜谱
          </span>
        </Link>

        {/* 搜索框 */}
        <form onSubmit={onSearch} className="flex-1 max-w-2xl">
          <div className="relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索菜名，如：番茄炒蛋"
              className="input pl-10 pr-20 bg-cream-50/90"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">🔍</span>
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-primary px-3 py-1 text-sm"
            >
              搜索
            </button>
          </div>
        </form>

        {/* 导航 */}
        <nav className="flex items-center gap-2 shrink-0">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              location.pathname === '/'
                ? 'bg-ink text-cream-50'
                : 'text-ink-soft hover:text-wine-500'
            }`}
          >
            首页
          </Link>
          <Link
            to="/fridge"
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              location.pathname === '/fridge'
                ? 'bg-ink text-cream-50'
                : 'text-ink-soft hover:text-wine-500'
            }`}
          >
            🧊 冰箱模式
          </Link>
        </nav>
      </div>
    </header>
  )
}
