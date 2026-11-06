/**
 * Persist the user's preferred date filter across visits (localStorage + Supabase user metadata).
 */

import { format, isValid, parseISO } from 'date-fns'

import { getSupabase } from '../lib/supabaseClient.js'
import { useMockData } from '../config/env.js'
import {
  DATE_PRESET_OPTIONS,
  clampDateRangeToDataEarliest,
  getDateRangeForCalendarMonth,
  getDateRangeForPreset,
} from './dateUtils.js'

export const DATE_DEFAULT_META_KEY = 'adsDashboardDateDefault'
const STORAGE_PREFIX = 'lh-ads-date-default:'
const LAST_STORAGE_KEY = `${STORAGE_PREFIX}last`

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'anon'}`
}

function isoDay(value) {
  if (!value) return null
  const d = value instanceof Date ? value : parseISO(String(value))
  if (!isValid(d)) return null
  return format(d, 'yyyy-MM-dd')
}

/**
 * @param {{ presetId: string, calendarMonth?: number, calendarYear?: number, start?: Date|string, end?: Date|string }} state
 */
export function snapshotDateDefault(state) {
  const presetId = state.presetId
  if (!presetId) return null
  const snap = { presetId }
  if (presetId === 'selectMonth') {
    snap.calendarMonth = state.calendarMonth
    snap.calendarYear = state.calendarYear
  }
  if (presetId === 'custom') {
    snap.start = isoDay(state.start ?? state.dateRange?.start)
    snap.end = isoDay(state.end ?? state.dateRange?.end)
  }
  return snap
}

export function readLocalDateDefault(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeJson(key, pref) {
  if (!pref) localStorage.removeItem(key)
  else localStorage.setItem(key, JSON.stringify(pref))
}

export function writeLocalDateDefault(userId, pref) {
  try {
    writeJson(storageKey(userId), pref)
    writeJson(LAST_STORAGE_KEY, pref)
  } catch {
    /* ignore quota / private mode */
  }
}

/** Last saved default on this browser — used to avoid a last-90 flash before session loads. */
export function readBootstrapDateDefault() {
  try {
    const raw = localStorage.getItem(LAST_STORAGE_KEY)
    if (!raw) return readLocalDateDefault(null)
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : readLocalDateDefault(null)
  } catch {
    return readLocalDateDefault(null)
  }
}

export function readDateDefaultFromUser(user) {
  const fromMeta = user?.user_metadata?.[DATE_DEFAULT_META_KEY]
  if (fromMeta && typeof fromMeta === 'object' && fromMeta.presetId) return fromMeta
  return readLocalDateDefault(user?.id)
}

/**
 * Save or clear the default. Writes localStorage immediately; best-effort sync to the user account.
 */
export async function persistDateDefault(userId, pref) {
  writeLocalDateDefault(userId, pref)
  if (useMockData || !userId) return
  try {
    const supabase = getSupabase()
    await supabase.auth.updateUser({
      data: { [DATE_DEFAULT_META_KEY]: pref ?? null },
    })
  } catch {
    /* local copy still applies on this browser */
  }
}

/**
 * Turn a saved snapshot into live picker state (rolling presets recompute from today).
 */
export function applyDateDefault(pref, refDate = new Date()) {
  if (!pref?.presetId) return null
  const known = DATE_PRESET_OPTIONS.some(o => o.id === pref.presetId) || pref.presetId === 'custom'
  if (!known) return null

  if (pref.presetId === 'selectMonth') {
    const month = Number(pref.calendarMonth)
    const year = Number(pref.calendarYear)
    if (!month || !year) return null
    return {
      presetId: 'selectMonth',
      dateRange: getDateRangeForCalendarMonth(year, month, refDate),
      calendarMonth: month,
      calendarYear: year,
    }
  }

  if (pref.presetId === 'custom') {
    const start = parseISO(String(pref.start ?? ''))
    const end = parseISO(String(pref.end ?? ''))
    if (!isValid(start) || !isValid(end)) return null
    return {
      presetId: 'custom',
      dateRange: clampDateRangeToDataEarliest({ start, end }, refDate),
    }
  }

  return {
    presetId: pref.presetId,
    dateRange: getDateRangeForPreset(pref.presetId, refDate),
  }
}

export function isDateDefaultMatch(pref, state) {
  if (!pref?.presetId || pref.presetId !== state.presetId) return false
  if (state.presetId === 'selectMonth') {
    return (
      Number(pref.calendarMonth) === Number(state.calendarMonth) &&
      Number(pref.calendarYear) === Number(state.calendarYear)
    )
  }
  if (state.presetId === 'custom') {
    return (
      pref.start === isoDay(state.dateRange?.start) && pref.end === isoDay(state.dateRange?.end)
    )
  }
  return DATE_PRESET_OPTIONS.some(o => o.id === pref.presetId)
}
