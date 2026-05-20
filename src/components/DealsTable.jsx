/**
 * components/DealsTable.jsx
 *
 * Deals linked from metrics rows in the selected period (via Airtable `Deals` field).
 */

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import {
  compareDeals,
  formatDealDate,
  formatDealField,
  getDealStatusPillClass,
} from '../utils/dealsUtils.js'
import { DealPlatformIcons } from './PlatformLogos.jsx'

/** @typedef {'businessName' | 'date' | 'dealStage' | 'dealStatus'} SortKey */

/**
 * @param {{ deals: Array<{ id: string, businessName: string, dealStage: string, dealStatus: string, date?: string|null, platforms?: ('google'|'meta')[] }>, isLoading?: boolean }} props
 */
export default function DealsTable({ deals, isLoading = false }) {
  const [sortKey, setSortKey] = useState(/** @type {SortKey} */ ('businessName'))
  const [sortDir, setSortDir] = useState(/** @type {'asc' | 'desc'} */ ('asc'))

  const sortedDeals = useMemo(
    () => [...deals].sort((a, b) => compareDeals(a, b, sortKey, sortDir)),
    [deals, sortKey, sortDir],
  )

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-brand-100 bg-white p-5">
        <div className="mb-3 h-5 w-32 animate-pulse rounded bg-brand-100" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-10 animate-pulse rounded-lg bg-brand-50" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-brand-100 bg-white p-5">
      <h2 className="text-base font-semibold text-brand-800 leading-[1.2] mb-1">Deals</h2>
      <p className="text-xs text-ink-400 mb-4 leading-[1.45]">
        Linked from advertising metrics in the selected date range and platform filter.
      </p>

      {deals.length === 0 ? (
        <p className="rounded-lg border border-dashed border-brand-200 bg-brand-50 px-4 py-8 text-center text-sm text-ink-500">
          No linked deals in this period.
        </p>
      ) : (
        <div className="-mx-5 overflow-x-auto overscroll-x-contain px-5">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm sm:min-w-[36rem]">
            <thead>
              <tr className="border-b border-brand-100">
                <SortHeader
                  label="Business name"
                  columnKey="businessName"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader
                  label="Deal Created"
                  columnKey="date"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader
                  label="Deal stage"
                  columnKey="dealStage"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader
                  label="Deal status"
                  columnKey="dealStatus"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                  className="pr-0"
                />
              </tr>
            </thead>
            <tbody>
              {sortedDeals.map(deal => (
                <tr key={deal.id} className="border-b border-brand-50 last:border-0">
                  <td className="py-2.5 pr-4">
                    <span className="inline-flex items-center gap-2 font-medium text-ink-900">
                      <DealPlatformIcons platforms={deal.platforms ?? []} />
                      {deal.businessName}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap text-ink-700">
                    {formatDealDate(deal.date)}
                  </td>
                  <td className="py-2.5 pr-4 text-ink-700">{formatDealField(deal.dealStage)}</td>
                  <td className="py-2.5">
                    <DealStatusPill status={deal.dealStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function SortHeader({ label, columnKey, sortKey, sortDir, onSort, className = '' }) {
  const active = sortKey === columnKey
  const ariaSort = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <th scope="col" className={`pb-2 pr-4 text-left ${className}`} aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-400 transition-colors hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 rounded"
      >
        {label}
        {active ? (
          sortDir === 'asc' ? (
            <ChevronUp size={14} className="shrink-0 text-brand-700" aria-hidden />
          ) : (
            <ChevronDown size={14} className="shrink-0 text-brand-700" aria-hidden />
          )
        ) : (
          <span className="inline-block w-3.5 shrink-0" aria-hidden />
        )}
      </button>
    </th>
  )
}

function DealStatusPill({ status }) {
  const label = formatDealField(status)
  if (label === '—') return <span className="text-ink-400">—</span>

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDealStatusPillClass(status)}`}
    >
      {label}
    </span>
  )
}
