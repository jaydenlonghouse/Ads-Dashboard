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

function qualityRank(value) {
  const tier = qualityTier(value)
  if (tier === 'High') return 4
  if (tier === 'Medium') return 3
  if (tier === 'Low') return 2
  if (value) return 1
  return 0
}

/** Keep High > Medium > Low > any other label > empty. */
export function preferLeadQuality(current, incoming) {
  return qualityRank(incoming) > qualityRank(current) ? incoming : current
}

/** Slices shown on the lead/deal quality pie (Other is appended when needed). */
export const QUALITY_PIE_SLICES = [
  { key: 'high', label: 'High', color: '#059669' },
  { key: 'medium', label: 'Medium', color: '#D97706' },
  { key: 'low', label: 'Low', color: '#EA580C' },
  { key: 'notYetQualified', label: 'Not Yet Qualified', color: '#08447F' },
  { key: 'spam', label: 'Spam', color: '#5C6773' },
]

const OTHER_SLICE = { key: 'other', label: 'Other', color: '#B0C4D8' }

/** Bucket a stored Pipedrive label into a pie slice key. */
export function qualityBucket(value) {
  const n = String(value ?? '').trim().toLowerCase()
  if (!n) return 'other'
  if (n === 'high' || n.includes('high quality') || n === 'hot') return 'high'
  if (n === 'medium' || n.includes('medium quality') || n === 'warm') return 'medium'
  if (n === 'low' || n.includes('low quality') || n === 'cold') return 'low'
  if (n.includes('not yet qualified')) return 'notYetQualified'
  if (n.includes('spam')) return 'spam'
  return 'other'
}

/**
 * @param {Array<{ leadQuality?: string|null }>} items
 * @returns {Array<{ key: string, label: string, color: string, count: number }>}
 */
export function qualityBreakdown(items) {
  const counts = Object.fromEntries(
    [...QUALITY_PIE_SLICES, OTHER_SLICE].map(slice => [slice.key, 0]),
  )
  for (const item of items) {
    counts[qualityBucket(item?.leadQuality)] += 1
  }
  const slices = QUALITY_PIE_SLICES.map(slice => ({ ...slice, count: counts[slice.key] }))
  if (counts.other > 0) slices.push({ ...OTHER_SLICE, count: counts.other })
  return slices
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
