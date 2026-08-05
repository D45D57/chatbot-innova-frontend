import type { Consulta } from '../types'
import type { PresupuestoResumen } from '../types/presupuesto'
import type { RecentActivityItem, RecentActivityType } from '../types/recentActivity'
import type { ConsultationResolution } from './consultationResolution'

export const RECENT_ACTIVITY_LIMIT = 5

const QUOTE_ACTIVITY: Record<
  PresupuestoResumen['estado'],
  { type: RecentActivityType; title: (id: number) => string; description: string }
> = {
  PENDIENTE: {
    type: 'quote_pending',
    title: id => `Se generó el presupuesto #${id}`,
    description: 'Pendiente de preparación o revisión',
  },
  EN_PROCESO: {
    type: 'quote_in_progress',
    title: id => `El presupuesto #${id} está en proceso`,
    description: 'Estado actual del presupuesto',
  },
  ENVIADO: {
    type: 'quote_sent',
    title: id => `El presupuesto #${id} está enviado`,
    description: 'Estado actual del presupuesto',
  },
  CONCRETADO: {
    type: 'quote_completed',
    title: id => `El presupuesto #${id} está concretado`,
    description: 'Estado actual del presupuesto',
  },
  RECHAZADO: {
    type: 'quote_rejected',
    title: id => `El presupuesto #${id} está rechazado`,
    description: 'Estado actual del presupuesto',
  },
}

function validIsoDate(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function mapConsultationToActivity(
  consulta: Consulta,
  resolution?: ConsultationResolution,
): RecentActivityItem[] {
  const createdAt = validIsoDate(consulta.fechaCreacion)
  if (!createdAt) return []

  return [{
    id: `consultation-${consulta.id}-created`,
    type: resolution?.resolvedByBot ? 'consultation_bot_resolved' : 'consultation_created',
    title: resolution?.resolvedByBot
      ? 'El bot resolvió una consulta automáticamente'
      : 'Un cliente inició una conversación con el chatbot',
    description: resolution?.resolvedByBot ? 'Sin intervención requerida' : undefined,
    createdAt,
    source: 'consultation',
    entityId: consulta.id,
    targetPath: '/consultas',
  }]
}

export function mapQuoteToActivity(presupuesto: PresupuestoResumen): RecentActivityItem[] {
  const createdAt = validIsoDate(presupuesto.fechaCreacion ?? presupuesto.fechaEmision)
  if (!createdAt) return []

  const presentation = QUOTE_ACTIVITY[presupuesto.estado]
  return [{
    id: `quote-${presupuesto.id}`,
    type: presentation.type,
    title: presentation.title(presupuesto.id),
    description: presentation.description,
    createdAt,
    source: 'quote',
    entityId: String(presupuesto.id),
    targetPath: `/presupuestos/${presupuesto.id}`,
  }]
}

export function combineRecentActivity(
  consultationActivities: RecentActivityItem[],
  quoteActivities: RecentActivityItem[],
  limit = RECENT_ACTIVITY_LIMIT,
): RecentActivityItem[] {
  return [...consultationActivities, ...quoteActivities]
    .sort((left, right) => (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    ))
    .slice(0, limit)
}

export function formatActivityDate(value: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const datePart = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)

  return `${datePart} · ${timePart}`
}
