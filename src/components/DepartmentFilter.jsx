/**
 * Ads / SEO department switcher for the dashboard header.
 */

const TABS = [
  { id: 'ads', label: 'Ads' },
  { id: 'seo', label: 'SEO' },
]

/**
 * @param {{ selected: 'ads' | 'seo', onChange: (id: 'ads' | 'seo') => void, variant?: 'header' | 'light' }} props
 */
export default function DepartmentFilter({ selected, onChange, variant = 'header' }) {
  const isHeader = variant === 'header'

  return (
    <div
      className={`inline-flex shrink-0 items-center gap-1 rounded-xl p-1 ${
        isHeader ? 'bg-black/20' : 'border border-brand-100 bg-white'
      }`}
      role="group"
      aria-label="Department"
    >
      {TABS.map(({ id, label }) => {
        const active = selected === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90 ${
              active
                ? isHeader
                  ? 'bg-white text-brand-900 shadow-sm'
                  : 'bg-brand-800 text-white'
                : isHeader
                  ? 'text-white/80 hover:bg-white/10 hover:text-white'
                  : 'text-ink-600 hover:bg-brand-50'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
