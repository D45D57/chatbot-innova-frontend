import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { brand } from '../styles/brand'
import {
  createProductApi,
  getProductByIdApi,
  updateProductApi,
} from '../services/productApi'
import { AppIcon } from '../components/ui/AppIcon'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog'
import { getUserFacingErrorMessage, UserFacingError } from '../services/apiClient'
import '../styles/catalog.css'

interface ProductForm {
  nombre: string
  descripcion: string
  precio: string
  activo: boolean
  precioConsultar: boolean
  imagenActual: string
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const EMPTY_FORM: ProductForm = {
  nombre: '',
  descripcion: '',
  precio: '',
  activo: true,
  precioConsultar: false,
  imagenActual: '',
}

export function ProductFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const isEditing = Boolean(id)
  const initialPriceMode = (location.state as { precioConsultar?: boolean } | null)?.precioConsultar ?? false
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialForm = { ...EMPTY_FORM, precioConsultar: initialPriceMode }
  const [form, setForm] = useState<ProductForm>(initialForm)
  const [initialFormSnapshot, setInitialFormSnapshot] = useState(JSON.stringify(initialForm))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [removeImage, setRemoveImage] = useState(false)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false)

  useEffect(() => {
    if (!imageFile) return
    const objectUrl = URL.createObjectURL(imageFile)
    const updatePreview = window.setTimeout(() => setImagePreview(objectUrl), 0)
    return () => {
      window.clearTimeout(updatePreview)
      URL.revokeObjectURL(objectUrl)
    }
  }, [imageFile])

  useEffect(() => {
    if (!id) return
    let active = true

    const loadProduct = async () => {
      setIsLoading(true)
      setLoadError('')
      try {
        const product = await getProductByIdApi(id)
        if (!product) throw new UserFacingError('El producto no existe o no pertenece a tu catálogo.')
        if (!active) return
        const loadedForm = {
          nombre: product.nombre,
          descripcion: product.descripcion ?? '',
          precio: product.requiereCotizacion ? '' : String(Number(product.precio)),
          activo: product.activo,
          precioConsultar: product.requiereCotizacion,
          imagenActual: product.urlImagen ?? '',
        }
        setInitialFormSnapshot(JSON.stringify(loadedForm))
        setForm(loadedForm)
      } catch (caught) {
        if (active) setLoadError(getUserFacingErrorMessage(caught, { fallback: 'No pudimos cargar el producto. Intentá nuevamente.' }))
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadProduct()
    return () => { active = false }
  }, [id])

  const updateField = (field: 'nombre' | 'descripcion' | 'precio') =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(current => ({ ...current, [field]: event.target.value }))

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFormError('')
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setFormError('La imagen debe ser JPG, PNG o WEBP.')
      event.target.value = ''
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setFormError('La imagen no puede superar los 5 MB.')
      event.target.value = ''
      return
    }
    setImageFile(file)
    setImagePreview('')
    setRemoveImage(false)
  }

  const price = Number(form.precio)
  const hasValidPrice = form.precioConsultar || (form.precio.trim() !== '' && Number.isFinite(price) && price > 0)
  const canSave = form.nombre.trim() !== '' && form.nombre.trim().length <= 200
    && form.descripcion.trim().length <= 2000 && hasValidPrice
    && !isSubmitting && !isLoading

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSave || isSubmitting) return
    setIsSubmitting(true)
    setFormError('')
    try {
      if (isEditing && id) {
        await updateProductApi(id, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          ...(!form.precioConsultar ? { precio: price } : {}),
          activo: form.activo,
          requiereCotizacion: form.precioConsultar,
          ...(removeImage ? { urlImagen: null } : {}),
          ...(imageFile ? { imagen: imageFile } : {}),
        })
        navigate('/catalogo', { state: { successMessage: 'Producto actualizado correctamente.' } })
      } else {
        await createProductApi({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || undefined,
          ...(!form.precioConsultar ? { precio: price } : {}),
          activo: form.activo,
          requiereCotizacion: form.precioConsultar,
          ...(imageFile ? { imagen: imageFile } : {}),
        })
        navigate('/catalogo', { state: { successMessage: 'Producto creado correctamente.' } })
      }
    } catch (caught) {
      setFormError(getUserFacingErrorMessage(caught, { fallback: 'No pudimos guardar el producto. Intentá nuevamente.' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayedImage = imagePreview || (!removeImage ? form.imagenActual : '')
  const hasUnsavedChanges = JSON.stringify(form) !== initialFormSnapshot
    || Boolean(imageFile)
    || removeImage
  const requestExit = () => {
    if (hasUnsavedChanges) setShowDiscardConfirmation(true)
    else navigate('/catalogo')
  }

  if (isLoading) {
    return <div className="product-form-page"><div className="product-form-loading" role="status"><i /><span /><span /><span /></div></div>
  }

  if (loadError) {
    return (
      <div className="product-form-page" role="alert">
        <div className="catalog-state-card product-form-error">
          <span className="catalog-state-card__icon catalog-state-card__icon--error"><AppIcon name="alert" size={34} /></span>
          <h2>No pudimos cargar el producto</h2>
          <p>{loadError}</p>
          <button type="button" onClick={() => navigate('/catalogo')} className="catalog-primary-button">Volver al catálogo</button>
        </div>
      </div>
    )
  }

  return (
    <div className="product-form-page">
      <form onSubmit={handleSave} className="product-form-card">
        <header className="product-form-modal-header">
          <h1>{isEditing ? 'Editar producto' : 'Nuevo producto'}</h1>
          <button type="button" onClick={requestExit} aria-label="Cerrar">
            <AppIcon name="close" size={23} />
          </button>
        </header>

        <section className="product-form-section">
          <div className={`product-price-mode${form.precioConsultar ? ' product-price-mode--quote' : ''}`}>
            <span>
              {form.precioConsultar ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9.1 13a3 3 0 1 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 21h.01" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                  <path d="M7 7h.01" />
                </svg>
              )}
              {form.precioConsultar ? 'Requiere cotización' : 'Precio fijo'}
            </span>
            {!isEditing && (
              <button type="button" onClick={() => setForm(current => ({ ...current, precioConsultar: !current.precioConsultar, precio: '' }))}>Cambiar</button>
            )}
          </div>

          <div className="product-form-field">
            <label>Imagen del producto</label>
            <button type="button" className={`product-image-upload${displayedImage ? ' product-image-upload--filled' : ''}`} onClick={() => fileInputRef.current?.click()}>
              {displayedImage ? <img src={displayedImage} alt="Vista previa del producto" /> : <><AppIcon name="catalog" size={38} /><strong>Hacé clic para subir una imagen</strong><span>JPG, PNG o WEBP · Máx. 5 MB (Opcional)</span></>}
          </button>
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleImageChange} style={{ display: 'none' }} />
            {displayedImage && <div className="product-image-actions"><button type="button" onClick={() => fileInputRef.current?.click()}>Cambiar</button><button type="button" onClick={() => { setImageFile(null); setImagePreview(''); setRemoveImage(true); if (fileInputRef.current) fileInputRef.current.value = '' }}>Quitar</button></div>}
          </div>

          <div className="product-form-field">
            <label htmlFor="product-name">Nombre del producto</label>
            <input id="product-name" value={form.nombre} onChange={updateField('nombre')} maxLength={200} required placeholder="Ej: Corte de cabello" />
          </div>

          <div className="product-form-field">
            <label htmlFor="product-description">Descripción</label>
            <textarea id="product-description" value={form.descripcion} onChange={updateField('descripcion')} maxLength={2000} rows={4} placeholder="Describí tu producto" />
          </div>

          {!form.precioConsultar ? (
            <div className="product-form-field">
              <label htmlFor="product-price">Precio</label>
              <div className="product-input-prefix"><span>$</span><input id="product-price" value={form.precio} onChange={updateField('precio')} type="number" min="0.01" step="0.01" required /></div>
            </div>
          ) : (
            <div className="product-quote-help"><AppIcon name="chat" size={20} /><span>En el chatbot se mostrará como <strong>Precio a convenir</strong>.</span></div>
          )}

          <label className="product-active-toggle">
            <span><strong>Producto activo</strong><small>Los clientes podrán verlo en el catálogo.</small></span>
            <input type="checkbox" checked={form.activo} onChange={event => setForm(current => ({ ...current, activo: event.target.checked }))} />
            <i aria-hidden="true" />
          </label>

          {formError && <div className="catalog-alert catalog-alert--error" role="alert"><AppIcon name="alert" size={18} />{formError}</div>}
        </section>

        <footer className="product-form-actions">
          <button type="button" className="catalog-secondary-button" disabled={isSubmitting} onClick={requestExit}>Cancelar</button>
          <button type="submit" className="catalog-primary-button" disabled={!canSave} style={{ background: canSave ? brand.primaryGradient : undefined }}>{isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar producto'}</button>
        </footer>
      </form>
      <ConfirmationDialog
        open={showDiscardConfirmation}
        title="¿Salir sin guardar los cambios?"
        confirmLabel="Salir"
        cancelLabel="Seguir editando"
        onOpenChange={setShowDiscardConfirmation}
        onConfirm={() => navigate('/catalogo')}
      />
    </div>
  )
}
