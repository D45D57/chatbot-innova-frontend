const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

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

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = true, headers, body, ...requestOptions } = options
  const token = auth ? getStoredToken() : null

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.error ?? data?.message ?? 'No pudimos completar la solicitud.'
    throw new Error(message)
  }

  return data as T
}
