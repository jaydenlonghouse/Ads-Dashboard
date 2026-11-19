/**
 * Pipedrive lead-label → High / Medium / Low (and other labels kept as-is).
 */

export const QUALITY_TIERS = ['High', 'Medium', 'Low']

/** Map a stored or Pipedrive label to High / Medium / Low, else null. */
export function qualityTier(value) {
  const n = String(value ?? '').trim().toLowerCase()
  if (!n) return null
  if (n === 'high' || n.includes('high quality') || n === 'hot') return 'High'
  if (n === 'medium' || n.includes('medium quality') || n === 'warm') return 'Medium'
  if (n === 'low' || n.includes('low quality') || n === 'cold') return 'Low'
  return null
}

/**
 * Prefer High / Medium / Low when present; otherwise the first Pipedrive label name.
 * @param {string[]} names
 */
export function classifyLeadLabels(names) {
  const list = (names ?? []).map(n => String(n ?? '').trim()).filter(Boolean)
  if (!list.length) return null
  const tiers = list.map(qualityTier)
  if (tiers.includes('High')) return 'High'
  if (tiers.includes('Medium')) return 'Medium'
  if (tiers.includes('Low')) return 'Low'
  return list[0]
}

/**
 * @param {Array<{ leadQuality?: string|null }>} items
 * @returns {{ high: number|null, medium: number|null, low: number|null }}
 */
export function qualityShare(items) {
  const total = items.length
  const counts = { High: 0, Medium: 0, Low: 0 }
  for (const item of items) {
    const tier = qualityTier(item?.leadQuality)
    if (tier) counts[tier] += 1
  }
  const pct = count => (total === 0 ? null : (count * 100) / total)
  return {
    high: pct(counts.High),
    medium: pct(counts.Medium),
    low: pct(counts.Low),
  }
}

export function qualityPillClass(value) {
  const tier = qualityTier(value)
  if (tier === 'High') return 'bg-emerald-100 text-emerald-800'
  if (tier === 'Medium') return 'bg-amber-100 text-amber-800'
  if (tier === 'Low') return 'bg-orange-100 text-orange-800'
  const n = String(value ?? '').toLowerCase()
  if (n.includes('spam')) return 'bg-ink-100 text-ink-600'
  return 'bg-brand-50 text-brand-800'
}
