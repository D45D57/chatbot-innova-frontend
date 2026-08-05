import { useCallback, useEffect, useState } from 'react'
import { getConsultas } from '../services/consultaStorage'
import { getPresupuestos } from '../services/presupuestoApi'
import type { Consulta } from '../types'
import type { RecentActivityData, RecentActivityItem } from '../types/recentActivity'
import {
  combineRecentActivity,
  mapConsultationToActivity,
  mapQuoteToActivity,
} from '../utils/recentActivity'
import {
  classifyConsultationResolution,
  isPendingHumanConsultation,
  type ConsultationResolutionContext,
} from '../utils/consultationResolution'

type DashboardMetricStatus = 'loading' | 'success' | 'error' | 'unavailable'

export interface DashboardMetric {
  value: number | string
  status: DashboardMetricStatus
  detail?: string
}

export interface DashboardStatsData {
  consultasPendientes: DashboardMetric
  presupuestosPendientes: DashboardMetric
  consultasResueltas: DashboardMetric
  porcentajeAutomatizacion: DashboardMetric
  recentActivity: RecentActivityData
}

type DashboardConsulta = Consulta

interface CachedDashboardStats {
  expiresAt: number
  promise: Promise<DashboardStatsData>
}

const CACHE_TTL_MS = 10_000
const requestCache = new Map<string, CachedDashboardStats>()

const LOADING_METRIC: DashboardMetric = { value: '—', status: 'loading' }
export const normalizeDashboardStatus = (status?: string | null) =>
  status?.trim().toUpperCase().replace(/[\s-]+/g, '_') ?? ''

export const countDashboardConsultations = (
  consultas: DashboardConsulta[],
  resolutionContext: ConsultationResolutionContext,
) => {
  let pendientes = 0
  let resueltas = 0
  let automatizadasEstimadas = 0

  consultas.forEach(consulta => {
    const resolution = classifyConsultationResolution(consulta, resolutionContext)
    if (isPendingHumanConsultation(consulta, resolution)) pendientes += 1
    if (resolution.resolvedByBot) resueltas += 1
    if (resolution.resolvedByBot) automatizadasEstimadas += 1
  })

  return {
    pendientes,
    resueltas,
    automatizadasEstimadas,
  }
}

const loadDashboardStats = async (): Promise<DashboardStatsData> => {
  const consultationsPromise = getConsultas()
  const budgetsPromise = getPresupuestos({ page: 1, limit: 100 })

  const [consultationsResult, budgetsResult] = await Promise.allSettled([
    consultationsPromise,
    budgetsPromise,
  ])

  let consultasPendientes: DashboardMetric
  let consultasResueltas: DashboardMetric
  let porcentajeAutomatizacion: DashboardMetric
  let consultationActivities: RecentActivityItem[] = []
  let quoteActivities: RecentActivityItem[] = []

  if (consultationsResult.status === 'fulfilled') {
    const consultas = consultationsResult.value
    const budgetConsultationIds = new Set(
      budgetsResult.status === 'fulfilled'
        ? budgetsResult.value.presupuestos.map(presupuesto => presupuesto.consultaId)
        : [],
    )
    const resolutionContext: ConsultationResolutionContext = {
      budgetConsultationIds,
      budgetDataComplete: budgetsResult.status === 'fulfilled'
        && (budgetsResult.value.pagination.total ?? 0) <= budgetsResult.value.presupuestos.length,
    }
    const counts = countDashboardConsultations(consultas, resolutionContext)
    consultationActivities = consultas.flatMap(consulta => (
      mapConsultationToActivity(
        consulta,
        classifyConsultationResolution(consulta, resolutionContext),
      )
    ))
    consultasPendientes = {
      value: counts.pendientes,
      status: 'success',
    }
    consultasResueltas = {
      value: counts.resueltas,
      status: 'success',
    }
    porcentajeAutomatizacion = consultas.length === 0 || !resolutionContext.budgetDataComplete
      ? { value: '—', status: 'unavailable' }
      : {
          value: `${Math.round((counts.automatizadasEstimadas / consultas.length) * 100)}%`,
          status: 'success',
          detail: `${counts.automatizadasEstimadas} de ${consultas.length} consultas fueron resueltas por el bot`,
        }
  } else {
    consultasPendientes = { value: '—', status: 'error' }
    consultasResueltas = { value: '—', status: 'error' }
    porcentajeAutomatizacion = { value: '—', status: 'error' }
  }

  const presupuestosPendientes: DashboardMetric = budgetsResult.status === 'fulfilled'
    ? {
        value: budgetsResult.value.pagination.total ?? 0,
        status: 'success',
      }
    : { value: '—', status: 'error' }

  if (budgetsResult.status === 'fulfilled') {
    quoteActivities = budgetsResult.value.presupuestos.flatMap(mapQuoteToActivity)
  }

  const bothSourcesFailed = consultationsResult.status === 'rejected'
    && budgetsResult.status === 'rejected'
  const oneSourceFailed = consultationsResult.status === 'rejected'
    || budgetsResult.status === 'rejected'

  return {
    consultasPendientes,
    presupuestosPendientes,
    consultasResueltas,
    porcentajeAutomatizacion,
    recentActivity: {
      items: combineRecentActivity(consultationActivities, quoteActivities),
      status: bothSourcesFailed ? 'error' : oneSourceFailed ? 'partial' : 'success',
    },
  }
}

const getCachedRequest = (userId: string, force: boolean): Promise<DashboardStatsData> => {
  const cached = requestCache.get(userId)
  if (!force && cached && cached.expiresAt > Date.now()) return cached.promise

  const promise = loadDashboardStats()
  requestCache.set(userId, { expiresAt: Date.now() + CACHE_TTL_MS, promise })
  return promise
}

const INITIAL_STATS: DashboardStatsData = {
  consultasPendientes: LOADING_METRIC,
  presupuestosPendientes: LOADING_METRIC,
  consultasResueltas: LOADING_METRIC,
  porcentajeAutomatizacion: LOADING_METRIC,
  recentActivity: { items: [], status: 'loading' },
}

export function useDashboardStats(userId?: string) {
  const [stats, setStats] = useState<DashboardStatsData>(INITIAL_STATS)

  const load = useCallback(async (force = false) => {
    if (!userId) return
    setStats(INITIAL_STATS)
    const result = await getCachedRequest(userId, force)
    setStats(result)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    let active = true
    const timeoutId = window.setTimeout(() => {
      void getCachedRequest(userId, true).then(result => {
        if (active) setStats(result)
      })
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [userId])

  return {
    stats,
    refetch: () => load(true),
  }
}
