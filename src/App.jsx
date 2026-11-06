/**
 * App.jsx
 *
 * Root component.  Owns user-controlled state:
 *   - dateRange    { start: Date, end: Date }
 *   - department   'ads' | 'seo'
 *   - platformTab  'All' | 'Google' | 'Meta' (Ads view)
 *   - chartMetricKeys  KPI keys shown on the trend chart (may be empty)
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
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
import {
  applyDateDefault,
  isDateDefaultMatch,
  persistDateDefault,
  readBootstrapDateDefault,
  readDateDefaultFromUser,
  snapshotDateDefault,
} from './utils/dateDefaultPreference.js'
import { useAuth } from './contexts/AuthContext.jsx'
import { buildAdvertisingQuestionGmailUrl } from './utils/advertisingQuestionEmail.js'
import { KPI_DEFS, DEFAULT_CHART_METRIC_KEYS, SEO_FUNNEL_DEFS, FUNNEL_RATE_DEFS } from './config/kpiConfig.js'
import { useMockData } from './config/env.js'

import DateRangePicker from './components/DateRangePicker.jsx'
import DepartmentFilter from './components/DepartmentFilter.jsx'
import PlatformFilter from './components/PlatformFilter.jsx'
import MobileBottomBar from './components/MobileBottomBar.jsx'
import KpiCard from './components/KpiCard.jsx'
import KpiMetricMobileSheet from './components/KpiMetricMobileSheet.jsx'
import TrendChart from './components/TrendChart.jsx'
import FunnelTableSection from './components/FunnelTableSection.jsx'
import longhouseAdvertisingLogo from './assets/longhouse-advertising-logo.svg'

function getInitialDateState() {
  const now = new Date()
  const saved = readBootstrapDateDefault()
  const applied = applyDateDefault(saved)
  return {
    presetId: applied?.presetId ?? DEFAULT_DATE_PRESET_ID,
    dateRange: applied?.dateRange ?? getDateRangeForPreset(DEFAULT_DATE_PRESET_ID),
    calendarMonth: applied?.calendarMonth ?? now.getMonth() + 1,
    calendarYear: applied?.calendarYear ?? now.getFullYear(),
    saved: applied ? saved : null,
  }
}

export default function App() {
  const { session } = useAuth()
  const userId = session?.user?.id ?? null
  const [datePresetId, setDatePresetId] = useState(() => getInitialDateState().presetId)
  const [dateRange, setDateRange] = useState(() => getInitialDateState().dateRange)
  const [calendarMonth, setCalendarMonth] = useState(() => getInitialDateState().calendarMonth)
  const [calendarYear, setCalendarYear] = useState(() => getInitialDateState().calendarYear)
  const [savedDateDefault, setSavedDateDefault] = useState(() => getInitialDateState().saved)
  const [platformTab, setPlatformTab] = useState('All')
  const [department, setDepartment] = useState(/** @type {'ads' | 'seo'} */ ('ads'))
  const [chartMetricKeys, setChartMetricKeys] = useState(() => [...DEFAULT_CHART_METRIC_KEYS])
  const [metricSheet, setMetricSheet] = useState(null)

  const isMobile = useMediaQuery('(max-width: 767px)')

  useEffect(() => {
    if (!useMockData && !userId) return
    const pref = readDateDefaultFromUser(session?.user)
    setSavedDateDefault(pref)
    const applied = applyDateDefault(pref)
    if (!applied) return
    setDatePresetId(applied.presetId)
    setDateRange(applied.dateRange)
    if (applied.calendarMonth && applied.calendarYear) {
      setCalendarMonth(applied.calendarMonth)
      setCalendarYear(applied.calendarYear)
    }
  }, [userId])

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
    adsCurrentSessions,
    seoCurrentSessions,
    adsPeriodDeals,
    seoPeriodDeals,
    adsPeriodWins,
    seoPeriodWins,
    adsFunnel,
    adsFunnelDeltas,
    seoFunnel,
    seoFunnelDeltas,
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

  const askQuestionDisabled = department !== 'ads' || !askQuestionGmailUrl
  const isAds = department === 'ads'

  const mobileDateSummary = format(dateRange.start, 'MMM d') + ' – ' + format(dateRange.end, 'MMM d')

  const isSavedDefault = isDateDefaultMatch(savedDateDefault, {
    presetId: datePresetId,
    calendarMonth,
    calendarYear,
    dateRange,
  })

  async function handleSavedDefaultChange(checked) {
    if (!checked) {
      setSavedDateDefault(null)
      await persistDateDefault(userId, null)
      return
    }
    const snap = snapshotDateDefault({
      presetId: datePresetId,
      calendarMonth,
      calendarYear,
      dateRange,
    })
    setSavedDateDefault(snap)
    await persistDateDefault(userId, snap)
  }

  const datePickerProps = {
    presetId: datePresetId,
    dateRange,
    calendarMonth,
    calendarYear,
    onPresetChange: handleDatePresetChange,
    onRangeChange: r => setDateRange(clampDateRangeToDataEarliest(r)),
    onCalendarMonthYearChange: handleCalendarMonthYearChange,
    isSavedDefault,
    onSavedDefaultChange: handleSavedDefaultChange,
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-brand-50">
      <header className="sticky top-0 z-[100] border-b border-brand-950/40 bg-brand-800 px-4 py-3 shadow-sm sm:px-6">
        <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3">
            <img
              src={longhouseAdvertisingLogo}
              alt="Longhouse Advertising"
              className="h-9 w-auto max-w-full object-left object-contain sm:h-10 md:max-w-[min(100%,22rem)]"
              width={1920}
              height={374}
              decoding="async"
            />
            <DepartmentFilter selected={department} onChange={setDepartment} />
          </div>

          <div className="hidden min-w-0 flex-wrap items-center justify-end gap-2 md:flex md:gap-3">
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
            <div className="min-w-0 max-w-full">
              <DateRangePicker {...datePickerProps} />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-0 mx-auto min-w-0 max-w-7xl space-y-6 overflow-x-hidden px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6 sm:px-6">
        {useMock && (
          <div className="flex items-center gap-2 break-words rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
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

        <div className="hidden w-full min-w-0 flex-wrap items-center gap-x-4 gap-y-2 md:flex">
          {isAds ? <PlatformFilter selected={platformTab} onChange={setPlatformTab} /> : null}
          {!isLoading && (
            <p className="w-full min-w-0 text-xs leading-[1.45] text-ink-500 sm:ml-auto sm:w-auto sm:max-w-[min(100%,22rem)] sm:text-right">
              {formatDateRange(dateRange.start, dateRange.end)} vs. Comparison Period
            </p>
          )}
        </div>

        {!isLoading && (
          <p className="text-center text-xs leading-[1.45] text-ink-500 md:hidden">
            {formatDateRange(dateRange.start, dateRange.end)} vs. Comparison Period
          </p>
        )}

        {isAds ? (
          <>
            {isLoading ? (
              <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
                {KPI_DEFS.map(d => (
                  <div key={d.key} className="h-24 animate-pulse rounded-xl border border-brand-100 bg-white p-4" />
                ))}
              </div>
            ) : (
              <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
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
                  />
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="grid min-w-0 grid-cols-2 gap-3">
                {FUNNEL_RATE_DEFS.map(d => (
                  <div key={d.key} className="h-24 animate-pulse rounded-xl border border-brand-100 bg-white p-4" />
                ))}
              </div>
            ) : (
              <div className="grid min-w-0 grid-cols-2 gap-3">
                {FUNNEL_RATE_DEFS.map(d => (
                  <KpiCard
                    key={d.key}
                    isMobile={isMobile}
                    label={d.label}
                    tooltip={d.tooltip}
                    value={d.format(adsFunnel[d.key])}
                    delta={adsFunnelDeltas[d.key]}
                    lowerIsBetter={d.lowerIsBetter}
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

            <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-brand-100 bg-white p-5">
              <h2 className="mb-1 text-base font-semibold leading-[1.2] text-brand-800">
                Metric trend (selected range).
              </h2>
              <p className="mb-4 text-xs leading-[1.45] text-ink-400 md:hidden">
                The chart splits your current date filter into daily segments (or fewer wide segments for
                long ranges). Tap a KPI card for a short definition, then add it to the chart.
              </p>
              <p className="mb-4 hidden text-xs leading-[1.45] text-ink-400 md:block">
                The chart splits your current date filter into daily segments (or fewer wide segments for
                long ranges). Click KPI cards to add or remove lines from the chart.
              </p>
              {isLoading ? (
                <div className="h-64 animate-pulse rounded-lg bg-brand-50" />
              ) : (
                <TrendChart data={monthlyTrendData} selectedMetricKeys={chartKeysOrdered} />
              )}
            </section>
          </>
        ) : (
          <>
            {isLoading ? (
              <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-5">
                {SEO_FUNNEL_DEFS.map(d => (
                  <div key={d.key} className="h-24 animate-pulse rounded-xl border border-brand-100 bg-white p-4" />
                ))}
              </div>
            ) : (
              <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-5">
                {SEO_FUNNEL_DEFS.map(d => (
                  <KpiCard
                    key={d.key}
                    isMobile={isMobile}
                    label={d.label}
                    tooltip={d.tooltip}
                    value={d.format(seoFunnel[d.key])}
                    delta={seoFunnelDeltas[d.key]}
                    lowerIsBetter={d.lowerIsBetter}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <FunnelTableSection
          department={department}
          leads={isAds ? adsCurrentSessions : seoCurrentSessions}
          deals={isAds ? adsPeriodDeals : seoPeriodDeals}
          wins={isAds ? adsPeriodWins : seoPeriodWins}
          isLoading={isLoading}
        />
      </main>

      {isMobile ? (
        <MobileBottomBar
          department={department}
          platformTab={platformTab}
          onPlatformChange={setPlatformTab}
          dateSummary={mobileDateSummary}
          askDisabled={askQuestionDisabled}
          askHref={askQuestionGmailUrl}
          datePickerProps={datePickerProps}
        />
      ) : null}
    </div>
  )
}
