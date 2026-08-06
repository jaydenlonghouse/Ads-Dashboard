/**
 * utils/dealsUtils.js
 *
 * Resolve linked deal IDs from filtered metrics rows into deduplicated deal rows.
 */

import { format, isValid, parseISO } from 'date-fns'

import { isGoogleAdsPlatform, isMetaAdsPlatform } from './dateUtils.js'

/** @param {string} platform */
function metricPlatformKind(platform) {
  if (isGoogleAdsPlatform(platform)) return 'google'
  if (isMetaAdsPlatform(platform)) return 'meta'
  return null
}

/**
 * @param {Array<{ linkedDealIds?: string[], platform?: string }>} metricRows
 * @param {Array<{ id: string, date?: string|null, businessName: string, dealStage: string, dealStatus: string, lostReason?: string|null, label?: string|null }>} allDeals
 * @returns {Array<{ id: string, date?: string|null, businessName: string, dealStage: string, dealStatus: string, lostReason?: string|null, label?: string|null, platforms: ('google'|'meta')[] }>}
 */
export function getDealsForMetricRows(metricRows, allDeals) {
  const byId = Object.fromEntries(allDeals.map(d => [d.id, d]))
  /** @type {Map<string, Set<'google'|'meta'>>} */
  const platformsByDealId = new Map()

  for (const row of metricRows) {
    const kind = metricPlatformKind(row.platform)
    if (!kind) continue
    for (const id of row.linkedDealIds ?? []) {
      if (!id) continue
      if (!platformsByDealId.has(id)) platformsByDealId.set(id, new Set())
      platformsByDealId.get(id).add(kind)
    }
  }

  return [...platformsByDealId.keys()]
    .map(id => {
      const base = byId[id]
      if (!base) return null
      const platforms = [...platformsByDealId.get(id)].sort()
      return { ...base, platforms }
    })
    .filter(Boolean)
}

/** Parse deal `Date` from Airtable (ISO date or datetime string). */
export function parseDealDate(value) {
  if (value == null || value === '') return null
  if (value instanceof Date && isValid(value)) return value
  const d = parseISO(String(value))
  return isValid(d) ? d : null
}

/** Display date for the deals table. */
export function formatDealDate(value) {
  const d = parseDealDate(value)
  if (!d) return '—'
  return format(d, 'MMM d, yyyy')
}

function dealDateTimestamp(value) {
  const d = parseDealDate(value)
  return d ? d.getTime() : Number.NEGATIVE_INFINITY
}

/** Presentable label for Airtable single-select / text status values. */
export function formatDealField(value) {
  if (value == null || value === '' || value === '—') return '—'
  const s = String(value).trim()
  if (!s) return '—'
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/** Tailwind classes for deal status pills. */
export function getDealStatusPillClass(status) {
  const n = String(status ?? '')
    .trim()
    .toLowerCase()
  if (n === 'open') return 'bg-brand-100 text-brand-800'
  if (n === 'lost') return 'bg-red-100 text-red-800'
  if (n === 'won') return 'bg-emerald-100 text-emerald-800'
  return 'bg-ink-100 text-ink-600'
}

/** Sort key → comparable string for a deal row (text columns). */
export function dealSortValue(deal, sortKey) {
  if (sortKey === 'businessName') return deal.businessName ?? ''
  if (sortKey === 'dealStage') return formatDealField(deal.dealStage)
  if (sortKey === 'dealStatus') return formatDealField(deal.dealStatus)
  if (sortKey === 'lostReason') return formatDealField(deal.lostReason)
  if (sortKey === 'label') return formatDealField(deal.label)
  return ''
}

/** Compare two deals for table sorting. */
export function compareDeals(a, b, sortKey, direction) {
  const mult = direction === 'asc' ? 1 : -1
  if (sortKey === 'date') {
    return mult * (dealDateTimestamp(a.date) - dealDateTimestamp(b.date))
  }
  return (
    mult *
    dealSortValue(a, sortKey).localeCompare(dealSortValue(b, sortKey), undefined, {
      sensitivity: 'base',
    })
  )
}
