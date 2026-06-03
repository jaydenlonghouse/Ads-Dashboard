/**
 * Authenticated fetches to Vercel /api routes (Airtable proxy).
 */

import { hubUrl, useMockData } from '../config/env.js'
import {
  clearSessionAndRedirectToHub,
  isSessionAuthFailure,
} from '../integrations/tool-auth/lib/clearSessionAndRedirectToHub.js'

async function readJsonSafe(res) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    const preview = text.trim().slice(0, 80)
    const looksLikeHtml = preview.startsWith('<!') || preview.startsWith('<')
    const hint = looksLikeHtml
      ? 'The API route is not available. Use `npm run dev` (with local API plugin) or `npm run dev:full` for live data.'
      : 'The server returned a non-JSON response.'
    throw Object.assign(new Error(`${hint} (${res.status})`), { status: res.status })
  }
}

async function apiGet(path, accessToken) {
  const res = await fetch(path, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const body = await readJsonSafe(res)

  if (!res.ok) {
    const message = body?.error ?? res.statusText ?? 'API request failed'
    if (!useMockData && isSessionAuthFailure(res.status, message)) {
      await clearSessionAndRedirectToHub(hubUrl)
      throw Object.assign(new Error('Redirecting to Tools Hub…'), { status: res.status })
    }
    throw Object.assign(new Error(message), { status: res.status })
  }

  return body
}

export function fetchAllRecords(accessToken) {
  return apiGet('/api/records', accessToken)
}

export function fetchAllDeals(accessToken) {
  return apiGet('/api/deals', accessToken)
}
