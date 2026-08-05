import type { PresupuestoEstado } from '../../types/presupuesto'

const STATUS_LABELS: Record<PresupuestoEstado, string> = {
  PENDIENTE: 'Requiere cotización',
  EN_PROCESO: 'Requiere cotización',
  ENVIADO: 'En seguimiento',
  CONCRETADO: 'Concretado',
  RECHAZADO: 'Rechazado',
}

const isPresupuestoEstado = (value: string): value is PresupuestoEstado =>
  value in STATUS_LABELS

export function PresupuestoStatusBadge({ estado }: { estado: string }) {
  const safeState = isPresupuestoEstado(estado) ? estado : null
  return (
    <span className={`budget-status budget-status--${safeState?.toLowerCase() ?? 'unknown'}`}>
      {safeState ? STATUS_LABELS[safeState] : 'Estado desconocido'}
    </span>
  )
}
