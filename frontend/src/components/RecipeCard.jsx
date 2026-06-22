import { Link } from 'react-router-dom'

const DIFFICULTY_CLASS = {
  '初级': 'diff-0',
  '中级': 'diff-1',
  '高级': 'diff-2',
}

export default function RecipeCard({ recipe }) {
  return (
    <Link to={`/recipe/${recipe.id}`} className="card card-hover block group">
      <div className="aspect-[4/3] bg-cream-200 overflow-hidden relative">
        {recipe.thumb ? (
          <img
            src={recipe.thumb}
            alt={recipe.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="w-full h-full items-center justify-center text-cream-300 text-5xl"
          style={{ display: recipe.thumb ? 'none' : 'flex' }}
        >
          🍽️
        </div>
        {recipe.video_platform && (
          <span className="absolute top-2 right-2 badge bg-ink/70 text-cream-50 backdrop-blur-sm">▶ 视频</span>
        )}
      </div>
      <div className="p-3.5">
        <h3
          className="font-serif font-bold text-ink truncate group-hover:text-wine-500 transition-colors"
          title={recipe.title}
        >
          {recipe.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
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
        </div>
        <div className="flex items-center justify-between mt-2.5 text-xs text-ink-muted font-italic italic">
          <span>🔥 {formatNum(recipe.view_count)}</span>
          <span>❤ {formatNum(recipe.fav_count)}</span>
        </div>
      </div>
    </Link>
  )
}

function formatNum(n) {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return String(n)
}
