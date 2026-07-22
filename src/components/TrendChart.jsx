/**
 * components/TrendChart.jsx
 *
 * Recharts multi-line chart.
 * - One metric or all metrics share the same unit kind (% / $ / counts): one Y-axis of actual values.
 * - Exactly two unit kinds: left and right Y-axes with real values so same-unit metrics compare fairly.
 * - Three or more kinds: each line scaled 0–100 to its own max in the window; tooltips show actuals.
 * - Single metric: dashed linear-regression trend line over the period.
 */

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import {
  KPI_DEFS,
  CHART_METRIC_COLORS,
  CHART_VALUE_KIND,
  getKpiDef,
  getChartValueKind,
} from '../config/kpiConfig.js'

const CHART_FONT = 'Figtree, sans-serif'
const TREND_LINE_KEY = '__trend'
const TREND_LINE_COLOR = '#94A3B8'

/**
 * Least-squares line y = slope * x + intercept for finite (x, y) points.
 * @param {Array<{ x: number, y: number }>} points
 * @returns {{ slope: number, intercept: number } | null}
 */
function linearRegression(points) {
  if (points.length < 2) return null
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  for (const { x, y } of points) {
    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
  }
  const n = points.length
  const denom = n * sumXX - sumX * sumX
  if (Math.abs(denom) < 1e-12) return null
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

/**
 * Attach a regression trend series when exactly one metric is plotted.
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} metricKey
 * @returns {{ chartData: Array<Record<string, unknown>>, hasTrend: boolean }}
 */
function withSingleMetricTrend(rows, metricKey) {
  const points = []
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i][metricKey]
    if (raw == null || !Number.isFinite(Number(raw))) continue
    points.push({ x: i, y: Number(raw) })
  }
  const fit = linearRegression(points)
  if (!fit) {
    return { chartData: rows, hasTrend: false }
  }
  const chartData = rows.map((row, i) => ({
    ...row,
    [TREND_LINE_KEY]: fit.slope * i + fit.intercept,
  }))
  return { chartData, hasTrend: true }
}

function collectFiniteMetricValues(data, keys) {
  const vals = []
  for (const row of data) {
    for (const key of keys) {
      const raw = row[key]
      if (raw == null || !Number.isFinite(Number(raw))) continue
      vals.push(Number(raw))
    }
  }
  return vals
}

function computePaddedDomain(values) {
  if (!values.length) return [0, 1]
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || Math.abs(hi) || 1
  const pad = Math.max(span * 0.08, 1e-9)
  let d0 = lo - pad
  const d1 = hi + pad
  if (values.every(v => v >= 0)) d0 = Math.max(0, d0)
  return [d0, d1]
}

function formatAxisTick(v, kind) {
  if (!Number.isFinite(v)) return ''
  if (kind === CHART_VALUE_KIND.CURRENCY) {
    const a = Math.abs(v)
    if (a >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (a >= 1000) return `$${(v / 1000).toFixed(1)}k`
    return `$${Math.round(v)}`
  }
  if (kind === CHART_VALUE_KIND.PERCENT) {
    if (Math.abs(v - Math.round(v)) < 0.05) return `${Math.round(v)}%`
    return `${v.toFixed(1)}%`
  }
  if (Math.abs(v) >= 1000) {
    return Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })
  }
  return String(Math.round(v))
}

function kindCaption(kind) {
  if (kind === CHART_VALUE_KIND.CURRENCY) return 'dollar amounts'
  if (kind === CHART_VALUE_KIND.PERCENT) return 'percentages'
  return 'counts'
}

function axisWidthForKind(kind) {
  return kind === CHART_VALUE_KIND.CURRENCY ? 52 : 44
}

/**
 * @param {Array<Record<string, unknown>>} data
 * @param {string[]} selectedMetricKeys  — may be empty
 */
