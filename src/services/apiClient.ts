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
    const message = data?.error ?? data?.message ?? 'No pudimos completar la solicitud.'
    throw new ApiError(message, response.status, data?.code)
  }

  return data as T
}
