import { useState } from 'react'

/**
 * 视频嵌入组件
 * 支持平台：youku / tencent / bilibili / tudou / iqiyi / other
 * 注意：.swf（Flash）格式已废弃，无法播放，会显示提示
 */
export default function VideoEmbed({ url, platform }) {
  const [open, setOpen] = useState(false)

  if (!url || !platform) return null

  // 检测是否为已废弃的 Flash swf 格式
  const isFlash = url.toLowerCase().includes('.swf')
  // 检测是否为可嵌入的 iframe 格式（youku/tencent embed）
  const isEmbeddable = !isFlash && (
    url.includes('player.youku.com/embed') ||
    url.includes('v.qq.com/iframe') ||
    url.includes('player.bilibili.com') ||
    url.includes('tudou.com/v')
  )

  const platformLabels = {
    youku: '优酷',
    tencent: '腾讯视频',
    bilibili: '哔哩哔哩',
    tudou: '土豆',
    iqiyi: '爱奇艺',
    other: '视频',
  }

  // Flash 格式无法播放，显示提示
  if (isFlash) {
    return (
      <div className="my-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
        <span className="mr-2">🎬</span>
        该菜谱的视频为旧版 Flash 格式（{platformLabels[platform] || '视频'}），现代浏览器已不支持播放。
      </div>
    )
  }

  // 非 embed 格式的视频（如页面 URL），提供外链跳转
  if (!isEmbeddable) {
    return (
      <div className="my-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          ▶ 前往{platformLabels[platform] || '外部'}观看视频 ↗
        </a>
      </div>
    )
  }

  // 可嵌入的 iframe 视频
  return (
    <div className="my-4">
      <button
        onClick={() => setOpen(true)}
        className="btn-primary"
      >
        ▶ 观看{platformLabels[platform] || '视频'}
      </button>
      {open && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-brand-400"
              aria-label="关闭"
            >
              ✕
            </button>
            <iframe
              src={url}
              title="recipe video"
              allowFullScreen
              className="w-full h-full"
              frameBorder="0"
            />
          </div>
        </div>
      )}
    </div>
  )
}
