import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, style, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {label && (
          <label
            htmlFor={textareaId}
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          style={{
            minHeight: '112px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
            fontSize: '15px',
            lineHeight: 1.5,
            color: 'var(--color-text-primary)',
            background: 'var(--color-bg)',
            resize: 'vertical',
            outline: 'none',
            transition: 'border-color var(--transition)',
            width: '100%',
            ...style,
          }}
          onFocus={event => { event.currentTarget.style.borderColor = 'var(--color-primary)' }}
          onBlur={event => {
            event.currentTarget.style.borderColor = error ? 'var(--color-error)' : 'var(--color-border)'
          }}
          {...props}
        />
        {error && <span style={{ fontSize: '12px', color: 'var(--color-error)' }}>{error}</span>}
        {hint && !error && (
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{hint}</span>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
