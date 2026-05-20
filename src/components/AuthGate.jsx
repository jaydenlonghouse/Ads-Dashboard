import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabaseAnonKey, supabaseUrl, useMockData } from '../config/env.js'
import LoginPage from '../pages/LoginPage.jsx'
import App from '../App.jsx'

export default function AuthGate() {
  const { session, loading, authError, signInWithGoogle } = useAuth()
  const [signingIn, setSigningIn] = useState(false)

  if (useMockData) {
    return <App />
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center px-6">
        <p className="max-w-md text-center text-sm text-ink-700">
          Missing <code className="bg-brand-100 px-1 rounded">VITE_SUPABASE_URL</code> or{' '}
          <code className="bg-brand-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in{' '}
          <code className="bg-brand-100 px-1 rounded">.env</code>. See README, or set{' '}
          <code className="bg-brand-100 px-1 rounded">VITE_USE_MOCK=true</code> for demo mode.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <p className="text-sm text-ink-600">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <LoginPage
        error={authError}
        signingIn={signingIn}
        onSignIn={async () => {
          setSigningIn(true)
          try {
            await signInWithGoogle()
          } finally {
            setSigningIn(false)
          }
        }}
      />
    )
  }

  return <App />
}
