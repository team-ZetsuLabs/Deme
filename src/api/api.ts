/**
 * Client de l'API Zetsu. Seul fichier autorisé à appeler `fetch`.
 *
 * - Mode `mock` : lit les exemples de src/mocks (copie des mocks du back-end).
 *   Nom du fichier : MÉTHODE_chemin, les identifiants numériques devenant `id`.
 *   GET /questions        -> GET_questions.json
 *   GET /questions/12     -> GET_questions_id.json
 *   POST /questions/12/answers -> POST_questions_id_answers.json
 * - Mode `live` : appelle /api/v1 sur la même adresse (proxy Vite en local,
 *   Caddy en production), avec le cookie de session et l'en-tête CSRF.
 *
 * Le mode se règle avec VITE_API_MODE dans .env.local (mock par défaut).
 */

export type ApiMode = 'mock' | 'live';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue | QueryValue[]>;

/** Forme commune des erreurs renvoyées par le back-end. */
export type ApiErrorBody = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.fields = body.fields;
  }
}

export type RequestOptions = {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
};

export const API_BASE = '/api/v1';

// Convention Spring Security (CookieCsrfTokenRepository), à confirmer avec le back-end.
export const CSRF_COOKIE = 'XSRF-TOKEN';
export const CSRF_HEADER = 'X-XSRF-TOKEN';

const MOCK_DELAY_MS = 250;

type MockModule = { default: unknown };
type MockLoaders = Record<string, () => Promise<MockModule>>;

const defaultMocks = import.meta.glob<MockModule>('../mocks/*.json') as MockLoaders;

export function mockKey(method: HttpMethod, path: string): string {
  const segments = path
    .split('?')[0]
    .split('/')
    .filter(Boolean)
    .map((s) => (/^\d+$/.test(s) ? 'id' : s));
  return [method, ...segments].join('_');
}

export function buildQuery(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      if (v !== undefined && v !== null && v !== '') params.append(key, String(v));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiErrorBody).code === 'string' &&
    typeof (value as ApiErrorBody).message === 'string'
  );
}

async function liveRequest<T>(method: HttpMethod, path: string, opts: RequestOptions): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;

  if (opts.body instanceof FormData) {
    body = opts.body; // le navigateur fixe lui-même le Content-Type multipart
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  if (method !== 'GET') {
    const token = readCookie(CSRF_COOKIE);
    if (token) headers[CSRF_HEADER] = token;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}${buildQuery(opts.query)}`, {
      method,
      headers,
      body,
      credentials: 'same-origin',
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, { code: 'NETWORK_ERROR', message: 'Serveur injoignable' });
  }

  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      isErrorBody(data) ? data : { code: 'UNKNOWN_ERROR', message: `HTTP ${res.status}` },
    );
  }
  return data as T;
}

async function mockRequest<T>(
  method: HttpMethod,
  path: string,
  opts: RequestOptions,
  mocks: MockLoaders,
): Promise<T> {
  const key = mockKey(method, path);
  const loader = mocks[`../mocks/${key}.json`];
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (!loader) {
    throw new ApiError(404, { code: 'MOCK_NOT_FOUND', message: `Exemple absent : ${key}.json` });
  }
  const mod = await loader();
  return structuredClone(mod.default) as T;
}

export function createApi(mode: ApiMode, mocks: MockLoaders = defaultMocks) {
  const request = <T>(method: HttpMethod, path: string, opts: RequestOptions = {}) =>
    mode === 'live'
      ? liveRequest<T>(method, path, opts)
      : mockRequest<T>(method, path, opts, mocks);

  return {
    mode,
    get: <T>(path: string, opts?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, opts),
    post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<T>('POST', path, { ...opts, body }),
    put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<T>('PUT', path, { ...opts, body }),
    patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<T>('PATCH', path, { ...opts, body }),
    delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
  };
}

export const api = createApi(import.meta.env.VITE_API_MODE === 'live' ? 'live' : 'mock');
