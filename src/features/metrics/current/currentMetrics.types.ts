import type { PresupuestoEstado } from '../../../types/presupuesto'

export interface MetricsDay {
  dateKey: string
  label: string
  consultas: number
  presupuestos: number
}

export interface BudgetStateMetric {
  estado: PresupuestoEstado
  label: string
  value: number
  color: string
}

export interface CurrentMetricsData {
  days: MetricsDay[]
  totalConsultas: number
  totalPresupuestos: number
  totalConcretados: number
  totalDerivadas: number
  conversionRate: number
  budgetStates: BudgetStateMetric[]
  budgetsArePartial: boolean
}

export interface CurrentMetricsResult {
  data: CurrentMetricsData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}
