import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChatHeader } from '../components/chat/ChatHeader'
import { ChatInput } from '../components/chat/ChatInput'
import { MessageBubble, TypingIndicator } from '../components/chat/MessageBubble'
import { FaqListMessage } from '../components/chat/FaqListMessage'
import { ProductCatalogMessage } from '../components/chat/ProductCatalogMessage'
import { QuickReplies } from '../components/chat/QuickReplies'
import { QuoteSummaryCard } from '../components/chat/QuoteSummaryCard'
import { GeneratedQuoteCard } from '../components/chat/GeneratedQuoteCard'
import '../components/chat/quoteCards.css'
import { useChat } from '../hooks/useChat'
import type { Business, FAQ, Product } from '../types'
import { getPublicBusinessApi, getPublicFaqsApi, getPublicProductsApi } from '../services/publicApi'
import { resolveChatAppearance } from '../services/chatAppearance'
import { FloatingChatWindow } from '../components/chat/FloatingChatWindow'
import { PublicChatBackground } from '../components/chat/PublicChatBackground'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { restoreChatPreviewFocus } from '../utils/chatRoutes'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { isNetworkError } from '../utils/networkError'
import { ConnectionNotice } from '../components/chat/ConnectionNotice'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog'

// Página pública: www.emprendebot/[slug]
export function ChatbotPage({ preview = false }: { preview?: boolean }) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [business, setBusiness] = useState<Business | null>(null)
  const [isBusinessLoading, setIsBusinessLoading] = useState(Boolean(slug))
  const [publicFaqs, setPublicFaqs] = useState<FAQ[] | null>(null)
  const [publicProducts, setPublicProducts] = useState<Product[] | null>(null)
  const isBrowserOnline = useNetworkStatus()
  const [hasNetworkError, setHasNetworkError] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryStatus, setRetryStatus] = useState<'offline' | 'server' | null>(null)

  const renderRouteExperience = (content: ReactNode) => preview
    ? content
    : <div className="public-chat-theme--light">{content}</div>

  const closePreview = useCallback(() => {
    const hasBackground = Boolean((location.state as { backgroundPath?: string } | null)?.backgroundPath)
    if (hasBackground) navigate(-1)
    else navigate('/dashboard')
    restoreChatPreviewFocus()
  }, [location.state, navigate])

  useEffect(() => {
    if (!preview) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePreview()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closePreview, preview])

  useEffect(() => {
    if (!slug) return
    getPublicBusinessApi(slug)
      .then(setBusiness)
      .catch(error => {
        if (isNetworkError(error)) setHasNetworkError(true)
        else setBusiness(null)
      })
      .finally(() => setIsBusinessLoading(false))
  }, [slug])

  useEffect(() => {
    if (!slug) return
    getPublicFaqsApi(slug)
      .then(faqs => setPublicFaqs(faqs))
      .catch(error => {
        if (isNetworkError(error)) setHasNetworkError(true)
        else setPublicFaqs([])
      })

    getPublicProductsApi(slug)
      .then(products => setPublicProducts(products))
      // Compatibilidad: si el endpoint todavía no existe, se conservan
      // los productos incluidos por /init.
      .catch(error => {
        if (isNetworkError(error)) setHasNetworkError(true)
        setPublicProducts(null)
      })
  }, [slug])

  const retryConnection = useCallback(async () => {
    if (!slug || isRetrying) return

    setIsRetrying(true)
    setRetryStatus(null)

    if (!navigator.onLine) {
      await new Promise(resolve => window.setTimeout(resolve, 350))
      setHasNetworkError(true)
      setRetryStatus('offline')
      setIsRetrying(false)
      return
    }

    try {
      const [nextBusiness, nextFaqs, nextProducts] = await Promise.all([
        getPublicBusinessApi(slug),
        getPublicFaqsApi(slug),
        getPublicProductsApi(slug),
      ])
      setBusiness(nextBusiness)
      setPublicFaqs(nextFaqs)
      setPublicProducts(nextProducts)
      setHasNetworkError(false)
      setRetryStatus(null)
    } catch (error) {
      if (isNetworkError(error)) {
        setHasNetworkError(true)
        setRetryStatus('offline')
      } else {
        setRetryStatus('server')
      }
    } finally {
      setIsRetrying(false)
    }
  }, [isRetrying, slug])

  if (isBusinessLoading && !business) {
    return renderRouteExperience(
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        color: 'var(--color-text-secondary)', fontSize: '14px',
      }}>
        Cargando chatbot...
      </div>
    )
  }

  if (!business && (!isBrowserOnline || hasNetworkError)) {
    return renderRouteExperience(<main className="public-chat__load-error"><ConnectionNotice isRetrying={isRetrying} retryStatus={retryStatus} onRetry={() => void retryConnection()} /></main>)
  }

  if (!business) {
    return renderRouteExperience(
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', textAlign: 'center', gap: '16px',
      }}>
        <span style={{ fontSize: '48px' }}>🔍</span>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Negocio no encontrado</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          El link que buscás no existe o fue desactivado.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            color: 'var(--color-primary)', fontWeight: 600,
            border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-family)', fontSize: '14px',
          }}
        >
          ← Volver al inicio
        </button>
      </div>
    )
  }

  const publicBusiness: Business = {
    ...business,
    ...(publicFaqs !== null ? { faq: publicFaqs } : {}),
    ...(publicProducts !== null ? { productos: publicProducts } : {}),
  }

  const chat = (
    <PublicChat
      key={business.id}
      business={publicBusiness}
      preview={preview}
      onClose={preview ? closePreview : undefined}
      isOnline={isBrowserOnline && !hasNetworkError}
      isRetrying={isRetrying}
      retryStatus={retryStatus}
      onNetworkError={() => setHasNetworkError(true)}
      onRetry={() => void retryConnection()}
    />
  )
  const publicBackgroundVariant = 'light'

  return preview
    ? <div className="chat-preview-overlay">{chat}</div>
    : renderRouteExperience(<PublicChatBackground variant={publicBackgroundVariant}>{chat}</PublicChatBackground>)
}

