import { getSupabase } from '../../../lib/supabaseClient.js'

let recoveryInFlight = false

/**
 * Clear local auth state and send the user back to the Tools Hub to sign in again.
 * @param {string} hubUrl
 */
export async function clearSessionAndRedirectToHub(hubUrl) {
  if (recoveryInFlight) return
  recoveryInFlight = true

  try {
    const supabase = getSupabase()
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    /* ignore */
  }

  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }

  const base = (hubUrl ?? '').replace(/\/$/, '')
  window.location.replace(base || '/')
}

/**
 * @param {number} status
 * @param {string | undefined} message
 */
export function isSessionAuthFailure(status, message) {
  if (status !== 401) return false
  const normalized = (message ?? '').toLowerCase()
  return (
    normalized.includes('invalid or expired session') ||
    normalized.includes('missing or invalid authorization') ||
    normalized.includes('invalid session')
  )
}
