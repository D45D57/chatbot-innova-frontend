interface QuickRepliesProps {
  options: string[]
  onSelect: (option: string) => void
}

const ICON_MAP: Record<string, string> = {
  'Ver catálogo':           '/Package.png',
  'Horarios de atención': '/time.png',
  'Solicitar presupuesto':  '/bag.png',
  'Preguntas frecuentes':   '/help.png',
  'Hablar con una persona': '/agent.png',
}

export function QuickReplies({ options, onSelect }: QuickRepliesProps) {
  if (options.length === 0) return null

  return (
    <section style={{ width: '100%', marginTop: '6px', padding: '0 2px' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {options.map(option => {
          const icon = ICON_MAP[option]
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                border: '1.5px solid var(--color-primary)',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-bg)',
                color: 'var(--color-bg-answer)',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'var(--font-family)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(17,27,39,0.05)',
              }}
            >
              {icon && (
                <img src={icon} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
              )}
              {option}
            </button>
          )
        })}
      </div>
    </section>
  )
}
