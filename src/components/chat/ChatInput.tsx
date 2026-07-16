import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
}

const TEXTAREA_MIN_HEIGHT = 44
const TEXTAREA_MAX_HEIGHT = 120

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wasDisabledRef = useRef(disabled)

  useEffect(() => {
    const wasDisabled = wasDisabledRef.current
    wasDisabledRef.current = disabled

    if (wasDisabled && !disabled) {
      textareaRef.current?.focus({ preventScroll: true })
    }
  }, [disabled])

  const resetTextareaHeight = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = `${TEXTAREA_MIN_HEIGHT}px`
    textarea.style.overflowY = 'hidden'
  }

  const sendCurrentMessage = () => {
    const text = value.trim()
    if (!text || disabled) return

    onSend(text)
    setValue('')
    resetTextareaHeight()
    textareaRef.current?.focus({ preventScroll: true })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendCurrentMessage()
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    setValue(textarea.value)

    textarea.style.height = `${TEXTAREA_MIN_HEIGHT}px`
    const nextHeight = Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT)
    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY = textarea.scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden'
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      sendCurrentMessage()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="public-chat__input"
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '10px',
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: 'var(--color-bg)',
        borderTop: '1px solid var(--color-border)',
        flexShrink: 0,
        position: 'sticky',
        bottom: 0,
        zIndex: 2,
      }}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Mensaje"
        enterKeyHint="send"
        placeholder="Escribí tu mensaje..."
        className="public-chat__textarea"
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        aria-label="Enviar mensaje"
        style={{
          width: 44, height: 44,
          borderRadius: '50%',
          background: 'var(--color-secondary)',
          border: 'none',
          color: '#fff',
          cursor: value.trim() && !disabled ? 'pointer' : 'not-allowed',
          opacity: value.trim() && !disabled ? 1 : 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0,
          transition: 'opacity var(--transition)',
        }}
      >
        ➤
      </button>
    </form>
  )
}
