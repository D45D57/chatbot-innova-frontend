import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  endAdornment?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, endAdornment, id, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {label && (
          <label
            htmlFor={inputId}
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
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            ref={ref}
            id={inputId}
            style={{
              height: '52px',
              padding: endAdornment ? '0 52px 0 16px' : '0 16px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
              fontSize: '15px',
              color: 'var(--color-text-primary)',
              background: 'var(--color-bg)',
              outline: 'none',
              transition: 'border-color var(--transition)',
              width: '100%',
              ...style,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
            onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--color-error)' : 'var(--color-border)' }}
            {...props}
          />
          {endAdornment && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              height: '52px',
              display: 'flex',
              alignItems: 'center',
            }}>
              {endAdornment}
            </div>
          )}
        </div>
        {error && (
          <span style={{ fontSize: '12px', color: 'var(--color-error)' }}>{error}</span>
        )}
        {hint && !error && (
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{hint}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
