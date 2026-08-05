import { useNavigate } from 'react-router-dom'
import { AppIcon, type AppIconName } from '../ui/AppIcon'
import type { RecentActivityData, RecentActivityType } from '../../types/recentActivity'
import { formatActivityDate } from '../../utils/recentActivity'

interface RecentActivityProps {
  data: RecentActivityData
  onRetry: () => void
}

const ACTIVITY_ICONS: Record<RecentActivityType, { icon: AppIconName; label: string; tone: string }> = {
  consultation_created: { icon: 'chat', label: 'Consulta iniciada', tone: 'primary' },
  consultation_bot_resolved: { icon: 'automation', label: 'Consulta resuelta por el bot', tone: 'success' },
  quote_pending: { icon: 'budget', label: 'Presupuesto pendiente', tone: 'warning' },
  quote_in_progress: { icon: 'time', label: 'Presupuesto en proceso', tone: 'secondary' },
  quote_sent: { icon: 'budget', label: 'Presupuesto enviado', tone: 'secondary' },
  quote_completed: { icon: 'check', label: 'Presupuesto concretado', tone: 'success' },
  quote_rejected: { icon: 'alert', label: 'Presupuesto rechazado', tone: 'danger' },
}

export function RecentActivity({ data, onRetry }: RecentActivityProps) {
  const navigate = useNavigate()

  if (data.status === 'loading') {
    return (
      <div className="recent-activity-card" aria-label="Cargando actividad reciente" aria-busy="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="recent-activity-skeleton" key={index}>
            <span />
            <div><i /><i /></div>
            <i />
          </div>
        ))}
      </div>
    )
  }

  if (data.status === 'error') {
    return (
      <div className="recent-activity-card recent-activity-state" role="alert">
        <span className="recent-activity-state__icon"><AppIcon name="alert" size={28} /></span>
        <strong>No pudimos cargar la actividad reciente</strong>
        <p>Intentá nuevamente para recuperar los movimientos del negocio.</p>
        <button type="button" onClick={onRetry}>Reintentar</button>
      </div>
    )
  }

  if (data.items.length === 0) {
    return (
      <div className="recent-activity-card recent-activity-state">
        {data.status === 'partial' && (
          <p className="recent-activity-partial" role="status">
            Parte de la actividad no pudo cargarse.
          </p>
        )}
        <span className="recent-activity-state__icon"><AppIcon name="chat" size={28} /></span>
        <strong>Todavía no hay actividad reciente</strong>
        <p>Cuando tus clientes comiencen a utilizar el chatbot, vas a ver los movimientos acá.</p>
      </div>
    )
  }

  return (
    <div className="recent-activity-card">
      {data.status === 'partial' && (
        <p className="recent-activity-partial" role="status">
          Parte de la actividad no pudo cargarse.
        </p>
      )}
      <div className="recent-activity-list">
        {data.items.map(item => {
          const visual = ACTIVITY_ICONS[item.type]
          const formattedDate = formatActivityDate(item.createdAt)
          return (
            <button
              type="button"
              className="recent-activity-row"
              key={item.id}
              onClick={() => navigate(item.targetPath)}
              aria-label={`${visual.label}: ${item.title}`}
            >
              <span className={`recent-activity-row__icon is-${visual.tone}`} aria-hidden="true">
                <AppIcon name={visual.icon} size={19} />
              </span>
              <span className="recent-activity-row__content">
                <strong>{item.title}</strong>
                {item.description && <small>{item.description}</small>}
              </span>
              {formattedDate && <time dateTime={item.createdAt}>{formattedDate}</time>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
