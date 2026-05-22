/**
 * Mobile metric dialog: centered explanation + add/remove from trend chart.
 */

import { useEffect, useRef } from 'react'

export default function KpiMetricMobileSheet({
  open,
  metricLabel,
  tooltip,
  isOnChart,
  onClose,
  onAddToChart,
  onRemoveFromChart,
}) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open && panelRef.current) {
      const btn = panelRef.current.querySelector('button')
      btn?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-brand-950/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="metric-sheet-title"
        className="max-h-[min(85vh,32rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-brand-100 bg-white p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="metric-sheet-title" className="text-lg font-semibold text-brand-800 leading-[1.2]">
          {metricLabel}
        </h2>
        <p className="mt-3 text-sm leading-[1.45] text-ink-600">{tooltip}</p>
        <div className="mt-6 flex flex-col gap-2">
          {!isOnChart ? (
            <button
              type="button"
              className="w-full rounded-lg bg-brand-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-900"
              onClick={() => {
                onAddToChart()
                onClose()
              }}
            >
              Add to trend chart
            </button>
          ) : (
            <button
              type="button"
              className="w-full rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-100"
              onClick={() => {
                onRemoveFromChart()
                onClose()
              }}
            >
              Remove from trend chart
            </button>
          )}
          <button
            type="button"
            className="w-full rounded-lg border border-brand-100 px-4 py-3 text-sm font-medium text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
