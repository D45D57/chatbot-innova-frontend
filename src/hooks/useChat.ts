import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AwaitingInput,
  Business,
  FAQ,
  Message,
  Product,
  QuickReplyAction,
  QuickReplyOption,
  QuoteSummaryMessageData,
} from '../types'

export interface OrderItem {
  product: Product
  quantity: number
}
import {
  clearChatHistory,
  clearChatState,
  clearTemporaryConversationState,
  loadChatHistory,
  saveAwaitingInput,
  saveChatHistory,
} from '../services/chatStorage'
import {
  clearStoredConsultation,
  readStoredConsultation,
  saveStoredConsultation,
} from '../services/publicChatSessionStorage'
import {
  createPublicBudget,
  createPublicConsultation,
  getPublicHistory,
  savePublicMessage,
  updatePublicContact,
} from '../services/publicConsultationApi'
import {
  createSessionStartTexts,
  mergeSessionStartMessages,
  sendWithConsultationRecovery,
} from '../services/publicChatLifecycle'
import { isNetworkError } from '../utils/networkError'

const QUICK_REPLIES_INICIAL: QuickReplyOption[] = [
  { id: 'show-catalog', label: 'Ver catálogo', action: 'SHOW_CATALOG' },
  { id: 'show-schedule', label: 'Horarios de atención', action: 'SHOW_SCHEDULE' },
  { id: 'show-faq-menu', label: 'Preguntas frecuentes', action: 'SHOW_FAQ_MENU' },
  { id: 'start-human-handoff', label: 'Hablar con una persona', action: 'START_HUMAN_HANDOFF' },
]

const MAIN_MENU_REPLY: QuickReplyOption = {
  id: 'back-main-menu',
  label: 'Volver al menú principal',
  action: 'SHOW_MAIN_MENU',
}

interface BotResponse {
  text: string
  quickReplies?: QuickReplyOption[]
  continuation?: string
  awaitingInput?: AwaitingInput
  products?: Product[]
  faqs?: FAQ[]
}

const CONTINUATION_MESSAGE = '¿Deseas realizar otra consulta?'

const MENU_COMMANDS = ['menu', 'opciones', 'volver']

