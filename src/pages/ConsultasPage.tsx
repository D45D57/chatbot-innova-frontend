import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ConsultaCard } from '../components/consultas/ConsultaCard'
import { ConsultaDetail } from '../components/consultas/ConsultaDetail'
import { Drawer } from '../components/layout/Drawer'
import { AppIcon } from '../components/ui/AppIcon'
import { Avatar } from '../components/ui/Avatar'
import { PageBackButton } from '../components/navigation/PageBackButton'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import {
  useConsultas,
  type ConsultaEstadoFilter,
  type ConsultaSortOption,
} from '../hooks/useConsultas'
import { openChatPreview } from '../utils/chatRoutes'
import '../styles/consultas.css'

const ESTADO_OPTIONS: Array<{ value: ConsultaEstadoFilter; label: string }> = [
  { value: 'todas', label: 'Todas' },
  { value: 'nueva', label: 'Nueva' },
  { value: 'en_proceso', label: 'En seguimiento' },
  { value: 'resuelta', label: 'Resuelta' },
  { value: 'cerrada', label: 'Cerrada' },
]

// Valores válidos de URL que no se muestran en el dropdown (ej: filtros de acceso rápido desde dashboard)
const VALID_ESTADO_VALUES: ConsultaEstadoFilter[] = [...ESTADO_OPTIONS.map(o => o.value), 'activas', 'resuelta_bot']

const SORT_OPTIONS: Array<{ value: ConsultaSortOption; label: string }> = [
  { value: 'recentes', label: 'Más recientes' },
  { value: 'antiguas', label: 'Más antiguas' },
]

const isOptionValue = <T extends string>(
  options: Array<{ value: T }>,
  value: string | null,
): value is T => options.some(option => option.value === value)

