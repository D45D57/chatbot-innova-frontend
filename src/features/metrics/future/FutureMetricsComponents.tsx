import type { ReactNode } from 'react'
import type {
  CapitalFugado,
  ConsultaProducto,
  EtapaEmbudo,
  HoraPicoItem,
  LeadItem,
  LeadStatus,
  MomentoAbandono,
  ResumenTrafico,
  SeccionVisitada,
} from './futureMetrics.types'
import { AppIcon, type AppIconName } from '../../../components/ui/AppIcon'

interface SummaryMetric {
  label: string
  value: number | string
  description: string
  icon: AppIconName
  tone: 'teal' | 'blue' | 'orange' | 'green'
}

function MetricsCard({ title, subtitle, children, className = '' }: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <article className={`metrics-card ${className}`}>
      <header className="metrics-card__heading">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </header>
      {children}
    </article>
  )
}

export function MetricsSummary({ data }: { data: ResumenTrafico }) {
  const items: SummaryMetric[] = [
    {
      label: 'Ventas concretadas',
      value: data.ventasConcretadas,
      description: 'Conversiones registradas por el chatbot',
      icon: 'check',
      tone: 'green',
    },
    {
      label: 'Consultaron productos',
      value: data.consultaronProductos,
      description: 'Usuarios con interés comercial',
      icon: 'catalog',
      tone: 'blue',
    },
    {
      label: 'Abandonaron el bot',
      value: data.abandonaronBot,
      description: 'Conversaciones sin conversión',
      icon: 'logout',
      tone: 'orange',
    },
    {
      label: 'Tasa de conversión',
      value: `${data.tasaConversionPct}%`,
      description: 'Consultas convertidas en ventas',
      icon: 'metrics',
      tone: 'teal',
    },
  ]

  return (
    <section className="metrics-summary" aria-label="Resumen de tráfico">
      {items.map(item => (
        <article className="metrics-card metrics-summary-card" key={item.label}>
          <span className={`metrics-summary-card__icon metrics-summary-card__icon--${item.tone}`} aria-hidden="true">
            <AppIcon name={item.icon} size={24} />
          </span>
          <strong>{item.value}</strong>
          <h2>{item.label}</h2>
          <p>{item.description}</p>
        </article>
      ))}
    </section>
  )
}

function ProgressRow({ label, value, max = 100, tone = 'teal' }: {
  label: string
  value: number
  max?: number
  tone?: 'teal' | 'blue' | 'purple' | 'orange'
}) {
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="metrics-progress">
      <div className="metrics-progress__label">
        <span>{label}</span>
        <strong>{value}{max === 100 ? '%' : ''}</strong>
      </div>
      <div
        className="metrics-progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <span className={`metrics-progress__fill metrics-progress__fill--${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export function VisitedSectionsCard({ sections }: { sections: SeccionVisitada[] }) {
  return (
    <MetricsCard title="Secciones más visitadas" subtitle="Qué información buscan tus clientes">
      <div className="metrics-progress-list">
        {sections.map((item, index) => (
          <ProgressRow
            key={item.seccion}
            label={item.seccion}
            value={item.porcentaje}
            tone={(['teal', 'blue', 'purple', 'orange'] as const)[index % 4]}
          />
        ))}
      </div>
    </MetricsCard>
  )
}

const PRODUCT_QUERY_LABELS: Record<string, string> = {
  stock: 'Stock',
  caracteristicas: 'Características',
  fotos: 'Fotos',
}

export function ProductQueriesCard({ queries }: { queries: ConsultaProducto[] }) {
  const max = Math.max(1, ...queries.map(item => item.consultas))
  return (
    <MetricsCard title="Consultas sobre productos" subtitle="Detalle de las opciones más utilizadas">
      <div className="metrics-query-list">
        {queries.map((item, index) => (
          <div key={item.boton} className="metrics-query-item">
            <span className={`metrics-query-item__rank metrics-query-item__rank--${index + 1}`}>{index + 1}</span>
            <div>
              <strong>{PRODUCT_QUERY_LABELS[item.boton] ?? item.boton}</strong>
              <div
                className="metrics-query-item__track"
                role="progressbar"
                aria-label={`${PRODUCT_QUERY_LABELS[item.boton] ?? item.boton}: ${item.consultas} consultas`}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={item.consultas}
              >
                <span style={{ width: `${(item.consultas / max) * 100}%` }} />
              </div>
            </div>
            <strong>{item.consultas}</strong>
          </div>
        ))}
      </div>
    </MetricsCard>
  )
}

