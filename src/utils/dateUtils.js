/**
 * utils/dateUtils.js
 *
 * All date math lives here.  Uses date-fns for safety and clarity.
 */

import {
  parseISO,
  isWithinInterval,
  subDays,
  format,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  startOfYear,
  isValid,
  isBefore,
  isAfter,
  differenceInCalendarDays,
  eachDayOfInterval,
  subMilliseconds,
} from 'date-fns'

// ---------------------------------------------------------------------------
// Reporting data availability (do not filter ranges before this day)
// ---------------------------------------------------------------------------

import { DATA_EARLIEST_DATE } from '../config/env.js'

export { DATA_EARLIEST_DATE }

/** Last calendar day we allow in the UI (yesterday; today has no complete data). */
export function getDataLatestDay(refDate = new Date()) {
  return startOfDay(subDays(refDate, 1))
}

/**
 * Clamp a range to reportable data: not before {@link DATA_EARLIEST_DATE},
 * not after yesterday (relative to `refDate`).
 */
export function clampDateRangeToDataEarliest({ start, end }, refDate = new Date()) {
  const minD = DATA_EARLIEST_DATE
  const latestD = getDataLatestDay(refDate)
  const maxE = endOfDay(latestD)

  let s = startOfDay(start)
  let e = endOfDay(end)

  if (isBefore(latestD, minD)) {
    return { start: minD, end: endOfDay(minD) }
  }
  if (isBefore(e, minD)) {
    return { start: minD, end: endOfDay(minD) }
  }
  if (isAfter(s, latestD)) {
    return { start: latestD, end: maxE }
  }

  if (isAfter(e, maxE)) e = maxE
  if (isBefore(s, minD)) s = minD
  if (isBefore(e, s)) e = endOfDay(s)
  if (isAfter(e, maxE)) e = maxE
  return { start: s, end: e }
}

// ---------------------------------------------------------------------------
// Preset date ranges (dropdown in header)
// Rolling "Last N days" windows end yesterday (today excluded); spans N calendar days.
// ---------------------------------------------------------------------------

export const DATE_PRESET_OPTIONS = [
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 Days', subLabel: 'Up To Yesterday' },
  { id: 'last14', label: 'Last 14 Days', subLabel: 'Up To Yesterday' },
  { id: 'last30', label: 'Last 30 Days', subLabel: 'Up To Yesterday' },
  { id: 'last60', label: 'Last 60 Days', subLabel: 'Up To Yesterday' },
  { id: 'last90', label: 'Last 90 Days', subLabel: 'Up To Yesterday' },
  { id: 'ytd', label: 'Year To Date', subLabel: 'Up To Yesterday' },
  { id: 'selectMonth', label: 'Select month' },
]

/** Month picker values 1–12 with labels for the Select month preset UI */
export const CALENDAR_MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

/** Full calendar month [start, end] for KPI filtering (clamped to data window). */
export function getDateRangeForCalendarMonth(year, month1to12, refDate = new Date()) {
  const d = new Date(year, month1to12 - 1, 1)
  const start = startOfMonth(d)
  const end = endOfMonth(d)
  return clampDateRangeToDataEarliest({ start, end }, refDate)
}

/** Years for month picker: from data floor year through the year of “yesterday”. */
export function getCalendarYearOptions(refDate = new Date()) {
  const minY = DATA_EARLIEST_DATE.getFullYear()
  const maxY = getDataLatestDay(refDate).getFullYear()
  const years = []
  for (let y = minY; y <= maxY; y++) years.push(y)
  return years
}

/** True when the entire calendar month ends before we have any data. */
export function isCalendarMonthFullyBeforeData(year, month1to12) {
  return isBefore(endOfMonth(new Date(year, month1to12 - 1, 1)), DATA_EARLIEST_DATE)
}

/** First 1–12 month in `year` that has at least one day on/after {@link DATA_EARLIEST_DATE}. */
export function firstValidCalendarMonthInYear(year) {
  for (let m = 1; m <= 12; m++) {
    if (!isCalendarMonthFullyBeforeData(year, m)) return m
  }
  return DATA_EARLIEST_DATE.getMonth() + 1
}

