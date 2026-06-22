import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { fetchRecipes, fetchCategories, fetchRandomRecipe } from '../api'
import RecipeCard from '../components/RecipeCard.jsx'
import FilterBar from '../components/FilterBar.jsx'

// 用于跨页面保存列表页的滚动位置
const scrollCache = { y: 0 }

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [recipes, setRecipes] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [randomLoading, setRandomLoading] = useState(false)
  const pageSize = 12
  const restoredRef = useRef(false)

  const filters = {
    keyword: searchParams.get('keyword') || '',
    difficulty: searchParams.get('difficulty') || '',
    cost_time: searchParams.get('cost_time') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'view_count',
  }

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories()
      setCategories(data.slice(0, 50))
    } catch (e) {
      console.error('加载分类失败', e)
    }
  }, [])

  const loadRecipes = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize, sort: filters.sort }
      if (filters.keyword) params.keyword = filters.keyword
      if (filters.difficulty) params.difficulty = filters.difficulty
      if (filters.cost_time) params.cost_time = filters.cost_time
      if (filters.category) params.category = filters.category
      const data = await fetchRecipes(params)
      setRecipes(data.items)
      setTotal(data.total)
    } catch (e) {
      console.error('加载菜谱失败', e)
    } finally {
      setLoading(false)
    }
  }, [page, filters.keyword, filters.difficulty, filters.cost_time, filters.category, filters.sort])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    // 当筛选条件变化时重置到第1页，并清除滚动恢复标记
    setPage(1)
    restoredRef.current = true
    scrollCache.y = 0
  }, [filters.keyword, filters.difficulty, filters.cost_time, filters.category, filters.sort])

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  // 离开列表页时保存滚动位置
  useEffect(() => {
    return () => {
      scrollCache.y = window.scrollY
    }
  }, [])

  // 返回列表页时恢复滚动位置（仅当数据已加载）
  useEffect(() => {
    if (!loading && !restoredRef.current && scrollCache.y > 0) {
      window.scrollTo(0, scrollCache.y)
      restoredRef.current = true
    }
  }, [loading])

  const onFilterChange = (newFilters) => {
    const params = { ...filters, ...newFilters }
    const newParams = {}
    if (params.keyword) newParams.keyword = params.keyword
    if (params.difficulty) newParams.difficulty = params.difficulty
    if (params.cost_time) newParams.cost_time = params.cost_time
    if (params.category) newParams.category = params.category
    if (params.sort && params.sort !== 'view_count') newParams.sort = params.sort
    setSearchParams(newParams)
  }

  const onRandomPick = async () => {
    setRandomLoading(true)
    try {
      const recipe = await fetchRandomRecipe()
      navigate(`/recipe/${recipe.id}`)
    } catch (e) {
      console.error('随机推荐失败', e)
      setRandomLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      {/* Hero 区 */}
      {!filters.keyword && !filters.difficulty && !filters.cost_time && !filters.category && (
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-16 lg:py-20 grid lg:grid-cols-[1.15fr_.85fr] gap-12 items-center">
            {/* 左：文案 */}
            <div>
              <span className="inline-flex items-center gap-2 font-italic italic text-sm text-wine-500 bg-wine-500/10 px-3.5 py-1.5 rounded-full border border-wine-500/20 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-wine-500"></span>
                FridgeCook · 按食材找菜谱
              </span>
              <h1 className="font-serif font-black text-ink leading-[1.08] tracking-tight mb-6"
                  style={{ fontSize: 'clamp(36px,5.5vw,68px)' }}>
                打开冰箱，<br />
                就知道
                <span className="relative inline-block text-wine-500 mx-1">
                  今晚吃什么
                  <span
                    className="absolute left-0 right-0 bottom-1.5 h-3 rounded z-[-1]"
                    style={{ background: 'linear-gradient(90deg,#E8843C,#C9A24B)', opacity: .35 }}
                  />
                </span>
                。
              </h1>
              <p className="text-lg text-ink-soft max-w-xl mb-8">
                2000 道家常菜谱。勾选你冰箱里现有的食材，系统按匹配度从高到低推荐——让做饭决策从"翻找"变成"选择"。
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Link to="/fridge" className="btn-primary px-6 py-3 text-base">
                  🧊 试试冰箱模式
                </Link>
                <a href="#recipes" className="btn-ghost px-6 py-3 text-base">
                  📋 浏览全部菜谱
                </a>
                <button
                  onClick={onRandomPick}
                  disabled={randomLoading}
                  className="btn-secondary px-6 py-3 text-base border-pumpkin-500/40 text-pumpkin-600 hover:bg-pumpkin-500/10 disabled:opacity-60"
                >
                  {randomLoading ? '🎲 抽取中...' : '🎲 随机来一道'}
                </button>
              </div>
            </div>

            {/* 右：冰箱插画（纯 CSS） */}
            <div className="hidden lg:block relative h-[420px]">
              <div
                className="absolute inset-0 m-auto w-[230px] h-[370px] rounded-2xl border-[3px] border-ink p-4 flex flex-col gap-2.5"
                style={{
                  background: 'linear-gradient(180deg,#FFFCF5,#F3EAD8)',
                  boxShadow: '18px 18px 0 #A8341E, 18px 18px 0 -3px #1F1A14',
                }}
              >
                {/* 把手 */}
                <span className="absolute -right-3.5 top-28 w-2 h-20 bg-ink rounded" />
                {/* 上层 */}
                <div className="border-b-2 border-dashed border-line pb-2">
                  <div className="font-italic italic text-[11px] text-ink-soft mb-1.5">冷藏室 · 上层</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-wine-500 text-cream-50">茄子</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-wine-500 text-cream-50">五花肉</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-cream-200 border border-line text-ink-soft">鸡蛋</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-cream-200 border border-line text-ink-soft">豆腐</span>
                  </div>
                </div>
                {/* 中层 */}
                <div className="border-b-2 border-dashed border-line pb-2">
                  <div className="font-italic italic text-[11px] text-ink-soft mb-1.5">冷藏室 · 下层</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-wine-500 text-cream-50">花菜</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-cream-200 border border-line text-ink-soft">青蒜</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-cream-200 border border-line text-ink-soft">葱</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-cream-200 border border-line text-ink-soft">大蒜</span>
                  </div>
                </div>
                {/* 调味区 */}
                <div>
                  <div className="font-italic italic text-[11px] text-ink-soft mb-1.5">调味区</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-cream-200 border border-line text-ink-soft">生抽</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-cream-200 border border-line text-ink-soft">料酒</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-cream-200 border border-line text-ink-soft">盐</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-cream-200 border border-line text-ink-soft">糖</span>
                  </div>
                </div>
              </div>
              {/* 漂浮卡片 */}
              <div className="absolute top-5 -right-2 bg-cream-50 border-[1.5px] border-ink rounded-xl px-3.5 py-2.5 text-xs shadow-warm rotate-3">
                匹配度 <b className="text-wine-500 font-italic">100%</b><br />→ 干煸菜花
              </div>
              <div className="absolute bottom-8 -left-8 bg-cream-50 border-[1.5px] border-ink rounded-xl px-3.5 py-2.5 text-xs shadow-warm -rotate-3">
                耗时仅 <b className="text-moss-500 font-italic">30 秒</b><br />决定今晚菜单
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 筛选栏 */}
        <div id="recipes" className="mb-6 scroll-mt-20">
          <FilterBar filters={filters} onChange={onFilterChange} categories={categories} />
        </div>

        {/* 结果统计 */}
        <div className="mb-4 text-sm text-ink-soft flex items-center gap-2">
          {loading ? (
            <span className="font-italic italic">加载中...</span>
          ) : (
            <>
              <span className="font-italic italic text-pumpkin-500">— {total}</span>
              <span>道菜谱</span>
              {filters.keyword && <span className="text-ink-muted">· 关键词"{filters.keyword}"</span>}
            </>
          )}
        </div>

        {/* 菜谱网格 */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[4/3] bg-cream-200"></div>
                <div className="p-3">
                  <div className="h-4 bg-cream-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-cream-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20 text-ink-soft">
            <div className="text-6xl mb-4 opacity-50">🔍</div>
            <p className="font-serif text-lg">没有找到符合条件的菜谱</p>
            <button
              onClick={() => onFilterChange({ difficulty: '', cost_time: '', category: '', keyword: '' })}
              className="btn-secondary mt-4"
            >
              清除所有筛选
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}

        {/* 分页 */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← 上一页
            </button>
            <span className="px-2 py-2 text-sm flex items-center gap-1 text-ink-soft">
              第
              <input
                type="number"
                min={1}
                max={totalPages}
                value={page}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  if (!isNaN(v) && v >= 1 && v <= totalPages) {
                    setPage(v)
                  }
                }}
                className="w-14 px-2 py-1 text-center bg-cream-50 border border-line rounded focus:outline-none focus:ring-2 focus:ring-wine-400/40 focus:border-wine-400"
              />
              <span className="font-italic italic text-ink-muted">/ {totalPages}</span> 页
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一页 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
