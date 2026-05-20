/**
 * components/KpiCard.jsx
 *
 * KPI tile: desktop — click toggles trend chart; mobile — click opens sheet (handled in App).
 */

import { formatDelta } from '../utils/kpiUtils.js'
import KpiMetricTooltip from './KpiMetricTooltip.jsx'

/**
 * @param {string}  label
 * @param {string}  value
 * @param {{ value: number|null, direction: 'up'|'down'|'flat' }} delta
 * @param {boolean} lowerIsBetter
 * @param {string}  [tooltip]
 * @param {boolean} [chartSelected]
 * @param {boolean} [isMobile]
 * @param {() => void} [onMobileSheetRequest]  — tap ? on phone: open metric sheet
 */
export default function KpiCard({
  label,
  value,
  delta,
  lowerIsBetter = false,
  tooltip,
  chartSelected = false,
  isMobile = false,
  onCardActivate,
  onOpenMetricSheet,
}) {
  const badgeClass = getBadgeClass(delta, lowerIsBetter, chartSelected)
  const deltaText = formatDelta(delta)
  const interactive = typeof onCardActivate === 'function'

  const shellClass = interactive
    ? 'w-full overflow-visible text-left rounded-xl border p-4 flex flex-col gap-2 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'
    : 'rounded-xl border border-brand-100 bg-white overflow-visible p-4 flex flex-col gap-2 shadow-sm'

  const shellState = interactive
    ? chartSelected
      ? 'border-brand-800 bg-brand-800 text-white cursor-pointer'
      : 'border-brand-100 bg-white text-ink-900 cursor-pointer hover:border-brand-300'
    : ''

  const labelClass = chartSelected ? 'text-brand-100' : 'text-ink-400'
  const valueClass = chartSelected ? 'text-white' : 'text-ink-900'

  const ariaLabel = interactive
    ? isMobile
      ? `${label}. Tap for a definition and to add or remove this metric from the trend chart.`
      : chartSelected
        ? `${label}. On trend chart. Press Enter or Space to remove from trend chart.`
        : `${label}. Not on trend chart. Press Enter or Space to add to trend chart.`
    : undefined

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className={`min-w-0 flex-1 text-xs font-medium leading-[1.45] ${labelClass}`}>{label}</p>
        {tooltip ? (
          <KpiMetricTooltip
            text={tooltip}
            chartSelected={chartSelected}
            metricLabel={label}
            isMobile={isMobile}
            onMobileSheetRequest={onOpenMetricSheet}
          />
        ) : null}
      </div>
      <p className={`text-2xl font-semibold leading-[1.2] ${valueClass}`}>{value}</p>
      {delta.value !== null && (
        <span className={`${badgeClass} self-start text-xs font-medium px-2 py-0.5 rounded-full`}>
          {deltaText} vs prev
        </span>
      )}
      {delta.value === null && (
        <span className={`${chartSelected ? 'badge-neutral-on-dark' : 'badge-neutral'} self-start`}>
          — vs prev
        </span>
      )}
    </>
  )

  if (interactive) {
    return (
      <div
        tabIndex={0}
        aria-pressed={chartSelected}
        aria-label={ariaLabel}
        className={`${shellClass} ${shellState}`}
        onClick={onCardActivate}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onCardActivate()
          }
        }}
      >
        {inner}
      </div>
    )
  }

  return <div className={shellClass}>{inner}</div>
}

function getBadgeClass(delta, lowerIsBetter, chartSelected) {
  if (delta.value === null || delta.direction === 'flat') {
    return chartSelected ? 'badge-neutral-on-dark' : 'badge-neutral'
  }

  const isPositive = delta.direction === 'up'
  const isGood = lowerIsBetter ? !isPositive : isPositive
  if (chartSelected) {
    return isGood ? 'badge-positive-on-dark' : 'badge-negative-on-dark'
  }
  return isGood ? 'badge-positive' : 'badge-negative'
}
