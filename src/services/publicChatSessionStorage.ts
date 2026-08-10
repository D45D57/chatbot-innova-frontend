interface StoredConsultationReference {
  sessionId: string
  consultationId: string
}

const consultationStorageKey = (slug: string) => `emprendebot:consulta:${slug}`

function isStoredConsultationReference(value: unknown): value is StoredConsultationReference {
  if (!value || typeof value !== 'object') return false
  const reference = value as Partial<StoredConsultationReference>
  return typeof reference.sessionId === 'string'
    && reference.sessionId.length > 0
    && typeof reference.consultationId === 'string'
    && reference.consultationId.length > 0
}

export function clearStoredConsultation(slug: string): void {
  sessionStorage.removeItem(consultationStorageKey(slug))
}

export function readStoredConsultation(slug: string, activeSessionId: string): string | null {
  const key = consultationStorageKey(slug)
  const stored = sessionStorage.getItem(key)
  if (!stored) return null

  try {
    const parsed: unknown = JSON.parse(stored)
    if (!isStoredConsultationReference(parsed) || parsed.sessionId !== activeSessionId) {
      sessionStorage.removeItem(key)
      return null
    }
    return parsed.consultationId
  } catch {
    // El formato anterior guardaba solamente el ID de consulta.
    saveStoredConsultation(slug, activeSessionId, stored)
    return stored
  }
}

export function saveStoredConsultation(
  slug: string,
  sessionId: string,
  consultationId: string,
): void {
  const reference: StoredConsultationReference = { sessionId, consultationId }
  sessionStorage.setItem(consultationStorageKey(slug), JSON.stringify(reference))
}

export function reconcileReturnedSession(
  slug: string,
  previousSessionId: string | null,
  returnedSessionId: string | undefined,
): boolean {
  const sessionChanged = Boolean(returnedSessionId && previousSessionId !== returnedSessionId)
  if (sessionChanged) clearStoredConsultation(slug)
  return sessionChanged
}
