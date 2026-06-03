import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ToolAuthGate from './integrations/tool-auth/react/ToolAuthGate.jsx'
import App from './App.jsx'
import {
  hubUrl,
  supabaseAnonKey,
  supabaseUrl,
  toolSlug,
  useMockData,
} from './config/env.js'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5-minute cache: prevents re-fetching on tab switches / minor UI toggles
      staleTime: 5 * 60 * 1000,
      gcTime:    10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error?.status === 401 || error?.status === 403) return false
        // Don't retry on 404; let the Airtable client handle 429 internally
        if (error?.status === 404) return false
        return failureCount < 2
      },
    },
  },
})

function Root() {
  if (useMockData) {
    return (
      <AuthProvider>
        <App />
      </AuthProvider>
    )
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50 px-6">
        <p className="max-w-md text-center text-sm text-ink-700">
          Missing <code className="rounded bg-brand-100 px-1">VITE_SUPABASE_URL</code> or{' '}
          <code className="rounded bg-brand-100 px-1">VITE_SUPABASE_ANON_KEY</code> in{' '}
          <code className="rounded bg-brand-100 px-1">.env</code>. See README, or set{' '}
          <code className="rounded bg-brand-100 px-1">VITE_USE_MOCK=true</code> for demo mode.
        </p>
      </div>
    )
  }

  if (!toolSlug || !hubUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50 px-6">
        <p className="max-w-md text-center text-sm text-ink-700">
          Missing <code className="rounded bg-brand-100 px-1">VITE_TOOL_SLUG</code> or{' '}
          <code className="rounded bg-brand-100 px-1">VITE_HUB_URL</code> in{' '}
          <code className="rounded bg-brand-100 px-1">.env</code>. See tool-auth integration docs.
        </p>
      </div>
    )
  }

  return (
    <ToolAuthGate toolSlug={toolSlug} hubUrl={hubUrl}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToolAuthGate>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  </React.StrictMode>,
)
