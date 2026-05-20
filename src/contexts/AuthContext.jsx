import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getSupabase } from '../lib/supabaseClient.js'
import { isAllowedEmail } from '../lib/authUtils.js'
import { allowedEmailDomain, useMockData } from '../config/env.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(!useMockData)
  const [authError, setAuthError] = useState(null)

  const rejectIfNotAllowed = useCallback(async user => {
    if (!user?.email || !isAllowedEmail(user.email)) {
      const supabase = getSupabase()
      await supabase.auth.signOut()
      setSession(null)
      setAuthError(
        `Sign in with your @${allowedEmailDomain} Google Workspace account.`,
      )
      return false
    }
    setAuthError(null)
    return true
  }, [])

  useEffect(() => {
    if (useMockData) {
      setLoading(false)
      return undefined
    }

    const supabase = getSupabase()

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s?.user) {
        const ok = await rejectIfNotAllowed(s.user)
        setSession(ok ? s : null)
      } else {
        setSession(null)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (s?.user) {
        const ok = await rejectIfNotAllowed(s.user)
        setSession(ok ? s : null)
      } else {
        setSession(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [rejectIfNotAllowed])

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null)
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          hd: allowedEmailDomain,
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) setAuthError(error.message)
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    setSession(null)
    setAuthError(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      loading,
      authError,
      signInWithGoogle,
      signOut,
      accessToken: session?.access_token ?? null,
    }),
    [session, loading, authError, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
