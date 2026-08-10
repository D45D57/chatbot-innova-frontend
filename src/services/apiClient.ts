import { API_BASE_URL } from '../config/env'

const AUTH_TOKEN_KEYS = ['eb_auth_token', 'authToken', 'token']

function getStoredToken(): string | null {
  for (const key of AUTH_TOKEN_KEYS) {
    const token = localStorage.getItem(key)
    if (token) return token
  }
  return null
}

interface ApiRequestOptions extends RequestInit {
  auth?: boolean
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export class UserFacingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserFacingError'
  }
}

type ErrorContext = 'login' | 'register' | 'google' | 'default'

interface UserFacingErrorOptions {
  context?: ErrorContext
  fallback?: string
}

const DEFAULT_ERROR_MESSAGE = 'No pudimos completar la solicitud. Intentá nuevamente.'

function apiStatusMessage(status: number, context: ErrorContext): string {
  if (context === 'login' && status === 401) return 'Usuario o contraseña incorrectos.'
  if (context === 'register' && status === 409) return 'Ya existe una cuenta con ese email.'
  if (status === 403) return 'No tenés permisos para realizar esta acción.'
  if (context === 'login') return 'No pudimos iniciar sesión. Intentá nuevamente.'
  if (context === 'register') return 'No pudimos crear la cuenta. Intentá nuevamente.'
  if (context === 'google') return 'No pudimos iniciar sesión con Google. Intentá nuevamente.'
  if (status === 401) return 'Tu sesión venció. Iniciá sesión nuevamente.'
  return DEFAULT_ERROR_MESSAGE
}

export function getUserFacingErrorMessage(
  error: unknown,
  { context = 'default', fallback = DEFAULT_ERROR_MESSAGE }: UserFacingErrorOptions = {},
): string {
  if (error instanceof UserFacingError) return error.message
  if (error instanceof ApiError) return apiStatusMessage(error.status, context)
  if (error instanceof TypeError || (error instanceof Error && /network|failed to fetch|load failed/i.test(error.message))) {
    return 'No pudimos comunicarnos con el servidor. Intentá nuevamente.'
  }
  return fallback
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = true, headers, body, ...requestOptions } = options
  const token = auth ? getStoredToken() : null
  const isFormData = body instanceof FormData

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(apiStatusMessage(response.status, 'default'), response.status, data?.code)
  }

  return data as T
}
