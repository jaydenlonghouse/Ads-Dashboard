/**
 * Server-side Airtable client (secrets from process.env only).
 */

const PAT = process.env.AIRTABLE_PAT
const BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE = process.env.AIRTABLE_TABLE_NAME
const DEALS_TABLE = process.env.AIRTABLE_DEALS_TABLE_NAME

function assertAirtableEnv() {
  const missing = []
  if (!PAT) missing.push('AIRTABLE_PAT')
  if (!BASE_ID) missing.push('AIRTABLE_BASE_ID')
  if (!TABLE) missing.push('AIRTABLE_TABLE_NAME')
  if (!DEALS_TABLE) missing.push('AIRTABLE_DEALS_TABLE_NAME')
  if (missing.length === 0) return
  const err = new Error(`Missing server env: ${missing.join(', ')}`)
  err.status = 500
  throw err
}

function tableUrl(tableName) {
  return `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`
}

async function fetchWithBackoff(url, options, attempt = 0) {
  const res = await fetch(url, options)

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') ?? '30', 10)
    const jitter = Math.random() * 1000
    const delay =
      attempt === 0
        ? retryAfter * 1000 + jitter
        : Math.min(2 ** attempt * 1000 + jitter, 60_000)

    await new Promise(r => setTimeout(r, delay))
    return fetchWithBackoff(url, options, attempt + 1)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(
      `Airtable ${res.status}: ${body?.error?.message ?? res.statusText}`,
    )
    err.status = res.status
    throw err
  }

  return res.json()
}

function parseAirtableNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const s = String(value).replace(/,/g, '').replace(/^\s*\$/, '').trim()
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : fallback
}

function parseAirtableCtrRaw(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const s = String(value).replace(/,/g, '').replace(/%/g, '').trim()
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

function pickLinkedDealIds(fields) {
  const raw = fields['Deals']
  if (!Array.isArray(raw)) return []
  return raw.filter(id => typeof id === 'string' && id.length > 0)
}

function pickDealsFromFields(fields) {
  const countCandidates = ['# of Deals', '# Of Deals', 'Number of Deals']
  for (const key of countCandidates) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      return parseAirtableNumber(fields[key])
    }
  }
  for (const name of Object.keys(fields)) {
    const t = name.trim().toLowerCase()
    if (t === '# of deals' || t === 'number of deals') {
      return parseAirtableNumber(fields[name])
    }
  }
  return 0
}

function pickWonDealsFromFields(fields) {
  const candidates = ['Won Deals', 'Closed Deals', 'Closed deals']
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      return parseAirtableNumber(fields[key])
    }
  }
  for (const name of Object.keys(fields)) {
    const t = name.trim().toLowerCase()
    if (t === 'won deals' || t === 'closed deals') {
      return parseAirtableNumber(fields[name])
    }
  }
  return 0
}

function pickCtrFromFields(fields) {
  const candidates = ['CTR', 'Ctr', 'ctr']
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      const v = parseAirtableCtrRaw(fields[key])
      if (v !== null) return v
    }
  }
  for (const name of Object.keys(fields)) {
    if (name.trim().toLowerCase() === 'ctr') {
      return parseAirtableCtrRaw(fields[name])
    }
  }
  return null
}

function normalise(record) {
  const f = record.fields ?? {}
  return {
    id: record.id,
    date: f['Date'] ?? null,
    platform: f['Platform'] ?? 'Unknown',
    spend: parseAirtableNumber(f['Spend']),
    clicks: parseAirtableNumber(f['Clicks']),
    impressions: parseAirtableNumber(f['Impressions']),
    ctr: pickCtrFromFields(f),
    conversions: parseAirtableNumber(f['Conversions']),
    deals: pickDealsFromFields(f),
    linkedDealIds: pickLinkedDealIds(f),
    wins: pickWonDealsFromFields(f),
  }
}

/** Coerce Airtable single-select, lookup, or text to a display string. */
function pickAirtableSelectValue(value) {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    const s = value.trim()
    return s || null
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = pickAirtableSelectValue(item)
      if (parsed) return parsed
    }
    return null
  }
  if (typeof value === 'object') {
    if (typeof value.name === 'string') {
      const s = value.name.trim()
      if (s) return s
    }
    if (typeof value.label === 'string') {
      const s = value.label.trim()
      if (s) return s
    }
  }
  const s = String(value).trim()
  return s || null
}

function pickDealDateFromFields(fields) {
  const candidates = ['Deal Created', 'Date', 'Created', 'Created Date']
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      const v = fields[key]
      if (v != null && String(v).trim() !== '') return v
    }
  }
  return null
}

function normaliseDeal(record) {
  const f = record.fields ?? {}
  return {
    id: record.id,
    date: pickDealDateFromFields(f),
    businessName: f['Business Name'] ?? '—',
    dealStage: pickAirtableSelectValue(f['Deal Stage']) ?? '—',
    dealStatus: pickAirtableSelectValue(f['Deal Status']) ?? '—',
    lostReason: pickLostReasonFromFields(f),
    label: pickLabelFromFields(f),
  }
}

function pickLabelFromFields(fields) {
  const candidates = ['Label', 'Labels', 'label', 'labels']
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      const parsed = formatLabelField(fields[key])
      if (parsed) return parsed
    }
  }
  for (const name of Object.keys(fields)) {
    const norm = name.trim().toLowerCase()
    if (norm === 'label' || norm === 'labels') {
      const parsed = formatLabelField(fields[name])
      if (parsed) return parsed
    }
  }
  return null
}

/** Single- or multi-select Label → display string. */
function formatLabelField(value) {
  if (value == null || value === '') return null
  if (Array.isArray(value)) {
    const parts = value
      .map(item => pickAirtableSelectValue(item))
      .filter(Boolean)
    return parts.length ? parts.join(', ') : null
  }
  return pickAirtableSelectValue(value)
}

function pickLostReasonFromFields(fields) {
  const candidates = [
    'Lost Reasons',
    'Lost Reason',
    'Lost reason',
    'lost reason',
    'lost reasons',
  ]
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      const parsed = pickAirtableSelectValue(fields[key])
      if (parsed) return parsed
    }
  }
  for (const name of Object.keys(fields)) {
    const norm = name.trim().toLowerCase()
    if (norm === 'lost reason' || norm === 'lost reasons') {
      const parsed = pickAirtableSelectValue(fields[name])
      if (parsed) return parsed
    }
  }
  return null
}

async function fetchAllFromTable(tableName, { sortField, mapRecord }) {
  assertAirtableEnv()
  const headers = {
    Authorization: `Bearer ${PAT}`,
    'Content-Type': 'application/json',
  }

  const records = []
  let offset

  do {
    const params = new URLSearchParams()
    if (sortField) {
      params.set('sort[0][field]', sortField)
      params.set('sort[0][direction]', 'asc')
    }
    if (offset) params.set('offset', offset)

    const qs = params.toString()
    const url = `${tableUrl(tableName)}${qs ? `?${qs}` : ''}`
    const data = await fetchWithBackoff(url, { headers })

    records.push(...(data.records ?? []).map(mapRecord))
    offset = data.offset
  } while (offset)

  return records
}

export async function fetchAllRecords() {
  return fetchAllFromTable(TABLE, { sortField: 'Date', mapRecord: normalise })
}

export async function fetchAllDeals() {
  return fetchAllFromTable(DEALS_TABLE, {
    sortField: 'Business Name',
    mapRecord: normaliseDeal,
  })
}
