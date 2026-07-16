import type { AwaitingInput, Message, MessageRole } from '../types'

const CHAT_HISTORY_PREFIX = 'eb_chat_history'
const CHAT_STATE_PREFIX = 'eb_chat_state'

interface StoredMessage extends Omit<Message, 'timestamp' | 'products' | 'faqs'> {
  timestamp: string
}

function getChatHistoryKey(businessId: string): string {
  return `${CHAT_HISTORY_PREFIX}:${businessId}`
}

function getChatStateKey(businessId: string): string {
  return `${CHAT_STATE_PREFIX}:${businessId}`
}

function isMessageRole(value: unknown): value is MessageRole {
  return value === 'bot' || value === 'user'
}

function isStoredMessage(value: unknown): value is StoredMessage {
  if (!value || typeof value !== 'object') return false

  const message = value as Partial<StoredMessage>
  return (
    typeof message.id === 'string' &&
    isMessageRole(message.role) &&
    typeof message.text === 'string' &&
    typeof message.timestamp === 'string' &&
    !Number.isNaN(Date.parse(message.timestamp)) &&
    (message.quickReplies === undefined ||
      (Array.isArray(message.quickReplies) && message.quickReplies.every(reply => typeof reply === 'string')))
  )
}

export function saveChatHistory(businessId: string, messages: Message[]): void {
  try {
    const storedMessages: StoredMessage[] = messages.map(({ products: _products, faqs: _faqs, ...message }) => ({
      ...message,
      timestamp: message.timestamp.toISOString(),
    }))
    localStorage.setItem(getChatHistoryKey(businessId), JSON.stringify(storedMessages))
  } catch {
    // El chat sigue funcionando aunque el navegador bloquee o llene localStorage.
  }
}

export function loadChatHistory(businessId: string): Message[] {
  try {
    const stored = localStorage.getItem(getChatHistoryKey(businessId))
    if (!stored) return []

    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed) || !parsed.every(isStoredMessage)) return []

    return parsed.map(message => ({
      ...message,
      timestamp: new Date(message.timestamp),
    }))
  } catch {
    return []
  }
}

export function clearChatHistory(businessId: string): void {
  try {
    localStorage.removeItem(getChatHistoryKey(businessId))
  } catch {
    // El reinicio visual no depende de que localStorage este disponible.
  }
}

export function saveAwaitingInput(businessId: string, awaitingInput: AwaitingInput | null): void {
  try {
    if (awaitingInput) {
      localStorage.setItem(getChatStateKey(businessId), awaitingInput)
    } else {
      localStorage.removeItem(getChatStateKey(businessId))
    }
  } catch {
    // El estado en memoria sigue activo aunque localStorage no este disponible.
  }
}

export function loadAwaitingInput(businessId: string): AwaitingInput | null {
  try {
    const stored = localStorage.getItem(getChatStateKey(businessId))
    return stored === 'budget' || stored === 'faq-selection' || stored === 'contact-name' || stored === 'contact-phone'
      ? (stored as AwaitingInput)
      : null
  } catch {
    return null
  }
}

export function clearChatState(businessId: string): void {
  try {
    localStorage.removeItem(getChatStateKey(businessId))
  } catch {
    // El reinicio visual no depende de que localStorage este disponible.
  }
}
