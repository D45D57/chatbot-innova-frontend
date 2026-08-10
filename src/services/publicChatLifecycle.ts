export type PublicChatLifecycleEvent = 'SESSION_EXPIRED_INACTIVITY'

export const INACTIVITY_EXPIRED_MESSAGE =
  'Tu conversación anterior finalizó por inactividad. ¡Empecemos de nuevo!'

export function normalizePublicChatLifecycleEvent(
  value: unknown,
): PublicChatLifecycleEvent | null {
  return value === 'SESSION_EXPIRED_INACTIVITY' ? value : null
}

export function createPublicChatLifecycleFields(
  value: unknown,
  sessionChanged: boolean,
): {
  chatLifecycleEvent: PublicChatLifecycleEvent | null
  chatSessionChanged: boolean
} {
  return {
    chatLifecycleEvent: normalizePublicChatLifecycleEvent(value),
    chatSessionChanged: sessionChanged,
  }
}

export function createSessionStartTexts(
  welcomeMessage: string,
  lifecycleEvent: PublicChatLifecycleEvent | null | undefined,
): string[] {
  return lifecycleEvent === 'SESSION_EXPIRED_INACTIVITY'
    ? [INACTIVITY_EXPIRED_MESSAGE, welcomeMessage]
    : [welcomeMessage]
}

interface ConversationMessage {
  role: string
  text: string
  quickReplies?: unknown
  products?: unknown
  faqs?: unknown
  confirmQuote?: unknown
  quoteSummary?: unknown
}

export function mergeSessionStartMessages<T extends ConversationMessage>(
  history: T[],
  initialMessages: T[],
): T[] {
  const previousMessages = history.map(message => {
    const { quickReplies, products, faqs, confirmQuote, quoteSummary, ...visualMessage } = message
    void quickReplies
    void products
    void faqs
    void confirmQuote
    void quoteSummary
    return visualMessage as T
  })
  const initialMessage = initialMessages[initialMessages.length - 1]
  const lastMessage = previousMessages[previousMessages.length - 1]

  if (lastMessage?.role === 'bot' && lastMessage.text === initialMessage.text) {
    const lifecycleNotice = initialMessages.length > 1 ? initialMessages[0] : null
    const previousNotice = previousMessages[previousMessages.length - 2]
    if (lifecycleNotice && previousNotice?.role === 'bot' && previousNotice.text === lifecycleNotice.text) {
      return [...previousMessages.slice(0, -1), initialMessage]
    }
    return [...previousMessages.slice(0, -1), ...initialMessages]
  }

  return [...previousMessages, ...initialMessages]
}

interface ConsultationClosedError {
  status?: unknown
  code?: unknown
}

export function isConsultationClosedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as ConsultationClosedError
  return candidate.status === 409 && candidate.code === 'CONSULTATION_CLOSED'
}

interface SendWithConsultationRecoveryOptions {
  consultationId: string
  send: (consultationId: string) => Promise<void>
  getCurrentConsultationId: () => Promise<string | null>
  invalidateConsultation: () => void
  createReplacementConsultation: () => Promise<string | null>
}

export async function sendWithConsultationRecovery({
  consultationId,
  send,
  getCurrentConsultationId,
  invalidateConsultation,
  createReplacementConsultation,
}: SendWithConsultationRecoveryOptions): Promise<string> {
  const currentConsultationId = await getCurrentConsultationId()
  const targetConsultationId = currentConsultationId ?? consultationId

  try {
    await send(targetConsultationId)
    return targetConsultationId
  } catch (error) {
    if (!isConsultationClosedError(error)) throw error

    invalidateConsultation()
    const replacementConsultationId = await createReplacementConsultation()
    if (!replacementConsultationId) throw error

    await send(replacementConsultationId)
    return replacementConsultationId
  }
}
