/**
 * components/DateRangePicker.jsx
 *
 * Popover date picker: preset list (existing DATE_PRESET_OPTIONS) + calendar,
 * Longhouse brand styling (inspired by modern range-picker layout).
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
  min as minDate,
  max as maxDate,
} from 'date-fns'
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react'

import {
  DATE_PRESET_OPTIONS,
  CALENDAR_MONTH_OPTIONS,
  DATA_EARLIEST_DATE,
  getDataLatestDay,
  getCalendarYearOptions,
  getDateRangeForCalendarMonth,
  isCalendarMonthFullyBeforeData,
  isCalendarMonthFullyAfterLatest,
  clampCalendarMonthForYear,
  formatDateRange,
} from '../utils/dateUtils.js'

const WEEK_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function clampWeekGridStart(weekMonday) {
  const w = startOfWeek(startOfDay(weekMonday), { weekStartsOn: 1 })
  const minWs = startOfWeek(DATA_EARLIEST_DATE, { weekStartsOn: 1 })
  const maxWs = startOfWeek(getDataLatestDay(), { weekStartsOn: 1 })
  if (isBefore(w, minWs)) return minWs
  if (isAfter(w, maxWs)) return maxWs
  return w
}

/** Six rows starting Monday `weekMonday` (inclusive). */
function buildCalendarGridFromWeekStart(weekMonday) {
  const gridStart = startOfWeek(startOfDay(weekMonday), { weekStartsOn: 1 })
  const days = []
  let d = gridStart
  for (let i = 0; i < 42; i++) {
    days.push(d)
    d = addDays(d, 1)
  }
  return days
}

/** Classic month grid (first row = week containing the 1st). */
function buildCalendarGridForMonth(monthAnchor) {
  const mStart = startOfMonth(monthAnchor)
  const gridStart = startOfWeek(mStart, { weekStartsOn: 1 })
  const days = []
  let d = gridStart
  for (let i = 0; i < 42; i++) {
    days.push(d)
    d = addDays(d, 1)
  }
  return days
}

