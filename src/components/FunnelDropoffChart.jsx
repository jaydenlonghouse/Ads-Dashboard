import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatPercent, safeDivide } from '../utils/kpiUtils.js'

const CHART_FONT = 'Figtree, sans-serif'

const STAGES = [
  { key: 'leads', label: 'Leads', color: '#08447F' },
  { key: 'deals', label: 'Deals', color: '#0898CC' },
  { key: 'wins', label: 'Wins', color: '#059669' },
]

function formatCount(value) {
  return Number(value ?? 0).toLocaleString('en-US')
}

function FunnelTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div
      className="rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm leading-[1.45] shadow-md"
      style={{ fontFamily: CHART_FONT }}
    >
      <p className="font-semibold leading-[1.2] text-ink-900">{row.label}</p>
      <p className="text-ink-700">{formatCount(row.count)}</p>
    </div>
  )
}

function conversionStep(fromLabel, toLabel, converted, of) {
  const rate = safeDivide(converted * 100, of)
  const dropped = Math.max(0, of - converted)
  const dropoff = safeDivide(dropped * 100, of)
  return {
    key: `${fromLabel}-${toLabel}`,
    fromLabel,
    toLabel,
    converted,
    dropped,
    rate,
    dropoff,
  }
}

/**
 * @param {{ leads: number, deals: number, wins: number }} props
 */
export default function FunnelDropoffChart({ leads = 0, deals = 0, wins = 0 }) {
  const counts = { leads, deals, wins }
  const data = STAGES.map(stage => ({ ...stage, count: counts[stage.key] ?? 0 }))
  const steps = [
    conversionStep('Leads', 'Deals', deals, leads),
    conversionStep('Deals', 'Wins', wins, deals),
  ]
  const leadToWin = safeDivide(wins * 100, leads)

  return (
    <section className="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-base font-semibold leading-[1.2] text-brand-800">
        Pipeline drop-off
      </h2>
      <p className="mb-4 text-xs leading-[1.45] text-ink-400">
        How many leads become deals, then wins, in this period.
      </p>
      <div className="h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#5C6773', fontSize: 12, fontFamily: CHART_FONT }}
              axisLine={{ stroke: '#D5E8F7' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#5C6773', fontSize: 12, fontFamily: CHART_FONT }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<FunnelTooltip />} cursor={{ fill: '#EDF4FA' }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={88}>
              {data.map(stage => (
                <Cell key={stage.key} fill={stage.color} />
              ))}
              <LabelList
                dataKey="count"
                position="top"
                formatter={formatCount}
                style={{ fill: '#043566', fontSize: 12, fontFamily: CHART_FONT, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
        {steps.map(step => (
          <li
            key={step.key}
            className="rounded-lg border border-brand-100 bg-brand-50/70 px-3 py-2.5"
          >
            <p className="text-xs font-medium leading-[1.45] text-ink-500">
              {step.fromLabel} → {step.toLabel}
            </p>
            <p className="mt-1 text-sm font-semibold leading-[1.2] text-brand-800">
              {formatPercent(step.rate, 1)} converted
            </p>
            <p className="mt-1 text-xs leading-[1.45] text-ink-600">
              {formatCount(step.dropped)} dropped
              {step.dropoff == null ? '' : ` (${formatPercent(step.dropoff, 1)})`}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-[1.45] text-ink-500">
        {formatPercent(leadToWin, 1)} of leads became wins.
      </p>
    </section>
  )
}
