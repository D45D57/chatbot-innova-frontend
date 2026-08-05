import { useCallback, useEffect, useState } from 'react'
import { getConsultas } from '../../../services/consultaStorage'
import { getPresupuestos } from '../../../services/presupuestoApi'
import type { PresupuestoResumen } from '../../../types/presupuesto'
import type {
  BudgetStateMetric,
  CurrentMetricsData,
  CurrentMetricsResult,
  MetricsDay,
} from './currentMetrics.types'

const BUDGET_PAGE_LIMIT = 100

const BUDGET_STATES: Array<Omit<BudgetStateMetric, 'value'>> = [
  { estado: 'PENDIENTE', label: 'Pendiente', color: '#F59E0B' },
  { estado: 'EN_PROCESO', label: 'En proceso', color: '#3B82F6' },
  { estado: 'ENVIADO', label: 'Enviado', color: '#8B5CF6' },
  { estado: 'CONCRETADO', label: 'Concretado', color: '#10B981' },
  { estado: 'RECHAZADO', label: 'No concretado', color: '#EF4444' },
]

const dateKey = (value: string | Date) => new Date(value).toLocaleDateString('en-CA')

function createLastSevenDays(): MetricsDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    return {
      dateKey: dateKey(date),
      label: date.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', ''),
      consultas: 0,
      presupuestos: 0,
    }
  })
}

function budgetCreatedAt(budget: PresupuestoResumen): string {
  return budget.fechaCreacion ?? budget.fechaEmision
}

function countStates(budgets: PresupuestoResumen[]): BudgetStateMetric[] {
  return BUDGET_STATES.map(state => ({
    ...state,
    value: budgets.filter(budget => budget.estado === state.estado).length,
  })).filter(state => state.value > 0)
}

async function loadMetrics(): Promise<CurrentMetricsData> {
  const [consultas, budgetResponse] = await Promise.all([
    getConsultas(),
    getPresupuestos({ page: 1, limit: BUDGET_PAGE_LIMIT }),
  ])
  const days = createLastSevenDays()
  const daysByKey = new Map(days.map(day => [day.dateKey, day]))

  consultas.forEach(consulta => {
    const day = daysByKey.get(dateKey(consulta.fechaCreacion))
    if (day) day.consultas += 1
  })
  budgetResponse.presupuestos.forEach(budget => {
    const day = daysByKey.get(dateKey(budgetCreatedAt(budget)))
    if (day) day.presupuestos += 1
  })

  const totalPresupuestos = budgetResponse.pagination.total ?? 0
  const totalConcretados = budgetResponse.presupuestos
    .filter(budget => budget.estado === 'CONCRETADO').length

  return {
    days,
    totalConsultas: consultas.length,
    totalPresupuestos,
    totalConcretados,
    totalDerivadas: consultas.filter(consulta => consulta.derivada).length,
    conversionRate: totalPresupuestos > 0
      ? Math.round((totalConcretados / totalPresupuestos) * 100)
      : 0,
    budgetStates: countStates(budgetResponse.presupuestos),
    budgetsArePartial: totalPresupuestos > budgetResponse.presupuestos.length,
  }
}

export function useCurrentMetrics(): CurrentMetricsResult {
  const [data, setData] = useState<CurrentMetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setData(await loadMetrics())
    } catch {
      setError('No pudimos cargar las métricas. Intentá nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void refetch(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [refetch])

  return { data, isLoading, error, refetch }
}
