/**
 * App.jsx
 *
 * Root component.  Owns user-controlled state:
 *   - dateRange    { start: Date, end: Date }
 *   - platformTab  'All' | 'Google' | 'Meta'
 *   - chartMetricKeys  KPI keys shown on the trend chart (may be empty)
 */

import { useState, useCallback, useMemo } from 'react'
import { AlertCircle, Mail } from 'lucide-react'

import { useDashboardData } from './hooks/useDashboardData.js'
import { useMediaQuery } from './hooks/useMediaQuery.js'
import {
  formatDateRange,
  DEFAULT_DATE_PRESET_ID,
  getDateRangeForPreset,
  getDateRangeForCalendarMonth,
  clampDateRangeToDataEarliest,
} from './utils/dateUtils.js'
import { buildAdvertisingQuestionGmailUrl } from './utils/advertisingQuestionEmail.js'
import { KPI_DEFS, DEFAULT_CHART_METRIC_KEYS } from './config/kpiConfig.js'
import { useMockData } from './config/env.js'
import { useAuth } from './contexts/AuthContext.jsx'

import DateRangePicker from './components/DateRangePicker.jsx'
import PlatformFilter from './components/PlatformFilter.jsx'
import KpiCard from './components/KpiCard.jsx'
import KpiMetricMobileSheet from './components/KpiMetricMobileSheet.jsx'
import TrendChart from './components/TrendChart.jsx'
import DealsTable from './components/DealsTable.jsx'
import longhouseAdvertisingLogo from './assets/longhouse-advertising-logo.svg'

