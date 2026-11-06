/**
 * Shared Leads / Deals / Wins tabs for Ads and SEO department views.
 */

import { useState } from 'react'

import DealsTable from './DealsTable.jsx'
import LeadsTable from './LeadsTable.jsx'

const TABS = [
  { id: 'leads', label: 'Leads' },
  { id: 'deals', label: 'Deals' },
  { id: 'wins', label: 'Wins' },
]

/**
 * @param {{
 *   department: 'ads' | 'seo',
 *   leads: Array<object>,
 *   deals: Array<object>,
 *   wins: Array<object>,
 *   isLoading?: boolean,
 * }} props
 */
export default function FunnelTableSection({
  department,
  leads,
  deals,
  wins,
  isLoading = false,
}) {
  const [tab, setTab] = useState('leads')
  const counts = { leads: leads.length, deals: deals.length, wins: wins.length }
  const isSeo = department === 'seo'

  if (isLoading) {
    return (
      <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-brand-100 bg-white p-5">
        <div className="mb-3 h-5 w-40 animate-pulse rounded bg-brand-100" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-10 animate-pulse rounded-lg bg-brand-50" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-brand-100 bg-white p-5">
      <h2 className="text-base font-semibold leading-[1.2] text-brand-800 mb-1">
        {isSeo ? 'SEO pipeline' : 'Ads pipeline'}
      </h2>
      <p className="mb-4 text-xs leading-[1.45] text-ink-400">
        {isSeo
          ? 'Lead sessions from Google My Business, Organic SEO, or ChatGPT in the selected date range.'
          : 'Lead sessions from Google Ads, Meta Ads, or ChatGPT Ads in the selected date range (respects the platform filter). Deals are sessions with a linked deal; wins are those deals marked won.'}
      </p>

      <div
        className="mb-4 flex min-w-0 flex-wrap items-center gap-1.5"
        role="tablist"
        aria-label="Pipeline records"
      >
        {TABS.map(({ id, label }) => {
          const selected = tab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(id)}
              className={`dashboardPill text-xs ${selected ? 'dashboardPillSelected' : ''}`}
            >
              {label}
              <span className={`ml-1.5 tabular-nums ${selected ? 'text-white/80' : 'text-ink-400'}`}>
                {counts[id]}
              </span>
            </button>
          )
        })}
      </div>

      {tab === 'leads' ? (
        <LeadsTable
          leads={leads}
          showEntryUrl={isSeo}
          emptyMessage={isSeo ? 'No SEO leads in this period.' : 'No ads leads in this period.'}
        />
      ) : null}
      {tab === 'deals' ? (
        <DealsTable
          deals={deals}
          embedded
          showEntryUrl={isSeo}
          emptyMessage={isSeo ? 'No SEO deals in this period.' : 'No ads deals in this period.'}
        />
      ) : null}
      {tab === 'wins' ? (
        <DealsTable
          deals={wins}
          embedded
          showEntryUrl={isSeo}
          emptyMessage={isSeo ? 'No SEO wins in this period.' : 'No ads wins in this period.'}
        />
      ) : null}
    </section>
  )
}