/** Last 1–12 month in `year` that has at least one day on/before “yesterday”. */
export function lastValidCalendarMonthInYear(year, refDate = new Date()) {
  const latest = getDataLatestDay(refDate)
  const yLatest = latest.getFullYear()
  if (year < yLatest) return 12
  if (year > yLatest) return 12
  return latest.getMonth() + 1
}

/** True when the whole calendar month starts after “yesterday”. */
export function isCalendarMonthFullyAfterLatest(year, month1to12, refDate = new Date()) {
  const latest = getDataLatestDay(refDate)
  return isAfter(startOfMonth(new Date(year, month1to12 - 1, 1)), latest)
}

/** Clamp a chosen month index to months that overlap the reportable window in `year`. */
export function clampCalendarMonthForYear(year, month1to12, refDate = new Date()) {
  const lo = firstValidCalendarMonthInYear(year)
  const hi = lastValidCalendarMonthInYear(year, refDate)
  return Math.min(Math.max(month1to12, lo), hi)
}

/** Default range when the app loads — Last 90 Days */
export const DEFAULT_DATE_PRESET_ID = 'last90'

export function getDateRangeForPreset(presetId, refDate = new Date()) {
  const now = refDate
  const yesterday = subDays(now, 1)
  let range
  switch (presetId) {
    case 'yesterday': {
      const d = yesterday
      range = { start: startOfDay(d), end: endOfDay(d) }
      break
    }
    case 'last7':
      range = { start: startOfDay(subDays(yesterday, 6)), end: endOfDay(yesterday) }
      break
    case 'last14':
      range = { start: startOfDay(subDays(yesterday, 13)), end: endOfDay(yesterday) }
      break
    case 'last30':
      range = { start: startOfDay(subDays(yesterday, 29)), end: endOfDay(yesterday) }
      break
    case 'last60':
      range = { start: startOfDay(subDays(yesterday, 59)), end: endOfDay(yesterday) }
      break
    case 'last90':
      range = { start: startOfDay(subDays(yesterday, 89)), end: endOfDay(yesterday) }
      break
    case 'ytd':
      range = { start: startOfDay(startOfYear(yesterday)), end: endOfDay(yesterday) }
      break
    default:
      range = { start: startOfDay(subDays(yesterday, 29)), end: endOfDay(yesterday) }
  }
  return clampDateRangeToDataEarliest(range, now)
}

// ---------------------------------------------------------------------------
// getPreviousPeriod
//
// Given a current period [start, end], return a previous period of equal
// length that immediately precedes it.
// ---------------------------------------------------------------------------
export function getPreviousPeriod(currentStart, currentEnd) {
  const lengthDays = Math.round(
    (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)
  )
  const prevEnd   = subDays(currentStart, 1)
  const prevStart = subDays(prevEnd, lengthDays - 1)
  return { prevStart, prevEnd }
}

/** Default max points on the trend chart (x-axis) before switching to equal-time slices. */
export const TREND_CHART_MAX_BUCKETS = 24

/**
 * Partitions the selected date range into buckets for the trend chart only.
 * Buckets lie inside `[start, end]` (oldest → newest).
 *
 * - Short ranges (≤ {@link TREND_CHART_MAX_BUCKETS} calendar days): one bucket per calendar day
 *   (clipped to the actual `start` / `end` timestamps).
 * - Longer ranges: {@link TREND_CHART_MAX_BUCKETS} equal-duration slices from `start` to `end`.
 */
