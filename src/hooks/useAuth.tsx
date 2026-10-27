import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, ApiError } from '../api/api'
import { authApi } from '../api/endpoints'
import type { Me } from '../api/types'

export type Access = 'staff' | 'referent'

type AuthStatus = 'loading' | 'ready'

type AuthContextValue = {
  status: AuthStatus
  me: Me | null
  /** « staff » : Modérateur ou Administrateur ; « referent » : Référent sans rôle d'équipe. */
  access: Access | null
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function accessOf(me: Me | null): Access | null {
  if (!me) return null
  if (me.role === 'ADMIN' || me.role === 'MODERATOR') return 'staff'
  if (me.level === 'REFERENT') return 'referent'
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    authApi
      .me({ signal: controller.signal })
      .then((member) => setMe(member))
      .catch(() => setMe(null))
      .finally(() => {
        if (!controller.signal.aborted) setStatus('ready')
      })
    api.setOnUnauthorized(() => setMe(null))
    return () => {
      controller.abort()
      api.setOnUnauthorized(undefined)
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const member = await authApi.login(email, password)
    if (!accessOf(member)) {
      await authApi.logout().catch(() => {})
      throw new ApiError(403, 'NOT_STAFF')
    }
    setMe(member)
  }, [])

  const signOut = useCallback(async () => {
    await authApi.logout().catch(() => {})
    setMe(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, me, access: accessOf(me), isAdmin: me?.role === 'ADMIN', signIn, signOut }),
    [status, me, signIn, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