export default function App() {
  const { signOut, session } = useAuth()
  const now = new Date()
  const [datePresetId, setDatePresetId] = useState(DEFAULT_DATE_PRESET_ID)
  const [dateRange, setDateRange] = useState(() => getDateRangeForPreset(DEFAULT_DATE_PRESET_ID))
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth() + 1)
  const [calendarYear, setCalendarYear] = useState(now.getFullYear())
  const [platformTab, setPlatformTab] = useState('All')
  const [chartMetricKeys, setChartMetricKeys] = useState(() => [...DEFAULT_CHART_METRIC_KEYS])
  const [metricSheet, setMetricSheet] = useState(null)

  const isMobile = useMediaQuery('(max-width: 767px)')

  const toggleChartMetric = useCallback(key => {
    setChartMetricKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    )
  }, [])

  const addChartMetric = useCallback(key => {
    setChartMetricKeys(prev => (prev.includes(key) ? prev : [...prev, key]))
  }, [])

  const removeChartMetric = useCallback(key => {
    setChartMetricKeys(prev => prev.filter(k => k !== key))
  }, [])

  function handleDatePresetChange(id) {
    setDatePresetId(id)
    if (id === 'custom') return
    if (id === 'selectMonth') {
      const n = new Date()
      const m = n.getMonth() + 1
      const y = n.getFullYear()
      setCalendarMonth(m)
      setCalendarYear(y)
      setDateRange(getDateRangeForCalendarMonth(y, m))
      return
    }
    setDateRange(getDateRangeForPreset(id))
  }

  function handleCalendarMonthYearChange(month, year) {
    setCalendarMonth(month)
    setCalendarYear(year)
    setDateRange(getDateRangeForCalendarMonth(year, month))
  }

  const {
    isLoading,
    isError,
    error,
    currentPeriodTotals,
    previousPeriodTotals,
    deltas,
    monthlyTrendData,
    periodDeals,
    prevStart,
    prevEnd,
  } = useDashboardData({
    dateRange,
    platformFilter: platformTab === 'All' ? ['All'] : [platformTab],
  })

  const useMock = useMockData

  const chartKeysOrdered = KPI_DEFS.map(d => d.key).filter(k => chartMetricKeys.includes(k))
  const platformLabel = platformTab === 'All' ? 'All Platforms' : `${platformTab} Ads`

  const askQuestionGmailUrl = useMemo(() => {
    if (isLoading || isError || !prevStart || !prevEnd || !currentPeriodTotals || !previousPeriodTotals) {
      return ''
    }
    return buildAdvertisingQuestionGmailUrl({
      platformLabel,
      currentPeriodLabel: formatDateRange(dateRange.start, dateRange.end),
      previousPeriodLabel: formatDateRange(prevStart, prevEnd),
      currentPeriodTotals,
      previousPeriodTotals,
      deltas,
    })
  }, [
    isLoading,
    isError,
    prevStart,
    prevEnd,
    dateRange.start,
    dateRange.end,
    currentPeriodTotals,
    previousPeriodTotals,
    deltas,
    platformLabel,
  ])

  const askQuestionDisabled = !askQuestionGmailUrl

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="sticky top-0 z-[100] border-b border-brand-950/40 bg-brand-800 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 shrink-0">
            <img
              src={longhouseAdvertisingLogo}
              alt="Longhouse Advertising"
              className="h-9 w-auto max-w-full object-left object-contain sm:h-10 md:max-w-[min(100%,28rem)]"
              width={1920}
              height={374}
              decoding="async"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center justify-end">
            {!useMock && session?.user?.email ? (
              <div className="flex items-center gap-2 text-xs text-white/80">
                <span className="hidden sm:inline max-w-[12rem] truncate">
                  {session.user.email}
                </span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs font-normal text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
                >
                  Sign out
                </button>
              </div>
            ) : null}
            <a
              href={askQuestionDisabled ? undefined : askQuestionGmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={askQuestionDisabled}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-normal leading-[1.2] shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800 ${
                askQuestionDisabled
                  ? 'pointer-events-none cursor-not-allowed border-white/10 bg-white/10 text-white/45'
                  : 'border-brand-200 bg-brand-100 text-brand-900 hover:border-brand-300 hover:bg-brand-200'
              }`}
              onClick={askQuestionDisabled ? e => e.preventDefault() : undefined}
            >
              <Mail size={16} className="shrink-0" aria-hidden />
              Ask A Question
            </a>
            <DateRangePicker
              presetId={datePresetId}
              dateRange={dateRange}
              calendarMonth={calendarMonth}
              calendarYear={calendarYear}
              onPresetChange={handleDatePresetChange}
              onRangeChange={r => setDateRange(clampDateRangeToDataEarliest(r))}
              onCalendarMonthYearChange={handleCalendarMonthYearChange}
            />
          </div>
        </div>
      </header>

      <main className="relative z-0 max-w-7xl mx-auto space-y-6 px-6 py-6">
        {useMock && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-2.5 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>
              Running with <strong>mock data</strong> (<code className="bg-amber-100 px-1 rounded">VITE_USE_MOCK=true</code>).
              Configure Supabase and server Airtable env, then run <code className="bg-amber-100 px-1 rounded">vercel dev</code> for
              full auth + live data.
            </span>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error?.message ?? 'Failed to load data from Airtable.'}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <PlatformFilter selected={platformTab} onChange={setPlatformTab} />
          {!isLoading && (
            <p className="ml-auto max-w-full text-right text-xs leading-[1.45] text-ink-500 sm:max-w-[min(100%,22rem)] sm:shrink-0">
              {formatDateRange(dateRange.start, dateRange.end)} vs. Comparison Period
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {KPI_DEFS.map(d => (
              <div key={d.key} className="bg-white rounded-xl border border-brand-100 p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {KPI_DEFS.map(d => (
              <KpiCard
                key={d.key}
                isMobile={isMobile}
                label={d.label}
                tooltip={d.tooltip}
                value={d.format(currentPeriodTotals[d.key])}
                valueSuffix={
                  d.key === 'cpd'
                    ? `(${Number(currentPeriodTotals.deals ?? 0).toLocaleString('en-US')})`
                    : undefined
                }
                delta={deltas[d.key]}
                lowerIsBetter={d.lowerIsBetter}
                chartSelected={chartMetricKeys.includes(d.key)}
                onCardActivate={() => {
                  if (isMobile) {
                    setMetricSheet({ key: d.key, label: d.label, tooltip: d.tooltip })
                  } else {
                    toggleChartMetric(d.key)
                  }
                }}
                onOpenMetricSheet={
                  isMobile
                    ? () => setMetricSheet({ key: d.key, label: d.label, tooltip: d.tooltip })
                    : undefined
                }
              />
            ))}
          </div>
        )}

        <KpiMetricMobileSheet
          open={Boolean(metricSheet)}
          metricLabel={metricSheet?.label ?? ''}
          tooltip={metricSheet?.tooltip ?? ''}
          isOnChart={metricSheet ? chartMetricKeys.includes(metricSheet.key) : false}
          onClose={() => setMetricSheet(null)}
          onAddToChart={() => {
            if (metricSheet) addChartMetric(metricSheet.key)
          }}
          onRemoveFromChart={() => {
            if (metricSheet) removeChartMetric(metricSheet.key)
          }}
        />

        <section className="bg-white rounded-xl border border-brand-100 p-5">
          <h2 className="text-base font-semibold text-brand-800 leading-[1.2] mb-1">
            Metric trend (selected range).
          </h2>
          <p className="text-xs text-ink-400 mb-4 leading-[1.45] md:hidden">
            The chart splits your current date filter into daily segments (or fewer wide segments for
            long ranges). Tap a KPI card for a short definition, then add it to the chart.
          </p>
          <p className="text-xs text-ink-400 mb-4 leading-[1.45] hidden md:block">
            The chart splits your current date filter into daily segments (or fewer wide segments for
            long ranges). Click KPI cards to add or remove lines from the chart.
          </p>
          {isLoading ? (
            <div className="h-64 animate-pulse bg-brand-50 rounded-lg" />
          ) : (
            <TrendChart data={monthlyTrendData} selectedMetricKeys={chartKeysOrdered} />
          )}
        </section>

        <DealsTable deals={periodDeals} isLoading={isLoading} />
      </main>
    </div>
  )
}
