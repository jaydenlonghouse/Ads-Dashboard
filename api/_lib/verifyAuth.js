import { createClient } from '@supabase/supabase-js'

const ALLOWED_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN || 'longhouse.co').toLowerCase()

export function isAllowedEmail(email) {
  if (!email || typeof email !== 'string') return false
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)
}

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @returns {Promise<import('@supabase/supabase-js').User>}
 */
export async function verifyAuth(req) {
  const authHeader = req.headers.authorization ?? req.headers.Authorization
  if (!authHeader || !String(authHeader).startsWith('Bearer ')) {
    const err = new Error('Missing or invalid Authorization header')
    err.status = 401
    throw err
  }

  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    const err = new Error('Server auth is not configured')
    err.status = 500
    throw err
  }

  const token = String(authHeader).slice(7)
  const supabase = createClient(url, anonKey)
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    const err = new Error('Invalid or expired session')
    err.status = 401
    throw err
  }

  if (!isAllowedEmail(user.email)) {
    const err = new Error(`Access is restricted to @${ALLOWED_DOMAIN} Google Workspace accounts`)
    err.status = 403
    throw err
  }

  return user
}
