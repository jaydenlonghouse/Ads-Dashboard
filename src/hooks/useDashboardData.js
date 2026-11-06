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
 *   ads/seo funnel sessions, deals, wins, and comparison counts
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
import { fetchAllRecords, fetchAllDeals, fetchAllLeadSessions } from '../lib/apiClient.js'
import { MOCK_RECORDS, MOCK_DEALS, MOCK_LEAD_SESSIONS } from '../utils/mockData.js'
import {
  filterSessionsByDepartment,
  funnelCounts,
  getDealsForSessions,
  getWonDeals,
} from '../utils/leadSessionsUtils.js'
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

async function loadLeadSessions(accessToken) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return MOCK_LEAD_SESSIONS
  }
  return fetchAllLeadSessions(accessToken)
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

  const {
    data: allLeadSessions = [],
    isLoading: sessionsLoading,
    isError: sessionsError,
    error: sessionsErrorObj,
  } = useQuery({
    queryKey:  ['airtable-lead-sessions', accessToken],
    queryFn:   () => loadLeadSessions(accessToken),
    enabled:   dataEnabled,
    staleTime: 5 * 60 * 1000,
  })

  const isLoading = !dataEnabled || metricsLoading || dealsLoading || sessionsLoading
  const isError = metricsError || dealsError || sessionsError
  const error = metricsErrorObj ?? dealsErrorObj ?? sessionsErrorObj

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

  // ── 7. Lead sessions (Ads vs SEO) by session date ─────────────────────────
  const currentSessions = filterByDateRange(allLeadSessions, start, end)
  const previousSessions = filterByDateRange(allLeadSessions, prevStart, prevEnd)

  const adsCurrentSessions = filterSessionsByDepartment(currentSessions, 'ads')
  const seoCurrentSessions = filterSessionsByDepartment(currentSessions, 'seo')
  const adsPreviousSessions = filterSessionsByDepartment(previousSessions, 'ads')
  const seoPreviousSessions = filterSessionsByDepartment(previousSessions, 'seo')

  const adsFunnel = funnelCounts(adsCurrentSessions, allDeals)
  const seoFunnel = funnelCounts(seoCurrentSessions, allDeals)
  const adsFunnelPrev = funnelCounts(adsPreviousSessions, allDeals)
  const seoFunnelPrev = funnelCounts(seoPreviousSessions, allDeals)

  const adsFunnelDeltas = Object.fromEntries(
    Object.keys(adsFunnel).map(key => [key, calcDelta(adsFunnel[key], adsFunnelPrev[key])]),
  )
  const seoFunnelDeltas = Object.fromEntries(
    Object.keys(seoFunnel).map(key => [key, calcDelta(seoFunnel[key], seoFunnelPrev[key])]),
  )

  const adsPeriodDeals = useMemo(
    () => getDealsForSessions(adsCurrentSessions, allDeals),
    [adsCurrentSessions, allDeals],
  )
  const seoPeriodDeals = useMemo(
    () => getDealsForSessions(seoCurrentSessions, allDeals),
    [seoCurrentSessions, allDeals],
  )
  const adsPeriodWins = useMemo(() => getWonDeals(adsPeriodDeals), [adsPeriodDeals])
  const seoPeriodWins = useMemo(() => getWonDeals(seoPeriodDeals), [seoPeriodDeals])

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
    adsCurrentSessions,
    seoCurrentSessions,
    adsPeriodDeals,
    seoPeriodDeals,
    adsPeriodWins,
    seoPeriodWins,
    adsFunnel,
    seoFunnel,
    adsFunnelDeltas,
    seoFunnelDeltas,
    availablePlatforms,
    prevStart,
    prevEnd,
  }
}
