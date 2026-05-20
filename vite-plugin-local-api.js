/**
 * Serves /api/* during `npm run dev` (Vite-only) using the same handlers as Vercel.
 * Production and `vercel dev` use Vercel serverless routes instead.
 */

import { loadEnv } from 'vite'
import recordsHandler from './api/records.js'
import dealsHandler from './api/deals.js'

const ROUTES = {
  '/api/records': recordsHandler,
  '/api/deals': dealsHandler,
}

function createVercelResponse(nodeRes) {
  let statusCode = 200
  const headers = {}

  return {
    status(code) {
      statusCode = code
      return this
    },
    setHeader(key, value) {
      headers[key] = value
    },
    json(data) {
      nodeRes.statusCode = statusCode
      nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8')
      for (const [key, value] of Object.entries(headers)) {
        nodeRes.setHeader(key, value)
      }
      nodeRes.end(JSON.stringify(data))
    },
  }
}

function createVercelRequest(nodeReq) {
  const url = new URL(nodeReq.url ?? '/', 'http://localhost')
  return {
    method: nodeReq.method,
    headers: nodeReq.headers,
    query: Object.fromEntries(url.searchParams),
  }
}

function applyServerEnv(env) {
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('AIRTABLE_') || key.startsWith('SUPABASE_') || key === 'ALLOWED_EMAIL_DOMAIN') {
      process.env[key] = value
    }
  }
}

export function localApiPlugin() {
  return {
    name: 'longhouse-local-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.envDir, '')
      applyServerEnv(env)

      server.middlewares.use(async (nodeReq, nodeRes, next) => {
        const pathname = nodeReq.url?.split('?')[0] ?? ''
        const handler = ROUTES[pathname]
        if (!handler) return next()

        try {
          const req = createVercelRequest(nodeReq)
          const res = createVercelResponse(nodeRes)
          await handler(req, res)
        } catch (err) {
          nodeRes.statusCode = 500
          nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8')
          nodeRes.end(
            JSON.stringify({ error: err?.message ?? 'Local API middleware error' }),
          )
        }
      })
    },
  }
}
