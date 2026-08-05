function requireEnvironmentVariable(name: 'VITE_API_URL'): string {
  const value = import.meta.env[name]?.trim()
  if (!value) {
    throw new Error(`Falta configurar ${name} para el entorno actual.`)
  }
  return value
}

function normalizeApiBaseUrl(value: string): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('VITE_API_URL debe ser una URL absoluta válida.')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('VITE_API_URL debe usar el protocolo http o https.')
  }

  return url.toString().replace(/\/+$/, '')
}

export const API_BASE_URL = normalizeApiBaseUrl(requireEnvironmentVariable('VITE_API_URL'))
