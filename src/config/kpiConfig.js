/**
 * KPI definitions shared by dashboard cards and trend chart.
 */

import { formatCurrency, formatPercent } from '../utils/kpiUtils.js'

/** How trend-chart values are compared when multiple metrics share one Y-axis. */
export const CHART_VALUE_KIND = /** @type {const} */ ({
  INTEGER: 'integer',
  PERCENT: 'percent',
  CURRENCY: 'currency',
})

export const KPI_DEFS = [
  {
    key: 'clicks',
    label: 'Clicks',
    tooltip: 'Number of clicks the platform generated.',
    format: v => (v == null ? '—' : Number(v).toLocaleString('en-US')),
    lowerIsBetter: false,
    chartValueKind: CHART_VALUE_KIND.INTEGER,
  },
  {
    key: 'ctr',
    label: 'CTR',
    tooltip: 'The % of users who saw an ad and clicked on it.',
    format: v => formatPercent(v, 2),
    lowerIsBetter: false,
    chartValueKind: CHART_VALUE_KIND.PERCENT,
  },
  {
    key: 'conversions',
    label: 'Conversions',
    tooltip: '# of Attributed Form Submissions',
    format: v => (v == null ? '—' : Number(v).toLocaleString('en-US')),
    lowerIsBetter: false,
    chartValueKind: CHART_VALUE_KIND.INTEGER,
  },
  {
    key: 'conversionRate',
    label: 'CVR',
    tooltip: 'The conversion rate of users who clicked on an ad.',
    format: v => formatPercent(v, 2),
    lowerIsBetter: false,
    chartValueKind: CHART_VALUE_KIND.PERCENT,
  },
  {
    key: 'cpl',
    label: 'CPL',
    tooltip: 'Cost per lead (Spend/Conversions).',
    format: v => formatCurrency(v),
    lowerIsBetter: true,
    chartValueKind: CHART_VALUE_KIND.CURRENCY,
  },
  {
    key: 'cpd',
    label: 'CPD',
    tooltip: 'Cost per deal (Spend/# of Deals).',
    format: v => formatCurrency(v),
    lowerIsBetter: true,
    chartValueKind: CHART_VALUE_KIND.CURRENCY,
  },
  {
    key: 'cpw',
    label: 'CPW',
    tooltip: 'Cost per win (Spend/# of leads converted into partners).',
    format: v => formatCurrency(v),
    lowerIsBetter: true,
    chartValueKind: CHART_VALUE_KIND.CURRENCY,
  },
  {
    key: 'spend',
    label: 'Spend',
    tooltip: 'Total advertising spend in the selected period.',
    format: v => formatCurrency(v),
    lowerIsBetter: false,
    chartValueKind: CHART_VALUE_KIND.CURRENCY,
  },
]

/** Default metrics shown on the trend chart when the dashboard loads. */
export const DEFAULT_CHART_METRIC_KEYS = ['cpl', 'cpd', 'cpw']

/** Distinct stroke colors for chart series (cycle if needed); varied hues for quick differentiation. */
export const CHART_METRIC_COLORS = [
  '#08447F',
  '#EA580C',
  '#059669',
  '#7C3AED',
  '#CA8A04',
  '#DB2777',
  '#0D9488',
  '#4F46E5',
]

export function getKpiDef(key) {
  return KPI_DEFS.find(d => d.key === key)
}

export function getChartValueKind(key) {
  return getKpiDef(key)?.chartValueKind ?? CHART_VALUE_KIND.INTEGER
}
