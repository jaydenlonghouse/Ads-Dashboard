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

function normalizeSource(source) {
  return String(source ?? '').trim().toLowerCase()
}

export function isGoogleAdsSource(source) {
  return normalizeSource(source).includes('google ads')
}

export function isMetaAdsSource(source) {
  const n = normalizeSource(source)
  return n.includes('meta ads') || n.includes('facebook ads') || n.includes('instagram ads')
}

export function isChatGptAdsSource(source) {
  const n = normalizeSource(source)
  return n.includes('chatgpt ads') || n.includes('chat gpt ads')
}

/**
 * Ads lead sources: Google Ads, Meta Ads, or ChatGPT Ads only.
 * @param {string | null | undefined} source
 */
export function isAdsSource(source) {
  return isGoogleAdsSource(source) || isMetaAdsSource(source) || isChatGptAdsSource(source)
}

/**
 * SEO lead sources: Google My Business, Organic SEO, or ChatGPT (not ChatGPT Ads).
 * @param {string | null | undefined} source
 */
export function isSeoSource(source) {
  if (isAdsSource(source)) return false
  const n = normalizeSource(source)
  if (!n) return false
  return SEO_SOURCE_NEEDLES.some(needle => n === needle || n.includes(needle))
}

/** Ads leads are dated by the linked conversion; SEO stays on the session date. */
export function withAdsLeadDate(sessions) {
  return sessions.map(session => ({
    ...session,
    date: session.conversionDate || session.date,
  }))
}

/**
 * @param {'ads' | 'seo'} department
 * @param {Array<{ source?: string }>} sessions
 * @param {string[]} [platformFilter] Ads view: 'All' | 'Google' | 'Meta'
 */
export function filterSessionsByDepartment(sessions, department, platformFilter = ['All']) {
  if (department === 'seo') return sessions.filter(s => isSeoSource(s.source))
  const ads = sessions.filter(s => isAdsSource(s.source))
  const wantsGoogle = platformFilter.includes('Google')
  const wantsMeta = platformFilter.includes('Meta')
  if (platformFilter.includes('All') || (!wantsGoogle && !wantsMeta)) return ads
  if (wantsGoogle && !wantsMeta) return ads.filter(s => isGoogleAdsSource(s.source))
  if (wantsMeta && !wantsGoogle) return ads.filter(s => isMetaAdsSource(s.source))
  return ads
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
      out.push({
        ...deal,
        platforms: deal.platforms ?? [],
        entryUrl: session.entryUrl ?? deal.entryUrl ?? null,
      })
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
