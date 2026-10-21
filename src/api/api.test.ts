import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, buildQuery, createApi, CSRF_HEADER, mockKey } from './api';

const jsonResponse = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
});

describe('mockKey', () => {
  it('remplace les identifiants numériques par id', () => {
    expect(mockKey('GET', '/questions')).toBe('GET_questions');
    expect(mockKey('GET', '/questions/12')).toBe('GET_questions_id');
    expect(mockKey('POST', '/questions/12/answers')).toBe('POST_questions_id_answers');
  });
});

describe('buildQuery', () => {
  it('ignore les valeurs vides et répète les tableaux', () => {
    expect(
      buildQuery({ page: 0, size: 20, tag: ['react', 'vite'], q: '', country: undefined }),
    ).toBe('?page=0&size=20&tag=react&tag=vite');
    expect(buildQuery()).toBe('');
  });
});

describe('mode mock', () => {
  it("renvoie le contenu du fichier d'exemple", async () => {
    const api = createApi('mock', {
      '../mocks/GET_questions.json': async () => ({ default: { items: [], total: 0 } }),
    });
    await expect(api.get('/questions')).resolves.toEqual({ items: [], total: 0 });
  });

  it("signale un fichier d'exemple manquant", async () => {
    const api = createApi('mock', {});
    await expect(api.get('/jobs')).rejects.toMatchObject({ code: 'MOCK_NOT_FOUND' });
  });
});

describe('mode live', () => {
  it("envoie l'en-tête CSRF sur une requête qui modifie", async () => {
    document.cookie = 'XSRF-TOKEN=jeton-123';
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { id: 1 }));
    vi.stubGlobal('fetch', fetchMock);

    await createApi('live').post('/questions', { title: 'Titre' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/questions');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('same-origin');
    expect(init.headers[CSRF_HEADER]).toBe('jeton-123');
    expect(init.body).toBe(JSON.stringify({ title: 'Titre' }));
  });

  it("n'envoie pas l'en-tête CSRF sur un GET", async () => {
    document.cookie = 'XSRF-TOKEN=jeton-123';
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    vi.stubGlobal('fetch', fetchMock);

    await createApi('live').get('/questions', { query: { page: 1 } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/questions?page=1');
    expect(init.headers[CSRF_HEADER]).toBeUndefined();
  });

  it("transforme une réponse d'erreur en ApiError avec son code", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(400, {
          code: 'VALIDATION_ERROR',
          message: 'Invalide',
          fields: { title: 'Obligatoire' },
        }),
      ),
    );

    const error = await createApi('live')
      .post('/questions', {})
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      fields: { title: 'Obligatoire' },
    });
  });

  it('renvoie NETWORK_ERROR quand le serveur est injoignable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(createApi('live').get('/questions')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('renvoie undefined pour une réponse 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(createApi('live').delete('/votes/question/1')).resolves.toBeUndefined();
  });
});
