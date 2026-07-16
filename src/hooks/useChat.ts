import { useCallback, useEffect, useRef, useState } from 'react'
import type { AwaitingInput, Business, FAQ, Message, Product } from '../types'

export interface OrderItem {
  product: Product
  quantity: number
}
import {
  clearChatHistory,
  clearChatState,
  loadAwaitingInput,
  loadChatHistory,
  saveAwaitingInput,
  saveChatHistory,
} from '../services/chatStorage'
import { createPublicConsultation, savePublicMessage, updatePublicContact } from '../services/publicConsultationApi'

const QUICK_REPLIES_INICIAL = [
  'Ver catálogo',
  'Solicitar presupuesto',
  'Horarios de atención',
  'Preguntas frecuentes',
  'Hablar con una persona',
]

interface BotResponse {
  text: string
  quickReplies?: string[]
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
  return MENU_COMMANDS.includes(message) || message === 'volver al menu' || message === 'menu principal'
}

function isFaqMenuCommand(message: string): boolean {
  return message === 'faq'
    || message === 'faqs'
    || message === 'volver a faq'
    || message === 'volver a faqs'
    || message === 'preguntas frecuentes'
    || message === 'ver preguntas frecuentes'
}

function getActiveFaqs(business: Business): FAQ[] {
  return business.faq
    .filter(faq => faq.activa)
    .sort((left, right) => (left.orden ?? 0) - (right.orden ?? 0))
}

