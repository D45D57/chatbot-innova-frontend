import type { Consulta, ConsultaEstado, Mensaje } from '../../types'
import { formatRelativeTime } from '../../utils/formatRelativeTime'
import { AppIcon } from '../ui/AppIcon'
import { Button } from '../ui/Button'

interface ConsultaDetailProps {
  consulta: Consulta | null
  onUpdateStatus: (consultaId: string, estado: ConsultaEstado) => Promise<void>
  onBack?: () => void
}

const ESTADO_STYLES: Record<ConsultaEstado, { label: string; color: string; background: string }> = {
  nueva: { label: 'Nueva', color: 'var(--status-new-text)', background: 'var(--status-new-bg)' },
  en_proceso: { label: 'En proceso', color: 'var(--status-progress-text)', background: 'var(--status-progress-bg)' },
  cerrada: { label: 'Cerrada', color: 'var(--status-closed-text)', background: 'var(--status-closed-bg)' },
}

const CERRADA_POR_LABELS = {
  bot: 'Bot',
  emprendedor: 'Emprendedor',
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getMessagePresentation(emisor: Mensaje['emisor']) {
  const isClient = emisor === 'cliente'
  return {
    isBot: emisor === 'bot',
    align: isClient ? 'flex-end' as const : 'flex-start' as const,
    background: isClient ? 'var(--color-bg-answer)' : 'var(--color-bg)',
    color: isClient ? '#FFFFFF' : 'var(--color-text-primary)',
  }
}

function getStatusAction(estado: ConsultaEstado): { label: string; nextEstado: ConsultaEstado } {
  if (estado === 'nueva') return { label: 'Marcar en proceso', nextEstado: 'en_proceso' }
  if (estado === 'en_proceso') return { label: 'Marcar cerrada', nextEstado: 'cerrada' }
  return { label: 'Reabrir consulta', nextEstado: 'en_proceso' }
}

function openWhatsApp(phone: string) {
  const digits = phone.replace(/\D/g, '')
  window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer')
}

export function ConsultaDetail({ consulta, onUpdateStatus, onBack }: ConsultaDetailProps) {
  if (!consulta) return null

  const estadoStyle = ESTADO_STYLES[consulta.estado]
  const statusAction = getStatusAction(consulta.estado)
  const isClosed = consulta.estado === 'cerrada'
  const messages = [...consulta.mensajes].sort((left, right) => (
    new Date(left.fechaCreacion).getTime() - new Date(right.fechaCreacion).getTime()
  ))
  const metadata = [
    ['Estado', estadoStyle.label],
    ['Canal', consulta.canal === 'whatsapp' ? 'WhatsApp' : 'Web'],
    ['Tipo', consulta.tipoConsulta ?? 'General'],
    ['Prioridad', consulta.prioridad ?? 'Normal'],
    ['Última interacción', formatRelativeTime(consulta.fechaActualizacion)],
    ...(consulta.derivada
      ? [['Derivación', consulta.derivadaA ? `A ${consulta.derivadaA}` : 'A un asesor']]
      : []),
    ...(isClosed
      ? [['Cerrada por', consulta.cerradaPor ? CERRADA_POR_LABELS[consulta.cerradaPor] : 'Sin dato']]
      : []),
  ]

  return (
    <section>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '14px',
            padding: 0,
            color: 'var(--color-text-primary)',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          <span aria-hidden="true" style={{ fontSize: '17px', lineHeight: 1 }}>‹</span>
          Volver a consultas
        </button>
      )}

      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '19px', lineHeight: 1.2, marginBottom: '7px' }}>
          {consulta.clienteNombre || 'Cliente sin identificar'}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', lineHeight: 1.45 }}>
          {consulta.asunto || consulta.descripcion || 'Consulta sin asunto'}
        </p>
      </div>

      <div style={{
        padding: '14px',
        marginBottom: '18px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg)',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '12px 8px',
          paddingBottom: '13px',
          marginBottom: '12px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          {metadata.map(([label, value]) => (
            <div key={label} style={{ minWidth: 0, gridColumn: label === 'Última interacción' ? 'span 2' : undefined }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '9px', marginBottom: '3px' }}>{label}</p>
              {label === 'Estado' ? (
                <span style={{
                  display: 'inline-flex',
                  padding: '3px 7px',
                  borderRadius: 'var(--radius-full)',
                  background: estadoStyle.background,
                  color: estadoStyle.color,
                  fontSize: '10px',
                  fontWeight: 700,
                }}>
                  {value}
                </span>
              ) : (
                <p style={{
                  color: label === 'Derivación' ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                  fontSize: '10px',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textTransform: label === 'Tipo' || label === 'Prioridad' ? 'capitalize' : undefined,
                }}>
                  {value}
                </p>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '7px' }}>
          {consulta.clienteTelefono && (
            <Button
              type="button"
              size="md"
              variant="outline"
              onClick={() => openWhatsApp(consulta.clienteTelefono!)}
              style={{
                height: 37,
                padding: '0 14px',
                borderWidth: 2,
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)',
                background: 'var(--color-bg)',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              <AppIcon name="chat" size={17} strokeWidth={1.8} />
              Abrir WhatsApp
            </Button>
          )}
          <Button
            type="button"
            size="md"
            onClick={() => onUpdateStatus(consulta.id, statusAction.nextEstado)}
            style={{
              height: 37,
              padding: '0 14px',
              border: 'none',
              background: 'linear-gradient(100deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            <span aria-hidden="true" style={{
              width: 17,
              height: 17,
              border: '2px solid currentColor',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AppIcon name="check" size={11} strokeWidth={2.2} />
            </span>
            {statusAction.label}
          </Button>
        </div>
      </div>

      <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '11px', fontWeight: 500, marginBottom: '10px' }}>
        Historial de conversación
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map(message => {
          const presentation = getMessagePresentation(message.emisor)
          return (
            <div key={message.id} style={{
              display: 'flex',
              justifyContent: presentation.align,
              alignItems: 'flex-end',
              gap: 8,
              marginBottom: 4,
            }}>
              {presentation.isBot && (
                <img
                  src="/isoBot-transparente.png"
                  alt="EmprendeBot"
                  style={{ width: 30, height: 30, flexShrink: 0, marginBottom: 17, objectFit: 'contain' }}
                />
              )}
              <div style={{
                maxWidth: '82%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: presentation.align,
                gap: 3,
              }}>
                <article style={{
                  padding: '10px 13px',
                  borderRadius: presentation.align === 'flex-start'
                    ? '18px 18px 18px 4px'
                    : '18px 18px 4px 18px',
                  background: presentation.background,
                  color: presentation.color,
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: 12,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {message.contenido}
                </article>
                <span style={{
                  padding: '0 4px',
                  color: 'var(--color-text-secondary)',
                  fontSize: 9,
                }}>
                  {formatDate(message.fechaCreacion)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
