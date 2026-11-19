/**
 * Pipedrive Leads API — lead labels keyed by organization id.
 */

import { classifyLeadLabels } from '../../src/utils/leadQualityUtils.js'

const API_HOST = 'https://api.pipedrive.com'

function getPipedriveToken() {
  return (process.env.PIPEDRIVE_API_TOKEN ?? '').trim()
}

export function isPipedriveConfigured() {
  return Boolean(getPipedriveToken())
}

async function pipedriveGet(path, params = {}) {
  const token = getPipedriveToken()
  if (!token) return null
  const url = new URL(path, API_HOST)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  const res = await fetch(url, {
    headers: { 'x-api-token': token, accept: 'application/json' },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.success === false) {
    const err = new Error(data.error || `Pipedrive ${res.status} ${path}`)
    err.status = res.status
    throw err
  }
  return data
}

async function fetchAllLeads(path) {
  const out = []
  let start = 0
  for (;;) {
    const data = await pipedriveGet(path, { limit: 500, start })
    out.push(...(data?.data ?? []))
    const pagination = data?.additional_data?.pagination
    if (!pagination?.more_items_in_collection) break
    start = pagination.next_start
  }
  return out
}

async function fetchLabelNameById() {
  const data = await pipedriveGet('/v1/leadLabels')
  return Object.fromEntries((data?.data ?? []).map(label => [label.id, label.name]))
}

function orgIdFromDeal(deal) {
  const org = deal?.org_id
  if (org == null || org === '') return ''
  if (typeof org === 'object') {
    const id = org.value ?? org.id
    return id == null ? '' : String(id)
  }
  return String(org)
}

async function fetchAllDeals(path) {
  return fetchAllLeads(path)
}

/**
 * Historical quality maps from Pipedrive leads (active + archived) and deals.
 * Deal labels are usually empty after conversion, so deals inherit the org's
 * newest labeled lead. Converted source leads that Pipedrive deleted are gone.
 * @returns {Promise<{ byOrg: Map<string, string>, byDeal: Map<string, string> }|null>}
 */
export async function fetchLeadQualityMaps() {
  if (!isPipedriveConfigured()) return null

  const [labelById, activeLeads, archivedLeads, openDeals, archivedDeals] = await Promise.all([
    fetchLabelNameById(),
    fetchAllLeads('/v1/leads'),
    fetchAllLeads('/v1/leads/archived'),
    fetchAllDeals('/v1/deals'),
    fetchAllDeals('/v1/deals/archived'),
  ])

  const byOrgDated = new Map()
  for (const lead of [...activeLeads, ...archivedLeads]) {
    const orgId = lead.organization_id == null ? '' : String(lead.organization_id)
    if (!orgId) continue
    const names = (lead.label_ids ?? []).map(id => labelById[id]).filter(Boolean)
    const quality = classifyLeadLabels(names)
    if (!quality) continue
    const prev = byOrgDated.get(orgId)
    if (!prev || (lead.add_time || '') > prev.addTime) {
      byOrgDated.set(orgId, { quality, addTime: lead.add_time || '' })
    }
  }

  const byOrg = new Map([...byOrgDated.entries()].map(([orgId, row]) => [orgId, row.quality]))
  const byDeal = new Map()
  for (const deal of [...openDeals, ...archivedDeals]) {
    if (deal?.id == null) continue
    const fromOrg = byOrg.get(orgIdFromDeal(deal))
    if (fromOrg) byDeal.set(String(deal.id), fromOrg)
  }

  return { byOrg, byDeal }
}

let cachedMaps = null
let cachedAt = 0
let inflight = null
const CACHE_MS = 10 * 60 * 1000

export async function getCachedLeadQualityMaps() {
  if (!isPipedriveConfigured()) return null
  if (cachedMaps && Date.now() - cachedAt < CACHE_MS) return cachedMaps
  if (inflight) return inflight
  inflight = fetchLeadQualityMaps()
    .then(maps => {
      cachedMaps = maps
      cachedAt = Date.now()
      return maps
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}
