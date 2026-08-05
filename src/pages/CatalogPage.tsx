import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import { Drawer } from '../components/layout/Drawer'
import { Avatar } from '../components/ui/Avatar'
import { AppIcon } from '../components/ui/AppIcon'
import { PageBackButton } from '../components/navigation/PageBackButton'
import type { ProductApi } from '../types'
import { deleteProductApi, getProductsApi } from '../services/productApi'
import { openChatPreview } from '../utils/chatRoutes'
import { filterCatalogProducts, normalizeSearchText } from '../utils/catalogSearch'
import '../styles/catalog.css'

const PAGE_SIZE = 10
const SEARCH_FETCH_LIMIT = 100

export function CatalogPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { business, loadBusiness } = useBusiness()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [products, setProducts] = useState<ProductApi[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ProductApi | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage
  const [visibleSuccessMessage, setVisibleSuccessMessage] = useState(successMessage ?? '')

  useEffect(() => {
    if (user) void loadBusiness(user.id)
  }, [user, loadBusiness])

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      if (normalizeSearchText(search)) {
        const firstPage = await getProductsApi({
          page: 1,
          limit: SEARCH_FETCH_LIMIT,
          activo: activeFilter === 'all' ? undefined : activeFilter === 'active',
        })
        const remainingPages = await Promise.all(
          Array.from(
            { length: Math.max(0, firstPage.totalPaginas - 1) },
            (_, index) => getProductsApi({
              page: index + 2,
              limit: SEARCH_FETCH_LIMIT,
              activo: activeFilter === 'all' ? undefined : activeFilter === 'active',
            }),
          ),
        )
        const matches = filterCatalogProducts(
          [firstPage, ...remainingPages].flatMap(result => result.productos),
          search,
        )
        const start = (page - 1) * PAGE_SIZE

        setProducts(matches.slice(start, start + PAGE_SIZE))
        setTotalPages(Math.max(Math.ceil(matches.length / PAGE_SIZE), 1))
        return
      }

      const result = await getProductsApi({
        page,
        limit: PAGE_SIZE,
        activo: activeFilter === 'all' ? undefined : activeFilter === 'active',
      })
      setProducts(result.productos)
      setTotalPages(Math.max(result.totalPaginas, 1))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos cargar el catálogo.')
    } finally {
      setIsLoading(false)
    }
  }, [page, search, activeFilter])

  useEffect(() => {
    const request = window.setTimeout(() => void loadProducts(), 0)
    return () => window.clearTimeout(request)
  }, [loadProducts, location.key])

  useEffect(() => {
    if (!successMessage) return
    const showMessage = window.setTimeout(() => setVisibleSuccessMessage(successMessage), 0)
    const hideMessage = window.setTimeout(() => setVisibleSuccessMessage(''), 4000)
    return () => {
      window.clearTimeout(showMessage)
      window.clearTimeout(hideMessage)
    }
  }, [successMessage, location.key])

  const handlePricingChoice = (precioConsultar: boolean) => {
    setShowPricingModal(false)
    navigate('/catalogo/agregar', { state: { precioConsultar, backgroundLocation: location } })
  }

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await deleteProductApi(deleteTarget.id)
      setDeleteTarget(null)
      await loadProducts()
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : 'No pudimos eliminar el producto.')
    } finally {
      setIsDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setActiveFilter('all')
    setPage(1)
  }
  const hasFilters = search.trim() !== '' || activeFilter !== 'all'

  return (
    <div className="catalog-page">
      <Drawer
        business={business}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="catalogo"
        desktopPersistent
        showBusinessAvatar
      />

      <div className="catalog-shell">
        <header className="catalog-mobile-header">
          <button type="button" aria-label="Abrir navegación" onClick={() => setDrawerOpen(true)}>
            <AppIcon name="menu" size={22} />
          </button>
          <strong>Catálogo</strong>
          <Avatar name={user?.nombre ?? ''} src={business?.logo} size={38} />
        </header>

        <main className="catalog-main">
          <PageBackButton onClick={() => navigate('/dashboard')} />
          <section className="catalog-heading">
            <div>
              <span className="catalog-eyebrow">Productos</span>
              <h1>Catálogo</h1>
              <p>Gestioná los productos y servicios que ofrece tu negocio.</p>
            </div>
            {(products.length > 0 || hasFilters) && (
              <button type="button" className="catalog-primary-button" onClick={() => setShowPricingModal(true)}>
                <AppIcon name="plus" size={19} />
                Nuevo producto
              </button>
            )}
          </section>

          {visibleSuccessMessage && <div className="catalog-alert catalog-alert--success" role="status"><AppIcon name="check" size={18} />{visibleSuccessMessage}</div>}

          {(products.length > 0 || hasFilters) && (
            <section className="catalog-toolbar" aria-label="Herramientas del catálogo">
              <label className="catalog-search">
                <span className="sr-only">Buscar productos</span>
                <AppIcon name="catalog" size={18} />
                <input
                  value={search}
                  onChange={event => { setSearch(event.target.value); setPage(1) }}
                  placeholder="Buscar productos..."
                />
              </label>
              <label className="catalog-filter">
                <span>Visibilidad</span>
                <select value={activeFilter} onChange={event => { setActiveFilter(event.target.value as typeof activeFilter); setPage(1) }}>
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </label>
            </section>
          )}

          {isLoading ? (
            <section className="catalog-grid" aria-label="Cargando productos" aria-busy="true">
              {Array.from({ length: 6 }, (_, index) => <div className="catalog-skeleton" key={index}><i /><span /><span /><b /></div>)}
            </section>
          ) : error ? (
            <section className="catalog-state-card" role="alert">
              <span className="catalog-state-card__icon catalog-state-card__icon--error"><AppIcon name="alert" size={34} /></span>
              <h2>No pudimos cargar tu catálogo</h2>
              <p>{error}</p>
              <button type="button" className="catalog-primary-button" onClick={() => void loadProducts()}>Reintentar</button>
            </section>
          ) : products.length === 0 ? (
            <section className="catalog-state-card">
              <span className="catalog-state-card__icon"><AppIcon name="catalog" size={42} /></span>
              <h2>{hasFilters ? 'No encontramos productos' : 'Todavía no tenés productos cargados'}</h2>
              <p>{hasFilters ? 'Probá con otra búsqueda o limpiá los filtros.' : 'Agregá tu primer producto para comenzar a recibir consultas.'}</p>
              {hasFilters ? (
                <button type="button" className="catalog-secondary-button" onClick={clearFilters}>Limpiar filtros</button>
              ) : (
                <button type="button" className="catalog-primary-button" onClick={() => setShowPricingModal(true)}><AppIcon name="plus" size={19} />Agregar producto</button>
              )}
            </section>
          ) : (
            <>
              <section className="catalog-grid" aria-label="Productos">
                {products.map(product => (
                  <article className="product-card" key={product.id}>
                    <div className="product-card__media">
                      {product.urlImagen
                        ? <img src={product.urlImagen} alt={product.nombre} />
                        : <AppIcon name="catalog" size={48} />
                      }
                      <span className={`product-card__status${product.activo ? '' : ' product-card__status--inactive'}`}>
                        {product.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="product-card__body">
                      <div className="product-card__title-row">
                        <h2>{product.nombre}</h2>
                      </div>
                      <p className="product-card__description">{product.descripcion || 'Sin descripción'}</p>
                      <div className="product-card__footer">
                        <strong className={product.requiereCotizacion ? 'product-card__quote' : ''}>
                          {product.requiereCotizacion ? 'Precio a convenir' : `$ ${Number(product.precio).toLocaleString('es-AR')}`}
                        </strong>
                        <div className="product-card__actions">
                          <button type="button" onClick={() => navigate(`/catalogo/editar/${product.id}`, { state: { backgroundLocation: location } })} aria-label={`Editar ${product.nombre}`} title="Editar">
                            <AppIcon name="edit" size={19} />
                          </button>
                          <button type="button" className="product-card__delete" onClick={() => { setDeleteTarget(product); setDeleteError('') }} aria-label={`Eliminar ${product.nombre}`} title="Eliminar">
                            <AppIcon name="trash" size={19} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </section>

              {totalPages > 1 && (
                <nav className="catalog-pagination" aria-label="Paginación del catálogo">
                  <button type="button" disabled={page === 1} onClick={() => setPage(current => current - 1)}>Anterior</button>
                  <span>Página {page} de {totalPages}</span>
                  <button type="button" disabled={page === totalPages} onClick={() => setPage(current => current + 1)}>Siguiente</button>
                </nav>
              )}
            </>
          )}
        </main>

        <button
          type="button"
          className="catalog-bot"
          disabled={!business?.slug}
          aria-label="Abrir asistente: Probá tu chat"
          onClick={() => business?.slug && openChatPreview(business.slug, navigate)}
        >
          <span className="catalog-bot__label"><i aria-hidden="true" />Probá tu chat</span>
          <span className="catalog-bot__avatar" aria-hidden="true"><img src="/isoBot-transparente.png" alt="" /></span>
        </button>
      </div>

      {showPricingModal && (
        <div className="catalog-modal-backdrop" onMouseDown={() => setShowPricingModal(false)}>
          <section className="catalog-modal catalog-pricing-modal" role="dialog" aria-modal="true" aria-labelledby="pricing-title" onMouseDown={event => event.stopPropagation()}>
            <div className="catalog-modal__header">
              <div><span className="catalog-eyebrow">Nuevo producto</span><h2 id="pricing-title">Elegí el tipo de precio</h2></div>
              <button type="button" onClick={() => setShowPricingModal(false)} aria-label="Cerrar"><AppIcon name="close" size={21} /></button>
            </div>
            <p>Esta elección determina cómo se mostrará el producto en el catálogo.</p>
            <div className="catalog-pricing-grid">
              <button type="button" onClick={() => handlePricingChoice(false)}>
                <span>
                  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                    <path d="M7 7h.01" />
                  </svg>
                </span>
                <strong>Precio fijo</strong><small>El cliente ve el precio directamente</small>
              </button>
              <button type="button" onClick={() => handlePricingChoice(true)}>
                <span>
                  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M9.1 13a3 3 0 1 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 21h.01" />
                  </svg>
                </span>
                <strong>Requiere cotización</strong><small>Se muestra como “Precio a convenir”</small>
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="catalog-modal-backdrop">
          <section className="catalog-modal catalog-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <span className="catalog-delete-modal__icon"><AppIcon name="trash" size={28} /></span>
            <h2 id="delete-title">Eliminar producto</h2>
            <p>¿Seguro que querés eliminar <strong>{deleteTarget.nombre}</strong>? Esta acción no se puede deshacer.</p>
            {deleteError && <div className="catalog-alert catalog-alert--error" role="alert">{deleteError}</div>}
            <div className="catalog-modal__actions">
              <button type="button" className="catalog-secondary-button" disabled={isDeleting} onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button type="button" className="catalog-danger-button" disabled={isDeleting} onClick={() => void handleDelete()}>{isDeleting ? 'Eliminando…' : 'Eliminar'}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
