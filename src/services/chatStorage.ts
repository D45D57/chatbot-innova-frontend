import type { AwaitingInput, Message, MessageRole, QuickReplyOption } from '../types'

const CHAT_HISTORY_PREFIX = 'eb_chat_history'
const CHAT_STATE_PREFIX = 'eb_chat_state'

interface StoredMessage extends Omit<Message, 'timestamp' | 'products' | 'faqs' | 'quickReplies'> {
  timestamp: string
  quickReplies?: Array<QuickReplyOption | string>
}

const QUICK_REPLY_ACTIONS = new Set<QuickReplyOption['action']>([
  'SHOW_MAIN_MENU',
  'SHOW_FAQ_MENU',
  'SHOW_CATALOG',
  'SHOW_SCHEDULE',
  'START_HUMAN_HANDOFF',
  'START_BUDGET',
  'SELECT_FAQ',
  'REQUEST_BUDGET',
  'CONFIRM_BUDGET',
  'CANCEL_BUDGET',
  'ASK_IF_HELPFUL',
  'HELPFUL_YES',
  'HELPFUL_NO',
  'SEND_TEXT',
])

function getChatHistoryKey(businessId: string): string {
  return `${CHAT_HISTORY_PREFIX}:${businessId}`
}

function getChatStateKey(businessId: string): string {
  return `${CHAT_STATE_PREFIX}:${businessId}`
}

function isMessageRole(value: unknown): value is MessageRole {
  return value === 'bot' || value === 'user'
}

function isQuickReplyOption(value: unknown): value is QuickReplyOption {
  if (!value || typeof value !== 'object') return false
  const option = value as Partial<QuickReplyOption>
  return typeof option.id === 'string'
    && typeof option.label === 'string'
    && typeof option.action === 'string'
    && QUICK_REPLY_ACTIONS.has(option.action as QuickReplyOption['action'])
    && (option.value === undefined || typeof option.value === 'string')
}

function migrateLegacyQuickReply(label: string, index: number): QuickReplyOption {
  const knownOptions: Record<string, Pick<QuickReplyOption, 'id' | 'action'>> = {
    'Ver catálogo': { id: 'show-catalog', action: 'SHOW_CATALOG' },
    'Horarios de atención': { id: 'show-schedule', action: 'SHOW_SCHEDULE' },
    'Preguntas frecuentes': { id: 'show-faq-menu', action: 'SHOW_FAQ_MENU' },
    'Ver preguntas frecuentes': { id: 'repeat-faq-menu', action: 'SHOW_FAQ_MENU' },
    'Hablar con una persona': { id: 'start-human-handoff', action: 'START_HUMAN_HANDOFF' },
    'Menú principal': { id: 'show-main-menu', action: 'SHOW_MAIN_MENU' },
    'Volver al menú principal': { id: 'back-main-menu', action: 'SHOW_MAIN_MENU' },
  }
  const known = knownOptions[label]
  return known
    ? { ...known, label }
    : { id: `legacy-send-text-${index}`, label, action: 'SEND_TEXT', value: label }
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
      (Array.isArray(message.quickReplies)
        && message.quickReplies.every(reply => typeof reply === 'string' || isQuickReplyOption(reply))))
  )
}

export function saveChatHistory(businessId: string, messages: Message[]): void {
  try {
    const storedMessages: StoredMessage[] = messages.map(message => {
      const { products, faqs, ...storedMessage } = message
      void products
      void faqs
      return {
        ...storedMessage,
        timestamp: message.timestamp.toISOString(),
      }
    })
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
      quickReplies: message.quickReplies?.map((reply, index) =>
        typeof reply === 'string' ? migrateLegacyQuickReply(reply, index) : reply),
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
    return stored === 'budget'
      || stored === 'faq-selection'
      || stored === 'contact-name'
      || stored === 'contact-phone'
      || stored === 'quote-contact-name'
      || stored === 'quote-contact-phone'
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

export function clearTemporaryConversationState(businessId: string): void {
  clearChatState(businessId)
  try {
    sessionStorage.removeItem(`eb_pending_quote:${businessId}`)
  } catch {
    // El estado en memoria sigue siendo la fuente activa de la conversación.
  }
}
