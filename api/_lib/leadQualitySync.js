/**
 * Overlay Pipedrive lead quality onto Airtable rows and persist when empty.
 */

import { preferLeadQuality } from '../../src/utils/leadQualityUtils.js'
import { updateRecordFieldValues } from './airtable.js'
import { getCachedLeadQualityMaps, isPipedriveConfigured } from './pipedrive.js'

const QUALITY_FIELD = () =>
  (process.env.AIRTABLE_LEAD_QUALITY_FIELD_NAME || 'Lead Quality').trim() || 'Lead Quality'

const MAX_PERSIST = 200

function qualityForRecord(record, maps) {
  const dealId = record.dealId ? String(record.dealId) : ''
  if (dealId && maps.byDeal.has(dealId)) return maps.byDeal.get(dealId)
  const orgId = record.orgId ? String(record.orgId) : ''
  if (orgId && maps.byOrg.has(orgId)) return maps.byOrg.get(orgId)
  return null
}

/**
 * @param {Array<{ id: string, orgId?: string|null, dealId?: string|null, leadQuality?: string|null }>} records
 * @param {string} tableName
 */
export async function applyAndPersistLeadQuality(records, tableName) {
  if (!records.length || !isPipedriveConfigured()) return records
  if (records.every(r => r.leadQuality)) return records

  let maps
  try {
    maps = await getCachedLeadQualityMaps()
  } catch {
    return records
  }
  if (!maps) return records

  const persist = []
  const next = records.map(record => {
    if (record.leadQuality) return record
    const quality = qualityForRecord(record, maps)
    if (!quality) return record
    persist.push({ id: record.id, value: quality })
    return { ...record, leadQuality: quality }
  })

  if (persist.length && tableName) {
    try {
      await updateRecordFieldValues(tableName, persist.slice(0, MAX_PERSIST), QUALITY_FIELD())
    } catch {
      // Read-only PAT or missing field: dashboard still shows the overlay.
    }
  }

  return next
}

/** Copy each lead session's quality onto its linked Airtable deal records. */
export async function persistQualityOntoLinkedDeals(sessions) {
  const tableName = (process.env.AIRTABLE_DEALS_TABLE_NAME ?? '').trim()
  if (!tableName || !sessions.length) return

  const byDeal = new Map()
  for (const session of sessions) {
    if (!session.leadQuality) continue
    for (const id of session.linkedDealIds ?? []) {
      if (!id) continue
      byDeal.set(id, preferLeadQuality(byDeal.get(id), session.leadQuality))
    }
  }

  const records = [...byDeal.entries()]
    .filter(([, value]) => value)
    .map(([id, value]) => ({ id, value }))
  if (!records.length) return

  try {
    await updateRecordFieldValues(tableName, records.slice(0, MAX_PERSIST), QUALITY_FIELD())
  } catch {
    // Read-only PAT or missing field: dashboard still inherits quality in the UI.
  }
}
