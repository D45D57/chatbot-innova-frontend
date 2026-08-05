import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Drawer } from '../components/layout/Drawer'
import { PageBackButton } from '../components/navigation/PageBackButton'
import { PresupuestoStatusBadge } from '../components/presupuestos/PresupuestoStatusBadge'
import { AppIcon } from '../components/ui/AppIcon'
import { Avatar } from '../components/ui/Avatar'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import { ApiError } from '../services/apiClient'
import { getPresupuestos } from '../services/presupuestoApi'
import { getEffectivePresupuestoTotal } from '../utils/presupuestoTotal'
import type {
  PresupuestoEstado,
  PresupuestoResumen,
  PresupuestosPagination,
} from '../types/presupuesto'
import '../styles/presupuestos.css'

const PAGE_SIZE = 10
const GROUP_FETCH_LIMIT = 100

type PresupuestoVisibleFilter =
  | 'todos'
  | 'cotizacion'
  | 'seguimiento'
  | 'concretado'
  | 'rechazado'

const FILTER_OPTIONS: Array<{ value: PresupuestoVisibleFilter; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'cotizacion', label: 'Requiere cotización' },
  { value: 'seguimiento', label: 'En seguimiento' },
  { value: 'concretado', label: 'Concretado' },
  { value: 'rechazado', label: 'Rechazado' },
]

const normalizeVisibleFilter = (value: string | null): PresupuestoVisibleFilter => {
  switch (value?.toLowerCase()) {
    case 'pendiente':
    case 'en_proceso':
    case 'cotizacion':
      return 'cotizacion'
    case 'enviado':
    case 'seguimiento':
      return 'seguimiento'
    case 'concretado':
      return 'concretado'
    case 'rechazado':
      return 'rechazado'
    default:
      return 'todos'
  }
}

const toBackendState = (filter: PresupuestoVisibleFilter): PresupuestoEstado | undefined => {
  if (filter === 'seguimiento') return 'ENVIADO'
  if (filter === 'concretado') return 'CONCRETADO'
  if (filter === 'rechazado') return 'RECHAZADO'
  return undefined
}

const budgetTimestamp = (budget: PresupuestoResumen) =>
  new Date(budget.fechaCreacion ?? budget.fechaEmision).getTime()

const getAllBudgetsByState = async (estado: PresupuestoEstado) => {
  const firstPage = await getPresupuestos({
    page: 1,
    limit: GROUP_FETCH_LIMIT,
    estado,
  })
  const remainingPages = Array.from(
    { length: Math.max(0, firstPage.pagination.totalPages - 1) },
    (_, index) => index + 2,
  )
  const remainingResponses = await Promise.all(
    remainingPages.map(page => getPresupuestos({
      page,
      limit: GROUP_FETCH_LIMIT,
      estado,
    })),
  )

  return {
    presupuestos: [
      ...firstPage.presupuestos,
      ...remainingResponses.flatMap(response => response.presupuestos),
    ],
    total: firstPage.pagination.total,
  }
}

const EMPTY_STATE_MESSAGES: Record<Exclude<PresupuestoVisibleFilter, 'todos'>, string> = {
  cotizacion: 'No hay presupuestos que requieran cotización.',
  seguimiento: 'No hay presupuestos en seguimiento.',
  concretado: 'Todavía no hay presupuestos concretados.',
  rechazado: 'Todavía no hay presupuestos rechazados.',
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date(value))

const errorMessage = (error: unknown) => {
  if (error instanceof ApiError && error.status === 401) return 'Tu sesión venció. Iniciá sesión nuevamente.'
  if (error instanceof ApiError && error.status === 403) return 'No tenés permisos para ver presupuestos.'
  return 'No pudimos cargar los presupuestos. Intentá nuevamente.'
}

