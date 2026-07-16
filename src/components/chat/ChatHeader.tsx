import { Avatar } from '../ui/Avatar'
import { brand } from '../../styles/brand'
import type { Business } from '../../types'

interface ChatHeaderProps {
  business: Business
  onRefresh?: () => void
  onBackToDashboard?: () => void
}

export function ChatHeader({ business, onRefresh, onBackToDashboard }: ChatHeaderProps) {
  return (
    <header className="public-chat__header" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 16px',
      background: brand.primaryGradient,
      borderRadius: 0,
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 3,
    }}>
      {onBackToDashboard && (
        <button
          type="button"
          onClick={onBackToDashboard}
          title="Volver al panel"
          aria-label="Volver al panel"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 20,
          }}
        >
          ←
        </button>
      )}

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
            background: '#22c55e',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
            Asistente · en línea
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
      </div>
    </header>
  )
}
