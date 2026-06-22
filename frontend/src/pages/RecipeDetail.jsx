import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchRecipeDetail } from '../api'
import VideoEmbed from '../components/VideoEmbed.jsx'

const DIFFICULTY_CLASS = {
  '初级': 'diff-0',
  '中级': 'diff-1',
  '高级': 'diff-2',
}

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchRecipeDetail(id)
      .then((data) => setRecipe(data))
      .catch((e) => {
        console.error('加载详情失败', e)
        setError('菜谱不存在或加载失败')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-cream-200 rounded w-1/2 mb-4"></div>
          <div className="aspect-[16/9] bg-cream-200 rounded-2xl mb-6"></div>
          <div className="h-4 bg-cream-200 rounded mb-2"></div>
          <div className="h-4 bg-cream-200 rounded w-3/4 mb-6"></div>
          <div className="h-32 bg-cream-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4 opacity-50">😕</div>
        <p className="text-ink-soft mb-4 font-serif text-lg">{error || '菜谱不存在'}</p>
        <Link to="/" className="btn-primary">返回首页</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 悬浮返回按钮 */}
      <button
        onClick={() => navigate(-1)}
        className="fixed left-4 bottom-6 z-40 btn-secondary shadow-warm-lg px-4 py-2 rounded-full bg-cream-50/95 backdrop-blur hover:bg-cream-50"
        title="返回上一页"
      >
        ← 返回
      </button>

      {/* 封面图 */}
      <div className="aspect-[16/9] bg-cream-200 rounded-2xl overflow-hidden mb-6 border border-line">
        {recipe.thumb ? (
          <img
            src={recipe.thumb}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cream-300 text-7xl">🍽️</div>
        )}
      </div>

      {/* 标题区 */}
      <div className="mb-6">
        <div className="section-tag">Recipe · 菜谱详情</div>
        <h1 className="font-serif font-black text-3xl text-ink mb-3">{recipe.title}</h1>
        {recipe.description && (
          <p className="text-ink-soft mb-3 leading-relaxed">{recipe.description}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {recipe.difficulty_label && (
            <span className={`badge ${DIFFICULTY_CLASS[recipe.difficulty_label] || 'bg-cream-200 text-ink-soft'}`}>
              {recipe.difficulty_label}
            </span>
          )}
          {recipe.cost_time && (
            <span className="badge bg-cream-200 text-ink-soft">🕐 {recipe.cost_time}</span>
          )}
          {recipe.main_category && (
            <span className="badge bg-moss-500/10 text-moss-500">{recipe.main_category}</span>
          )}
          {recipe.categories.filter(c => !c.is_main).slice(0, 5).map((c) => (
            <span key={c.category} className="badge bg-cream-200 text-ink-soft">{c.category}</span>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-ink-muted font-italic italic">
          <span>🔥 {recipe.view_count || 0} 浏览</span>
          <span>❤ {recipe.fav_count || 0} 收藏</span>
          <span>👨‍🍳 {recipe.cook_count || 0} 人做过</span>
        </div>
      </div>

      {/* 视频 */}
      {recipe.video_url && recipe.video_platform && (
        <VideoEmbed url={recipe.video_url} platform={recipe.video_platform} />
      )}

      {/* 食材清单 */}
      <section className="bg-cream-50 rounded-2xl border border-line shadow-paper p-6 mb-6">
        <h2 className="font-serif font-bold text-xl text-ink mb-4 flex items-center gap-2">
          <span>🥬</span> 食材清单
          <span className="font-italic italic text-sm text-ink-muted font-normal">
            — Ingredients
          </span>
        </h2>
        {recipe.ingredients.length === 0 ? (
          <p className="text-ink-muted">暂无食材信息</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recipe.ingredients.map((ing) => (
              <div
                key={ing.id}
                className="flex items-center justify-between py-2 px-3 bg-cream-100 rounded-lg border border-line/60"
              >
                <span className="font-medium text-ink">{ing.name}</span>
                <span className="text-ink-muted text-sm font-italic italic">{ing.amount || '适量'}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 步骤 */}
      <section className="bg-cream-50 rounded-2xl border border-line shadow-paper p-6 mb-6">
        <h2 className="font-serif font-bold text-xl text-ink mb-4 flex items-center gap-2">
          <span>📝</span> 烹饪步骤
          <span className="font-italic italic text-sm text-ink-muted font-normal">
            — Steps
          </span>
        </h2>
        {recipe.steps.length === 0 ? (
          <p className="text-ink-muted">暂无步骤信息</p>
        ) : (
          <ol className="space-y-6">
            {recipe.steps.map((step) => (
              <li key={step.id} className="flex gap-4">
                <div className="shrink-0 w-9 h-9 rounded-full bg-wine-500 text-cream-50 flex items-center justify-center font-serif font-bold shadow-warm">
                  {step.step_num}
                </div>
                <div className="flex-1">
                  <p className="text-ink-soft mb-2 leading-relaxed">{step.step_text}</p>
                  {step.step_pic && (
                    <div className="mt-2 rounded-xl overflow-hidden max-w-md border border-line">
                      <img
                        src={step.step_pic}
                        alt={`步骤${step.step_num}`}
                        loading="lazy"
                        className="w-full h-auto"
                        onError={(e) => { e.target.parentElement.style.display = 'none' }}
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* 小贴士 */}
      {recipe.tip && (
        <section
          className="rounded-2xl p-6 border"
          style={{
            background: 'linear-gradient(135deg, rgba(232,132,60,.08), rgba(201,162,75,.08))',
            borderColor: 'rgba(232,132,60,.3)',
          }}
        >
          <h2 className="font-serif font-bold text-xl text-pumpkin-600 mb-3 flex items-center gap-2">
            <span>💡</span> 小贴士
            <span className="font-italic italic text-sm text-pumpkin-500/70 font-normal">— Tips</span>
          </h2>
          <p className="text-ink-soft whitespace-pre-line leading-relaxed">{recipe.tip}</p>
        </section>
      )}
    </div>
  )
}