interface PublicChatProps {
  business: Business
  preview: boolean
  onClose?: () => void
  isOnline: boolean
  isRetrying: boolean
  retryStatus: 'offline' | 'server' | null
  onNetworkError: () => void
  onRetry: () => void
}

function PublicChat({ business, preview, onClose, isOnline, isRetrying, retryStatus, onNetworkError, onRetry }: PublicChatProps) {
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    title: string
    confirmLabel: string
    cancelLabel: string
    action: () => void
  } | null>(null)
  const {
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
  } = useChat(business, { isOnline, onNetworkError })
  const previewInitializedRef = useRef(false)
  const appearance = resolveChatAppearance(business)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isInitialScrollRef = useRef(true)
  const isDesktop = useMediaQuery('(min-width: 481px)')

  useEffect(() => {
    if (!preview || previewInitializedRef.current) return
    previewInitializedRef.current = true
    reset()
  }, [preview, reset])

  useEffect(() => {
    document.documentElement.classList.add('public-chat-active')
    document.body.classList.add('public-chat-active')

    return () => {
      document.documentElement.classList.remove('public-chat-active')
      document.body.classList.remove('public-chat-active')
    }
  }, [])

  useEffect(() => {
    const container = messagesContainerRef.current
    const endMarker = messagesEndRef.current
    if (!container || !endMarker) return

    let secondFrame = 0
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        container.scrollTo({
          top: endMarker.offsetTop,
          behavior: isInitialScrollRef.current ? 'auto' : 'smooth',
        })
        isInitialScrollRef.current = false
      })
    })

    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
    }
  }, [messages, isTyping])

  const lastProductsMessageId = [...messages].reverse().find(m => m.products?.length)?.id
  const lastFaqsMessageId = [...messages].reverse().find(m => m.faqs?.length)?.id
  const lastConfirmMessageId = [...messages].reverse().find(message => message.confirmQuote)?.id

  const lastBotWithReplies = [...messages].reverse().find(
    message => message.role === 'bot' && message.quickReplies && message.quickReplies.length > 0
  )
  const activeQuickReplies = isTyping ? [] : (lastBotWithReplies?.quickReplies ?? [])

  return (
    <FloatingChatWindow draggable={isDesktop} preview={preview}>
      {dragHandleProps => <div
        className="public-chat"
        style={{
        '--chat-primary': appearance.primary,
        '--chat-secondary': appearance.secondary,
        '--chat-gradient': `linear-gradient(90deg, ${appearance.primary}, ${appearance.secondary})`,
        '--color-primary': appearance.primary,
        '--color-secondary': appearance.secondary,
        '--color-bg-answer': appearance.primary,
      } as CSSProperties}
    >
      <ChatHeader
        business={business}
        onRefresh={preview ? () => setPendingConfirmation({
          title: '¿Reiniciar chat?',
          confirmLabel: 'Reiniciar',
          cancelLabel: 'Cancelar',
          action: reset,
        }) : undefined}
        onClose={onClose}
        dragHandleProps={dragHandleProps}
        draggable={isDesktop}
        isOnline={isOnline}
      />

      {!isOnline && <ConnectionNotice isRetrying={isRetrying} retryStatus={retryStatus} onRetry={onRetry} />}

      <div ref={messagesContainerRef} className="public-chat__messages">
        {messages.map(message => (
          <div key={message.id}>
            {message.text && <MessageBubble message={message} />}
            {message.quoteSummary && (
              <QuoteSummaryCard
                data={message.quoteSummary}
                isSubmitting={submittingQuoteMessageId === message.id}
                isCancelled={cancelledQuoteMessageIds.has(message.id)}
                isSubmitted={messages.some(
                  candidate => candidate.generatedQuote?.sourceSummaryMessageId === message.id,
                )}
                onContinue={() => isOnline ? void requestQuote(message.id, message.quoteSummary!, {
                  id: `request-budget-${message.id}`,
                  label: 'Solicitar presupuesto',
                  action: 'REQUEST_BUDGET',
                  value: message.id,
                }) : onNetworkError()}
                onCancel={() => setPendingConfirmation({
                  title: '¿Cancelar presupuesto?',
                  confirmLabel: 'Cancelar',
                  cancelLabel: 'Volver',
                  action: () => handleQuickReply({
                    id: `cancel-budget-${message.id}`,
                    label: 'Cancelar presupuesto',
                    action: 'CANCEL_BUDGET',
                    value: message.id,
                  }),
                })}
              />
            )}
            {message.generatedQuote && (
              <GeneratedQuoteCard data={message.generatedQuote} businessName={business.nombre} />
            )}
            {message.confirmQuote &&
              message.id === lastConfirmMessageId &&
              awaitingInput === 'quote-confirm' &&
              !isTyping && (
                <div style={{ margin: '4px 0 12px 44px', width: 'calc(100% - 44px)', maxWidth: 520 }}>
                  <div className="chat-quote-card__actions chat-quote-card__actions--stacked">
                    <button
                      type="button"
                      className="chat-quote-card__primary"
                      onClick={() => isOnline ? handleQuickReply({
                        id: 'confirm-budget',
                        label: 'Confirmar presupuesto',
                        action: 'CONFIRM_BUDGET',
                      }) : onNetworkError()}
                    >
                      Confirmar presupuesto
                    </button>
                    <button
                      type="button"
                      className="chat-quote-card__secondary"
                      onClick={() => setPendingConfirmation({
                        title: '¿Cancelar presupuesto?',
                        confirmLabel: 'Cancelar',
                        cancelLabel: 'Volver',
                        action: () => handleQuickReply({
                          id: 'cancel-confirm-budget',
                          label: 'Cancelar presupuesto',
                          action: 'CANCEL_BUDGET',
                        }),
                      })}
                    >
                      Cancelar presupuesto
                    </button>
                  </div>
                </div>
              )}
            {message.products && message.products.length > 0 && message.id === lastProductsMessageId && message.id === messages[messages.length - 1]?.id && !isTyping && (
              <ProductCatalogMessage
                products={message.products}
                onConfirm={submitOrder}
                onBack={() => handleQuickReply({
                  id: 'catalog-back-main-menu',
                  label: 'Volver al menú principal',
                  action: 'SHOW_MAIN_MENU',
                })}
              />
            )}
            {message.faqs && message.faqs.length > 0 && message.id === lastFaqsMessageId && !isTyping && (
              <FaqListMessage
                faqs={message.faqs}
                onSelect={faq => handleQuickReply({
                  id: `select-faq-${faq.id}`,
                  label: faq.pregunta,
                  action: 'SELECT_FAQ',
                  value: faq.id,
                })}
              />
            )}
            {message.id === messages[messages.length - 1]?.id &&
              message.role === 'bot' &&
              !isTyping &&
              message.quickReplies && message.quickReplies.length > 0 && (
                <QuickReplies options={message.quickReplies} onSelect={handleQuickReply} />
              )}
          </div>
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} className="public-chat__end" aria-hidden="true" />
      </div>

      {!isTyping && awaitingInput !== 'quote-confirm' && activeQuickReplies.length > 0 &&
        messages[messages.length - 1]?.role !== 'bot' && (
          <div className="public-chat__suggestions">
            <QuickReplies options={activeQuickReplies} onSelect={handleQuickReply} />
          </div>
        )}

      <ChatInput onSend={sendMessage} disabled={isTyping || !isOnline} />
      <ConfirmationDialog
        open={Boolean(pendingConfirmation)}
        title={pendingConfirmation?.title ?? ''}
        confirmLabel={pendingConfirmation?.confirmLabel ?? ''}
        cancelLabel={pendingConfirmation?.cancelLabel ?? 'Cancelar'}
        onOpenChange={open => { if (!open) setPendingConfirmation(null) }}
        onConfirm={() => {
          if (!pendingConfirmation) return
          const action = pendingConfirmation.action
          setPendingConfirmation(null)
          action()
        }}
      />
      </div>}
    </FloatingChatWindow>
  )
}
