import { getSupabase } from '../../../lib/supabaseClient.js'

/**
 * @param {{ supabaseUrl: string, supabaseAnonKey: string }} config
 */
export function createToolSupabase({ supabaseUrl, supabaseAnonKey }) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Use the same values as the Tools Hub.',
    )
  }
  return getSupabase()
}

/** Reset singleton (useful in tests). */
export function resetToolSupabaseClient() {
  // App singleton lives in lib/supabaseClient.js; no-op here for kit API compatibility.
}
