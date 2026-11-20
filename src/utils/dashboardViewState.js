/**
 * Persist the current dashboard view in the URL so a refresh keeps tab and filters.
 */

import { DEFAULT_CHART_METRIC_KEYS, KPI_DEFS } from '../config/kpiConfig.js'
import { applyDateDefault, snapshotDateDefault } from './dateDefaultPreference.js'

export const DEPARTMENTS = /** @type {const} */ (['ads', 'seo', 'all'])
export const PLATFORMS = /** @type {const} */ (['All', 'Google', 'Meta'])
export const FUNNEL_TABS = /** @type {const} */ (['leads', 'deals', 'wins'])

const KPI_KEYS = new Set(KPI_DEFS.map(d => d.key))
const PLATFORM_BY_PARAM = {
  all: 'All',
  google: 'Google',
  meta: 'Meta',
}

/**
 * @param {string} [search]
 * @returns {{
 *   department: 'ads' | 'seo' | 'all' | null,
 *   platformTab: 'All' | 'Google' | 'Meta' | null,
 *   funnelTab: 'leads' | 'deals' | 'wins' | null,
 *   chartMetricKeys: string[] | null,
 *   dateSnap: object | null,
 * }}
 */
export function readDashboardViewFromSearch(search = typeof window === 'undefined' ? '' : window.location.search) {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  return {
    department: parseDepartment(params.get('dept')),
    platformTab: parsePlatform(params.get('platform')),
    funnelTab: parseFunnel(params.get('funnel')),
    chartMetricKeys: parseMetrics(params.get('metrics')),
    dateSnap: parseDateSnap(params),
  }
}

/**
 * @param {{
 *   department: 'ads' | 'seo' | 'all',
 *   platformTab: string,
 *   funnelTab: string,
 *   chartMetricKeys: string[],
 *   presetId: string,
 *   calendarMonth: number,
 *   calendarYear: number,
 *   dateRange: { start: Date, end: Date },
 * }} view
 */
export function writeDashboardViewToUrl(view) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams()

  if (view.department && view.department !== 'ads') params.set('dept', view.department)
  if (view.platformTab && view.platformTab !== 'All') {
    params.set('platform', String(view.platformTab).toLowerCase())
  }
  if (view.funnelTab && view.funnelTab !== 'leads') params.set('funnel', view.funnelTab)

  const snap = snapshotDateDefault({
    presetId: view.presetId,
    calendarMonth: view.calendarMonth,
    calendarYear: view.calendarYear,
    dateRange: view.dateRange,
  })
  if (snap?.presetId) {
    params.set('dates', snap.presetId)
    if (snap.presetId === 'custom') {
      if (snap.start) params.set('from', snap.start)
      if (snap.end) params.set('to', snap.end)
    }
    if (snap.presetId === 'selectMonth') {
      params.set('month', String(snap.calendarMonth))
      params.set('year', String(snap.calendarYear))
    }
  }

  const metrics = Array.isArray(view.chartMetricKeys) ? view.chartMetricKeys.filter(k => KPI_KEYS.has(k)) : []
  const ordered = KPI_DEFS.map(d => d.key).filter(k => metrics.includes(k))
  if (ordered.join(',') !== DEFAULT_CHART_METRIC_KEYS.join(',')) {
    params.set('metrics', ordered.length ? ordered.join(',') : 'none')
  }

  const qs = params.toString()
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next === current) return
  window.history.replaceState(window.history.state, '', next)
}

function parseDepartment(value) {
  const id = String(value ?? '').toLowerCase()
  return DEPARTMENTS.includes(/** @type {typeof DEPARTMENTS[number]} */ (id)) ? id : null
}

function parsePlatform(value) {
  if (!value) return null
  return PLATFORM_BY_PARAM[String(value).toLowerCase()] ?? null
}

function parseFunnel(value) {
  const id = String(value ?? '').toLowerCase()
  return FUNNEL_TABS.includes(/** @type {typeof FUNNEL_TABS[number]} */ (id)) ? id : null
}

function parseMetrics(raw) {
  if (raw == null) return null
  if (raw === '' || raw === 'none') return []
  const keys = String(raw)
    .split(',')
    .map(s => s.trim())
    .filter(k => KPI_KEYS.has(k))
  return KPI_DEFS.map(d => d.key).filter(k => keys.includes(k))
}

function parseDateSnap(params) {
  const presetId = params.get('dates')
  if (!presetId) return null
  if (presetId === 'custom') {
    return applyDateDefault({ presetId: 'custom', start: params.get('from'), end: params.get('to') })
      ? { presetId: 'custom', start: params.get('from'), end: params.get('to') }
      : null
  }
  if (presetId === 'selectMonth') {
    const snap = {
      presetId: 'selectMonth',
      calendarMonth: Number(params.get('month')),
      calendarYear: Number(params.get('year')),
    }
    return applyDateDefault(snap) ? snap : null
  }
  return applyDateDefault({ presetId }) ? { presetId } : null
}
