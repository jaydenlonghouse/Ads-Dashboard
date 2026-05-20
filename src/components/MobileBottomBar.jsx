/**
 * Fixed bottom controls on mobile: Ask, Dates, Platform.
 */

import { useEffect, useState } from 'react'
import { Calendar, LayoutGrid, Mail } from 'lucide-react'

import DateRangePicker from './DateRangePicker.jsx'
import { GoogleLogo, MetaLogo } from './PlatformLogos.jsx'

const PLATFORM_TABS = [
  { id: 'All', label: 'All Platforms', short: 'All' },
  { id: 'Google', label: 'Google', short: 'Google' },
  { id: 'Meta', label: 'Meta', short: 'Meta' },
]

/**
 * @param {object} props
 * @param {string} props.platformTab
 * @param {(id: string) => void} props.onPlatformChange
 * @param {string} props.dateSummary
 * @param {boolean} props.askDisabled
 * @param {string} props.askHref
 * @param {object} props.datePickerProps — passed to DateRangePicker
 */
export default function MobileBottomBar({
  platformTab,
  onPlatformChange,
  dateSummary,
  askDisabled,
  askHref,
  datePickerProps,
}) {
  const [activePanel, setActivePanel] = useState(null)

  useEffect(() => {
    if (!activePanel) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [activePanel])

  function closePanels() {
    setActivePanel(null)
  }

  function toggle(panel) {
    setActivePanel(current => (current === panel ? null : panel))
  }

  const platformShort =
    PLATFORM_TABS.find(t => t.id === platformTab)?.short ?? platformTab

  return (
    <>
      {activePanel ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[105] bg-ink-900/40 md:hidden"
          onClick={closePanels}
        />
      ) : null}

      {activePanel === 'date' ? (
        <div
          className="fixed inset-x-3 z-[110] bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:hidden"
          role="presentation"
          onClick={e => e.stopPropagation()}
        >
          <DateRangePicker
            {...datePickerProps}
            variant="sheet"
            open
            onOpenChange={next => {
              if (!next) closePanels()
            }}
          />
        </div>
      ) : null}

      {activePanel === 'platform' ? (
        <div
          className="fixed inset-x-3 z-[110] bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] rounded-xl border border-brand-100 bg-white p-3 shadow-2xl md:hidden"
          role="dialog"
          aria-label="Platform"
          onClick={e => e.stopPropagation()}
        >
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Platform
          </p>
          <ul className="flex flex-col gap-1.5">
            {PLATFORM_TABS.map(({ id, label }) => {
              const selected = platformTab === id
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      onPlatformChange(id)
                      closePanels()
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors ${
                      selected
                        ? 'border-brand-800 bg-brand-800 text-white'
                        : 'border-brand-100 bg-white text-ink-800 hover:bg-brand-50'
                    }`}
                  >
                    <PlatformBarIcon id={id} selected={selected} />
                    <span>{label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-[120] border-t border-brand-100 bg-white/95 shadow-[0_-4px_24px_rgba(2,22,61,0.08)] backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] md:hidden"
        aria-label="Dashboard controls"
      >
        <div className="mx-auto grid max-w-lg grid-cols-3 divide-x divide-brand-100">
          <BarButton
            label="Ask"
            active={false}
            disabled={askDisabled}
            onClick={() => {
              if (!askDisabled && askHref) {
                window.open(askHref, '_blank', 'noopener,noreferrer')
              }
            }}
          >
            <Mail size={20} className="shrink-0" aria-hidden />
          </BarButton>

          <BarButton
            label="Dates"
            sublabel={dateSummary}
            active={activePanel === 'date'}
            onClick={() => toggle('date')}
          >
            <Calendar size={20} className="shrink-0" aria-hidden />
          </BarButton>

          <BarButton
            label="Platform"
            sublabel={platformShort}
            active={activePanel === 'platform'}
            onClick={() => toggle('platform')}
          >
            <LayoutGrid size={20} className="shrink-0" aria-hidden />
          </BarButton>
        </div>
      </nav>
    </>
  )
}

function BarButton({ label, sublabel, active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-2 py-2 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 disabled:opacity-45 ${
        active ? 'bg-brand-50 text-brand-900' : 'text-ink-700 hover:bg-brand-50/80'
      }`}
    >
      {children}
      <span className="text-[11px] font-semibold leading-tight">{label}</span>
      {sublabel ? (
        <span className="max-w-full truncate px-1 text-[10px] font-normal leading-tight text-ink-500">
          {sublabel}
        </span>
      ) : null}
    </button>
  )
}

function PlatformBarIcon({ id, selected }) {
  const className = 'h-5 w-5 shrink-0'
  if (id === 'Google') return <GoogleLogo className={className} />
  if (id === 'Meta') return <MetaLogo className={className} />
  return (
    <LayoutGrid
      className={`${className} ${selected ? 'text-white' : 'text-ink-500'}`}
      strokeWidth={2}
      aria-hidden
    />
  )
}
