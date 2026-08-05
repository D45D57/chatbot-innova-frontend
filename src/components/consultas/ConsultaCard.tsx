import type { Consulta, ConsultaEstado } from '../../types'
import { formatRelativeTime } from '../../utils/formatRelativeTime'
import { AppIcon } from '../ui/AppIcon'
import type { ConsultationResolution } from '../../utils/consultationResolution'

interface ConsultaCardProps {
  consulta: Consulta
  selected?: boolean
  onSelect: (consultaId: string) => void
  resolution?: ConsultationResolution
}

const ESTADO_STYLES: Record<ConsultaEstado, { label: string; color: string; background: string }> = {
  iniciada: { label: 'Iniciada', color: 'var(--status-new-text)', background: 'var(--status-new-bg)' },
  nueva: { label: 'Nueva', color: 'var(--status-new-text)', background: 'var(--status-new-bg)' },
  en_proceso: { label: 'En seguimiento', color: 'var(--status-progress-text)', background: 'var(--status-progress-bg)' },
  resuelta: { label: 'Resuelta', color: 'var(--status-closed-text)', background: 'var(--status-closed-bg)' },
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

export function ConsultaCard({ consulta, selected = false, onSelect, resolution }: ConsultaCardProps) {
  const estadoStyle = ESTADO_STYLES[consulta.estado]
  const derivadaText = getDerivadaText(consulta)
  const resolvedByBot = resolution?.resolvedByBot === true
  const overrideLabel = resolution?.overrideLabel
  const effectiveStyle = overrideLabel ? ESTADO_STYLES['en_proceso'] : estadoStyle
  const badgeLabel = resolvedByBot ? 'Resuelta por el bot' : (overrideLabel ?? estadoStyle.label)

  return (
    <button
      type="button"
      className={`consulta-card${selected ? ' consulta-card--selected' : ''}`}
      onClick={() => onSelect(consulta.id)}
      aria-pressed={selected}
      aria-label={`Ver conversación de ${consulta.clienteNombre || 'cliente sin identificar'}`}
    >
      <span className="consulta-card__avatar" aria-hidden="true">
        {(consulta.clienteNombre || 'C').trim().charAt(0).toUpperCase()}
      </span>
      <div className="consulta-card__body">
        <div className="consulta-card__heading">
          <h3>{consulta.clienteNombre || 'Cliente sin identificar'}</h3>
          <span
            className={`consulta-card__status${resolvedByBot ? ' consulta-card__status--bot' : ''}`}
            style={resolvedByBot ? undefined : { background: effectiveStyle.background, color: effectiveStyle.color }}
            title={resolvedByBot ? 'Estado visual estimado a partir de las señales disponibles' : undefined}
          >
            {resolvedByBot && <AppIcon name="automation" size={13} />}
            {badgeLabel}
          </span>
        </div>
        <p className="consulta-card__message">{getLastMessage(consulta)}</p>
        {resolvedByBot ? (
          <p className="consulta-card__derived consulta-card__derived--bot">Sin intervención requerida</p>
        ) : (
          <>
            <p className="consulta-card__derived">Requiere seguimiento{derivadaText ? ` · ${derivadaText}` : ''}</p>
            {consulta.derivada && !consulta.clienteNombre && !consulta.clienteTelefono && (
              <p className="consulta-card__contact-warning">Sin datos de contacto</p>
            )}
          </>
        )}
        <div className="consulta-card__footer">
          <span><AppIcon name="chat" size={14} />{getCanalLabel(consulta.canal)}</span>
          <span><AppIcon name="time" size={14} />{formatRelativeTime(consulta.fechaActualizacion)}</span>
          <span className="consulta-card__action"><AppIcon name="chat" size={14} />Ver conversación</span>
        </div>
      </div>
    </button>
  )
}
