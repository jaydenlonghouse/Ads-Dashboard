import { qualityPillClass, qualityTier } from '../utils/leadQualityUtils.js'

export default function QualityBadge({ value }) {
  const text = String(value ?? '').trim()
  if (!text) return <span className="text-ink-400">—</span>
  const tier = qualityTier(text)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${qualityPillClass(text)}`}
    >
      {tier ?? text}
    </span>
  )
}
