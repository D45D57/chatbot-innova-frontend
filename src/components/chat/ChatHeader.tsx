import type { HTMLAttributes } from 'react'
import { Avatar } from '../ui/Avatar'
import type { Business } from '../../types'

interface ChatHeaderProps {
  business: Business
  onRefresh?: () => void
  onClose?: () => void
  dragHandleProps?: HTMLAttributes<HTMLElement>
  draggable?: boolean
  isOnline?: boolean
}

export function ChatHeader({ business, onRefresh, onClose, dragHandleProps, draggable = false, isOnline = true }: ChatHeaderProps) {
  return (
    <header {...dragHandleProps} className={`public-chat__header${draggable ? ' public-chat__header--draggable' : ''}`} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 16px',
      background: 'var(--chat-gradient, linear-gradient(90deg, #13A8A2, #1372A8))',
      borderRadius: 0,
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 3,
    }}>
      <Avatar name={business.nombre} src={business.logo} size={40} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 600,
          fontSize: '15px',
          color: '#fff',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {business.nombre}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
          <span style={{
            width: 7, height: 7,
            borderRadius: '50%',
            background: isOnline ? '#22c55e' : '#f59e0b',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
            Asistente · {isOnline ? 'en línea' : 'sin conexión'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Reiniciar chat"
            aria-label="Reiniciar chat"
            style={{
              minHeight: 34,
              padding: '0 11px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            Reiniciar chat
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Cerrar vista previa"
            aria-label="Cerrar vista previa"
            className="public-chat__close"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