export default function DateRangePicker({
  presetId,
  dateRange,
  calendarMonth,
  calendarYear,
  onPresetChange,
  onRangeChange,
  onCalendarMonthYearChange,
  /** @type {'default' | 'sheet'} */
  variant = 'default',
  open: controlledOpen,
  onOpenChange,
}) {
  const { start, end } = dateRange
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  function setOpen(next) {
    const value = typeof next === 'function' ? next(open) : next
    if (onOpenChange) onOpenChange(value)
    else setInternalOpen(value)
  }

  const isSheet = variant === 'sheet'
  const [gridWeekStart, setGridWeekStart] = useState(() =>
    clampWeekGridStart(startOfWeek(startOfDay(end), { weekStartsOn: 1 })),
  )
  const [customClick, setCustomClick] = useState(null)
  const rootRef = useRef(null)
  const calendarPanelRef = useRef(null)
  const shiftWeekRef = useRef(() => {})

  const selectMonthView = useMemo(
    () => new Date(calendarYear, calendarMonth - 1, 1),
    [calendarYear, calendarMonth],
  )

  const focusMonthForMute = useMemo(() => {
    if (presetId === 'selectMonth') return selectMonthView
    return startOfMonth(addDays(gridWeekStart, 20))
  }, [presetId, selectMonthView, gridWeekStart])

  const calendarHeading = useMemo(() => {
    if (presetId === 'selectMonth') return format(selectMonthView, 'MMMM yyyy')
    const a = gridWeekStart
    const b = addDays(gridWeekStart, 41)
    if (isSameMonth(a, b)) return `${format(a, 'MMMM d')} – ${format(b, 'd, yyyy')}`
    return `${format(a, 'MMM d')} – ${format(b, 'MMM d, yyyy')}`
  }, [presetId, selectMonthView, gridWeekStart])

  useEffect(() => {
    if (!open || isSheet) return
    function onDocMouseDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, isSheet])

  useEffect(() => {
    if (!open) setCustomClick(null)
  }, [open])

  useEffect(() => {
    if (presetId === 'selectMonth') return
    setGridWeekStart(clampWeekGridStart(startOfWeek(startOfDay(end), { weekStartsOn: 1 })))
  }, [end, presetId])

  const gridDays = useMemo(() => {
    if (presetId === 'selectMonth') return buildCalendarGridForMonth(selectMonthView)
    return buildCalendarGridFromWeekStart(gridWeekStart)
  }, [presetId, selectMonthView, gridWeekStart])

  const rangeInterval = useMemo(
    () => ({ start: startOfDay(start), end: endOfDay(end) }),
    [start, end],
  )

  const dayMeta = useCallback(
    day => {
      const d0 = startOfDay(day)
      const inRange = isWithinInterval(d0, rangeInterval)
      const isStart = isSameDay(d0, start)
      const isEnd = isSameDay(d0, end)
      const muted = !isSameMonth(day, focusMonthForMute)
      return { inRange, isStart, isEnd, muted }
    },
    [rangeInterval, start, end, focusMonthForMute],
  )

  function shiftWeek(delta) {
    setGridWeekStart(prev => clampWeekGridStart(addDays(prev, delta * 7)))
  }

  function shiftDisplayMonth(delta) {
    const next = addMonths(selectMonthView, delta)
    const earliest = startOfMonth(DATA_EARLIEST_DATE)
    const latestMonthStart = startOfMonth(getDataLatestDay())
    const nextStart = startOfMonth(next)
    let clamped = nextStart
    if (isBefore(nextStart, earliest)) clamped = earliest
    if (isAfter(nextStart, latestMonthStart)) clamped = latestMonthStart
    onCalendarMonthYearChange(clamped.getMonth() + 1, clamped.getFullYear())
  }

  function goThisMonth() {
    const n = new Date()
    if (presetId === 'selectMonth') {
      const y = n.getFullYear()
      const m = clampCalendarMonthForYear(y, n.getMonth() + 1, n)
      onCalendarMonthYearChange(m, y)
    } else {
      setGridWeekStart(clampWeekGridStart(startOfWeek(startOfDay(n), { weekStartsOn: 1 })))
    }
  }

  function applyPreset(id) {
    onPresetChange(id)
    setCustomClick(null)
    if (id !== 'selectMonth') setOpen(false)
  }

  function pickerDayDisabled(day) {
    const d0 = startOfDay(day)
    const latest = getDataLatestDay()
    if (isBefore(d0, DATA_EARLIEST_DATE) || isAfter(d0, latest)) return true
    if (presetId === 'selectMonth') {
      const mStart = startOfMonth(day)
      if (isBefore(endOfMonth(day), DATA_EARLIEST_DATE)) return true
      if (isAfter(mStart, latest)) return true
    }
    return false
  }

  function handleDayClick(day) {
    if (pickerDayDisabled(day)) return
    if (presetId === 'selectMonth') {
      onPresetChange('selectMonth')
      onCalendarMonthYearChange(day.getMonth() + 1, day.getFullYear())
      const r = getDateRangeForCalendarMonth(day.getFullYear(), day.getMonth() + 1)
      onRangeChange(r)
      setOpen(false)
      return
    }

    const clicked = startOfDay(day)

    if (presetId !== 'custom') onPresetChange('custom')
    if (!customClick) {
      setCustomClick(clicked)
      onRangeChange({ start: clicked, end: clicked })
      return
    }
    const a = customClick
    const b = clicked
    const lo = minDate([a, b])
    const hi = maxDate([a, b])
    onRangeChange({ start: startOfDay(lo), end: endOfDay(hi) })
    setCustomClick(null)
    setOpen(false)
  }

  const triggerPrimary = useMemo(() => {
    if (presetId === 'yesterday') return 'Yesterday'
    const opt = DATE_PRESET_OPTIONS.find(o => o.id === presetId)
    if (presetId === 'selectMonth') {
      const mo = CALENDAR_MONTH_OPTIONS.find(m => m.value === calendarMonth)
      return `${mo?.label ?? ''} ${calendarYear}`
    }
    if (presetId === 'custom') return formatDateRange(start, end)
    if (opt) return opt.subLabel ? `${opt.label} ${opt.subLabel}` : opt.label
    return format(start, 'MMM d') + ' – ' + format(end, 'MMM d')
  }, [presetId, calendarMonth, calendarYear, start, end])

  const yearOptions = getCalendarYearOptions()

  shiftWeekRef.current = shiftWeek

  useEffect(() => {
    if (!open) return
    if (presetId === 'selectMonth') return
    const el = calendarPanelRef.current
    if (!el) return
    function onWheel(e) {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return
      if (Math.abs(e.deltaY) < 2) return
      e.preventDefault()
      e.stopPropagation()
      const dir = e.deltaY > 0 ? 1 : -1
      shiftWeekRef.current(dir)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [open, presetId])

  const panel = open ? (
        <div
          role="dialog"
          aria-label="Date range"
          className={
            isSheet
              ? 'w-full max-h-[min(52vh,420px)] overflow-hidden rounded-xl border border-brand-100 bg-white shadow-2xl'
              : 'absolute left-0 right-0 z-[90] mt-2 w-full max-w-[calc(100vw-2rem)] rounded-xl border border-brand-100 bg-white shadow-xl sm:left-auto sm:right-0 sm:w-[min(calc(100vw-1.5rem),36rem)]'
          }
        >
          <div
            className={`flex max-h-[min(70vh,520px)] flex-col ${isSheet ? 'max-h-[min(48vh,400px)]' : 'sm:flex-row sm:max-h-none'}`}
          >
            {/* Presets */}
            <div className="max-h-48 shrink-0 overflow-y-auto border-b border-brand-100 sm:max-h-none sm:w-[11.5rem] sm:border-b-0 sm:border-r sm:border-brand-100">
              <ul className="py-1">
                {DATE_PRESET_OPTIONS.map(({ id, label, subLabel }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => applyPreset(id)}
                      className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition-colors ${
                        presetId === id
                          ? 'bg-brand-100 font-semibold text-brand-900'
                          : 'text-ink-700 hover:bg-brand-50'
                      }`}
                    >
                      <span className="min-w-0 leading-snug">{label}</span>
                      {subLabel ? (
                        <span className="text-[11px] font-normal leading-snug text-ink-400">{subLabel}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Calendar — scroll moves by week (except Select month, which stays month-based) */}
            <div
              ref={calendarPanelRef}
              className="min-w-0 flex-1 p-3"
              title={presetId === 'selectMonth' ? undefined : 'Scroll to move by week'}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink-900">{calendarHeading}</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={goThisMonth}
                    className="rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    aria-label={presetId === 'selectMonth' ? 'Previous month' : 'Previous week'}
                    className="rounded p-1 text-ink-500 hover:bg-brand-50 hover:text-ink-800"
                    onClick={() => (presetId === 'selectMonth' ? shiftDisplayMonth(-1) : shiftWeek(-1))}
                  >
                    <ChevronUp size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label={presetId === 'selectMonth' ? 'Next month' : 'Next week'}
                    className="rounded p-1 text-ink-500 hover:bg-brand-50 hover:text-ink-800"
                    onClick={() => (presetId === 'selectMonth' ? shiftDisplayMonth(1) : shiftWeek(1))}
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
              </div>

              {presetId === 'selectMonth' && (
                <div className="mb-3 flex flex-wrap gap-2">
                  <select
                    value={calendarMonth}
                    onChange={e =>
                      onCalendarMonthYearChange(
                        clampCalendarMonthForYear(calendarYear, Number(e.target.value), new Date()),
                        calendarYear,
                      )
                    }
                    aria-label="Month"
                    className="min-w-[7rem] flex-1 rounded-lg border border-brand-100 bg-white px-2 py-1.5 text-xs text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {CALENDAR_MONTH_OPTIONS.map(({ value, label: lb }) => (
                      <option key={value} value={value} disabled={isCalendarMonthFullyBeforeData(calendarYear, value) || isCalendarMonthFullyAfterLatest(calendarYear, value)}>
                        {lb}
                      </option>
                    ))}
                  </select>
                  <select
                    value={calendarYear}
                    onChange={e => {
                      const y = Number(e.target.value)
                      const m = clampCalendarMonthForYear(y, calendarMonth, new Date())
                      onCalendarMonthYearChange(m, y)
                    }}
                    aria-label="Year"
                    className="w-24 rounded-lg border border-brand-100 bg-white px-2 py-1.5 text-xs text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {yearOptions.map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-7 gap-1">
                {WEEK_LABELS.map(w => (
                  <div key={w} className="pb-1 text-center text-[10px] font-medium text-ink-400">
                    {w}
                  </div>
                ))}
                {gridDays.map(day => {
                  const { inRange, isStart, isEnd, muted } = dayMeta(day)
                  const dayBlocked = pickerDayDisabled(day)
                  let cell =
                    'flex h-8 w-full items-center justify-center rounded-full text-xs font-medium transition-colors '
                  if (dayBlocked) cell += 'cursor-not-allowed text-ink-300 opacity-45 '
                  else if (muted) cell += 'text-ink-300 '
                  else cell += 'text-ink-800 '

                  if (!dayBlocked && (isStart || isEnd)) {
                    cell += 'bg-brand-800 text-white shadow-sm '
                  } else if (!dayBlocked && inRange) {
                    cell += 'rounded-md bg-brand-100 text-brand-900 '
                  } else if (!dayBlocked && !muted) {
                    cell += 'hover:bg-brand-50 '
                  } else if (!dayBlocked) {
                    cell += 'hover:bg-brand-50/60 '
                  }

                  const canClick = !dayBlocked

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={!canClick}
                      onClick={() => handleDayClick(day)}
                      className={
                        cell +
                        (!canClick ? 'cursor-default' : 'cursor-pointer')
                      }
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null

  if (isSheet) {
    return <div ref={rootRef}>{panel}</div>
  }

  return (
    <div ref={rootRef} className="relative min-w-0 max-w-full">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(o => !o)}
        className="inline-flex h-10 max-w-full items-center gap-2 rounded-lg border border-brand-100 bg-white px-3 text-sm shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <Calendar size={16} className="shrink-0 text-brand-600" aria-hidden />
        <span className="min-w-0 flex-1 text-left text-sm font-medium leading-snug text-ink-800">
          {triggerPrimary}
        </span>
        <ChevronDown size={16} className="shrink-0 text-ink-400" aria-hidden />
      </button>
      {panel}
    </div>
  )
}
