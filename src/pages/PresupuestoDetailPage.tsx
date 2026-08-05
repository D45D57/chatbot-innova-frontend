import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Drawer } from '../components/layout/Drawer'
import { PresupuestoStatusBadge } from '../components/presupuestos/PresupuestoStatusBadge'
import { AppIcon } from '../components/ui/AppIcon'
import { Avatar } from '../components/ui/Avatar'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import { ApiError } from '../services/apiClient'
import {
  cotizarPresupuesto,
  getPresupuestoById,
  updatePresupuestoEstado,
} from '../services/presupuestoApi'
import { updateConsultaEstado } from '../services/consultaStorage'
import type {
  PresupuestoDetalle,
  PresupuestoEstado,
  PresupuestoItemInput,
} from '../types/presupuesto'
import { getEffectivePresupuestoTotal, isPresupuestoReadyToSend } from '../utils/presupuestoTotal'
import '../styles/presupuestos.css'

const TRANSITIONS: Record<PresupuestoEstado, PresupuestoEstado[]> = {
  PENDIENTE: ['EN_PROCESO', 'RECHAZADO'],
  EN_PROCESO: ['ENVIADO', 'RECHAZADO'],
  ENVIADO: ['CONCRETADO', 'RECHAZADO'],
  CONCRETADO: [],
  RECHAZADO: [],
}

const ACTION_LABELS: Record<PresupuestoEstado, string> = {
  PENDIENTE: 'Marcar pendiente',
  EN_PROCESO: 'Comenzar gestión',
  ENVIADO: 'Marcar enviado',
  CONCRETADO: 'Marcar concretado',
  RECHAZADO: 'Rechazar',
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(value))

const readableError = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Tu sesión venció. Iniciá sesión nuevamente.'
    if (error.status === 403) return 'No tenés permisos para realizar esta acción.'
    if (error.status === 404) return 'El presupuesto no existe o ya no está disponible.'
    if (error.status === 409 && error.code === 'INVALID_STATE_TRANSITION') {
      return 'El estado cambió y esta acción ya no está permitida. Actualizá la página.'
    }
    if (error.status === 409) return 'No pudimos completar la operación por un conflicto.'
    if (error.status === 400) return 'Revisá los datos ingresados antes de continuar.'
  }
  return 'Ocurrió un error. Intentá nuevamente.'
}