export function ConsultasPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { business, loadBusiness } = useBusiness()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [demoStarted, setDemoStarted] = useState(false)
  const {
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
  } = useConsultas(user?.id)

  useEffect(() => {
    if (user) void loadBusiness(user.id)
  }, [loadBusiness, user])

  useEffect(() => {
    const sanitizedParams = new URLSearchParams(searchParams)
    sanitizedParams.delete('tipo')
    sanitizedParams.delete('canal')
    sanitizedParams.delete('atencion')
    sanitizedParams.delete('resolucion')
    if (!VALID_ESTADO_VALUES.includes(sanitizedParams.get('estado') as ConsultaEstadoFilter)) sanitizedParams.delete('estado')
    if (!isOptionValue(SORT_OPTIONS, sanitizedParams.get('orden'))) sanitizedParams.delete('orden')

    if (sanitizedParams.toString() !== searchParams.toString()) {
      setSearchParams(sanitizedParams, { replace: true })
      return
    }

    const requestedStatus = searchParams.get('estado')
    const requestedSort = searchParams.get('orden')

    setEstadoFilter(VALID_ESTADO_VALUES.includes(requestedStatus as ConsultaEstadoFilter) ? requestedStatus as ConsultaEstadoFilter : 'todas')
    setSortOption(isOptionValue(SORT_OPTIONS, requestedSort) ? requestedSort : 'recentes')
    setSearchQuery(searchParams.get('buscar') ?? '')
  }, [
    searchParams,
    setEstadoFilter,
    setSearchQuery,
    setSearchParams,
    setSortOption,
  ])

  if (!user) return null

  const showingDetail = Boolean(selectedConsultaId && selectedConsulta)
  const showingDemoIntro = !isLoading && !error && isShowingDemo && !demoStarted
  const hasActiveFilters = searchQuery.trim() !== '' || estadoFilter !== 'todas' || sortOption !== 'recentes'

  const updateQueryParam = (key: string, value: string, defaultValue: string, replace = false) => {
    const next = new URLSearchParams(searchParams)
    if (value === defaultValue || value.trim() === '') next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace })
  }

  const handleEstadoFilter = (filter: ConsultaEstadoFilter) => {
    setEstadoFilter(filter)
    const next = new URLSearchParams(searchParams)
    next.delete('estado')
    next.delete('atencion')
    next.delete('resolucion')
    if (filter !== 'todas') next.set('estado', filter)
    setSearchParams(next)
  }

  const handleBack = () => {
    if (showingDetail) return clearSelection()
    if (isShowingDemo && demoStarted) return setDemoStarted(false)
    navigate('/dashboard')
  }

  const clearFilters = () => {
    setSearchQuery('')
    setEstadoFilter('todas')
    setSortOption('recentes')
    setSearchParams({})
  }

  return (
    <div className="consultas-page">
      <Drawer
        business={business}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="consultas"
        desktopPersistent
        showBusinessAvatar
      />

      <div className="consultas-shell">
        <header className="consultas-mobile-header">
          <button type="button" aria-label="Abrir navegación" onClick={() => setDrawerOpen(true)}>
            <AppIcon name="menu" size={22} />
          </button>
          <strong>Consultas</strong>
          <Avatar name={user.nombre} src={business?.logo} size={38} />
        </header>

        <main className="consultas-main">
          <PageBackButton onClick={handleBack} />

          {!showingDetail && (
            <section className="consultas-heading">
              <span>Conversaciones</span>
              <h1>Consultas</h1>
              <p>Gestioná las conversaciones con tus clientes.</p>
              {!isLoading && !error && consultas.length > 0 && (
                <strong>{consultas.length} {consultas.length === 1 ? 'consulta recibida' : 'consultas recibidas'}</strong>
              )}
            </section>
          )}

          {isLoading ? (
            <section className="consultas-skeleton" aria-label="Cargando consultas" aria-busy="true">
              <div className="consultas-skeleton__toolbar" />
              {[1, 2, 3].map(item => <div className="consultas-skeleton__card" key={item} />)}
            </section>
          ) : error ? (
            <section className="consultas-state consultas-state--error" role="alert">
              <span className="consultas-state__icon"><AppIcon name="alert" size={36} /></span>
              <h2>No pudimos cargar las consultas</h2>
              <p>Revisá tu conexión o intentá nuevamente.</p>
              <button type="button" onClick={() => void reloadConsultas()}>Reintentar</button>
            </section>
          ) : showingDemoIntro ? (
            <section className="consultas-state">
              <span className="consultas-state__icon"><AppIcon name="chat" size={40} /></span>
              <h2>Todavía no recibiste consultas</h2>
              <p>Cuando un cliente inicie una conversación desde tu chatbot, la consulta aparecerá acá automáticamente.</p>
              <button type="button" onClick={() => setDemoStarted(true)}>Ver demostración</button>
              <small>La demostración contiene datos de ejemplo.</small>
            </section>
          ) : showingDetail ? (
            <ConsultaDetail
              consulta={selectedConsulta}
              resolution={selectedConsulta ? resolutionByConsultaId.get(selectedConsulta.id) : undefined}
              onUpdateStatus={updateConsultaStatus}
              onBack={clearSelection}
              isUpdating={updatingConsultaId === selectedConsulta?.id}
              updateError={updateError}
            />
          ) : (
            <>
              <section className="consultas-toolbar" aria-label="Filtros de consultas">
                <label className="consultas-search">
                  <span className="sr-only">Buscar consultas</span>
                  <AppIcon name="search" size={18} />
                  <input
                    value={searchQuery}
                    onChange={event => {
                      setSearchQuery(event.target.value)
                      updateQueryParam('buscar', event.target.value, '', true)
                    }}
                    placeholder="Buscar cliente o mensaje..."
                  />
                </label>
                <label className="consultas-filter">
                  <span>Estado</span>
                  <select value={estadoFilter} onChange={event => handleEstadoFilter(event.target.value as ConsultaEstadoFilter)}>
                    {ESTADO_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="consultas-filter">
                  <span>Orden</span>
                  <select value={sortOption} onChange={event => {
                    const value = event.target.value as ConsultaSortOption
                    setSortOption(value)
                    updateQueryParam('orden', value, 'recentes')
                  }}>
                    {SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </section>

              {isShowingDemo && (
                <aside className="consultas-demo" aria-label="Consultas de ejemplo">
                  <AppIcon name="alert" size={19} />
                  <div><strong>Estas son consultas de ejemplo</strong><p>Podés explorarlas para conocer la sección. Se reemplazarán cuando recibas consultas reales.</p></div>
                </aside>
              )}

              {consultas.length === 0 ? (
                <section className="consultas-state">
                  <span className="consultas-state__icon"><AppIcon name="chat" size={40} /></span>
                  <h2>Todavía no recibiste consultas</h2>
                  <p>Cuando un cliente inicie una conversación desde tu chatbot, aparecerá acá automáticamente.</p>
                </section>
              ) : filteredConsultas.length === 0 ? (
                <section className="consultas-state consultas-state--compact">
                  <span className="consultas-state__icon"><AppIcon name="search" size={34} /></span>
                  <h2>No encontramos consultas con estos filtros</h2>
                  <p>Probá con otra búsqueda o restablecé los filtros.</p>
                  {hasActiveFilters && <button type="button" onClick={clearFilters}>Limpiar filtros</button>}
                </section>
              ) : (
                <section className="consultas-list" aria-label="Listado de consultas">
                  {filteredConsultas.map(consulta => (
                    <ConsultaCard
                      key={consulta.id}
                      consulta={consulta}
                      resolution={resolutionByConsultaId.get(consulta.id)}
                      selected={selectedConsultaId === consulta.id}
                      onSelect={selectConsulta}
                    />
                  ))}
                </section>
              )}
            </>
          )}
        </main>

        <button
          type="button"
          className="consultas-bot"
          disabled={!business?.slug}
          aria-label="Abrir asistente: Probá tu chat"
          onClick={() => business?.slug && openChatPreview(business.slug, navigate)}
        >
          <span className="consultas-bot__label"><i aria-hidden="true" />Probá tu chat</span>
          <span className="consultas-bot__avatar" aria-hidden="true"><img src="/isoBot-transparente.png" alt="" /></span>
        </button>
      </div>
    </div>
  )
}
