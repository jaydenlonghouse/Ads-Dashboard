import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from 'recharts'

import { formatPercent } from '../utils/kpiUtils.js'

const CHART_FONT = 'Figtree, sans-serif'

function sliceShare(count, total) {
  return total === 0 ? null : (count * 100) / total
}

function formatCountAndShare(count, percent) {
  return `${Number(count).toLocaleString('en-US')} (${formatPercent(percent, 1)})`
}

function QualityTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div
      className="rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm leading-[1.45] shadow-md"
      style={{ fontFamily: CHART_FONT }}
    >
      <p className="font-semibold leading-[1.2] text-ink-900">{row.label}</p>
      <p className="text-ink-700">{formatCountAndShare(row.count, row.percent)}</p>
    </div>
  )
}

/**
 * @param {{ title: string, slices: Array<{ key: string, label: string, color: string, count: number }>, emptyMessage?: string }} props
 */
export default function QualityPieChart({ title, slices, emptyMessage = 'No data in this period.' }) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0)
  const withShare = slices.map(slice => ({
    ...slice,
    percent: sliceShare(slice.count, total),
  }))
  const pieData = withShare.filter(slice => slice.count > 0)

  return (
    <section className="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold leading-[1.2] text-brand-800">{title}</h2>
      {total === 0 ? (
        <p className="text-sm leading-[1.45] text-ink-400">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="h-52 w-full max-w-[220px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  paddingAngle={pieData.length > 1 ? 1 : 0}
                >
                  {pieData.map(slice => (
                    <Cell
                      key={slice.key}
                      fill={slice.color}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<QualityTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex w-full min-w-0 flex-col gap-2 text-sm leading-[1.45]">
            {withShare.map(slice => (
              <li key={slice.key} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: slice.color }}
                    aria-hidden
                  />
                  <span className="text-ink-700">{slice.label}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums text-ink-900">
                  {formatCountAndShare(slice.count, slice.percent)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/**
 * @param {{ leadSlices: Array<object>, dealSlices: Array<object>, isLoading?: boolean }} props
 */
export function QualityPiesRow({ leadSlices, dealSlices, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl border border-brand-100 bg-white" />
        <div className="h-64 animate-pulse rounded-xl border border-brand-100 bg-white" />
      </div>
    )
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
      <QualityPieChart title="Lead quality" slices={leadSlices} />
      <QualityPieChart title="Deal quality" slices={dealSlices} />
    </div>
  )
}
