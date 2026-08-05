import type { PresupuestoEstado } from '../types/presupuesto'

const QUOTE_STATUS_LABELS: Record<PresupuestoEstado, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  ENVIADO: 'Enviado',
  CONCRETADO: 'Concretado',
  RECHAZADO: 'Rechazado',
}

export function getQuoteStatusLabel(status: PresupuestoEstado): string {
  return QUOTE_STATUS_LABELS[status]
}
