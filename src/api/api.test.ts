import { ApiError, createApi, mockKey } from './api'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('mockKey', () => {
  it('construit le nom du fichier de mocks', () => {
    expect(mockKey('GET', '/reports')).toBe('GET_reports')
    expect(mockKey('POST', '/moderation/reports/12/decision')).toBe(
      'POST_moderation_reports_12_decision',
    )
  })
})

describe('createApi en mode mock', () => {
  const api = createApi({
    mode: 'mock',
    mocks: { GET_reports: async () => ({ items: [], page: 0, size: 20, total: 0 }) },
  })

  it("renvoie l'exemple du fichier de mocks", async () => {
    expect(await api.get('/reports')).toEqual({ items: [], page: 0, size: 20, total: 0 })
  })

  it("échoue clairement quand l'exemple manque", async () => {
    await expect(api.get('/tags')).rejects.toMatchObject({ code: 'MOCK_NOT_FOUND' })
  })
})

describe('createApi en mode live', () => {
  it('appelle /api/v1 avec la pagination et sans en-tête CSRF en lecture', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ items: [] }))
    const api = createApi({ mode: 'live', mocks: {}, fetchFn, readCookie: () => 'jeton' })
    await api.get('/reports', { query: { page: 0, size: 20, status: undefined } })
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('/api/v1/reports?page=0&size=20')
    expect(init.headers['X-XSRF-TOKEN']).toBeUndefined()
    expect(init.credentials).toBe('same-origin')
  })

  it("envoie l'en-tête CSRF sur POST, PUT, PATCH et DELETE", async () => {
    const fetchFn = vi.fn().mockImplementation(async () => jsonResponse({}))
    const api = createApi({ mode: 'live', mocks: {}, fetchFn, readCookie: () => 'jeton' })
    await api.post('/tags', { body: { name: 'react' } })
    await api.put('/tags/1', { body: {} })
    await api.patch('/tags/1', { body: {} })
    await api.delete('/tags/1')
    for (const [, init] of fetchFn.mock.calls) {
      expect(init.headers['X-XSRF-TOKEN']).toBe('jeton')
    }
    expect(fetchFn.mock.calls[0][1].body).toBe('{"name":"react"}')
  })

  it("transforme une erreur de l'API en ApiError", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          { code: 'ACCOUNT_SUSPENDED', message: 'Compte suspendu', fields: { a: 'b' } },
          403,
        ),
      )
    const api = createApi({ mode: 'live', mocks: {}, fetchFn })
    const error = await api.get('/reports').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 403, code: 'ACCOUNT_SUSPENDED', fields: { a: 'b' } })
  })

  it("donne un code générique quand la réponse n'est pas du JSON", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('oups', { status: 502 }))
    const api = createApi({ mode: 'live', mocks: {}, fetchFn })
    await expect(api.get('/reports')).rejects.toMatchObject({ status: 502, code: 'HTTP_502' })
  })

  it('signale une panne réseau', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    const api = createApi({ mode: 'live', mocks: {}, fetchFn })
    await expect(api.get('/reports')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  })

  it('renvoie undefined sur 204', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    const api = createApi({ mode: 'live', mocks: {}, fetchFn, readCookie: () => 'jeton' })
    expect(await api.delete('/tags/1')).toBeUndefined()
  })

  it("demande le jeton CSRF à l'API quand le cookie est absent", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ headerName: 'X-XSRF-TOKEN', token: 'frais' }))
      .mockResolvedValueOnce(jsonResponse({}))
    const api = createApi({ mode: 'live', mocks: {}, fetchFn, readCookie: () => undefined })
    await api.post('/auth/login', { body: { email: 'a@b.cd', password: 'x' } })
    expect(fetchFn.mock.calls[0][0]).toBe('/api/v1/auth/csrf')
    expect(fetchFn.mock.calls[1][1].headers['X-XSRF-TOKEN']).toBe('frais')
  })

  it('signale une session expirée sur 401, sauf pour la connexion', async () => {
    const fetchFn = vi
      .fn()
      .mockImplementation(async () => jsonResponse({ code: 'UNAUTHENTICATED', message: 'x' }, 401))
    const handler = vi.fn()
    const api = createApi({
      mode: 'live',
      mocks: {},
      fetchFn,
      readCookie: () => 'jeton',
      onUnauthorized: handler,
    })
    await api.get('/admin/cases').catch(() => {})
    expect(handler).toHaveBeenCalledTimes(1)
    await api.post('/auth/login', { body: {} }).catch(() => {})
    await api.get('/auth/me').catch(() => {})
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
