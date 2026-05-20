/**
 * components/PlatformFilter.jsx
 *
 * All Platforms / Google / Meta segmented control with brand marks.
 * Uses `.dashboardPill` / `.dashboardPillSelected` in index.css.
 */

import { LayoutGrid } from 'lucide-react'

import { GoogleLogo, MetaLogo } from './PlatformLogos.jsx'

const TABS = [
  { id: 'All', label: 'All Platforms' },
  { id: 'Google', label: 'Google' },
  { id: 'Meta', label: 'Meta' },
]

function TabIcon({ id, selected }) {
  const iconClass = 'h-4 w-4 shrink-0'
  if (id === 'All') {
    return (
      <LayoutGrid
        className={`${iconClass} ${selected ? 'text-white' : 'text-ink-500'}`}
        strokeWidth={2}
        aria-hidden
      />
    )
  }
  if (id === 'Google') return <GoogleLogo className={iconClass} />
  if (id === 'Meta') return <MetaLogo className={iconClass} />
  return null
}

export default function PlatformFilter({ selected, onChange }) {
  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
      <span className="text-xs text-ink-400 mr-1">Platform</span>
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={selected === id}
          onClick={() => onChange(id)}
          className={`dashboardPill text-xs ${selected === id ? 'dashboardPillSelected' : ''}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <TabIcon id={id} selected={selected === id} />
            <span>{label}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
