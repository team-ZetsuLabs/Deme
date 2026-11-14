// Seul point d'accès réseau du back office. Les types de réponses viendront de api-types.ts
// (npm run gen:api) : chaque appelant précise le type attendu avec le paramètre générique.

export type ApiMode = 'mock' | 'live'

export type ApiErrorBody = {
  code: string
  message?: string
  fields?: Record<string, string>
}

export class ApiError extends Error {
  status: number
  code: string
  fields?: Record<string, string>

  constructor(status: number, code: string, message?: string, fields?: Record<string, string>) {
    super(message ?? code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  signal?: AbortSignal
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type MockLoader = () => Promise<unknown>

export type ApiConfig = {
  mode: ApiMode
  mocks: Record<string, MockLoader>
  fetchFn?: typeof fetch
  readCookie?: (name: string) => string | undefined
  /** Appelé quand l'API répond 401 sur une route qui exige une session (session expirée). */
  onUnauthorized?: () => void
}

const API_PREFIX = '/api/v1'
const CSRF_COOKIE = 'XSRF-TOKEN'
const CSRF_HEADER = 'X-XSRF-TOKEN'
/** Routes où un 401 veut dire « identifiants refusés » ou « pas de session », pas « session expirée ». */
const SESSION_ROUTES = ['/auth/login', '/auth/me', '/auth/logout', '/auth/csrf']

function defaultReadCookie(name: string): string | undefined {
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

/** "GET" + "/moderation/reports" devient "GET_moderation_reports" (nom du fichier de mocks/). */
export function mockKey(method: Method, path: string): string {
  return `${method}_${path.replace(/^\/+/, '').replace(/\/+/g, '_')}`
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value))
  }
  const qs = params.toString()
  return `${API_PREFIX}${path}${qs ? `?${qs}` : ''}`
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> = {}
  try {
    body = (await response.json()) as Partial<ApiErrorBody>
  } catch {
    // réponse sans JSON : on garde un code générique
  }
  return new ApiError(
    response.status,
    body.code ?? `HTTP_${response.status}`,
    body.message,
    body.fields,
  )
}

export function createApi(config: ApiConfig) {
  const fetchFn = config.fetchFn ?? ((...args) => fetch(...args))
  const readCookie = config.readCookie ?? defaultReadCookie
  let onUnauthorized = config.onUnauthorized

  /** Jeton CSRF : cookie XSRF-TOKEN, sinon demandé à GET /auth/csrf (premier appel avant toute écriture). */
  async function csrfHeader(): Promise<[string, string]> {
    const cookie = readCookie(CSRF_COOKIE)
    if (cookie) return [CSRF_HEADER, cookie]
    const response = await fetchFn(`${API_PREFIX}/auth/csrf`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw await toApiError(response)
    const body = (await response.json()) as { headerName: string; token: string }
    return [body.headerName, body.token]
  }

  async function request<T>(
    method: Method,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    if (config.mode === 'mock') {
      const loader = config.mocks[mockKey(method, path)]
      if (!loader) throw new ApiError(404, 'MOCK_NOT_FOUND', mockKey(method, path))
      return (await loader()) as T
    }

    const headers: Record<string, string> = { Accept: 'application/json' }
    if (options.body !== undefined) headers['Content-Type'] = 'application/json'
    if (method !== 'GET') {
      try {
        const [name, value] = await csrfHeader()
        headers[name] = value
      } catch (error) {
        if (error instanceof ApiError) throw error
        throw new ApiError(0, 'NETWORK_ERROR')
      }
    }

    let response: Response
    try {
      response = await fetchFn(buildUrl(path, options.query), {
        method,
        headers,
        credentials: 'same-origin',
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      throw new ApiError(0, 'NETWORK_ERROR')
    }

    if (!response.ok) {
      if (response.status === 401 && !SESSION_ROUTES.includes(path)) onUnauthorized?.()
      throw await toApiError(response)
    }
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  return {
    setOnUnauthorized(handler: (() => void) | undefined) {
      onUnauthorized = handler
    },
    get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
    post: <T>(path: string, options?: RequestOptions) => request<T>('POST', path, options),
    put: <T>(path: string, options?: RequestOptions) => request<T>('PUT', path, options),
    patch: <T>(path: string, options?: RequestOptions) => request<T>('PATCH', path, options),
    delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
  }
}

const mockFiles = import.meta.glob<unknown>('../mocks/*.json', {
  eager: false,
  import: 'default',
})

function toMockRegistry(files: Record<string, MockLoader>): Record<string, MockLoader> {
  const registry: Record<string, MockLoader> = {}
  for (const [file, loader] of Object.entries(files)) {
    const name = file
      .split('/')
      .pop()
      ?.replace(/\.json$/, '')
    if (name) registry[name] = loader
  }
  return registry
}

export const api = createApi({
  mode: import.meta.env.VITE_API_MODE === 'mock' ? 'mock' : 'live',
  mocks: toMockRegistry(mockFiles),
})
