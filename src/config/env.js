/**
 * Central access to Vite environment variables (VITE_*).
 * Copy .env.example → .env and set values there — do not hardcode secrets in source.
 *
 * Airtable credentials belong in server env (AIRTABLE_*) for Vercel API routes only.
 */

import { isValid, parseISO, startOfDay } from 'date-fns'

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()
export const allowedEmailDomain = (
  import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ?? 'longhouse.co'
).trim().toLowerCase()

/** Must match slug in Tools Hub → Manage Tools (e.g. ads-dashboard). */
export const toolSlug = (import.meta.env.VITE_TOOL_SLUG ?? '').trim()

/** Tools Hub URL — used when access is denied. */
export const hubUrl = (import.meta.env.VITE_HUB_URL ?? '').trim()

export const questionEmailTo = (import.meta.env.VITE_QUESTION_EMAIL_TO ?? '').trim()
export const questionEmailSubject = (import.meta.env.VITE_QUESTION_EMAIL_SUBJECT ?? '').trim()

/** Mock data + no login — for local UI dev only. */
export const useMockData = import.meta.env.VITE_USE_MOCK === 'true'

function parseDataEarliestDate() {
  const raw = (import.meta.env.VITE_DATA_EARLIEST_DATE ?? '').trim()
  if (!raw) {
    throw new Error(
      'Missing VITE_DATA_EARLIEST_DATE in .env (YYYY-MM-DD). See .env.example.',
    )
  }
  const d = parseISO(raw)
  if (!isValid(d)) {
    throw new Error(`Invalid VITE_DATA_EARLIEST_DATE "${raw}" — use YYYY-MM-DD.`)
  }
  return startOfDay(d)
}

/** First calendar day we have reporting data for (inclusive). */
export const DATA_EARLIEST_DATE = parseDataEarliestDate()