export function ConversionFunnel({ stages }: { stages: EtapaEmbudo[] }) {
  const max = Math.max(1, ...stages.map(stage => stage.usuarios))
  return (
    <MetricsCard
      title="Dónde se van tus clientes"
      subtitle="Recorrido desde el inicio de la conversación hasta la compra"
      className="metrics-card--wide"
    >
      <div className="metrics-funnel">
        {stages.map((stage, index) => {
          const width = Math.max(34, (stage.usuarios / max) * 100)
          return (
            <div className="metrics-funnel__stage" key={stage.etapa}>
              <div className="metrics-funnel__meta">
                <span><i>{index + 1}</i>{stage.etapa}</span>
                <strong>{stage.usuarios}</strong>
              </div>
              <div
                className="metrics-funnel__track"
                role="progressbar"
                aria-label={`${stage.etapa}: ${stage.usuarios} usuarios`}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={stage.usuarios}
              >
                <span style={{ width: `${width}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </MetricsCard>
  )
}

export function AbandonmentMomentsCard({ moments }: { moments: MomentoAbandono[] }) {
  return (
    <MetricsCard title="Momento del abandono" subtitle="Puntos donde se interrumpe la conversión">
      <div className="metrics-progress-list">
        {moments.map((item, index) => (
          <ProgressRow
            key={item.momento}
            label={item.momento}
            value={item.porcentaje}
            tone={(['orange', 'purple', 'blue'] as const)[index % 3]}
          />
        ))}
      </div>
    </MetricsCard>
  )
}

export function LostCapitalCard({ data }: { data: CapitalFugado }) {
  return (
    <MetricsCard title="Capital fugado" subtitle="Oportunidades comerciales sin conversión" className="metrics-lost-card">
      <div className="metrics-lost-card__content">
        <span aria-hidden="true"><AppIcon name="automation" size={30} /></span>
        <div>
          <strong>{data.sesionesConAltaIntencion}</strong>
          <p>sesiones con alta intención</p>
        </div>
      </div>
      <p className="metrics-lost-card__note">
        Usuarios que mostraron interés comercial concreto, pero no completaron una compra.
      </p>
    </MetricsCard>
  )
}

export function PeakHoursChart({ hours }: { hours: HoraPicoItem[] }) {
  const max = Math.max(1, ...hours.map(item => item.consultas))
  return (
    <MetricsCard title="Horas pico" subtitle="Franjas con mayor cantidad de consultas">
      {hours.length ? (
        <div className="metrics-peak-chart" role="img" aria-label="Consultas agrupadas por franja horaria">
          {hours.map(item => (
            <div className="metrics-peak-chart__column" key={item.hora}>
              <strong>{item.consultas}</strong>
              <div className="metrics-peak-chart__bar-wrap">
                <span
                  style={{ height: `${Math.max(8, (item.consultas / max) * 150)}px` }}
                  title={`${item.hora}: ${item.consultas} consultas`}
                />
              </div>
              <small>{item.hora}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="metrics-section-empty">
          <AppIcon name="time" size={32} />
          <p>No hay horarios con actividad registrada para este período.</p>
        </div>
      )}
    </MetricsCard>
  )
}

const LEAD_STATUS_CLASS: Record<LeadStatus, string> = {
  Nuevo: 'new',
  Pendiente: 'pending',
}

export function TodayLeadsList({ leads }: { leads: LeadItem[] }) {
  return (
    <MetricsCard title="Clientes interesados" subtitle="Clientes que solicitaron ser contactados hoy">
      {leads.length ? (
        <ul className="metrics-leads">
          {leads.map(lead => (
            <li key={lead.id}>
              <span className="metrics-leads__avatar" aria-hidden="true">{lead.nombre.charAt(0)}</span>
              <div>
                <strong>{lead.nombre}</strong>
                <p>{lead.detalle}</p>
              </div>
              <div className="metrics-leads__status">
                <time>{lead.hora}</time>
                <span className={`metrics-leads__badge metrics-leads__badge--${LEAD_STATUS_CLASS[lead.estado]}`}>
                  {lead.estado}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="metrics-section-empty">
          <AppIcon name="agent" size={32} />
          <p>Todavía no hay clientes interesados registrados hoy.</p>
        </div>
      )}
    </MetricsCard>
  )
}

export function MetricsLoadingState() {
  return (
    <div className="metrics-loading" aria-label="Cargando métricas" aria-live="polite">
      {Array.from({ length: 4 }, (_, index) => <span key={index} />)}
    </div>
  )
}

export function MetricsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="metrics-state metrics-state--error" role="alert">
      <span aria-hidden="true"><AppIcon name="alert" size={34} /></span>
      <h2>No pudimos cargar las métricas</h2>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>Reintentar</button>
    </div>
  )
}

export function MetricsEmptyState({
  title = 'No hay métricas para este período',
  message = 'Cuando tus clientes interactúen con el chatbot, los datos aparecerán en esta sección.',
}: {
  title?: string
  message?: string
} = {}) {
  return (
    <div className="metrics-state">
      <span aria-hidden="true"><AppIcon name="metrics" size={44} /></span>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  )
}
