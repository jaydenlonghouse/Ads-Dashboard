/**
 * KPI help tooltip — Longhouse brand: deep blue panel (Blue 6), light tint text, Accent 1 focus.
 */

export default function KpiMetricTooltip({ text, chartSelected, metricLabel }) {
  if (!text) return null

  const triggerSurface = chartSelected
    ? 'bg-white/20 text-white hover:bg-white/30 focus-visible:bg-white/30'
    : 'bg-brand-800 text-white hover:bg-brand-900 focus-visible:bg-brand-900'

  return (
    <span className="group/kpiTip relative z-10 inline-flex shrink-0">
      <button
        type="button"
        aria-label={`What is ${metricLabel}?`}
        className={`inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full text-[11px] font-semibold leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${triggerSurface} ${chartSelected ? 'ring-offset-brand-800' : 'ring-offset-white'}`}
        onPointerDown={e => e.stopPropagation()}
      >
        ?
      </button>
      <span
        role="tooltip"
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
        className="pointer-events-none invisible absolute left-1/2 top-[calc(100%+6px)] z-10 w-max max-w-[min(240px,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-brand-700/80 bg-brand-950 px-3 py-2 text-left text-xs font-normal leading-snug text-brand-50 opacity-0 shadow-lg transition-[opacity,visibility] duration-150 group-focus-within/kpiTip:pointer-events-auto group-focus-within/kpiTip:visible group-focus-within/kpiTip:opacity-100 group-hover/kpiTip:pointer-events-auto group-hover/kpiTip:visible group-hover/kpiTip:opacity-100"
      >
        {text}
        <span
          className="absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 border-x-[7px] border-x-transparent border-b-[7px] border-b-brand-950 drop-shadow-sm"
          aria-hidden
        />
      </span>
    </span>
  )
}
