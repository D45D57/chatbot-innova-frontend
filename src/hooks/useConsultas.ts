import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Consulta, ConsultaEstado } from '../types'
import {
  getConsultas,
  updateConsultaEstado,
} from '../services/consultaStorage'
import { getPresupuestos } from '../services/presupuestoApi'
import {
  classifyConsultationResolution,
  type ConsultationResolution,
} from '../utils/consultationResolution'

export type ConsultaEstadoFilter = 'todas' | 'activas' | 'resuelta_bot' | ConsultaEstado
export type ConsultaSortOption = 'recentes' | 'antiguas'

interface UseConsultasResult {
  consultas: Consulta[]
  filteredConsultas: Consulta[]
  selectedConsulta: Consulta | null
  selectedConsultaId: string | null
  resolutionByConsultaId: ReadonlyMap<string, ConsultationResolution>
  estadoFilter: ConsultaEstadoFilter
  sortOption: ConsultaSortOption
  searchQuery: string
  isLoading: boolean
  error: string
  updateError: string
  updatingConsultaId: string | null
  isShowingDemo: boolean
  setEstadoFilter: (filter: ConsultaEstadoFilter) => void
  setSortOption: (sort: ConsultaSortOption) => void
  setSearchQuery: (query: string) => void
  selectConsulta: (consultaId: string) => void
  clearSelection: () => void
  updateConsultaStatus: (consultaId: string, estado: ConsultaEstado) => Promise<boolean>
  reloadConsultas: () => Promise<void>
}

function getLastMessageText(consulta: Consulta): string {
  const last = [...consulta.mensajes].sort((left, right) => (
    new Date(right.fechaCreacion).getTime() - new Date(left.fechaCreacion).getTime()
  ))[0]
  return last?.contenido ?? ''
}

