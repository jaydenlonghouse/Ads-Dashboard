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

/**
 * Newest Pipedrive lead (active or archived) per organization → classified quality.
 * @returns {Promise<Map<string, string>|null>}
 */
export async function fetchOrgLeadQualityMap() {
  if (!isPipedriveConfigured()) return null

  const [labelById, active, archived] = await Promise.all([
    fetchLabelNameById(),
    fetchAllLeads('/v1/leads'),
    fetchAllLeads('/v1/leads/archived'),
  ])

  const map = new Map()
  for (const lead of [...active, ...archived]) {
    const orgId = lead.organization_id == null ? '' : String(lead.organization_id)
    if (!orgId) continue
    const names = (lead.label_ids ?? []).map(id => labelById[id]).filter(Boolean)
    const quality = classifyLeadLabels(names)
    if (!quality) continue
    const prev = map.get(orgId)
    if (!prev || (lead.add_time || '') > prev.addTime) {
      map.set(orgId, { quality, addTime: lead.add_time || '' })
    }
  }

  return new Map([...map.entries()].map(([orgId, row]) => [orgId, row.quality]))
}

let cachedMap = null
let cachedAt = 0
let inflight = null
const CACHE_MS = 10 * 60 * 1000

export async function getCachedOrgLeadQualityMap() {
  if (!isPipedriveConfigured()) return null
  if (cachedMap && Date.now() - cachedAt < CACHE_MS) return cachedMap
  if (inflight) return inflight
  inflight = fetchOrgLeadQualityMap()
    .then(map => {
      cachedMap = map
      cachedAt = Date.now()
      return map
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}
