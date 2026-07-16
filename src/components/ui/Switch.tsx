import type { ButtonHTMLAttributes } from 'react'

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}

export function Switch({ checked, label, onChange, disabled, style, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        border: 'none',
        background: 'transparent',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-family)',
        fontSize: '13px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        padding: 0,
        ...style,
      }}
      {...props}
    >
      <span
        aria-hidden="true"
        style={{
          width: '44px',
          height: '24px',
          borderRadius: 'var(--radius-full)',
          background: checked ? 'var(--color-primary)' : 'var(--color-border)',
          position: 'relative',
          transition: 'background var(--transition)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#FFFFFF',
            position: 'absolute',
            top: '2px',
            left: checked ? '22px' : '2px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'left var(--transition)',
          }}
        />
      </span>
      <span>{label}</span>
    </button>
  )
}
