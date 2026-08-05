import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Drawer } from '../components/layout/Drawer'
import { FaqCard } from '../components/faq/FaqCard'
import { FaqForm } from '../components/faq/FaqForm'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { AppIcon } from '../components/ui/AppIcon'
import { PageBackButton } from '../components/navigation/PageBackButton'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import { useFaqs, type FAQSortOption } from '../hooks/useFaqs'
import type { FAQ, FAQFormData, FAQSuggestion } from '../types'
import { DUPLICATE_FAQ_MESSAGE, normalizeFaqQuestion } from '../utils/normalizeFaqQuestion'
import { openChatPreview } from '../utils/chatRoutes'
import { getFaqSuggestionsApi } from '../services/faqApi'
import '../styles/faq.css'

export function FaqPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { business, isBusinessLoading, loadBusiness } = useBusiness()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<FAQSuggestion[] | null>(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState('')
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortOption, setSortOption] = useState<FAQSortOption>('created-desc')
  const [formLoading, setFormLoading] = useState(false)
  const [busyFaqId, setBusyFaqId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [hasUnsavedFaqChanges, setHasUnsavedFaqChanges] = useState(false)
  const [pendingDiscardAction, setPendingDiscardAction] = useState<(() => void) | null>(null)
  const {
    faqs,
    allFaqs,
    categories,
    isLoading: isFaqLoading,
    error: faqLoadError,
    createFaq,
    createFromSuggestions,
    updateFaq,
    deleteFaq,
    reload,
  } = useFaqs({ category: categoryFilter, sort: sortOption })

  useEffect(() => {
    if (user) void loadBusiness(user.id)
  }, [loadBusiness, user])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedFaqChanges) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedFaqChanges])

  const availableSuggestions = useMemo(() => {
    const existingQuestions = new Set(allFaqs.map(faq => normalizeFaqQuestion(faq.pregunta)))
    return (suggestions ?? []).filter(
      suggestion => !existingQuestions.has(normalizeFaqQuestion(suggestion.pregunta)),
    )
  }, [allFaqs, suggestions])

  const hasFilters = categoryFilter !== 'all' || sortOption !== 'created-desc'
  const isLoading = isBusinessLoading || isFaqLoading

  const runWithUnsavedCheck = (action: () => void) => {
    if (!hasUnsavedFaqChanges) {
      action()
      return
    }
    setPendingDiscardAction(() => action)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingFaq(null)
    setHasUnsavedFaqChanges(false)
    setError('')
  }

  const requestCloseForm = () => runWithUnsavedCheck(closeForm)

  const openCreateForm = () => {
    setShowSuggestions(false)
    setEditingFaq(null)
    setHasUnsavedFaqChanges(false)
    setError('')
    setShowForm(true)
  }

  const openSuggestions = async () => {
    if (suggestionsLoading) return
    setSelectedSuggestionIds([])
    setError('')
    setSuggestionsError('')
    setShowSuggestions(true)
    setSuggestionsLoading(true)
    try {
      setSuggestions(await getFaqSuggestionsApi())
    } catch (caught) {
      setSuggestions(null)
      setSuggestionsError(caught instanceof Error ? caught.message : 'No pudimos cargar las preguntas sugeridas.')
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const handleAddSuggestions = async () => {
    if (formLoading || selectedSuggestionIds.length === 0) return
    setFormLoading(true)
    setError('')
    try {
      await createFromSuggestions(selectedSuggestionIds)
      setSelectedSuggestionIds([])
      setShowSuggestions(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos agregar las preguntas seleccionadas.')
    } finally {
      setFormLoading(false)
    }
  }

  const openEditForm = (faq: FAQ) => {
    setEditingFaq(faq)
    setHasUnsavedFaqChanges(false)
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (data: FAQFormData) => {
    if (formLoading) return
    const normalizedQuestion = normalizeFaqQuestion(data.pregunta)
    const duplicate = allFaqs.some(faq => faq.id !== editingFaq?.id && normalizeFaqQuestion(faq.pregunta) === normalizedQuestion)
    if (duplicate) {
      setError(DUPLICATE_FAQ_MESSAGE)
      return
    }

    setFormLoading(true)
    setError('')
    try {
      if (editingFaq) await updateFaq(editingFaq.id, data)
      else await createFaq(data)
      closeForm()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos guardar la pregunta frecuente.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || busyFaqId) return
    setBusyFaqId(deleteTarget.id)
    setError('')
    try {
      await deleteFaq(deleteTarget.id)
      setDeleteTarget(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos eliminar la pregunta frecuente.')
    } finally {
      setBusyFaqId(null)
    }
  }

  const clearFilters = () => {
    setCategoryFilter('all')
    setSortOption('created-desc')
  }

  useEffect(() => {
    if (!showForm && !showSuggestions && !deleteTarget && !pendingDiscardAction) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (pendingDiscardAction) setPendingDiscardAction(null)
      else if (deleteTarget && !busyFaqId) setDeleteTarget(null)
      else if (showForm && !formLoading) requestCloseForm()
      else if (showSuggestions && !formLoading) setShowSuggestions(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  if (!user) return null

  return (
    <div className="faq-page">
      <Drawer
        business={business}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="faq"
        desktopPersistent
        showBusinessAvatar
      />

      <div className="faq-shell">
        <header className="faq-mobile-header">
          <button type="button" aria-label="Abrir navegación" onClick={() => setDrawerOpen(true)}>
            <AppIcon name="menu" size={22} />
          </button>
          <strong>Preguntas frecuentes</strong>
          <Avatar name={user.nombre} src={business?.logo} size={38} />
        </header>

        <main className="faq-main">
          <PageBackButton onClick={() => navigate('/dashboard')} />
          <section className="faq-heading">
            <div>
              <span className="faq-eyebrow">RESPUESTAS</span>
              <h1>Preguntas frecuentes</h1>
              <p>Gestioná las respuestas automáticas para las consultas más habituales de tus clientes.</p>
              {!isLoading && allFaqs.length > 0 && (
                <small>{allFaqs.length} pregunta{allFaqs.length === 1 ? '' : 's'} configurada{allFaqs.length === 1 ? '' : 's'}</small>
              )}
            </div>
            {!isLoading && !faqLoadError && allFaqs.length > 0 && (
              <Button type="button" onClick={openCreateForm}>
                <AppIcon name="plus" size={18} />
                Nueva pregunta
              </Button>
            )}
          </section>

          {!isLoading && allFaqs.length > 0 && (
            <section className="faq-toolbar" aria-label="Filtrar preguntas frecuentes">
              <label className="faq-filter">
                <span>Categoría</span>
                <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>
                  <option value="all">Todas</option>
                  {categories.map(category => <option key={category.id} value={category.id}>{category.nombre}</option>)}
                </select>
              </label>
              <label className="faq-filter">
                <span>Orden</span>
                <select value={sortOption} onChange={event => setSortOption(event.target.value as FAQSortOption)}>
                  <option value="created-desc">Más recientes</option>
                  <option value="created-asc">Más antiguas</option>
                  <option value="alpha-asc">A–Z</option>
                  <option value="alpha-desc">Z–A</option>
                </select>
              </label>
            </section>
          )}

          {error && !showForm && (
            <div className="faq-alert" role="alert"><AppIcon name="alert" size={18} /><span>{error}</span></div>
          )}

          {isLoading ? (
            <section className="faq-list" aria-label="Cargando preguntas frecuentes" aria-busy="true">
              {[0, 1, 2].map(item => <div className="faq-skeleton" key={item}><i /><span /><small /></div>)}
            </section>
          ) : faqLoadError ? (
            <section className="faq-state-card faq-state-card--error" role="alert">
              <span className="faq-state-card__icon"><AppIcon name="alert" size={38} /></span>
              <h2>No pudimos cargar tus preguntas</h2>
              <p>{faqLoadError}</p>
              <Button type="button" onClick={() => void reload()}>Reintentar</Button>
            </section>
          ) : allFaqs.length === 0 ? (
            <section className="faq-state-card">
              <span className="faq-state-card__icon"><AppIcon name="faq" size={42} /></span>
              <h2>Todavía no tenés preguntas frecuentes cargadas</h2>
              <p>Agregá tu primera pregunta para comenzar a responder consultas automáticamente.</p>
              <Button type="button" onClick={() => void openSuggestions()}><AppIcon name="plus" size={18} />Comenzar</Button>
            </section>
          ) : faqs.length === 0 ? (
            <section className="faq-state-card faq-state-card--compact">
              <span className="faq-state-card__icon"><AppIcon name="faq" size={38} /></span>
              <h2>No hay preguntas en esta categoría</h2>
              <p>Elegí otra categoría o restablecé los filtros.</p>
              <Button type="button" variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
            </section>
          ) : (
            <section className="faq-list" aria-live="polite">
              {faqs.map(faq => (
                <FaqCard
                  key={faq.id}
                  faq={faq}
                  busy={busyFaqId === faq.id}
                  onEdit={openEditForm}
                  onDelete={setDeleteTarget}
                />
              ))}
              <button type="button" className="faq-suggestions-entry" onClick={() => void openSuggestions()}>
                <AppIcon name="plus" size={17} />
                Agregar preguntas sugeridas
              </button>
              {hasFilters && <button type="button" className="faq-clear-filters" onClick={clearFilters}>Limpiar filtros</button>}
            </section>
          )}
        </main>
      </div>

      <button className="faq-bot" type="button" disabled={!business?.slug} onClick={() => business?.slug && openChatPreview(business.slug, navigate)}>
        <span className="faq-bot__label"><i aria-hidden="true" />Probá tu chat</span>
        <span className="faq-bot__avatar" aria-hidden="true"><img src="/isoBot-transparente.png" alt="" /></span>
      </button>

      {showForm && (
        <div className="faq-modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget && !formLoading) requestCloseForm()
        }}>
          <section className="faq-modal" role="dialog" aria-modal="true" aria-labelledby="faq-form-title">
            <header className="faq-modal__header">
              <div>
                <h2 id="faq-form-title">{editingFaq ? 'Editar pregunta' : 'Nueva pregunta'}</h2>
                <p>{editingFaq ? 'Actualizá la información que verá tu chatbot.' : 'Agregá una respuesta útil para tus clientes.'}</p>
              </div>
              <button type="button" onClick={requestCloseForm} disabled={formLoading} aria-label="Cerrar formulario"><AppIcon name="close" size={22} /></button>
            </header>
            <FaqForm
              key={editingFaq?.id ?? 'new-faq'}
              faq={editingFaq ?? undefined}
              categories={categories}
              loading={formLoading}
              submitError={error}
              onSubmit={handleSubmit}
              onCancel={requestCloseForm}
              onDirtyChange={setHasUnsavedFaqChanges}
            />
          </section>
        </div>
      )}

      {showSuggestions && (
        <div className="faq-modal-backdrop faq-suggestions-page">
          <section className="faq-suggestions-modal" aria-labelledby="faq-suggestions-title">
            <header className="faq-suggestions__header">
              <button type="button" disabled={formLoading} onClick={() => setShowSuggestions(false)} aria-label="Volver">
                <span aria-hidden="true">←</span>
              </button>
              <div>
                <h2 id="faq-suggestions-title">Elegí preguntas para comenzar</h2>
                <p>Seleccioná las que suelen hacer tus clientes. Después vas a poder editarlas.</p>
              </div>
            </header>
            <div className="faq-suggestions">
              {suggestionsLoading ? (
                <div className="faq-skeleton" aria-label="Cargando preguntas sugeridas" aria-busy="true"><i /><span /><small /></div>
              ) : suggestionsError ? (
                <div className="faq-form__submit-error" role="alert">
                  {suggestionsError}
                  <Button type="button" variant="outline" onClick={() => void openSuggestions()}>Reintentar</Button>
                </div>
              ) : availableSuggestions.length === 0 ? (
                <div className="faq-state-card faq-state-card--compact">
                  <h2>No hay sugerencias disponibles</h2>
                  <p>Ya agregaste todas las preguntas sugeridas del catálogo.</p>
                </div>
              ) : availableSuggestions.map(suggestion => {
                const selected = selectedSuggestionIds.includes(suggestion.id)
                return (
                  <button
                    key={suggestion.id}
                    type="button"
                    aria-pressed={selected}
                    className={selected ? 'is-selected' : ''}
                    disabled={formLoading}
                    onClick={() => setSelectedSuggestionIds(current =>
                      current.includes(suggestion.id)
                        ? current.filter(id => id !== suggestion.id)
                        : [...current, suggestion.id],
                    )}
                  >
                    <span className="faq-suggestions__check">{selected && <AppIcon name="check" size={14} strokeWidth={3} />}</span>
                    <span><strong>{suggestion.pregunta}</strong></span>
                  </button>
                )
              })}
              {error && <div className="faq-form__submit-error" role="alert">{error}</div>}
              <div className="faq-suggestions__actions">
                <Button
                  type="button"
                  loading={formLoading}
                  disabled={suggestionsLoading || selectedSuggestionIds.length === 0}
                  onClick={() => void handleAddSuggestions()}
                >
                  Agregar seleccionadas{selectedSuggestionIds.length > 0 ? ` (${selectedSuggestionIds.length})` : ''}
                </Button>
                <button type="button" className="faq-suggestions__custom" disabled={formLoading} onClick={openCreateForm}>
                  <AppIcon name="plus" size={16} />
                  Crear una propia
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="faq-modal-backdrop">
          <section className="faq-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-faq-title">
            <span className="faq-delete-modal__icon"><AppIcon name="trash" size={30} /></span>
            <h2 id="delete-faq-title">Eliminar pregunta</h2>
            <p>¿Querés eliminar “{deleteTarget.pregunta}”? Dejará de estar disponible para el chatbot.</p>
            {error && <div className="faq-form__submit-error" role="alert">{error}</div>}
            <div>
              <Button type="button" variant="outline" disabled={Boolean(busyFaqId)} onClick={() => { setDeleteTarget(null); setError('') }}>Cancelar</Button>
              <Button type="button" loading={Boolean(busyFaqId)} onClick={() => void handleDelete()}>Eliminar</Button>
            </div>
          </section>
        </div>
      )}

      {pendingDiscardAction && (
        <div className="faq-modal-backdrop">
          <section className="faq-delete-modal" role="dialog" aria-modal="true" aria-labelledby="discard-faq-title">
            <span className="faq-delete-modal__icon faq-delete-modal__icon--warning"><AppIcon name="alert" size={30} /></span>
            <h2 id="discard-faq-title">Cambios sin guardar</h2>
            <p>Si cerrás ahora, se perderán los cambios de esta pregunta.</p>
            <div>
              <Button type="button" variant="outline" onClick={() => setPendingDiscardAction(null)}>Seguir editando</Button>
              <Button type="button" onClick={() => {
                const action = pendingDiscardAction
                setPendingDiscardAction(null)
                setHasUnsavedFaqChanges(false)
                action()
              }}>Descartar cambios</Button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
