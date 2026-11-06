/**
 * Classify lead sessions as Ads vs SEO and join them to Deals records.
 */

import { safeDivide } from './kpiUtils.js'

const SEO_SOURCE_NEEDLES = [
  'google my business',
  'google business',
  'gmb',
  'organic seo',
  'organic search',
  'chatgpt',
  'chat gpt',
]

/**
 * @param {string | null | undefined} source
 */
export function isSeoSource(source) {
  const n = String(source ?? '').trim().toLowerCase()
  if (!n) return false
  return SEO_SOURCE_NEEDLES.some(needle => n === needle || n.includes(needle))
}

/**
 * @param {string | null | undefined} source
 */
export function isAdsSource(source) {
  return !isSeoSource(source)
}

/**
 * @param {'ads' | 'seo'} department
 * @param {Array<{ source?: string }>} sessions
 */
export function filterSessionsByDepartment(sessions, department) {
  if (department === 'seo') return sessions.filter(s => isSeoSource(s.source))
  return sessions.filter(s => isAdsSource(s.source))
}

/**
 * @param {string | null | undefined} status
 */
export function isWonDealStatus(status) {
  return String(status ?? '').trim().toLowerCase() === 'won'
}

/**
 * Deduped deals linked from the given lead sessions.
 * @param {Array<{ linkedDealIds?: string[] }>} sessions
 * @param {Array<{ id: string }>} allDeals
 */
export function getDealsForSessions(sessions, allDeals) {
  const byId = Object.fromEntries(allDeals.map(d => [d.id, d]))
  const seen = new Set()
  const out = []
  for (const session of sessions) {
    for (const id of session.linkedDealIds ?? []) {
      if (!id || seen.has(id)) continue
      const deal = byId[id]
      if (!deal) continue
      seen.add(id)
      out.push({ ...deal, platforms: deal.platforms ?? [] })
    }
  }
  return out
}

/**
 * @param {Array<{ dealStatus?: string }>} deals
 */
export function getWonDeals(deals) {
  return deals.filter(d => isWonDealStatus(d.dealStatus))
}

/**
 * @param {Array<{ linkedDealIds?: string[] }>} sessions
 * @param {Array<{ id: string, dealStatus?: string }>} allDeals
 */
export function funnelCounts(sessions, allDeals) {
  const deals = getDealsForSessions(sessions, allDeals)
  const wins = getWonDeals(deals).length
  return {
    leads: sessions.length,
    deals: deals.length,
    wins,
    leadToDealRate: safeDivide(deals.length * 100, sessions.length),
    dealCloseRate: safeDivide(wins * 100, deals.length),
  }
}
