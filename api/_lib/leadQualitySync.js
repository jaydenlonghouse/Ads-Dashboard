/**
 * Overlay Pipedrive lead quality onto Airtable rows and persist when empty.
 */

import { updateRecordFieldValues } from './airtable.js'
import { getCachedOrgLeadQualityMap, isPipedriveConfigured } from './pipedrive.js'

const QUALITY_FIELD = () =>
  (process.env.AIRTABLE_LEAD_QUALITY_FIELD_NAME || 'Lead Quality').trim() || 'Lead Quality'

const MAX_PERSIST = 200

/**
 * @param {Array<{ id: string, orgId?: string|null, leadQuality?: string|null }>} records
 * @param {string} tableName
 */
export async function applyAndPersistLeadQuality(records, tableName) {
  if (!records.length || !isPipedriveConfigured()) return records
  if (records.every(r => r.leadQuality)) return records

  let map
  try {
    map = await getCachedOrgLeadQualityMap()
  } catch {
    return records
  }
  if (!map) return records

  const persist = []
  const next = records.map(record => {
    if (record.leadQuality) return record
    const orgId = record.orgId ? String(record.orgId) : ''
    const quality = orgId ? map.get(orgId) : null
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
