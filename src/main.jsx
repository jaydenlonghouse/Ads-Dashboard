import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext.jsx'
import AuthGate from './components/AuthGate.jsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5-minute cache: prevents re-fetching on tab switches / minor UI toggles
      staleTime: 5 * 60 * 1000,
      gcTime:    10 * 60 * 1000,
      retry: (failureCount, error) => {
        // Don't retry on 404; let the Airtable client handle 429 internally
        if (error?.status === 404) return false
        return failureCount < 2
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
