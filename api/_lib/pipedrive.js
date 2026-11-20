/**
 * Pipedrive lead + deal labels keyed by organization id and deal id.
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

async function fetchAllV2Deals() {
  async function page(archivedStatus) {
    const out = []
    let cursor = null
    for (;;) {
      const params = { limit: 500, include_fields: 'source_lead_id' }
      if (cursor) params.cursor = cursor
      if (archivedStatus) params.archived_status = archivedStatus
      const data = await pipedriveGet('/api/v2/deals', params)
      out.push(...(data?.data ?? []))
      cursor = data?.additional_data?.next_cursor ?? null
      if (!cursor) break
    }
    return out
  }

  const [open, archived] = await Promise.all([page(null), page('archived')])
  return [...open, ...archived]
}

async function fetchLeadLabelNameById() {
  const data = await pipedriveGet('/v1/leadLabels')
  return Object.fromEntries((data?.data ?? []).map(label => [String(label.id), label.name]))
}

async function fetchDealLabelNameById() {
  const data = await pipedriveGet('/api/v2/dealFields')
  const field = (data?.data ?? []).find(
    f => f.field_code === 'label_ids' || String(f.field_name ?? '').toLowerCase() === 'label',
  )
  const names = {}
  for (const option of field?.options ?? []) {
    const id = option.id ?? option.value
    const name = option.label ?? option.name
    if (id == null || !name) continue
    names[String(id)] = String(name)
  }
  return names
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

function dealLabelIds(deal) {
  if (Array.isArray(deal?.label_ids) && deal.label_ids.length) {
    return deal.label_ids.map(id => String(id))
  }
  const raw = deal?.label
  if (raw == null || raw === '') return []
  if (Array.isArray(raw)) {
    return raw
      .map(item => {
        if (item == null) return ''
        if (typeof item === 'object') return String(item.id ?? item.value ?? '')
        return String(item)
      })
      .filter(Boolean)
  }
  if (typeof raw === 'object') {
    const id = raw.id ?? raw.value
    return id == null ? [] : [String(id)]
  }
  return String(raw)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function qualityFromLabelIds(ids, labelById) {
  const names = (ids ?? []).map(id => labelById[String(id)]).filter(Boolean)
  return classifyLeadLabels(names)
}

/**
 * Historical quality maps from Pipedrive lead labels and deal labels.
 * Converted leads are deleted, so deal labels (when present) are the catch-up
 * source. Otherwise the deal inherits the org's newest labeled leftover lead.
 * @returns {Promise<{ byOrg: Map<string, string>, byDeal: Map<string, string> }|null>}
 */
export async function fetchLeadQualityMaps() {
  if (!isPipedriveConfigured()) return null

  const [leadLabelById, dealLabelById, activeLeads, archivedLeads, deals] = await Promise.all([
    fetchLeadLabelNameById(),
    fetchDealLabelNameById(),
    fetchAllLeads('/v1/leads'),
    fetchAllLeads('/v1/leads/archived'),
    fetchAllV2Deals(),
  ])
  const labelById = { ...leadLabelById, ...dealLabelById }

  const byOrgDated = new Map()
  for (const lead of [...activeLeads, ...archivedLeads]) {
    const orgId = lead.organization_id == null ? '' : String(lead.organization_id)
    if (!orgId) continue
    const quality = qualityFromLabelIds(lead.label_ids, labelById)
    if (!quality) continue
    const prev = byOrgDated.get(orgId)
    if (!prev || (lead.add_time || '') > prev.addTime) {
      byOrgDated.set(orgId, { quality, addTime: lead.add_time || '' })
    }
  }

  const byOrg = new Map([...byOrgDated.entries()].map(([orgId, row]) => [orgId, row.quality]))
  const byDeal = new Map()
  for (const deal of deals) {
    if (deal?.id == null) continue
    const fromDeal = qualityFromLabelIds(dealLabelIds(deal), labelById)
    const fromOrg = byOrg.get(orgIdFromDeal(deal)) ?? null
    const quality = fromDeal || fromOrg
    if (quality) byDeal.set(String(deal.id), quality)
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