export function PresupuestoDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const budgetId = Number(params.id)
  const { user } = useAuth()
  const { business, loadBusiness } = useBusiness()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [presupuesto, setPresupuesto] = useState<PresupuestoDetalle | null>(null)
  const [quoteItems, setQuoteItems] = useState<PresupuestoItemInput[]>([])
  const [diasValidez, setDiasValidez] = useState(10)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<PresupuestoEstado | null>(null)
  const [showCancelQuoteConfirmation, setShowCancelQuoteConfirmation] = useState(false)

  useEffect(() => {
    if (user) void loadBusiness(user.id)
  }, [loadBusiness, user])

  const loadBudget = useCallback(async () => {
    if (!Number.isInteger(budgetId) || budgetId <= 0) {
      setNotFound(true)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const response = await getPresupuestoById(budgetId)
      setPresupuesto(response.presupuesto)
      const responseItems = response.presupuesto.items ?? []
      setQuoteItems(responseItems.map(item => ({
        ...(item.productoId ? { productoId: item.productoId } : {}),
        nombre: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
      })))
      setDiasValidez(response.presupuesto.diasValidez)
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 404) setNotFound(true)
      else setError(readableError(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [budgetId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadBudget(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadBudget])

  // Si el emprendedor ve el presupuesto y la consulta es nueva/iniciada, transicionarla a en_proceso
  useEffect(() => {
    if (!presupuesto?.consultaId || !user) return
    void updateConsultaEstado(presupuesto.consultaId, 'en_proceso', user.id).catch(() => { /* ignorar */ })
  }, [presupuesto?.consultaId, user])

  if (!user) return null

  const updateItem = (
    index: number,
    field: 'nombre' | 'cantidad' | 'precioUnitario',
    value: string,
  ) => {
    setQuoteItems(items => items.map((item, itemIndex) => (
      itemIndex === index
        ? { ...item, [field]: field === 'nombre' ? value : Number(value) }
        : item
    )))
  }

  const validateQuote = (): string | null => {
    if (quoteItems.length === 0) return 'El presupuesto debe tener al menos un ítem.'
    if (quoteItems.some(item => !item.nombre.trim())) return 'Todos los ítems deben tener un nombre.'
    if (quoteItems.some(item => !Number.isInteger(item.cantidad) || item.cantidad <= 0)) {
      return 'Las cantidades deben ser números enteros mayores que cero.'
    }
    if (quoteItems.some(item => !Number.isFinite(item.precioUnitario) || item.precioUnitario < 0)) {
      return 'Los precios no pueden ser negativos.'
    }
    return null
  }

  const handleStatus = async (estado: PresupuestoEstado) => {
    if (!presupuesto || isSaving) return false
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await updatePresupuestoEstado(presupuesto.id, { estado })
      setPresupuesto(response.presupuesto)
      setSuccess('Estado actualizado correctamente.')
      return true
    } catch (saveError) {
      setError(readableError(saveError))
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleQuote = async () => {
    if (!presupuesto || isSaving) return
    const validationError = validateQuote()
    if (validationError) {
      setError(validationError)
      return
    }
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await cotizarPresupuesto(presupuesto.id, {
        itemsCotizados: quoteItems,
        diasValidez,
      })
      navigate('/presupuestos', {
        replace: true,
        state: {
          successMessage: 'Presupuesto actualizado con éxito. Ya está listo para enviar al cliente.',
        },
      })
    } catch (quoteError) {
      setError(readableError(quoteError))
    } finally {
      setIsSaving(false)
    }
  }

  const canQuote = presupuesto
    ? ['PENDIENTE', 'EN_PROCESO', 'ENVIADO'].includes(presupuesto.estado)
    : false
  const items = presupuesto?.items ?? []
  const canMarkAsSent = presupuesto ? isPresupuestoReadyToSend(presupuesto) : false

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
          <strong>Detalle</strong>
          <Avatar name={user.nombre} src={business?.logo} size={38} />
        </header>

        <main className="budgets-main">
          <button
            type="button"
            className="budget-detail__back"
            onClick={() => navigate('/presupuestos')}
          >
            <span aria-hidden="true">‹</span>
            Volver a presupuestos
          </button>

          {isLoading ? (
            <section className="budgets-loading" aria-label="Cargando presupuesto" aria-busy="true">
              {[1, 2, 3].map(item => <div key={item} />)}
            </section>
          ) : notFound ? (
            <section className="budgets-state budgets-state--error" role="alert">
              <span><AppIcon name="alert" size={38} /></span>
              <h1>Presupuesto no encontrado</h1>
              <p>Puede que haya sido eliminado o que no pertenezca a tu negocio.</p>
              <button type="button" onClick={() => navigate('/presupuestos')}>Volver al listado</button>
            </section>
          ) : error && !presupuesto ? (
            <section className="budgets-state budgets-state--error" role="alert">
              <span><AppIcon name="alert" size={38} /></span>
              <h1>No pudimos cargar el presupuesto</h1>
              <p>{error}</p>
              <button type="button" onClick={() => void loadBudget()}>Reintentar</button>
            </section>
          ) : presupuesto ? (
            <>
              <section className="budget-detail__heading">
                <div>
                  <span>Presupuesto #{presupuesto.id}</span>
                  <h1>{presupuesto.consulta?.cliente?.nombre || 'Cliente sin registrar'}</h1>
                  <p>{presupuesto.consulta?.asunto || 'Solicitud de presupuesto'}</p>
                </div>
                <PresupuestoStatusBadge estado={presupuesto.estado} />
              </section>

              {error && <div className="budget-feedback budget-feedback--error" role="alert">{error}</div>}
              {success && <div className="budget-feedback budget-feedback--success" role="status">{success}</div>}

              <div className="budget-detail__grid">
                <section className="budget-panel budget-panel--items">
                  <h2>Detalle de la cotización</h2>
                  <div className="budget-table-wrap">
                    <table className="budget-table">
                      <thead><tr><th>Ítem</th><th>Cantidad</th><th>Unitario</th><th>Subtotal</th></tr></thead>
                      <tbody>
                        {items.length > 0 ? (
                          items.map((item, index) => (
                            <tr key={`${item.productoId ?? item.nombre}-${index}`}>
                              <td>{item.nombre}</td>
                              <td>{item.cantidad}</td>
                              <td>{formatCurrency(item.precioUnitario)}</td>
                              <td>{formatCurrency(item.subtotal)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4}>Este presupuesto no tiene ítems para mostrar.</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot><tr><td colSpan={3}>Total</td><td>{formatCurrency(getEffectivePresupuestoTotal(presupuesto))}</td></tr></tfoot>
                    </table>
                  </div>
                </section>

                <aside className="budget-panel budget-panel--summary">
                  <h2>Información</h2>
                  <dl>
                    <div><dt>Teléfono</dt><dd>{presupuesto.consulta?.cliente?.telefono || 'No informado'}</dd></div>
                    <div><dt>Consulta</dt><dd>#{presupuesto.consultaId.slice(0, 8)}</dd></div>
                    <div><dt>Fecha de emisión</dt><dd>{formatDate(presupuesto.fechaEmision)}</dd></div>
                    <div><dt>Vencimiento</dt><dd>{formatDate(presupuesto.fechaVencimiento)}</dd></div>
                    <div><dt>Validez</dt><dd>{presupuesto.diasValidez} días</dd></div>
                  </dl>
                  {presupuesto.linkPdf && (
                    <a href={presupuesto.linkPdf} target="_blank" rel="noreferrer" className="budget-pdf-link">
                      Ver PDF generado
                    </a>
                  )}
                </aside>
              </div>

              {(TRANSITIONS[presupuesto.estado].length > 0 || canQuote) && (
                <section className="budget-panel budget-actions">
                  <div>
                    <h2>Acciones</h2>
                    <p>Solo se muestran los cambios permitidos para el estado actual.</p>
                  </div>
                  <div className="budget-actions__buttons">
                    {canQuote && (
                      <button
                        type="button"
                        disabled={isSaving}
                        className={showQuoteForm ? 'is-danger' : ''}
                        onClick={() => {
                          if (showQuoteForm && quoteItems.length > 0) setShowCancelQuoteConfirmation(true)
                          else setShowQuoteForm(value => !value)
                        }}
                      >
                        {showQuoteForm ? 'Cancelar cotización' : presupuesto.linkPdf ? 'Volver a cotizar' : 'Cotizar'}
                      </button>
                    )}
                    {TRANSITIONS[presupuesto.estado].map(estado => (
                      <button
                        type="button"
                        key={estado}
                        disabled={isSaving || (estado === 'ENVIADO' && !canMarkAsSent)}
                        className={estado === 'RECHAZADO' ? 'is-danger' : ''}
                        onClick={() => estado === 'RECHAZADO' ? setPendingStatus(estado) : void handleStatus(estado)}
                      >
                        {ACTION_LABELS[estado]}
                      </button>
                    ))}
                    {TRANSITIONS[presupuesto.estado].includes('ENVIADO') && !canMarkAsSent && (
                      <p className="budget-actions__help">
                        Completá el precio de todos los productos antes de marcar el presupuesto como enviado.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {showQuoteForm && (
                <section className="budget-panel budget-quote-form">
                  <div>
                    <h2>Cotizar presupuesto</h2>
                    <p>El total se actualizará automáticamente con los importes ingresados.</p>
                  </div>
                  {quoteItems.map((item, index) => (
                    <div className="budget-quote-row" key={`${item.productoId ?? 'item'}-${index}`}>
                      <label>
                        <span>Nombre</span>
                        <input value={item.nombre} onChange={event => updateItem(index, 'nombre', event.target.value)} />
                      </label>
                      <label>
                        <span>Cantidad</span>
                        <input type="number" min="1" step="1" value={item.cantidad} onChange={event => updateItem(index, 'cantidad', event.target.value)} />
                      </label>
                      <label>
                        <span>Precio unitario</span>
                        <input type="number" min="0" step="0.01" value={item.precioUnitario} onChange={event => updateItem(index, 'precioUnitario', event.target.value)} />
                      </label>
                    </div>
                  ))}
                  <label className="budget-validity">
                    <span>Días de validez</span>
                    <input type="number" min="1" max="365" value={diasValidez} onChange={event => setDiasValidez(Number(event.target.value))} />
                  </label>
                  <button type="button" className="budget-submit" disabled={isSaving} onClick={() => void handleQuote()}>
                    {isSaving ? 'Generando PDF…' : 'Guardar cotización y generar PDF'}
                  </button>
                </section>
              )}

              <ConfirmationDialog
                open={pendingStatus === 'RECHAZADO'}
                title="¿Rechazar presupuesto?"
                confirmLabel="Rechazar"
                cancelLabel="Cancelar"
                loading={isSaving}
                error={pendingStatus === 'RECHAZADO' ? error ?? '' : ''}
                onOpenChange={open => { if (!open) setPendingStatus(null) }}
                onConfirm={async () => {
                  const nextStatus = pendingStatus
                  if (nextStatus && await handleStatus(nextStatus)) setPendingStatus(null)
                }}
              />
              <ConfirmationDialog
                open={showCancelQuoteConfirmation}
                title="¿Cancelar cotización?"
                confirmLabel="Cancelar"
                cancelLabel="Volver"
                onOpenChange={setShowCancelQuoteConfirmation}
                onConfirm={() => {
                  setShowCancelQuoteConfirmation(false)
                  setShowQuoteForm(false)
                }}
              />
            </>
          ) : null}
        </main>
      </div>
    </div>
  )
}
