import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fetchIngredients, matchRecipes } from '../api'

// 食材分类顺序（显示用）
const CATEGORY_ORDER = ['肉类', '海鲜水产', '蛋类', '蔬菜', '豆制品', '主食面食', '调味料', '干果坚果', '水果', '其他']
const CATEGORY_ICONS = {
  '肉类': '🥩',
  '海鲜水产': '🦐',
  '蛋类': '🥚',
  '蔬菜': '🥬',
  '豆制品': '🧈',
  '主食面食': '🍜',
  '调味料': '🧂',
  '干果坚果': '🌰',
  '水果': '🍎',
  '其他': '🍽️',
}

const DIFFICULTY_CLASS = {
  '初级': 'diff-0',
  '中级': 'diff-1',
  '高级': 'diff-2',
}

export default function FridgeMode() {
  const [allIngredients, setAllIngredients] = useState([])
  const [keyword, setKeyword] = useState('')
  const [activeCategory, setActiveCategory] = useState('肉类')
  const [selected, setSelected] = useState([]) // [{id, name, category}]
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingIngredients, setLoadingIngredients] = useState(true)
  const debounceRef = useRef(null)

  // 加载食材列表
  useEffect(() => {
    fetchIngredients('', 5000)
      .then((data) => {
        setAllIngredients(data)
        setLoadingIngredients(false)
      })
      .catch((e) => {
        console.error('加载食材失败', e)
        setLoadingIngredients(false)
      })
  }, [])

  // 按分类分组
  const groupedIngredients = useMemo(() => {
    const groups = {}
    for (const ing of allIngredients) {
      const cat = ing.category || '其他'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(ing)
    }
    return groups
  }, [allIngredients])

  // 当前显示的食材（按分类 + 关键词过滤）
  const visibleIngredients = useMemo(() => {
    let list = groupedIngredients[activeCategory] || []
    if (keyword.trim()) {
      const kw = keyword.trim()
      list = list.filter((i) => i.name.includes(kw))
    }
    return list.slice(0, 200)
  }, [groupedIngredients, activeCategory, keyword])

  // 关键词搜索时跨分类显示
  const searchResults = useMemo(() => {
    if (!keyword.trim()) return null
    const kw = keyword.trim()
    const all = allIngredients.filter((i) => i.name.includes(kw))
    const groups = {}
    for (const ing of all) {
      const cat = ing.category || '其他'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(ing)
    }
    return groups
  }, [keyword, allIngredients])

  // 匹配菜谱（防抖）
  const doMatch = useCallback(async (selectedIds) => {
    if (selectedIds.length === 0) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const data = await matchRecipes(selectedIds, 48)
      setResults(data.items)
    } catch (e) {
      console.error('匹配失败', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doMatch(selected.map((s) => s.id))
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [selected, doMatch])

  const toggleIngredient = (ing) => {
    setSelected((prev) => {
      const exists = prev.find((p) => p.id === ing.id)
      if (exists) {
        return prev.filter((p) => p.id !== ing.id)
      }
      return [...prev, ing]
    })
  }

  const isSelected = (id) => selected.some((s) => s.id === id)

  // 已选食材按分类分组
  const selectedByCategory = useMemo(() => {
    const groups = {}
    for (const ing of selected) {
      const cat = ing.category || '其他'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(ing)
    }
    return groups
  }, [selected])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 页头 */}
      <div className="mb-6">
        <div className="section-tag">Fridge Mode · 按食材找菜谱</div>
        <h1 className="font-serif font-black text-3xl text-ink mb-2">
          🧊 冰箱模式
        </h1>
        <p className="text-ink-soft">勾选你手边有的食材，找出最匹配的菜谱</p>
      </div>

      {/* 演示盒（参考创意方案 demo-box 风格） */}
      <div className="bg-cream-50 rounded-3xl border border-line overflow-hidden shadow-paper-lg">
        {/* 头部条 */}
        <div className="bg-ink text-cream-100 px-6 py-4 flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg">🧊 冰箱模式 · 交互演示</h3>
          <span className="font-italic italic text-sm text-pumpkin-500 hidden sm:inline">
            点击下方食材标签，实时查看匹配菜谱
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr]">
          {/* 左侧：食材选择 */}
          <div className="p-5 lg:border-r-[1.5px] lg:border-dashed lg:border-line">
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-8rem)] lg:flex lg:flex-col">
              <h4 className="font-serif font-bold text-base text-ink shrink-0">选择你冰箱里的食材</h4>
              <p className="text-xs text-ink-muted mb-3 mt-0.5 shrink-0">常用食材一键点选，可多选</p>

              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索食材，如：鸡蛋"
                className="input mb-3 shrink-0"
              />

              {/* 已选食材（不滚动） */}
              {selected.length > 0 && (
                <div className="mb-3 p-3 bg-cream-200/70 rounded-xl shrink-0 border border-line">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-ink-soft">
                      已选 <b className="text-wine-500 font-italic">{selected.length}</b> 种食材
                    </span>
                    <button
                      onClick={() => setSelected([])}
                      className="text-xs text-ink-muted hover:text-wine-500 underline"
                    >
                      清空
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(selectedByCategory).map(([cat, ings]) => (
                      ings.map((s) => (
                        <span
                          key={s.id}
                          className="badge bg-wine-500 text-cream-50 cursor-pointer hover:bg-wine-600"
                          onClick={() => toggleIngredient(s)}
                          title={`${cat} · 点击移除`}
                        >
                          ✓ {s.name} ✕
                        </span>
                      ))
                    ))}
                  </div>
                </div>
              )}

              {/* 分类切换 tabs（无搜索词时显示） */}
              {!keyword.trim() && (
                <div className="flex flex-wrap gap-1 mb-3 border-b border-line pb-3 shrink-0">
                  {CATEGORY_ORDER.map((cat) => {
                    const count = (groupedIngredients[cat] || []).length
                    if (count === 0) return null
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                          activeCategory === cat
                            ? 'bg-wine-500 text-cream-50 shadow-warm'
                            : 'bg-cream-200 text-ink-soft hover:bg-cream-300'
                        }`}
                      >
                        {CATEGORY_ICONS[cat]} {cat} ({count})
                      </button>
                    )
                  })}
                </div>
              )}

              {/* 食材标签云（可滚动） */}
              <div className="flex-1 overflow-y-auto min-h-0 scroll-warm pr-1">
                {loadingIngredients ? (
                  <div className="text-center py-8 text-ink-muted font-italic italic">加载中...</div>
                ) : keyword.trim() && searchResults ? (
                  Object.keys(searchResults).length === 0 ? (
                    <div className="text-center py-8 text-ink-muted">未找到相关食材</div>
                  ) : (
                    <div className="space-y-3">
                      {CATEGORY_ORDER.map((cat) => {
                        const ings = searchResults[cat]
                        if (!ings || ings.length === 0) return null
                        return (
                          <div key={cat}>
                            <div className="text-xs text-ink-muted mb-1.5 font-medium">
                              {CATEGORY_ICONS[cat]} {cat}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {ings.map((ing) => (
                                <button
                                  key={ing.id}
                                  onClick={() => toggleIngredient(ing)}
                                  className={`px-2.5 py-1 rounded-full text-sm transition-all border ${
                                    isSelected(ing.id)
                                      ? 'bg-wine-500 text-cream-50 border-wine-500 shadow-warm'
                                      : 'bg-cream-50 text-ink border-line hover:border-wine-400 hover:text-wine-500'
                                  }`}
                                >
                                  {isSelected(ing.id) && '✓ '}{ing.name}
                                  <span className="ml-1 text-xs opacity-60">{ing.count}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                ) : visibleIngredients.length === 0 ? (
                  <div className="text-center py-8 text-ink-muted">该分类暂无食材</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {visibleIngredients.map((ing) => (
                      <button
                        key={ing.id}
                        onClick={() => toggleIngredient(ing)}
                        className={`px-2.5 py-1 rounded-full text-sm transition-all border ${
                          isSelected(ing.id)
                            ? 'bg-wine-500 text-cream-50 border-wine-500 shadow-warm'
                            : 'bg-cream-50 text-ink border-line hover:border-wine-400 hover:text-wine-500'
                        }`}
                      >
                        {isSelected(ing.id) && '✓ '}{ing.name}
                        <span className="ml-1 text-xs opacity-60">{ing.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：匹配结果 */}
          <div className="p-5 bg-cream-100/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif font-bold text-base">匹配菜谱</h4>
              <span className="font-italic italic text-sm text-ink-muted">
                {selected.length === 0
                  ? `共 0 道`
                  : loading
                    ? '匹配中...'
                    : `共 ${results.length} 道可做`}
              </span>
            </div>

            {selected.length === 0 ? (
              <div className="text-center py-16 text-ink-muted">
                <div className="text-5xl mb-3 opacity-50">🧊</div>
                <p className="font-serif">点击左侧食材标签</p>
                <p className="text-sm mt-1">看看你的冰箱能做什么菜</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12 text-ink-muted font-italic italic">匹配中...</div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 text-ink-muted">
                <div className="text-5xl mb-3 opacity-50">🤔</div>
                <p className="font-serif">当前食材组合暂无匹配菜谱</p>
                <p className="text-sm mt-1">试试勾选更多常用食材</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto scroll-warm pr-1">
                {results.map((item) => {
                  const pct = Math.round(item.match_ratio * 100)
                  return (
                    <Link
                      key={item.recipe.id}
                      to={`/recipe/${item.recipe.id}`}
                      className="block bg-cream-50 border border-line rounded-2xl p-3.5 flex gap-3.5 transition-all hover:border-wine-400 hover:shadow-warm hover:translate-x-1"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-cream-200">
                        {item.recipe.thumb && (
                          <img
                            src={item.recipe.thumb}
                            alt={item.recipe.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-serif font-bold text-ink truncate">{item.recipe.title}</h5>
                          <span className="font-italic italic font-bold text-wine-500 shrink-0">{pct}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap text-xs">
                          {item.recipe.difficulty_label && (
                            <span className={`badge ${DIFFICULTY_CLASS[item.recipe.difficulty_label] || ''}`}>
                              {item.recipe.difficulty_label}
                            </span>
                          )}
                          {item.recipe.cost_time && (
                            <span className="badge bg-cream-200 text-ink-soft">🕐 {item.recipe.cost_time}</span>
                          )}
                          {item.recipe.main_category && (
                            <span className="badge bg-moss-500/10 text-moss-500">{item.recipe.main_category}</span>
                          )}
                        </div>
                        {/* 匹配度进度条 */}
                        <div className="flex items-center gap-2 mt-2 text-xs text-ink-muted">
                          <span>匹配度</span>
                          <div className="flex-1 h-1.5 bg-cream-200 rounded-full overflow-hidden min-w-[80px]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                background: 'linear-gradient(90deg,#E8843C,#A8341E)',
                              }}
                            />
                          </div>
                          <span>{item.matched_count}/{item.total_count}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