function normalizeMessage(message: string): string {
  return message
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function isMenuCommand(message: string): boolean {
  return MENU_COMMANDS.includes(message)
    || message === 'volver al menu'
    || message === 'volver al menu principal'
    || message === 'menu principal'
}

function isFaqMenuCommand(message: string): boolean {
  return message === 'faq'
    || message === 'faqs'
    || message === 'volver a faq'
    || message === 'volver a faqs'
    || message === 'preguntas frecuentes'
    || message === 'ver preguntas frecuentes'
}

function getFaqs(business: Business): FAQ[] {
  return business.faq
}

function createFaqMenuResponse(business: Business): BotResponse {
  const activeFaqs = getFaqs(business)

  if (activeFaqs.length === 0) {
    return {
      text: 'No hay preguntas frecuentes disponibles en este momento. Podés volver al menú principal.',
      quickReplies: [{ id: 'show-main-menu', label: 'Menú principal', action: 'SHOW_MAIN_MENU' }],
    }
  }

  return {
    text: 'Estas son las preguntas más frecuentes. Seleccioná la que te interese.',
    faqs: activeFaqs,
    quickReplies: QUICK_REPLIES_INICIAL,
    awaitingInput: 'faq-selection',
  }
}

function findSelectedFaq(userMessage: string, faqs: FAQ[]): FAQ | null {
  const normalized = normalizeMessage(userMessage)

  // Match por número (legado)
  if (/^\d+$/.test(normalized)) {
    return faqs[Number(normalized) - 1] ?? null
  }

  // Match por texto de la pregunta (cuando el usuario hace clic en el botón)
  return faqs.find(faq => normalizeMessage(faq.pregunta) === normalized) ?? null
}

function createSelectedFaqResponse(faqId: string | undefined, business: Business): BotResponse {
  const selectedFaq = getFaqs(business).find(faq => faq.id === faqId)
  if (!selectedFaq) return createFaqMenuResponse(business)
  return {
    text: selectedFaq.respuesta,
    quickReplies: [
      { id: 'repeat-faq-menu', label: 'Ver preguntas frecuentes', action: 'SHOW_FAQ_MENU' },
      MAIN_MENU_REPLY,
    ],
  }
}

function createMainMenuResponse(): BotResponse {
  return { text: '', quickReplies: QUICK_REPLIES_INICIAL }
}

function createCatalogResponse(business: Business): BotResponse {
  const disponibles = business.productos.filter(product => product.disponible)
  if (disponibles.length === 0) {
    return {
      text: 'Todavía no tenemos productos cargados. ¿Deseas realizar otra consulta?',
      quickReplies: QUICK_REPLIES_INICIAL,
    }
  }
  return {
    text: '¡Perfecto! Te comparto las opciones disponibles. Seleccioná una o varias para continuar.',
    products: disponibles,
  }
}

function createScheduleResponse(business: Business): BotResponse {
  return {
    text: `🕐 Horario: ${business.horario || 'No especificado'}\n📞 Teléfono: ${business.telefono || 'No especificado'}\n\n${business.descripcion || ''}`,
    quickReplies: QUICK_REPLIES_INICIAL,
  }
}

function createHumanHandoffResponse(): BotResponse {
  return {
    text: '¡Perfecto! Para ponerte en contacto con una persona del negocio necesito un par de datos. 😊\n\n¿Cuál es tu nombre?',
    awaitingInput: 'contact-name',
  }
}

function createBudgetResponse(): BotResponse {
  return {
    text: "¡Perfecto! Para armar un presupuesto necesito algunos datos. ¿Podés contarme qué productos o servicios te interesan?\n\nSi querés volver al menú principal, escribí 'menú' u 'opciones'.",
    awaitingInput: 'budget',
  }
}

function generateBotResponse(
  userMessage: string,
  business: Business,
  awaitingInput: AwaitingInput | null,
): BotResponse {
  const msg = userMessage.toLowerCase()
  const normalizedMessage = normalizeMessage(userMessage)

  if (isMenuCommand(normalizedMessage)) {
    return createMainMenuResponse()
  }

  if (isFaqMenuCommand(normalizedMessage)) {
    return createFaqMenuResponse(business)
  }

  if (awaitingInput === 'budget') {
    return {
      text: '¡Gracias! Registramos el detalle de tu solicitud de presupuesto. El equipo podrá revisarlo y contactarte.',
      continuation: CONTINUATION_MESSAGE,
    }
  }

  if (awaitingInput === 'faq-selection') {
    const activeFaqs = getFaqs(business)
    if (activeFaqs.length === 0) return createFaqMenuResponse(business)

    const selectedFaq = findSelectedFaq(userMessage, activeFaqs)

    if (!selectedFaq) {
      return {
        text: 'No encontré esa opción. Por favor elegí una de las preguntas de la lista.',
        faqs: activeFaqs,
        quickReplies: QUICK_REPLIES_INICIAL,
        awaitingInput: 'faq-selection',
      }
    }

    return createSelectedFaqResponse(selectedFaq.id, business)
  }

  if (msg.includes('producto') || msg.includes('catálogo') || msg.includes('catalogo')) {
    return createCatalogResponse(business)
  }

  if (msg.includes('horario') || msg.includes('información') || msg.includes('informacion')) {
    return createScheduleResponse(business)
  }

  if (msg.includes('presupuesto')) {
    return createBudgetResponse()
  }


  if (msg.includes('frecuente') || msg.includes('faq') || msg.includes('pregunta')) {
    return createFaqMenuResponse(business)
  }

  if (msg.includes('persona') || msg.includes('asesor') || msg.includes('hablar')) {
    return createHumanHandoffResponse()
  }

  return {
    text: 'No encontré una respuesta para esa consulta.\nElegí por favor una opción para continuar',
    quickReplies: QUICK_REPLIES_INICIAL,
  }
}

function generateQuickReplyResponse(option: QuickReplyOption, business: Business): BotResponse {
  const actions: Record<Exclude<QuickReplyAction, 'SEND_TEXT' | 'REQUEST_BUDGET' | 'CONFIRM_BUDGET' | 'CANCEL_BUDGET'>, () => BotResponse> = {
    SHOW_MAIN_MENU: createMainMenuResponse,
    SHOW_FAQ_MENU: () => createFaqMenuResponse(business),
    SHOW_CATALOG: () => createCatalogResponse(business),
    SHOW_SCHEDULE: () => createScheduleResponse(business),
    START_HUMAN_HANDOFF: createHumanHandoffResponse,
    START_BUDGET: createBudgetResponse,
    SELECT_FAQ: () => createSelectedFaqResponse(option.value, business),
  }

  if (option.action === 'SEND_TEXT') {
    return generateBotResponse(option.value ?? option.label, business, null)
  }
  if (option.action === 'REQUEST_BUDGET' || option.action === 'CONFIRM_BUDGET' || option.action === 'CANCEL_BUDGET') {
    return generateBotResponse(option.label, business, null)
  }
  return actions[option.action]()
}

function createBotMessages(response: BotResponse): Message[] {
  const responseMessage: Message = {
    id: crypto.randomUUID(),
    role: 'bot',
    text: response.text,
    timestamp: new Date(),
    quickReplies: response.quickReplies,
    products: response.products,
    faqs: response.faqs,
  }

  if (response.awaitingInput || response.quickReplies?.length || response.products?.length || response.faqs?.length) return [responseMessage]

  const continuationMessage: Message = {
    id: crypto.randomUUID(),
    role: 'bot',
    text: response.continuation ?? CONTINUATION_MESSAGE,
    timestamp: new Date(),
    quickReplies: QUICK_REPLIES_INICIAL,
  }

  return [responseMessage, continuationMessage]
}

function createInitialMessage(
  business: Business,
  text = business.mensajeBienvenida
    || `¡Hola! Soy el asistente virtual de ${business.nombre}. ¿En qué te puedo ayudar?`,
): Message {
  return {
    id: crypto.randomUUID(),
    role: 'bot',
    text,
    timestamp: new Date(),
    quickReplies: QUICK_REPLIES_INICIAL,
  }
}

function createSessionStartMessages(business: Business): Message[] {
  const welcomeMessage = business.mensajeBienvenida
    || `¡Hola! Soy el asistente virtual de ${business.nombre}. ¿En qué te puedo ayudar?`
  const texts = createSessionStartTexts(
    welcomeMessage,
    business.chatSessionChanged ? business.chatLifecycleEvent : null,
  )

  return texts.map((text, index) => {
    const message = createInitialMessage(business, text)
    if (index < texts.length - 1) delete message.quickReplies
    return message
  })
}

function createNewSessionMessages(history: Message[], business: Business): Message[] {
  const initialMessages = createSessionStartMessages(business)
  return mergeSessionStartMessages(history, initialMessages)
}

function getInitialHistory(business: Business): Message[] {
  const storedMessages = loadChatHistory(business.id)
  if (storedMessages.length > 0) {
    const initialMessages = business.chatSessionChanged
      ? createNewSessionMessages(storedMessages, business)
      : storedMessages
    saveChatHistory(business.id, initialMessages)
    return initialMessages
  }
  const initialMessages = createSessionStartMessages(business)
  saveChatHistory(business.id, initialMessages)
  return initialMessages
}

const getTypingDelay = () => 800 + Math.floor(Math.random() * 701)
const pendingQuoteStorageKey = (businessId: string) => `eb_pending_quote:${businessId}`

interface PendingQuote {
  sourceSummaryMessageId: string
  summary: QuoteSummaryMessageData
  customerName?: string
  customerPhone?: string
}

function savePendingQuote(businessId: string, pendingQuote: PendingQuote | null): void {
  if (pendingQuote) {
    sessionStorage.setItem(pendingQuoteStorageKey(businessId), JSON.stringify(pendingQuote))
  } else {
    sessionStorage.removeItem(pendingQuoteStorageKey(businessId))
  }
}

interface UseChatOptions {
  isOnline?: boolean
  onNetworkError?: () => void
}

export function useChat(business: Business, { isOnline = true, onNetworkError }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>(() => getInitialHistory(business))
  const [awaitingInput, setAwaitingInput] = useState<AwaitingInput | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [contactName, setContactName] = useState<string>('')
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingResponseResolverRef = useRef<(() => void) | null>(null)
  const conversationVersionRef = useRef(0)
  const consultationPromiseRef = useRef<Promise<string | null> | null>(null)
  const chatSessionIdRef = useRef(business.chatSessionId ?? crypto.randomUUID())
  const canReuseInitialConsultationRef = useRef(!business.chatSessionChanged)
  const quoteSubmissionRef = useRef<Set<string>>(new Set(
    messages.flatMap(message => (
      message.generatedQuote ? [message.generatedQuote.sourceSummaryMessageId] : []
    )),
  ))
  const pendingQuoteRef = useRef<PendingQuote | null>(null)
  const [submittingQuoteMessageId, setSubmittingQuoteMessageId] = useState<string | null>(null)
  const cancelledQuoteMessageIds = new Set(
    messages
      .filter(message => message.action === 'CANCEL_BUDGET' && message.actionValue)
      .map(message => message.actionValue!),
  )

  const ensureConsultation = useCallback((): Promise<string | null> => {
    if (!consultationPromiseRef.current) {
      const activeSessionId = chatSessionIdRef.current
      const storedId = readStoredConsultation(business.slug, activeSessionId)
      const existingConsultationId = storedId
        ?? (canReuseInitialConsultationRef.current ? business.chatConsultationId : null)
      if (existingConsultationId) {
        saveStoredConsultation(business.slug, activeSessionId, existingConsultationId)
      }
      consultationPromiseRef.current = existingConsultationId
        ? Promise.resolve(existingConsultationId)
        : createPublicConsultation(business.slug, activeSessionId)
            .then(async consultationId => {
              saveStoredConsultation(business.slug, activeSessionId, consultationId)
              await savePublicMessage(business.slug, consultationId, 'bot', createInitialMessage(business).text)
              return consultationId
            })
            .catch(error => {
              if (isNetworkError(error)) onNetworkError?.()
              return null
            })
    }
    return consultationPromiseRef.current
  }, [business, onNetworkError])

  const persistPublicMessage = useCallback((
    consultationId: string,
    emisor: 'cliente' | 'bot',
    contenido: string,
  ): Promise<string> => sendWithConsultationRecovery({
    consultationId,
    send: activeConsultationId => savePublicMessage(
      business.slug,
      activeConsultationId,
      emisor,
      contenido,
    ),
    getCurrentConsultationId: async () => (
      consultationPromiseRef.current ? consultationPromiseRef.current : null
    ),
    invalidateConsultation: () => {
      clearStoredConsultation(business.slug)
      consultationPromiseRef.current = null
      canReuseInitialConsultationRef.current = false
    },
    createReplacementConsultation: ensureConsultation,
  }), [business.slug, ensureConsultation])

  const cancelPendingResponse = useCallback(() => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current)
      responseTimeoutRef.current = null
    }
    pendingResponseResolverRef.current?.()
    pendingResponseResolverRef.current = null
  }, [])

  useEffect(() => {
    if (!business.chatHasHistory || !business.chatSessionId) return
    if (business.chatSessionChanged) return

    const storedMessages = loadChatHistory(business.id)
    if (storedMessages.length > 1) return

    let active = true
    const restorationVersion = conversationVersionRef.current
    void getPublicHistory(business.slug, business.chatSessionId)
      .then(history => {
        if (!active || restorationVersion !== conversationVersionRef.current || history.mensajes.length === 0) return
        const historicalMessages: Message[] = history.mensajes.map(message => ({
          id: message.id,
          role: message.emisor === 'CLIENTE' ? 'user' : 'bot',
          text: message.contenido,
          timestamp: new Date(message.fechaCreacion),
        }))
        const restoredMessages = createNewSessionMessages(historicalMessages, business)
        setMessages(restoredMessages)
        saveChatHistory(business.id, restoredMessages)
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [business])

  useEffect(() => {
    return () => {
      conversationVersionRef.current += 1
      cancelPendingResponse()
    }
  }, [cancelPendingResponse])

  useEffect(() => {
    if (!isOnline) consultationPromiseRef.current = null
  }, [isOnline])

  useEffect(() => {
    if (!business.chatSessionId || business.chatSessionId === chatSessionIdRef.current) return

    conversationVersionRef.current += 1
    cancelPendingResponse()
    chatSessionIdRef.current = business.chatSessionId
    consultationPromiseRef.current = null
    canReuseInitialConsultationRef.current = false
    quoteSubmissionRef.current.clear()
    pendingQuoteRef.current = null
    setSubmittingQuoteMessageId(null)
    setAwaitingInput(null)
    setContactName('')
    setIsTyping(false)
    clearTemporaryConversationState(business.id)
    setMessages(previousMessages => {
      const nextMessages = createNewSessionMessages(previousMessages, business)
      saveChatHistory(business.id, nextMessages)
      return nextMessages
    })
  }, [business, cancelPendingResponse])

  const processMessage = useCallback(async (text: string, quickReply?: QuickReplyOption) => {
    if (isTyping) return
    const actionValue = quickReply?.action === 'CANCEL_BUDGET'
      ? quickReply.value ?? pendingQuoteRef.current?.sourceSummaryMessageId
      : quickReply?.value

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date(),
      ...(quickReply ? { action: quickReply.action, actionValue } : {}),
    }

    setMessages(previousMessages => {
      const nextMessages = [...previousMessages, userMessage]
      saveChatHistory(business.id, nextMessages)
      return nextMessages
    })
    setIsTyping(true)

    let consultationId = isOnline ? await ensureConsultation() : null
    if (consultationId) {
      consultationId = await persistPublicMessage(consultationId, 'cliente', text)
        .catch(() => consultationId)
    }

    const conversationVersion = conversationVersionRef.current
    await new Promise<void>(resolve => {
      pendingResponseResolverRef.current = resolve
      responseTimeoutRef.current = setTimeout(() => {
        responseTimeoutRef.current = null
        pendingResponseResolverRef.current = null
        resolve()
      }, getTypingDelay())
    })

    if (conversationVersion !== conversationVersionRef.current) return

    if (quickReply?.action === 'CANCEL_BUDGET') {
      const sourceSummaryMessageId = actionValue
      if (sourceSummaryMessageId) quoteSubmissionRef.current.delete(sourceSummaryMessageId)
      pendingQuoteRef.current = null
      savePendingQuote(business.id, null)
      setSubmittingQuoteMessageId(null)
      setAwaitingInput(null)
      saveAwaitingInput(business.id, null)
      setContactName('')

      const botMessages = createBotMessages(createMainMenuResponse())
      setMessages(previousMessages => {
        const nextMessages = [...previousMessages, ...botMessages]
        saveChatHistory(business.id, nextMessages)
        return nextMessages
      })
      if (consultationId) {
        botMessages.forEach(message => {
          void persistPublicMessage(consultationId, 'bot', message.text).catch(() => undefined)
        })
      }
      setIsTyping(false)
      return
    }

    if (awaitingInput === 'quote-contact-name') {
      const name = text.trim()
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(name)) {
        const botMsg: Message = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: 'Necesito un nombre válido usando solamente letras y espacios.',
          timestamp: new Date(),
        }
        setMessages(prev => {
          const next = [...prev, botMsg]
          saveChatHistory(business.id, next)
          return next
        })
        if (consultationId) await persistPublicMessage(consultationId, 'bot', botMsg.text).catch(() => undefined)
        setIsTyping(false)
        return
      }

      setContactName(name)
      if (pendingQuoteRef.current) {
        pendingQuoteRef.current = { ...pendingQuoteRef.current, customerName: name }
        savePendingQuote(business.id, pendingQuoteRef.current)
      }
      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: 'bot',
        text: `¡Hola ${name}! ¿Y tu número de teléfono?`,
        timestamp: new Date(),
      }
      setMessages(prev => {
        const next = [...prev, botMsg]
        saveChatHistory(business.id, next)
        return next
      })
      if (consultationId) await persistPublicMessage(consultationId, 'bot', botMsg.text).catch(() => undefined)
      setAwaitingInput('quote-contact-phone')
      saveAwaitingInput(business.id, 'quote-contact-phone')
      setIsTyping(false)
      return
    }

    if (awaitingInput === 'quote-contact-phone') {
      const phone = text.trim().replace(/[\s-]/g, '')

      if (!/^\+?[0-9]{8,15}$/.test(phone)) {
        const botMsg: Message = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: 'Por favor ingresá un teléfono válido de entre 8 y 15 números, para que luego podamos contactarte.',
          timestamp: new Date(),
        }
        setMessages(prev => {
          const next = [...prev, botMsg]
          saveChatHistory(business.id, next)
          return next
        })
        if (consultationId) await persistPublicMessage(consultationId, 'bot', botMsg.text).catch(() => undefined)
        setIsTyping(false)
        return
      }

      // Teléfono válido: guardarlo y mostrar paso de confirmación
      if (pendingQuoteRef.current) {
        pendingQuoteRef.current = { ...pendingQuoteRef.current, customerPhone: phone }
        savePendingQuote(business.id, pendingQuoteRef.current)
      }

      const confirmMsg: Message = {
        id: crypto.randomUUID(),
        role: 'bot',
        text: '¡Listo! Ya tengo toda la información necesaria.\n\nSi todo está bien, seleccioná "Confirmar presupuesto" para generarlo.\n\nVas a poder descargar tu cotización y una persona del negocio se estará contactando con vos.',
        timestamp: new Date(),
        confirmQuote: true,
      }
      setMessages(prev => {
        const next = [...prev, confirmMsg]
        saveChatHistory(business.id, next)
        return next
      })
      if (consultationId) await persistPublicMessage(consultationId, 'bot', confirmMsg.text).catch(() => undefined)
      setAwaitingInput('quote-confirm')
      saveAwaitingInput(business.id, 'quote-confirm')
      setIsTyping(false)
      return
    }

    if (awaitingInput === 'quote-confirm') {
      const isConfirmation = quickReply?.action === 'CONFIRM_BUDGET'
        || (!quickReply && text.trim() === 'Confirmar presupuesto')
      if (!isConfirmation) {
        setIsTyping(false)
        return
      }

      const pendingQuote = pendingQuoteRef.current
      const customerName = contactName || pendingQuote?.customerName || ''
      const phone = pendingQuote?.customerPhone || ''

      try {
        if (!consultationId || !pendingQuote || !phone) throw new Error('No hay una solicitud pendiente.')
        await updatePublicContact(
          business.slug,
          consultationId,
          customerName,
          phone,
          'presupuesto',
        )
        const presupuesto = await createPublicBudget(business.slug, consultationId, {
          items: pendingQuote.summary.items.map(item => ({
            productoId: item.productId,
            nombre: item.name,
            cantidad: item.quantity,
            ...(item.unitPrice != null ? { precioUnitario: item.unitPrice } : {}),
            requiereCotizacion: item.requiresQuote,
          })),
          diasValidez: 7,
          idempotencyKey: pendingQuote.sourceSummaryMessageId,
        })
        const confirmationText = 'Tu solicitud de presupuesto fue registrada correctamente.'
        await persistPublicMessage(consultationId, 'bot', confirmationText)

        const generatedMsg: Message = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: '',
          timestamp: new Date(),
          generatedQuote: {
            requestRegistered: true,
            sourceSummaryMessageId: pendingQuote.sourceSummaryMessageId,
            quoteId: String(presupuesto.id),
            status: presupuesto.estado,
            pdfUrl: presupuesto.linkPdf ?? undefined,
            issuedAt: presupuesto.fechaEmision,
            expiresAt: presupuesto.fechaVencimiento,
            customer: { name: customerName, phone },
            items: pendingQuote.summary.items,
            total: presupuesto.total,
          },
        }
        const followUpMsg: Message = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: `Recibimos tu solicitud. Una persona del negocio se comunicará con vos a la brevedad. ¡Gracias por comunicarte con ${business.nombre}!`,
          timestamp: new Date(),
          quickReplies: [
            { id: 'quote-show-faq-menu', label: 'Preguntas frecuentes', action: 'SHOW_FAQ_MENU' },
            { id: 'quote-start-human-handoff', label: 'Hablar con una persona', action: 'START_HUMAN_HANDOFF' },
            MAIN_MENU_REPLY,
          ],
        }
        setMessages(prev => {
          const next = [...prev, generatedMsg, followUpMsg]
          saveChatHistory(business.id, next)
          return next
        })
        setAwaitingInput(null)
        saveAwaitingInput(business.id, null)
        pendingQuoteRef.current = null
        savePendingQuote(business.id, null)
        setContactName('')
      } catch (error) {
        if (isNetworkError(error) || !navigator.onLine) {
          onNetworkError?.()
          if (pendingQuote) quoteSubmissionRef.current.delete(pendingQuote.sourceSummaryMessageId)
          setSubmittingQuoteMessageId(null)
          setIsTyping(false)
          return
        }
        if (pendingQuote) quoteSubmissionRef.current.delete(pendingQuote.sourceSummaryMessageId)
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: 'No pudimos registrar el cliente y el presupuesto. Intentá nuevamente.',
          timestamp: new Date(),
          quickReplies: [MAIN_MENU_REPLY],
        }
        setMessages(prev => {
          const next = [...prev, errorMsg]
          saveChatHistory(business.id, next)
          return next
        })
      } finally {
        setSubmittingQuoteMessageId(null)
        setIsTyping(false)
      }
      return
    }

    // Flujo de captura de datos de contacto
    if (awaitingInput === 'contact-name') {
      const name = text.trim() || 'usuario'
      setContactName(name)
      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: 'bot',
        text: `¡Gracias ${name}! ¿Cuál es tu número de teléfono?`,
        timestamp: new Date(),
      }
      setMessages(prev => {
        const next = [...prev, botMsg]
        saveChatHistory(business.id, next)
        return next
      })
      if (consultationId) void persistPublicMessage(consultationId, 'bot', botMsg.text).catch(() => undefined)
      setAwaitingInput('contact-phone')
      saveAwaitingInput(business.id, 'contact-phone')
      setIsTyping(false)
      return
    }

    if (awaitingInput === 'contact-phone') {
      const phone = text.trim().replace(/[\s-]/g, '')

      if (!/^\+?[0-9]{8,15}$/.test(phone)) {
        const botMsg: Message = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: 'Por favor ingresá un teléfono válido de entre 8 y 15 números, para que luego podamos contactarte.',
          timestamp: new Date(),
        }
        setMessages(prev => {
          const next = [...prev, botMsg]
          saveChatHistory(business.id, next)
          return next
        })
        if (consultationId) await persistPublicMessage(consultationId, 'bot', botMsg.text).catch(() => undefined)
        setIsTyping(false)
        return
      }

      if (consultationId) {
        try {
          await updatePublicContact(
          business.slug,
          consultationId,
          contactName,
          phone,
          'derivacion',
          )
        } catch (error) {
          if (isNetworkError(error) || !navigator.onLine) onNetworkError?.()
          const errorMsg: Message = {
            id: crypto.randomUUID(), role: 'bot',
            text: 'No pudimos registrar tu solicitud de contacto. Intentá nuevamente.',
            timestamp: new Date(),
          }
          setMessages(prev => {
            const next = [...prev, errorMsg]
            saveChatHistory(business.id, next)
            return next
          })
          setIsTyping(false)
          return
        }
      } else {
        onNetworkError?.()
        setIsTyping(false)
        return
      }
      // TODO: POST /api/consultas cuando el backend esté listo
      console.log('Derivación a asesor:', { nombre: contactName, telefono: phone, businessId: business.id })
      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: 'bot',
        text: `Perfecto ${contactName}.\nRecibimos tu solicitud de contacto. Una persona del negocio se comunicará con vos a la brevedad. ¡Gracias por contactarte!`,
        timestamp: new Date(),
        quickReplies: QUICK_REPLIES_INICIAL,
      }
      setMessages(prev => {
        const next = [...prev, botMsg]
        saveChatHistory(business.id, next)
        return next
      })
      if (consultationId) void persistPublicMessage(consultationId, 'bot', botMsg.text).catch(() => undefined)
      setAwaitingInput(null)
      saveAwaitingInput(business.id, null)
      setContactName('')
      setIsTyping(false)
      return
    }

    const response = quickReply
      ? generateQuickReplyResponse(quickReply, business)
      : generateBotResponse(text, business, awaitingInput)
    const botMessages = createBotMessages(response)
    const nextAwaitingInput = response.awaitingInput ?? null

    setMessages(previousMessages => {
      const nextMessages = [...previousMessages, ...botMessages]
      saveChatHistory(business.id, nextMessages)
      return nextMessages
    })
    if (consultationId) {
      botMessages.forEach(message => {
        void persistPublicMessage(consultationId, 'bot', message.text).catch(() => undefined)
      })
    }
    setAwaitingInput(nextAwaitingInput)
    saveAwaitingInput(business.id, nextAwaitingInput)
    setIsTyping(false)
  }, [awaitingInput, business, contactName, ensureConsultation, isOnline, isTyping, onNetworkError, persistPublicMessage])

  const sendMessage = useCallback((text: string) => processMessage(text), [processMessage])

  const handleQuickReply = useCallback(
    (option: QuickReplyOption) => processMessage(option.label, option),
    [processMessage],
  )

  const submitOrder = useCallback((items: OrderItem[]) => {
    if (items.length === 0) return
    const summary = items.map(i => `${i.product.nombre} x${i.quantity}`).join(', ')
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: summary,
      timestamp: new Date(),
    }

    const quoteSummary: QuoteSummaryMessageData = {
      items: items.map(({ product, quantity }) => {
        const requiresQuote = product.precioConsultar === true
        const unitPrice = product.precio
        const hasConfirmedPrice = unitPrice != null && Number.isFinite(unitPrice)
        return {
          productId: product.id,
          name: product.nombre,
          quantity,
          requiresQuote,
          ...(!requiresQuote && hasConfirmedPrice
            ? { unitPrice, subtotal: unitPrice * quantity }
            : {}),
        }
      }),
      subtotal: items.reduce((total, { product, quantity }) => (
        product.precioConsultar !== true && product.precio != null && Number.isFinite(product.precio)
          ? total + product.precio * quantity
          : total
      ), 0),
    }

    const botMsg: Message = {
      id: crypto.randomUUID(),
      role: 'bot',
      text: '',
      timestamp: new Date(),
      quoteSummary,
    }

    setMessages(prev => {
      const next = [...prev, userMsg, botMsg]
      saveChatHistory(business.id, next)
      return next
    })
    void ensureConsultation().then(async consultationId => {
      if (!consultationId) return
      const activeConsultationId = await persistPublicMessage(consultationId, 'cliente', userMsg.text)
      await persistPublicMessage(activeConsultationId, 'bot', 'Resumen del pedido listo para confirmar.')
    }).catch(() => undefined)
  }, [business, ensureConsultation, persistPublicMessage])

  const requestQuote = useCallback(async (
    sourceSummaryMessageId: string,
    summary: QuoteSummaryMessageData,
    option: QuickReplyOption,
  ) => {
    if (option.action !== 'REQUEST_BUDGET') return
    if (quoteSubmissionRef.current.has(sourceSummaryMessageId)) return
    quoteSubmissionRef.current.add(sourceSummaryMessageId)
    setSubmittingQuoteMessageId(sourceSummaryMessageId)

    try {
      const consultationId = await ensureConsultation()
      if (!consultationId) throw new Error('No se pudo registrar la consulta.')

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        text: option.label,
        timestamp: new Date(),
        action: option.action,
        actionValue: sourceSummaryMessageId,
      }
      const activeConsultationId = await persistPublicMessage(consultationId, 'cliente', userMsg.text)
      const contactPrompt: Message = {
        id: crypto.randomUUID(),
        role: 'bot',
        text: '¡Genial! Voy a preparar el presupuesto con los productos seleccionados.\nAntes necesito registrar tus datos:\n¿Cuál es tu nombre?',
        timestamp: new Date(),
      }
      await persistPublicMessage(activeConsultationId, 'bot', contactPrompt.text)

      setMessages(previousMessages => {
        const nextMessages = [...previousMessages, userMsg, contactPrompt]
        saveChatHistory(business.id, nextMessages)
        return nextMessages
      })
      const pendingQuote = { sourceSummaryMessageId, summary }
      pendingQuoteRef.current = pendingQuote
      savePendingQuote(business.id, pendingQuote)
      setAwaitingInput('quote-contact-name')
      saveAwaitingInput(business.id, 'quote-contact-name')
    } catch (error) {
      quoteSubmissionRef.current.delete(sourceSummaryMessageId)
      if (isNetworkError(error) || !navigator.onLine) {
        onNetworkError?.()
        setSubmittingQuoteMessageId(null)
        return
      }
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'bot',
        text: 'No pudimos registrar la solicitud. Podés intentarlo nuevamente.',
        timestamp: new Date(),
      }
      setMessages(previousMessages => {
        const nextMessages = [...previousMessages, errorMessage]
        saveChatHistory(business.id, nextMessages)
        return nextMessages
      })
      setSubmittingQuoteMessageId(null)
    }
  }, [business.id, ensureConsultation, onNetworkError, persistPublicMessage])

  const reset = useCallback(() => {
    conversationVersionRef.current += 1
    cancelPendingResponse()

    clearChatHistory(business.id)
    clearChatState(business.id)
    clearStoredConsultation(business.slug)
    consultationPromiseRef.current = null
    canReuseInitialConsultationRef.current = false
    chatSessionIdRef.current = crypto.randomUUID()
    quoteSubmissionRef.current.clear()
    pendingQuoteRef.current = null
    savePendingQuote(business.id, null)
    setSubmittingQuoteMessageId(null)
    const initialMessages = [createInitialMessage(business)]
    setMessages(initialMessages)
    setAwaitingInput(null)
    setContactName('')
    saveChatHistory(business.id, initialMessages)
    setIsTyping(false)
  }, [business, cancelPendingResponse])

  return {
    messages,
    isTyping,
    sendMessage,
    handleQuickReply,
    submitOrder,
    requestQuote,
    submittingQuoteMessageId,
    awaitingInput,
    cancelledQuoteMessageIds,
    reset,
  }
}
