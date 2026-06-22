import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import FridgeMode from './pages/FridgeMode.jsx'
import RecipeDetail from './pages/RecipeDetail.jsx'

export default function App() {
  const location = useLocation()
  // 详情页不显示顶部导航的搜索栏（简化布局）
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fridge" element={<FridgeMode />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
        </Routes>
      </main>
      <footer className="bg-ink text-cream-300 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="font-serif font-black text-2xl text-cream-100 mb-2">冰箱菜谱 · FridgeCook</div>
          <div className="font-italic italic text-pumpkin-500 mb-4">
            Tell us what you have, we'll tell you what to cook.
          </div>
          <div className="text-xs text-ink-muted leading-relaxed">
            共 2000 道菜谱 · 数据来源于豆果美食<br />
            打开冰箱，就知道今晚吃什么
          </div>
        </div>
      </footer>
    </div>
  )
}