export default function TrendChart({ data, selectedMetricKeys }) {
  const orderedKeys = useMemo(
    () => KPI_DEFS.map(d => d.key).filter(k => selectedMetricKeys.includes(k)),
    [selectedMetricKeys],
  )

  const model = useMemo(() => {
    if (!data?.length || !orderedKeys.length) {
      return {
        mode: 'empty',
        chartData: [],
        colorByKey: {},
        sharedKind: CHART_VALUE_KIND.INTEGER,
        yDomain: [0, 1],
        yTickFormatter: () => '',
        yAxisWidth: 40,
        hasTrend: false,
      }
    }

    const kinds = new Set(orderedKeys.map(k => getChartValueKind(k)))
    const colorByKey = Object.fromEntries(
      orderedKeys.map((key, i) => [key, CHART_METRIC_COLORS[i % CHART_METRIC_COLORS.length]]),
    )

    if (kinds.size === 1) {
      const sharedKind = getChartValueKind(orderedKeys[0])
      const singleKey = orderedKeys.length === 1 ? orderedKeys[0] : null
      const { chartData, hasTrend } = singleKey
        ? withSingleMetricTrend(data, singleKey)
        : { chartData: data, hasTrend: false }
      const vals = [
        ...collectFiniteMetricValues(chartData, orderedKeys),
        ...(hasTrend
          ? chartData
              .map(row => row[TREND_LINE_KEY])
              .filter(v => v != null && Number.isFinite(Number(v)))
              .map(Number)
          : []),
      ]
      const yDomain = computePaddedDomain(vals)
      const yTickFormatter = v => formatAxisTick(Number(v), sharedKind)
      const yAxisWidth = axisWidthForKind(sharedKind)
      return {
        mode: 'shared',
        chartData,
        colorByKey,
        sharedKind,
        yDomain,
        yTickFormatter,
        yAxisWidth,
        hasTrend,
        trendMetricKey: singleKey,
      }
    }

    if (kinds.size === 2) {
      const kindOrder = []
      for (const k of orderedKeys) {
        const kk = getChartValueKind(k)
        if (!kindOrder.includes(kk)) kindOrder.push(kk)
      }
      const [kindLeft, kindRight] = kindOrder
      const keysLeft = orderedKeys.filter(k => getChartValueKind(k) === kindLeft)
      const keysRight = orderedKeys.filter(k => getChartValueKind(k) === kindRight)
      const yDomainLeft = computePaddedDomain(collectFiniteMetricValues(data, keysLeft))
      const yDomainRight = computePaddedDomain(collectFiniteMetricValues(data, keysRight))
      const axisByKey = Object.fromEntries(
        orderedKeys.map(k => [k, getChartValueKind(k) === kindLeft ? 'left' : 'right']),
      )
      return {
        mode: 'dual',
        chartData: data,
        colorByKey,
        kindLeft,
        kindRight,
        yDomainLeft,
        yDomainRight,
        tickLeft: v => formatAxisTick(Number(v), kindLeft),
        tickRight: v => formatAxisTick(Number(v), kindRight),
        widthLeft: axisWidthForKind(kindLeft),
        widthRight: axisWidthForKind(kindRight),
        axisByKey,
        hasTrend: false,
      }
    }

    const maxByKey = Object.fromEntries(
      orderedKeys.map(key => {
        const vals = data.map(d => {
          const v = d[key]
          if (v == null || !Number.isFinite(Number(v))) return 0
          return Math.abs(Number(v))
        })
        const m = Math.max(...vals, 1e-12)
        return [key, m]
      }),
    )

    const chartData = data.map(row => {
      const out = { ...row, label: row.label }
      for (const key of orderedKeys) {
        const raw = row[key]
        const max = maxByKey[key]
        const n = raw == null || !Number.isFinite(Number(raw)) ? null : Number(raw)
        out[`__scaled_${key}`] = n == null ? null : (n / max) * 100
      }
      return out
    })

    return {
      mode: 'normalized',
      chartData,
      colorByKey,
      yTickFormatter: v => String(Math.round(Number(v))),
      yAxisWidth: 40,
      hasTrend: false,
    }
  }, [data, orderedKeys])

  if (!data?.length) return null

  if (!orderedKeys.length) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-brand-200 bg-brand-50 px-4 py-10 text-center">
        <p className="text-sm font-medium text-brand-800 leading-[1.2]">No metrics on the chart.</p>
        <p className="mt-2 max-w-sm text-xs leading-[1.45] text-ink-500">
          Select one or more KPI cards to plot trends. On a phone, tap a card and use{' '}
          <span className="font-semibold text-ink-700">Add to trend chart</span>.
        </p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const row = data.find(d => d.label === label)
    if (!row) return null
    const trendRow = model.hasTrend
      ? model.chartData.find(d => d.label === label)
      : null

    return (
      <div
        className="rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm leading-[1.45] shadow-md"
        style={{ fontFamily: CHART_FONT }}
      >
        <p className="mb-1 font-semibold leading-[1.2] text-ink-900">
          {row.labelDetail ?? label}
        </p>
        {orderedKeys.map(key => {
          const def = getKpiDef(key)
          const color = model.colorByKey[key]
          const text = def ? def.format(row[key]) : String(row[key])
          return (
            <p key={key} style={{ color }}>
              {def?.label ?? key}: {text}
            </p>
          )
        })}
        {model.hasTrend && trendRow?.[TREND_LINE_KEY] != null && (
          <p style={{ color: TREND_LINE_COLOR }}>
            Trend:{' '}
            {getKpiDef(model.trendMetricKey)?.format(trendRow[TREND_LINE_KEY]) ??
              String(trendRow[TREND_LINE_KEY])}
          </p>
        )}
      </div>
    )
  }

  const chartMargin =
    model.mode === 'dual'
      ? { top: 8, right: 8, left: 4, bottom: 0 }
      : { top: 8, right: 16, left: 0, bottom: 0 }

  const lineUsesRaw = model.mode === 'shared' || model.mode === 'dual'

  return (
    <div className="min-w-0 max-w-full space-y-2 overflow-hidden">
      <ResponsiveContainer width="100%" height={260} minWidth={0}>
        <LineChart
          data={model.chartData}
          margin={chartMargin}
          style={{ fontFamily: CHART_FONT }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#D5E8F7" />
          <XAxis
            dataKey="label"
            interval={model.chartData.length <= 1 ? 0 : 1}
            tick={{ fontSize: 11, fill: '#7A8D9E', fontFamily: CHART_FONT }}
            tickLine={false}
            axisLine={{ stroke: '#D5E8F7' }}
          />
          {model.mode === 'shared' && (
            <YAxis
              domain={model.yDomain}
              tickFormatter={model.yTickFormatter}
              tick={{ fontSize: 11, fill: '#7A8D9E', fontFamily: CHART_FONT }}
              tickLine={false}
              axisLine={false}
              width={model.yAxisWidth}
              allowDataOverflow={false}
            />
          )}
          {model.mode === 'dual' && (
            <>
              <YAxis
                yAxisId="left"
                orientation="left"
                domain={model.yDomainLeft}
                tickFormatter={model.tickLeft}
                tick={{ fontSize: 11, fill: '#7A8D9E', fontFamily: CHART_FONT }}
                tickLine={false}
                axisLine={false}
                width={model.widthLeft}
                allowDataOverflow={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={model.yDomainRight}
                tickFormatter={model.tickRight}
                tick={{ fontSize: 11, fill: '#7A8D9E', fontFamily: CHART_FONT }}
                tickLine={false}
                axisLine={false}
                width={model.widthRight}
                allowDataOverflow={false}
              />
            </>
          )}
          {model.mode === 'normalized' && (
            <YAxis
              domain={[0, 100]}
              tickFormatter={model.yTickFormatter}
              tick={{ fontSize: 11, fill: '#7A8D9E', fontFamily: CHART_FONT }}
              tickLine={false}
              axisLine={false}
              width={model.yAxisWidth}
              allowDataOverflow={false}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: '12px',
              paddingTop: '8px',
              fontFamily: CHART_FONT,
            }}
          />
          {orderedKeys.map(key => (
            <Line
              key={key}
              yAxisId={model.mode === 'dual' ? model.axisByKey[key] : undefined}
              type="monotone"
              dataKey={lineUsesRaw ? key : `__scaled_${key}`}
              name={getKpiDef(key)?.label ?? key}
              stroke={model.colorByKey[key]}
              strokeWidth={2}
              dot={{ r: 4, fill: model.colorByKey[key], strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
          {model.hasTrend && (
            <Line
              type="linear"
              dataKey={TREND_LINE_KEY}
              name="Trend"
              stroke={TREND_LINE_COLOR}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              legendType="plainline"
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs leading-[1.45] text-ink-400">
        {model.mode === 'shared' && (
          <>
            Lines share one scale (actual values). Tooltip shows formatted values.
            {model.hasTrend ? (
              <span className="block mt-1">
                Dashed line is the linear trend over this period.
              </span>
            ) : null}
            {model.sharedKind === CHART_VALUE_KIND.CURRENCY && orderedKeys.length > 1 ? (
              <span className="block mt-1">
                Very different dollar amounts (e.g. Spend vs CPL) can make one line look flat at this
                scale.
              </span>
            ) : null}
          </>
        )}
        {model.mode === 'dual' && (
          <>
            Left axis: {kindCaption(model.kindLeft)}. Right axis: {kindCaption(model.kindRight)}.
            Same-unit lines use the same scale, so higher values read above lower ones on that side.
            Tooltips show formatted values.
          </>
        )}
        {model.mode === 'normalized' && (
          <>
            Three different unit types are selected, so each line is scaled 0–100 to its own largest
            value in this window. Tooltip values are still the real numbers.
          </>
        )}
      </p>
    </div>
  )
}
