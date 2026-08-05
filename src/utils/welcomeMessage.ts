const GENERIC_DEFAULT_MESSAGES = new Set([
  '¡Hola! ¿En qué te puedo ayudar?',
  '¡Hola! ¿En qué te puedo ayudar hoy?',
])

const CONFIG_DEFAULT_MESSAGE_PATTERN =
  /^\u00a1Hola! Soy el asistente de .+ \u00bfEn qu\u00e9 te puedo ayudar\? Elige una opci\u00f3n para continuar\.$/

const PUBLIC_CHAT_DEFAULT_MESSAGE_PATTERN =
  /^\u00a1Hola! Soy el asistente virtual de .+\. \u00bfEn qu\u00e9 te puedo ayudar\?$/

export const getDefaultWelcomeMessage = (businessName: string) =>
  `¡Hola! Soy el asistente de ${businessName} ¿En qué te puedo ayudar? Elige una opción para continuar.`

export const getVirtualAssistantWelcomeMessage = (businessName: string) =>
  `¡Hola! Soy el asistente virtual de ${businessName}. ¿En qué te puedo ayudar?`

export function syncDefaultWelcomeMessage(
  currentMessage: string,
  previousBusinessName: string,
  nextBusinessName: string,
): string {
  const previousName = previousBusinessName || 'tu negocio'
  const nextName = nextBusinessName || 'tu negocio'

  if (!currentMessage.trim() || GENERIC_DEFAULT_MESSAGES.has(currentMessage)) {
    return getDefaultWelcomeMessage(nextName)
  }

  if (currentMessage === getDefaultWelcomeMessage(previousName)) {
    return getDefaultWelcomeMessage(nextName)
  }

  if (currentMessage === getVirtualAssistantWelcomeMessage(previousName)) {
    return getVirtualAssistantWelcomeMessage(nextName)
  }

  // Una configuracion antigua puede conservar un nombre previo dentro de la
  // plantilla. Reconocemos la frase completa y regeneramos todo el mensaje.
  if (CONFIG_DEFAULT_MESSAGE_PATTERN.test(currentMessage)) {
    return getDefaultWelcomeMessage(nextName)
  }

  if (PUBLIC_CHAT_DEFAULT_MESSAGE_PATTERN.test(currentMessage)) {
    return getVirtualAssistantWelcomeMessage(nextName)
  }

  return currentMessage
}
