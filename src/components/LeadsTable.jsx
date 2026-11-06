/**
 * Lead-session rows for the selected period and department.
 */

import { useMemo, useState } from 'react'

import { formatDealDate } from '../utils/dealsUtils.js'

/** @typedef {'date' | 'name' | 'source'} SortKey */

function compareLeads(a, b, sortKey, direction) {
  const mult = direction === 'asc' ? 1 : -1
  if (sortKey === 'date') {
    const ta = a.date ? Date.parse(a.date) : Number.NEGATIVE_INFINITY
    const tb = b.date ? Date.parse(b.date) : Number.NEGATIVE_INFINITY
    return mult * ((Number.isFinite(ta) ? ta : Number.NEGATIVE_INFINITY) - (Number.isFinite(tb) ? tb : Number.NEGATIVE_INFINITY))
  }
  const av = sortKey === 'name' ? a.name ?? '' : a.source ?? ''
  const bv = sortKey === 'name' ? b.name ?? '' : b.source ?? ''
  return (
    mult *
    String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' })
  )
}

/**
 * @param {{
 *   leads: Array<{ id: string, date?: string|null, name?: string, source?: string, linkedDealIds?: string[] }>,
 *   emptyMessage?: string,
 * }} props
 */
export default function LeadsTable({
  leads,
  emptyMessage = 'No leads in this period.',
}) {
  const [sortKey, setSortKey] = useState(/** @type {SortKey} */ ('date'))
  const [sortDir, setSortDir] = useState(/** @type {'asc' | 'desc'} */ ('desc'))

  const sorted = useMemo(
    () => [...leads].sort((a, b) => compareLeads(a, b, sortKey, sortDir)),
    [leads, sortKey, sortDir],
  )

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'date' ? 'desc' : 'asc')
    }
  }

  if (leads.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-brand-200 bg-brand-50 px-4 py-8 text-center text-sm text-ink-500">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="-mx-5 overflow-x-auto overscroll-x-contain px-5">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-brand-100">
            <SortHeader
              label="Date"
              columnKey="date"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            />
            <SortHeader
              label="Name"
              columnKey="name"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            />
            <SortHeader
              label="Source"
              columnKey="source"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            />
            <th
              scope="col"
              className="pb-2 pr-0 text-left text-xs font-semibold uppercase tracking-wide text-ink-400"
            >
              Deal
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(lead => (
            <tr key={lead.id} className="border-b border-brand-50 last:border-0">
              <td className="py-2.5 pr-4 whitespace-nowrap text-ink-700">
                {formatDealDate(lead.date)}
              </td>
              <td className="py-2.5 pr-4 font-medium text-ink-900">
                {(lead.name && lead.name !== '—') ? lead.name : '—'}
              </td>
              <td className="py-2.5 pr-4 text-ink-700">{lead.source?.trim() || '—'}</td>
              <td className="py-2.5 text-ink-700">
                {(lead.linkedDealIds ?? []).length > 0 ? 'Linked' : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SortHeader({ label, columnKey, sortKey, sortDir, onSort }) {
  const active = sortKey === columnKey
  const ariaSort = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <th scope="col" className="pb-2 pr-4 text-left" aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="inline-flex items-center gap-1 rounded text-xs font-semibold uppercase tracking-wide text-ink-400 transition-colors hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
      >
        {label}
        {active ? (
          <span className="text-brand-700" aria-hidden>
            {sortDir === 'asc' ? '↑' : '↓'}
          </span>
        ) : (
          <span className="inline-block w-3.5 shrink-0" aria-hidden />
        )}
      </button>
    </th>
  )
}
