import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChatHeader } from '../components/chat/ChatHeader'
import { ChatInput } from '../components/chat/ChatInput'
import { MessageBubble, TypingIndicator } from '../components/chat/MessageBubble'
import { FaqListMessage } from '../components/chat/FaqListMessage'
import { ProductCatalogMessage } from '../components/chat/ProductCatalogMessage'
import { QuickReplies } from '../components/chat/QuickReplies'
import { useBusiness } from '../context/BusinessContext'
import { useChat } from '../hooks/useChat'
import type { Business } from '../types'
import { useAuth } from '../context/AuthContext'

// Página pública: www.emprendebot/[slug]
export function ChatbotPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { loadBusinessBySlug } = useBusiness()
  const { user } = useAuth()
  const business = slug ? loadBusinessBySlug(slug) : null

  if (!business) {
    return (
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

  return (
    <PublicChat
      key={business.id}
      business={business}
      onBackToDashboard={user ? () => navigate('/dashboard') : undefined}
    />
  )
}

function PublicChat({ business, onBackToDashboard }: { business: Business; onBackToDashboard?: () => void }) {
  const { messages, isTyping, sendMessage, submitOrder, reset } = useChat(business)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isInitialScrollRef = useRef(true)

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

  const lastBotWithReplies = [...messages].reverse().find(
    message => message.role === 'bot' && message.quickReplies && message.quickReplies.length > 0
  )
  const activeQuickReplies = isTyping ? [] : (lastBotWithReplies?.quickReplies ?? [])

  return (
    <div className="public-chat">
      <ChatHeader business={business} onRefresh={reset} onBackToDashboard={onBackToDashboard} />

      <div ref={messagesContainerRef} className="public-chat__messages">
        {messages.map(message => (
          <div key={message.id}>
            {message.text && <MessageBubble message={message} />}
            {message.products && message.products.length > 0 && message.id === lastProductsMessageId && !isTyping && (
              <ProductCatalogMessage products={message.products} onConfirm={submitOrder} />
            )}
            {message.faqs && message.faqs.length > 0 && message.id === lastFaqsMessageId && !isTyping && (
              <FaqListMessage faqs={message.faqs} onSelect={sendMessage} />
            )}
            {message.id === messages[messages.length - 1]?.id &&
              message.role === 'bot' &&
              !isTyping &&
              message.quickReplies && message.quickReplies.length > 0 && (
                <QuickReplies options={message.quickReplies} onSelect={sendMessage} />
              )}
          </div>
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} className="public-chat__end" aria-hidden="true" />
      </div>

      {!isTyping && activeQuickReplies.length > 0 &&
        messages[messages.length - 1]?.role !== 'bot' && (
          <div className="public-chat__suggestions">
            <QuickReplies options={activeQuickReplies} onSelect={sendMessage} />
          </div>
        )}

      <ChatInput onSend={sendMessage} disabled={isTyping} />
    </div>
  )
}