export function getTrendBucketsWithinSelectedRange(
  range,
  { maxBuckets = TREND_CHART_MAX_BUCKETS } = {},
) {
  const { start, end } = range
  if (!start || !end || isBefore(end, start)) {
    return [{ start, end }]
  }

  const dayStart = startOfDay(start)
  const dayEnd = startOfDay(end)
  const daySpan = differenceInCalendarDays(dayEnd, dayStart) + 1

  if (daySpan <= maxBuckets) {
    const days = eachDayOfInterval({ start: dayStart, end: dayEnd })
    return days.map(d => {
      const dayLo = startOfDay(d)
      const dayHi = endOfDay(d)
      return {
        start: isAfter(start, dayLo) ? start : dayLo,
        end: isBefore(end, dayHi) ? end : dayHi,
      }
    })
  }

  const t0 = start.getTime()
  const t1 = end.getTime()
  const len = t1 - t0 || 1
  const n = maxBuckets
  const boundaries = Array.from({ length: n + 1 }, (_, k) => new Date(t0 + (k * len) / n))
  boundaries[n] = end

  const out = []
  for (let i = 0; i < n; i++) {
    const ws = boundaries[i]
    const we = i === n - 1 ? end : subMilliseconds(boundaries[i + 1], 1)
    out.push({ start: ws, end: we })
  }
  return out
}

// ---------------------------------------------------------------------------
// filterByDateRange
// ---------------------------------------------------------------------------
export function filterByDateRange(records, start, end) {
  return records.filter(r => {
    if (!r.date) return false
    const d = parseISO(r.date)
    return isValid(d) && isWithinInterval(d, { start, end })
  })
}

// ---------------------------------------------------------------------------
// Platform tab helpers — Airtable "Platform" may use product names (Google Ads,
// Meta Ads) or legacy labels (Google, Facebook).
// ---------------------------------------------------------------------------
function normalizePlatformLabel(s) {
  return (s ?? '').trim().toLowerCase()
}

export function isGoogleAdsPlatform(platform) {
  const n = normalizePlatformLabel(platform)
  if (!n) return false
  return n === 'google' || n === 'google ads' || n.startsWith('google ')
}

export function isMetaAdsPlatform(platform) {
  const n = normalizePlatformLabel(platform)
  if (!n) return false
  return (
    n === 'meta' ||
    n === 'meta ads' ||
    n.startsWith('meta ') ||
    n === 'facebook' ||
    n === 'facebook ads' ||
    n.startsWith('facebook ') ||
    n === 'instagram' ||
    n === 'instagram ads' ||
    n.startsWith('instagram ')
  )
}

// ---------------------------------------------------------------------------
// filterByPlatform
//
// Tab mode: ['Google'] → Google Ads rows; ['Meta'] → Meta Ads rows.
// [] or ['All'] → all records (legacy).
// Otherwise exact lowercase match on platform string.
// ---------------------------------------------------------------------------
export function filterByPlatform(records, platforms) {
  if (!platforms || platforms.length === 0 || platforms.includes('All')) {
    return records
  }
  if (platforms.includes('Google') && !platforms.includes('Meta')) {
    return records.filter(r => isGoogleAdsPlatform(r.platform))
  }
  if (platforms.includes('Meta') && !platforms.includes('Google')) {
    return records.filter(r => isMetaAdsPlatform(r.platform))
  }
  const set = new Set(platforms.map(p => p.toLowerCase()))
  return records.filter(r => set.has((r.platform ?? '').toLowerCase()))
}

// ---------------------------------------------------------------------------
// groupByMonth
//
// Returns an array of { monthKey, label, spend, conversions } sorted
// chronologically, suitable for Recharts.
// monthKey format: "2024-10"
// label format:    "Oct 24"
// ---------------------------------------------------------------------------
export function groupByMonth(records) {
  const map = new Map()

  for (const r of records) {
    if (!r.date) continue
    const d = parseISO(r.date)
    if (!isValid(d)) continue

    const key = format(startOfMonth(d), 'yyyy-MM')
    if (!map.has(key)) {
      map.set(key, { monthKey: key, label: format(d, 'MMM yy'), spend: 0, conversions: 0 })
    }
    const entry = map.get(key)
    entry.spend       += r.spend
    entry.conversions += r.conversions
  }

  return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

// ---------------------------------------------------------------------------
// formatDateRange — human-readable label for the period header
// ---------------------------------------------------------------------------
export function formatDateRange(start, end) {
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`
}

/**
 * Trend chart x-axis: single calendar day, no year (e.g. "May 12").
 * Uses the bucket end so the last point aligns with the filter’s last day.
 */
export function formatTrendBucketAxisLabel(_bucketStart, bucketEnd) {
  return format(bucketEnd, 'MMM d')
}
