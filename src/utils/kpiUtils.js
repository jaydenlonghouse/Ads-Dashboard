/**
 * utils/kpiUtils.js
 *
 * Pure functions for KPI math.  Every division is guarded against zero.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function coalesceNumber(value) {
  if (value == null) return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Sum a numeric field across all records. */
export const sum = (records, field) =>
  records.reduce((acc, r) => acc + coalesceNumber(r[field]), 0)

/**
 * Safe division — returns null (not 0) when denominator is zero so the UI
 * can display "—" instead of "$0", which would be misleading.
 */
export const safeDivide = (numerator, denominator) =>
  denominator === 0 ? null : numerator / denominator

// ---------------------------------------------------------------------------
// Core metric calculations
// ---------------------------------------------------------------------------

export function calcSpend(records) {
  return sum(records, 'spend')
}

/** Normalize stored CTR (fraction or percent) to a percentage for display. */
export function normalizeCtrStored(value) {
  if (value == null || !Number.isFinite(Number(value))) return null
  const n = Number(value)
  // Airtable / sheets often store fractional CTR (0.052); UI expects percentage (5.2).
  return n > 0 && n <= 1 ? n * 100 : n
}

/**
 * CTR from stored per-row values when present; otherwise clicks/impressions
 * when blending all platforms on the "All" tab.
 */
export function calcCTR(records, options = {}) {
  const stored = records
    .map(r => normalizeCtrStored(r.ctr))
    .filter(v => v != null && Number.isFinite(v))
  const value = stored.length ? stored.reduce((a, b) => a + b, 0) / stored.length : null
  if (value != null) return value
  if (options.ctrAllPlatformsBlend && records.length > 0) {
    const clicks = sum(records, 'clicks')
    const impressions = sum(records, 'impressions')
    return safeDivide(clicks * 100, impressions)
  }
  return null
}

export function calcClicks(records) {
  return sum(records, 'clicks')
}

export function calcConversions(records) {
  return sum(records, 'conversions')
}

/** CVR = (conversions / clicks) × 100 */
export function calcConversionRate(records) {
  return safeDivide(sum(records, 'conversions') * 100, sum(records, 'clicks'))
}

/** CPL = spend / conversions */
export function calcCPL(records) {
  return safeDivide(sum(records, 'spend'), sum(records, 'conversions'))
}

/** CPD = spend / deals */
export function calcCPD(records) {
  return safeDivide(sum(records, 'spend'), sum(records, 'deals'))
}

/** CPW = spend / closed deals (wins) */
export function calcCPW(records) {
  return safeDivide(sum(records, 'spend'), sum(records, 'wins'))
}

// ---------------------------------------------------------------------------
// calcAllKPIs — convenience wrapper returning all metrics at once
// ---------------------------------------------------------------------------
export function calcAllKPIs(records, options = {}) {
  return {
    spend:           calcSpend(records),
    ctr:             calcCTR(records, options),
    clicks:          calcClicks(records),
    conversions:     calcConversions(records),
    conversionRate:  calcConversionRate(records),
    cpl:             calcCPL(records),
    cpd:             calcCPD(records),
    cpw:             calcCPW(records),
    deals:           sum(records, 'deals'),
  }
}

// ---------------------------------------------------------------------------
// Delta % between current and previous periods
//
// Returns { value: number|null, direction: 'up'|'down'|'flat' }
// ---------------------------------------------------------------------------
export function calcDelta(current, previous) {
  if (current === null || previous === null || previous === 0) {
    return { value: null, direction: 'flat' }
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100
  return {
    value:     pct,
    direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat',
  }
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

export function formatCurrency(value) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(decimals)}%`
}

export function formatDelta(delta) {
  if (!delta || delta.value === null) return '—'
  const sign = delta.value >= 0 ? '+' : ''
  return `${sign}${delta.value.toFixed(1)}%`
}
