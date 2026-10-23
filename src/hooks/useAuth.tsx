import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type AuthContextValue = { loggedIn: boolean; signIn: () => void; signOut: () => void }

const AuthContext = createContext<AuthContextValue | null>(null)

/** Session de démonstration en mémoire, remplacée par la vraie session (cookie) avec l'API. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false)
  const signIn = useCallback(() => setLoggedIn(true), [])
  const signOut = useCallback(() => setLoggedIn(false), [])
  const value = useMemo(() => ({ loggedIn, signIn, signOut }), [loggedIn, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