function matchesSearch(consulta: Consulta, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const searchable = [
    consulta.clienteNombre,
    consulta.asunto,
    getLastMessageText(consulta),
    ...consulta.mensajes.map(message => message.contenido),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return searchable.includes(normalized)
}

export function useConsultas(userId?: string): UseConsultasResult {
  const [allConsultas, setAllConsultas] = useState<Consulta[]>([])
  const [selectedConsultaId, setSelectedConsultaId] = useState<string | null>(null)
  const [estadoFilter, setEstadoFilter] = useState<ConsultaEstadoFilter>('todas')
  const [sortOption, setSortOption] = useState<ConsultaSortOption>('recentes')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [updatingConsultaId, setUpdatingConsultaId] = useState<string | null>(null)
  const [budgetConsultationIds, setBudgetConsultationIds] = useState<Set<string>>(new Set())
  const [budgetEstadoByConsultaId, setBudgetEstadoByConsultaId] = useState<ReadonlyMap<string, string>>(new Map())
  const [budgetDataComplete, setBudgetDataComplete] = useState(false)

  const reloadConsultas = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [consultasResult, budgetsResult] = await Promise.allSettled([
        getConsultas(),
        getPresupuestos({ page: 1, limit: 100 }),
      ])
      if (consultasResult.status === 'rejected') throw consultasResult.reason

      const data = consultasResult.value
      setAllConsultas(data)
      if (budgetsResult.status === 'fulfilled') {
        const presupuestos = budgetsResult.value.presupuestos
        setBudgetConsultationIds(new Set(presupuestos.map(p => p.consultaId)))
        setBudgetEstadoByConsultaId(new Map(presupuestos.map(p => [p.consultaId, p.estado])))
        setBudgetDataComplete(
          (budgetsResult.value.pagination.total ?? 0) <= presupuestos.length,
        )
      } else {
        setBudgetConsultationIds(new Set())
        setBudgetEstadoByConsultaId(new Map())
        setBudgetDataComplete(false)
      }
      setSelectedConsultaId(current => (
        current && data.some((consulta: Consulta) => consulta.id === current) ? current : null
      ))
    } catch {
      setError('No pudimos cargar las consultas.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Consultas visibles: ocultar INICIADA y NUEVA sin acción accionable
  // (sin derivación y sin presupuesto asociado — el cliente solo navegó el bot)
  const consultas = useMemo(() =>
    allConsultas.filter(consulta => {
      if (consulta.estado === 'iniciada' || consulta.estado === 'nueva') {
        return consulta.derivada || budgetConsultationIds.has(consulta.id)
      }
      return true
    }),
    [allConsultas, budgetConsultationIds],
  )

  const resolutionByConsultaId = useMemo(() => new Map(
    consultas.map(consulta => [
      consulta.id,
      classifyConsultationResolution(consulta, {
        budgetConsultationIds,
        budgetDataComplete,
        budgetEstadoByConsultaId,
      }),
    ]),
  ), [budgetConsultationIds, budgetDataComplete, budgetEstadoByConsultaId, consultas])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void reloadConsultas(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [reloadConsultas])

  const filteredConsultas = useMemo(() => {
    return consultas
      .filter(consulta => {
        if (estadoFilter === 'todas') return true
        if (estadoFilter === 'activas') return consulta.estado === 'nueva' || consulta.estado === 'en_proceso'
        if (estadoFilter === 'resuelta_bot') return resolutionByConsultaId.get(consulta.id)?.resolvedByBot === true
        return consulta.estado === estadoFilter
      })
      .filter(consulta => matchesSearch(consulta, searchQuery))
      .sort((left, right) => {
        const leftTime = new Date(left.fechaActualizacion).getTime()
        const rightTime = new Date(right.fechaActualizacion).getTime()
        return sortOption === 'recentes' ? rightTime - leftTime : leftTime - rightTime
      })
  }, [consultas, estadoFilter, resolutionByConsultaId, searchQuery, sortOption])

  const selectedConsulta = useMemo(() => {
    if (!selectedConsultaId) return null
    return consultas.find(consulta => consulta.id === selectedConsultaId) ?? null
  }, [consultas, selectedConsultaId])

  const isShowingDemo = useMemo(() => (
    allConsultas.length > 0 && allConsultas.every(consulta => !consulta.id.includes('-'))
  ), [allConsultas])

  const selectConsulta = useCallback((consultaId: string) => {
    setSelectedConsultaId(consultaId)
    // Si el emprendedor abre una consulta nueva/iniciada, transicionarla a en_proceso
    const consulta = allConsultas.find(c => c.id === consultaId)
    if (consulta?.estado === 'nueva' || consulta?.estado === 'iniciada') {
      void updateConsultaEstado(consultaId, 'en_proceso', userId)
        .then(updated => {
          if (updated) setAllConsultas(current => current.map(c => c.id === consultaId ? updated : c))
        })
        .catch(() => { /* ignorar si el back rechaza la transición */ })
    }
  }, [allConsultas, userId])

  const clearSelection = useCallback(() => {
    setSelectedConsultaId(null)
  }, [])

  const updateConsultaStatus = useCallback(async (consultaId: string, estado: ConsultaEstado) => {
    if (updatingConsultaId) return false
    setUpdatingConsultaId(consultaId)
    setUpdateError('')
    try {
      const updated = await updateConsultaEstado(consultaId, estado, userId)
      if (!updated) return false
      setAllConsultas(current => current.map(consulta => (
        consulta.id === consultaId ? updated : consulta
      )))
      setSelectedConsultaId(consultaId)
      return true
    } catch {
      setUpdateError('No pudimos actualizar el estado. Intentá nuevamente.')
      return false
    } finally {
      setUpdatingConsultaId(null)
    }
  }, [updatingConsultaId, userId])

  return {
    consultas,
    filteredConsultas,
    selectedConsulta,
    selectedConsultaId,
    resolutionByConsultaId,
    estadoFilter,
    sortOption,
    searchQuery,
    isLoading,
    error,
    updateError,
    updatingConsultaId,
    isShowingDemo,
    setEstadoFilter,
    setSortOption,
    setSearchQuery,
    selectConsulta,
    clearSelection,
    updateConsultaStatus,
    reloadConsultas,
  }
}
