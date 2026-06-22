export default function FilterBar({ filters, onChange, categories }) {
  const uniqueDiff = [
    { value: '', label: '全部难度' },
    { value: '0', label: '初级' },
    { value: '1', label: '中级' },
    { value: '3', label: '高级' },
  ]
  const costTimes = [
    { value: '', label: '全部耗时' },
    { value: '15分钟以内', label: '15分钟以内' },
    { value: '30分钟', label: '30分钟' },
    { value: '1小时以内', label: '1小时以内' },
    { value: '1小时以上', label: '1小时以上' },
  ]
  const sorts = [
    { value: 'view_count', label: '浏览数' },
    { value: 'fav_count', label: '收藏数' },
    { value: 'cook_count', label: '做过数' },
  ]

  return (
    <div className="bg-cream-50/90 backdrop-blur-sm rounded-2xl border border-line shadow-paper p-4 flex flex-wrap items-center gap-3">
      <select
        value={filters.difficulty}
        onChange={(e) => onChange({ ...filters, difficulty: e.target.value })}
        className="input w-auto"
      >
        {uniqueDiff.map((d) => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </select>

      <select
        value={filters.cost_time}
        onChange={(e) => onChange({ ...filters, cost_time: e.target.value })}
        className="input w-auto"
      >
        {costTimes.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
        className="input w-auto"
      >
        <option value="">全部分类</option>
        {categories.map((c) => (
          <option key={c.category} value={c.category}>
            {c.category} ({c.count})
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <span className="text-sm text-ink-muted font-italic italic">排序</span>
        {sorts.map((s) => (
          <button
            key={s.value}
            onClick={() => onChange({ ...filters, sort: s.value })}
            className={`px-3 py-1 rounded-full text-sm transition-all ${
              filters.sort === s.value
                ? 'bg-ink text-cream-50'
                : 'bg-cream-200 text-ink-soft hover:bg-cream-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {(filters.difficulty || filters.cost_time || filters.category) && (
        <button
          onClick={() => onChange({ ...filters, difficulty: '', cost_time: '', category: '' })}
          className="ml-auto text-sm text-ink-muted hover:text-wine-500 transition-colors"
        >
          ✕ 清除筛选
        </button>
      )}
    </div>
  )
}