function createFaqMenuResponse(business: Business): BotResponse {
  const activeFaqs = getActiveFaqs(business)

  if (activeFaqs.length === 0) {
    return {
      text: 'No hay preguntas frecuentes activas en este momento. Podés volver al menú principal.',
      quickReplies: ['Menú principal'],
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

function generateBotResponse(
  userMessage: string,
  business: Business,
  awaitingInput: AwaitingInput | null,
): BotResponse {
  const msg = userMessage.toLowerCase()
  const normalizedMessage = normalizeMessage(userMessage)

  if (isMenuCommand(normalizedMessage)) {
    return {
      text: '',
      quickReplies: QUICK_REPLIES_INICIAL,
    }
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
    const activeFaqs = getActiveFaqs(business)
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

    return {
      text: selectedFaq.respuesta,
      quickReplies: ['Ver preguntas frecuentes', 'Volver al menú principal'],
    }
  }

  if (msg.includes('producto') || msg.includes('catálogo') || msg.includes('catalogo')) {
    const disponibles = business.productos.filter(p => p.disponible)
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

  if (msg.includes('horario') || msg.includes('información') || msg.includes('informacion')) {
    return {
      text: `🕐 Horario: ${business.horario || 'No especificado'}\n📞 Teléfono: ${business.telefono || 'No especificado'}\n\n${business.descripcion || ''}`,
    }
  }

  if (msg.includes('presupuesto')) {
    return {
      text: "¡Perfecto! Para armar un presupuesto necesito algunos datos. ¿Podés contarme qué productos o servicios te interesan?\n\nSi querés volver al menú principal, escribí 'menú' u 'opciones'.",
      awaitingInput: 'budget',
    }
  }


  if (msg.includes('frecuente') || msg.includes('faq') || msg.includes('pregunta')) {
    return createFaqMenuResponse(business)
  }

  if (msg.includes('persona') || msg.includes('asesor') || msg.includes('hablar')) {
    return {
      text: '¡Perfecto! Para ponerte en contacto con una persona del negocio necesito un par de datos. 😊\n\n¿Cuál es tu nombre?',
      awaitingInput: 'contact-name',
    }
  }

  return {
    text: `Entendido. Estoy aquí para ayudarte con información sobre ${business.nombre}. ¿Qué necesitás?`,
    quickReplies: QUICK_REPLIES_INICIAL,
  }
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

function createInitialMessage(business: Business): Message {
  return {
    id: crypto.randomUUID(),
    role: 'bot',
    text: business.mensajeBienvenida || `¡Hola! Soy el asistente virtual de ${business.nombre}. ¿En qué te puedo ayudar?`,
    timestamp: new Date(),
    quickReplies: QUICK_REPLIES_INICIAL,
  }
}

function getInitialHistory(business: Business): Message[] {
  const storedMessages = loadChatHistory(business.id)
  if (storedMessages.length > 0) return storedMessages

  const initialMessages = [createInitialMessage(business)]
  saveChatHistory(business.id, initialMessages)
  return initialMessages
}

const getTypingDelay = () => 800 + Math.floor(Math.random() * 701)

export function useChat(business: Business) {
  const [messages, setMessages] = useState<Message[]>(() => getInitialHistory(business))
  const [awaitingInput, setAwaitingInput] = useState<AwaitingInput | null>(() => loadAwaitingInput(business.id))
  const [isTyping, setIsTyping] = useState(false)
  const [contactName, setContactName] = useState<string>('')
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingResponseResolverRef = useRef<(() => void) | null>(null)
  const conversationVersionRef = useRef(0)
  const consultationPromiseRef = useRef<Promise<string | null> | null>(null)

  const ensureConsultation = useCallback((): Promise<string | null> => {
    if (!consultationPromiseRef.current) {
      const storageKey = `emprendebot:consulta:${business.slug}`
      const storedId = sessionStorage.getItem(storageKey)
      consultationPromiseRef.current = storedId
        ? Promise.resolve(storedId)
        : createPublicConsultation(business.slug, crypto.randomUUID())
            .then(async consultationId => {
              sessionStorage.setItem(storageKey, consultationId)
              await savePublicMessage(business.slug, consultationId, 'bot', createInitialMessage(business).text)
              return consultationId
            })
            .catch(() => null)
    }
    return consultationPromiseRef.current
  }, [business])

  const cancelPendingResponse = useCallback(() => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current)
      responseTimeoutRef.current = null
    }
    pendingResponseResolverRef.current?.()
    pendingResponseResolverRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      conversationVersionRef.current += 1
      cancelPendingResponse()
    }
  }, [cancelPendingResponse])

  const sendMessage = useCallback(async (text: string) => {
    if (isTyping) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date(),
    }

    setMessages(previousMessages => {
      const nextMessages = [...previousMessages, userMessage]
      saveChatHistory(business.id, nextMessages)
      return nextMessages
    })
    setIsTyping(true)

    const consultationId = await ensureConsultation()
    if (consultationId) {
      void savePublicMessage(business.slug, consultationId, 'cliente', text).catch(() => undefined)
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
      if (consultationId) void savePublicMessage(business.slug, consultationId, 'bot', botMsg.text).catch(() => undefined)
      setAwaitingInput('contact-phone')
      saveAwaitingInput(business.id, 'contact-phone')
      setIsTyping(false)
      return
    }

    if (awaitingInput === 'contact-phone') {
      const phone = text.trim()
      if (consultationId) {
        void updatePublicContact(business.slug, consultationId, contactName, phone).catch(() => undefined)
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
      if (consultationId) void savePublicMessage(business.slug, consultationId, 'bot', botMsg.text).catch(() => undefined)
      setAwaitingInput(null)
      saveAwaitingInput(business.id, null)
      setContactName('')
      setIsTyping(false)
      return
    }

    // Si el usuario hace clic en un chip del menú principal, ignorar el awaitingInput actual
    const isMenuQuickReply = QUICK_REPLIES_INICIAL.some(r => r.toLowerCase() === text.toLowerCase())
    const response = generateBotResponse(text, business, isMenuQuickReply ? null : awaitingInput)
    const botMessages = createBotMessages(response)
    const nextAwaitingInput = response.awaitingInput ?? null

    setMessages(previousMessages => {
      const nextMessages = [...previousMessages, ...botMessages]
      saveChatHistory(business.id, nextMessages)
      return nextMessages
    })
    if (consultationId) {
      botMessages.forEach(message => {
        void savePublicMessage(business.slug, consultationId, 'bot', message.text).catch(() => undefined)
      })
    }
    setAwaitingInput(nextAwaitingInput)
    saveAwaitingInput(business.id, nextAwaitingInput)
    setIsTyping(false)
  }, [awaitingInput, business, contactName, ensureConsultation, isTyping])

  const submitOrder = useCallback((items: OrderItem[]) => {
    const summary = items.map(i => `${i.product.nombre} x${i.quantity}`).join(', ')
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: summary,
      timestamp: new Date(),
    }

    const needsQuote = items.some(i => i.product.precioConsultar)
    let botText: string

    if (needsQuote) {
      const detail = items.map(i => {
        const priceStr = i.product.precioConsultar
          ? '(precio a consultar)'
          : `$${(i.product.precio! * i.quantity).toLocaleString('es-AR')}`
        return `• ${i.product.nombre} x${i.quantity} — ${priceStr}`
      }).join('\n')
      botText = `Recibimos tu solicitud de cotización:\n\n${detail}\n\nEn breve nos contactamos con vos para darte los precios. 😊`
    } else {
      const total = items.reduce((sum, i) => sum + (i.product.precio! * i.quantity), 0)
      const detail = items.map(i =>
        `• ${i.product.nombre} x${i.quantity} — $${(i.product.precio! * i.quantity).toLocaleString('es-AR')}`
      ).join('\n')
      botText = `Tu presupuesto:\n\n${detail}\n\n💰 Total: $${total.toLocaleString('es-AR')}`
    }

    const botMsg: Message = {
      id: crypto.randomUUID(),
      role: 'bot',
      text: botText,
      timestamp: new Date(),
      quickReplies: QUICK_REPLIES_INICIAL,
    }

    setMessages(prev => {
      const next = [...prev, userMsg, botMsg]
      saveChatHistory(business.id, next)
      return next
    })
    void ensureConsultation().then(async consultationId => {
      if (!consultationId) return
      await savePublicMessage(business.slug, consultationId, 'cliente', userMsg.text)
      await savePublicMessage(business.slug, consultationId, 'bot', botMsg.text)
    }).catch(() => undefined)
  }, [business, ensureConsultation])

  const reset = useCallback(() => {
    conversationVersionRef.current += 1
    cancelPendingResponse()

    clearChatHistory(business.id)
    clearChatState(business.id)
    sessionStorage.removeItem(`emprendebot:consulta:${business.slug}`)
    consultationPromiseRef.current = null
    const initialMessages = [createInitialMessage(business)]
    setMessages(initialMessages)
    setAwaitingInput(null)
    setContactName('')
    saveChatHistory(business.id, initialMessages)
    setIsTyping(false)
  }, [business, cancelPendingResponse])

  return { messages, isTyping, sendMessage, submitOrder, reset }
}
