/**
 * hooks/useDashboardData.js
 *
 * The single source of truth for all dashboard data.
 *
 * Input:  dateRange      { start: Date, end: Date }
 *         platformFilter string[]  — ['Google'] / ['Meta'] tab filters (Google Ads vs Meta Ads rows), or ['All'] for no filter
 *
 * Output: {
 *   isLoading, isError, error,
 *   currentPeriodTotals,   // full KPI object from calcAllKPIs
 *   previousPeriodTotals,  // same shape as currentPeriodTotals
 *   deltas,                // each KPI key → { value, direction }
 *   monthlyTrendData,      // buckets inside selected range: [{ label, spend, ctr, … }] oldest→newest
 *   filteredRows,          // raw rows for the current period (data grid)
 *   periodDeals,           // linked Deals rows for the current period
 *   availablePlatforms,    // string[] derived from the dataset
 * }
 *
 * Strategy (SOW §5 — Frontend Aggregation):
 *   Fetch the full dataset ONCE via React Query (staleTime = 5 min).
 *   All filtering/grouping/aggregation happens in JS — zero extra API calls
 *   when the user toggles platforms or date ranges.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllRecords, fetchAllDeals } from '../lib/apiClient.js'
import { MOCK_RECORDS, MOCK_DEALS } from '../utils/mockData.js'
import { getDealsForMetricRows } from '../utils/dealsUtils.js'
import {
  filterByDateRange,
  filterByPlatform,
  getPreviousPeriod,
  getTrendBucketsWithinSelectedRange,
  formatDateRange,
  formatTrendBucketAxisLabel,
} from '../utils/dateUtils.js'
import { calcAllKPIs, calcDelta } from '../utils/kpiUtils.js'
import { useMockData as USE_MOCK } from '../config/env.js'
import { useAuth } from '../contexts/AuthContext.jsx'

async function loadRecords(accessToken) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return MOCK_RECORDS
  }
  return fetchAllRecords(accessToken)
}

async function loadDeals(accessToken) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return MOCK_DEALS
  }
  return fetchAllDeals(accessToken)
}

export function useDashboardData({ dateRange, platformFilter }) {
  const { accessToken } = useAuth()
  const dataEnabled = USE_MOCK || Boolean(accessToken)

  // ── 1. Fetch full dataset (cached for 5 min) ─────────────────────────────
  const {
    data: allRecords = [],
    isLoading: metricsLoading,
    isError: metricsError,
    error: metricsErrorObj,
  } = useQuery({
    queryKey:  ['airtable-records', accessToken],
    queryFn:   () => loadRecords(accessToken),
    enabled:   dataEnabled,
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: allDeals = [],
    isLoading: dealsLoading,
    isError: dealsError,
    error: dealsErrorObj,
  } = useQuery({
    queryKey:  ['airtable-deals', accessToken],
    queryFn:   () => loadDeals(accessToken),
    enabled:   dataEnabled,
    staleTime: 5 * 60 * 1000,
  })

  const isLoading = !dataEnabled || metricsLoading || dealsLoading
  const isError = metricsError || dealsError
  const error = metricsErrorObj ?? dealsErrorObj

  // ── 2. Derive available platforms from the live dataset ───────────────────
  const availablePlatforms = [...new Set(allRecords.map(r => r.platform))].sort()

  // ── 3. Current period rows ────────────────────────────────────────────────
  const { start, end } = dateRange
  const currentRows = filterByPlatform(
    filterByDateRange(allRecords, start, end),
    platformFilter,
  )

  // ── 4. Previous period rows (auto-calculated equal-length window) ─────────
  const { prevStart, prevEnd } = getPreviousPeriod(start, end)
  const previousRows = filterByPlatform(
    filterByDateRange(allRecords, prevStart, prevEnd),
    platformFilter,
  )

  // ── 5. KPI aggregation ────────────────────────────────────────────────────
  const kpiOpts =
    platformFilter.includes('All') ? { ctrAllPlatformsBlend: true } : {}

  const currentPeriodTotals  = calcAllKPIs(currentRows, kpiOpts)
  const previousPeriodTotals = calcAllKPIs(previousRows, kpiOpts)

  // ── 6. Δ% for each metric ─────────────────────────────────────────────────
  const deltas = Object.fromEntries(
    Object.keys(currentPeriodTotals).map(key => [
      key,
      calcDelta(currentPeriodTotals[key], previousPeriodTotals[key]),
    ])
  )

  // ── 7. Trend chart — sub-ranges inside the selected date range only, oldest → newest
  const periodDeals = useMemo(
    () => getDealsForMetricRows(currentRows, allDeals),
    [currentRows, allDeals],
  )

  const monthlyTrendData = getTrendBucketsWithinSelectedRange({ start, end }).map(
    ({ start: ws, end: we }) => {
      const rows = filterByPlatform(
        filterByDateRange(allRecords, ws, we),
        platformFilter,
      )
      const kpis = calcAllKPIs(rows, kpiOpts)
      return {
        label: formatTrendBucketAxisLabel(ws, we),
        labelDetail: formatDateRange(ws, we),
        ...kpis,
      }
    },
  )

  return {
    isLoading,
    isError,
    error,
    currentPeriodTotals,
    previousPeriodTotals,
    deltas,
    monthlyTrendData,
    filteredRows:       currentRows,
    periodDeals,
    availablePlatforms,
    prevStart,
    prevEnd,
  }
}