export function PresupuestosPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeSuccessMessage = (location.state as { successMessage?: string } | null)?.successMessage
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { business, loadBusiness } = useBusiness()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [presupuestos, setPresupuestos] = useState<PresupuestoResumen[]>([])
  const [pagination, setPagination] = useState<PresupuestosPagination>({
    page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1,
  })
  const estado = normalizeVisibleFilter(searchParams.get('estado'))
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState(routeSuccessMessage ?? '')

  useEffect(() => {
    if (!routeSuccessMessage) return

    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location.pathname, location.search, navigate, routeSuccessMessage])

  useEffect(() => {
    if (!successMessage) return
    const timeoutId = window.setTimeout(() => setSuccessMessage(''), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [successMessage])

  useEffect(() => {
    if (user) void loadBusiness(user.id)
  }, [loadBusiness, user])

  useEffect(() => {
    const rawFilter = searchParams.get('estado')
    const normalizedFilter = normalizeVisibleFilter(rawFilter)
    const canonicalFilter = normalizedFilter === 'todos' ? null : normalizedFilter

    if (rawFilter !== canonicalFilter) {
      const next = new URLSearchParams(searchParams)
      if (canonicalFilter) next.set('estado', canonicalFilter)
      else next.delete('estado')
      setSearchParams(next, { replace: true })
      return
    }

    const timeoutId = window.setTimeout(() => setPage(1), 0)
    return () => window.clearTimeout(timeoutId)
  }, [searchParams, setSearchParams])

  const loadBudgets = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (estado === 'cotizacion') {
        const [pendingResponse, inProgressResponse] = await Promise.all([
          getAllBudgetsByState('PENDIENTE'),
          getAllBudgetsByState('EN_PROCESO'),
        ])
        const combined = [
          ...pendingResponse.presupuestos,
          ...inProgressResponse.presupuestos,
        ].sort((left, right) => budgetTimestamp(right) - budgetTimestamp(left))
        const total = pendingResponse.total + inProgressResponse.total
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
        const start = (page - 1) * PAGE_SIZE

        setPresupuestos(combined.slice(start, start + PAGE_SIZE))
        setPagination({ page, limit: PAGE_SIZE, total, totalPages })
        return
      }

      const backendState = toBackendState(estado)
      const response = await getPresupuestos({
        page,
        limit: PAGE_SIZE,
        ...(backendState ? { estado: backendState } : {}),
      })
      setPresupuestos(response.presupuestos)
      setPagination({
        page: response.pagination.page ?? 1,
        limit: response.pagination.limit ?? PAGE_SIZE,
        total: response.pagination.total ?? 0,
        totalPages: response.pagination.totalPages ?? 1,
      })
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [estado, page])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadBudgets(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadBudgets])

  if (!user) return null

  return (
    <div className="budgets-page">
      <Drawer
        business={business}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="presupuestos"
        desktopPersistent
        showBusinessAvatar
      />

      <div className="budgets-shell">
        <header className="budgets-mobile-header">
          <button type="button" aria-label="Abrir navegación" onClick={() => setDrawerOpen(true)}>
            <AppIcon name="menu" size={22} />
          </button>
          <strong>Presupuestos</strong>
          <Avatar name={user.nombre} src={business?.logo} size={38} />
        </header>

        <main className="budgets-main">
          <PageBackButton onClick={() => navigate('/dashboard')} />

          <section className="budgets-heading">
            <div>
              <span>Propuestas comerciales</span>
              <h1>Presupuestos</h1>
              <p>Gestioná las cotizaciones solicitadas por tus clientes.</p>
            </div>
            <label className="budgets-filter">
              <span>Estado</span>
              <select
                value={estado}
                onChange={(event) => {
                  const nextFilter = event.target.value as PresupuestoVisibleFilter
                  setPage(1)
                  const next = new URLSearchParams(searchParams)
                  if (nextFilter === 'todos') next.delete('estado')
                  else next.set('estado', nextFilter)
                  setSearchParams(next)
                }}
              >
                {FILTER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </section>

          {successMessage && (
            <div className="budget-feedback budget-feedback--success" role="status" aria-live="polite">
              <AppIcon name="check" size={18} />
              {successMessage}
            </div>
          )}

          {isLoading ? (
            <section className="budgets-loading" aria-label="Cargando presupuestos" aria-busy="true">
              {[1, 2, 3].map(item => <div key={item} />)}
            </section>
          ) : error ? (
            <section className="budgets-state budgets-state--error" role="alert">
              <span><AppIcon name="alert" size={38} /></span>
              <h2>No pudimos cargar los presupuestos</h2>
              <p>{error}</p>
              <button type="button" onClick={() => void loadBudgets()}>Reintentar</button>
            </section>
          ) : presupuestos.length === 0 ? (
            <section className="budgets-state">
              <span><AppIcon name="budget" size={42} /></span>
              <h2>
                {estado === 'todos'
                  ? 'Todavía no tenés presupuestos'
                  : EMPTY_STATE_MESSAGES[estado]}
              </h2>
              <p>
                {estado !== 'todos'
                  ? 'Probá seleccionando otro estado para ampliar los resultados.'
                  : 'Cuando un cliente solicite una cotización desde tu chatbot, aparecerá acá.'}
              </p>
            </section>
          ) : (
            <>
              <section className="budgets-list" aria-label="Listado de presupuestos">
                {presupuestos.map(presupuesto => (
                  <article className="budget-card" key={presupuesto.id}>
                    <div className="budget-card__top">
                      <div>
                        <span>Presupuesto #{presupuesto.id}</span>
                        <h2>{presupuesto.consulta?.cliente?.nombre || 'Cliente sin registrar'}</h2>
                      </div>
                      <PresupuestoStatusBadge estado={presupuesto.estado} />
                    </div>
                    <dl className="budget-card__data">
                      <div><dt>Consulta</dt><dd>{presupuesto.consulta?.asunto || `#${presupuesto.consultaId.slice(0, 8)}`}</dd></div>
                      <div><dt>Emisión</dt><dd>{formatDate(presupuesto.fechaEmision)}</dd></div>
                      <div><dt>Vencimiento</dt><dd>{formatDate(presupuesto.fechaVencimiento)}</dd></div>
                      <div><dt>Total</dt><dd>{formatCurrency(getEffectivePresupuestoTotal(presupuesto))}</dd></div>
                    </dl>
                    <div className="budget-card__footer">
                      <span className={presupuesto.linkPdf ? 'is-ready' : ''}>
                        {presupuesto.linkPdf ? 'PDF disponible' : 'PDF pendiente'}
                      </span>
                      <button type="button" onClick={() => navigate(`/presupuestos/${presupuesto.id}`)}>
                        Ver detalle
                      </button>
                    </div>
                  </article>
                ))}
              </section>

              {pagination.totalPages > 1 && (
                <nav className="budgets-pagination" aria-label="Paginación de presupuestos">
                  <button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>
                    Anterior
                  </button>
                  <span>Página {pagination.page} de {pagination.totalPages}</span>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(value => value + 1)}
                  >
                    Siguiente
                  </button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
