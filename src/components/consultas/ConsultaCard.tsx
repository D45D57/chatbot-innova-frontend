import type { Consulta, ConsultaEstado } from '../../types'
import { formatRelativeTime } from '../../utils/formatRelativeTime'
import { AppIcon } from '../ui/AppIcon'

interface ConsultaCardProps {
  consulta: Consulta
  selected?: boolean
  onSelect: (consultaId: string) => void
}

const ESTADO_STYLES: Record<ConsultaEstado, { label: string; color: string; background: string }> = {
  nueva: { label: 'Nueva', color: 'var(--status-new-text)', background: 'var(--status-new-bg)' },
  en_proceso: { label: 'En proceso', color: 'var(--status-progress-text)', background: 'var(--status-progress-bg)' },
  cerrada: { label: 'Cerrada', color: 'var(--status-closed-text)', background: 'var(--status-closed-bg)' },
}

function getLastMessage(consulta: Consulta): string {
  const last = [...consulta.mensajes].sort((left, right) => (
    new Date(right.fechaCreacion).getTime() - new Date(left.fechaCreacion).getTime()
  ))[0]
  return consulta.asunto || last?.contenido || 'Sin mensajes todavía'
}

function getCanalLabel(canal?: string | null): string {
  return canal === 'whatsapp' ? 'WhatsApp' : 'Web'
}

function getDerivadaText(consulta: Consulta): string {
  if (!consulta.derivada) return ''
  return consulta.derivadaA ? `Derivada a ${consulta.derivadaA}` : 'Derivada a un asesor'
}

export function ConsultaCard({ consulta, selected = false, onSelect }: ConsultaCardProps) {
  const estadoStyle = ESTADO_STYLES[consulta.estado]
  const derivadaText = getDerivadaText(consulta)

  return (
    <button
      type="button"
      onClick={() => onSelect(consulta.id)}
      aria-label={`Ver conversación de ${consulta.clienteNombre || 'cliente sin identificar'}`}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '16px',
        border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg)',
        boxShadow: 'var(--shadow-sm)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-family)',
        transition: 'border-color var(--transition), box-shadow var(--transition)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '5px' }}>
        <h3 style={{
          minWidth: 0,
          fontSize: '15px',
          fontWeight: 700,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {consulta.clienteNombre || 'Cliente sin identificar'}
        </h3>
        <span style={{
          flexShrink: 0,
          padding: '4px 9px',
          borderRadius: 'var(--radius-full)',
          background: estadoStyle.background,
          color: estadoStyle.color,
          fontSize: '11px',
          fontWeight: 700,
        }}>
          {estadoStyle.label}
        </span>
      </div>

      <p style={{
        color: 'var(--color-text-secondary)',
        fontSize: '13px',
        lineHeight: 1.4,
        marginBottom: derivadaText ? '3px' : '5px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {getLastMessage(consulta)}
      </p>

      {derivadaText && (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '11px', marginBottom: '5px' }}>
          {derivadaText}
        </p>
      )}

      <p style={{ color: 'var(--color-text-secondary)', fontSize: '11px', marginBottom: '10px' }}>
        {getCanalLabel(consulta.canal)}
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        fontSize: '11px',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
          <AppIcon name="time" size={12} strokeWidth={1.8} />
          {formatRelativeTime(consulta.fechaActualizacion)}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--color-primary)', fontWeight: 600 }}>
          <AppIcon name="chat" size={13} strokeWidth={1.8} />
          Ver conversación
        </span>
      </div>
    </button>
  )
}
