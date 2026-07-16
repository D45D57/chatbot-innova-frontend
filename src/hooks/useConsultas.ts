import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CanalConsulta, Consulta, ConsultaEstado } from '../types'
import { getConsultas, updateConsultaEstado } from '../services/consultaStorage'

export type ConsultaEstadoFilter = 'todas' | ConsultaEstado
export type ConsultaCanalFilter = 'todos' | CanalConsulta
export type ConsultaSortOption = 'recentes' | 'antiguas'

interface UseConsultasResult {
  consultas: Consulta[]
  filteredConsultas: Consulta[]
  selectedConsulta: Consulta | null
  selectedConsultaId: string | null
  estadoFilter: ConsultaEstadoFilter
  canalFilter: ConsultaCanalFilter
  sortOption: ConsultaSortOption
  searchQuery: string
  isLoading: boolean
  isShowingDemo: boolean
  setEstadoFilter: (filter: ConsultaEstadoFilter) => void
  setCanalFilter: (filter: ConsultaCanalFilter) => void
  setSortOption: (sort: ConsultaSortOption) => void
  setSearchQuery: (query: string) => void
  selectConsulta: (consultaId: string) => void
  clearSelection: () => void
  updateConsultaStatus: (consultaId: string, estado: ConsultaEstado) => Promise<void>
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
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [selectedConsultaId, setSelectedConsultaId] = useState<string | null>(null)
  const [estadoFilter, setEstadoFilter] = useState<ConsultaEstadoFilter>('todas')
  const [canalFilter, setCanalFilter] = useState<ConsultaCanalFilter>('todos')
  const [sortOption, setSortOption] = useState<ConsultaSortOption>('recentes')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const reloadConsultas = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getConsultas(userId)
      setConsultas(data)
      setSelectedConsultaId(current => (
        current && data.some(consulta => consulta.id === current) ? current : null
      ))
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void reloadConsultas(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [reloadConsultas])

  const filteredConsultas = useMemo(() => {
    return consultas
      .filter(consulta => estadoFilter === 'todas' || consulta.estado === estadoFilter)
      .filter(consulta => canalFilter === 'todos' || consulta.canal === canalFilter)
      .filter(consulta => matchesSearch(consulta, searchQuery))
      .sort((left, right) => {
        const leftTime = new Date(left.fechaActualizacion).getTime()
        const rightTime = new Date(right.fechaActualizacion).getTime()
        return sortOption === 'recentes' ? rightTime - leftTime : leftTime - rightTime
      })
  }, [canalFilter, consultas, estadoFilter, searchQuery, sortOption])

  const selectedConsulta = useMemo(() => {
    if (!selectedConsultaId) return null
    return consultas.find(consulta => consulta.id === selectedConsultaId) ?? null
  }, [consultas, selectedConsultaId])

  const isShowingDemo = useMemo(() => (
    consultas.length > 0 && consultas.every(consulta => !consulta.id.includes('-'))
  ), [consultas])

  const selectConsulta = useCallback((consultaId: string) => {
    setSelectedConsultaId(consultaId)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedConsultaId(null)
  }, [])

  const updateConsultaStatus = useCallback(async (consultaId: string, estado: ConsultaEstado) => {
    const updated = await updateConsultaEstado(consultaId, estado, userId)
    if (!updated) return

    setConsultas(current => current.map(consulta => (
      consulta.id === consultaId ? updated : consulta
    )))
    setSelectedConsultaId(consultaId)
  }, [userId])

  return {
    consultas,
    filteredConsultas,
    selectedConsulta,
    selectedConsultaId,
    estadoFilter,
    canalFilter,
    sortOption,
    searchQuery,
    isLoading,
    isShowingDemo,
    setEstadoFilter,
    setCanalFilter,
    setSortOption,
    setSearchQuery,
    selectConsulta,
    clearSelection,
    updateConsultaStatus,
    reloadConsultas,
  }
}
