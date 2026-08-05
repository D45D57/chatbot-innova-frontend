import { ApiError } from '../services/apiClient'

export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) return false
  if (error instanceof TypeError) return true
  return error instanceof Error && /network|failed to fetch|load failed|fetch failed/i.test(error.message)
}
